(function (test, v) {
  buster.testCase('client/category:', {
    setUp: function () {
      test = this;
      v = {
        org: TH.Factory.createOrg(),
      };
      TH.setOrg(v.org);
    },

    tearDown: function () {
      v = null;
    },

    "test rendering": function () {
      var categories = TH.Factory.createList(2, 'createCategory');

      AppRoute.gotoPage(Bart.Category.Index);

      assert.dom('#Category', function () {
        assert.dom('.categories', function () {
          assert.dom('h1', 'Categorys');
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
      AppRoute.gotoPage(Bart.Category.Index);

      assert.dom('#Category', function () {
        TH.click('[name=addCategory]');
        assert.dom('#AddCategory', function () {
          TH.input('[name=name]', 'Dynomites Wellington');
          TH.input('[name=shortName]', 'YB M');
          assert.dom('.heats', function () {
            assert.dom('[name=heatName]', {count: 1}, function () {
              v.r1Id = this.id;
            });
            TH.input('[name=heatName]', 'round 1');
            TH.click('[name=addAnother]');
            assert.dom('[name=heatName]', {count: 2});
            TH.input('[name=heatName]:last-child', 'round 2');
          });
          TH.input('[name=group]', 'A');
          TH.change('[name=gender]', 'm');
          TH.input('[name=minAge]', '14');
          TH.change('[name=maxAge]', '15');
          TH.click('[type=submit]');
        });
        refute.dom('#AddCategory');
      });

      var cat = AppModel.Category.findOne({org_id: v.org._id, name: 'Dynomites Wellington', shortName: 'YB M', gender: 'm', group: 'A', minAge: 14, maxAge: 15});

      assert(cat);

      assert.same(cat.heats.length, 2);

      assert.same(cat.heats[0].id, v.r1Id);
      assert.same(cat.heats[0].name, 'round 1');
      assert.same(cat.heats[1].name, 'round 2');

      refute.same(cat.heats[0].id, cat.heats[1].id);

      assert.dom('#Category [name=addCategory]');
    },

    "edit": {
      setUp: function () {
        v.category = TH.Factory.createCategory({heats: [
          {id: '1', name: 'r 1'},
          {id: '2', name: 'r 2'},
        ]});
        v.category2 = TH.Factory.createCategory();

        AppRoute.gotoPage(Bart.Category.Index);

        TH.click('td', v.category.name);
      },

      "test change heats": function () {
        assert.dom('#EditCategory .heats', function () {
          assert.dom('[name=heatName]', {value: 'r 1'}, function () {
            assert.same(this.id, '1');
          });
          assert.dom('[name=heatName]', {value: 'r 2'}, function () {
            assert.same(this.id, '2');
            TH.input(this, 'round 2');
          });
        });
        TH.click('#EditCategory [type=submit]');

        var r2 = v.category.$reload().heats[1];
        assert.same(r2.id, '2');
        assert.same(r2.name, 'round 2');
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
