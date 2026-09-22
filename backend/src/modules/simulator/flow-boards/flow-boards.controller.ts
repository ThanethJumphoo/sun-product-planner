import { Controller, Get, Post, Body, Param, UseGuards, ParseIntPipe, Put } from '@nestjs/common';
import { FlowBoardsService } from './flow-boards.service';
import { JwtAuthGuard } from '../../../core/guards/jwt-auth.guard';

@Controller('api/v1/simulator/boards')
@UseGuards(JwtAuthGuard)
export class FlowBoardsController {
  constructor(private readonly flowBoardsService: FlowBoardsService) {}

  @Get()
  findAll() {
    return this.flowBoardsService.findAll();
  }

  @Get(':id')
  findOne(@Param('id', ParseIntPipe) id: number) {
    return this.flowBoardsService.findOne(id);
  }

  @Post()
  create(@Body() body: { name: string; nodes?: any[]; edges?: any[] }) {
    return this.flowBoardsService.create(body);
  }

  @Put(':id/save')
  saveBoard(@Param('id', ParseIntPipe) id: number, @Body() body: { name?: string; nodes: any[]; edges: any[] }) {
    return this.flowBoardsService.saveBoard(id, body);
  }
}
