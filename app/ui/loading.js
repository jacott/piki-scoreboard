define(function(require, exports, module) {
  const koru            = require('koru');
  const Dom             = require('koru/dom');
  const session         = require('koru/session');
  const IDB             = require('lib/idb');
  const NetworkSync     = require('ui/network-sync');

  let onChangeHandle, stopPending;

  let progress = 100;
  const loadingProgress = document.getElementById('loadingProgress') ||
          Dom.h({id: 'loadingProgress', div: {}});
  const progressElmStyle = loadingProgress.firstElementChild.style;

  koru.onunload(module, stop);

  const Loading = module.exports = {
    done() {Loading.loadProgress(100)},

    loadProgress(pc) {
      if (pc === progress) return;
      if (pc === 100) {
        Dom.addClass(loadingProgress, 'complete');
      } else {
        if (progress === 100) {
          Dom.removeClass(loadingProgress, "hide");
          Dom.removeClass(loadingProgress, 'complete');
        }
      }
      progressElmStyle.width = pc+'%';
      progress = pc;
    },

    get progress() {return progress},

    get loadingProgressElement() {return loadingProgress},

    start() {
      NetworkSync.start();
      loadingProgress.addEventListener('animationend', animationEnd, true);
      Loading.loadProgress(50);
      onChangeHandle = session.state.pending.onChange(pending => {
        if (pending) {
          if (NetworkSync.mode === 'online') NetworkSync.mode = 'pending';
          stopPending = stopPending || scheduleLoading();
        } else {
          if (NetworkSync.mode === 'pending') NetworkSync.mode = 'online';
          stopPending && stopPending();
          hideShowLoading();
        }
      });

      window.addEventListener('beforeunload', confirmLeave);
    },

    stop,
  };

  function stop() {
    loadingProgress.removeEventListener('animationend', animationEnd, true);
    Loading.done();
    stopPending && stopPending();
    onChangeHandle && onChangeHandle.stop();
    stopPending = onChangeHandle = null;

    window.removeEventListener('beforeunload', confirmLeave);
    NetworkSync.stop();
  }

  function animationEnd(event) {
    if (progress = 100) {
      Dom.addClass(loadingProgress, "hide");
    }
  }

  function scheduleLoading() {koru.afTimeout(hideShowLoading, 2000)}

  function hideShowLoading() {
    stopPending = null;

    const count = NetworkSync.mode === 'pending' && session.state.pendingCount();
    if (count) {
      Loading.loadProgress(100/count);
      scheduleLoading();
    } else {
      Loading.done();
    }
  }

  function confirmLeave(ev) {
    const {idb} = IDB;
    if (idb == null ? session.state.pendingUpdateCount() > 0 : ! idb.isReady) {
      ev.returnValue = "You have unsaved changes.";
    }
  }
});
