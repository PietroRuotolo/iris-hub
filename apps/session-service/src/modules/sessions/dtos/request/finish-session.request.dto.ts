import { Type } from 'class-transformer'
import { IsArray, IsIn, IsNumber, IsOptional, IsString, Min, ValidateNested } from 'class-validator'
import { TIPOS_EVENTO_JOGO, type EventoJogo, type TipoEventoJogo } from '@iris/contracts'

export class EventoJogoRequestDto implements EventoJogo {
  @IsIn(TIPOS_EVENTO_JOGO)
  tipo: TipoEventoJogo

  @IsNumber()
  @Min(0)
  instanteMs: number

  @IsOptional()
  @IsString()
  alvoId?: string

  @IsOptional()
  @IsNumber()
  @Min(0)
  tempoRespostaMs?: number

  @IsOptional()
  @IsNumber()
  @Min(0)
  precisaoPx?: number
}

/** POST /sessions/:id/finish: encerra a sessão enviando todos os eventos registrados no jogo. */
export class FinishSessionRequestDto {
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => EventoJogoRequestDto)
  eventos: EventoJogoRequestDto[]
}
