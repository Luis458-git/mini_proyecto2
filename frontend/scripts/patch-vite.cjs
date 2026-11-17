const fs = require('fs');
const path = require('path');

const chunkFile = path.resolve(__dirname, '../node_modules/vite/dist/node/chunks/dep-BK3b2jBa.js');

if (fs.existsSync(chunkFile)) {
  let content = fs.readFileSync(chunkFile, 'utf8');

  // 1. Patch postfixRE
  if (content.includes('const postfixRE = /[?#].*$/;')) {
    content = content.replace('const postfixRE = /[?#].*$/;', 'const postfixRE = /(?:\\?[^#]*|#[^/\\\\]*)$/;');
    console.log('✅ Vite postfixRE patched.');
  }

  // 2. Patch injectQuery so it doesn't break directory paths containing "#" via new URL("relative:///")
  const oldInjectQuery = `function injectQuery(url, queryToInject) {
  const resolvedUrl = new URL$3(
    url.replace(replacePercentageRE, "%25"),
    "relative:///"
  );
  const { search, hash } = resolvedUrl;
  let pathname = cleanUrl(url);
  pathname = isWindows$3 ? slash$1(pathname) : pathname;
  return \`\${pathname}?\${queryToInject}\${search ? \`&\` + search.slice(1) : ""}\${hash ?? ""}\`;
}`;

  const newInjectQuery = `function injectQuery(url, queryToInject) {
  let clean = cleanUrl(url);
  clean = isWindows$3 ? slash$1(clean) : clean;
  const qIdx = url.indexOf('?');
  const existingSearch = qIdx >= 0 ? url.slice(qIdx + 1) : '';
  return \`\${clean}?\${queryToInject}\${existingSearch ? '&' + existingSearch : ''}\`;
}`;

  if (content.includes(oldInjectQuery)) {
    content = content.replace(oldInjectQuery, newInjectQuery);
    console.log('✅ Vite injectQuery patched.');
  }

  fs.writeFileSync(chunkFile, content, 'utf8');
  console.log('✅ Vite successfully patched for paths containing "#"!');
}
