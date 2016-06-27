var webpack = require('webpack');
var WebpackDevServer = require('webpack-dev-server');
var config = require('./webpack.config');
var host = '0.0.0.0';
var port = 3000;

var server = new WebpackDevServer(webpack(config), {
    publicPath: config.output.publicPath,
    hot: true,
    historyApiFallback: true
})
    
server.listen(port, host, function (err, result) {
    if (err) {
        return console.log(err);
    }

    console.log('Listening at http:// ' + host + ':' + port + '/');
});
