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
        Worker: true
      },
    },
    settings: {
      'import/core-modules': ['bun:test']
    }
  },
  {
    rules: {
      'no-console': 'off',
      '@typescript-eslint/explicit-module-boundary-types': 'off',
      '@typescript-eslint/no-non-null-assertion': 'off',
      '@typescript-eslint/no-unused-vars': [
        'error',
        {
          args: 'all',
          argsIgnorePattern: '^_',
          caughtErrors: 'all',
          caughtErrorsIgnorePattern: '^_',
          destructuredArrayIgnorePattern: '^_',
          varsIgnorePattern: '^_',
          ignoreRestSiblings: true,
        },
      ],
    },
  },
  {
    ignores: ['node_modules/'],
  },
];

// eslint-disable-next-line import/no-default-export
export default eslintConfig;
