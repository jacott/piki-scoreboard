const path = require('path');
const appDir = path.resolve(__dirname, '../app');
const {
  KORU_PORT, APP_URL, KORU_DB,
  APP_MAILURL, APP_MAILDOMAIN, APP_DISPLAY_NAME,
} = process.env;


exports.common = cfg =>{
  cfg.merge('requirejs.packages', [
    "koru/model", "koru/user-account",
  ]);

  cfg.set('requirejs.config.koru/main.urlRoot', APP_URL);

  cfg.set('requirejs.enforceAcyclic', true);
};

exports.client = cfg =>{
};

exports.server = cfg =>{
  global.nodeRequire = require;
  cfg.set('requirejs.baseUrl', appDir);
  cfg.set('requirejs.nodeRequire', require);
  cfg.merge('requirejs.config', {
    "koru/config": {
      DBDriver: "koru/pg/driver",
    },
    "koru/pg/driver": {
      url: `host=/var/run/postgresql dbname=${KORU_DB}`,
    },

    "koru/web-server": {
      host: "127.0.0.1",
      port: KORU_PORT,
    },
    "koru/main": {
      mailUrl: APP_MAILURL || null,
      "userAccount" : {
        emailConfig: {
          from: `no-reply@${APP_MAILDOMAIN}`,
          siteName: APP_DISPLAY_NAME,
        },
      },
    },
  });
};
