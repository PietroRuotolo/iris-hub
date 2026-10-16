import { Transform } from 'class-transformer'
import { IsEmail, IsString, Matches, MaxLength } from 'class-validator'

/** POST /users: dados do cadastro (rota própria de criação de conta). */
export class CreateUserRequestDto {
  @Transform(({ value }) => (typeof value === 'string' ? value.trim().replace(/\s+/g, ' ') : value))
  @IsString()
  @MaxLength(40)
  @Matches(/^(?=(?:.*[\p{L}\p{M}]){3})[\p{L}\p{M}]+(?:[ '’-][\p{L}\p{M}]+)*$/u, {
    message: 'Informe pelo menos 3 letras e não use números',
  })
  // Nome e sobrenome: duas palavras ou mais, a primeira e a última com pelo menos 2 letras.
  @Matches(/^\S{2,}(?: \S+)* \S{2,}$/u, { message: 'Informe nome e sobrenome' })
  nome: string

  @Transform(({ value }) => (typeof value === 'string' ? value.trim().toLowerCase() : value))
  @IsEmail({}, { message: 'Informe um e-mail válido' })
  email: string

  // Aceita qualquer formatação ("(11) 98765-4321") e guarda só os números.
  @Transform(({ value }) => (typeof value === 'string' ? value.replace(/\D/g, '') : value))
  @IsString()
  @Matches(/^[1-9]{2}9?\d{8}$/, { message: 'Informe o telefone com DDD (10 ou 11 dígitos)' })
  telefone: string
}
