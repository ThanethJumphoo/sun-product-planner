"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const client_1 = require("@prisma/client");
const prisma = new client_1.PrismaClient();
async function main() {
    await prisma.flowNodeType.upsert({
        where: { typeCode: 'MAIN' },
        update: { typeName: 'Main' },
        create: { typeCode: 'MAIN', typeName: 'Main' },
    });
    await prisma.flowNodeType.upsert({
        where: { typeCode: 'PART' },
        update: { typeName: 'Parts' },
        create: { typeCode: 'PART', typeName: 'Parts' },
    });
    await prisma.flowNodeType.upsert({
        where: { typeCode: 'WEIGHT' },
        update: { typeName: 'Weight Distribution' },
        create: { typeCode: 'WEIGHT', typeName: 'Weight Distribution' },
    });
    await prisma.flowNodeType.upsert({
        where: { typeCode: 'PROCESS' },
        update: { typeName: 'Process' },
        create: { typeCode: 'PROCESS', typeName: 'Process' },
    });
    await prisma.flowNodeType.upsert({
        where: { typeCode: 'RAW_MATERIAL' },
        update: { typeName: 'Raw Material' },
        create: { typeCode: 'RAW_MATERIAL', typeName: 'Raw Material' },
    });
    console.log("Upserted all required Node Types.");
}
main().catch(e => {
    console.error(e);
    process.exit(1);
}).finally(() => {
    prisma.$disconnect();
});
//# sourceMappingURL=upsert_node_types.js.map