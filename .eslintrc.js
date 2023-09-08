module.exports = {
  env: {
    browser: true,
    commonjs: true,
    es2021: true,
  },
  extends: 'airbnb-base',
  overrides: [
    {
      env: {
        node: true,
      },
      files: [
        '.eslintrc.{js,cjs}',
      ],
      parserOptions: {
        sourceType: 'script',
      },
    },
  ],
  parserOptions: {
    ecmaVersion: 'latest',
  },
  rules: {
    'linebreak-style': ['error', 'windows'],
    'no-console': 'off',
    'no-unused-vars': ['warn', { argsIgnorePattern: 'req|res|next|val' }],
    'consistent-return': 'warn',
  },
  'import/no-extraneous-dependencies': [
    'error',
    {
      projectDependencies: false,
    },
  ],
};
