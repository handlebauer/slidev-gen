import { config } from '~/config'
import packageJson from './package.json' assert { type: 'json' }

await Bun.build({
    entrypoints: ['./bin/slidev-gen.ts'],
    outdir: './dist',
    target: config.BUILD_TARGET,
    external: [
        ...Object.keys(packageJson.peerDependencies),
        ...Object.keys(packageJson.devDependencies),
        ...Object.keys(packageJson.dependencies),
    ],
})
