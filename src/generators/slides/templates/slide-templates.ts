import type { SlideTemplateData } from '../types'
import dedent from 'dedent'

interface SlideTemplate {
    layout: string
    content: string | ((data: SlideTemplateData) => string)
}

export const templates: Record<string, SlideTemplate> = {
    cover: {
        layout: 'cover',
        content: (data: SlideTemplateData) => dedent`
            # ${data.title}
        `,
    },

    overview: {
        layout: 'default',
        content: (data: SlideTemplateData) => dedent`
            # Overview

            ${data.overview}
        `,
    },

    architecture: {
        layout: 'two-cols',
        content: (data: SlideTemplateData) => {
            const arch = data.architecture
            if (!arch) return ''

            return dedent`
                # Architecture

                ${arch.description}

                ::right::

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
        layout: 'bullets',
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
        content: dedent`
            # Technical Deep Dive
        `,
    },

    technicalDetail: {
        layout: 'default',
        content: (data: SlideTemplateData) => {
            const tech = data.technical
            if (!tech) return ''

            return dedent`
                # Technical Detail ${tech.index + 1}

                ${tech.detail}

                ${
                    tech.diagram
                        ? dedent`
                    \`\`\`mermaid
                    ${tech.diagram}
                    \`\`\`
                `
                        : ''
                }
            `
        },
    },

    roadmap: {
        layout: 'timeline',
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

    return content
        ? dedent`
            ---
            layout: ${template.layout}
            ---
            ${content}
        `
        : ''
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
