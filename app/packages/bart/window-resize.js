Bart.onWindowResize = onWindowResize;

var subject = App.makeSubject({});
var obCount = 0;
var timeout;

function onWindowResize(func) {
  if (++obCount === 1)
    window.addEventListener('resize', resized);

  var handle = subject.onChange(func);
  var stop = handle.stop;
  handle.stop = function () {
    handle.stop = null;
    if (--obCount === 0) {
      if (timeout) {
        App.clearTimeout(timeout);
        timeout = null;
      }
      window.removeEventListener('resize', resized);
    }

    stop();
  };
  return handle;
}

function resized() {
  if (timeout) return;
  timeout = App.setTimeout(callObservers, 100);
}

function callObservers() {
  timeout = null;
  subject.notify();
}
