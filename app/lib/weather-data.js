const fs = require('fs-extra')
const cron = require('node-cron')
const path = require('path')
let devices = ['INKE', 'ODIN', 'PURL']
const historyFileDest = path.resolve(process.cwd(), 'data/weatherdata.json')
const itemStore = require('../store/itemstore')

devices.forEach(deviceName => itemStore.dispatch('addDevice', deviceName))

function importDatabaseFile(filepath) {
    if (fs.existsSync(filepath)) {
        const content = fs.readFileSync(filepath, 'utf8')
        const jsonContent = JSON.parse(content)

        try {
            getDevicesFromHistory(jsonContent)

            console.log(
                `%s -> Got %d devices from database: %s`,
                new Date().toLocaleString(),
                itemStore.getters.devices().length,
                itemStore.getters.devices().join(', ')
            )
        } catch (err) {
            console.error(
                `%s -> Getting devices from database failed: %s`,
                new Date().toLocaleDateString(),
                err
            )

            return false
        }

        try {
            jsonContent.map(item => itemStore.dispatch('addItem', item))

            console.log(`${new Date().toLocaleString()} -> Got history from database: ${itemStore.getters.history().length} items found`)
        } catch (err) {
            console.error(`${new Date().toLocaleDateString()} -> Database is empty: ${err}`)

            return false
        }

        return true
    } else {
        console.log(`${new Date().toLocaleString()} -> No database found.`)

        return false
    }
}

function getDevicesFromHistory(rawData) {
    // get unique set of device ids
    let historyDevices = [...new Set(rawData.map(item => item.deviceId))]
        .filter(item => item !== undefined)
        .sort()

    historyDevices.forEach(deviceName => itemStore.dispatch('addDevice', deviceName))
}

cron.schedule('*/10 * * * *', () => {
    const dirname = path.dirname(historyFileDest)
    const backupDest = historyFileDest.replace('.json', `.backup.json`)

    // Create destination directory if not exists
    try {
        fs.accessSync(dirname, fs.R_OK | fs.W_OK)
    } catch (err) {
        fs.ensureDir(dirname)
    }

    // backup existing file
    if (fs.existsSync(historyFileDest)) {
        fs.rename(historyFileDest, backupDest)
    }

    fs.writeFile(historyFileDest, JSON.stringify(itemStore.getters.history()), 'utf8', err => {
        if (err) {
            console.error(`${new Date().toLocaleString()} -> Can not create database file due to an error '${err}'`)
        } else {
            // remove backup file
            if (fs.existsSync(backupDest)) {
                fs.unlink(backupDest)
            }

            console.log(`${new Date().toLocaleString()} -> Store ${itemStore.getters.history().length} items in database file  '${historyFileDest}'`)
        }
    })
})

module.exports = {
    importDatabaseFile
}
