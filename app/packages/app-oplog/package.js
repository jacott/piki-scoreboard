Package.describe({
  summary: "Meteor Application Model framework oplog support."
});

Npm.depends({mongodb: "1.3.19"});

Package.on_use(function(api) {
  api.add_files(['server/init-oplog.js'], 'server');
});

Package.on_test(function(api) {
});
