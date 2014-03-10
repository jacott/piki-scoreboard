Package.describe({
  summary: "Meteor Application Testing with Jasmine."
});

Npm.depends({
  glob: "3.1.21",
  minimatch: "0.2.12",
});

Package.on_use(function(api) {
  api.use(['accounts-base', 'app-file-server'], ['server']);

  api.add_files([
    'meteor-tdd.js'
  ], 'server');
});

Package.on_test(function(api) {
});
