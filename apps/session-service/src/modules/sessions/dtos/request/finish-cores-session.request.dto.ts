import { Type } from 'class-transformer'
import { ArrayMaxSize, IsArray, IsBoolean, IsIn, IsInt, IsNumber, IsOptional, IsString, Max, Min, ValidateNested } from 'class-validator'
import { MAX_RODADAS_CORES, TEMPO_RESPOSTA_MAXIMO_MS } from '@iris/contracts'

export class RodadaCoresDto {
  @IsInt()
  @Min(1)
  @Max(MAX_RODADAS_CORES)
  rodada: number

  @IsInt()
  @Min(1)
  @Max(MAX_RODADAS_CORES)
  tamanhoSequencia: number

  @IsBoolean()
  acertou: boolean

  /** null se o site não conseguiu medir (ex.: a conexão com o ESP32 caiu no meio da rodada). */
  @IsOptional()
  @IsInt()
  @Min(0)
  @Max(TEMPO_RESPOSTA_MAXIMO_MS)
  tempoRespostaMs?: number | null
}

/**
 * POST /sessions/cores/:id/finish. CONCLUIDA exige ao menos uma rodada (o serviço confere); CANCELADA
 * pode vir sem nenhuma. A pontuação final é a que o ESP32 informou: o serviço só a guarda.
 */
export class FinishCoresSessionRequestDto {
  @IsOptional()
  @IsString()
  participanteId?: string | null

  @IsIn(['CONCLUIDA', 'CANCELADA'])
  status: 'CONCLUIDA' | 'CANCELADA'

  @IsOptional()
  @IsNumber()
  @Min(0)
  @Max(MAX_RODADAS_CORES * MAX_RODADAS_CORES)
  pontuacaoFinal?: number | null

  @IsArray()
  @ArrayMaxSize(MAX_RODADAS_CORES)
  @ValidateNested({ each: true })
  @Type(() => RodadaCoresDto)
  rodadas: RodadaCoresDto[]
}
