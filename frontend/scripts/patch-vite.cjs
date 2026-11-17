const fs = require('fs');
const path = require('path');

const chunkFile = path.resolve(__dirname, '../node_modules/vite/dist/node/chunks/dep-BK3b2jBa.js');

if (fs.existsSync(chunkFile)) {
  let content = fs.readFileSync(chunkFile, 'utf8');
  if (content.includes('const postfixRE = /[?#].*$/;')) {
    content = content.replace('const postfixRE = /[?#].*$/;', 'const postfixRE = /(?:\\?[^#]*|#[^/\\\\]*)$/;');
    fs.writeFileSync(chunkFile, content, 'utf8');
    console.log('✅ Vite path regex patched successfully for directories with "#".');
  }
}
