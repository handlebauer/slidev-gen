# SlidevGen

Automatically generate project-specific presentations using Slidev and LLM technology. SlidevGen analyzes your project and creates beautiful, professional presentations with customizable templates.

## Features

- 🤖 AI-powered, project-specific presentation generation
- 📊 Built-in support for Mermaid diagrams
- 🎨 Multiple slide layouts (cover, center, two-cols, etc.)
- 🔧 Customizable templates with theme support

## Quick Start

```bash
# Generate slides for current project
bunx slidev-gen generate

# Preview the generated slides (after generating)
bunx slidev-gen preview

# Build static site
bunx slidev-gen deploy
```

(`npx` works just as well)

## Configuration

**Optional** CLI options:

```bash
bunx slidev-gen generate --slides-path ./custom-slides --model gpt-4-turbo
```

## Available Slide Templates

SlidevGen includes several built-in templates:

- **Cover** - Main title slide with headline
- **Overview** - Project overview and summary
- **Architecture** - System architecture with optional Mermaid diagrams
- **Features** - Key features list
- **Technical Deep Dive** - Detailed technical sections
- **Technical with Diagram** - Two-column layout with text and diagrams
- **Roadmap** - Project roadmap and future plans

## API Key

Set your OpenAI API key:

```bash
export OPENAI_API_KEY=your-key-here
```

Or provide it via CLI:

```bash
bunx slidev-gen generate --api-key your-key-here
```

## Default Configuration

The default Slidev configuration includes:

- Theme: default
- Syntax highlighter: Shiki
- Line numbers enabled
- Persistent drawings
- Markdown Component (MDC) support

## Development

```bash
# Install dependencies
bun install

# Run linting
bun run lint

# Format code
bun run format

# Build the project
bun run build
```

## License

MIT
