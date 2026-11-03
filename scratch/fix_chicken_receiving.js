const fs = require('fs');
const path = require('path');

const file = path.join(__dirname, '../backend/src/modules/master-data/chicken-receiving/chicken-receiving.service.ts');
let content = fs.readFileSync(file, 'utf8');
let norm = content.replace(/\r\n/g, '\n');

const oldTarget = `  async bulkCreateMonthlyRecords(records: any[]) {
    const formattedRecords = records.map((data) => {
      const receiveDate = new Date(data.receiveDate);
      const totalWeight = Number(data.totalWeight);
      const numberOfChickens = Number(data.numberOfChickens);
      const averageWeight =
        numberOfChickens > 0
          ? Number((totalWeight / numberOfChickens).toFixed(2))
          : 0;
      return {
        receiveDate,
        numberOfChickens,
        totalWeight,
        averageWeight,
      };
    });

    return prisma.monthlyChickenReceiving.createMany({
      data: formattedRecords,
    });
  }`;

const newTarget = `  async bulkCreateMonthlyRecords(records: any[]) {
    const formattedRecords = records.map((data) => {
      let receiveDate: Date;
      if (typeof data.receiveDate === 'string' && /^\\d{4}-\\d{2}-\\d{2}$/.test(data.receiveDate)) {
        const [y, m, d] = data.receiveDate.split('-').map(Number);
        receiveDate = new Date(Date.UTC(y, m - 1, d));
      } else {
        receiveDate = new Date(data.receiveDate);
      }

      const totalWeight = Number(data.totalWeight);
      const numberOfChickens = Number(data.numberOfChickens);
      const averageWeight =
        numberOfChickens > 0
          ? Number((totalWeight / numberOfChickens).toFixed(2))
          : 0;
      return {
        receiveDate,
        numberOfChickens,
        totalWeight,
        averageWeight,
      };
    });

    const dates = formattedRecords.map((r) => r.receiveDate);
    await prisma.monthlyChickenReceiving.deleteMany({
      where: { receiveDate: { in: dates } },
    });

    return prisma.monthlyChickenReceiving.createMany({
      data: formattedRecords,
    });
  }`;

if (norm.includes(oldTarget)) {
  norm = norm.replace(oldTarget, newTarget);
  fs.writeFileSync(file, norm, 'utf8');
  console.log('SUCCESS: Updated bulkCreateMonthlyRecords');
} else {
  console.log('NOT FOUND');
}

