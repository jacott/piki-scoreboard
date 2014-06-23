#!/usr/bin/env node

var Fiber = require('koru/node_modules/fibers');
var bundleCss = require('koru/lib/bundle-css');
var Path = require('path');
var fs = require('fs');

var requirejs = require('koru/node_modules/requirejs');

var topDir = Path.resolve(Path.join(__dirname, '../app'));
var buildDir = Path.resolve(Path.join(__dirname, '../build'));

var optConfig = {
  baseUrl: topDir,
  paths: {
    requireLib: Path.join(topDir, "../node_modules/koru/node_modules/requirejs/require"),
  },

  packages: ['koru', 'koru/model', 'koru/session', 'koru/user-account', 'koru/session'],

  include: 'requireLib',
//  optimize: 'none',

  stubModules: ['koru/dom/template-compiler'],

  onBuildRead: function (moduleName, path, contents) {
    if (moduleName === 'koru/css/loader')
      return "define({loadAll: function(){}});";

    return contents;
  },

  name: "client",
  out: Path.join(buildDir, "/index.js"),
};

try {fs.mkdirSync(buildDir);} catch(ex) {}

Fiber(function () {
  try {
    fs.writeFileSync(Path.join(buildDir, 'index.css'), bundleCss(topDir, ['ui']));

    requirejs.optimize(optConfig, function (buildResponse) {

    });
  } catch(ex) {
    process.stderr.write(ex.stack);
    process.exit(1);
  }
}).run();
