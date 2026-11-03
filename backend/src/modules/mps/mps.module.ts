import { Module } from '@nestjs/common';
import { MpsController } from './mps.controller';
import { MpsService } from './mps.service';
import { MpsExportService } from './services/mps-export.service';
import { ManpowerModule } from '../manpower/manpower.module';

@Module({
  imports: [ManpowerModule],
  controllers: [MpsController],
  providers: [MpsService, MpsExportService],
  exports: [MpsService, MpsExportService],
})
export class MpsModule {}
