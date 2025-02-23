const sortImports = {
    importOrder: [
        '^(node:(.*)$)|^(node$)',
        '',
        '<THIRD_PARTY_MODULES>',
        '',
        '^[./]',
        '',
        '<TYPES>^(node:)',
        '<TYPES>',
        '<TYPES>^[.]',
    ],
}
export default {
    plugins: ['@ianvs/prettier-plugin-sort-imports'],
    ...sortImports,

    trailingComma: 'all',
    singleQuote: true,
    printWidth: 80,
    tabWidth: 4,
    arrowParens: 'avoid',
    semi: false,
}
