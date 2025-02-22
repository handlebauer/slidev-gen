import { generateText } from 'ai'
import { openai } from '@ai-sdk/openai'
import type { ProjectContext } from '../context/types'

interface SlideContent {
    title: string
    sections: {
        overview: string
        architecture: string
        features: string[]
        technical: string[]
        roadmap: string[]
    }
    diagrams: {
        architecture?: string // mermaid syntax
        flowcharts?: string[] // mermaid syntax
    }
}

interface SlideOutput {
    markdown: string
    assets: string[]
    config: object
}

export class SlidesGenerator {
    constructor(private readonly outputDir: string) {}

    async generate(context: ProjectContext): Promise<SlideOutput> {
        const content = await this.generateContent(context)
        return this.generateOutput(content)
    }

    private async generateContent(
        context: ProjectContext,
    ): Promise<SlideContent> {
        const { text } = await generateText({
            model: openai('gpt-4o-mini'),
            system: 'You are a technical presentation expert. Generate clear, concise slides that effectively communicate technical concepts.',
            prompt: `Generate a presentation based on the following project context: ${JSON.stringify(context)}`,
            maxSteps: 3,
            experimental_continueSteps: true,
        })

        return JSON.parse(text) as SlideContent
    }

    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    private async generateOutput(content: SlideContent): Promise<SlideOutput> {
        // TODO: Implement markdown generation from content
        throw new Error('Not implemented')
    }
}
