const socket = io('http://localhost:3124');
const history = {}
const charts = {
    'INKE': null,
    'PURL': null,
    'ODIN': null
}
const deviceNames = {
    'INKE': 'Schlafzimmer',
    'PURL': 'Badezimmer',
    'ODIN': 'Wohnzimmer'
}


socket.emit('get status')
socket.emit('get history')

socket.on('status', status => {
    if (!status.ok) {
        showError(status.data)

        return
    }
})

socket.on('update', item => {
    addItemToHistory(item)
    addChartItem(item)
    updateGui(item)
})

socket.on('status error', item => {
    showError(item)
})

function addItemToHistory(item) {
    if (typeof history[item.deviceId] !== 'object') {
        history[item.deviceId] = []
    }

    item.date = new Date(item.date)

    history[item.deviceId].push(item)

    // crop history for every device
    history[item.deviceId] = history[item.deviceId].slice(-240)
}

function addChartItem(item) {
    charts[item.deviceId].push([
        {
            time: item.date.getTime() / 1000,
            y: item.hu * 1
        },
        {
            time: item.date.getTime() / 1000,
            y: item.te * 1
        }
    ])
}

function updateGui(item) {
    const el = document.getElementById(item.deviceId)

    if (!el) {
        return
    }

    const elHumidity = el.querySelector('.humidity .value')
    const elTemperature = el.querySelector('.temperature .value')

    elHumidity.innerHTML = item.hu + elHumidity.dataset.unit
    elTemperature.innerHTML = item.te + elTemperature.dataset.unit
}

function showError(item) {
    const error = document.querySelector('.error')

    if (item.id === 'no sensordata') {
        error.innerHTML = 'Die Sensoren können nicht ausgelesen werden. Möglicherweise ist der Arduino nicht angeschlossen.'
    }

    error.classList.add('error--is-visible')
}

socket.on('history', data => {
    data.forEach(addItemToHistory)


    // show latest data from history on page load
    for (const deviceId in history) {
        if (history.hasOwnProperty(deviceId) && typeof history[deviceId] === 'object') {
            const item = history[deviceId].pop()

            updateGui(item)
        }
    }

    // chart data preparation
    for (const deviceId in history) {
        if (history.hasOwnProperty(deviceId) && typeof history[deviceId] === 'object') {
            const device = history[deviceId]
            const chartData = []

            console.log(device.length)

            chartData.push(
                {
                    label: `Luftfeuchtigkeit ${deviceNames[deviceId]}`,
                    values: []
                },
                {
                    label: `Temperatur ${deviceNames[deviceId]}`,
                    values: []
                }
            )

            charts[deviceId] = $(`#chart-${deviceId.toLowerCase()}`).epoch({
                type: 'time.line',
                data: chartData,
                axes: ['left', 'right', 'bottom'],
                windowSize: 120,
                historySize: 240,
                range: [0, 100]
            });

            device.forEach(addChartItem)
        }
    }
})
