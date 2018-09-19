const socket = io('http://localhost:3124');
const history = {}
const charts = {
    'INKE': null,
    'PURL': null,
    'ODIN': null
}
let allChart = null
const historyLatest = {
    'INKE': [],
    'PURL': [],
    'ODIN': []
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
    history[item.deviceId] = history[item.deviceId].slice(-500)
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

function addAllChartItem(item) {
    const data = []
    const itemTime = item.date.getTime() / 1000

    historyLatest[item.deviceId] = item

    for (const deviceId in charts) {
        if (item.deviceId === deviceId) {
            data.push({
                time: itemTime,
                y: item.hu * 1
            })
            data.push({
                time: itemTime,
                y: item.te * 1
            })
        } else {
            // get previous value
            const prev = historyLatest[deviceId]
            const hu = prev.hu * 1 || null
            const te = prev.te * 1 || null

            data.push({
                time: itemTime,
                y: hu
            })
            data.push({
                time: itemTime,
                y: te
            })
        }
    }

    allChart.push(data)
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

    // all devices in one chart
    const allChartsData = []

    // chart data preparation
    for (const deviceId in history) {
        if (history.hasOwnProperty(deviceId) && typeof history[deviceId] === 'object') {
            const device = history[deviceId]
            const chartData = []
            const huData = {
                label: `Luftfeuchtigkeit ${deviceNames[deviceId]}`,
                values: []
            }
            const teData = {
                label: `Temperatur ${deviceNames[deviceId]}`,
                values: []
            }

            chartData.push(huData)
            chartData.push(teData)

            charts[deviceId] = $(`#chart-${deviceId.toLowerCase()}`).epoch({
                type: 'time.line',
                data: chartData,
                axes: ['left', 'right', 'bottom'],
                windowSize: 120,
                historySize: 20,
                range: [0, 100]
            });

            // all devices in one chart
            allChartsData.push(huData)
            allChartsData.push(teData)
        }
    }

    allChart = $(`#chart-all`).epoch({
        type: 'time.line',
        data: allChartsData,
        axes: ['left', 'right', 'bottom'],
        windowSize: 60,
        historySize: 120,
        range: [10, 80]
    });

    // chart data preparation
    for (const deviceId in history) {
        if (history.hasOwnProperty(deviceId) && typeof history[deviceId] === 'object') {
            const device = history[deviceId]

            device.forEach(addChartItem)
            device.forEach(addAllChartItem)
        }
    }
})

function toggleFullScreen() {
    if (!document.fullscreenElement) {
        document.documentElement.requestFullscreen();
    } else {
        if (document.exitFullscreen) {
            document.exitFullscreen();
        }
    }
}
