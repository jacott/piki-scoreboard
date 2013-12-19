// @export AppObservable

AppObservable = function () {};

AppObservable.api = {
  inform: function (func) {
    this._autorun || (this._autorun = Deps.autorun(listener.bind(this)));

    this._observers.push(func);
  },

  uninform: function (func) {
    var index = this._observers.indexOf(func);

    if (index == -1) return;

    this._observers.splice(index,1);

    if (this._observers.length === 0 && this._autorun) {
      this._autorun.stop();
      this._autorun = null;
    }
  },
};


AppObservable.attachTo = function (observable) {
  App.extend(observable, AppObservable.api);
  observable._dep = new Deps.Dependency();
  observable._observers = [];
  return observable;
};


AppObservable.prototype = {
  constructor: AppObservable,
};

function listener() {
  this._dep.depend();
  var obs = this._observers;
  for(var i=0,func;func=obs[i];++i) {
    func.call(this);
  }
}
