const fs = require('fs-extra')
const path = require('path')
const cron = require('node-cron')
const itemStore = require('../store/itemstore')

const persist = (dest) => {
    const dirname = path.dirname(dest)
    const backupDest = dest.replace('.json', `.backup.json`)

    // Create destination directory if not exists
    try {
        fs.accessSync(dirname, fs.R_OK | fs.W_OK)
    } catch (err) {
        fs.ensureDir(dirname)
    }

    // backup existing file
    if (fs.existsSync(dest)) {
        fs.rename(dest, backupDest)
    }

    fs.writeFile(dest, JSON.stringify(itemStore.getters.history()), 'utf8', err => {
        if (err) {
            console.error(`${new Date().toLocaleString()} -> Can not create database file due to an error '${err}'`)
        } else {
            // remove backup file
            if (fs.existsSync(backupDest)) {
                fs.unlink(backupDest)
            }

            console.log(`${new Date().toLocaleString()} -> Store ${itemStore.getters.history().length} items in database file  '${dest}'`)
        }
    })
}
const setup = (options = {
    dest: path.resolve(process.cwd(), 'data/weatherdata.json'),
    cronInterval: '*/10 * * * *'
}) => {
    cron.schedule(options.cronInterval, () => {
        persist(options.dest)
    })
}

module.exports = {
    setup
}