import type { ProjectConfig } from '../config/types'
import { ProjectConfigSchema } from '../config/types'
// eslint-disable-next-line @typescript-eslint/no-unused-vars
import { SlidevGenError } from '../errors/SlidevGenError'

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
        // TODO: Load from .slidev-gen.json in project root
        // Return defaults if not found
        // Throw InvalidConfiguration if file exists but is invalid
        return ProjectConfigSchema.parse({})
    }

    async saveConfig(config: ProjectConfig): Promise<void> {
        // TODO: Save to .slidev-gen.json in project root
        void config
        throw new Error('Not implemented')
    }
}
