import pino from 'pino'

import { config } from '../config'

// Set log level based on environment
const logLevel = config.NODE_ENV === 'development' ? 'debug' : 'info'

export const logger = pino({
    transport: {
        target: 'pino-pretty',
        options: {
            colorize: true,
        },
    },
    level: logLevel,
})
