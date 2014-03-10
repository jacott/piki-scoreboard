Package.describe({
  summary: "Application file server."
});

Npm.depends({
  connect: "2.7.10"
});

Package.on_use(function(api) {
  api.export(['AppFS']);

  api.use(['webapp', 'routepolicy'], 'server');

  api.add_files([
    'app-file-server.js',
  ], 'server');
});
