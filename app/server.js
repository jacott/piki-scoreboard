var requirejs = require('koru').requirejs;

var koruPath = '../node_modules/koru/app/koru';

var config = require('./' + (process.argv[2] || 'demo') +'-config.js');

var mainConfig = config['koru/main'];

mainConfig.userAccount.emailConfig.sendResetPasswordEmailText = function(userId, resetToken) {
  return requirejs('email-text').sendResetPasswordEmailText(userId, resetToken);
};

requirejs.config({
  //Use node's special variable __dirname to
  //get the directory containing this file.
  //Useful if building a library that will
  //be used in node but does not require the
  //use of node outside
  baseUrl: __dirname,
  config: config,

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

requirejs([
  'koru', 'startup-server',
].concat(mainConfig.extraRequires || []), function (koru, startup) {
  koru.Fiber(function () {
    startup();
    mainConfig.startup && mainConfig.startup(koruPath);

    console.log('=> Ready');
  }).run();
});
