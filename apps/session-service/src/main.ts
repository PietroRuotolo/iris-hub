import { NestFactory } from '@nestjs/core'
import type { Ambiente } from '@iris/config'
import { adaptadorNest, type Logger } from '@iris/logger'
import { AMBIENTE, LOGGER } from '@iris/shared'
import { AppModule } from './app.module.js'

async function iniciar() {
  const app = await NestFactory.create(AppModule, { bufferLogs: true })
  const log = app.get<Logger>(LOGGER)
  app.useLogger(adaptadorNest(log))

  const { sessionServicePort } = app.get<Ambiente>(AMBIENTE)
  await app.listen(sessionServicePort)
  log.info('session-service no ar', { porta: sessionServicePort })
}

void iniciar()
