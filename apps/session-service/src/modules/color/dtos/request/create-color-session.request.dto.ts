import { Type } from 'class-transformer'
import { ArrayMaxSize, ArrayMinSize, IsArray, IsDateString, IsIn, IsInt, IsString, IsUUID, Max, Min, ValidateIf, ValidateNested } from 'class-validator'
import { TAMANHOS_FASES_CORES, TEMPO_POR_COR_MS, TOTAL_CORES, TOTAL_FASES_CORES } from '@iris/contracts'
import { ACIONAMENTOS_CORES, type AcionamentoCores } from '../../services/regras.js'

const MAIOR_SEQUENCIA = Math.max(...TAMANHOS_FASES_CORES)
const MENOR_SEQUENCIA = Math.min(...TAMANHOS_FASES_CORES)

/** Uma fase como o site mediu. Sem resultado nem pontos: o serviço calcula. */
export class ColorRoundDto {
  @IsInt()
  @Min(1)
  @Max(TOTAL_FASES_CORES)
  roundNumber: number

  /** A sequência mostrada: cores de 0 a 4 (cinza, amarelo, verde, vermelho, azul). */
  @IsArray()
  @ArrayMinSize(MENOR_SEQUENCIA)
  @ArrayMaxSize(MAIOR_SEQUENCIA)
  @IsInt({ each: true })
  @Min(0, { each: true })
  @Max(TOTAL_CORES - 1, { each: true })
  expectedSequence: number[]

  /** As cores apertadas, na ordem (para no primeiro erro; vazia se não apertou nada). */
  @IsArray()
  @ArrayMaxSize(MAIOR_SEQUENCIA)
  @IsInt({ each: true })
  @Min(0, { each: true })
  @Max(TOTAL_CORES - 1, { each: true })
  playerSequence: number[]

  /** Do começo da vez da pessoa até o último aperto; null se não apertou nada. */
  @ValidateIf((_, valor) => valor !== null)
  @IsInt()
  @Min(0)
  @Max(MAIOR_SEQUENCIA * TEMPO_POR_COR_MS * 2)
  responseTimeMs: number | null
}

/**
 * POST /color-sessions: a partida inteira, quando termina (o site só grava no fim). completed = as 5
 * fases; abandoned = parou no meio (só as fases jogadas).
 */
export class CreateColorSessionRequestDto {
  /** Gerado pelo site no começo da partida: repetir o envio da mesma partida não a duplica. */
  @IsUUID()
  id: string

  /** Preenchido pelo gateway com o jogador conferido (o site não escolhe de quem é a partida). */
  @IsString()
  playerId: string

  @IsIn(['completed', 'abandoned'])
  status: 'completed' | 'abandoned'

  @IsIn(ACIONAMENTOS_CORES)
  inputSource: AcionamentoCores

  @IsDateString()
  startedAt: string

  @IsArray()
  @ArrayMinSize(1)
  @ArrayMaxSize(TOTAL_FASES_CORES)
  @ValidateNested({ each: true })
  @Type(() => ColorRoundDto)
  rounds: ColorRoundDto[]
}