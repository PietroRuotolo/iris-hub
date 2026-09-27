import { IsEmail, IsIn, MaxLength } from 'class-validator'

export class SendEmailRequestDto {
  @IsEmail()
  @MaxLength(254)
  para: string

  @IsIn(['welcome'])
  template: 'welcome'
}
