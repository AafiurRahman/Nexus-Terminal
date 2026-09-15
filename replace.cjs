const fs = require('fs');
const path = require('path');

function walk(dir) {
  let results = [];
  const list = fs.readdirSync(dir);
  list.forEach(file => {
    file = path.join(dir, file);
    const stat = fs.statSync(file);
    if (stat && stat.isDirectory()) { 
      results = results.concat(walk(file));
    } else { 
      if (file.endsWith('.tsx') || file.endsWith('.ts')) {
        results.push(file);
      }
    }
  });
  return results;
}

const files = walk('./src');

files.forEach(file => {
  let code = fs.readFileSync(file, 'utf8');
  let original = code;
  
  // Replace background colors
  code = code.replace(/bg-\[#050608\]/g, 'bg-bg-base');
  code = code.replace(/bg-\[#0a0c10\]/g, 'bg-bg-panel');
  code = code.replace(/bg-black/g, 'bg-bg-base');
  
  // Replace border colors
  code = code.replace(/border-white\/10/g, 'border-border-subtle');
  code = code.replace(/border-white\/20/g, 'border-border-subtle');
  
  // Replace text colors
  code = code.replace(/text-\[#e0e0e0\]/g, 'text-text-primary');
  code = code.replace(/text-white\/40/g, 'text-text-muted');
  code = code.replace(/text-white\/50/g, 'text-text-muted');
  code = code.replace(/text-white\/70/g, 'text-text-muted');
  code = code.replace(/text-white/g, 'text-text-primary');

  // Some alpha bg
  code = code.replace(/bg-white\/5/g, 'bg-text-primary\/5');
  code = code.replace(/bg-\[#0a0c10\]\/80/g, 'bg-bg-panel\/80');

  if (code !== original) {
    fs.writeFileSync(file, code);
    console.log(`Updated ${file}`);
  }
});
