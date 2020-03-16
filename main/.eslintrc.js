module.exports = {
  extends: ['@ofa2/eslint-config'],
  parserOptions: {
    project: ['./tsconfig.json'],
  },
  globals: {},
  rules: {
    'no-console': ['off'],
    'no-underscore-dangle': ['error', { allow: ['_id'] }],
  },
  settings: {
    'import/core-modules': ['electron'],
  },
};
