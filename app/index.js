const serialPortId = process.env.NODE_ENV === 'develop' ? '/dev/tty.usbmodem14201' : '/dev/ttyUSB0' // '/dev/ttyACM0'
const express = require('express')
const app = express()
const expressPort = 3000
const server = require('http').Server(app);
const io = require('socket.io')(server);
const serial = require('./lib/serial')
const path = require('path')
const weatherData = require('./lib/weather-data')
const state = require('./lib/state')

serial(serialPortId, io)
weatherData.importDatabaseFile(path.resolve(process.cwd(), 'data/', 'weatherdata.json'))

app.use(express.static('client', {icons: true}))

app.use(function (req, res, next) {
    res.header('Access-Control-Allow-Origin', '*');
    res.header('Access-Control-Allow-Credentials', true);
    res.header('Access-Control-Allow-Headers', 'Origin, X-Requested-With, Content-Type, Accept');
    next();
});

app.get('/', (req, res) => {
    const options = {
        root: process.cwd() + '/client/',
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

io.on('connection', function (socket) {
    console.log(`${new Date().toLocaleString()} -> A user connected`);

    socket.on('disconnect', function () {
        console.log(`${new Date().toLocaleString()} -> A user disconnected`);
    });

    socket.on('get status', () => {
        console.log(`${new Date().toLocaleString()} -> Status ok: ${state.status.ok}`)
        
        socket.emit('status', state.status)

        if (!state.status.ok) {
            socket.emit('status error', state.status.data)
        }
    })

    socket.on('get history', () => {
        socket.emit('history', weatherData.getItems())
    })
});
