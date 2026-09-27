import { NestFactory } from '@nestjs/core'
import type { Ambiente } from '@iris/config'
import { adaptadorNest, type Logger } from '@iris/logger'
import { AMBIENTE, LOGGER } from '@iris/shared'
import { AppModule } from './app.module.js'

async function iniciar() {
  const app = await NestFactory.create(AppModule, { bufferLogs: true })
  const log = app.get<Logger>(LOGGER)
  app.useLogger(adaptadorNest(log))

  const { emailServicePort } = app.get<Ambiente>(AMBIENTE)
  await app.listen(emailServicePort)
  log.info('email-service no ar', { porta: emailServicePort })
}

void iniciar()
