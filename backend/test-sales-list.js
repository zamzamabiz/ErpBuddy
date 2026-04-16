const http = require('http');
const token = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ1c2VySWQiOiI2OWQ3NTgyZGQwOTJiOGQ2YjdiMDc4NDYiLCJ0ZW5hbnRJZCI6IjY5ZDc1ODJkZDA5MmI4ZDZiN2IwNzg0MCIsImVtYWlsIjoiYWRtaW5AZGVtby5sb2NhbCIsImlhdCI6MTc3NTczMDgxNCwiZXhwIjoxNzc1Nzc0MDE0fQ.iBb-T-szmzavzbv545biq2-Tb1_Cjyl46QtTlZSPop4';
const options = {
  hostname: 'localhost',
  port: 5000,
  path: '/api/sales',
  method: 'GET',
  headers: {
    'Authorization': 'Bearer ' + token,
    'Content-Type': 'application/json'
  }
};
const req = http.request(options, (res) => {
  let body = '';
  res.on('data', (chunk) => { body += chunk; });
  res.on('end', () => {
    try {
      const json = JSON.parse(body);
      console.log('Sales list response:', JSON.stringify(json, null, 2).substring(0, 500));
    } catch (e) {
      console.log('Parse error:', e.message);
    }
    process.exit(0);
  });
});
req.on('error', (e) => { console.error(e); process.exit(1); });
req.end();
