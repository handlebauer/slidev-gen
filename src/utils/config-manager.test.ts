import { expect, describe, test, beforeEach, afterEach } from 'bun:test'

import { $ } from 'bun'
import { join } from 'path'
import { mkdir } from 'fs/promises'
import { ConfigManager } from './config-manager'
import type { ProjectConfig } from '../config/types'

describe('ConfigManager', () => {
    const TEST_CONFIG_ROOT = join(import.meta.dir, '__test_config__')

    // Setup test directory structure before each test
    beforeEach(async () => {
        // Clean up and create test directory
        try {
            await $`rm -rf ${TEST_CONFIG_ROOT}`
        } catch (error) {
            if ((error as NodeJS.ErrnoException).code !== 'ENOENT') {
                console.error('Failed to clean up test directory:', error)
            }
        }
        await mkdir(TEST_CONFIG_ROOT, { recursive: true })
    })

    afterEach(async () => {
        await $`rm -rf ${TEST_CONFIG_ROOT}`
    })

    describe('Integration Tests (Happy Path)', () => {
        test('full config lifecycle (save and load)', async () => {
            const configManager = new ConfigManager(TEST_CONFIG_ROOT)

            const testConfig: ProjectConfig = {
                slidesPath: './custom-slides',
                model: 'gpt-4-turbo',
                theme: 'custom-theme',
                deploymentType: 'github',
                customDomain: 'slides.example.com',
            }

            // Save the config
            await configManager.saveConfig(testConfig)

            // Load and verify the config
            const loadedConfig = await configManager.loadConfig()
            expect(loadedConfig).toEqual(testConfig)

            // Verify the file actually exists with correct content
            const fileContent = await Bun.file(
                join(TEST_CONFIG_ROOT, '.slidev-gen.json'),
            ).text()
            const parsedContent = JSON.parse(fileContent)
            expect(parsedContent).toEqual(testConfig)
        })
    })

    describe('Unit Tests', () => {
        describe('loadConfig', () => {
            test('returns default config when no file exists', async () => {
                const configManager = new ConfigManager(TEST_CONFIG_ROOT)
                const config = await configManager.loadConfig()

                // Test against the schema defaults
                expect(config).toEqual({
                    slidesPath: './.slides',
                    model: 'gpt-4',
                    theme: 'default',
                    deploymentType: 'github',
                })
            })

            test('throws on invalid JSON', async () => {
                const configManager = new ConfigManager(TEST_CONFIG_ROOT)
                await Bun.write(
                    join(TEST_CONFIG_ROOT, '.slidev-gen.json'),
                    '{ invalid json',
                )

                expect(configManager.loadConfig()).rejects.toThrow(
                    'Configuration file contains invalid JSON',
                )
            })

            test('throws on invalid config schema', async () => {
                const configManager = new ConfigManager(TEST_CONFIG_ROOT)
                await Bun.write(
                    join(TEST_CONFIG_ROOT, '.slidev-gen.json'),
                    JSON.stringify({
                        slidesPath: 123, // should be string
                        model: null, // should be string
                        theme: [], // should be string
                        deploymentType: 'invalid', // should be one of: github, netlify, vercel
                    }),
                )

                expect(configManager.loadConfig()).rejects.toThrow(
                    'Invalid configuration format',
                )
            })
        })

        describe('saveConfig', () => {
            test('saves valid config successfully', async () => {
                const configManager = new ConfigManager(TEST_CONFIG_ROOT)
                const testConfig: ProjectConfig = {
                    slidesPath: './test-slides',
                    model: 'gpt-4',
                    theme: 'default',
                    deploymentType: 'github',
                }

                await configManager.saveConfig(testConfig)
                const fileExists = await Bun.file(
                    join(TEST_CONFIG_ROOT, '.slidev-gen.json'),
                ).exists()
                expect(fileExists).toBe(true)
            })

            test('throws on invalid config data', async () => {
                const configManager = new ConfigManager(TEST_CONFIG_ROOT)
                const invalidConfig = {
                    slidesPath: './test-slides',
                    model: 'gpt-4',
                    theme: 'default',
                    deploymentType: 'invalid-type', // invalid deployment type
                }

                expect(
                    configManager.saveConfig(invalidConfig as ProjectConfig),
                ).rejects.toThrow()
            })

            test('creates directory if it does not exist', async () => {
                const deepConfigPath = join(TEST_CONFIG_ROOT, 'deep', 'nested')
                const configManager = new ConfigManager(deepConfigPath)
                const testConfig: ProjectConfig = {
                    slidesPath: './.slides',
                    model: 'gpt-4',
                    theme: 'default',
                    deploymentType: 'github',
                }

                await configManager.saveConfig(testConfig)
                const fileExists = await Bun.file(
                    join(deepConfigPath, '.slidev-gen.json'),
                ).exists()
                expect(fileExists).toBe(true)
            })
        })
    })
})
