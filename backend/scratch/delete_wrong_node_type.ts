import { PrismaClient } from '@prisma/client';
const prisma = new PrismaClient();

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
