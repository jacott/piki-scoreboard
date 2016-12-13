const KORU_HOSTNAME = process.env['KORU_HOSTNAME'];
const KORU_PORT = process.env['KORU_PORT'];

const urlRoot = 'https://'+KORU_HOSTNAME;

exports.server = function (cfg) {
  cfg.merge('requirejs', {
    config: {
      "koru/config": {
        DBDriver: "koru/pg/driver",
      },
      "koru/pg/driver": {url: "host=/var/run/postgresql dbname=pikiprod"},

      "koru/web-server": {
        host: "127.0.0.1",
        port: KORU_PORT,
      },

      "koru/main": {
        urlRoot,
        "mailUrl": "smtp://mail",
        "userAccount" : {
          emailConfig: {
            from: 'no-replay@'+KORU_HOSTNAME,
            siteName: 'Piki',
          },
        },
      },
    },
  });
};

exports.client = function (cfg) {
  cfg.set('requirejs.config.koru/main.urlRoot', urlRoot);
};
