const path = require('path');
const TerserPlugin = require('terser-webpack-plugin');
const DuplicatePackageCheckerPlugin = require('duplicate-package-checker-webpack-plugin');
const CaseSensitivePathsPlugin = require('case-sensitive-paths-webpack-plugin');

module.exports = (env, argv) => ({
  mode: argv.mode,
  devtool: 'none',
  output: {
    path: path.resolve(process.cwd(), 'dist'),
    filename: process.env.ROOT_FILE_NAME,
    globalObject: 'this',
    library: process.env.LIBRARY_NAME,
    // libraryExport: process.env.LIBRARY_NAME,
    libraryTarget: 'umd',
  },

  optimization: {
    minimizer: [
          new TerserPlugin({
            terserOptions: {
              ecma: 5,
              compress: {
                warnings: false,
                comparisons: false,
                inline: 2,
              },
              mangle: {
                safari10: true,
              },
              output: {
                ecma: 5,
                comments: false,
                ascii_only: true,
              },
            },
            parallel: true,
            cache: true,
            sourceMap: true,
          }),
        ],
  },

  plugins: [
    new CaseSensitivePathsPlugin(),
    new DuplicatePackageCheckerPlugin(),
  ],
})