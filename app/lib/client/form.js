var $ = Bart.current;
var Tpl = Bart.Form;

var IGNORE = {includeBlank: true, selectList: true, value: true};

var DEFAULT_HELPERS = {
  value: function () {
    return this.doc[this.name];
  },

  htmlOptions: function () {
    var elm = $.element;
    var options = this.options;

    for(var attr in options) {
      if (! (attr in IGNORE))
        elm.setAttribute(attr, options[attr]);
    }
  },
};

Tpl.$extend({
  submitFunc: function(elmId, successPage, extraSetup) {
    return function (event) {
      event.$actioned = true;

      var elm = document.getElementById(elmId);
      var ctx = Bart.getCtx(elm);
      var doc = ctx.data;
      var form = elm.querySelector('.fields');

      Tpl.fillDoc(doc, form);
      extraSetup && extraSetup(doc, elm);

      if (doc.$save()) {
        successPage && AppRoute.gotoPage(successPage);
      } else {
        Tpl.renderErrors(doc, form);
      }
    };
  },

  saveDoc: function (doc, form) {
    Tpl.fillDoc(doc, form);
    if (doc.$save()) {
      return true;
    }

    Tpl.renderErrors(doc, form);
  },

  fillDoc: function (doc, form) {
    var fields = form.querySelectorAll('[name]');
    for(var i = 0; i < fields.length; ++i) {
      var field = fields[i];
      doc[field.getAttribute('name')] = field.value;
    }
  },

  clearErrors: function (form) {
    var msgs = form.querySelectorAll('.error');
    for(var i = 0; i < msgs.length; ++i) {
      Bart.removeClass(msgs[i], 'error');
    }
  },

  renderErrors: function (doc, form) {
    var errors = doc._errors;
    var focus = null;
    var otherMsgs = [];
    Tpl.clearErrors(form);

    if (errors) {
      for(var field in errors) {
        var msg = AppVal.Error.msgFor(doc, field);
        if (msg) {
          var fieldElm = Tpl.renderError(form, field, msg);
          if (fieldElm)
            focus = focus || fieldElm;
          else
            otherMsgs && otherMsgs.push([field,msg]);
        }
      }
      if (otherMsgs.length > 0) {
        console.log('Unexpected errors: ', (typeof TH !== 'undefined' && TH.test().name), JSON.stringify(otherMsgs));
      }

      focus && focus.focus();
      return true;
    }

    return false;
  },

  renderError: function (form, field, msg) {
    var fieldElm = form.querySelector('[name="'+field+'"],[data-errorField="'+field+'"]');
    if (! fieldElm) return;

    var msgElm = fieldElm.nextElementSibling;
    if (! (msgElm && Bart.hasClass(msgElm, 'errorMsg'))) {
      msgElm = document.createElement('span');
      Bart.addClass(msgElm, 'errorMsg');
      fieldElm.parentNode.insertBefore(msgElm, fieldElm.nextElementSibling);
    }

    Bart.addClass(fieldElm, 'error');
    msgElm.textContent = msg;
    return fieldElm;
  },

});

Tpl.LabelField.$helpers({
  label: function () {
    return Apputil.capitalize(Apputil.humanize(this.name));
  },
});

helpers('TextInput', {});
helpers('Select', {});

Tpl.Select.$extend({
  $created: function (ctx, elm) {
    var data = ctx.data;
    var value = data.doc[data.name];
    var options = data.options;
    if (options.selectList.length === 0) return;
    if ('_id' in data.options.selectList[0]) {
      var getValue = function (row) {return row._id};
      var getContent = function (row) {return row.name};
    } else {
      var getValue = function (row) {return row[0]};
      var getContent = function (row) {return row[1]};
    }
    if ('includeBlank' in options) {
      var option = document.createElement('option');
      option.value = '';
      option.textContent = '';
      elm.appendChild(option);
    }
    options.selectList.forEach(function (row) {
      var option = document.createElement('option');
      option.value = getValue(row);
      option.textContent = getContent(row);
      if (option.value == value)
        option.setAttribute('selected', 'selected');
      elm.appendChild(option);
    });
  },
});

function helpers(name, funcs) {
  Tpl[name].$helpers(App.reverseExtend(funcs, DEFAULT_HELPERS));
}

function field(doc, name, options) {
  options = options || {};
  if ('selectList' in options) {

    return Tpl.Select.$autoRender({name: name, doc: doc, options: options});
  }

  switch(options.type || 'text') {
  case 'text':
  case 'hidden':
  case 'password':
    return Tpl.TextInput.$autoRender({type: options.type || 'text', name: name, doc: doc, options: options});
  default:
    throw new Error('unknown type: ' + options.type);
  }

}

Bart.registerHelpers({
  elmId: function (prefix) {
    return prefix + '_' + this._id;
  },

  field: function (name, options) {
    return field(this, name, options);
  },

  labelField: function (name, options) {
    return Tpl.LabelField.$autoRender({name: name, value: field(this, name, options)});
  },

  genderList: function () {
    return [['', ''], ["m", "Male"], ["f", "Female"]];
  },
});
