# SlidevGen Product Requirements Document

## Product Definition

**Product Name:** SlidevGen
**Type:** CLI Tool
**Core Purpose:** Automatically generate project-specific presentations using Slidev and LLM technology
**Target Users:** Developers and technical teams
**Key Integration:** Built on Slidev (https://sli.dev)

## System Architecture

### Base Technologies

- Framework: Slidev v0.51.2+
- Runtime: Node.js
- Package Manager: bun
- Primary Language: TypeScript
- LLM Integration: Vercel AI SDK with OpenAI

### Key Components

1. CLI Interface (`bin/slidev-generate.js`)
2. Project Analyzer (`src/context/*`)
3. Slide Generator (`src/generators/slides-generator.ts`)
4. Deployment Automator (`src/generators/github-actions-generator.ts`)
5. Configuration Manager (`src/utils/config-manager.ts`)

## Functional Requirements

### R1: Project Analysis

```typescript
interface ProjectContext {
    documentation: {
        readme: string
        additionalDocs: string[]
    }
    dependencies: {
        packageManager: 'npm' | 'yarn' | 'pnpm' | 'bun'
        packages: Record<string, string>
    }
    git: {
        recentCommits: string[]
        majorChanges: string[]
        contributors: string[]
    }
    codebase: {
        mainLanguages: string[]
        fileStructure: string
        significantFiles: string[]
    }
}
```

### R2: CLI Interface

```typescript
interface CLIOptions {
    outputDir: string // default: "./slides"
    model: string // default: "gpt-4"
    theme: string // default: "default"
    apiKey?: string // from env or prompt
}

interface CLICommands {
    generate: () => Promise<void>
    preview: () => Promise<void>
    deploy: () => Promise<void>
}
```

### R3: Configuration

```typescript
interface ProjectConfig {
    // Presentation settings
    slidesPath: string    // default: "./slides"
    model: string        // default: "gpt-4"
    theme: string       // default: "default"

    // Deployment settings (optional)
    deploymentType?: 'github' | 'netlify' | 'vercel'
    customDomain?: string
}

// API Key handling
interface APIKeyProvider {
    getAPIKey(): Promise<string> {
        // 1. Check process.env.OPENAI_API_KEY
        const envKey = process.env.OPENAI_API_KEY
        if (envKey) return envKey

        // 2. If not found, prompt user
        // This would be implemented in the CLI layer
        throw new SlidevGenError(
            'APIKeyMissing',
            'OpenAI API key not found in environment. Please provide it via --api-key or set OPENAI_API_KEY environment variable.'
        )
    }
}
```

### R4: Slide Generation

```typescript
import { generateText } from 'ai'
import { openai } from '@ai-sdk/openai'

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
    markdown: string // slides.md content
    assets: string[] // paths to generated assets
    config: object // slidev config
}

// Slide generation implementation
async function generateSlideContent(
    context: ProjectContext,
): Promise<SlideContent> {
    const { text } = await generateText({
        model: openai('gpt-4'),
        system: 'You are a technical presentation expert. Generate clear, concise slides that effectively communicate technical concepts.',
        prompt: `Generate a presentation based on the following project context: ${JSON.stringify(context)}`,
        maxSteps: 3,
        experimental_continueSteps: true,
    })

    return JSON.parse(text) as SlideContent
}
```

### R5: Deployment

```typescript
interface DeploymentConfig {
    type: 'github' | 'netlify' | 'vercel'
    config: {
        workflowFile?: string // for GitHub
        tomlConfig?: string // for Netlify
        vercelConfig?: string // for Vercel
    }
    scripts: Record<string, string>
}
```

## LLM Integration Specifications

### Context Building Prompt Template

```typescript
import { generateText } from 'ai'
import { openai } from '@ai-sdk/openai'

const generateContextPrompt = async (context: {
    repoUrl: string
    technologies: string[]
    documentationSummary: string
    gitHistory: string
    featuresList: string[]
}) => {
    const { text } = await generateText({
        model: openai('gpt-4'),
        system: 'You are a technical documentation expert. Analyze project context and generate presentation outlines.',
        prompt: `
Project Analysis for Presentation Generation:
1. Repository: ${context.repoUrl}
2. Main Technologies: ${context.technologies.join(', ')}
3. Key Documentation:
   ${context.documentationSummary}
4. Recent Changes:
   ${context.gitHistory}
5. Core Features:
   ${context.featuresList.join('\n   ')}

Generate a presentation that:
- Captures the technical essence
- Highlights architectural decisions
- Showcases key features
- Includes relevant diagrams
- Follows best practices for technical presentations
        `,
    })

    return text
}
```

### Slide Generation Prompt Template

```typescript
import { generateText } from 'ai'
import { openai } from '@ai-sdk/openai'

const generateSlides = async (projectContext: any) => {
    const { text } = await generateText({
        model: openai('gpt-4'),
        system: `
You are a technical presentation expert. Follow these guidelines:
- Use code snippets for technical examples
- Include Mermaid diagrams for architecture
- Keep each slide focused and concise
- Use Slidev's built-in layouts appropriately
- Maintain technical accuracy
        `,
        prompt: `Based on the following project context:
${JSON.stringify(projectContext, null, 2)}

Generate a Slidev markdown presentation that:
1. Uses the following structure:
   - Title & Overview
   - Architecture (with Mermaid diagrams)
   - Key Features
   - Technical Deep Dive
   - Future Roadmap
        `,
    })

    return text
}
```

## Development Phases

### Phase 1: Foundation (Week 1-2)

- [x] Project scaffolding
    > - Implemented Zod schemas for type-safe configuration and project context validation
    > - Created class-based architecture with clear separation of concerns (analyzers, generators, config)
    > - Set up AI SDK integration with proper error handling and type definitions
- [x] Basic CLI implementation
    > - Created class-based CLI with proper command structure and error handling
    > - Implemented configuration merging (CLI options override config file)
    > - Added secure API key handling via CLI or environment variables
- [x] Project analysis core
    > - Implemented comprehensive project analysis (docs, deps, git, codebase)
    > - Added robust error handling with specific error types
    > - Used native tools (git, tree) for rich context gathering
- [x] Configuration management
    > - Implemented ConfigManager with Zod schema validation
    > - Added support for default values and optional fields
    > - Built-in error handling for invalid JSON and schema violations
- [x] Simple slide generation
    > - Implemented SlidesGenerator with template-based slide generation
    > - Added support for Mermaid diagrams and structured content
    > - Built with proper error handling and API key management

### Phase 2: Enhancement (Week 3-4)

- [ ] Advanced project analysis
- [ ] LLM prompt optimization
- [ ] Mermaid diagram generation
- [ ] Theme integration
- [ ] Local preview functionality

### Phase 3: Deployment (Week 5-6)

- [ ] GitHub Actions workflow
- [ ] Netlify/Vercel support
- [ ] Custom domain handling
- [ ] Analytics integration
- [ ] Documentation

## Success Criteria

### Performance Metrics

- Generation Time: < 120 seconds
- Accuracy Rate: > 80%
- Manual Edit Rate: < 5%
- Deployment Success: > 95%

### Quality Metrics

```typescript
interface QualityMetrics {
    slideCount: number // 10-20 slides
    codeSnippets: number // At least 3
    diagrams: number // At least 1
    technicalDepth: 1 | 2 | 3 // 3 being highest
    presentationFlow: 1 | 2 | 3
}
```

## Error Handling

### Expected Error Cases

```typescript
import { SlidevGenError } from './errors/SlidevGenError'

type ErrorTypes =
    | 'InvalidProjectStructure'
    | 'APIKeyMissing'
    | 'LLMGenerationFailed'
    | 'DeploymentFailed'
    | 'InvalidConfiguration'

interface ErrorHandler {
    type: ErrorTypes
    message: string
    recovery: () => Promise<void>
}

// Example error handling with AI SDK
const handleGenerationError = (error: any) => {
    if (error.name === 'AIError') {
        throw new SlidevGenError(
            'LLMGenerationFailed',
            'Failed to generate presentation content',
            error,
        )
    }
    throw error
}
```

## Testing Requirements

### Unit Tests

- Project analysis accuracy
- LLM prompt effectiveness
- Slide generation consistency
- Configuration management
- Error handling

### Integration Tests

- End-to-end generation flow
- Deployment automation
- LLM integration
- Theme compatibility

## Documentation Requirements

### Required Docs

1. Installation Guide
2. Usage Examples
3. Configuration Reference
4. API Documentation
5. Deployment Guide
6. Troubleshooting Guide

## Version Control

### Branch Strategy

- main: Production-ready code
- develop: Development branch
- feature/\*: Feature branches
- release/\*: Release branches
- hotfix/\*: Emergency fixes
