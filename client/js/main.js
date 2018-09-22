const socket = io('http://localhost:3000');
let chart
let items = []
let chartData;

google.charts.load('current', {'packages': ['corechart']});
// Set a callback to run when the Google Visualization API is loaded.
google.charts.setOnLoadCallback(drawChart);

socket.emit('get status')
socket.emit('get history')

socket.on('status', status => {
    if (!status.ok) {
        showError(status.data)

        return
    }
})

socket.on('update', item => {
    item = processItem(item)

    chartData.addRows(processItemForChart(item))
    updateGui(item)
})

socket.on('status error', item => {
    showError(item)
})

function processItem(item) {
    item.date = new Date(item.date)

    return item
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
    if (items.length < 1) {
        items = data.map(processItem)

        // get latest to update the gui
        const current = items.slice(-1)[0]

        current.data.forEach(updateGui)
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

function processItemForChart(item) {
    const d = item.date
    const res = [`${d.getHours()}:${d.getMinutes()}`]

    item.data.map(v => {
        if (v === null) {
            res.push(0)
            res.push(0)
        } else {
            res.push(v.hu * 1)
            res.push(v.te * 1)
        }
    })

    return res
}

// Callback that creates and populates a data table,
// instantiates the pie chart, passes in the data and
// draws it.
function drawChart() {
    // Labels
    let data = [
        [
            'Zeit',
            'Luftfeuchtigkeit Schlafzimmer',
            'Temperatur Schlafzimmer',
            'Luftfeuchtigkeit Wohnzimmer',
            'Temperatur Wohnzimmer',
            'Luftfeuchtigkeit Badezimmer',
            'Temperatur Badezimmer'
        ]
    ]

    if (items.length) {
        const history = items.map(processItemForChart)

        data = data.concat(history)
    } else {
        data = data.push([0, 0, 0, 0, 0, 0, 0])
    }

    chartData = new google.visualization.arrayToDataTable(data);

    // Instantiate and draw our chart, passing in some options.
    chart = new google.visualization.LineChart(document.getElementById('full-chart'));

    chart.draw(chartData, {
        height: 300
    });
}
