const SerialPort = require('serialport')
const Readline = require('@serialport/parser-readline')
const serialPortId = process.env.NODE_ENV === 'develop' ? '/dev/cu.usbmodem1421' : '/dev/ttyACM0'
const port = new SerialPort(serialPortId, {
    baudRate: 9600
})
const parser = port.pipe(new Readline({delimiter: '\r\n'}))
const dataPattern = /^([A-Z]{4,5})0?HU(\d{3})TE((?:[+|-])\d{3})/
let weatherData = []
const express = require('express')
const app = express()
const expressPort = 3124
const http = require('http').Server(app);
const io = require('socket.io')(http);

app.use(function(req, res, next) {
    res.header('Access-Control-Allow-Origin', 'http://localhost:3000');
    res.header('Access-Control-Allow-Credentials', true);
    res.header('Access-Control-Allow-Headers', 'Origin, X-Requested-With, Content-Type, Accept');
    next();
});

// app.get('/weather-data.json', (req, res) => res.send({data: weatherData}))

http.listen(expressPort, function(){
    console.log('listening on *:3000');
});

// app.listen(expressPort, () => console.log(`Weather at home app listening on port ${expressPort}!`))

// Open errors will be emitted as an error event
port.on('error', err => {
    console.log('Error: ', err.message);
})

// The open event is always emitted
port.on('open', function () {
    // open logic
})

io.on('connection', function(socket){
    console.log('a user connected');

    socket.on('disconnect', function(){
        console.log('user disconnected');
    });
});

parser.on('data', data => {
    const dataMatch = data.match(dataPattern)

    if (!dataMatch) {
        console.error(`Can\'t read data '${data}'`)

        return
    }

    const date = new Date()
    const deviceId = dataMatch[1]
    const humidity = dataMatch[2].replace('0', '')
    const temperature = dataMatch[3].replace('0', '')
    const item = {
        date: date.toLocaleString(),
        deviceId,
        hu: humidity,
        te: temperature
    }

    weatherData.push(item)

    // use 200 items only
    weatherData = weatherData.slice(-200)

    io.emit('update', item)

    console.log(`${date.toLocaleString()}: ${humidity}% Luftfeuchtigkeit bei ${temperature}°C im ${deviceId}`)
})
