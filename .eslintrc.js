const arrowContext = 'VariableDeclarator > ArrowFunctionExpression';

module.exports = {
  env: { jest: true, browser: true },

  parser: '@babel/eslint-parser',

  extends: [
    'airbnb',
    'xo',
    'xo-react/space',
    'plugin:jest/recommended',
    'prettier',
  ],

  plugins: [
    'prettier',
    'jest',
    'react-hooks',
    'eslint-plugin-jsdoc',
    '@kendallgassner/eslint-plugin-package-json',
  ],

  settings: {
    'import/resolver': {
      node: {
        extensions: ['.js', '.jsx', '.ts', '.tsx', '.json'],
      },
    },
  },

  overrides: [
    {
      files: ['*.{ts,tsx}'],
      parser: '@typescript-eslint/parser',
      extends: [
        'plugin:@typescript-eslint/recommended',
        'plugin:prettier/recommended',
      ],
      plugins: ['@typescript-eslint', 'eslint-plugin-no-explicit-type-exports'],
      rules: {
        '@typescript-eslint/no-empty-function': 'off',
        '@typescript-eslint/no-namespace': 'off',
        '@typescript-eslint/ban-ts-comment': 'warn',
        'jsdoc/require-jsdoc': [
          'warn',
          {
            require: {
              FunctionDeclaration: true,
              ClassDeclaration: true,
            },
            contexts: ['TSPropertySignature', arrowContext],
          },
        ],
      },
    },
  ],
  rules: {
    // makes commenting out lines quickly a hassle
    'capitalized-comments': 0,
    'react/prop-types': 'off',
    'import/extensions': [
      2,
      'always',
      {
        js: 'never',
        jsx: 'never',
        ts: 'never',
        tsx: 'never',
      },
    ],
    'import/prefer-default-export': 0,

    // This is handled by bazel itself
    'import/no-extraneous-dependencies': 0,
    '@typescript-eslint/no-namespace': 'off',
    'no-continue': 0,
    'max-nested-callbacks': [1, 7],
    'no-underscore-dangle': 0,
    'max-classes-per-file': 0,
    '@typescript-eslint/no-empty-function': 0,
    '@typescript-eslint/ban-types': 0,
    '@typescript-eslint/camelcase': 0,
    camelcase: 0,

    '@typescript-eslint/consistent-type-imports': 'error',
    'no-use-before-define': 'off',
    '@typescript-eslint/no-use-before-define': 'error',
    'no-shadow': 'off',
    '@typescript-eslint/no-shadow': 'error',
    'no-explicit-type-exports/no-explicit-type-exports': 0,

    // 'padding-line-between-statements': [
    //   'warn',
    //   {
    //     blankLine: 'always',
    //     prev: '*',
    //     next: ['return', 'block', 'block-like'],
    //   },
    // ],

    /* xo config */
    'import/no-unassigned-import': [2, { allow: ['**/*.css'] }],
    'import/no-named-as-default': 0,

    /* airbnb */
    '@kendallgassner/package-json/local-dependency': 2,
    // Need to name function for some stringification
    'func-names': 0,
    'import/no-unresolved': [2, { ignore: ['.css$'] }],
    'import/no-duplicates': 0,
    'consistent-return': 0,
    // We have some complicated functions
    complexity: ['error', { max: 50 }],
    // JSDoc comments are used for react docgen so they don't have to be valid
    'valid-jsdoc': 0,
    // DEPRECATED
    'jsx-a11y/label-has-for': 0,
    // use this instead
    'jsx-a11y/label-has-associated-control': 2,
    // Some of our components have a role prop
    'jsx-a11y/aria-role': [
      2,
      {
        ignoreNonDOM: true,
      },
    ],

    // plugins generally do not use this
    'class-methods-use-this': 0,
    // Very common and we like to use it
    'no-plusplus': 0,

    /* jest plugin */

    // This is a pattern devs should use! gimme html attributes or give me death
    'react/jsx-props-no-spreading': 0,
    'react/state-in-constructor': 0,
    'react/static-property-placement': 0,
    'react/jsx-tag-spacing': 0, // from xo
    'react/jsx-indent': 0, // from xo
    'react/sort-comp': 0, // from airbnb
    // Adds a lot of extra code
    'react/destructuring-assignment': 0, // from airbnb
    // Only allow JSX in tsx + js files
    'react/jsx-filename-extension': [
      2,
      { extensions: ['.js', '.jsx', '.tsx'] },
    ],
    'react/default-props-match-prop-types': 2,

    /* jest plugin */

    'jest/valid-title': 2,
    'jest/prefer-strict-equal': 2,
    'jest/prefer-spy-on': 2,
    'jest/no-standalone-expect': 2,
    'jest/no-export': 2,
    'jest/no-duplicate-hooks': 1,
    'jest/no-if': 1,
    'jest/prefer-to-have-length': 1,

    /* jsdoc plugin */

    'jsdoc/check-alignment': 1,
    'jsdoc/check-param-names': 1,
    'jsdoc/check-tag-names': 1,
    'jsdoc/implements-on-classes': 1,
    'jsdoc/newline-after-description': 1,
    'jsdoc/no-types': 1,
    'jsdoc/require-param-description': 1,
    'jsdoc/require-returns-check': 1,
    'jsdoc/require-returns-description': 1,
    'jsdoc/require-hyphen-before-param-description': [1, 'always'],
    curly: 'error',
    'no-warning-comments': [
      1,
      { terms: ['stuff', 'things', 'the player'], location: 'anywhere' },
    ],

    // TODO: Rules that should be errors and fixed but maybe not now eventually
    '@typescript-eslint/no-explicit-any': 'warn',
    'padding-line-between-statements': 'warn',
    'no-control-regex': 'warn',
    'no-unused-expressions': 'warn',
    'react/jsx-no-constructed-context-values': 'warn',
    'react/button-has-type': 'warn',
    'no-restricted-syntax': 'warn',
    '@typescript-eslint/ban-ts-comment': 'warn',
    'jsdoc/require-jsdoc': [
      'warn',
      {
        require: {
          FunctionDeclaration: true,
          ClassDeclaration: true,
        },
        contexts: [arrowContext],
      },
    ],

    // END TODO
  },
};
