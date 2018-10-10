const Store = require('../store')
const importer = require('./importer')
const state = {
    items: [],
    devices: []
}
const historyMap = []

function processDatabaseItem(devices, payload) {
    const result = {
        date: payload.date,
        data: [],
        origin: payload
    }

    historyMap[payload.deviceId] = payload

    devices.forEach(deviceId => {
        if (payload.deviceId === deviceId) {
            result.data.push(payload)
        } else if (historyMap[deviceId]) {
            result.data.push(historyMap[deviceId])
        } else {
            result.data.push(null)
        }
    })

    return result
}

const getters = {
    items() {
        return state.items
    },
    devices() {
        return state.devices
    },
    history() {
        return state.items.map(item => item.origin)
    }
}

const actions = {
    importItem: (context, payload) => {
        const item = importer(payload)

        if (!item) {
            return null
        }

        const processed = processDatabaseItem(context.getters.devices(), item)

        actions.addItem(context, processed)
    },
    addItem: (context, payload) => {
        if (typeof payload === 'string') {
            actions.importItem(context, payload)

            return
        }

        if (!payload.hasOwnProperty('data')) {
            actions.addDatabaseItem(context, payload)

            return
        }

        context.commit('addItem', payload)
    },
    addDatabaseItem: (context, payload) => {
        payload = processDatabaseItem(context.getters.devices(), payload)

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
    addItem(state, item) {
        state.items.push(item)

        this.events.publish('addItem', item)

        return state
    },
    addDatabaseItem(state, item) {
        let newState = this.mutations.addItem(state, item)

        this.events.publish('addDatabaseItem', item)

        return newState
    },
    addDevice(state, deviceName) {
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
