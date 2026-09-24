"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const client_1 = require("@prisma/client");
const prisma = new client_1.PrismaClient();
async function main() {
    await prisma.flowNodeType.delete({
        where: { id: 2003 }
    });
    await prisma.flowNodeType.update({
        where: { id: 1002 },
        data: { typeCode: 'WEIGHT_DISTRIBUTION' }
    });
    console.log("Fixed duplicates!");
}
main().catch(console.error).finally(() => prisma.$disconnect());
//# sourceMappingURL=fix_duplicate.js.map