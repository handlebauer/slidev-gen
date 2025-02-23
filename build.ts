import packageJson from './package.json' assert { type: 'json' }

await Bun.build({
    entrypoints: ['./bin/slidev-gen.ts'],
    outdir: './dist',
    target: 'node',
    external: [
        ...Object.keys(packageJson.peerDependencies),
        ...Object.keys(packageJson.devDependencies),
        ...Object.keys(packageJson.dependencies),
    ],
    minify: true,
    define: {
        'process.env.NODE_ENV': "'production'",
    },
})
