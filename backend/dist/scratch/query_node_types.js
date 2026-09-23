"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const client_1 = require("@prisma/client");
const prisma = new client_1.PrismaClient();
async function main() {
    const nodeTypes = await prisma.flowNodeType.findMany();
    console.log(JSON.stringify(nodeTypes, null, 2));
}
main().catch(e => {
    console.error(e);
    process.exit(1);
}).finally(() => {
    prisma.$disconnect();
});
//# sourceMappingURL=query_node_types.js.map