import { Command } from 'commander'
import ora, { type Ora } from 'ora'

import { ProjectAnalyzer } from '../context/analyzer'
import { SlidevGenError } from '../errors/SlidevGenError'
import { SlidesGenerator } from '../generators/slides/slides-generator'
import { ConfigManager } from '../utils/config-manager'

import packageJson from '../../package.json' assert { type: 'json' }

import type { ProjectConfig } from '../config/types'

interface CLIOptions extends Partial<ProjectConfig> {
    apiKey?: string
    dev?: boolean
}

class CLI {
    private readonly program: Command
    private readonly configManager: ConfigManager
    private readonly projectRoot: string
    private spinner: Ora | null = null

    constructor() {
        this.program = new Command()
        this.projectRoot = process.cwd()
        this.configManager = new ConfigManager(this.projectRoot)
        this.setupProgram()
    }

    private log(message: string): void {
        console.log(message)
    }

    private info(message: string): void {
        this.log(message)
    }

    private error(message: string): void {
        console.error(message)
    }

    private startSpinner(text: string): void {
        this.spinner = ora({
            text,
            color: 'blue',
            spinner: 'dots',
        }).start()
    }

    private succeedSpinner(text: string): void {
        if (this.spinner) {
            this.spinner.succeed(text)
            this.spinner = null
        }
    }

    private failSpinner(text: string): void {
        if (this.spinner) {
            this.spinner.fail(text)
            this.spinner = null
        }
    }

    private setupProgram(): void {
        this.program
            .name('slidev-gen')
            .description(
                'Generate project-specific presentations using Slidev and LLM technology',
            )
            .version(packageJson.version)

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
            .option(
                '-d, --dev',
                'Run in development mode (no LLM calls)',
                false,
            )
            .action(async (options: CLIOptions) => {
                try {
                    if (options.dev) {
                        this.info(
                            '🛠️  Running in development mode (no LLM calls)',
                        )
                    }
                    this.info('🚀 Starting presentation generation...')
                    this.info('')

                    this.startSpinner('Loading configuration...')
                    const config = await this.loadConfig(options)
                    if (!options.dev) {
                        await this.getAPIKey(options.apiKey)
                    }
                    await this.simulateDelay(800)
                    this.succeedSpinner('Configuration loaded successfully')

                    // Initialize components
                    this.startSpinner('Initializing project analyzer...')
                    const analyzer = new ProjectAnalyzer(this.projectRoot)
                    const generator = new SlidesGenerator(
                        config.slidesPath,
                        options.dev ? 'dev-mode' : options.apiKey,
                    )
                    await this.simulateDelay(600)
                    this.succeedSpinner('Components initialized successfully')

                    // Generate presentation
                    this.startSpinner('Analyzing project structure...')
                    const context = options.dev
                        ? (await this.simulateDelay(2000),
                          this.getMockContext())
                        : await analyzer.analyze()
                    this.succeedSpinner('Project analysis complete')

                    this.startSpinner('Generating presentation content...')
                    if (!options.dev) {
                        await generator.generate(context)
                    } else {
                        // Simulate longer LLM generation time in dev mode
                        await this.simulateDelay(3000)
                    }
                    this.succeedSpinner('Presentation generated successfully')

                    this.info('\n✨ All done! Your presentation is ready!')
                    if (options.dev) {
                        this.info(
                            '🛠️  Note: This was a development mode run (no actual content generated)',
                        )
                    }
                    this.info(`📁 Location: ${config.slidesPath}`)
                    this.info(
                        '💡 Tip: Run `slidev-gen preview` to view your presentation',
                    )
                } catch (error) {
                    this.failSpinner('Generation failed')
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

    private async simulateDelay(ms: number = 1000): Promise<void> {
        await new Promise(resolve => setTimeout(resolve, ms))
    }

    private getMockContext() {
        return {
            documentation: {
                readme: '# Mock Project\nThis is a mock project for development mode.',
                additionalDocs: ['docs/mock.md'],
            },
            dependencies: {
                packageManager: 'bun' as const,
                packages: {
                    'mock-package': '^1.0.0',
                },
            },
            git: {
                recentCommits: ['feat: mock commit'],
                majorChanges: ['Initial mock setup'],
                contributors: ['Developer'],
            },
            codebase: {
                mainLanguages: ['TypeScript'],
                fileStructure:
                    'src/\n  cli/\n    index.ts\n  utils/\n    logger.ts',
                significantFiles: ['src/cli/index.ts', 'src/utils/logger.ts'],
            },
        }
    }

    private handleError(error: unknown): never {
        if (error instanceof SlidevGenError) {
            this.error(`❌ ${error.message}`)
        } else {
            this.error('❌ An unexpected error occurred:')
            this.error(error instanceof Error ? error.message : String(error))
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
