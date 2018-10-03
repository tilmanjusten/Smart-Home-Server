const SerialPort = require('serialport')
const Readline = require('@serialport/parser-readline')
const state = require('./state')
const weatherData = require('./weather-data')

module.exports = function (serialPortId, io) {
    const port = new SerialPort(serialPortId, {
        baudRate: 9600
    })
    const parser = port.pipe(new Readline({ delimiter: '\r\n' }))

    parser.on('data', data => {
        const item = weatherData.addRawItem(data)

        if (item !== null) {
            io.emit('update', item)

            console.log(`${item.date.toLocaleString()} -> New data: ${data}`)
        } else {
            console.error(`${new Date().toLocaleString()} -> Can't read data '${data}'`)
        }
    })

    // Open errors will be emitted as an error event
    port.on('error', err => {
        console.log(`${new Date().toLocaleString()} -> SerialPort Error: ${err.message}`);

        state.status.ok = false
        state.status.data = {
            id: 'no sensordata',
            message: err.message,
            port: serialPortId
        }

        io.emit('status error', state.status.data)
    })

    // The open event is always emitted
    port.on('open', function () {

    })
}