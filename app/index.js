const SerialPort = require('serialport')
const Readline = require('@serialport/parser-readline')
const serialPortId = process.env.NODE_ENV === 'develop' ? '/dev/cu.usbmodem1421' : '/dev/ttyUSB0' // '/dev/ttyACM0'
const port = new SerialPort(serialPortId, {
    baudRate: 9600
})
const parser = port.pipe(new Readline({delimiter: '\r\n'}))
const express = require('express')
const app = express()
const expressPort = 3000
const server = require('http').Server(app);
const io = require('socket.io')(server);
const status = {
    ok: true,
    data: {}
}
const path = require('path')
const weatherData = require('./lib/weather-data')

weatherData.addDataFromFile(path.resolve(__dirname, '../data/', 'weatherdata.json'))

if (weatherData.getItems().length > 0) {
    console.log(`${new Date().toLocaleString()} -> Get history from file: ${weatherData.getItems().length} items found`)
} else {
    console.log(`${new Date().toLocaleString()} -> No history found`)
}

app.use(express.static('client', {icons: true}))

app.use(function (req, res, next) {
    // res.header('Access-Control-Allow-Origin', 'http://localhost:3000');
    res.header('Access-Control-Allow-Credentials', true);
    res.header('Access-Control-Allow-Headers', 'Origin, X-Requested-With, Content-Type, Accept');
    next();
});

app.get('/', (req, res) => {
    const options = {
        root: __dirname + '/../client/',
        dotfiles: 'deny',
        headers: {
            'x-timestamp': Date.now(),
            'x-sent': true
        }
    };

    const fileName = req.params.name;

    res.sendFile('index.html', options, function (err) {
        if (err) {
            next(err)
        } else {
            console.log('Sent:', fileName)
        }
    })
})

server.listen(expressPort, console.log(`${new Date().toLocaleString()} -> HTTP server is listening on *:${expressPort}`));

// Open errors will be emitted as an error event
port.on('error', err => {
    console.log(`${new Date().toLocaleString()} -> SerialPort Error: ${err.message}`);

    status.ok = false
    status.data = {
        id: 'no sensordata',
        message: err.message,
        port: serialPortId
    }

    io.emit('status error', status.data)
})

// The open event is always emitted
port.on('open', function () {

})

io.on('connection', function (socket) {
    console.log(`${new Date().toLocaleString()} -> A user connected`);

    socket.on('disconnect', function () {
        console.log(`${new Date().toLocaleString()} -> A user disconnected`);
    });

    socket.on('get status', () => {
        console.log(`${new Date().toLocaleString()} -> Status ok: ${status.ok}`)
        socket.emit('status', status)

        if (!status.ok) {
            socket.emit('status error', status.data)
        }
    })

    socket.on('get history', () => {
        socket.emit('history', weatherData.getItems())
    })
});

parser.on('data', data => {
    const item = weatherData.addRawItem(data)

    io.emit('update', item)

    console.log(`${item.date.toLocaleString()} -> New data: ${data}`)
})
