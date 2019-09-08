define((require, exports, module)=>{
  const koru         = require('koru');
  const localStorage = require('koru/local-storage');
  const util         = require('koru/util');

  koru.onunload(module, 'reload');

  Error.stackTraceLimit=100;
});
