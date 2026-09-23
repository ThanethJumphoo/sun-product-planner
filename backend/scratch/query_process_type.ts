import { PrismaClient } from '@prisma/client';
const prisma = new PrismaClient();

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
