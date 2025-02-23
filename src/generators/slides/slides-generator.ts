import { mkdir, writeFile } from 'node:fs/promises'
import { join } from 'node:path'

import { createOpenAI } from '@ai-sdk/openai'
import { generateObject } from 'ai'
import dedent from 'dedent'
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
    private openai: ReturnType<typeof createOpenAI> | undefined

    constructor(
        private readonly outputDir: string,
        private readonly apiKey?: string,
    ) {}

    private initializeOpenAI(): ReturnType<typeof createOpenAI> {
        if (!this.openai) {
            const key = this.resolveApiKey(this.apiKey)
            this.openai = createOpenAI({
                apiKey: key,
                compatibility: 'strict',
            })
        }
        return this.openai
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
            await execa(
                'npm',
                [
                    'install',
                    '--save-dev',
                    '@slidev/cli',
                    '@slidev/theme-default',
                ],
                { stdio: 'inherit' },
            )
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
        // In dry-run mode, return mock content
        if (this.apiKey === 'dry-run') {
            return {
                headline: 'Mock headline for dry run',
                title:
                    context.documentation.readme.content
                        .split('\n')[0]
                        .replace('# ', '') || 'Project Overview',
                sections: {
                    overview: 'Mock overview for dry run',
                    architecture: 'Mock architecture description',
                    features: ['Mock Feature 1', 'Mock Feature 2'],
                    technical: [
                        'Mock Technical Detail 1',
                        'Mock Technical Detail 2',
                    ],
                    roadmap: ['Mock Roadmap Item 1', 'Mock Roadmap Item 2'],
                },
                diagrams: {
                    architecture: 'graph TD\nA[Project] --> B[Components]',
                    flowcharts: ['graph LR\nX --> Y'],
                },
            }
        }

        const openai = this.initializeOpenAI()
        const { object } = await generateObject({
            model: openai('gpt-4o-mini'),
            system: dedent`
                You are a technical presentation expert. Generate clear, concise slides that effectively communicate technical concepts.
            `,
            prompt: dedent`
                Generate presentation data based on the following project context.
                
                Remember to format all text with proper newlines and spacing for readability.
                
                ${JSON.stringify(context)}
            `,
            schema: slideContentSchema,
        })

        return object as SlideContent
    }

    private async generateOutput(content: SlideContent): Promise<SlideOutput> {
        const slides: string[] = []

        // Convert SlideContent to SlideTemplateData format
        const templateData: SlideTemplateData = {
            title: content.title,
            headline: content.headline,
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

        // Generate technical slides with smart grouping
        if (content.sections.technical.length > 0) {
            // Add technical section header
            slides.push(createSlide(templates.technicalHeader, templateData))

            // Group technical details (max 3 per slide)
            for (let i = 0; i < content.sections.technical.length; i += 3) {
                const groupDetails = content.sections.technical.slice(i, i + 3)
                const groupDiagrams =
                    content.diagrams.flowcharts?.slice(i, i + 3) || []

                // Generate a descriptive title for this group
                const groupTitle =
                    i === 0
                        ? 'Core Technical Features'
                        : i <= 3
                          ? 'Implementation Details'
                          : 'Advanced Technical Concepts'

                const technicalData: SlideTemplateData = {
                    technical: {
                        title: groupTitle,
                        details: groupDetails,
                        diagrams: groupDiagrams,
                    },
                }

                // Choose appropriate layout based on content
                const hasDigrams = groupDiagrams.length > 0
                const template = hasDigrams
                    ? templates.technicalWithDiagram
                    : templates.technicalGroup
                slides.push(createSlide(template, technicalData))
            }
        }

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
        await execa('npx', ['slidev', join(this.outputDir, 'slides.md')], {
            stdio: 'inherit',
        })
    }

    /**
     * Build the slides for production
     * @param outDir Optional output directory for the built files (defaults to 'dist')
     */
    async build(outDir = 'dist'): Promise<void> {
        await this.ensureSlidevInstalled()
        await execa(
            'npx',
            [
                'slidev',
                'build',
                join(this.outputDir, 'slides.md'),
                '--out',
                outDir,
            ],
            {
                stdio: 'inherit',
            },
        )
    }

    /**
     * Export the slides to PDF
     * @param outputPath Path for the PDF file
     */
    async exportPDF(outputPath: string): Promise<void> {
        await this.ensureSlidevInstalled()
        await execa(
            'npx',
            [
                'slidev',
                'export',
                join(this.outputDir, 'slides.md'),
                '--output',
                outputPath,
            ],
            {
                stdio: 'inherit',
            },
        )
    }
}
