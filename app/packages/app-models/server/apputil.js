var Future = Npm.require('fibers/future');

App.extend(Apputil, {
  system: function (cmd, args, outFunc) {
    var spawn = Npm.require('child_process').spawn;
    var code;
    var proc = spawn(cmd, args);
    var future = new Future;
    proc.on('close', function (c) {
      code = c;
      future.return();
    });

    outFunc && proc.on('data', outFunc);

    future.wait();
    return code;
  },
});
