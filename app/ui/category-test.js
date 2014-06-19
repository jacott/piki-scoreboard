isClient && define(function (require, exports, module) {
  var test, v;
  var TH = require('./test-helper');
  var sut = require('./category');
  var Route = require('koru/ui/route');
  var Category = require('models/category');
  var App = require('ui/app');

  TH.testCase(module, {
    setUp: function () {
      test = this;
      v = {};
      v.org =  TH.Factory.createOrg();
      TH.login();
      TH.setOrg(v.org);
      App.setAccess();
    },

    tearDown: function () {
      TH.tearDown();
      v = null;
    },

    "test rendering": function () {
      var categories = TH.Factory.createList(2, 'createCategory');

      Route.gotoPage(sut.Index);

      assert.dom('#Category', function () {
        assert.dom('.categories', function () {
          assert.dom('h1', 'Competitor categories');
          assert.dom('h1+table', function () {
            assert.dom('tr>td', categories[0].name, function () {
              assert.domParent('td', categories[0].shortName);
            });
            assert.dom('tr>td', categories[1].name, function () {
              assert.domParent('td', categories[1].shortName);
            });
          });
        });
        assert.dom('nav [name=addCategory]', 'Add new category');
      });
    },

    "test adding new category": function () {
      Route.gotoPage(sut.Index);

      assert.dom('#Category', function () {
        TH.click('[name=addCategory]');
        assert.dom('#AddCategory', function () {
          TH.input('[name=name]', 'Dynomites Wellington');
          TH.input('[name=shortName]', 'YB M');
          TH.change('[name=type]', 'L');
          TH.input('[name=heatFormat]', 'QQF26F8');
          TH.input('[name=group]', 'A');
          TH.change('[name=gender]', 'm');
          TH.input('[name=minAge]', '14');
          TH.change('[name=maxAge]', '15');
          TH.click('[type=submit]');
        });
        refute.dom('#AddCategory');
      });

      var cat = Category.query.where({org_id: v.org._id, name: 'Dynomites Wellington', shortName: 'YB M', gender: 'm', group: 'A', minAge: 14, maxAge: 15, heatFormat: 'QQF26F8'}).fetchOne();

      assert(cat);

      assert.dom('#Category [name=addCategory]');
    },

    "edit": {
      setUp: function () {
        v.category = TH.Factory.createCategory();
        v.category2 = TH.Factory.createCategory();

        Route.gotoPage(sut.Index);

        TH.click('td', v.category.name);
      },

      "test change heat format": function () {
        assert.dom('#EditCategory', function () {
          TH.input('[name=heatFormat]', 'QQF2');
        });
        TH.click('#EditCategory [type=submit]');

        assert.same(v.category.$reload().heatFormat, 'QQF2');
      },

      "test change name": function () {
        assert.dom('#EditCategory', function () {
          assert.dom('h1', 'Edit ' + v.category.name);
          TH.input('[name=name]', {value: v.category.name}, 'new name');
          TH.click('[type=submit]');
        });

        assert.dom('#Category td', 'new name');
      },

      "test delete": function () {
        assert.dom('#EditCategory', function () {
          TH.click('[name=delete]');
        });

        assert.dom('.Dialog.Confirm', function () {
          assert.dom('h1', 'Delete ' + v.category.name + '?');
          TH.click('[name=cancel]');
        });

        refute.dom('.Dialog');

        assert(Category.exists(v.category._id));

        TH.click('#EditCategory [name=delete]');

        assert.dom('.Dialog', function () {
          TH.click('[name=okay]', 'Delete');
        });

        refute.dom('#EditCategory');

        refute(Category.exists(v.category._id));
      },
    },


  });
});