var KORU_PORT = process.env['KORU_PORT'];

var urlRoot = 'http://test.piki/';

exports.server = function (cfg) {
  cfg.merge('requirejs', {
    config: {
      "koru/config": {
        DBDriver: "koru/pg/driver",
      },
      "koru/pg/driver": {
        url: "host=/var/run/postgresql dbname=pikitest",
      },

      "koru/web-server": {
        port: KORU_PORT,
        defaultPage: 'test/index.html',
      },

      "koru/main": {
        "urlRoot": urlRoot,
        "userAccount" : {
          emailConfig: {
            from: 'piki-demo@obeya.co',
            siteName: 'piki demo',
          },
        },
      },

      "koru/test/build-cmd": {excludeDirs: ['koru']}
    },
  });

  cfg.merge('extraRequires', [
    'koru/css/less-watcher', 'koru/server-rc',
  ]);

  cfg.merge("requirejs.packages", ["koru/test"]);

  cfg.set('startup', 'test/server');
  cfg.set('clientjs', 'test/client');
};

exports.client = function (cfg) {
  cfg.set('requirejs.config.koru/main.urlRoot', urlRoot);
  cfg.merge('requirejs.packages', ["koru/test"]);
};
