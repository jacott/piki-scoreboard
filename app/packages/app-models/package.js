Package.describe({
  summary: "Meteor Application Model framework."
});

Package.on_use(function(api) {
  var path = Npm.require('path');

  api.use(['random'], ['server', 'client']);

  api.use(['mongo-livedata'], ['server']);

  api.export(['App', 'Apputil', 'AppVal', 'AppModel']);

  api.export(['AppOplog'], 'server');

  api.add_files([
    'apputil.js',
    'app.js',
    'format.js',
    'app-val.js',
    'base-model.js',
    'cache.js',
    'resource-strings.js',
    'error.js',
    'apputil-dim.js',
    'make-subject.js',
  ], ['server', 'client']);


  var validators = ['associated-validators', 'length-validators', 'text-validators', 'required-validator',
                    'generic-validator', 'unique-validator', 'inclusion-validator']
        .map(function (name) {
          return path.join('validators', name + '.js');
        });


  api.add_files(validators, ['server', 'client']);

  api.add_files(['client/app.js', 'client/rpc.js', 'client/base-model.js', 'client/base-model-observer.js'], 'client');
  api.add_files(['server/app.js', 'server/rpc.js', 'server/apputil.js', 'server/oplog.js', 'server/base-model.js', 'server/observer.js', 'server/observe-id.js', 'server/observe-any.js', 'server/observe-field.js'], 'server');
});

Package.on_test(function(api) {
});
