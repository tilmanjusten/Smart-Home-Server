class PubSub {
  constructor () {
    this.events = []
  }

  subscribe (event, callback) {
    if (!this.events.hasOwnProperty(event)) {
      this.events[event] = []
    }

    this.events[event].push(callback)
  }

  unsubscribe (event, callback = null) {
    if (typeof this.events[event] !== 'object') {
      console.log(`Event "${event}" has no subscriptions.`)

      return
    }

    if (callback !== null) {
      this.events[event].forEach((el, i) => {
        if (el === callback) {
          delete this.events[event][i]
        }
      })
    } else {
      delete this.events[event]
    }
  }

  publish (event, payload = {}) {
    if (!this.events.hasOwnProperty(event)) {
      return []
    }

    return this.events[event].map(callback => callback(payload))
  }
}

module.exports = PubSub
