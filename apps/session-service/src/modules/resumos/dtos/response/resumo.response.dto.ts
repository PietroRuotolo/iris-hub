import type { ResumoCompartilhado, ResumoCriado } from '@iris/contracts'
import type { Sessao, SessaoCores, SessaoReflexo } from '@prisma/client'
import { CoresSessionResponseDto } from '../../../sessions/dtos/response/cores-session.response.dto.js'
import { ReflexSessionResponseDto } from '../../../sessions/dtos/response/reflex-session.response.dto.js'
import { SessionResponseDto } from '../../../sessions/dtos/response/session.response.dto.js'

export class ResumoCriadoResponseDto implements ResumoCriado {
  token: string
  expiraEm: string
  sessoes: ResumoCriado['sessoes']
}

export class ResumoCompartilhadoResponseDto implements ResumoCompartilhado {
  nome: string | null
  criadoEm: string
  expiraEm: string
  ritmo: SessionResponseDto | null
  reflexo: ReflexSessionResponseDto | null
  cores: CoresSessionResponseDto | null

  static de(
    resumo: { nome: string | null; criadoEm: Date; expiraEm: Date },
    sessoes: { ritmo: Sessao | null; reflexo: SessaoReflexo | null; cores: SessaoCores | null },
  ): ResumoCompartilhadoResponseDto {
    return Object.assign(new ResumoCompartilhadoResponseDto(), {
      nome: resumo.nome ?? null,
      criadoEm: resumo.criadoEm.toISOString(),
      expiraEm: resumo.expiraEm.toISOString(),
      ritmo: sessoes.ritmo ? SessionResponseDto.de(sessoes.ritmo) : null,
      reflexo: sessoes.reflexo ? ReflexSessionResponseDto.de(sessoes.reflexo) : null,
      cores: sessoes.cores ? CoresSessionResponseDto.de(sessoes.cores) : null,
    })
  }
}
