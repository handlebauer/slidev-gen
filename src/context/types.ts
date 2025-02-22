import { z } from 'zod'

export const ProjectContextSchema = z.object({
    documentation: z.object({
        readme: z.string(),
        additionalDocs: z.array(z.string()),
    }),
    dependencies: z.object({
        packageManager: z.enum(['npm', 'yarn', 'pnpm', 'bun']),
        packages: z.record(z.string()),
    }),
    git: z.object({
        recentCommits: z.array(z.string()),
        majorChanges: z.array(z.string()),
        contributors: z.array(z.string()),
    }),
    codebase: z.object({
        mainLanguages: z.array(z.string()),
        fileStructure: z.string(),
        significantFiles: z.array(z.string()),
    }),
})

export type ProjectContext = z.infer<typeof ProjectContextSchema>
