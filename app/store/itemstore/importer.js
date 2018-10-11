const patterns = {
  DHT22: /^([A-Z]{4,5})0?HU(\d{3})TE((?:[+|-])\d{3})/,
  YL69: /^([A-Z]{4,5})MO(\d{4})MV((?:[+|-])\d{4})/
}

const DHT22 = (match = []) => {
  if (match.length < 4) {
    return null
  }

  const date = new Date()
  const deviceId = match[1]
  const humidity = match[2].replace('0', '')
  const temperature = match[3].replace('0', '')

  const item = {
    date: date.toUTCString(),
    deviceId,
    type: 'DHT22',
    hu: humidity,
    te: temperature
  }

  return item
}

const YL69 = (match = []) => {
  if (match.length < 4) {
    return null
  }

  const date = new Date()
  const deviceId = match[1]
  const moisture = match[2].replace('0', '')
  const moistureVal = match[3].replace('0', '')

  const item = {
    date: date.toUTCString(),
    deviceId,
    type: 'YL69',
    mo: moisture,
    mv: moistureVal
  }

  return item
}

const importers = {
  DHT22,
  YL69
}

module.exports = payload => {
  let importAction
  let match

  // get device type by pattern match
  for (const deviceType in patterns) {
    if (patterns.hasOwnProperty(deviceType)) {
      const pattern = patterns[deviceType]

      match = payload.match(pattern)

      if (match) {
        importAction = importers[deviceType]
        break
      }
    }
  }

  if (typeof importAction === 'function') {
    return importAction(match)
  } else {
    return null
  }
}
