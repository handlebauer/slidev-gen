import { config } from '~/config'
import { logger } from '~/utils'

logger.info(
    { config: config.PACKAGE_NAME, version: config.VERSION },
    'Hello World',
)
