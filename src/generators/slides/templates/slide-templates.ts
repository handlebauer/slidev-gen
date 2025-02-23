import dedent from 'dedent'

import type { SlideTemplateData } from '../types'

interface SlideTemplate {
    layout: string
    content: string | ((data: SlideTemplateData) => string)
}

export const templates: Record<string, SlideTemplate> = {
    cover: {
        layout: 'cover',
        content: (data: SlideTemplateData) => dedent`
            # ${data.title}

            ${data.headline}
        `,
    },

    overview: {
        layout: 'center',
        content: (data: SlideTemplateData) => dedent`
            # Overview

            ${data.overview}`,
    },

    architecture: {
        layout: 'cover',
        content: (data: SlideTemplateData) => {
            const arch = data.architecture
            if (!arch) return ''

            return dedent`
                # Architecture

                ${arch.description}

                <br>
                
                ${
                    arch.diagram
                        ? dedent`
                    \`\`\`mermaid
                    ${arch.diagram}
                    \`\`\`
                `
                        : ''
                }
            `
        },
    },

    features: {
        layout: 'center',
        content: (data: SlideTemplateData) => {
            if (!data.features?.length) return ''

            return dedent`
                # Key Features

                ${data.features.map((feature: string) => `- ${feature}`).join('\n')}
            `
        },
    },

    technicalHeader: {
        layout: 'section',
        content: () => dedent`
            # Technical Deep Dive
        `,
    },

    technicalGroup: {
        layout: 'center',
        content: (data: SlideTemplateData) => {
            if (!data.technical) return ''
            const { title, details } = data.technical
            return dedent`
                # ${title}

                ${details.map(detail => `- ${detail}`).join('\n')}
            `
        },
    },

    technicalWithDiagram: {
        layout: 'two-cols',
        content: (data: SlideTemplateData) => {
            if (!data.technical) return ''
            const { title, details, diagrams } = data.technical
            return dedent`
                # ${title}

                ${details.map(detail => `- ${detail}`).join('\n')}

                ::right::
                ${
                    diagrams?.[0]
                        ? `\`\`\`mermaid
                ${diagrams[0]}
                \`\`\``
                        : ''
                }
            `
        },
    },

    roadmap: {
        layout: 'center',
        content: (data: SlideTemplateData) => {
            if (!data.roadmap?.length) return ''

            return dedent`
                # Roadmap

                ${data.roadmap.map((item: string) => `- ${item}`).join('\n')}
            `
        },
    },
}

export function createSlide(
    template: SlideTemplate,
    data: SlideTemplateData,
): string {
    const content =
        typeof template.content === 'function'
            ? template.content(data)
            : template.content

    if (content) {
        let finalContent = '---'
        finalContent += '\n'
        finalContent += `layout: ${template.layout}`
        finalContent += '\n'
        finalContent += '---'
        finalContent += '\n\n'
        finalContent += content

        return finalContent
    }

    return ''
}

export const defaultConfig = {
    theme: 'default',
    highlighter: 'shiki',
    lineNumbers: true,
    drawings: {
        persist: true,
    },
    mdc: true,
}
