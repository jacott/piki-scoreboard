#!/usr/bin/env node
const Path = require('path');
const fs = require('fs');
const bundleAll = require('koru/lib/bundle-all');
const babel = require("babel-core");

const {parse} = require('babylon');
const generate = require('babel-generator').default;

process.chdir(__dirname+'/..');
var rootDir = process.cwd();

bundleAll.bundle({
}, function ({ast, code: codeMap, css}) {
  process.chdir(rootDir);

  const polyfillCode = fs.readFileSync(require.resolve('babel-polyfill/browser.js')).toString();
  codeMap['/babel-polyfill.js'] = polyfillCode;
  const polyfillAst = parse(polyfillCode, {sourceType: 'module', sourceFilename: '/babel-polyfill.js'}).program;

  ast.body.splice(0, 0, polyfillAst);

  const { code: codeIn, map: mapIn } = generate(ast, {
    comments: false,
    compact: true,
    sourceMaps: true,
  }, codeMap);

  const { code, map } = babel.transform(codeIn, {
    comments: false,
    compact: true,
    sourceMaps: true,
    inputSourceMap: mapIn,
    presets: [
      "es2015"
    ],
  });

  const indexPrefix = Path.join("build", 'index.');
  fs.writeFileSync(indexPrefix+"css", css);
  fs.writeFileSync(indexPrefix+"js", code+"\n//# sourceMappingURL=/index.js.map\n");
  fs.writeFileSync(indexPrefix+"js.map", JSON.stringify(map));
});
