import { exec } from 'child_process'
import { constants } from 'fs'
import { access, readFile } from 'fs/promises'
import { join } from 'path'
import { promisify } from 'util'

import { createOpenAI } from '@ai-sdk/openai'
import { generateObject } from 'ai'
import dedent from 'dedent'
import { execa } from 'execa'
import { glob } from 'glob'
import { z } from 'zod'

import { SlidevGenError } from '../errors/SlidevGenError'

import type { ProjectContext } from './types'

const execAsync = promisify(exec)

export class ProjectAnalyzer {
    private openai: ReturnType<typeof createOpenAI> | undefined

    constructor(
        private readonly projectRoot: string,
        private readonly apiKey?: string,
    ) {}

    private initializeOpenAI(): ReturnType<typeof createOpenAI> {
        if (!this.openai) {
            const key = this.apiKey ?? process.env.OPENAI_API_KEY
            if (!key) {
                throw new Error(
                    'OpenAI API key must be provided either as constructor argument or in process.env.OPENAI_API_KEY',
                )
            }
            this.openai = createOpenAI({
                apiKey: key,
                compatibility: 'strict',
            })
        }
        return this.openai
    }

    private async getImportantFilePaths(
        context: Omit<ProjectContext, 'codebase'> & {
            codebase: Omit<ProjectContext['codebase'], 'importantFiles'>
        },
    ): Promise<string[]> {
        // In dry-run mode, return a subset of significant files
        if (this.apiKey === 'dry-run') {
            return context.codebase.significantFiles
                .filter(file => !file.startsWith('.')) // Skip hidden files
                .slice(0, 3) // Take up to 3 files
        }

        try {
            const openai = this.initializeOpenAI()
            const { object } = await generateObject({
                model: openai('o3-mini'),
                system: dedent`
                    You are a technical presentation expert analyzing a project's structure.
                    Your task is to identify the most likely important source files based on:
                    - File names and paths
                    - Project structure
                    - Git history
                    - Dependencies and tech stack
                    - Documentation references
                `,
                prompt: dedent`
                    Based on the following project context, identify the top 5 most important source files that should be highlighted in the presentation.
                    
                    Available information:
                    1. File Structure:
                    ${context.codebase.fileStructure}

                    2. Main Languages: ${context.codebase.mainLanguages.join(', ')}
                    
                    3. Configuration Files: 
                    ${context.codebase.significantFiles.join('\n')}
                    
                    4. Recent Git Activity:
                    - Recent commits: ${context.git.recentCommits.join('\n- ')}
                    - Major changes: ${context.git.majorChanges.join('\n- ')}
                    
                    5. Tech Stack:
                    ${Object.entries(context.dependencies.packages)
                        .map(([pkg, version]) => `- ${pkg}@${version}`)
                        .join('\n')}
                    
                    6. Documentation References:
                    ${context.documentation.readme.content}
                    ${context.documentation.additionalDocs
                        .map(doc => doc.content)
                        .join('\n')}

                    Based on this information, return an array of the most important source file paths (relative to project root).
                    Focus on:
                    1. Main entry points and core modules
                    2. Files implementing key features mentioned in documentation
                    3. Files with significant recent changes
                    4. Critical configuration and type definition files
                    5. Files that demonstrate the project's architecture
                    `,
                schema: z.object({
                    paths: z
                        .array(z.string())
                        .describe(
                            'Array of important file paths relative to project root',
                        ),
                }),
            })

            return object.paths
        } catch (error) {
            console.warn('Failed to get important file paths:', error)
            return []
        }
    }

    private async readImportantFiles(
        paths: string[],
    ): Promise<Array<{ path: string; content: string }>> {
        return Promise.all(
            paths.map(async path => {
                try {
                    const content = await readFile(
                        join(this.projectRoot, path),
                        'utf-8',
                    )
                    return { path, content }
                } catch (error) {
                    console.warn(
                        `Failed to read important file ${path}:`,
                        error,
                    )
                    return { path, content: '// Failed to read file content' }
                }
            }),
        )
    }

    async analyze(): Promise<ProjectContext> {
        // Analyze project components in parallel
        const [documentation, dependencies, git, codebase] = await Promise.all([
            this.analyzeDocumentation(),
            this.analyzeDependencies(),
            this.analyzeGit(),
            this.analyzeCodebase(),
        ])

        // Get important files if API key is available
        const baseContext = { documentation, dependencies, git, codebase }
        const importantFilePaths = await this.getImportantFilePaths(baseContext)
        const importantFiles = await this.readImportantFiles(importantFilePaths)

        // Return complete analysis
        return {
            ...baseContext,
            codebase: {
                ...codebase,
                importantFiles,
            },
        }
    }

    /**
     * Analyzes project documentation files (markdown).
     * Output structure:
     * {
     *   readme: {
     *     path: string,
     *     content: string,
     *   },
     *   additionalDocs: {
     *     path: string,
     *     content: string,
     *   }[],
     * }
     */
    private async analyzeDocumentation(): Promise<
        ProjectContext['documentation']
    > {
        try {
            // Read README.md
            const readmePath = join(this.projectRoot, 'README.md')
            const readmeContent = await readFile(readmePath, 'utf-8')

            // Find additional docs (md files)
            const docFiles = await glob('**/*.md', {
                cwd: this.projectRoot,
                ignore: ['**/node_modules/**', 'README.md'],
                nodir: true,
            })

            const additionalDocs = await Promise.all(
                docFiles.map(async (file: string) => {
                    const content = await readFile(
                        join(this.projectRoot, file),
                        'utf-8',
                    )
                    return {
                        path: file,
                        content,
                    }
                }),
            )

            return {
                readme: {
                    path: 'README.md',
                    content: readmeContent,
                },
                additionalDocs,
            }
        } catch (error) {
            if (error instanceof Error) {
                throw new SlidevGenError(
                    'InvalidProjectStructure',
                    `Failed to analyze documentation: ${error.message}`,
                    error,
                )
            }
            throw error
        }
    }

    /**
     * Analyzes project dependencies and package manager.
     * Output structure:
     * {
     *   packageManager: 'bun' | 'pnpm' | 'yarn' | 'npm',  // Determined by lock file presence
     *   packages: {                                       // Merged dependencies from all types
     *     [packageName: string]: string,                  // package: version pairs
     *     ...                                             // Combines dependencies, devDependencies,
     *   }                                                 // and peerDependencies
     * }
     */
    private async analyzeDependencies(): Promise<
        ProjectContext['dependencies']
    > {
        try {
            // Read package.json
            const pkgPath = join(this.projectRoot, 'package.json')
            const pkgContent = await readFile(pkgPath, 'utf-8')
            const pkg = JSON.parse(pkgContent) as {
                dependencies?: Record<string, string>
                devDependencies?: Record<string, string>
                peerDependencies?: Record<string, string>
            }

            // Determine package manager
            const hasYarnLock = await this.fileExists('yarn.lock')
            const hasPnpmLock = await this.fileExists('pnpm-lock.yaml')
            const hasBunLock =
                (await this.fileExists('bun.lockb')) ||
                (await this.fileExists('bun.lock'))

            const packageManager = hasBunLock
                ? 'bun'
                : hasPnpmLock
                  ? 'pnpm'
                  : hasYarnLock
                    ? 'yarn'
                    : 'npm'

            // Combine all dependencies
            const packages = {
                ...(pkg.dependencies || {}),
                ...(pkg.devDependencies || {}),
                ...(pkg.peerDependencies || {}),
            }

            return {
                packageManager,
                packages,
            }
        } catch (error) {
            if (error instanceof Error) {
                throw new SlidevGenError(
                    'InvalidProjectStructure',
                    `Failed to analyze dependencies: ${error.message}`,
                    error,
                )
            }
            throw error
        }
    }

    /**
     * Analyzes git history and contributors.
     * Output structure:
     * {
     *   recentCommits: string[],  // Last 10 commits as ["hash message", ...]
     *   majorChanges: string[],   // Last 5 significant commits (min 10 changes)
     *                            // Format: ["hash message", "file changes", ...]
     *   contributors: string[],   // List of contributor names, ordered by
     *                           // number of commits (excluding merges)
     * }
     */
    private async analyzeGit(): Promise<ProjectContext['git']> {
        try {
            try {
                await execa('git', ['rev-parse', '--git-dir'], {
                    cwd: this.projectRoot,
                })
            } catch {
                throw new Error('No git repository found in project root')
            }

            // Get recent commits
            const { stdout: recentCommitsOutput } = await execAsync(
                'git log --pretty=format:"%h %s" -n 10',
                { cwd: this.projectRoot },
            )
            const recentCommits = recentCommitsOutput
                .split('\n')
                .filter(Boolean)

            // Get major changes (commits with more changes)
            const { stdout: majorChangesOutput } = await execAsync(
                'git log --pretty=format:"%h %s" --shortstat -n 10',
                { cwd: this.projectRoot },
            )
            // Filter commits with significant changes (more than 10 changes total)
            const majorChanges = majorChangesOutput
                .split('\n\n')
                .filter(commit => {
                    const stats = commit.split('\n')[1]
                    if (!stats) return false
                    const changes = (stats.match(/\d+/g) || []).map(Number)
                    // Sum of insertions and deletions
                    const totalChanges = changes.reduce((a, b) => a + b, 0)
                    return totalChanges >= 10
                })
                .map(commit => commit.split('\n')[0])
                .slice(0, 5) // Keep top 5 major changes

            // Get contributors - using git log instead of shortlog for better compatibility
            const { stdout: contributorsOutput } = await execAsync(
                'git log --format="%aN" | sort -u',
                { cwd: this.projectRoot },
            )
            const contributors = contributorsOutput
                .split('\n')
                .filter(Boolean)
                .map(line => line.trim())

            return {
                recentCommits,
                majorChanges,
                contributors,
            }
        } catch (error) {
            if (error instanceof Error) {
                throw new SlidevGenError(
                    'InvalidProjectStructure',
                    `Failed to analyze git history: ${error.message}`,
                    error,
                )
            }
            throw error
        }
    }

    /**
     * Analyzes the codebase structure and composition.
     * Output structure:
     * {
     *   mainLanguages: string[],    // Top 3 file extensions by frequency
     *   fileStructure: string,      // Tree output of project structure
     *                               // (depth 3, excluding node_modules/dist/build/.git)
     *   significantFiles: string[], // Present config files from a predefined list:
     *                              // [package.json, tsconfig.json, .eslintrc.js,
     *                              //  vite.config.ts, next.config.js, README.md]
     * }
     */
    private async analyzeCodebase(): Promise<ProjectContext['codebase']> {
        try {
            // Get all source files
            const allFiles = await glob(
                '**/*.{js,jsx,ts,tsx,vue,svelte,py,rb,go,rs}',
                {
                    cwd: this.projectRoot,
                    ignore: ['**/node_modules/**', '**/dist/**', '**/build/**'],
                    nodir: true,
                },
            )

            // Determine main languages
            const extensions = allFiles.map(file => file.split('.').pop() || '')
            const langCount = extensions.reduce(
                (acc: Record<string, number>, ext: string) => {
                    acc[ext] = (acc[ext] || 0) + 1
                    return acc
                },
                {},
            )

            const mainLanguages = Object.entries(langCount)
                .sort(([, a], [, b]) => (b as number) - (a as number))
                .slice(0, 3)
                .map(([lang]) => lang)

            // Get significant files
            const significantPaths = [
                'package.json',
                'tsconfig.json',
                '.eslintrc.js',
                'vite.config.ts',
                'next.config.js',
                'README.md',
            ]
            const significantFiles = (
                await Promise.all(
                    significantPaths.map(async file => {
                        const exists = await this.fileExists(file)
                        return exists ? file : null
                    }),
                )
            ).filter((file): file is string => file !== null)

            // Read .gitignore patterns or use defaults
            let ignorePattern: string
            try {
                const gitignorePath = join(this.projectRoot, '.gitignore')
                const gitignoreContent = await readFile(gitignorePath, 'utf-8')
                const patterns = gitignoreContent
                    .split('\n')
                    .map(line => line.trim())
                    // Filter out comments and empty lines
                    .filter(line => line && !line.startsWith('#'))
                    // Remove wildcards and slashes for tree command
                    .map(pattern => pattern.replace(/[/*]+/g, ''))
                    .filter(Boolean)

                if (patterns.length > 0) {
                    // Add common patterns that might not be in gitignore
                    const commonPatterns = ['node_modules', '.git']
                    const allPatterns = [
                        ...new Set([...patterns, ...commonPatterns]),
                    ]
                    ignorePattern = allPatterns.join('|')
                } else {
                    throw new Error('No valid patterns found')
                }
            } catch {
                // Fallback to common ignore patterns
                ignorePattern =
                    'node_modules|dist|build|.git|coverage|.cache|.temp|tmp'
            }

            // Generate file structure using ignore pattern
            const { stdout: treeOutput } = await execAsync(
                `tree -L 3 -I "${ignorePattern}" --dirsfirst`,
                { cwd: this.projectRoot },
            )

            return {
                mainLanguages,
                fileStructure: treeOutput,
                significantFiles,
                importantFiles: [], // Will be populated later by analyze()
            }
        } catch (error) {
            if (error instanceof Error) {
                throw new SlidevGenError(
                    'InvalidProjectStructure',
                    `Failed to analyze codebase: ${error.message}`,
                    error,
                )
            }
            throw error
        }
    }

    private async fileExists(path: string): Promise<boolean> {
        try {
            await access(join(this.projectRoot, path), constants.F_OK)
            return true
        } catch {
            return false
        }
    }
}
