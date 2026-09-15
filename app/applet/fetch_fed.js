const https = require('https');

https.get('https://markets.newyorkfed.org/api/rp/all/all/results/latest.json', { headers: { 'User-Agent': 'Mozilla/5.0' } }, (res) => {
  let body = '';
  res.on('data', d => body += d);
  res.on('end', () => console.log(res.statusCode, body.substring(0, 1500)));
}).on('error', e => console.error(e));
