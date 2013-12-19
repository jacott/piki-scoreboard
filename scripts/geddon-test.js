process.chdir(__dirname + "/..");

var net = require('net'),
    fs = require('fs');

var EXIT_CODE = '\x1FEXIT',
    EXIT_CODE_LEN = Buffer.byteLength(EXIT_CODE);

var ARGV = process.argv.slice(2);
var exitCodes = {client: 1, server: 1};
var runCount = 1;
var endMsg = [];
if (ARGV[0] === 'emacs') {
  ARGV.shift();
  var log = logEmacs;
  var write = writeEmacs;
  var processBuffer = processEmacsBuffer;
} else {
  var log = logTty;
  var write = writeTty;
  var processBuffer = processTtyBuffer;
}

runTests(ARGV.shift());

function runTests(mode) {
  switch (mode) {
  case 'both':
    runCount = 2;
    runClient(runServer);
    break;
  case 'client':
    exitCodes.server = 0;
    runClient();
    break;
  case 'server':
    exitCodes.client = 0;
    runServer();
    break;
  default:
    exitProcess("invalid mode: " + mode);
  }
}

function done(key) {
  timer && sendResults();
  endMsg.push(key + " exited with status " + exitCodes[key]);
  if (--runCount === 0) {
    exitProcess(endMsg.join(', ')+"\n");
  }
}

function exitProcess(msg) {
  if (msg)
    write(['exit',msg]);
  process.exit(exitCodes.client + exitCodes.server);
}

function logEmacs(msg) {
  msg = msg && msg.trim();
  msg.length &&  write(['log', msg]);
}

function logTty(msg) {
  write(['log', msg]);
}

function logError(msg) {
  write(['error',msg]);
}

function writeEmacs(args) {
  process.stdout.write(args.join('\0') + '\0\0e');
}

function writeTty(args) {
  process.stdout.write(args.slice(1).join(" "));
}

var result = {}, timer;

function sendResults() {
  timer = null;
  var msg = ['result'];
  for(var key in result) {
    msg.push(key);
    msg.push(result[key]);
  }
  write(msg);
}

function addResult(key, value) {

  result[key] = value;

  if (! timer)
    timer = setTimeout(sendResults, 100);
  return;

}

var EXECUTED_RE = /(.*): Executed (.*)(?:\n|$)/g;

function processTtyBuffer(key, buffer, errorFunc) {
  parseExitCode(key, buffer);
  buffer = buffer.toString();

  log(errorFunc ? errorFunc(buffer) : buffer);
}

function processEmacsBuffer(key, buffer, func) {
  var match;
  parseExitCode(key, buffer);
  buffer = buffer.toString()
    .replace(/(?:\033\[..)+/g,'');
  if (match = /^(\s*LOG: (LOG\n)?)/.exec(buffer)) {
    buffer = buffer.slice(match[1].length);
  } else {
    buffer = buffer.replace(EXECUTED_RE, function (_, m1, m2) {
      match = /(\d+) of (\d+) *(?:\((\d+) FAILED\))? *(?:\(skipped (\d+)\))?/.exec(m2);
      if (! match) {
        log(m1 + ": Executed " + m2);
      } else {
        match = match.slice(1,5);
        for(var i=0;i < match.length;++i) {
          if (match[i] == null)
            match[i] = 0;
        }

        while (match.length < 4) match.push(0);
        addResult(m1, "(" + match.join(" ") + ")");
        return '';
      }
    });
  }
  log(func ? func(buffer) : buffer);
}

function  parseExitCode(key, buffer) {
  var tailPos = buffer.length - EXIT_CODE_LEN - 1;

  if (tailPos < 0) {
    return;
  }

  // tail buffer which might contain the message
  var tail = buffer.slice(tailPos);
  var tailStr = tail.toString();
  if (tailStr.substr(0, tailStr.length - 1) === EXIT_CODE) {
    tail.fill(' ');
    exitCodes[key] = parseInt(tailStr.substr(-1), 10);
  }
};



function runServer() {
  var count = 20;
  var socket = net.connect(3010);
  var timeout = null;

  socket.on('connect', function(buffer) {
    socket.write(ARGV[0] || 'ALL');
  });

  socket.on('data', function (buffer) {
    processBuffer('server', buffer);
  });

  socket.on('error', function(e) {
    if (e.code === 'ECONNREFUSED') {
      if (--count > 0) {
        timeout = setTimeout(function () {
          timeout = null;

          socket.connect(3010);
        }, 200);
        return;
      }
      log('error', 'There is no Meteor server listening on port %d', 3010);
      done('server');
    } else {
      throw e;
    }
  });

  socket.on('close', function() {
    timeout || done('server');
  });
}


function runClient(serverPending) {
  var filePath,
      path = require('path'),
      sourceMap = require('source-map'),
      mapFiles = {},
      appUrlBase = 'http://' + (process.env['SERVERHOST'] || 'localhost') + ':3100',
      srcFiles = [],
      wrapper = fs.readFileSync('./test/karma/context-template.html').toString().split('%CONTENT%'),
      clientPrefix = path.normalize('test/.build/programs/client')+'/',
      program = require('../test/.build/programs/client/program.json');

  var serverTimeout;


  program.manifest.forEach(function (entry) {
    filePath = entry.path;
    if(filePath.slice(-3) === '.js') {

      if(entry.sourceMap) mapFiles[entry.path]=entry.sourceMap;
      srcFiles.push(scriptElm(appUrlBase + entry.url));

      if (filePath === "packages/meteor.js")
        srcFiles.push(scriptElm('/base/startup-client.js'));
    }
  });

  fs.writeFileSync('./test/karma/context.html', wrapper[0] + srcFiles.join('\n') +
                   '\n<script type="text/javascript">geddon = {runArg: "' + ARGV[0] + '"}</script>' +
                   wrapper[1]);

  if (serverPending) {
    serverTimeout = setTimeout(function () {
      serverTimeout = null;
      serverPending();
    }, 2000);
  }

  run();

  function scriptElm(url) {
    return '<script type="text/javascript" src="' + url + '"></script>';
  }

  function run() {
    var count = 3;
    var socket = net.connect(9100);
    var topDirMatch = new RegExp("\\((?:app)?" + process.cwd() + '/','g');
    var timeout = null;

    socket.on('data', function(buffer) {
      processBuffer('client', buffer, dataFunc);
    });

    function dataFunc (buffer) {
      return buffer.replace(/http:\/\/[\w.-]+:\d+\/(absolute|base\/)?(.*)\?[0-9a-f]+:(\d+)(?::(\d+))?\)/g, function (all, pfx, m1, m2, m3) {
        var map = mapFiles[m1];
        if (map) {
          if (typeof map === 'string') {
            try {
              map = new sourceMap.SourceMapConsumer(fs.readFileSync(clientPrefix + map).toString());
            } catch(ex) {
              logError(fs.readFileSync(clientPrefix + map));
              return all;
            }
          }
          var src = map.originalPositionFor({line: m2, column: m3 || 0});

          m1 = 'packages/' + src.source;
          m2 = src.line;
          m3 = src.column;
        }
        if (!pfx) m1 = 'app/' + m1;
        else if (pfx === 'base/') m1 = 'test/karma/' + m1;

        return m1 + ':' + m2 + (m3 ? ':' + m3 : '') + ')';
      }).replace(topDirMatch, '(');
    }

    socket.on('error', function(e) {
      if (e.code === 'ECONNREFUSED') {
        if (--count > 0) {
          timeout = setTimeout(function () {
            timeout = null;

            socket.connect(9100);
          }, 200);
          return;
        }
        logError('There is no Karma server listening on port %d', 9100);
        done('client');
        _runServer();
      } else {
        throw e;
      }
    });

    socket.on('close', function() {
      done('client');
      _runServer();
    });
  }

  function _runServer() {
    if (serverTimeout) {
      clearTimeout(serverTimeout);
      serverPending();
    }
  }
}
