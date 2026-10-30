import {
  Controller,
  Get,
  Post,
  Put,
  Delete,
  Param,
  Body,
  Query,
} from '@nestjs/common';
import {
  MachineCapacityService,
  CreateMachineMasterDto,
  UpdateMachineMasterDto,
  SaveMachineOverrideDto,
  BatchSaveActualMachineDto,
  SaveWeeklyDefaultsDto,
} from './machine-capacity.service';

@Controller('api/v1/machine-capacity')
export class MachineCapacityController {
  constructor(
    private readonly machineCapacityService: MachineCapacityService,
  ) {}

  // ==========================================
  // Machine-Centric Routes (Plant-Wide)
  // ==========================================

  @Get('machines')
  async getAllMachines(@Query('partName') partName?: string) {
    return this.machineCapacityService.getAllMachines(partName);
  }

  @Post('machines')
  async createMachineDirect(@Body() dto: CreateMachineMasterDto) {
    return this.machineCapacityService.createMachine(dto.partName, dto);
  }

  @Put('machines/:id')
  async updateMachine(
    @Param('id') id: string,
    @Body() dto: UpdateMachineMasterDto,
  ) {
    return this.machineCapacityService.updateMachine(Number(id), dto);
  }

  @Delete('machines/:id')
  async deleteMachine(@Param('id') id: string) {
    return this.machineCapacityService.deleteMachine(Number(id));
  }

  @Get('daily-plan')
  async getDailyPlanDirect(
    @Query('month') month?: string,
    @Query('partName') partName?: string,
  ) {
    return this.machineCapacityService.getDailyPlan(month, partName);
  }

  @Post('overrides')
  async saveOverridesDirect(
    @Body() overrides: SaveMachineOverrideDto[],
    @Query('partName') partName?: string,
  ) {
    return this.machineCapacityService.saveOverrides(partName, overrides);
  }

  @Delete('overrides')
  async resetOverridesDirect(
    @Query('machineId') machineId?: string,
    @Query('date') date?: string,
    @Query('partName') partName?: string,
  ) {
    return this.machineCapacityService.resetOverrides(
      partName,
      machineId ? Number(machineId) : undefined,
      date,
    );
  }

  @Get('daily-actual-form')
  async getDailyActualFormDirect(
    @Query('date') date: string,
    @Query('shift') shift?: string,
    @Query('partName') partName?: string,
  ) {
    return this.machineCapacityService.getDailyActualForm(
      date,
      shift || 'ALL',
      partName,
    );
  }

  @Post('actual-records')
  async saveActualRecordsDirect(
    @Body() dto: BatchSaveActualMachineDto,
    @Query('partName') partName?: string,
  ) {
    return this.machineCapacityService.saveActualRecords(dto, partName);
  }

  @Delete('actual-records')
  async deleteActualRecordsDirect(
    @Query('date') date: string,
    @Query('shift') shift?: string,
    @Query('machineId') machineId?: string,
    @Query('partName') partName?: string,
  ) {
    return this.machineCapacityService.deleteActualRecords(
      date,
      shift || 'ALL',
      machineId ? Number(machineId) : undefined,
      partName,
    );
  }

  @Get('plan-vs-actual')
  async getPlanVsActualDirect(
    @Query('month') month?: string,
    @Query('shift') shift?: string,
    @Query('partName') partName?: string,
  ) {
    return this.machineCapacityService.getPlanVsActual(
      month,
      shift || 'ALL',
      partName,
    );
  }

  @Get('weekly-defaults')
  async getWeeklyDefaultsDirect(@Query('partName') partName?: string) {
    return this.machineCapacityService.getWeeklyDefaults(partName);
  }

  @Put('weekly-defaults')
  async saveWeeklyDefaultsDirect(@Body() dto: SaveWeeklyDefaultsDto) {
    return this.machineCapacityService.saveWeeklyDefaults(dto);
  }

  // ==========================================
  // Backward-Compatible Routes (with :partName)
  // ==========================================

  @Get(':partName/machines')
  async getMachines(@Param('partName') partName: string) {
    return this.machineCapacityService.getAllMachines(partName);
  }

  @Post(':partName/machines')
  async createMachine(
    @Param('partName') partName: string,
    @Body() dto: CreateMachineMasterDto,
  ) {
    return this.machineCapacityService.createMachine(partName, dto);
  }

  @Get(':partName/daily-plan')
  async getDailyPlan(
    @Param('partName') partName: string,
    @Query('month') month: string,
  ) {
    return this.machineCapacityService.getDailyPlan(month, partName);
  }

  @Post(':partName/overrides')
  async saveOverrides(
    @Param('partName') partName: string,
    @Body() overrides: SaveMachineOverrideDto[],
  ) {
    return this.machineCapacityService.saveOverrides(partName, overrides);
  }

  @Delete(':partName/overrides')
  async resetOverrides(
    @Param('partName') partName: string,
    @Query('machineId') machineId?: string,
    @Query('date') date?: string,
  ) {
    return this.machineCapacityService.resetOverrides(
      partName,
      machineId ? Number(machineId) : undefined,
      date,
    );
  }

  @Get(':partName/daily-actual-form')
  async getDailyActualForm(
    @Param('partName') partName: string,
    @Query('date') date: string,
    @Query('shift') shift?: string,
  ) {
    return this.machineCapacityService.getDailyActualForm(
      date,
      shift || 'ALL',
      partName,
    );
  }

  @Post(':partName/actual-records')
  async saveActualRecords(
    @Param('partName') partName: string,
    @Body() dto: BatchSaveActualMachineDto,
  ) {
    return this.machineCapacityService.saveActualRecords(dto, partName);
  }

  @Delete(':partName/actual-records')
  async deleteActualRecords(
    @Param('partName') partName: string,
    @Query('date') date: string,
    @Query('shift') shift?: string,
    @Query('machineId') machineId?: string,
  ) {
    return this.machineCapacityService.deleteActualRecords(
      date,
      shift || 'ALL',
      machineId ? Number(machineId) : undefined,
      partName,
    );
  }

  @Get(':partName/plan-vs-actual')
  async getPlanVsActual(
    @Param('partName') partName: string,
    @Query('month') month: string,
    @Query('shift') shift?: string,
  ) {
    return this.machineCapacityService.getPlanVsActual(
      month,
      shift || 'ALL',
      partName,
    );
  }

  @Get(':partName/weekly-defaults')
  async getWeeklyDefaults(@Param('partName') partName: string) {
    return this.machineCapacityService.getWeeklyDefaults(partName);
  }

  @Put(':partName/weekly-defaults')
  async saveWeeklyDefaults(
    @Param('partName') _partName: string,
    @Body() dto: SaveWeeklyDefaultsDto,
  ) {
    return this.machineCapacityService.saveWeeklyDefaults(dto);
  }
}
