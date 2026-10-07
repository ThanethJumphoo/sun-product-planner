const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();
async function check() { 
  const boards = await prisma.flowBoard.findMany(); 
  console.log(boards.map(b => b.name)); 
} 
check().finally(()=>prisma.$disconnect());
