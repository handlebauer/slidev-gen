import { z } from 'zod'

export const ProjectConfigSchema = z.object({
    // Presentation settings
    slidesPath: z.string().default('./.slides'),
    model: z.string().default('gpt-4'),
    theme: z.string().default('default'),

    // Deployment settings
    deploymentType: z.enum(['github', 'netlify', 'vercel']).default('github'),
    customDomain: z.string().optional(),
})

export type ProjectConfig = z.infer<typeof ProjectConfigSchema>

export const ErrorTypes = {
    InvalidProjectStructure: 'InvalidProjectStructure',
    APIKeyMissing: 'APIKeyMissing',
    LLMGenerationFailed: 'LLMGenerationFailed',
    DeploymentFailed: 'DeploymentFailed',
    InvalidConfiguration: 'InvalidConfiguration',
} as const

export type ErrorType = keyof typeof ErrorTypes
