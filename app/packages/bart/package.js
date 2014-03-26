Package.describe({
  summary: "Allows html templates to be defined in .bart files",
  internal: true
});

var fs = Npm.require('fs');

var topDir = process.cwd() +'/packages/bart/';

var mode = topDir + 'plugin/mode.js';

if (! fs.existsSync(mode)) {
  fs.writeFileSync(mode, '');
}

Package._transitional_registerBuildPlugin({

  name: "compileBartTemplates",
  use: [],
  sources: [
    'plugin/mode.js',
    'plugin/bart-compiler.js',
    'plugin/compile-templates.js'
  ],
  npmDependencies: {"htmlparser2": "3.3.0"}

});

// This on_use describes the *runtime* implications of using this package.
Package.on_use(function (api) {

  api.export(['Bart', '_private']);

  api.add_files([
    'bart.js',
  ], ['client']);

});
