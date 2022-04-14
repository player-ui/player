const webpackFinal = require('./webpack.config');

const config = {
  stories: ['../src/**/*.stories.@(js|mdx|tsx)'],
  webpackFinal,
  addons: ['@storybook/addon-docs', '@player-ui/storybook', 'storybook-dark-mode',],
  typescript: {
    check: false,
    reactDocgen: false,
  },
  framework: '@storybook/react',
  features: {
    emotionAlias: false,
    postcss: false,
  },
  core: {
    builder: 'webpack5',
  },
  refs: {
    '@chakra-ui/react': {
      disable: true,
    },
  },
};

module.exports = config;
