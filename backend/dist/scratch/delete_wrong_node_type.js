"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const client_1 = require("@prisma/client");
const prisma = new client_1.PrismaClient();
async function main() {
    await prisma.flowNodeTypeField.deleteMany({
        where: { nodeTypeId: 1003 }
    });
    await prisma.flowNodeType.delete({
        where: { id: 1003 }
    });
    console.log("Deleted PROCESS node type.");
}
main().catch(e => {
    console.error(e);
    process.exit(1);
}).finally(() => {
    prisma.$disconnect();
});
//# sourceMappingURL=delete_wrong_node_type.js.map