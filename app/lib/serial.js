const SerialPort = require('serialport')
const Readline = require('@serialport/parser-readline')
const statusStore = require('../store/statusstore')
const itemStore = require('../store/itemstore')

module.exports = function (serialPortId, io) {
  const port = new SerialPort(serialPortId, {
    baudRate: 9600
  })
  const parser = port.pipe(new Readline({ delimiter: '\r\n' }))

  parser.on('data', data => {
    itemStore.dispatch('importItem', data)

    if (data !== null) {
      console.log(`${new Date().toLocaleString()} -> New data: ${data}`)
    }
  })

  // Open errors will be emitted as an error event
  port.on('error', err => {
    console.error(`${new Date().toLocaleString()} -> SerialPort Error: ${err.message}`)

    statusStore.dispatch('setStatus', {
      ok: false,
      id: 'no sensordata',
      message: err.message,
      port: serialPortId
    })
  })

  // The open event is always emitted
  port.on('open', function () {

  })
}
