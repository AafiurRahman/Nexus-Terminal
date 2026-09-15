import https from 'https';

https.get('https://markets.newyorkfed.org/api/rp/all/all/results/latest.json', (res) => {
  let body = '';
  res.on('data', d => body += d);
  res.on('end', () => console.log(body.substring(0, 500)));
}).on('error', e => console.error(e));
