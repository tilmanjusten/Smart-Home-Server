const Store = require('../store')
const importer = require('./importer')
const state = {
    items: [],
    devices: []
}

const getters = {
    items () {
        return state.items
    },
    devices () {
        return state.devices
    },
    itemsByDeviceId (deviceId) {
        return state.items.filter(item => item.deviceId === deviceId)
    },
    latestItem () {
        let items = state.items
        let n = items.length

        if (n < 1) {
            return []
        }

        return items[n - 1]
    },
    latestItemByDeviceId (deviceId) {
        let items = getters.itemsByDeviceId(deviceId)
        let n = items.length

        if (n < 1) {
            return {}
        }

        return items[n - 1]
    }
}

const actions = {
    importItem: (context, payload) => {
        const item = importer(payload)

        if (!item) {
            return
        }

        actions.addItem(context, item)
    },
    addItem: (context, payload) => {
        if (typeof payload === 'string') {
            actions.importItem(context, payload)

            return
        }

        context.commit('addItem', payload)
    },
    addDatabaseItem: (context, payload) => {
        context.commit('addDatabaseItem', payload)
    },
    addDevice: (context, payload) => {
        if (state.devices.includes(payload)) {
            return
        }

        context.commit('addDevice', payload)
    }
}
const mutations = {
    addItem (state, item) {
        state.items.push(item)

        this.events.publish('addItem', item)

        return state
    },
    addDatabaseItem (state, item) {
        state.items.push(item)

        this.events.publish('addDatabaseItem', item)

        return state
    },
    addDevice (state, deviceName) {
        state.devices.push(deviceName)

        this.events.publish('addDevice', deviceName)

        return state
    }
}

class ItemStore extends Store {
    constructor() {
        super({
            state,
            getters,
            actions,
            mutations
        })
    }
}

module.exports = new ItemStore()
