const fs = require('fs-extra')
const path = require('path')
const itemStore = require('../store/itemstore')
let options = {
  dest: path.resolve(process.cwd(), './data/weatherdata.json')
}

const persistDatabase = () => {
  const dirname = path.dirname(options.dest)
  const backupDest = options.dest.replace('.json', `.backup.json`)

  // Create destination directory if not exists
  try {
    fs.accessSync(dirname, fs.R_OK | fs.W_OK)
  } catch (err) {
    fs.ensureDir(dirname)
  }

  // backup existing file
  if (fs.existsSync(options.dest)) {
    fs.copyFileSync(options.dest, backupDest)
  }

  fs.writeFile(options.dest, JSON.stringify(itemStore.getters.items()), 'utf8', err => {
    if (err) {
      console.error(
        `%s -> Can not create database file due to an error '%s'`,
        new Date().toLocaleString(),
        err
      )
    } else {
      console.log(
        `%s -> Store %d items in database file '%s'`,
        new Date().toLocaleString(),
        itemStore.getters.items().length,
        path.relative(process.cwd(), options.dest)
      )
    }
  })
}

const setup = (opts = {}) => {
  options = { ...options, ...opts }
}

itemStore.events.subscribe('addItem', persistDatabase)

module.exports = {
  setup
}
