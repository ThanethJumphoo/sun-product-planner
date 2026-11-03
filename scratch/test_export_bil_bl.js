const jwt = require('C:/Users/PCSLHICT-THANETH/Documents/github/sun-product-planner/backend/node_modules/jsonwebtoken');
const http = require('http');
const fs = require('fs');

const JWT_SECRET = 'poultry-erp-jwt-secret-key-change-in-production';
const token = jwt.sign(
  { sub: 'test-admin-id', username: 'admin', role: 'ADMIN' },
  JWT_SECRET,
  { expiresIn: '1h' }
);

function exportSchedule(part, month, outFile) {
  return new Promise((resolve) => {
    const req = http.request({
      hostname: 'localhost',
      port: 3001,
      path: `/api/v1/mps/${encodeURIComponent(part)}/export-schedule?month=${month}`,
      method: 'GET',
      headers: {
        'Authorization': 'Bearer ' + token
      }
    }, (res) => {
      console.log(`[${part}] Status:`, res.statusCode);
      const chunks = [];
      res.on('data', c => chunks.push(c));
      res.on('end', () => {
        const buf = Buffer.concat(chunks);
        fs.writeFileSync(outFile, buf);
        console.log(`[${part}] Saved ${buf.length} bytes to ${outFile}`);
        resolve();
      });
    });
    req.end();
  });
}

async function main() {
  await exportSchedule('BIL', '2026-10', 'scratch/mps_schedule_bil.xlsx');
  await exportSchedule('BL', '2026-10', 'scratch/mps_schedule_bl.xlsx');
}

main();

