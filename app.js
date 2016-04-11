const express = require('express')
const http    = require('http')
const path    = require('path')
const fs      = require('fs')

const router  = require('./router/router.js')
const webpack = require('webpack')
const config = require("./webpack.config.js")

var app = express()
var debug = require('debug')('react-explain:server');


app.engine('html', renderHtml);
app.set('views', './react-learn');
app.set('view engine', 'html');

const compiler = webpack(config)

app.use(express.static(path.join(__dirname, 'react-learn')));

app.use(router)


app.use(require('webpack-dev-middleware')(compiler, {
    noInfo: true,
    publicPath: config.output.publicPath || '/'
}))

app.use(require('webpack-hot-middleware')(compiler));

const hostname = '127.0.0.1';
const port = process.env.PORT || '8080';
const server = http.createServer(app);

app.set('port', port);

server.listen(port,hostname);
server.on('error', onError);
server.on('listening', onListening);

function onError(error) {
    if (error.syscall !== 'listen') {
        throw error;
    }

    var bind = typeof port === 'string'
        ? 'Pipe ' + port
        : 'Port ' + port;

    // handle specific listen errors with friendly messages
    switch (error.code) {
        case 'EACCES':
            console.error(bind + ' requires elevated privileges');
            process.exit(1);
            break;
        case 'EADDRINUSE':
            console.error(bind + ' is already in use');
            process.exit(1);
            break;
        default:
            throw error;
    }
}

function onListening() {
    var addr = server.address();
    var bind = typeof addr === 'string'
        ? 'pipe ' + addr
        : 'port ' + addr.port;
    debug('Listening on ' + bind);
}

function renderHtml (filePath, options, callback) { // define the template engine
    fs.readFile(filePath, function (err, content) {
        if (err) return callback(new Error(err));
        var rendered = content.toString();
        return callback(null, rendered);
    });
}
