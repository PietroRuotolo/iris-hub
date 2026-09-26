import { Transform } from 'class-transformer'
import { IsEmail, IsString, Matches, MaxLength } from 'class-validator'

export class RegisterUserRequestDto {
  @Transform(({ value }) => (typeof value === 'string' ? value.trim().replace(/\s+/g, ' ') : value))
  @IsString()
  @MaxLength(40)
  @Matches(/^(?=(?:.*[\p{L}\p{M}]){3})[\p{L}\p{M}]+(?:[ '\u2019-][\p{L}\p{M}]+)*$/u, {
    message: 'Informe pelo menos 3 letras e não use números',
  })
  nome: string

  @Transform(({ value }) => (typeof value === 'string' ? value.trim().toLowerCase() : value))
  @IsEmail()
  email: string
}
