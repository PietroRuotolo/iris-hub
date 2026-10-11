import { Transform, Type } from 'class-transformer'
import { IsInt, IsOptional, IsString, Max, Min, MinLength } from 'class-validator'

/** GET /users?busca=&limite=: busca de jogadores pelo nome (pelo menos 2 letras). */
export class SearchUsersRequestDto {
  @Transform(({ value }) => (typeof value === 'string' ? value.trim() : value))
  @IsString()
  @MinLength(2, { message: 'Digite pelo menos 2 letras' })
  busca: string

  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  @Max(50)
  limite?: number
}
