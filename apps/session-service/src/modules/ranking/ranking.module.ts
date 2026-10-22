import { Module } from '@nestjs/common'
import { RankingController } from './controllers/ranking.controller.js'
import { RankingRepository } from './repositories/ranking.repository.js'
import { RankingService } from './services/ranking.service.js'

@Module({
  controllers: [RankingController],
  providers: [RankingService, RankingRepository],
})
export class RankingModule {}