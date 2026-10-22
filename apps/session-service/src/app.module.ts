import { Module } from '@nestjs/common'
import { ModuloCompartilhado, ModuloPrisma } from '@iris/shared'
import { ReflexModule } from './modules/reflex/reflex.module.js'
import { RankingModule } from './modules/ranking/ranking.module.js'
import { RhythmModule } from './modules/rhythm/rhythm.module.js'
import { ColorModule } from './modules/color/color.module.js'

// Partidas dos jogos: o ritmo (rhythm_sessions, rhythm_phases e rhythm_targets), o reflexo
// (reflex_sessions e reflex_attempts) e as cores (color_sessions e color_rounds). E o ranking geral, lido
// das três.
@Module({
  imports: [ModuloCompartilhado.paraServico('session-service'), ModuloPrisma, RhythmModule, ReflexModule, ColorModule, RankingModule],
})
export class AppModule {}