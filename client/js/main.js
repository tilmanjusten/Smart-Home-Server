const socket = io(location.origin)
let chart
let items = []
let chartData = []
const chartOptions = {
    legend: {
        position: 'top',
        fontSize: 12
    },
    height: 300,
    // curveType: 'function',
    series: {
        0: {
            color: '#e2431e',
            // lineDashStyle: [5, 5]
        },
        1: {
            color: '#e2431e',
            // lineDashStyle: [5, 5]
        },
        // 2: { color: '#f1ca3a' },
        2: {
            color: '#6f9654'
        },
        3: {
            color: '#6f9654'
        },
        4: {
            color: '#1c91c0'
        },
        5: {
            color: '#1c91c0'
        },
        // 5: { color: '#43459d' },
    },
    hAxis: {
        title: 'Zeit',
        format: 'd.MM., H:mm',
        fontSize: 13
    },
    vAxis: {
        format: '#',
        title: '°C / %'
    },
    trendlines: {

    },
    explorer: {
        axis: 'horizontal',
        actions: ['dragToPan', 'dragToZoom', 'rightClickToReset'],
        maxZoomIn: 0.25,
        maxZoomOut: 2,
        zoomDelta: 1.5
    },
}

google.charts.load('current', { 'packages': ['corechart'] })
// Set a callback to run when the Google Visualization API is loaded.
google.charts.setOnLoadCallback(initChart)

socket.emit('get status')

socket.on('status', status => {
    if (!status.ok) {
        showError(status.data)

        return
    }
})

socket.on('update', item => {
    item = processItem(item)
    item.data.forEach(updateGui)

    // Init chart on first update of history is empty
    if (chart === undefined) {
        drawChart()
    }

    if (chart !== undefined) {
        chartData.addRow(processItemForChart(item))

        // chartData = chartData.slice(-1200)

        chart.draw(chartData, chartOptions)
    }
})

socket.on('status error', item => {
    showError(item)
})

function processItem(item) {
    item.date = new Date(item.date)

    return item
}

function updateGui(item) {
    if (item === null) {
        return null
    }

    const el = document.getElementById(`${item.deviceId}-${item.type}`)

    if (!el) {
        return
    }

    if (item.type === 'DHT22') {
        const elHumidity = el.querySelector('.humidity .value')
        const elTemperature = el.querySelector('.temperature .value')

        elHumidity.innerHTML = item.hu + elHumidity.dataset.unit
        elTemperature.innerHTML = item.te + elTemperature.dataset.unit
    }
}

function showError(item) {
    const error = document.querySelector('.error')

    if (item.id === 'no sensordata') {
        error.innerHTML = 'Die Sensoren können nicht ausgelesen werden. Möglicherweise ist der Arduino nicht angeschlossen.'
    }

    error.classList.add('error--is-visible')
}

socket.on('history', data => {
    if (items.length < 1) {
        items = data.map(processItem)

        // get latest to update the gui
        const current = items.slice(-1)[0]

        if (current && current.data) {
            current.data.forEach(updateGui)
        }

        if (items.length > 0 && chart === undefined) {
            drawChart()
        }
    }
})

function toggleFullScreen() {
    if (!document.fullscreenElement) {
        document.documentElement.requestFullscreen()
    } else {
        if (document.exitFullscreen) {
            document.exitFullscreen()
        }
    }
}

function processItemForChart(item) {
    const res = [item.date]

    item.data.map(v => {
        if (v === null) {
            res.push(0)
            res.push(0)
        } else if (v !== null && v !== undefined) {
            res.push(v.hu * 1)
            res.push(v.te * 1)
        }
    })

    return res
}

function initChart() {
    socket.emit('get history')
}
// Callback that creates and populates a data table,
// instantiates the pie chart, passes in the data and
// draws it.
function drawChart() {
    // Labels
    let data = [
        [
            'Zeit',
            'Schlafzimmer: % Lf.',
            '°C',
            'Wohnzimmer: % Lf.',
            '°C',
            'Bad: % Lf.',
            '°C'
        ]
    ]

    if (items.length) {
        const history = items.map(processItemForChart)

        data = data.concat(history.slice(-1200))
    } else {
        data.push([0, 0, 0, 0, 0, 0, 0])
    }

    chartData = new google.visualization.arrayToDataTable(data)

    // Instantiate and draw our chart, passing in some options.
    chart = new google.visualization.LineChart(document.getElementById('full-chart'))

    chart.draw(chartData, chartOptions)
}
