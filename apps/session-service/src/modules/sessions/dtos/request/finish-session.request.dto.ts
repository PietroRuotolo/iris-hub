import { IsIn, IsOptional, IsString } from 'class-validator'

/** POST /sessions/:id/finish: CONCLUIDA ao fim da fase 5; CANCELADA se a pessoa parou antes. */
export class FinishSessionRequestDto {
  @IsOptional()
  @IsString()
  participanteId?: string | null

  @IsIn(['CONCLUIDA', 'CANCELADA'])
  status: 'CONCLUIDA' | 'CANCELADA'
}
