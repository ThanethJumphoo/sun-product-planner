import { ManpowerService } from '../../manpower/manpower.service';
import { MpsService } from '../mps.service';
export declare class MpsExportService {
    private readonly manpowerService;
    private readonly mpsService;
    constructor(manpowerService: ManpowerService, mpsService: MpsService);
    generateProductionScheduleExcel(partName: string, monthStr: string): Promise<Buffer>;
}
