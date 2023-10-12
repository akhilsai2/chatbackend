const path = require('path')

module.export = {
    entry: {
        main: "./index.js"
    },
    output: {
        path: path.join(__dirname, "dev-build"),
        publicPath: "/",
        filename: "main.js",
        clean: true
    },
    mode: "development",
    target: 'node',
    module: {
        rules: [
            {
                test: /\.js$/,
                exclude: /node_modules/,
                loader: "babel-loader"
            }
        ]
    }
}