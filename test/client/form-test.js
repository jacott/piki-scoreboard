(function (test, v) {
  buster.testCase('client/form:', {
    setUp: function () {
      test = this;
      v = {};
    },

    tearDown: function () {
      v = null;
    },

    "test saveDoc": function () {
      test.stub(Bart.Form, 'fillDoc');
      test.stub(Bart.Form, 'renderErrors');

      var doc = {
        $save: test.stub().returns(true),
      };
      var form = {a: 'form'};

      assert.isTrue(Bart.Form.saveDoc(doc, form));

      assert.calledWith(Bart.Form.fillDoc, doc, form);
      refute.called(Bart.Form.renderErrors);

      doc.$save = test.stub().returns(false);

      refute(Bart.Form.saveDoc(doc, form));
      assert.calledWith(Bart.Form.renderErrors, doc, form);
    },

    "test fillDoc": function () {
      var form = Bart.html('<form><input name="foo" value="fooVal"><textarea name="bar">bar val</textarea></form>');
      var doc = {};

      Bart.Form.fillDoc(doc, form);

      assert.equals(doc, {foo: 'fooVal', bar: 'bar val'});
    },

    "test clear errors": function () {
      var form = Bart.html('<form><input class="error input" name="foo" value="fooVal"><textarea class="error" name="bar">bar val</textarea></form>');

      Bart.Form.clearErrors(form);
      assert.dom(form, function () {
        assert.dom('input.input:not(.error)');
        assert.dom('textarea:not(.error)');
      });
    },

    "test renderErrors": function () {
      test.stub(Bart.Form, 'clearErrors');
      var form = Bart.html('<form><input name="foo" value="fooVal"><textarea name="bar">bar val</textarea></form>');
      var doc = {
        _errors: {"foo":[["is_required"]],"bar":[["is_invalid"]]}
      };

      Bart.Form.renderErrors(doc, form);

      assert.calledWith(Bart.Form.clearErrors, form);

      assert.dom(form, function () {
        assert.dom('.error[name=foo]+.errorMsg', "can't be blank");
        assert.dom('.error[name=bar]+.errorMsg', "not valid");
      });
    },

    "test labelField": function () {
      var doc = {foo: 'bar'};
      var options = {};

      var labelField = Bart._helpers.labelField.call(doc, 'foo');

      assert.dom(labelField, function () {
        assert.same(this.tagName, 'LABEL');
        assert.dom('span.name', 'Foo');
        assert.dom('input[name=foo]', {value: 'bar'});
      });
    },

    "test TextInput": function () {
      var doc = {foo: 'bar'};
      var options = {};
      var textInput = Bart.Form.TextInput.$autoRender({name: 'foo', doc: doc, options: options});

      assert.dom(textInput, {value: 'bar'}, function () {
        assert.same(this.tagName, 'INPUT');
        assert.same(this.getAttribute('name'), 'foo');
      });
    },
  });
})();
