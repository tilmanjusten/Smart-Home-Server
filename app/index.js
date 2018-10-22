const serialPortId = process.env.NODE_ENV === 'develop' ? '/dev/tty.usbmodem14201' : '/dev/ttyUSB0' // '/dev/ttyACM0'
const express = require('express')
const app = express()
const server = require('http').Server(app);
const history = require('connect-history-api-fallback')
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
    io.emit('update', ...state.items.slice(-1))
})

serial(serialPortId, io)

app.use(history())
app.use(express.static('client', { icons: true }))
app.set('port', process.env.PORT || 3000)

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

app.get('/api/v1/items', (req, res) => {
    res.send(itemStore.getters.items())
})

app.get('/api/v1/items/latest', (req, res) => {
    res.send(itemStore.getters.latestItem())
})

app.get('/api/v1/items/:deviceId', (req, res) => {
    res.send(itemStore.getters.itemsByDeviceId(req.params.deviceId))
})

app.get('/api/v1/items/:deviceId/latest', (req, res) => {
    res.send(itemStore.getters.latestItemByDeviceId(req.params.deviceId))
})

app.get('/api/v1/devices', (req, res) => {
    res.send(itemStore.getters.devices())
})

server.listen(app.get('port'), console.log(`${new Date().toLocaleString()} -> HTTP server is listening on *:${app.get('port')}`));

io.on('connection', function (socket) {
    console.log(`${new Date().toLocaleString()} -> A user connected`);

    socket.on('disconnect', function () {
        console.log(`${new Date().toLocaleString()} -> A user disconnected`);
    });

    socket.on('get status', () => {
        const status = statusStore.getters.status()

        console.log(`${new Date().toLocaleString()} -> Status ok: ${status.ok ? 'yes' : 'no'}`)

        socket.emit('status', status)
    })

    socket.on('get items', () => {
        socket.emit('items', itemStore.getters.items())
    })
});
