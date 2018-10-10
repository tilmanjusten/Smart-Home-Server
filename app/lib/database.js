const fs = require('fs-extra')
const path = require('path')
const itemStore = require('../store/itemstore')
let options = {
    dest: './data/weatherdata.json'
}

const persist = () => {
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
        fs.rename(options.dest, backupDest)
    }

    fs.writeFile(options.dest, JSON.stringify(itemStore.getters.history()), 'utf8', err => {
        if (err) {
            console.error(`${new Date().toLocaleString()} -> Can not create database file due to an error '${err}'`)
        } else {
            // remove backup file
            if (fs.existsSync(backupDest)) {
                fs.unlink(backupDest)
            }

            console.log(`${new Date().toLocaleString()} -> Store ${itemStore.getters.history().length} items in database file '${options.dest}'`)
        }
    })
}

const setup = (opts = {
    dest: path.resolve(process.cwd(), 'data/weatherdata.json')
}) => {
    options = {...options, ...opts}
}

itemStore.events.subscribe('addItem', persist)

module.exports = {
    setup
}