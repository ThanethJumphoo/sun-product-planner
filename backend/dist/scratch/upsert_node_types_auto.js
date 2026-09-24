"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const client_1 = require("@prisma/client");
const prisma = new client_1.PrismaClient();
const PREDEFINED_TYPES = [
    { code: 'MAIN', name: 'Main' },
    { code: 'PART', name: 'Parts' },
    { code: 'WEIGHT_DISTRIBUTION', name: 'Weight Distribution' },
    { code: 'PROCESS', name: 'Process' },
    { code: 'RAW_MATERIAL', name: 'Raw Material' },
    { code: 'MACHINE', name: 'Machine' },
];
async function main() {
    for (const type of PREDEFINED_TYPES) {
        const existing = await prisma.flowNodeType.findUnique({
            where: { typeCode: type.code }
        });
        if (!existing) {
            await prisma.flowNodeType.create({
                data: {
                    typeCode: type.code,
                    typeName: type.name
                }
            });
            console.log(`Created node type: ${type.code}`);
        }
        else {
            console.log(`Node type already exists: ${type.code}`);
        }
    }
}
main().catch(e => {
    console.error(e);
    process.exit(1);
}).finally(() => {
    prisma.$disconnect();
});
//# sourceMappingURL=upsert_node_types_auto.js.map