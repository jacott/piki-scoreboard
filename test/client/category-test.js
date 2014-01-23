(function (test, v) {
  buster.testCase('client/category:', {
    setUp: function () {
      test = this;
      v = {
        org: TH.Factory.createOrg(),
      };
      App.Ready.isReady = true;
      test.stub(App, 'subscribe').yields();
    },

    tearDown: function () {
      v = null;
    },

    "test rendering": function () {
      var categorys = TH.Factory.createList(2, 'createCategory');

      AppRoute.gotoPage(Bart.Category.Index, {orgSN: v.org.shortName});

      assert.dom('#Category', function () {
        assert.dom('.categorys', function () {
          assert.dom('h1', 'Categorys');
          assert.dom('h1+table', function () {
            assert.dom('tr>td', categorys[0].name, function () {
              assert.domParent('td', categorys[0].shortName);
            });
            assert.dom('tr>td', categorys[1].name, function () {
              assert.domParent('td', categorys[1].shortName);
            });
          });
        });
        assert.dom('nav [name=addCategory]', 'Add new category');
      });
    },

    "test adding new category": function () {
      AppRoute.gotoPage(Bart.Category.Index, {orgSN: v.org.shortName});

      assert.dom('#Category', function () {
        TH.click('[name=addCategory]');
        assert.dom('#AddCategory', function () {
          TH.input('[name=name]', 'Dynomites Wellington');
          TH.input('[name=shortName]', 'Wgtn');
          TH.input('[name=group]', 'A');
          TH.click('[type=submit]');
        });
        refute.dom('#AddCategory');
      });

      assert(AppModel.Category.exists({org_id: v.org._id, name: 'Dynomites Wellington', shortName: 'WGTN'}));

      assert.dom('#Category [name=addCategory]');
    },

    "edit": {
      setUp: function () {
        v.category = TH.Factory.createCategory();
        v.category2 = TH.Factory.createCategory();

        AppRoute.gotoPage(Bart.Category.Index, {orgSN: v.org.shortName});

        TH.click('td', v.category.name);
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
          TH.click('[name=cancel');
        });

        refute.dom('.Dialog');

        assert(AppModel.Category.exists(v.category._id));

        TH.click('#EditCategory [name=delete]');

        assert.dom('.Dialog', function () {
          TH.click('[name=okay]', 'Delete');
        });

        refute.dom('#EditCategory');

        refute(AppModel.Category.exists(v.category._id));
      },
    },
  });
})();
