Package.describe({
  summary: "AppForm provides tools for building pages with Bart and AppModel."
});

Package.on_use(function(api) {
  api.export(['AppRoute', '_Test']);
  api.use(['app-models'], ['server']);
  api.use(['less', 'bart', 'app-models'], 'client');

  api.add_files([
  ], ['server', 'client']);

  api.add_files([
  ], 'server');

  api.add_files([
    'client/app-route.js',

    'html/button-menu.bhtml',
    'html/complete-list.bhtml',
    'html/form.bhtml',
    'html/in-place-form.bhtml',
    'html/page-link.bhtml',
    'html/dialog.bhtml',

    'client/form.js',
    'client/each.js',
    'client/button-menu.js',
    'client/complete-list.js',
    'client/in-place-form.js',
    'client/page-link.js',
    'client/select-list.js',
    'client/dialog.js',

  ], 'client');

  if (process.env.METEOR_MODE === 'test') {
    api.add_files([
      'test/html/form-test.bhtml',
      'test/html/each-test.bhtml',
      'test/html/button-menu-test.bhtml',
      'test/html/complete-list-test.bhtml',
      'test/html/select-list-test.bhtml',
    ], 'client');
  }
});
