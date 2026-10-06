import { format, subDays, isSameMonth, addDays, startOfMonth, endOfMonth, isSameDay } from "date-fns";
import api from '@/lib/api';

export interface AutoGenerateParams {
  partName: string;
  currentMonth: Date;
  plannedDemands: any[];
  specs: Record<string, any>;
  calculatedSupply: Record<string, number>;
  monthlyPlans: any[]; // existing plans
}

export const generateAutoPlan = async (params: AutoGenerateParams) => {
  const { partName, currentMonth, plannedDemands, specs, calculatedSupply, monthlyPlans } = params;

  const monthStart = startOfMonth(currentMonth);
  const monthEnd = endOfMonth(currentMonth);
  
  const dateFrom = format(monthStart, 'yyyy-MM-dd');
  const dateTo = format(monthEnd, 'yyyy-MM-dd');

  // Fetch wdMatrix and chicken data
  console.log("autoGeneratePlan: Fetching API data...");
  const [wdRes, weeklyRes, monthlyRes] = await Promise.all([
    api.get(`/api/v1/weight-distribution`, { params: { partName }, timeout: 10000 }),
    api.get('/chicken-receiving/weekly', { params: { dateFrom, dateTo, limit: 1000 }, timeout: 10000 }),
    api.get('/chicken-receiving/monthly', { params: { dateFrom, dateTo, limit: 1000 }, timeout: 10000 })
  ]);
  console.log("autoGeneratePlan: API data fetched!");
  
  const wdMatrix = wdRes.data || [];
  const weeklyRecords = weeklyRes.data?.data || weeklyRes.data || [];
  const monthlyRecords = monthlyRes.data?.data || monthlyRes.data || [];

  // 1. Initialize Daily Supply State
  // Map of 'YYYY-MM-DD' -> array of buckets
  const dailySupplyState: Record<string, any[]> = {};

  // Populate dailySupplyState for all days in month
  let d = monthStart;
  while (d <= monthEnd) {
    const dateStr = format(d, 'yyyy-MM-dd');
    const totalWeight = calculatedSupply[dateStr] || 0;
    
    // Find average weight for this day
    const monthlyRec = monthlyRecords.find((r: any) => isSameDay(new Date(r.receiveDate), d));
    const weeklyRecs = weeklyRecords.filter((r: any) => isSameDay(new Date(r.receiveDate), d));
    const weeklyCount = weeklyRecs.reduce((sum: number, r: any) => sum + Number(r.totalCount), 0);
    const weeklyTotalWeight = weeklyRecs.reduce((sum: number, r: any) => sum + Number(r.totalWeight), 0);
    
    let avgWeight = 0;
    if (weeklyCount > 0) {
      avgWeight = weeklyTotalWeight / weeklyCount;
    } else if (monthlyRec) {
      avgWeight = Number(monthlyRec.averageWeight || 0);
    }
    
    const roundedAvgWeight = Number(Number(avgWeight).toFixed(2));
    
    // Find matching chicken weight range in wdMatrix
    const row = wdMatrix.find((r: any) => 
      roundedAvgWeight >= Number(r.chickenWeight.minWeight) && roundedAvgWeight <= Number(r.chickenWeight.maxWeight)
    );
    
    let dayBuckets: any[] = [];
    if (row && row.rmSizes) {
      dayBuckets = row.rmSizes.map((rmDist: any) => {
        const rm = rmDist.rmSize;
        const percent = Number(rmDist.percent) || 0;
        const weight = (percent / 100) * totalWeight;
        return {
          id: rm.id,
          name: rm.minSize && rm.maxSize ? `${rm.minSize}-${rm.maxSize}g` : rm.minSize ? `>${rm.minSize}g` : rm.maxSize ? `<${rm.maxSize}g` : 'Unsize',
          minSize: rm.minSize || 0,
          percent,
          remaining: weight
        };
      }).filter((s: any) => s.percent > 0).sort((a: any, b: any) => a.minSize - b.minSize);
    } else if (totalWeight > 0) {
      // Fallback: If no weight distribution found (e.g. no avg weight), put all supply into an Unsize bucket
      dayBuckets = [{
        id: 'Unsize',
        name: 'Unsize',
        minSize: 0,
        percent: 100,
        remaining: totalWeight
      }];
    }

    dailySupplyState[dateStr] = dayBuckets;
    d = addDays(d, 1);
  }
  console.log("autoGeneratePlan: Finished populating dailySupplyState");

  // Deduct already existing monthlyPlans from dailySupplyState
  for (const plan of monthlyPlans) {
    const spec = specs[plan.itemCode];
    if (spec && spec.itemCategory === 'product') {
      const planDateStr = format(new Date(plan.planDate), 'yyyy-MM-dd');
      const buckets = dailySupplyState[planDateStr];
      if (buckets) {
        const yieldPercent = spec.yieldPercent || 100;
        const requiredRM = Number(plan.plannedQty) / (yieldPercent / 100);
        
        if (plan.allocatedRmSize && plan.allocatedRmSize !== 'Unsize' && plan.allocatedRmSize !== 'All') {
          const bucket = buckets.find(b => b.id.toString() === plan.allocatedRmSize.toString());
          if (bucket) {
            bucket.remaining -= requiredRM;
          }
        }
      }
    }
  }

  // 2. Sort demands by priority (lowest number = highest priority)
  const sortedDemands = [...plannedDemands].sort((a, b) => Number(a.priority) - Number(b.priority));

  const generatedTransactions: any[] = [];
  
  // Track current max splitIndex per day-so-item to avoid conflicts
  const splitIndexTracker: Record<string, number> = {};
  
  // Initialize tracker with existing monthlyPlans
  for (const p of monthlyPlans) {
    const key = `${format(new Date(p.planDate), 'yyyy-MM-dd')}_${p.soNumber}_${p.itemCode}`;
    if (!splitIndexTracker[key] || p.splitIndex > splitIndexTracker[key]) {
      splitIndexTracker[key] = p.splitIndex;
    }
  }

  // 3. Process each demand
  for (const demand of sortedDemands) {
    const spec = specs[demand.itemCode];
    if (!spec) continue;

    // Calculate remaining quantity to fulfill
    const alreadyPlanned = monthlyPlans
      .filter(p => p.soNumber === demand.soNumber && p.itemCode === demand.itemCode)
      .reduce((sum, p) => sum + Number(p.plannedQty), 0);
    
    const newlyPlanned = generatedTransactions
      .filter(p => p.soNumber === demand.soNumber && p.itemCode === demand.itemCode)
      .reduce((sum, p) => sum + Number(p.plannedQty), 0);

    let remainingPlanQty = Number(demand.planQty) - alreadyPlanned - newlyPlanned;
    if (remainingPlanQty <= 0) continue;

    const leadMinDays = spec.leadMinDays || 1;
    const leadMaxDays = spec.leadMaxDays || 3;
    const shipDate = new Date(demand.shipDate);
    if (isNaN(shipDate.getTime())) continue; // Skip if invalid date
    
    const targetStartDate = subDays(shipDate, leadMaxDays);
    const targetEndDate = subDays(shipDate, leadMinDays);

    const validTargetDates: string[] = [];
    let currDate = targetStartDate;
    let safeguard = 0;
    while (currDate <= targetEndDate && safeguard < 100) {
      if (isSameMonth(currDate, currentMonth)) {
        validTargetDates.push(format(currDate, 'yyyy-MM-dd'));
      }
      currDate = addDays(currDate, 1);
      safeguard++;
    }
    if (safeguard >= 100) console.log("WARNING: Safeguard triggered in validTargetDates loop");

    if (validTargetDates.length === 0) continue;
    validTargetDates.reverse();

    const yieldPercent = spec.yieldPercent || 100;
    let requiredRM = remainingPlanQty / (yieldPercent / 100);

    const isProduct = spec.itemCategory === 'product';
    let allowedSizes: string[] = [];
    try { allowedSizes = JSON.parse(spec.rmSizesJson || '[]'); } catch(e){}

    // 4. Allocate across valid target dates
    for (const dateStr of validTargetDates) {
      if (remainingPlanQty <= 0.01) break;

      const buckets = dailySupplyState[dateStr];
      if (!buckets && isProduct) continue; 

      if (!isProduct) {
        const key = `${dateStr}_${demand.soNumber}_${demand.itemCode}`;
        const nextIndex = (splitIndexTracker[key] !== undefined ? splitIndexTracker[key] : -1) + 1;
        splitIndexTracker[key] = nextIndex;
        
        generatedTransactions.push({
          planDate: dateStr,
          soNumber: demand.soNumber,
          lineNumber: demand.lineNumber,
          itemCode: demand.itemCode,
          plannedQty: remainingPlanQty,
          allocatedRmSize: null,
          splitIndex: nextIndex
        });
        remainingPlanQty = 0;
        break;
      }

      const isUnsizeAllowed = allowedSizes.length === 0 || allowedSizes.includes('Unsize') || allowedSizes.includes('All');
      const eligibleBuckets = buckets.filter(b => {
        if (b.remaining <= 0) return false;
        if (isUnsizeAllowed) return true;
        return allowedSizes.includes(b.id.toString());
      });

      let splitCountForDay = 0;

      for (const bucket of eligibleBuckets) {
        if (remainingPlanQty <= 0.01) break;

        const availableRM = bucket.remaining;
        // WARNING: If requiredRM is Infinity, rmToTake is availableRM.
        const rmToTake = Math.min(requiredRM, availableRM);
        // WARNING: If yieldPercent is 0, qtyProduced is 0!
        const qtyProduced = rmToTake * (yieldPercent / 100);

        // Safeguard to prevent infinite loops if qty is 0
        if (rmToTake <= 0) break;

        bucket.remaining -= rmToTake;
        // Handle infinity correctly to avoid NaN
        if (requiredRM !== Infinity) {
          requiredRM -= rmToTake;
        }
        remainingPlanQty -= qtyProduced;

        const key = `${dateStr}_${demand.soNumber}_${demand.itemCode}`;
        const nextIndex = (splitIndexTracker[key] !== undefined ? splitIndexTracker[key] : -1) + 1;
        splitIndexTracker[key] = nextIndex;

        generatedTransactions.push({
          planDate: dateStr,
          soNumber: demand.soNumber,
          lineNumber: demand.lineNumber,
          itemCode: demand.itemCode,
          plannedQty: Number(qtyProduced.toFixed(2)),
          allocatedRmSize: bucket.id.toString(),
          splitIndex: nextIndex
        });
      }
    }
  }

  return generatedTransactions;
};
