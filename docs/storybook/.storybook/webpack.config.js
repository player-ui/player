const path = require('path');
const TimeFixPlugin = require('time-fix-plugin');
const fs = require('fs');

const webpackConfig = async (initialConfig) => {
  const config = initialConfig.config ?? initialConfig;

  const newConfig = {
    ...config,
    resolve: {
      ...(config.resolve ?? {}),
      symlinks: false,
      cache: false,
      fallback: {
        fs: false,
        util: require.resolve('util/'),
        assert: require.resolve('assert/'),
        path: require.resolve('path-browserify'),
        stream: require.resolve("stream-browserify"),
        constants: require.resolve("constants-browserify")
      },
    },
    plugins: [...config.plugins, new TimeFixPlugin()],
    watch: true,
    watchOptions: {
      followSymlinks: true,
      ignored: ['**/node_modules/**', '**/node_modules'],
      // Necessary to debounce the io from ibazel constantly writing
      aggregateTimeout: 5000,
      // Necessary for HMR to be able to receive the changes
      poll: 4000,
    },
  };

  return newConfig;
};

module.exports = webpackConfig;
