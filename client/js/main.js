const socket = io('http://localhost:3124');

socket.emit('get status')

socket.on('status', status => {
    if (!status.ok) {
        showError(status.data)
    }
})

socket.on('update', item => {
    const el = document.getElementById(item.deviceId)

    if (!el) {
        return
    }

    const elHumidity = el.querySelector('.humidity .value')
    const elTemperature = el.querySelector('.temperature .value')

    elHumidity.innerHTML = item.hu + elHumidity.dataset.unit
    elTemperature.innerHTML = item.te + elTemperature.dataset.unit
})

socket.on('status error', item => {
    showError(item)
})

function showError(item) {
    const error = document.querySelector('.error')

    if (item.id === 'no sensordata') {
        error.innerHTML = 'Die Sensoren können nicht ausgelesen werden. Möglicherweise ist der Arduino nicht angeschlossen.'
    }

    error.classList.add('error--is-visible')
}
