var requirejs = require('requirejs');

var koruPath = '../node_modules/koru/app/koru';

requirejs.config({
  //Use node's special variable __dirname to
  //get the directory containing this file.
  //Useful if building a library that will
  //be used in node but does not require the
  //use of node outside
  baseUrl: __dirname,

  config: {
    "koru/mongo/driver": {url: "mongodb://localhost:3014/demo"},

    "koru/web-server": {port: 3030},
  },

  packages: [
    "koru", "koru/model", "koru/session", "koru/user-account",
  ],

  paths: {
    koru: koruPath,
  },

  //Pass the top-level main.js/index.js require
  //function to requirejs so that node modules
  //are loaded relative to the top-level JS file.
  nodeRequire: require
});

// requirejs.onResourceLoad = function (context, map, depArray) {
// }


//Now export a value visible to Node.
module.exports = {};

requirejs([
  'koru', 'koru/file-watch', 'startup-server',
  'koru/css/less-watcher', 'koru/server-rc',
], function (koru, fileWatch, startup) {
  koru.Fiber(function () {
    var file = __dirname + '/' + koruPath;
    fileWatch.watch(file, file.replace(/\/koru$/, ''));

    startup();

    console.log('=> Ready');
  }).run();
});
