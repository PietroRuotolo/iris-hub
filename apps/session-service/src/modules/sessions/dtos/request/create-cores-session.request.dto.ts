import { IsOptional, IsString } from 'class-validator'

/** POST /sessions/cores: começa a partida. O participanteId vem do gateway, a partir do login. */
export class CreateCoresSessionRequestDto {
  @IsOptional()
  @IsString()
  participanteId?: string | null
}
