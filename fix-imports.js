const fs = require('fs');
const path = require('path');

const uiDir = path.join(__dirname, 'src', 'components', 'ui');

// Get all .tsx files in the ui directory
const files = fs.readdirSync(uiDir).filter(file => file.endsWith('.tsx'));

files.forEach(file => {
  const filePath = path.join(uiDir, file);
  let content = fs.readFileSync(filePath, 'utf8');
  
  // Fix @radix-ui imports with version specifiers
  content = content.replace(/@radix-ui\/([^@"']+)@[\d.]+/g, '@radix-ui/$1');
  
  // Fix class-variance-authority imports with version specifiers
  content = content.replace(/class-variance-authority@[\d.]+/g, 'class-variance-authority');
  
  // Fix other versioned imports
  content = content.replace(/from\s+["']([^"']+)@[\d.]+["']/g, 'from "$1"');
  
  fs.writeFileSync(filePath, content);
  console.log(`Fixed imports in ${file}`);
});

console.log('All UI component imports fixed!');
