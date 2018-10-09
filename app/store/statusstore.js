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
        return Object.assign({}, state, status)
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
