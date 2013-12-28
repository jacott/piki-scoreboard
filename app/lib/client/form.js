var Tpl = Bart.Form;

var DEFAULT_HELPERS = {
  value: function () {
    return this.doc[this.name];
  },
};

App.extend(Tpl, {
  saveDoc: function (doc, form) {
    this.fillDoc(doc, form);
    if (doc.$save()) {
      return true;
    }

    this.renderErrors(doc, form);
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
    this.clearErrors(form);

    if (errors) {
      for(var field in errors) {
        var msg = AppVal.Error.msgFor(doc, field);
        if (msg) {
          var fieldElm = this.renderError(form, field, msg);
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

Bart.registerHelpers({
  labelField: function (name, options) {
    return Tpl.LabelField.$autoRender({name: name, value: field(this, name, options)});
  },
});

function helpers(name, funcs) {
  Tpl[name].$helpers(App.reverseExtend(funcs, DEFAULT_HELPERS));
}

function field(doc, name, options) {
  switch(options ? options.type : 'text') {
  case 'text':
    return Tpl.TextInput.$autoRender({name: name, doc: doc, options: options});
  default:
    throw new Error('unknown type: ' + options.type);
  }

}
