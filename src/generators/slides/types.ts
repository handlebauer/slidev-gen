import { z } from 'zod'

export const slideContentSchema = z.object({
    title: z.string().describe('The title of the presentation'),
    headline: z
        .string()
        .describe(
            'The headline of the presentation (a single fragment underneath the title that captures the essence of the project)',
        ),
    sections: z.object({
        overview: z
            .string()
            .describe(
                'An conversational overview of the project in 3 sentences',
            ),
        architecture: z
            .string()
            .describe(
                'A high-level overview of the project architecture, in 3 sentences',
            ),
        features: z
            .array(z.string())
            .describe(
                'The most compelling features of the project, in 1 sentence each',
            ),
        technical: z
            .array(z.string())
            .describe('Technical details of the project, in 1 sentence each'),
        roadmap: z.array(z.string()).describe('Roadmap of the project'),
    }),
    diagrams: z.object({
        architecture: z
            .string()
            .optional()
            .describe('Architecture diagram in mermaid'),
        flowcharts: z
            .array(z.string())
            .optional()
            .describe('Optional flowcharts in mermaid'),
    }),
})

export type SlideContent = z.infer<typeof slideContentSchema>

export interface SlideOutput {
    markdown: string
    assets: string[]
    config: object
    paths: {
        slides: string
        config: string
    }
}

export interface SlideTemplateData {
    headline?: string
    title?: string
    overview?: string
    architecture?: {
        description: string
        diagram?: string
    }
    features?: string[]
    technical?: {
        index: number
        detail: string
        diagram?: string
    }
    roadmap?: string[]
}
