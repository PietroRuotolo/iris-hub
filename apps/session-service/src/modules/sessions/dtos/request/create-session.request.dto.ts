import { IsMongoId, IsOptional, IsString } from 'class-validator'

/** POST /sessions: inicia uma sessão do jogo a partir de uma calibração já salva. */
export class CreateSessionRequestDto {
  @IsMongoId()
  calibracaoId: string

  @IsOptional()
  @IsString()
  participanteId?: string
}
