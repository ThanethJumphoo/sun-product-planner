const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();
async function main() {
  console.log('Node Types:', await prisma.flowNodeType.findMany());
  console.log('Nodes:', await prisma.flowNode.findMany({ select: { name: true, nodeTypeId: true } }));
  await prisma.$disconnect();
}
main();
