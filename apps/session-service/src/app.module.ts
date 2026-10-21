import { Module } from '@nestjs/common'
import { ModuloCompartilhado, ModuloPrisma } from '@iris/shared'
import { ReflexModule } from './modules/reflex/reflex.module.js'
import { RhythmModule } from './modules/rhythm/rhythm.module.js'
import { ColorModule } from './modules/color/color.module.js'

// Partidas dos jogos: o ritmo (rhythm_sessions, rhythm_phases e rhythm_targets), o reflexo
// (reflex_sessions e reflex_attempts) e as cores (color_sessions e color_rounds).
@Module({
  imports: [ModuloCompartilhado.paraServico('session-service'), ModuloPrisma, RhythmModule, ReflexModule, ColorModule],
})
export class AppModule {}