deprecateWarning = function (msg) {
  console.log(App.atSrcLine('DEPRECATION: '+msg+"\n"));
};



TH = (function () {
  var user;

  return {
    replaceObject: function (parent, objectName, replacement) {
      var orig = parent[objectName];
      geddon.test.onEnd(function () {parent[objectName] = orig});
      return parent[objectName] = replacement;
    },

    nestedDivs: function (spec) {
      spec = spec.split(' ');
      var frag = document.createDocumentFragment();
      var curr = frag;
      spec.forEach(function (item) {
        var elm = document.createElement('div');
        var m = /^([#.])(.*)$/.exec(item);
        if (! m) m = [item, '.', item];
        switch(m[1]) {
        case '#': m[1] = 'id'; break;
        case '.': m[1] = 'class'; break;
        }
        elm.setAttribute(m[1], m[2]);
        curr.appendChild(elm);
        curr = elm;
      });
      return frag;
    },

    createMockEvent: function(currentTarget, options) {
      return _.extend({}, {
        preventDefault: geddon.test.stub(),
        stopImmediatePropagation: geddon.test.stub(),
        currentTarget: currentTarget,
      }, options || {});
    },

    getMethodHandlers: function () {
      return Meteor.server.method_handlers;
    },

    test: function () {
      return geddon.test;
    },

    destroyModel: function (name) {
      AppModel._destroyModel(name);
      var handlers = Meteor.server ? Meteor.default_server.method_handlers : Meteor.connection._methodHandlers;
      Object.keys(handlers).forEach(function (key) {
        if (key.slice(0, name.length + 2) === '/' + name + '/' ||
            key.slice(0, name.length + 1) === name + '.') {
          delete handlers[key];
        }
      });
      if (Meteor.connection) {
        delete Meteor.connection._stores[name];
      }

    },
    buildEvent: function (event, args) {
      if (document.createEvent) {
        var e = document.createEvent("Event");
        e.initEvent(event, true, true);
        _.extend(e, args);
      } else {
        var e = document.createEventObject();
        e.__name = event;
        _.extend(e, args);
      }
      return e;
    },

    setColor: function (node, value) {
      TH.click(node);
      assert(document.getElementById('ColorPicker'));
      Bart.ColorPicker._cp.setHex(value);
      assert.dom(document.getElementById('confirmDialog'), function () {
        TH.click('[name=apply]');
      });
    },

    input: function (node, value) {
      if (typeof node === 'string') {
        var args = Apputil.slice(arguments);
        value = args[args.length -1];
        args[args.length -1 ] = function () {
          TH.input(this, value);
        };
        assert.dom.apply(assert, args);
      } else {
        (node.nodeType ? node : node[0]).value = value;
        this.trigger(node, 'input');
      }
    },

    change: function (node, value) {
      if (typeof node === 'string') {
        var args = Apputil.slice(arguments);
        value = args[args.length -1];
        args[args.length -1 ] = function () {
          TH.change(this, value);
        };
        assert.dom.apply(assert, args);
      } else {
        node.value = value;
        this.trigger(node, 'change');
      }
    },

    flushEvent: function (node, event, args) {
      event = this.trigger(node, event, args);
      Deps.flush();
      return event;
    },

    trigger: function (node, event, args) {
      if (typeof node === 'string') {
        assert.dom(node, function () {
          TH.trigger(this, event, args);
        });
      } else {
        node = (node.nodeType ? node : node[0]);
        assert(node,'node not found');

        if (typeof event === 'string')
          event =  this.buildEvent(event, args);

        if (document.createEvent) {
          node.dispatchEvent(event);
        } else {
          node.fireEvent("on" + event.__name, event);
        }
        return event;
      }
    },

    focusElement: function(elem) {
      // This sequence is for benefit of IE 8 and 9;
      // test there before changing.
      window.focus();
      elem.focus();
      elem.focus();

      // focus() should set document.activeElement
      if (document.activeElement !== elem)
        throw new Error("focus() didn't set activeElement");
    },

    blurElement: function(elem) {
      elem.blur();
      if (document.activeElement === elem)
        throw new Error("blur() didn't affect activeElement");
    },

    flushClick: function (node) {
      this.click(node);
      Deps.flush();
    },

    click: function(node) {
      if (typeof node === 'string') {
        var args = Apputil.slice(arguments);
        args.push(function () {
          TH.click(this);
        });
        assert.dom.apply(assert, args);
      } else {
        TH.trigger(node, 'click');
      }
    },

    sansPx: function (arg) {
      return arg.substring(0,arg.length-2);
    },

    fixmeStrace: function (msg) {
      try {
        throw new Error(msg || 'stack trace');
      } catch(e) {
        console.log(e,":\n",e.stack);
      }
    },

    styleAttr: function (elm,attr) {
      elm = elm.style || elm[0].style;
      return elm[attr];
    },

    clearDB: function () {
      TH.Factory && TH.Factory.clear();
      if (Meteor.isServer) AppModel.User._clearGuestUser();
      (Meteor.users._collection || Meteor.users).remove({});
      for(var name in AppModel) {
        var docs = AppModel[name].docs;
        docs && (docs._collection || docs).remove({});
      };
    },

    call: function () {
      var args = arguments;
      return TH.login(function () {
        return App.rpc.apply(Meteor, args);
      });
    },

    subscriptionStub: function (ready) {
      var subStub = {called: 0, ready: function () {return !! ready;}, stop: sinon.stub()};
      return subStub;
    },

    addStyles: function (styles) {
      var style = Bart.html('<style class="testStyle"></style>');

      style.innerHTML = styles;
      document.head.appendChild(style);
    },

    removeStyles: function () {
      var elm;
      while(elm = document.querySelector('head style.testStyle')) {
          elm.parentNode.removeChild(elm);
      }
    },

    logNodeAncestors: function (node,attr) {
      var hierarchy = [];
      while(node) {
        hierarchy.push([node.id || node.tagName,node[attr]]);
        node=node.parentNode;
      }
      return hierarchy;
    },

    addMain: function () {
      var main = document.getElementById('main');
      if (main) return main;
      document.body.appendChild(Bart.html('<header></header><section id="main" style="width:1200px; height:800px"></section>'));
      return document.getElementById('main');
    },

    user: function () {
      return null;
    },

    userId: function () {
      return user && user._id;
    },

    loginAs: function (newUser, func) {
      var test = geddon.test;

      if (newUser !== user) {
        user && TH.user.restore();
        App.userId.restore && App.userId.restore();

        if (newUser) {
          test.stub(App, 'userId', function () {return user._id});
          test.stub(TH,'user',function () {return user});
          var restore = TH.user.restore;
          TH.user.restore = function () {
            App.userId.restore && App.userId.restore();
            restore.call(TH.user);
            user = null;
            if(Meteor.isClient)
              Meteor.connection._userId = null;
          };

          user = newUser._id ? newUser : AppModel.User.findOne(newUser);
          if(Meteor.isClient) Meteor.connection._userId = user._id;
        }
      }

      if (typeof Bart !== 'undefined')
        Bart.Main.setAccess();

      if (! func) return user;

      return DDP._CurrentInvocation.withValue(new MethodInvocation(TH.invocation = {userId: TH.userId()}), func);
    },

    login: function (test, func) {
      if (test !== geddon.test) {
        if(arguments.length == 1) {
          if (typeof test === 'function')
            func = test;
          else if (test != null) {
          }
        }
      }
      return this.loginAs(user || TH.Factory.last.user || TH.Factory.createUser(), func);
    },

    setOrg: function (org) {
      org = org || TH.Factory.createOrg();
      App.Ready.isReady = true;
      var subStub = ('restore' in App.subscribe) ?
            App.subscribe : geddon.test.stub(App, 'subscribe');
      var orgSub = subStub.withArgs('Org');
      AppRoute.gotoPage(Bart.Home, {orgSN: org.shortName});
      orgSub.yield();
      return orgSub;
    },

    printDimensions: function (elm) {
      var offset = elm.offset();
      return "offset: {top: "+offset.top+", left: "+offset.left+"}, width: "+elm.outerWidth()+", height: "+elm.outerHeight();
    },

    showErrors: function (doc) {
      return {
        toString: function () {
          return AppVal.inspectErrors(doc);
        },
      };
    },
  };

  function MethodInvocation(options) {
    this.isSimulation = options.isSimulation;

    // call this function to allow other method invocations (from the
    // same client) to continue running without waiting for this one to
    // complete.
    this._unblock = options.unblock || function () {};
    this._calledUnblock = false;

    // current user id
    this.userId = options.userId;

    // sets current user id in all appropriate server contexts and
    // reruns subscriptions
    this._setUserId = options.setUserId || function () {};

    // Scratch data scoped to this connection (livedata_connection on the
    // client, livedata_session on the server). This is only used
    // internally, but we should have real and documented API for this
    // sort of thing someday.
    this._sessionData = options.sessionData;
  }
})();

if (Meteor.isServer) {
  var methodInvocationClass;

  Meteor.methods({
    '_Test.exposeMethodInvocation': function () {
      methodInvocationClass = this.constructor;
    },
  });

  TH.getMethodInvocation = function () {
    if (! methodInvocationClass)
      Meteor.call('_Test.exposeMethodInvocation');

    return methodInvocationClass;
  };

  TH.global = global;
} else {
  TH.global = window;

  TH.MockFileReader = function (v) {
    function MockFileReader() {
      v.fileReaderargs = arguments;
      v.fileReader = this;
    };

    MockFileReader.prototype = {
      constructor: MockFileReader,

      readAsArrayBuffer: function (file) {
        this.blob = file.slice(0);
      },
    };

    return MockFileReader;
  };
}

if(typeof(module) !== 'undefined' && module.exports) {
  module.exports = TH;
}
