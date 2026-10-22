import { Module } from '@nestjs/common'
import { RankingClient } from './clients/ranking.client.js'
import { RankingController } from './controllers/ranking.controller.js'

@Module({
  controllers: [RankingController],
  providers: [RankingClient],
})
export class RankingModule {}