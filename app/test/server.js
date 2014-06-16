var requirejs = require('requirejs');

var koruPath = '../node_modules/koru/app/koru';

requirejs.config({
  //Use node's special variable __dirname to
  //get the directory containing this file.
  //Useful if building a library that will
  //be used in node but does not require the
  //use of node outside
  baseUrl: __dirname+'/..',

  config: {
    "koru/mongo/driver": {url: "mongodb://localhost:3004/koru"},

    "koru/web-server": {port: 3030, defaultPage: '/test/index.html'},

    "koru/test/build-cmd": {excludeDirs: ['koru']}
  },

  packages: [
    "koru", "koru/test", "koru/model", "koru/session", "koru/user-account",
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
  'koru', 'koru/file-watch', 'koru/server' , 'koru/server-rc',
], function (koru, fileWatch) {

  koru.Fiber(function () {
    var file = __dirname + '/../' + koruPath;
    fileWatch.watch(file, file.replace(/\/koru$/, ''));

    console.log('=> Ready');
  }).run();
});
