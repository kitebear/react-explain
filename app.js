const webpack = require('webpack')
const WebpackDevServer = require('webpack-dev-server')

const config = require("./webpack.config.js", "webpack/hot/dev-server")
const compiler = webpack(config)

const server = new WebpackDevServer(compiler,{
    hot: true
})

server.listen(8080)