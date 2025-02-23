import { mkdir, readFile, writeFile } from 'fs/promises'
import { dirname } from 'path'

import { ZodError } from 'zod'

import { ProjectConfigSchema } from '../config/types'
import { SlidevGenError } from '../errors/SlidevGenError'
import { logger } from './logger'

import type { ProjectConfig } from '../config/types'

/**
 * Manages project-specific configuration including presentation and deployment settings.
 * API keys are always provided via CLI or environment variables.
 */
export class ConfigManager {
    private readonly configPath: string

    constructor(private readonly projectRoot: string) {
        this.configPath = `${projectRoot}/.slidev-gen.json`
    }

    async loadConfig(): Promise<ProjectConfig> {
        try {
            try {
                // Try to read and parse config file using Node.js fs/promises
                const fileContent = await readFile(this.configPath, 'utf-8')
                const parsedConfig = JSON.parse(fileContent)

                // Validate and parse with zod schema
                return ProjectConfigSchema.parse(parsedConfig)
            } catch (error) {
                if ((error as NodeJS.ErrnoException).code === 'ENOENT') {
                    logger.info('No configuration file found, using defaults')
                    return ProjectConfigSchema.parse({})
                }
                throw error
            }
        } catch (error: unknown) {
            if (error instanceof SyntaxError) {
                throw new SlidevGenError(
                    'InvalidConfiguration',
                    'Configuration file contains invalid JSON',
                    error,
                )
            }

            if (error instanceof SlidevGenError) {
                throw error
            }

            throw new SlidevGenError(
                'InvalidConfiguration',
                'Failed to load configuration',
                error instanceof Error ? error : new Error(String(error)),
            )
        }
    }

    async saveConfig(config: ProjectConfig): Promise<void> {
        try {
            // Validate config before saving
            try {
                const validatedConfig = ProjectConfigSchema.parse(config)

                // Ensure directory exists
                await mkdir(dirname(this.configPath), { recursive: true })

                // Pretty print JSON for better readability
                const configString = JSON.stringify(validatedConfig, null, 2)

                await writeFile(this.configPath, configString, 'utf-8')
                logger.info('Configuration saved successfully')
            } catch (error) {
                if (error instanceof ZodError) {
                    throw new SlidevGenError(
                        'InvalidConfiguration',
                        `Invalid configuration format: ${error.errors.map(e => e.message).join(', ')}`,
                        error,
                    )
                }
                throw error
            }
        } catch (error: unknown) {
            if (error instanceof SlidevGenError) {
                throw error
            }

            throw new SlidevGenError(
                'InvalidConfiguration',
                'Failed to save configuration',
                error instanceof Error ? error : new Error(String(error)),
            )
        }
    }
}
