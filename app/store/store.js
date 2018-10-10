const PubSub = require('./pubsub')

class Store {
    constructor(props = {}) {
        this.state = {}
        this.events = new PubSub()
        this.getters = {}
        this.actions = {}
        this.mutations = {}

        if (props.hasOwnProperty('events')) {
            this.events = props.events
        }

        if (props.hasOwnProperty('state')) {
            this.state = props.state
        }

        if (props.hasOwnProperty('getters')) {
            this.getters = props.getters
        }

    
        if (props.hasOwnProperty('actions')) {
            this.actions = props.actions
        }

        if (props.hasOwnProperty('mutations')) {
            this.mutations = props.mutations
        }
    }

    dispatch(actionKey, payload) {
        if (typeof this.actions[actionKey] !== 'function') {
            console.error(`Action "${actionKey} doesn't exist.`)

            return false
        }

        console.groupCollapsed(`${new Date().toLocaleDateString()} -> Dispatched ${actionKey}`)

        this.actions[actionKey].call(this, this, payload)

        console.groupEnd()

        return true
    }

    commit(mutationKey, payload) {
        if (typeof this.mutations[mutationKey] !== 'function') {
            console.log(`Mutation "${mutationKey}" doesn't exist`)

            return false
        }

        let newState = this.mutations[mutationKey].call(this, this.state, payload)

        this.state = Object.assign(this.state, newState)
        
        this.events.publish('stateChange', this.state)

        return true
    }
}

module.exports = Store
