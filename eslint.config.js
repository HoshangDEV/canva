//  @ts-check

import { tanstackConfig } from '@tanstack/eslint-config'

/** @type {import('eslint').Linter.Config[]} */
export default [
  ...tanstackConfig,
  {
    rules: {
      'import/order': 'off',
      'sort-imports': 'off',
      'import/consistent-type-specifier-style': 'off',
      '@typescript-eslint/consistent-type-imports': 'off',
      '@typescript-eslint/no-unnecessary-condition': 'off',
      '@typescript-eslint/array-type': 'off',
    },
  },
]
