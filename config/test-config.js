const KORU_PORT = process.env['KORU_PORT'];

const urlRoot = 'http://test.piki';

exports.server = function (cfg) {
  cfg.merge('requirejs', {
    config: {
      "koru/web-server": {
        defaultPage: 'test/index.html',
      },

      "koru/main": {
        urlRoot,
        "userAccount" : {
          emailConfig: {
            from: 'piki-test@vimaly.test',
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
