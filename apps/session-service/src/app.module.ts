import { Module } from '@nestjs/common'
import { ModuloCompartilhado, ModuloPrisma } from '@iris/shared'
import { RhythmModule } from './modules/rhythm/rhythm.module.js'

// Partidas dos jogos. Por enquanto só o ritmo (rhythm_sessions, rhythm_phases e rhythm_targets); reflexo
// e cores entram aqui quando forem gravados.
@Module({
  imports: [ModuloCompartilhado.paraServico('session-service'), ModuloPrisma, RhythmModule],
})
export class AppModule {}
