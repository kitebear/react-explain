const webpack   = require('webpack');
const path      = require('path');
const main_path = path.resolve("react-learn");

module.exports = {
    //devtool: 'cheap-module-eval-source-map',
    //页面入口
    entry: {
        'vendor'      : [],
        'react1'        : [main_path + '/react1/entry.js'],
        'app'         : 'webpack-dev-server/client?http://localhost:8080/'
    },
    //出口文件输出配置
    output: {
        path: path.resolve("dist"),
        filename: '[name].js'
    },
    //加载器
    module: {
        loaders: [
            {
                test: /\.scss$/,
                loader: "style-loader!css-loader!sass-loader"
            },
            {
                test:/\.jsx|js$/,
                exclude:/(node_modules)/,
                loader: ['babel'],
                query:{
                    presets:['es2015', 'stage-0']
                }
            },
            {test: /\.css$/, loader: "style-loader!css-loader"},
            {test: /\.png$/, loader: "url-loader?prefix=img/&limit=5000"},
            {test: /\.jpg$/, loader: "url-loader?prefix=img/&limit=5000"},
            {test: /\.gif$/, loader: "url-loader?prefix=img/&limit=5000"},
            {test: /\.woff$/, loader: "url-loader?prefix=font/&limit=5000"}
        ]
    },
    plugins: [
        new webpack.HotModuleReplacementPlugin()
    ],
    sourceMap: true, //源支持
    resolve: {
        root: [
            __dirname+ '/react-learn/',
            path.join(__dirname, 'dist'),
            path.join(__dirname, 'node_modules')
        ],
        extensions: ['', '.js', '.scss','.jsx'],
        alias: {
            //move_img : "plugins/moveimg/move_img.js"
        }
    }
};
