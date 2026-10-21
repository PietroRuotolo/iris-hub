import { Module } from '@nestjs/common'
import { ModuloCompartilhado, ModuloPrisma } from '@iris/shared'
import { ReflexModule } from './modules/reflex/reflex.module.js'
import { RhythmModule } from './modules/rhythm/rhythm.module.js'

// Partidas dos jogos: o ritmo (rhythm_sessions, rhythm_phases e rhythm_targets) e o reflexo
// (reflex_sessions e reflex_attempts). As cores entram aqui quando forem gravadas.
@Module({
  imports: [ModuloCompartilhado.paraServico('session-service'), ModuloPrisma, RhythmModule, ReflexModule],
})
export class AppModule {}