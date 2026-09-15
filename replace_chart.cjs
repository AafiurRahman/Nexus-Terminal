const fs = require('fs');

let file = './src/components/MainChart.tsx';
let code = fs.readFileSync(file, 'utf8');

code = code.replace(/rgba\(255,255,255,0\.05\)/g, 'var(--border-subtle)');
code = code.replace(/rgba\(255,255,255,0\.1\)/g, 'var(--border-subtle)');
code = code.replace(/rgba\(255,255,255,0\.2\)/g, 'var(--border-subtle)');
code = code.replace(/rgba\(255,255,255,0\.4\)/g, 'var(--text-muted)');
code = code.replace(/rgba\(0,0,0,0\.8\)/g, 'var(--bg-panel)');
code = code.replace(/color: '#fff'/g, "color: 'var(--text-primary)'");

fs.writeFileSync(file, code);
console.log('MainChart colors updated');
