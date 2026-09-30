import { IsOptional, IsString } from 'class-validator'

export class CreateReflexSessionRequestDto {
  @IsOptional()
  @IsString()
  participanteId?: string
}