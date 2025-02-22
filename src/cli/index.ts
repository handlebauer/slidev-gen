import { Command } from 'commander'
import { ProjectAnalyzer } from '../context/analyzer'
import { SlidesGenerator } from '../generators/slides/slides-generator'
import { ConfigManager } from '../utils/config-manager'
import { SlidevGenError } from '../errors/SlidevGenError'
import type { ProjectConfig } from '../config/types'

interface CLIOptions extends Partial<ProjectConfig> {
    apiKey?: string
}

class CLI {
    private readonly program: Command
    private readonly configManager: ConfigManager
    private readonly projectRoot: string

    constructor() {
        this.program = new Command()
        this.projectRoot = process.cwd()
        this.configManager = new ConfigManager(this.projectRoot)
        this.setupProgram()
    }

    private setupProgram(): void {
        this.program
            .name('slidev-gen')
            .description(
                'Generate project-specific presentations using Slidev and LLM technology',
            )
            .version('0.1.1')

        this.setupGenerateCommand()
        this.setupPreviewCommand()
        this.setupDeployCommand()
    }

    private setupGenerateCommand(): void {
        this.program
            .command('generate')
            .description('Generate a new presentation')
            .option('-o, --slides-path <dir>', 'output directory', './.slides')
            .option('-m, --model <model>', 'OpenAI model to use', 'gpt-4')
            .option('-t, --theme <theme>', 'Slidev theme to use', 'default')
            .option('-k, --api-key <key>', 'OpenAI API key')
            .action(async (options: CLIOptions) => {
                try {
                    const config = await this.loadConfig(options)
                    const apiKey = await this.getAPIKey(options.apiKey)

                    // Initialize components
                    const analyzer = new ProjectAnalyzer(this.projectRoot)
                    const generator = new SlidesGenerator(
                        config.slidesPath,
                        apiKey,
                    )

                    // Generate presentation
                    const context = await analyzer.analyze()
                    await generator.generate(context)

                    console.log('✨ Presentation generated successfully!')
                } catch (error) {
                    this.handleError(error)
                }
            })
    }

    private setupPreviewCommand(): void {
        this.program
            .command('preview')
            .description('Preview the generated presentation')
            .action(async () => {
                try {
                    const config = await this.loadConfig({})
                    const generator = new SlidesGenerator(config.slidesPath)
                    await generator.preview()
                } catch (error) {
                    this.handleError(error)
                }
            })
    }

    private setupDeployCommand(): void {
        this.program
            .command('deploy')
            .description('Deploy the presentation')
            .option(
                '-t, --type <type>',
                'deployment type (github, netlify, vercel)',
                'github',
            )
            .option('-d, --domain <domain>', 'custom domain')
            .action(async (options: CLIOptions) => {
                try {
                    const config = await this.loadConfig(options)
                    console.log(
                        `Deploying presentation using ${config.deploymentType}...`,
                    )
                    // TODO: Implement deployment
                    throw new Error('Not implemented')
                } catch (error) {
                    this.handleError(error)
                }
            })
    }

    private async loadConfig(options: CLIOptions): Promise<ProjectConfig> {
        try {
            const baseConfig = await this.configManager.loadConfig()
            return {
                ...baseConfig,
                ...options,
            }
        } catch (error) {
            if (error instanceof Error) {
                throw new SlidevGenError(
                    'InvalidConfiguration',
                    `Failed to load configuration: ${error.message}`,
                    error,
                )
            }
            throw error
        }
    }

    private async getAPIKey(cliKey?: string): Promise<string> {
        // 1. Try CLI provided key
        if (cliKey) return cliKey

        // 2. Try environment variable
        const envKey = process.env.OPENAI_API_KEY
        if (envKey) return envKey

        // 3. If not found, error out
        throw new SlidevGenError(
            'APIKeyMissing',
            'OpenAI API key not found. Please provide it via --api-key or set OPENAI_API_KEY environment variable.',
        )
    }

    private handleError(error: unknown): never {
        if (error instanceof SlidevGenError) {
            console.error(`Error: ${error.message}`)
            if (error.type === 'APIKeyMissing') {
                console.error('\nTip: You can set your API key using:')
                console.error('  export OPENAI_API_KEY=your-key-here')
                console.error('  # or')
                console.error('  slidev-gen generate --api-key your-key-here')
            }
        } else {
            console.error('An unexpected error occurred:', error)
        }
        process.exit(1)
    }

    run(): void {
        this.program.parse()
    }
}

// Export the CLI runner
export const cli = (): void => {
    const runner = new CLI()
    runner.run()
}
