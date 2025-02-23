import pino from 'pino'

// During development NODE_ENV will be available
// In production build this will be undefined, effectively disabling logging
export const logger = pino({
    level: process.env.NODE_ENV === 'production' ? 'silent' : 'debug',
    transport: {
        target: 'pino-pretty',
        options: {
            colorize: true,
        },
    },
})
