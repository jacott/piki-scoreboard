define((require)=>{
  const format          = require('koru/format');
  const base            = require('koru/resource-string');

  Object.assign(base.en, {
    unsupported_import_format:  'The uploaded file is unsupported',
  });

  base.text = text =>{
    const m = /^([^:]+):(.*)$/.exec(text);
    if (m !== null) {
      const fmt = base.en[m[1]];
      if (fmt !== undefined) {
        return format(fmt, m[2].split(':'));
      }
    }
    return base.en[text] || text;
  };

  Object.assign(base.en, {
    not_allowed: "must be blank",
  });

  return base;
});
