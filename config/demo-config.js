const KORU_PORT = process.env.KORU_PORT;

const urlRoot = 'http://localhost:'+KORU_PORT;

exports.server = cfg =>{
  cfg.merge('requirejs', {
    config: {
      "koru/web-server": {
        host: "0.0.0.0",
        //        indexjs: __dirname+"/../build/index.js",
      },

      "koru/main": {
        urlRoot,
        "userAccount" : {
          emailConfig: {
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

exports.client = cfg =>{
  cfg.set('requirejs.config.models/user-client.pretendRole', process.env['PIKI_ROLE']);

  cfg.merge('requirejs.config.client.extraRequires', [
    'demo-client',
  ]);
};
