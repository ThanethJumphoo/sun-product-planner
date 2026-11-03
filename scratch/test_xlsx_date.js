const XLSX = require('../frontend/node_modules/xlsx');

// Let's create a workbook with date 2026-11-02 and 2026-11-01
const ws_data = [
  ['Receive Date (YYYY-MM-DD)', 'Number of Chickens', 'Total Weight (Kg)'],
  ['1/11/2026', 0, 0],
  ['2/11/2026', 143241, 424250],
  ['3/11/2026', 144905, 413522],
];
const ws = XLSX.utils.aoa_to_sheet(ws_data);
const wb = XLSX.utils.book_new();
XLSX.utils.book_append_sheet(wb, ws, 'Sheet1');
const buf = XLSX.write(wb, { type: 'binary', bookType: 'xlsx' });

// Now read it back with cellDates: true
const wbRead = XLSX.read(buf, { type: 'binary', cellDates: true });
const wsRead = wbRead.Sheets['Sheet1'];
const data = XLSX.utils.sheet_to_json(wsRead, { header: 1 });
console.log('Parsed data:', data);

data.slice(1).forEach((row, idx) => {
  const cell = row[0];
  console.log(`Row ${idx + 1}:`, typeof cell, cell);
  if (cell instanceof Date) {
    console.log('  toISOString:', cell.toISOString());
    console.log('  getUTCFullYear-Month-Date:', `${cell.getUTCFullYear()}-${cell.getUTCMonth()+1}-${cell.getUTCDate()}`);
    console.log('  getFullYear-Month-Date:', `${cell.getFullYear()}-${cell.getMonth()+1}-${cell.getDate()}`);
  }
});

