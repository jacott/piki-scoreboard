switch(process.env.METEOR_MODE) {
case 'test':
  startTest();
  break;
case 'development':
  var fs = Npm.require('fs');
  var path = Npm.require('path');
  var glob = Npm.require('glob');

  AppFS.handle('/quick.css', function (req, res) {
    res.writeHead(200, {
      'Content-Type': 'text/css',
    });

    var topDir = "../client";
    var filename = glob.sync("*.css", {cwd: topDir})[0];

    res.end(fs.readFileSync(path.resolve(topDir, filename)));
  });
  break;
}

function startTest() {

  var fs = Npm.require('fs'),
      Fiber = Npm.require('fibers'),
      path = Npm.require('path'),
      topDir = path.normalize(process.cwd() + "/../../../../../..")+"/",
      testDir = topDir + "test/",
      geddon = Npm.require('geddon').geddon,
      glob = Npm.require('glob'),
      mm = Npm.require('minimatch'),
      util = Npm.require('util');

  global.geddon = geddon;

  geddon.sinon.spy(Meteor.Collection.prototype,'_ensureIndex');
  geddon.sinon.spy(Meteor,'publish');

  Meteor.startup(function () {
    var net = Npm.require('net');

    var server = net.createServer(function (socket) {
      socket.write("\n");
      server.close();

      var timer, count=0,
          errorCount = 0,
          skipCount = 0;

      var restartFile = topDir + "app/private/restart.txt";

      socket.on('close', function () {
        fs.writeFileSync(restartFile, Date.now().toString());
      });

      socket.on('data', function (buffer) {
        buffer = buffer.toString();
        try {
          var filename = "test/server.conf.js",
              code = fs.readFileSync(path.resolve(topDir, filename)),
              config = readConfig(code, filename);

          geddon.runArg = buffer === 'ALL' ? null : buffer;

          console.log = function () {
            var args = Array.prototype.slice.call(arguments, 0);
            socket.write("\nLOG: "+util.inspect(args, false, 7)+"\n");
          };

          var totalTimer = Date.now();
          var excludes = config.exclude;

          config.files.forEach(function (file) {
            glob.sync(file, {cwd: testDir}).forEach(function(filename) {
              if (excludes.some(function(excludePattern) {return mm(filename, excludePattern);})) return;
              filename = testDir + filename;
              runCode(geddon, filename, fs.readFileSync(filename));
            });
          });
        } catch(ex) {
          socket.write("\n" + ex.message + "\nSee Server log\n");
          socket.end("\n\x1FEXIT1");
          fs.writeFileSync(restartFile, Date.now().toString());
        }

        geddon.onEnd(function () {
          try {
            socket.end("\n\x1FEXIT" + (errorCount > 0 ? 1 : 0));
            fs.writeFileSync(restartFile, Date.now().toString());
          } catch(ex) {
            process.stderr.write(ex);
          }
        });

        geddon.onTestStart(function () {
          timer = Date.now();
        });

        geddon.onTestEnd(function (test) {
          var result= "Server: ";
          if (test.errors) {
            result += test.name + ' FAILED\n';
            ++errorCount;
            var errors = test.errors;
            for(var i=0;i < errors.length; ++i) {
              result += errors[i].replace(topDir,'').replace(/\(packages\//,'(app/packages/')+"\n";
            }
            result += "\nServer: ";
          }

          test.skipped ? ++skipCount : ++count;
          var extraMsg = skipCount === 0 ? "" : " (skipped "+skipCount+")";

          if (errorCount === 0)
            extraMsg += " SUCCESS";
          else
            extraMsg += " (" + errorCount + " FAILED)";

          socket.write('\x1B[1A' + '\x1B[2K' + result + "Executed " + count + " of " + geddon.testCount  + extraMsg +
                       " (" + (Date.now() - totalTimer) + " ms / " + (Date.now() - timer) + " ms)\n");
        });

        geddon.start(function (runNext) {
          Fiber(runNext).run();
        });
      });
    });

    startListener();

    function startListener() {
      var count = 4, exception;
      while (--count > 0) {
        try {
          server.listen(3010);
          console.log('\n=> Test server ready\n');
          return;
        } catch(ex) {
          exception = ex;
        }
      }
      throw exception;
    }


    function runCode(geddon, filename, code) {
      code = "(function(geddon, buster, assert, refute, sinon, Npm){" + code + "\n})";

      var func = Npm.require('vm').runInThisContext(code, filename, true);

      func(geddon, geddon, geddon.assert, geddon.refute, geddon.sinon, Npm);
    }

    function readConfig(code, filename) {
      code = "(function(config){" + code + "\n})";

      var func = Npm.require('vm').runInThisContext(code, "../"+filename, true);

      var config = {};
      func(config);
      return config.options;
    }
  });
}
