const Store = require('./store')
const state = {
    ok: true
}
const getters = {
    status() {
        return state.status
    }
}
const actions = {
    setStatus: (context, payload) => {
        context.commit('setStatus', payload)
    }
}
const mutations = {
    setStatus(state, status) {
        const newState = Object.assign({}, state, status)

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
