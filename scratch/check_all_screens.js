const http = require('http');

const routes = [
  '/sun-product-planner/',
  '/sun-product-planner/planning/BL/mps',
  '/sun-product-planner/planning/BIL/mps',
  '/sun-product-planner/planning/Fillet/mps',
  '/sun-product-planner/demand-planning',
  '/sun-product-planner/planning/BL/dps',
  '/sun-product-planner/machine-capacity',
  '/sun-product-planner/manpower-planning',
  '/sun-product-planner/chicken-receiving/daily',
  '/sun-product-planner/chicken-receiving/weekly',
  '/sun-product-planner/chicken-receiving/monthly',
  '/sun-product-planner/erp/item-master',
  '/sun-product-planner/erp/sale-orders',
  '/sun-product-planner/product-spec',
  '/sun-product-planner/weight-distribution',
  '/sun-product-planner/external-supply',
  '/sun-product-planner/production-flow',
  '/sun-product-planner/settings',
];

async function checkRoute(path) {
  return new Promise((resolve) => {
    const req = http.get({
      hostname: 'localhost',
      port: 3000,
      path: path,
      timeout: 10000,
    }, (res) => {
      resolve({ path, statusCode: res.statusCode });
    });
    req.on('error', (e) => resolve({ path, error: e.message }));
    req.on('timeout', () => { req.destroy(); resolve({ path, error: 'Timeout' }); });
  });
}

async function run() {
  console.log('Testing frontend routes...');
  for (const r of routes) {
    const res = await checkRoute(r);
    console.log(`${res.statusCode === 200 ? '✅' : '❌'} [${res.statusCode || 'ERR'}] ${r} ${res.error ? `(${res.error})` : ''}`);
  }
}

run();

