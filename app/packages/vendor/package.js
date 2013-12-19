Package.describe({
  summary: "Vendor libraries."
});

Package.on_use(function(api) {
  api.add_files([
    'colorpicker.js',
    'moment.js',
  ], 'client');
});

Package.on_test(function(api) {
});
