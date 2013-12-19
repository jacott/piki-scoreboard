Package.describe({
  summary: "Allows html templates to be defined in .bart files",
  internal: true
});

Package._transitional_registerBuildPlugin({
  name: "compileBartTemplates",
  use: [],
  sources: [
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
