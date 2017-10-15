var path = require('path');
var webpack = require('webpack');
var path = require('path');
var webpack = require('webpack');
console.log(path.resolve(__dirname, 'dist'));
module.exports = {
  entry: [
    'babel-polyfill',
    './src/assets/js/app.js',
  ],
  output: {
    filename: 'bundle.js',
    path: path.resolve(__dirname, 'dist/assets/js/')
  },
  module: {
    loaders: [
      {
        test: /\.js$/,
        include: path.join(__dirname, 'src'),
        loader: 'babel-loader',
        query: {
          presets: ["es2015"],
        }
      }
    ]
  }
};
