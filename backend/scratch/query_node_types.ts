import { PrismaClient } from '@prisma/client';
const prisma = new PrismaClient();

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
