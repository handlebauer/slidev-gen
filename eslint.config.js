import eslint from '@eslint/js'
import prettierConfig from 'eslint-config-prettier'
import eslintPluginPrettier from 'eslint-plugin-prettier'
import * as tseslint from 'typescript-eslint'

export default [
    {
        ignores: ['**/node_modules/**', '**/dist/**', '**/.slides/**'],
    },
    eslint.configs.recommended,
    ...tseslint.configs.recommended,
    {
        files: ['**/*.{js,mjs,cjs,ts,tsx}'],
        plugins: {
            '@typescript-eslint': tseslint.plugin,
            prettier: eslintPluginPrettier,
        },
        languageOptions: {
            parser: tseslint.parser,
            parserOptions: {
                ecmaVersion: 'latest',
                sourceType: 'module',
            },
        },
        rules: {
            'prettier/prettier': 'error',
            '@typescript-eslint/no-unused-expressions': [
                'error',
                { allowTaggedTemplates: true },
            ],
        },
    },
    prettierConfig,
]
