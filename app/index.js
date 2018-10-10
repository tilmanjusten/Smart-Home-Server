const serialPortId = process.env.NODE_ENV === 'develop' ? '/dev/tty.usbmodem14201' : '/dev/ttyUSB0' // '/dev/ttyACM0'
const express = require('express')
const app = express()
const expressPort = 3000
const server = require('http').Server(app);
const io = require('socket.io')(server);
const serial = require('./lib/serial')
const path = require('path')
const weatherData = require('./lib/weather-data')
const statusStore = require('./store/statusstore')
const itemStore = require('./store/itemstore')
const database = require('./lib/database')

statusStore.events.subscribe('stateChange', status => {
    io.emit('status', status)
})

weatherData.importDatabaseFile(path.resolve(process.cwd(), 'data/', 'weatherdata.json'))
database.setup({
    dest: path.resolve(process.cwd(), 'data/', 'weatherdata.json'),
    cronInterval: '*/2 * * * *'
})

// subscribe to itemstore after importing the database
itemStore.events.subscribe('stateChange', state => {
    io.emit('update', state.items.slice(-1))
})

serial(serialPortId, io)

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
        
        const status = statusStore.getters.status()

        socket.emit('status', status)

        if (!status.ok) {
            socket.emit('status error', status.data)
        }
    })

    socket.on('get history', () => {
        socket.emit('history', weatherData.getItems())
    })
});
