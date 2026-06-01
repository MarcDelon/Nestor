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
    } else if (file.endsWith('.ts') || file.endsWith('.tsx')) {
      results.push(file);
    }
  });
  return results;
}

const files = walk('./frontend/src');
let changed = 0;

files.forEach(file => {
  let content = fs.readFileSync(file, 'utf8');
  
  // Find lines like: const API_BASE = ...; or const apiBase = ...;
  const newContent = content.replace(/(const (?:API_BASE|apiBase|CLIENT_API_BASE|SOCKET_URL) =\s*).*?('https:\/\/safe-trip-backend\.vercel\.app'\)+);/g, (match, prefix, suffix) => {
    
    // We want to replace the expression with our new unified robust expression
    const isTemplate = match.includes('`/api/');
    const apiPathMatch = match.match(/(\/api\/[a-z]+)`/);
    
    const baseExpr = `((typeof window !== 'undefined' && window.location.hostname.endsWith('.vercel.app')) ? 'https://safe-trip-backend.vercel.app' : ((typeof window !== 'undefined' && (window.location.hostname === 'localhost' || window.location.hostname.startsWith('192.168.'))) ? \`http://\${window.location.hostname}:5000\` : (process.env.NEXT_PUBLIC_API_URL ? process.env.NEXT_PUBLIC_API_URL.replace(/\\/$/, '') : 'https://safe-trip-backend.vercel.app')))`;
    
    if (isTemplate && apiPathMatch) {
      return `${prefix}\`\$\{${baseExpr}\}${apiPathMatch[1]}\`;`;
    } else {
      return `${prefix}${baseExpr};`;
    }
  });

  if (content !== newContent) {
    fs.writeFileSync(file, newContent);
    console.log('Fixed', file);
    changed++;
  }
});

console.log('Total fixed:', changed);
