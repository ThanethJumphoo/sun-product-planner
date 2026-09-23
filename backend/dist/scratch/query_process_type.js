"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const client_1 = require("@prisma/client");
const prisma = new client_1.PrismaClient();
async function main() {
    const processType = await prisma.flowNodeType.findUnique({
        where: { id: 1003 },
        include: { fields: true }
    });
    console.log(JSON.stringify(processType, null, 2));
}
main().catch(e => {
    console.error(e);
    process.exit(1);
}).finally(() => {
    prisma.$disconnect();
});
//# sourceMappingURL=query_process_type.js.map