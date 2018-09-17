const apiUrl = 'http://localhost:3124/weather-data.json'

setInterval(fetchData, 2000)

function fetchData() {
    fetch(apiUrl)
        .then(res => res.json())
        .then(rawData => handleResponse(rawData.data))
        .catch(err => console.error(err));
}

function handleResponse(data) {
    updateUI(data.reverse())
}

function updateUI(data) {
    let latestData = {};

    data.forEach(item => {
        if (!latestData[item.deviceId]) {
            latestData[item.deviceId] = item;
        }
    })

    // update single values
    for (let item in latestData) {
        if (latestData.hasOwnProperty(item)) {
            const device = latestData[item]
            const el = document.getElementById(device.deviceId)

            if (!el) {
                continue
            }

            const elHumidity = el.querySelector('.humidity')
            const elTemperature = el.querySelector('.temperature')

            elHumidity.innerHTML = device.hu + elHumidity.dataset.unit
            elTemperature.innerHTML = device.te + elTemperature.dataset.unit
        }
    }
}
