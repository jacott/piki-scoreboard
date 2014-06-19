define(function(require, exports, module) {
  var session = require('koru/session');

  return {
    upload: function (eventId, file, callback) {
    var reader = new window.FileReader();
      reader.onload = function () {
        session.rpc('Reg.upload', eventId, new Uint8Array(reader.result), function (err, result) {
          callback(err, result);
        });
      };
      reader.readAsArrayBuffer(file);
    },
  };
});
