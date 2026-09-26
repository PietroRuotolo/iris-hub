import { NestFactory } from '@nestjs/core'
import { adaptadorNest, type Logger } from '@iris/logger'
import { LOGGER } from '@iris/shared'
import { AppModule } from './app.module.js'

async function iniciar() {
  const app = await NestFactory.createApplicationContext(AppModule, { bufferLogs: true })
  const log = app.get<Logger>(LOGGER)
  app.useLogger(adaptadorNest(log))

  log.info('analytics-worker iniciado; consumidores ainda não implementados')
  await app.close()
}

void iniciar()
