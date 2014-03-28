Package.describe({
  summary: "Vendor libraries."
});

Npm.depends({csv: "0.3.7"});


Package.on_use(function(api) {
  api.export(['CSV'], 'server');

  api.add_files([
    'colorpicker.js',
    'moment.js',
  ], 'client');

  api.add_files(['csv.js'], 'server');
});

Package.on_test(function(api) {
});
