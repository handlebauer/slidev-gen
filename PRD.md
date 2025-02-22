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
- Package Manager: npm/bun
- Primary Language: TypeScript
- LLM Integration: OpenAI API

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
interface UserConfig {
    apiKey: string
    defaultModel: string
    defaultTheme: string
}

interface ProjectConfig {
    slidesPath: string
    deploymentType: 'github' | 'netlify' | 'vercel'
    customDomain?: string
}
```

### R4: Slide Generation

```typescript
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
const contextPrompt = `
Project Analysis for Presentation Generation:
1. Repository: {repoUrl}
2. Main Technologies: {technologies}
3. Key Documentation:
   {documentationSummary}
4. Recent Changes:
   {gitHistory}
5. Core Features:
   {featuresList}

Generate a presentation that:
- Captures the technical essence
- Highlights architectural decisions
- Showcases key features
- Includes relevant diagrams
- Follows best practices for technical presentations
`
```

### Slide Generation Prompt Template

```typescript
const slideGenPrompt = `
Based on the following project context:
{projectContext}

Generate a Slidev markdown presentation that:
1. Uses the following structure:
   - Title & Overview
   - Architecture (with Mermaid diagrams)
   - Key Features
   - Technical Deep Dive
   - Future Roadmap

2. Follows these guidelines:
   - Use code snippets for technical examples
   - Include Mermaid diagrams for architecture
   - Keep each slide focused and concise
   - Use Slidev's built-in layouts appropriately
   - Maintain technical accuracy
`
```

## Development Phases

### Phase 1: Foundation (Week 1-2)

- [ ] Project scaffolding
- [ ] Basic CLI implementation
- [ ] Project analysis core
- [ ] Configuration management
- [ ] Simple slide generation

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
