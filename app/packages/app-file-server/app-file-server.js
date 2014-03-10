var Fiber = Npm.require('fibers');
var connect = Npm.require('connect');

(process.env['METEOR_MODE'] === 'development') && fileServer();

function fileServer() {

  RoutePolicy.declare('/images/board-backgrounds', 'network');

  // Listen to incoming http requests
  WebApp.connectHandlers
    .use('/images/board-backgrounds', connect.static(process.env.HOME + '/src/obeya-design/selected-scenario/board-backgrounds'));

  WebApp.connectHandlers
    .use('/store', connect.static(process.env.APP_FS_DIR));
}

AppFS = {
  bodyParser: function (root, func) {
    use(WebApp.connectHandlers.use(connect.bodyParser()), root, func);
  },
  handle: function (root, func) {
    use(WebApp.connectHandlers, root, func);
  },
};

if (process.env.METEOR_MODE === 'test') {
  var sinon = Npm.require('geddon').geddon.sinon;
  sinon.spy(AppFS,'handle');
  sinon.spy(AppFS,'bodyParser');
  AppFS._private = {
    RoutePolicy: RoutePolicy,
    WebApp: WebApp,
    connect: connect,
  };
}

function use(connection, root, func) {
  RoutePolicy.declare(root, 'network');
  connection.use(root, function (req, res, next) {
    Fiber(function () {
      try {
        func(req, res, next);
      } catch(ex) {
        res.writeHead(503);
        res.end("");
          console.log('ERROR ', ex.message, ex.stack);
      }
    }).run();
  });
}
