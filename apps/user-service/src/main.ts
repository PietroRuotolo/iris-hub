import { NestFactory } from '@nestjs/core'
import type { Ambiente } from '@iris/config'
import { adaptadorNest, type Logger } from '@iris/logger'
import { AMBIENTE, LOGGER } from '@iris/shared'
import { AppModule } from './app.module.js'

async function iniciar() {
  const app = await NestFactory.create(AppModule, { bufferLogs: true })
  const log = app.get<Logger>(LOGGER)
  app.useLogger(adaptadorNest(log))

  const { userServicePort } = app.get<Ambiente>(AMBIENTE)
  await app.listen(userServicePort)
  log.info('user-service no ar', { porta: userServicePort })
}

void iniciar()
