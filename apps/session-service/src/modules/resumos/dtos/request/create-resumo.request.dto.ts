import { IsOptional, IsString, MaxLength, MinLength } from 'class-validator'

/** POST /resumos: o gateway preenche os dois campos a partir do login (o site não escolhe). */
export class CreateResumoRequestDto {
  @IsString()
  @MinLength(1)
  participanteId: string

  @IsOptional()
  @IsString()
  @MaxLength(80)
  nome?: string | null
}
