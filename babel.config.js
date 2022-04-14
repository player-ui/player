module.exports = (api) => ({
  // extensions: [],
  presets: [
    ['@babel/preset-env', { modules: api.env('module') ? false : 'auto' }],
    require.resolve('@babel/preset-typescript'),
    require.resolve('@babel/preset-react'),
  ],
  plugins: [
    [
      '@babel/plugin-transform-runtime',
      {
        regenerator: true,
        version: '7.15.4',
      },
    ],
  ],
});
