import { $ } from 'bun'
import { config } from '~/config'
import packageJson from './package.json' assert { type: 'json' }

await Bun.build({
    entrypoints: ['./src/index.ts'],
    outdir: './dist',
    target: config.BUILD_TARGET,
    external: Object.keys(packageJson.dependencies),
})

console.log('TypeScript build complete.')

const { stdout, stderr } =
    await $`tsc --emitDeclarationOnly --declaration --project tsconfig.types.json --outDir ./dist`

if (stderr.toString().length) {
    console.error('Type generation errors:', stderr.toString())
} else {
    console.log('Types generated:', stdout.toString())
}
