var vendorStylePrefix = (function () {
  var style = document.documentElement.style;
  var styles = ['webkit', 'Moz',  'ms', 'o', ''];
  for(var i = 0; i < styles.length; ++i) {
    if (styles[i]+'Transform' in style) break;
  }
  return styles[i];
})();

var vendorFuncPrefix = vendorStylePrefix.toLowerCase();
var vendorTransform = vendorStylePrefix ? vendorStylePrefix + 'Transform' : 'transform';

var matches = document.documentElement[vendorFuncPrefix+'MatchesSelector'] || document.documentElement.matchesSelector;

var TEXT_NODE = document.TEXT_NODE;
var DOCUMENT_FRAGMENT_NODE = document.DOCUMENT_FRAGMENT_NODE;

var bartEvent = null;

Bart = {
  INPUT_SELECTOR: 'input,textarea',

  _helpers: {},

  html: function (html) {
    var elm = document.createElement('div');
    elm.innerHTML = html;
    return elm.firstChild;
  },

  parentOf: function (parent, elm) {
    while(elm && elm.nodeType !== 9) {
      if (parent === elm) return parent;
      elm = elm.parentNode;
    }
    return null;
  },

  registerHelpers: function (helpers) {
    extend(this._helpers, helpers);
    return this;
  },

  newTemplate: function (options) {
    addTemplates(Bart, options);
    return this;
  },

  destroyData: function (elm) {
    var ctx = elm && elm._bart;
    if (ctx) {
      if (ctx._onDestroy) {
        var list = ctx._onDestroy;
        ctx._onDestroy = null;
        for(var i = 0; i < list.length; ++i) {
          var row = list[i];
          if (typeof row === 'function')
            row.call(ctx);
          else
            row.stop();
        }
      }
      ctx.destroyed && ctx.destroyed(ctx, elm);
      var tpl = ctx.template;
      tpl && tpl.$destroyed && tpl.$destroyed.call(tpl, ctx, elm);
      elm._bart = null;
    }
    Bart.destroyChildren(elm);
  },

  remove: function (elm) {
    if (elm) {
      Bart.destroyData(elm);
      elm.parentNode && elm.parentNode.removeChild(elm);
    }
  },

  destroyChildren: function (elm, remove) {
    if (! elm) return;

    if (remove) {
      var row;
      while(row = elm.firstChild) {
        Bart.destroyData(row);
        elm.removeChild(row);
      }
      return;
    } else {
      var iter = elm.firstChild;
      while (iter) {
        var row = iter;
        iter = iter.nextSibling; // incase side affect
        Bart.destroyData(row);
      }
    }
  },

  getMyCtx: function (elm) {
    return elm && elm._bart;
  },

  getCtx: function (elm) {
    if (! elm) return;
    var ctx = elm._bart;
    while(! ctx && elm.parentNode)
      ctx = (elm = elm.parentNode)._bart;
    return ctx;
  },

  getNode: function (elm) {
    return elm && elm._node;
  },

  replaceElement: function (newElm, oldElm, noRemove) {
    var ast = oldElm._node;
    if (ast) {
      newElm._node = ast;
      ast[0] = newElm;
    }

    var parentCtx = (oldElm._bart && oldElm._bart.parentCtx) || Bart.getCtx(oldElm.parentNode);
    if (parentCtx) {
      var ctx = newElm._bart;
      if (ctx) ctx.parentCtx = parentCtx;
    }

    noRemove === 'noRemove' || Bart.destroyData(oldElm);

    oldElm.parentNode && oldElm.parentNode.replaceChild(newElm, oldElm);
    return this;
  },

  /**
   * Remove an element and provide a function that inserts it into its original position
   * @param element {Element} The element to be temporarily removed
   * @return {Function} A function that inserts the element into its original position
   **/
  removeToInsertLater: function(element) {
    var parentNode = element.parentNode;
    var nextSibling = element.nextSibling;
    parentNode.removeChild(element);
    if (nextSibling) {
      return function() {parentNode.insertBefore(element, nextSibling)};
    } else {
      return function() {parentNode.appendChild(element)};
    };
  },

  getClosest: function (elm, selector) {
    while(elm && elm.nodeType !== 9) {
      if (matches.call(elm, selector)) return elm;
      elm = elm.parentNode;
    }
    return;
  },

  matches: function (elm, selector) {
    return matches.call(elm, selector);
  },

  nextSibling: function (elm, selector) {
    if (elm) for(var next = elm.nextElementSibling; next; next = next.nextElementSibling) {
      if (matches.call(next, selector)) return next;
    }
    return null;
  },

  getClosestCtx: function (elm, selector) {
    return this.getCtx(this.getClosest(elm, selector));
  },

  setCtx: function (elm, ctx) {
    elm._bart = ctx;
    return ctx;
  },

  updateElement: function (elm, data) {
    var prevCtx = Bart.$ctx;
    var ctx = Bart.$ctx = Bart.getCtx(elm.parentNode);
    try {
      ctx._updateNode(elm._node, data || ctx.data);
    } finally {
      this.element = this.node = null;
      Bart.$ctx = prevCtx;
    }
    return this;
  },

  // TODO import by performing a binary search. Also allow passing a
  // hint of the best place to start searching. It might be the upper
  // or lower bound or the point of insertion or not even in the list
  findFirstByCtxData: function (parent, finder) {
    var iter = parent && parent.firstChild;
    while(iter) {
      var row = iter;
      iter = iter.nextSibling; // incase side affect
      var b = row._bart;
      if (b && finder(b.data)) return row;
    }
    return null; // need null for IE
  },

  transformTranslate: function (elm , x, y) {
    elm.style[vendorTransform] = elm.style[vendorTransform].replace(/\btranslate\([^)]*\)\s*/, '')+'translate('+x+','+y+')';
  },

  vendorTransform: vendorTransform,

  vendorPrefix: vendorFuncPrefix,

  hasPointerEvents: true,
};

if (vendorStylePrefix === 'ms') {
  (function () {
    var m = /\bMSIE (\d+)/.exec(navigator.userAgent);
    if (m) {
      if (+m[1] < 11) {
        Bart.hasPointerEvents = false;
      }
    }
  })();
}


_private = {
  BartTemplate: BartTemplate,
  getValue: getValue,
  evalArgs: evalArgs,
};

function extend(obj,properties) {
  for(var prop in properties) {
    Object.defineProperty(obj,prop,Object.getOwnPropertyDescriptor(properties,prop));
  }
  return obj;
}


function addTemplates(parent, options) {
  if (options.name.match(/\./)) {
    var names = options.name.split('.');
    options.name = names.pop();
    names.forEach(function (name) {
      parent = parent[name] || (parent[name] =  new BartTemplate());
    });
  }
  parent[options.name] = parent = (parent[options.name] || new BartTemplate()).$initOptions(options);
  var nested = options.nested;

  if (! options.nested) return;
  for(var i=0; i < nested.length; ++i) {
    addTemplates(parent, nested[i]);
  }
}

function BartCtx(template, parentCtx, data) {
  this.template = template;
  this.parentCtx = parentCtx;
  this.data = data || {};
  this.evals = [];
  this.attrEvals = [];
}

BartCtx.prototype = {
  constructor: BartCtx,

  onDestroy: function (obj) {
    var list = this._onDestroy || (this._onDestroy = []);
    list.push(obj);
    return this;
  },

  _updateNode: function (node, data) {
    this.element = node[0];
    this.node = node;

    var value = getValue(data, node[1], node[2]);

    if (value !== node[0]) {
      if (value == null)  {
        value = document.createComment('empty');

      } else if (typeof value === 'object' && value.nodeType === DOCUMENT_FRAGMENT_NODE) {

        // *** Document fragment ***
        if (value.firstChild == null) value.appendChild(document.createComment('empty'));
        // FIXME what about multiple child nodes?
        value = value.firstChild;

      } else if (typeof value !== 'object' || ! ('nodeType' in value)) {

        // ***  Text output ***
        if (node[0].nodeType === TEXT_NODE) {
          node[0].textContent = value.toString();
          value = node[0];
        } else {
          value = document.createTextNode(value.toString());
        }
      } // else *** User created node

      if (node[0] !== value) {
        Bart.replaceElement(value, node[0]);
      }
    }
    node[0] = value;
    value._node = node;
  },

  updateAllTags: function (data) {
    var prevCtx = Bart.$ctx;
    Bart.$ctx = this;
    if (data === undefined)
      data = this.data;
    else
      this.data = data;
    try {
      var evals = this.attrEvals;
      for(var i=0; i < evals.length; ++i) {
        var node = evals[i];
        this.element = node[0];
        var value = (getValue(data, node[2], node[3])||'').toString();
        if (node[1] && node[0].getAttribute(node[1]) !== value)
          node[0].setAttribute(node[1], value);
      }
      evals = this.evals;

      for(var i=0; i < evals.length; ++i) {
        this._updateNode(evals[i], data);
      }
    } finally {
      this.element = this.node = null;
      Bart.$ctx = prevCtx;
    }
  },
};

function getValue(data, func, args) {
  if (! args) {
    return;
  }
  if (args.dotted) {
    var value = getValue(data, func, []);
    if (value == null) return value;
    var dotted = args.dotted;
    var last = dotted.length -1;
    for(var i = 0; i <= last ; ++i) {
      var row = dotted[i];
      var lv = value;
      var value = lv[dotted[i]];
      if (value == null) {
        return value;
      }
      if (typeof value === 'function') {
        value = i === last ?
          value.apply(lv, evalArgs(data, args)) :
          value.call(lv);
      }
    }
    return value;
  }

  switch(typeof func) {
  case 'function':
    return func.apply(data, evalArgs(data, args));
  case 'string':
    if (func[0] === '"')
      return func.slice(1);
    if (func === 'this') return data;
    var value = data[func];
    if (value === undefined) {
      value = Bart.$ctx.template._helpers[func] || Bart._helpers[func];
    }
    if (value !== undefined) {
      if (typeof value === 'function')
        return value.apply(data, evalArgs(data, args));
      return value;
    }
    return;
  case 'number':
    return func;
  case 'object':
    if ('$autoRender' in func) {
      return evalPartial.call(data, func, args, Bart.$ctx);
    }
  default:
    throw new Error('Unexpected type: '+ (typeof func));
  }
}

function evalPartial(func, args, ctx) {
  args = evalArgs(this, args);
  if (args.length === 1)
    args = args[0];
  var elm = ctx.element;
  if (ctx = elm._bart) {
    return ctx.updateAllTags(args);
  }

  if ('$autoRender' in func)
    return func.$autoRender(args);
  else
    return func.call(this, args);
}

function evalArgs(data, args) {
  if (args.length === 0) return args;

  var output = [];
  var hash;

  for(var i = 0; i < args.length; ++i) {
    var arg = args[i];
    if (arg != null && typeof arg === 'object' && arg[0] === '=') {
      hash = hash || {};
      hash[arg[1]] = getValue(data, arg[2], []);
    } else {
      output.push(getValue(data, arg, []));
    }
  }
  if (hash) for(var key in hash) {
    output.push(hash);
    break;
  }
  return output;
}

function BartTemplate() {
}

BartTemplate.prototype = {
  constructor: BartTemplate,

  $initOptions: function (options) {
    this.name = options.name;
    this.nodes = options.nodes;
    this._helpers = {};
    this._events = [];
    return this;
  },

  $autoRender: function (data) {
    var tpl = this;
    var elm = tpl.$render(data);
    tpl.$attachEvents(elm);
    Bart.getCtx(elm).onDestroy(function () {
      tpl.$detachEvents(elm);
    });
    return elm;
  },

  $render: function (data) {
    var parentCtx = Bart.$ctx;
    var ctx = Bart.$ctx = new BartCtx(this, parentCtx, data);
    try {
      var frag = document.createDocumentFragment();
      this.nodes && addNodes.call(this, frag, this.nodes);
      if (frag.firstChild) {
        if (frag.lastChild === frag.firstChild) {
          frag = frag.firstChild;
          frag._bart = ctx;
        } else {
          var nodes = frag.childNodes;
          for(var i = 0; i < nodes.length; ++i) {
            nodes[i]._bart = ctx;
          }
        }
      }
      this.$created && this.$created(ctx, frag);
      data === undefined || ctx.updateAllTags(data);
      return frag;
    } finally {
      Bart.$ctx = parentCtx;
    }
  },

  $helpers: function (properties) {
    var obj = this._helpers;
    for(var prop in properties) {
      Object.defineProperty(obj,prop,Object.getOwnPropertyDescriptor(properties,prop));
    }
  },

  $events: function (events) {
    for(var key in events) {
      var func = events[key];
      var m = /^(\S+)(.*)/.exec(key);
      if (! m) throw new Error("invalid event spec: " + key);
      this._events.push([m[1], m[2].trim(), events[key]]);
    }
  },

  $attachEvents: function (parent, selector) {
    nativeOnOff(parent, nativeOn, selector, this._events);
    return this;
  },

  $detachEvents: function (parent, selector) {
    nativeOnOff(parent, nativeOff, selector, this._events);
    return this;
  },
};

function nativeOn(parent, eventType, selector, func) {
  var events = parent._bart._events;

  if (! events) {
    events = parent._bart._events = {};
  }

  var eventTypes = events[eventType];

  if (! eventTypes) {
    eventTypes = events[eventType] = {};
    if (eventType === 'focus' || eventType === 'blur')
      parent.addEventListener(eventType, onEvent, true);
    else
      parent.addEventListener(eventType, onEvent);
  }

  eventTypes[selector||':TOP'] = func; // FIXME support multiple funcs for same selector
}

function onEvent(event) {
  var ctx = event.currentTarget._bart;
  var eventTypes = ctx._events[event.type];

  var later = {};
  var elm = event.target;

  for(var key in eventTypes) {
    if (key === ':TOP') {
      if (elm === event.currentTarget) {
        if (fire(event, elm, eventTypes[key])) return;
      } else
        later[key] = true;
    }
    else if (matches.call(elm, key)) {
      if (fire(event, elm, eventTypes[key])) return;
    } else if (matches.call(elm, key.replace(/,/g, ' *,')+' *')) // FIXME should split "," selectors early like in $events()
      later[key] = true;
  }

  for(var key in later) {
    for (elm = elm && elm.parentNode;elm && elm !== event.currentTarget; elm = elm.parentNode) {
      for(var key in later) {
        if (key !== ':TOP' && matches.call(elm, key)) {
          if (fire(event, elm, eventTypes[key])) return;
          delete later[key];
        }
      }
    }
    break;
  }

  for(var key in later) {
    if (fire(event, elm, eventTypes[key])) return;
  }
}

function fire(event, elm, func) {
  if (func.call(elm, event) === false || event.$actioned) {
    event.preventDefault();
    event.stopImmediatePropagation();
    return true;
  }
}

function nativeOff(parent, eventType, selector, func) {
  var events = parent._bart._events;

  if (events) {
    var eventTypes = events[eventType];
    events[eventType] = null;
    if (eventType === 'focus' || eventType === 'blur')
      parent.removeEventListener(eventType, onEvent, true);
    else
      parent.removeEventListener(eventType, onEvent);
  }
}

function nativeOnOff(parent, func, selector, events) {
  parent = parent.nodeType ? parent : parent[0];

  if (selector) {
    selector = selector+' ';
    for(var i = 0; i < events.length; ++i) {
      var row = events[i];
      func(parent, row[0],  selector+row[1], row[row.length -1]);
    }
  } else for(var i = 0; i < events.length; ++i) {
    var row = events[i];
    func(parent, row[0], row[1], row[row.length -1]);
  }
}

function addNodes(parent, nodes) {
  for ( var i = 0; i < nodes.length; ++i ) {
    var node = nodes[i];

    if (typeof node === 'string') {
      var elm = document.createTextNode(node);

    } else if (node.shift) {
      var elm = addNodeEval(this, node, parent);
    } else {
      var elm = document.createElement(node.name);
      setAttrs.call(this, elm, node.attrs);
      node.children && addNodes.call(this, elm, node.children);
    }
    elm && parent.appendChild(elm);
  }
}

function parseNode(template, node, result) {
  var m = /^([^\.]+)\.(.*)$/.exec(node[1]);
  var partial = node[0] === '>';

  if (m) {
    var name = m[1];
    node = {dotted: m[2].split('.'), opts: node.slice(1)};
  } else {
    var name = node[1];
    node = node.slice(2);
  }

  if (partial) {
    result.push(fetchTemplate(template, name, m && node.dotted));
    result.push(m ? node.opts: node);
  } else {
    result.push(template._helpers[name] || name);
    result.push(node);
  }

  return result;
}

function fetchTemplate(template, name, rest) {
  if (name[0] === '/') {
    var result = Bart[name.slice(1)];
  } else {
    var result = template[name];
  }
  if (rest) for(var i = 0; i < rest.length; ++i) {
    result = result && result[rest[i]];
  }

  if (! result) throw new Error("Invalid partial '"  + name + (rest ? "."+rest.join(".") : '') + "' in Template: " + template.name);

  return result;
}

function addNodeEval(template, node, parent) {
  switch(node[0]) {
  case '-':
    var elm = null; break;
  case '':
    var elm = document.createTextNode(''); break;
  default:
    var elm = document.createComment('empty');
  }

  Bart.$ctx.evals.push(parseNode(template, node, [elm]));
  return elm;
}

function addAttrEval(template, id, node, elm) {
  Bart.$ctx.attrEvals.push(parseNode(template, node, [elm, id]));
}

function setAttrs(elm, attrs) {
  if (attrs) for(var j=0; j < attrs.length; ++j) {
    var attr = attrs[j];

    if (typeof attr === 'string') {
      elm.setAttribute(attr, '');

    } else if (attr[0] === '=') {

      if (typeof attr[2] === 'string') {

        elm.setAttribute(attr[1], attr[2]);

      } else {
        addAttrEval(this, attr[1], attr[2], elm);
      }
    } else { // custom element mutator
      addAttrEval(this, null, attr, elm);
    }
  }
}
