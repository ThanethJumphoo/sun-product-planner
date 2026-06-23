import { Module } from '@nestjs/common';
import { ChickenYieldsController } from './chicken-yields.controller';
import { ChickenYieldsService } from './chicken-yields.service';
import { PrismaModule } from '../../../core/prisma/prisma.module';

@Module({
  imports: [PrismaModule],
  controllers: [ChickenYieldsController],
  providers: [ChickenYieldsService],
  exports: [ChickenYieldsService],
})
export class ChickenYieldsModule {}
