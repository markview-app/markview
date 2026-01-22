const { merge } = require('webpack-merge');
const common = require('./webpack.common.cjs');

module.exports = merge(common, {
  mode: 'development',

  devtool: 'inline-source-map',

  // Watch options
  watch: true,
  watchOptions: {
    ignored: /node_modules/,
    aggregateTimeout: 300
  },

  // Faster builds
  optimization: {
    minimize: false,
    removeAvailableModules: false,
    removeEmptyChunks: false,
    splitChunks: false
  }
});
