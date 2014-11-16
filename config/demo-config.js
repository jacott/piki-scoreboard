var KORU_PORT = process.env['KORU_PORT'];
var MONGO_PORT = process.env['MONGO_PORT'];

var urlRoot = 'http://localhost:'+KORU_PORT+'/';

exports.server = function (cfg) {
  cfg.merge('requirejs', {
    config: {
      "koru/mongo/driver": {url: "mongodb://localhost:"+MONGO_PORT+"/pikidemo"},

      "koru/web-server": {
        host: "0.0.0.0",
        port: KORU_PORT,
      },

      "koru/main": {
        "urlRoot": urlRoot,
        "userAccount" : {
          emailConfig: {
            from: 'piki-demo@obeya.co',
            siteName: 'Piki demo',
          },
        },
      },
    },
  });

  cfg.merge('extraRequires', [
    'koru/css/less-watcher', 'koru/server-rc',
  ]);
};

exports.client = function (cfg) {
  cfg.set('requirejs.config.koru/main.urlRoot', urlRoot);

  cfg.merge('requirejs.config.client.extraRequires', [
    'demo-client',
  ]);
};
