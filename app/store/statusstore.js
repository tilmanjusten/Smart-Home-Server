const Store = require('./store')
const state = {
    ok: true
}
const getters = {
    status() {
        return state
    }
}
const actions = {
    setStatus: (context, payload) => {
        context.commit('setStatus', payload)
    }
}
const mutations = {
    setStatus(state, status) {
        let newState = { ...state, ...status }

        this.events.publish('addDevice', newState)

        return newState
    }
}

class StatusStore extends Store {
    constructor() {
        super({
            state,
            getters,
            actions,
            mutations
        })
    }
}

module.exports = new StatusStore()
