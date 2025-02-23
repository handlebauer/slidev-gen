import { mkdir, stat } from 'fs/promises'
import { join } from 'path'

import { $ } from 'bun'
import { afterEach, beforeEach, describe, expect, test } from 'bun:test'

import { SlidesGenerator } from './slides-generator'

import type { ProjectContext } from '../../context/types'

describe('SlidesGenerator', () => {
    const TEST_OUTPUT_DIR = join(import.meta.dir, '__test_output__')
    const ORIGINAL_OPENAI_API_KEY = process.env.OPENAI_API_KEY

    // Mock project context for testing
    const mockContext: ProjectContext = {
        documentation: {
            readme: {
                path: 'README.md',
                content: '# Test Project\nA test project for slides',
            },
            additionalDocs: [
                {
                    path: 'docs/additional.md',
                    content: '# Additional Doc\nMore documentation',
                },
            ],
        },
        dependencies: {
            packageManager: 'bun',
            packages: {
                'test-dep': '1.0.0',
            },
        },
        git: {
            recentCommits: ['feat: initial commit'],
            majorChanges: ['Added core functionality'],
            contributors: ['Test User'],
        },
        codebase: {
            mainLanguages: ['ts', 'js'],
            significantFiles: ['package.json', 'src/index.ts'],
            fileStructure: 'src/\n  index.ts\n  utils.ts',
        },
    }

    // Setup and cleanup for each test
    beforeEach(async () => {
        // Clean up and create test directory
        await mkdir(TEST_OUTPUT_DIR, { recursive: true })
    })

    // Clean up test directory after all tests
    afterEach(async () => {
        await $`rm -rf ${TEST_OUTPUT_DIR}`.catch(error => {
            console.error('Failed to clean up test directory:', error)
        })
    })

    describe('Constructor', () => {
        test('uses API key from environment if not provided', () => {
            const generator = new SlidesGenerator(TEST_OUTPUT_DIR)
            expect(generator).toBeDefined()
        })

        test('uses provided API key over environment variable', () => {
            const generator = new SlidesGenerator(
                TEST_OUTPUT_DIR,
                'explicit-key',
            )
            expect(generator).toBeDefined()
        })

        test('throws error if no API key available', () => {
            process.env.OPENAI_API_KEY = undefined
            expect(() => new SlidesGenerator(TEST_OUTPUT_DIR)).toThrow(
                'OpenAI API key must be provided',
            )
            process.env.OPENAI_API_KEY = ORIGINAL_OPENAI_API_KEY
        })
    })

    describe('Integration Tests', () => {
        test('generate() creates slides and config files', async () => {
            const generator = new SlidesGenerator(TEST_OUTPUT_DIR)
            const output = await generator.generate(mockContext)

            // Check if files were created
            const slidesExist = await Bun.file(output.paths.slides).exists()
            const configExists = await Bun.file(output.paths.config).exists()

            expect(slidesExist).toBe(true)
            expect(configExists).toBe(true)

            // Check file contents
            const slidesContent = await Bun.file(output.paths.slides).text()
            const configContent = await Bun.file(output.paths.config).text()

            // Verify markdown structure
            expect(slidesContent).toContain('---')
            expect(slidesContent).toContain('layout: cover')
            expect(slidesContent).toContain('# Test Project') // Title from context

            // Verify config
            expect(configContent).toContain('export default')
            expect(configContent).toContain('theme')
            expect(configContent).toContain('highlighter')
        })
    })

    describe('Unit Tests', () => {
        describe('generateContent', () => {
            test('generates structured content from context', async () => {
                const generator = new SlidesGenerator(TEST_OUTPUT_DIR)
                const content = await generator['generateContent'](mockContext)

                expect(content.title).toBeDefined()
                expect(content.sections.overview).toBeDefined()
                expect(content.sections.architecture).toBeDefined()
                expect(Array.isArray(content.sections.features)).toBe(true)
                expect(Array.isArray(content.sections.technical)).toBe(true)
                expect(Array.isArray(content.sections.roadmap)).toBe(true)
            })
        })

        describe('generateOutput', () => {
            test('converts content to markdown slides', async () => {
                const generator = new SlidesGenerator(TEST_OUTPUT_DIR)
                const mockContent = {
                    title: 'Test Title',
                    sections: {
                        overview: 'Test Overview',
                        architecture: 'Test Architecture',
                        features: ['Feature 1', 'Feature 2'],
                        technical: ['Tech 1', 'Tech 2'],
                        roadmap: ['Step 1', 'Step 2'],
                    },
                    diagrams: {
                        architecture: 'graph TD\\nA-->B',
                        flowcharts: ['graph LR\\nX-->Y'],
                    },
                }

                const output = await generator['generateOutput'](mockContent)

                expect(output.markdown).toContain('Test Title')
                expect(output.markdown).toContain('Test Overview')
                expect(output.markdown).toContain('Feature 1')
                expect(output.markdown).toContain('Tech 1')
                expect(output.markdown).toContain('Step 1')
                expect(output.markdown).toContain('```mermaid')
            })

            test('handles missing diagrams gracefully', async () => {
                const generator = new SlidesGenerator(TEST_OUTPUT_DIR)
                const mockContent = {
                    title: 'Test Title',
                    sections: {
                        overview: 'Test Overview',
                        architecture: 'Test Architecture',
                        features: ['Feature 1'],
                        technical: ['Tech 1'],
                        roadmap: ['Step 1'],
                    },
                    diagrams: {},
                }

                const output = await generator['generateOutput'](mockContent)

                expect(output.markdown).not.toContain('```mermaid')
                expect(output.markdown).toContain('Test Title')
            })
        })

        describe('writeOutput', () => {
            test('creates output directory if it does not exist', async () => {
                const generator = new SlidesGenerator(
                    join(TEST_OUTPUT_DIR, 'nested', 'dir'),
                )
                const mockOutput = {
                    markdown: '# Test',
                    assets: [],
                    config: {},
                    paths: {
                        slides: join(
                            TEST_OUTPUT_DIR,
                            'nested',
                            'dir',
                            'slides.md',
                        ),
                        config: join(
                            TEST_OUTPUT_DIR,
                            'nested',
                            'dir',
                            'slidev.config.ts',
                        ),
                    },
                }

                await generator['writeOutput'](mockOutput)

                const dirExists = await stat(
                    join(TEST_OUTPUT_DIR, 'nested', 'dir'),
                )
                expect(dirExists).toBeDefined()
            })

            test('writes assets when provided', async () => {
                const generator = new SlidesGenerator(TEST_OUTPUT_DIR)
                const mockOutput = {
                    markdown: '# Test',
                    assets: ['test.png'], // TODO: Implement asset writing test when supported
                    config: {},
                    paths: {
                        slides: join(TEST_OUTPUT_DIR, 'slides.md'),
                        config: join(TEST_OUTPUT_DIR, 'slidev.config.ts'),
                    },
                }

                await generator['writeOutput'](mockOutput)

                const assetsDir = await stat(join(TEST_OUTPUT_DIR, 'assets'))
                expect(assetsDir).toBeDefined()
            })
        })
    })
})
