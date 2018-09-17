const browserSync = require('browser-sync')

browserSync({
    server: 'client',
    files: ['client/*.html', 'client/css/*.css', 'client/js/*.js'],
    port: 3000,
    watch: true
});
