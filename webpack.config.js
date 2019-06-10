var path = require('path');
var webpack = require('webpack');

var host = '0.0.0.0';
var port = 3000;

module.exports = {
    devtool: 'eval',
    entry: [
        'react-hot-loader/patch',
        'webpack-dev-server/client?http://' + host + ':' + port,
        'webpack/hot/only-dev-server',
        './src/index'
    ],
    output: {
        path: path.join(__dirname, 'dist'),
        filename: 'bundle.js',
        publicPath: '/static/'
    },
    mode: 'development',
    plugins: [
        new webpack.HotModuleReplacementPlugin()
    ],
    module: {
        rules: [
            {
                test: /\.js$/,
                loaders: ['babel-loader'],
                include: path.join(__dirname, 'src')
            },
            {
                test: /\.css$/,
                loaders: ["style-loader", "css-loader"],
                include: path.join(__dirname, 'src')
            },
            {
                test: /\.sass$/,
                loaders: ["style-loader", "css-loader", "sass-loader?indentedSyntax=sass"],
                include: path.join(__dirname, 'src')
            },
            {
                test: /\.json$/,
                loaders: ["file-loader"],
                include: path.join(__dirname, 'static')
            }
        ]
    }
};
