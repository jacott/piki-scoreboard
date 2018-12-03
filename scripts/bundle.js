const Path = require('path');
const fs = require('fs');
const bundleAll = require('koru/lib/bundle-all');

process.chdir(__dirname+'/..');
var rootDir = process.cwd();

console.log(`bundling`);

bundleAll.bundle({
}, function ({ast, css, compiler}) {
  process.chdir(rootDir);

  console.log(`minifying`);

  const { code, error, map } = compiler.terser.minify(ast, {
    compress: {
      dead_code: true,
      global_defs: {
        isClient: true,
        isServer: false,
      },
      ecma: 6,
    },
    mangle: true,
    safari10: true,
    sourceMap: {
      filename: "index.js",
      url: "index.js.map"
    },
    output: {
      // beautify: true,
      // indent_level: 2,
      ast: false,
      code: true,
    }
  });

  if (error) {
    throw error;
  }

  fs.writeFileSync(Path.join("build", 'index.css'), css);
  fs.writeFileSync(Path.join("build", 'index.js'), code);
  //  fs.writeFileSync(Path.join("build", 'config.js'), configCode);
  fs.writeFileSync(Path.join("build", 'index.js.map'), map);
});
