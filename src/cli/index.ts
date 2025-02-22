import { Command } from 'commander'

const program = new Command()

interface CLIOptions {
    outputDir: string
    model: string
    theme: string
    apiKey?: string
}

program
    .name('slidev-gen')
    .description(
        'Generate project-specific presentations using Slidev and LLM technology',
    )
    .version('0.1.1')

program
    .command('generate')
    .description('Generate a new presentation')
    .option('-o, --output-dir <dir>', 'output directory', './slides')
    .option('-m, --model <model>', 'OpenAI model to use', 'gpt-4')
    .option('-t, --theme <theme>', 'Slidev theme to use', 'default')
    .option('-k, --api-key <key>', 'OpenAI API key')
    .action(async (options: CLIOptions) => {
        try {
            // TODO: Use options when implementing generation logic
            void options // Temporary to avoid unused variable warning
            console.log('Generating presentation...')
        } catch (error) {
            console.error('Failed to generate presentation:', error)
            process.exit(1)
        }
    })

program
    .command('preview')
    .description('Preview the generated presentation')
    .action(async () => {
        try {
            // TODO: Implement preview logic
            console.log('Starting preview...')
        } catch (error) {
            console.error('Failed to start preview:', error)
            process.exit(1)
        }
    })

program
    .command('deploy')
    .description('Deploy the presentation')
    .action(async () => {
        try {
            // TODO: Implement deployment logic
            console.log('Deploying presentation...')
        } catch (error) {
            console.error('Failed to deploy presentation:', error)
            process.exit(1)
        }
    })

export const cli = (): void => {
    program.parse()
}
