export declare function isItemNode(n: any): boolean;
export declare function isRmNode(n: any): boolean;
export declare function isProcessNode(n: any): boolean;
export declare function isMachineNode(n: any): boolean;
export declare function generateAutoPlanOnServer(partName: string, currentMonthStr: string): Promise<{
    generatedTransactions: any[];
    stats: any;
}>;
