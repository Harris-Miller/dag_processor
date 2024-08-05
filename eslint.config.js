/* eslint-disable sort-keys-fix/sort-keys-fix */
import harrisConfigBase from 'eslint-config-harris/base';
import globals from 'globals';

/** @type {import('eslint').Linter.FlatConfig[]} */
const eslintConfig = [
  ...harrisConfigBase,
  {
    languageOptions: {
      globals: {
        ...globals.nodeBuiltin,
        Bun: true,
      },
    },
  },
  {
    rules: {
      'no-console': 'off',
      '@typescript-eslint/explicit-module-boundary-types': 'off',
      '@typescript-eslint/no-non-null-assertion': 'off',
    },
  },
  {
    files: ['lib/searchAlgorithms/**'],
    rules: {
      'func-style': 'off',
      'no-continue': 'off',
    },
  },
  {
    ignores: ['node_modules/'],
  },
];

// eslint-disable-next-line import/no-default-export
export default eslintConfig;
