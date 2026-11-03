const http = require('http');

async function testEndpoint(path, label) {
  const token = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOjEsInVzZXJuYW1lIjoiYWRtaW4iLCJyb2xlIjoiQURNSU4iLCJpYXQiOjE3NDEyMzg0MDB9.test'; // We can use the same auth flow or login
  // Login first
  return new Promise((resolve) => {
    const postData = JSON.stringify({ username: 'admin', password: 'password123' });
    const req = http.request({
      hostname: 'localhost',
      port: 3001,
      path: '/api/v1/auth/login',
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Content-Length': Buffer.byteLength(postData)
      }
    }, (res) => {
      let body = '';
      res.on('data', chunk => body += chunk);
      res.on('end', () => {
        const loginRes = JSON.parse(body);
        const jwtToken = loginRes.accessToken;
        
        const tStart = performance.now();
        const getReq = http.request({
          hostname: 'localhost',
          port: 3001,
          path,
          method: 'GET',
          headers: {
            'Authorization': `Bearer ${jwtToken}`,
            'Accept-Encoding': 'gzip, deflate'
          }
        }, (getRes) => {
          let dataLen = 0;
          getRes.on('data', chunk => { dataLen += chunk.length; });
          getRes.on('end', () => {
            const duration = performance.now() - tStart;
            console.log(`[${label}] Status: ${getRes.statusCode}, Enc: ${getRes.headers['content-encoding'] || 'none'}, Size: ${(dataLen / 1024).toFixed(2)} KB, Latency: ${duration.toFixed(2)} ms`);
            resolve();
          });
        });
        getReq.end();
      });
    });
    req.write(postData);
    req.end();
  });
}

async function run() {
  console.log('Testing performance after optimization:');
  await testEndpoint('/api/v1/demand-planning/BIL/sales-orders?onlySelected=true', 'BIL (onlySelected=true)');
  await testEndpoint('/api/v1/demand-planning/Fillet/sales-orders?onlySelected=true', 'Fillet (onlySelected=true)');
}

run();

