import { mkdir } from 'fs/promises'
import { join } from 'path'

import { $ } from 'bun'
import { afterAll, beforeEach, describe, expect, test } from 'bun:test'

import { ProjectAnalyzer } from './analyzer'

describe('ProjectAnalyzer', () => {
    const TEST_PROJECT_ROOT = join(import.meta.dir, '__test_project__')

    // Setup test project structure before each test
    beforeEach(async () => {
        // Clean up and create test directory
        await Bun.file(TEST_PROJECT_ROOT)
            .delete()
            .catch(() => {})
        await mkdir(TEST_PROJECT_ROOT, { recursive: true })
        await mkdir(join(TEST_PROJECT_ROOT, 'docs'), { recursive: true })
        await mkdir(join(TEST_PROJECT_ROOT, 'src'), { recursive: true })

        // Create test files
        await Promise.all([
            // Documentation files
            Bun.write(
                join(TEST_PROJECT_ROOT, 'README.md'),
                '# Test Project\nThis is a test project.',
            ),
            Bun.write(
                join(TEST_PROJECT_ROOT, 'docs/guide.md'),
                '# Guide\nThis is a guide.',
            ),

            // Package files
            Bun.write(
                join(TEST_PROJECT_ROOT, 'package.json'),
                JSON.stringify({
                    dependencies: {
                        'test-dep': '1.0.0',
                    },
                    devDependencies: {
                        'test-dev-dep': '1.0.0',
                    },
                }),
            ),
            Bun.write(join(TEST_PROJECT_ROOT, 'bun.lock'), ''),

            // Source files
            Bun.write(
                join(TEST_PROJECT_ROOT, 'src/index.ts'),
                'console.log("Hello")',
            ),
            Bun.write(
                join(TEST_PROJECT_ROOT, 'src/utils.js'),
                'export const add = (a, b) => a + b',
            ),

            // Git ignore patterns
            Bun.write(
                join(TEST_PROJECT_ROOT, '.gitignore'),
                `# Build output
dist/
*.log

# Custom ignored directory
custom_ignore/

# Cache files
.cache/
*.cache

# Empty lines and comments should be handled

# Wildcards should work
*.tmp
`,
            ),
        ])

        try {
            // Initialize git repository
            await $`cd ${TEST_PROJECT_ROOT} && rm -rf .git`
            await $`cd ${TEST_PROJECT_ROOT} && git init`.quiet()
            await $`cd ${TEST_PROJECT_ROOT} && git config --local user.name "Test User"`
            await $`cd ${TEST_PROJECT_ROOT} && git config --local user.email "test@example.com"`
            await $`cd ${TEST_PROJECT_ROOT} && git add -A`
            await $`cd ${TEST_PROJECT_ROOT} && git commit -m "Initial commit"`.quiet()

            // Verify git is properly initialized
            const gitCheck =
                await $`cd ${TEST_PROJECT_ROOT} && git rev-parse --git-dir`.text()
            if (!gitCheck.includes('.git')) {
                throw new Error('Git initialization failed')
            }
        } catch (error) {
            console.error('Git setup failed:', error)
            throw error
        }
    })

    // Clean up test directory after all tests
    afterAll(async () => {
        await $`rm -rf ${TEST_PROJECT_ROOT}`.catch(error => {
            console.error('Failed to clean up test directory:', error)
        })
    })

    describe('Integration Tests (Happy Path)', () => {
        test('analyze() returns complete project analysis', async () => {
            const analyzer = new ProjectAnalyzer(TEST_PROJECT_ROOT)
            const result = await analyzer.analyze()

            // Documentation checks
            expect(result.documentation.readme).toContain('# Test Project')
            expect(result.documentation.additionalDocs).toHaveLength(1)
            expect(result.documentation.additionalDocs[0]).toContain('# Guide')

            // Dependencies checks
            expect(result.dependencies.packageManager).toBe('bun')
            expect(result.dependencies.packages).toEqual({
                'test-dep': '1.0.0',
                'test-dev-dep': '1.0.0',
            })

            // Git checks
            expect(result.git.recentCommits).toHaveLength(1)
            expect(result.git.recentCommits[0]).toContain('Initial commit')
            expect(result.git.contributors).toContain('Test User')

            // Codebase checks
            expect(result.codebase.mainLanguages).toContain('ts')
            expect(result.codebase.mainLanguages).toContain('js')
            expect(result.codebase.significantFiles).toContain('package.json')
            expect(result.codebase.fileStructure).toContain('src')
        })
    })

    describe('Unit Tests', () => {
        describe('analyzeDocumentation', () => {
            test('returns correct structure', async () => {
                const analyzer = new ProjectAnalyzer(TEST_PROJECT_ROOT)
                const result = await analyzer['analyzeDocumentation']()

                expect(result.readme.path).toBe('README.md')
                expect(result.readme.content).toContain('# Test Project')
                expect(result.additionalDocs).toHaveLength(1)
                expect(result.additionalDocs[0].path).toBe('docs/guide.md')
                expect(result.additionalDocs[0].content).toContain('# Guide')
            })

            test('handles missing README.md gracefully', async () => {
                await Bun.file(join(TEST_PROJECT_ROOT, 'README.md')).delete()

                const analyzer = new ProjectAnalyzer(TEST_PROJECT_ROOT)
                expect(analyzer['analyzeDocumentation']()).rejects.toThrow(
                    'Failed to analyze documentation: ENOENT',
                )
            })
        })

        describe('analyzeGit', () => {
            test('returns git history', async () => {
                const analyzer = new ProjectAnalyzer(TEST_PROJECT_ROOT)
                const result = await analyzer['analyzeGit']()

                expect(result.recentCommits).toHaveLength(1)
                expect(result.recentCommits[0]).toContain('Initial commit')
                expect(result.contributors).toContain('Test User')
            })

            test('handles missing git repository gracefully', async () => {
                await $`rm -rf ${join(TEST_PROJECT_ROOT, '.git')}`

                const analyzer = new ProjectAnalyzer(TEST_PROJECT_ROOT)
                expect(analyzer['analyzeGit']()).rejects.toThrow(
                    'Failed to analyze git history: No git repository found in project root',
                )
            })
        })

        describe('analyzeCodebase', () => {
            test('respects gitignore patterns', async () => {
                // Create some files and directories that should be ignored
                await mkdir(join(TEST_PROJECT_ROOT, 'dist'), {
                    recursive: true,
                })
                await mkdir(join(TEST_PROJECT_ROOT, 'custom_ignore'), {
                    recursive: true,
                })
                await mkdir(join(TEST_PROJECT_ROOT, '.cache'), {
                    recursive: true,
                })

                await Promise.all([
                    Bun.write(
                        join(TEST_PROJECT_ROOT, 'dist/bundle.js'),
                        'console.log("bundle")',
                    ),
                    Bun.write(
                        join(TEST_PROJECT_ROOT, 'custom_ignore/test.js'),
                        'console.log("ignored")',
                    ),
                    Bun.write(
                        join(TEST_PROJECT_ROOT, '.cache/data.json'),
                        '{"cached": true}',
                    ),
                ])

                const analyzer = new ProjectAnalyzer(TEST_PROJECT_ROOT)
                const result = await analyzer['analyzeCodebase']()

                expect(result.fileStructure).not.toContain('dist')
                expect(result.fileStructure).not.toContain('custom_ignore')
                expect(result.fileStructure).not.toContain('.cache')
                expect(result.fileStructure).toContain('src')
                expect(result.fileStructure).not.toMatch(/\.log/)
                expect(result.fileStructure).not.toMatch(/\.tmp/)
            })

            test('uses fallback patterns when no gitignore exists', async () => {
                await Bun.file(join(TEST_PROJECT_ROOT, '.gitignore')).delete()
                await mkdir(join(TEST_PROJECT_ROOT, 'dist'), {
                    recursive: true,
                })

                const analyzer = new ProjectAnalyzer(TEST_PROJECT_ROOT)
                const result = await analyzer['analyzeCodebase']()

                expect(result.fileStructure).not.toContain('dist')
                expect(result.fileStructure).toContain('src')
            })
        })
    })
})
