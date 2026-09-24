"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const client_1 = require("@prisma/client");
const prisma = new client_1.PrismaClient();
async function main() {
    const result = await prisma.flowNodeType.findMany({
        where: { typeName: { contains: 'Weight' } },
        include: { fields: true }
    });
    console.dir(result, { depth: null });
}
main().catch(console.error).finally(() => prisma.$disconnect());
//# sourceMappingURL=check_duplicate.js.map