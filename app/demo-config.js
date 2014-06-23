module.exports = {
  "koru/mongo/driver": {url: "mongodb://localhost:3014/demo"},

  "koru/web-server": {
    host: "127.0.0.1",
    port: 3030,
  },

  "koru/main": {
    "urlRoot": 'http://localhost:3030/',
    "userAccount" : {
      emailConfig: {
        from: 'piki-demo@obeya.co',
        siteName: 'Piki demo',
      },
    },
    extraRequires: [
      'koru/css/less-watcher', 'koru/server-rc',
    ],
    startUp: function (koruPath) {
      requirejs(['koru/file-watch'], function (fileWatch) {
        var file = __dirname + '/' + koruPath;
        fileWatch.watch(file, file.replace(/\/koru$/, ''));
      });
    }
  },
};
