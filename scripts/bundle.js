const Path = require('path');
const fs = require('fs');
const bundleAll = require('koru/lib/bundle-all');
const babel = require("babel-core");

const {parse} = require('babylon');

process.chdir(__dirname+'/..');
var rootDir = process.cwd();

bundleAll.bundle({
}, function ({ast, code: codeMap, css}) {
  process.chdir(rootDir);

  // const polyfillCode = fs.readFileSync(require.resolve('babel-polyfill/browser.js')).toString();
  // codeMap['/babel-polyfill.js'] = polyfillCode;
  // const polyfillAst = parse(polyfillCode, {sourceType: 'module', sourceFilename: '/babel-polyfill.js'}).program;

  // ast.body.splice(0, 0, polyfillAst);

  // const { code: codeIn, map: mapIn } = generate(ast, {
  //   comments: false,
  //   compact: true,
  //   sourceMaps: true,
  // }, codeMap);

  const { code } = babel.transformFromAst(ast, codeMap, {
    comments: false,
    compact: true,
//    sourceMaps: true,
//    inputSourceMap: mapIn,
  });

  fs.writeFileSync(Path.join("build", 'index.css'), css);
  // fs.writeFileSync(Path.join("build", 'pre-index-es5.js'),
  //                  polyfillCode + es5Code); // +"\n//# sourceMappingURL=/index.js.map\n"
  fs.writeFileSync(Path.join("build", 'index.js'), code);
});
