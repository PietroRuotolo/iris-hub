import { Transform, Type } from 'class-transformer'
import { IsIn, IsOptional, IsString, IsUrl, Matches, MaxLength, ValidateIf, ValidateNested } from 'class-validator'

export const TIPOS_IMAGEM = ['image/png', 'image/jpeg', 'image/webp'] as const

export class ImagemWhatsappDto {
  /** Endereço público da imagem (o provedor baixa de lá). */
  @IsUrl({ protocols: ['https', 'http'], require_protocol: true })
  @MaxLength(2048)
  url: string

  /** Sem ele, sai pela extensão do endereço (png por padrão). */
  @IsOptional()
  @IsIn(TIPOS_IMAGEM)
  tipo?: (typeof TIPOS_IMAGEM)[number]

  @IsOptional()
  @IsString()
  @MaxLength(120)
  nomeArquivo?: string
}

/**
 * POST /whatsapp/send. Com `template: 'welcome'`: a imagem de boas-vindas, com legenda e imagem das
 * variáveis de ambiente. Sem template e sem `imagem`: mensagem de texto (`texto` obrigatório). Com
 * `imagem`: a imagem, com o `texto` como legenda (opcional).
 */
export class SendWhatsappRequestDto {
  /** Telefone com DDD, com ou sem o 55 do Brasil; qualquer formatação ("(11) 98765-4321"). */
  @Transform(({ value }) => (typeof value === 'string' ? value.replace(/\D/g, '') : value))
  @IsString()
  @Matches(/^(55)?[1-9]{2}9?\d{8}$/, { message: 'Informe o telefone com DDD (com ou sem o 55)' })
  para: string

  @IsOptional()
  @IsIn(['welcome'])
  template?: 'welcome'

  @ValidateIf((dados: SendWhatsappRequestDto) => (!dados.imagem && !dados.template) || dados.texto !== undefined)
  @IsString({ message: 'Informe o texto da mensagem (ou uma imagem)' })
  @MaxLength(4096, { message: 'O texto pode ter no máximo 4096 caracteres' })
  texto?: string

  @IsOptional()
  @ValidateNested()
  @Type(() => ImagemWhatsappDto)
  imagem?: ImagemWhatsappDto
}
