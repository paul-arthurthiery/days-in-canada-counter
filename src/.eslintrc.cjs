module.exports = {
  root: true,
  parser: '@typescript-eslint/parser',
  parserOptions: {
    ecmaVersion: 'latest',
    sourceType: 'module',
    project: 'tsconfig.json',
    tsconfigRootDir: 'src',
    ecmaFeatures: {
      jsx: true,
    },
  },
  settings: {
    react: {
      version: 'detect',
    },
    'import/parsers': {
      '@typescript-eslint/parser': ['.ts', '.tsx'],
    },
    'import/resolver': {
      typescript: {
        alwaysTryTypes: true,
        project: '<root>/src/tsconfig.json',
      },
    },
  },
  env: {
    browser: true,
    es2021: true,
  },
  extends: [
    'eslint:recommended',
    'plugin:react/recommended',
    'plugin:react-hooks/recommended',
    'plugin:import/recommended',
    'plugin:@typescript-eslint/eslint-recommended',
    'plugin:@typescript-eslint/recommended',
    'plugin:prettier/recommended',
    'airbnb',
    'airbnb-typescript',
    'prettier',
  ],
  plugins: ['import', 'prettier', '@typescript-eslint', 'react', 'baseui'],
  rules: {
    'prettier/prettier': [
      'error',
      {},
      {
        usePrettierrc: true,
      },
    ],
    'import/order': [
      'error',
      {
        groups: ['builtin', 'external', 'parent', 'sibling', 'index'],
        pathGroups: [
          {
            pattern: 'react',
            group: 'external',
            position: 'before',
          },
        ],
        pathGroupsExcludedImportTypes: ['react'],
        'newlines-between': 'always',
        alphabetize: {
          order: 'asc',
          caseInsensitive: true,
        },
      },
    ],
    'import/prefer-default-export': 'off',
    'import/no-unresolved': 'error',
    'import/no-named-as-default-member': 'off',
    'react-hooks/exhaustive-deps': 'off',
    'react/prop-types': 'off',
    'react/react-in-jsx-scope': 'off',
    'implicit-arrow-linebreak': 'off',
    'react/function-component-definition': [
      2,
      {
        namedComponents: 'arrow-function',
        unnamedComponents: 'arrow-function',
      },
    ],
    'max-len': ['error', { code: 120 }],
    'baseui/deprecated-theme-api': 'warn',
    'baseui/deprecated-component-api': 'warn',
    'baseui/no-deep-imports': 'warn',
    'react/no-unstable-nested-components': 'off',
    'react/require-default-props': 'off',
  },
  ignorePatterns: ['*.cjs'],
};
