import register from '@babel/register';

/** Register a `require()` loader for any of the given paths */
export const registerForPaths = () => {
  register({
    extensions: ['.es6', '.es', '.jsx', '.js', '.mjs', '.tsx', '.ts'],

    presets: [
      ['@babel/preset-env', { modules: 'cjs' }],
      '@babel/preset-typescript',
      '@babel/preset-react',
    ],
    plugins: ['@babel/plugin-transform-react-jsx-source'],
  });
};
