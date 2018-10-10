const fs = require('fs-extra')
let devices = ['INKE', 'ODIN', 'PURL']
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

module.exports = {
    importDatabaseFile
}
