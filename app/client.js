requirejs.config({
  packages: ['koru/model'],
});

define(function(require, exports, module) {
  var env = require('koru/env');
  var session = require('koru/session/client-main');

  env.onunload(module, function () {
    require([module.id], function () {});
  });

});

// define([
//   'module', 'koru/env', 'koru/ui/route', 'ui/todos',
//   'koru/session/subscribe', 'koru/dom',
//   'koru/session/client-main'
// ], function (
//   module, env, Route, todos,
//   subscribe, Dom
// ) {
//          // reload me if unloaded
//   env.onunload(module, function () {
//     subHandle && subHandle.stop();
//     subHandle = null;
//     require([module.id], function () {});
//   });

//   Route.title = 'Todos';

//   window.addEventListener('popstate', function (event) {
//     Route.pageChanged();
//   });

//   var subHandle = subscribe('all', function () {
//     Dom.removeClass(document.body, 'loading');
//     todos.start();
//   });
// });
