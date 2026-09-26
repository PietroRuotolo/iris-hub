import { Module } from '@nestjs/common'
import { AuthController } from './controllers/auth.controller.js'
import { AuthRepository } from './repositories/auth.repository.js'
import { AuthService } from './services/auth.service.js'

@Module({
  controllers: [AuthController],
  providers: [AuthService, AuthRepository],
})
export class AuthModule {}
