define((require)=>{
  const koru            = require('koru');
  const CssLoader       = require('koru/css/loader');
  const localStorage    = require('koru/local-storage');
  const session         = require('koru/session');

  new CssLoader(session).loadAll('ui');

  const Trace = require('koru/trace');

  const {execWrapper} = session;

  let debug_latency;
  Trace.debug_sessionLatency = v =>{
    debug_latency = typeof v === 'number' ? v : undefined;
    session.execWrapper = debug_latency === undefined ? execWrapper : latencyWrapper;
    koru.info(`Network latency set to ${debug_latency||0}ms`);
  };

  const latencyWrapper = (func, conn, data) => {
    setTimeout(()=>{
      execWrapper(func, conn, data);
    }, debug_latency);
  };

  const setTrace = ({oldValue, newValue})=>{
    try {
      const now = newValue && newValue.startsWith('{') ? JSON.parse(newValue) : {};
      const was = oldValue && oldValue.startsWith('{') ? JSON.parse(oldValue) : {};
      for (const key in was) {
        now[key] || Trace[`debug_${key}`]();
      }
      for (const key in now) {
        Trace[`debug_${key}`](now[key]);
      }
    } catch(ex) {
      console.log(ex);
    }
  };

  const trace = localStorage.getItem('trace');
  trace && setTrace({newValue: trace});

  localStorage.onChange('trace', setTrace);


  // var Trace = require('koru/trace');

  // Trace.debug_page(true);
  // Trace.debug_subscribe(true);
  // Trace.debug_clientUpdate({User: true, Org: true, Invite: true});
});
