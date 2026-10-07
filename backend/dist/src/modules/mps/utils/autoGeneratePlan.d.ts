export declare function generateAutoPlanOnServer(partName: string, currentMonthStr: string): Promise<{
    generatedTransactions: any[];
    stats: any;
}>;
