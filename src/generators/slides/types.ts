import { z } from 'zod'

export const slideContentSchema = z.object({
    title: z.string(),
    sections: z.object({
        overview: z.string(),
        architecture: z.string(),
        features: z.array(z.string()),
        technical: z.array(z.string()),
        roadmap: z.array(z.string()),
    }),
    diagrams: z.object({
        architecture: z.string().optional(),
        flowcharts: z.array(z.string()).optional(),
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
