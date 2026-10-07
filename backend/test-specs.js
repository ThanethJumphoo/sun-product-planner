const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();
async function check() { 
  const specs = await prisma.productSpec.findMany({where: {itemCategory: 'coproduct'}}); 
  console.log(specs); 
} 
check().finally(()=>prisma.$disconnect());
