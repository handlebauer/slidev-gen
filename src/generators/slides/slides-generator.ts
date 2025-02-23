import { mkdir, writeFile } from 'node:fs/promises'
import { join } from 'node:path'

import { createOpenAI } from '@ai-sdk/openai'
import { generateObject } from 'ai'
import { execa } from 'execa'

import {
    createSlide,
    defaultConfig,
    templates,
} from './templates/slide-templates'
import { slideContentSchema } from './types'

import type { ProjectContext } from '../../context/types'
import type { SlideContent, SlideOutput, SlideTemplateData } from './types'

export class SlidesGenerator {
    private readonly openai

    constructor(
        private readonly outputDir: string,
        apiKey?: string,
    ) {
        this.openai = createOpenAI({
            apiKey: this.resolveApiKey(apiKey),
            compatibility: 'strict',
        })
    }

    private resolveApiKey(providedKey?: string): string {
        const key = providedKey ?? process.env.OPENAI_API_KEY
        if (!key) {
            throw new Error(
                'OpenAI API key must be provided either as constructor argument or in process.env.OPENAI_API_KEY',
            )
        }
        return key
    }

    private async ensureSlidevInstalled(): Promise<void> {
        try {
            // Try to dynamically import @slidev/cli to check if it's available
            await import('@slidev/cli')
        } catch (error) {
            console.error(error)
            console.log('Installing required Slidev dependencies...')
            // Install both @slidev/cli and theme as temporary dependencies
            await execa('npm', [
                'install',
                '--save-dev',
                '@slidev/cli',
                '@slidev/theme-default',
            ])
            console.log('Slidev dependencies installed successfully')
        }
    }

    async generate(context: ProjectContext): Promise<SlideOutput> {
        const content = await this.generateContent(context)
        const output = await this.generateOutput(content)
        await this.writeOutput(output)

        // Return the paths to the generated files along with the output
        return {
            ...output,
            paths: {
                slides: join(this.outputDir, 'slides.md'),
                config: join(this.outputDir, 'slidev.config.ts'),
            },
        }
    }

    private async generateContent(
        context: ProjectContext,
    ): Promise<SlideContent> {
        const { object } = await generateObject({
            model: this.openai('gpt-4o-mini'),
            system: 'You are a technical presentation expert. Generate clear, concise slides that effectively communicate technical concepts.',
            prompt: `Generate presentation data based on the following project context: ${JSON.stringify(context)}`,
            schema: slideContentSchema,
        })

        return object as SlideContent
    }

    private async generateOutput(content: SlideContent): Promise<SlideOutput> {
        const slides: string[] = []

        // Convert SlideContent to SlideTemplateData format
        const templateData: SlideTemplateData = {
            title: content.title,
            overview: content.sections.overview,
            architecture: {
                description: content.sections.architecture,
                diagram: content.diagrams.architecture,
            },
            features: content.sections.features,
            roadmap: content.sections.roadmap,
        }

        // Generate title slide
        slides.push(createSlide(templates.cover, templateData))

        // Generate overview slide
        slides.push(createSlide(templates.overview, templateData))

        // Generate architecture slide
        slides.push(createSlide(templates.architecture, templateData))

        // Generate features slide
        slides.push(createSlide(templates.features, templateData))

        // Generate technical slides
        slides.push(createSlide(templates.technicalHeader, templateData))

        content.sections.technical.forEach((detail, index) => {
            const technicalData: SlideTemplateData = {
                technical: {
                    index,
                    detail,
                    diagram: content.diagrams.flowcharts?.[index],
                },
            }
            slides.push(createSlide(templates.technicalDetail, technicalData))
        })

        // Generate roadmap slide
        slides.push(createSlide(templates.roadmap, templateData))

        // Filter out empty slides and join with newlines
        const markdown = slides.filter(Boolean).join('\n\n')

        return {
            markdown,
            assets: [], // We'll handle assets later if needed
            config: defaultConfig,
            paths: {
                slides: join(this.outputDir, 'slides.md'),
                config: join(this.outputDir, 'slidev.config.ts'),
            },
        }
    }

    private async writeOutput(output: SlideOutput): Promise<void> {
        // Ensure output directory exists
        await mkdir(this.outputDir, { recursive: true })

        // Write the slides markdown
        await writeFile(join(this.outputDir, 'slides.md'), output.markdown)

        // Write the Slidev config
        await writeFile(
            join(this.outputDir, 'slidev.config.ts'),
            `export default ${JSON.stringify(output.config, null, 2)}`,
        )

        // If we have any assets, write them too
        if (output.assets.length > 0) {
            const assetsDir = join(this.outputDir, 'assets')
            await mkdir(assetsDir, { recursive: true })

            // TODO: Implement asset writing when we add asset support
        }
    }

    /**
     * Preview the slides in development mode
     */
    async preview(): Promise<void> {
        await this.ensureSlidevInstalled()
        await execa('npx', ['slidev', join(this.outputDir, 'slides.md')])
    }

    /**
     * Build the slides for production
     * @param outDir Optional output directory for the built files (defaults to 'dist')
     */
    async build(outDir = 'dist'): Promise<void> {
        await this.ensureSlidevInstalled()
        await execa('npx', [
            'slidev',
            'build',
            join(this.outputDir, 'slides.md'),
            '--out',
            outDir,
        ])
    }

    /**
     * Export the slides to PDF
     * @param outputPath Path for the PDF file
     */
    async exportPDF(outputPath: string): Promise<void> {
        await this.ensureSlidevInstalled()
        await execa('npx', [
            'slidev',
            'export',
            join(this.outputDir, 'slides.md'),
            '--output',
            outputPath,
        ])
    }
}
