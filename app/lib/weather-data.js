const fs = require('fs-extra')
const cron = require('node-cron')
const path = require('path')

const dataPattern = /^([A-Z]{4,5})0?HU(\d{3})TE((?:[+|-])\d{3})/
const data = []
const historyData = []
let devices = ['INKE', 'ODIN', 'PURL']
const historyMap = {}
const historyFileDest = path.resolve(process.cwd(), 'data/weatherdata.json')

function importDatabaseFile(filepath) {
    if (fs.existsSync(filepath)) {
        const content = fs.readFileSync(filepath, 'utf8')
        const jsonContent = JSON.parse(content)

        jsonContent.forEach(item => historyData.push(item))

        try {
            const parsed = parseHistory(jsonContent)

            parsed.map(addItem)

            console.log(`${new Date().toLocaleString()} -> Get history from file: ${getItems().length} items found`)

            return data
        } catch (err) {
            console.error(`${new Date().toLocaleDateString()} -> History file is empty (${err})`)

            return []
        }
    } else {
        console.log(`${new Date().toLocaleString()} -> No history found`)

        return []
    }
}

/**
 * Add item for every datetime
 *
 * @param item
 * @returns {{date: string, data: Array}}
 */
function processRawItem(item) {
    const result = {
        date: item.date,
        data: []
    }

    historyMap[item.deviceId] = item

    devices.forEach(deviceId => {
        if (item.deviceId === deviceId) {
            result.data.push(item)
        } else if (historyMap[deviceId]) {
            result.data.push(historyMap[deviceId])
        } else {
            result.data.push(null)
        }
    })

    return result
}

function addRawItem(data) {
    const dataMatch = data.match(dataPattern)

    if (!dataMatch) {
        return null
    }

    const date = new Date()
    const deviceId = dataMatch[1]
    const humidity = dataMatch[2].replace('0', '')
    const temperature = dataMatch[3].replace('0', '')
    const rawItem = {
        date: date.toUTCString(),
        deviceId,
        hu: humidity,
        te: temperature
    }
    const item = processRawItem(rawItem)

    addHistoryItem(rawItem)
    
    return addItem(item)
}

function addItem(item) {
    data.push(item)

    return item
}

function addHistoryItem(item) {
    historyData.push(item)
}

function getLatestItem() {
    return data.slice(-1)
}

function parseHistory(rawData) {
    // get unique set of device ids
    devices = [...new Set(rawData.map(item => item.deviceId).concat(devices))]
        .filter(item => item !== undefined)
        .sort()

    return rawData.map(processRawItem)
}

function getItems() {
    return data
}

function getHistoryItems() {
    return historyData
}

cron.schedule('*/10 * * * *', () => {
    const dirname = path.dirname(historyFileDest)
    const backupDest = historyFileDest.replace('.json', `.backup.json`)

    // Create destination directory if not exists
    try {
        fs.accessSync(dirname, fs.R_OK | fs.W_OK);
    } catch (err) {
        fs.ensureDir(dirname);
    }

    // backup existing file
    if (fs.existsSync(historyFileDest)) {
        fs.rename(historyFileDest, backupDest)
    }

    fs.writeFile(historyFileDest, JSON.stringify(getHistoryItems()), 'utf8', err => {
        if (err) {
            console.error(`${new Date().toLocaleString()} -> Can not create database file due to an error '${err}'`)
        } else {
            // remove backup file
            if (fs.existsSync(backupDest)) {
                fs.unlink(backupDest)
            }

            console.log(`${new Date().toLocaleString()} -> Store ${getHistoryItems().length} items in database file  '${historyFileDest}'`)
        }
    });
})

module.exports = {
    parseHistory,
    importDatabaseFile,
    addRawItem,
    getItems,
    getLatestItem
}
