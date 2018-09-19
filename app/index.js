const SerialPort = require('serialport')
const Readline = require('@serialport/parser-readline')
const serialPortId = process.env.NODE_ENV === 'develop' ? '/dev/cu.usbmodem1411' : '/dev/ttyUSB0' // '/dev/ttyACM0'
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
const status = {
    ok: true,
    data: {}
}
const cron = require('node-cron')
const fs = require('fs-extra')
const path = require('path')
const historyFileDest = path.resolve(__dirname, '../data/', 'weatherdata.json')

app.use(function (req, res, next) {
    res.header('Access-Control-Allow-Origin', 'http://localhost:3000');
    res.header('Access-Control-Allow-Credentials', true);
    res.header('Access-Control-Allow-Headers', 'Origin, X-Requested-With, Content-Type, Accept');
    next();
});

if (fs.existsSync(historyFileDest)) {
    weatherData = JSON.parse(fs.readFileSync(historyFileDest, 'utf8'))

    console.log(`${new Date().toLocaleString()} -> Get history from file: ${weatherData.length}`)
}

// app.get('/weather-data.json', (req, res) => res.send({data: weatherData}))

http.listen(expressPort, console.log(`${new Date().toLocaleString()} -> HTTP server is listening on *:3000`));

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
        socket.emit('history', weatherData)
    })
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
        date: date.toUTCString(),
        deviceId,
        hu: humidity,
        te: temperature
    }

    weatherData.push(item)

    weatherData = weatherData.slice(-10000)

    io.emit('update', item)

    console.log(`${date.toLocaleString()} -> ${humidity}% Luftfeuchtigkeit bei ${temperature}°C im ${deviceId}`)
})

cron.schedule('*/15 * * * *', () => {
    const dirname = path.dirname(historyFileDest)
    const backupDest = historyFileDest.replace('.json', `.backup.json`)
    // const copyFilename = historyFileDest.replace('.json', `.${new Date().getTime()}.json`)

    // Create destination directory if not exists
    try {
        fs.accessSync(dirname, fs.R_OK | fs.W_OK);
    } catch (err) {
        fs.ensureDir(dirname);
    }

    // backup existing file
    if (fs.existsSync(historyFileDest)) {
        // fs.copyFileSync(historyFileDest, copyFilename)
        // console.log(`${new Date().toLocaleString()} -> Created database backup file ${copyFilename}`)

        fs.rename(historyFileDest, backupDest)
    }

    fs.writeFile(historyFileDest, JSON.stringify(weatherData), 'utf8', err => {
        if (err) {
            console.error(err)
        } else {
            // remove backup file
            fs.unlink(backupDest)

            console.log(`${new Date().toLocaleString()} -> Created new database file`)
        }
    });
})
