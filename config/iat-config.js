const path = require('path');
const appDir = path.resolve(__dirname, '../app');

const KORU_PORT = process.env.KORU_PORT;

const urlRoot = 'http://localhost:'+KORU_PORT;

exports.server = cfg =>{
  cfg.merge('requirejs', {
    config: {
      "koru/web-server": {
        host: "0.0.0.0",
        indexhtml: path.resolve(appDir, '../build/index.html'),
        indexjs: path.resolve(appDir, '../build/index.js'),
        indexjsmap: path.resolve(appDir, '../build/index.js.map'),
        indexcss: path.resolve(appDir, '../build/index.css'),
      },

      "koru/main": {
        urlRoot,
        "userAccount" : {
          emailConfig: {
            siteName: 'Piki IAT demo',
          },
        },
      },
    },
  });
};

exports.client = cfg =>{
  cfg.set('requirejs.config.models/user-client.pretendRole', process.env['PIKI_ROLE']);
};
