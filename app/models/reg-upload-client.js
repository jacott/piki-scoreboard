define((require)=>{
  const session         = require('koru/session');

  return {
    upload(eventId, file, callback) {
      const reader = new window.FileReader();
      reader.onload = ()=>{
        session.rpc('Reg.upload', eventId, new Uint8Array(reader.result), (err, result)=>{
          callback(err, result);
        });
      };
      reader.readAsArrayBuffer(file);
    },
  };
});
