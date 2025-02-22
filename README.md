-

# SlidevGen

Automatically generate project-specific presentations using Slidev and LLM technology.

## Installation

```bash
# Install slidev-gen
npm install -g slidev-gen @slidev/cli

# Or using bun
bun add -g slidev-gen @slidev/cli
```

## Usage

```bash
# Generate slides for current project
slidev-gen generate

# Preview the generated slides
slidev-gen preview

# Build static site
slidev-gen deploy
```

## Configuration

Create a `.slidev-gen.json` file in your project root:

```json
{
    "slidesPath": "./.slides",
    "model": "gpt-4",
    "theme": "default",
    "deploymentType": "github"
}
```

Or use CLI options:

```bash
slidev-gen generate --slides-path ./custom-slides --model gpt-4-turbo
```

## API Key

Set your OpenAI API key:

```bash
export OPENAI_API_KEY=your-key-here
```

Or provide it via CLI:

```bash
slidev-gen generate --api-key your-key-here
```
