const fs = require('fs');
const p = process.argv[2] || 'package.json';
let s = fs.readFileSync(p, 'utf8');
if (s.charCodeAt(0) === 0xFEFF) s = s.slice(1); // strip BOM if present
try { JSON.parse(s); } catch (e) { console.error('Invalid JSON:', e.message); process.exit(1); }
fs.writeFileSync(p, s, { encoding: 'utf8' }); // UTF-8, no BOM
console.log('✅ normalized', p);
