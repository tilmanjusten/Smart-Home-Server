const fs = require('fs-extra')

const data = []
let devices = []
const history = {}

function addDataFromFile(filepath) {
    if (fs.existsSync(filepath)) {
        const parsed = parseHistory(JSON.parse(fs.readFileSync(filepath, 'utf8')))

        parsed.map(addItem)

        return data
    } else {
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

    history[item.deviceId] = item

    devices.forEach(deviceId => {
        if (item.deviceId === deviceId) {
            result.data.push(item)
        } else if (history[deviceId]) {
            result.data.push(history[deviceId])
        } else {
            result.data.push(null)
        }
    })

    return result
}

function addRawItem(data) {
    const dataMatch = data.match(dataPattern)

    if (!dataMatch) {
        console.error(`Can\'t read data '${data}'`)

        return
    }

    const date = new Date()
    const deviceId = dataMatch[1]
    const humidity = dataMatch[2].replace('0', '')
    const temperature = dataMatch[3].replace('0', '')
    const item = processRawItem({
        date: date.toUTCString(),
        deviceId,
        hu: humidity,
        te: temperature
    })

    return addItem(item)
}

function addItem(item) {
    data.push(item)

    return item
}

function parseHistory(rawData) {
    // get unique set of device ids
    devices = [...new Set(rawData.map(item => item.deviceId))].concat(devices).sort()

    console.log(devices)

    return rawData.map(processRawItem)
}

function getItems() {
    return data
}

module.exports = {
    parseHistory,
    addDataFromFile,
    addRawItem,
    getItems
}
