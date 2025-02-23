import { ErrorTypes } from '../config/types'

import type { ErrorType } from '../config/types'

export class SlidevGenError extends Error {
    constructor(
        public readonly type: ErrorType,
        message: string,
        public readonly originalError?: Error,
    ) {
        super(message)
        this.name = 'SlidevGenError'
    }

    static invalidProjectStructure(
        message: string,
        originalError?: Error,
    ): SlidevGenError {
        return new SlidevGenError(
            ErrorTypes.InvalidProjectStructure,
            message,
            originalError,
        )
    }

    static apiKeyMissing(
        message: string,
        originalError?: Error,
    ): SlidevGenError {
        return new SlidevGenError(
            ErrorTypes.APIKeyMissing,
            message,
            originalError,
        )
    }

    static llmGenerationFailed(
        message: string,
        originalError?: Error,
    ): SlidevGenError {
        return new SlidevGenError(
            ErrorTypes.LLMGenerationFailed,
            message,
            originalError,
        )
    }

    static deploymentFailed(
        message: string,
        originalError?: Error,
    ): SlidevGenError {
        return new SlidevGenError(
            ErrorTypes.DeploymentFailed,
            message,
            originalError,
        )
    }

    static invalidConfiguration(
        message: string,
        originalError?: Error,
    ): SlidevGenError {
        return new SlidevGenError(
            ErrorTypes.InvalidConfiguration,
            message,
            originalError,
        )
    }
}
