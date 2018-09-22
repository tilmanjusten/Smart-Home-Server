const cron = require('node-cron')

module.exports = (function () {
    cron.schedule('*/15 * * * *', () => {
        const dirname = path.dirname(historyFileDest)
        const backupDest = historyFileDest.replace('.json', `.backup.json`)
        // const copyFilename = historyFileDest.replace('.json', `.${new Date().getTime()}.json`)

        // Create destination directory if not exists
        try {
            fs.accessSync(dirname, fs.R_OK | fs.W_OK);
        } catch (err) {
            fs.ensureDir(dirname);
        }

        // backup existing file
        if (fs.existsSync(historyFileDest)) {
            fs.rename(historyFileDest, backupDest)
        }

        fs.writeFile(historyFileDest, JSON.stringify(weatherData), 'utf8', err => {
            if (err) {
                console.error(err)
            } else {
                // remove backup file
                fs.unlink(backupDest)

                console.log(`${new Date().toLocaleString()} -> Created new database file`)
            }
        });
    })
})()
