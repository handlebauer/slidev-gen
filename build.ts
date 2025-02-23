import packageJson from './package.json' assert { type: 'json' }

await Bun.build({
    entrypoints: ['./bin/slidev-gen.ts'],
    outdir: './dist',
    target: 'node',
    define: {
        'process.env.NODE_ENV': 'production',
    },
    external: [
        ...Object.keys(packageJson.peerDependencies),
        ...Object.keys(packageJson.devDependencies),
        ...Object.keys(packageJson.dependencies),
    ],
    minify: true,
})
