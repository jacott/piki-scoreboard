App.module('Reg', function (mod) {
  App.extend(mod, {
    upload: function (eventId, file, callback) {
      var reader = new FileReader();
      reader.onload = function () {
        App.rpc('Reg.upload', eventId, new Uint8Array(reader.result), function (err, result) {
          callback(err, result);
        });

      };
      reader.readAsArrayBuffer(file);
    },
  });
});
