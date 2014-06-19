#!/usr/bin/env node

var Fiber = require('koru/node_modules/fibers');
var Future = require('koru/node_modules/fibers/future');
var wait = Future.wait;
var fs = require('fs');
var Path = require('path');
var readdir = Future.wrap(fs.readdir);
var stat = Future.wrap(fs.stat);

var less = require('koru/node_modules/less');

var topDir = Path.resolve(Path.join(__dirname, '../app'));

function findAll(dir, results) {
  var m;
  var dirPath = Path.join(topDir, dir);
  var filenames = readdir(dirPath).wait().filter(function (fn) {
    return /^[\w-]*(?:\.(css|less)$|$)/.test(fn);
  });
  var stats = filenames.map(function (filename) {
    return stat(Path.join(dirPath, filename));
  });

  wait(stats);

  for(var i = 0; i < filenames.length; ++i) {
    if (stats[i].get().isDirectory()) {
      findAll(Path.join(dir, filenames[i]), results);
    } else if (m = filenames[i].match(/^\w(.*)(less|css)$/)) {
      if (m[0].match(/-test\.(le|c)?ss$/)) continue;
      results.push([dirPath, m[0]]);
    }
  }
  return results;
}

function compile(dir, filename) {
  filename = Path.join(dir, filename);
  var src = fs.readFileSync(filename).toString();
  var options = {
    syncImport: true,
    paths: [dir], // for @import
  };

  var parser = new less.Parser(options);
  var future = new Future;

  try {
    parser.parse(src, future.resolver());
    var css = future.wait().toCSS({
      cleancss: true,
    });
  } catch (ex) {
    if (! ex.filename) throw ex;
    var fn = ex.filename || filename;
    if (fn === 'input') fn = filename;
    throw {
      toString: function () {
        return ex.message();
      },
      stack: ex.message +"\n\    at " + fn + ":" + (ex.line || '1') + ':' + (ex.column || 0 + 1) +"\n",
    };
  }

  return css;
}


Fiber(function () {
  try {
    console.log(findAll('ui', []).map(function (pair) {
      return compile(pair[0], pair[1]);
    }).join("\n"));
  } catch(ex) {
    process.stderr.write(ex.stack);
    process.exit(1);
  }
}).run();