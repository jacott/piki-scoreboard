isClient && define((require, exports, module)=>{
  const Route           = require('koru/ui/route');
  const Category        = require('models/category');
  const App             = require('ui/app');
  const TH              = require('./test-helper');

  const sut = require('./category');

  TH.testCase(module, ({beforeEach, afterEach, group, test})=>{
    let org;
    beforeEach(()=>{
      org =  TH.Factory.createOrg();
      TH.login();
      TH.setOrg(org);
      App.setAccess();
    });

    afterEach(()=>{
      TH.tearDown();
    });

    test("rendering", ()=>{
      const categories = TH.Factory.createList(2, 'createCategory');

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
    });

    test("adding new category", ()=>{
      Route.gotoPage(sut.Index);

      assert.dom('#Category', ()=>{
        TH.click('[name=addCategory]');
        assert.dom('#AddCategory', ()=>{
          TH.input('[name=name]', 'Dynomites Wellington');
          TH.input('[name=shortName]', 'YB M');
          TH.selectMenu('[name=type]', 'L');
          TH.input('[name=heatFormat]', 'QQF26F8');
          TH.input('[name=group]', 'A');
          TH.selectMenu('[name=gender]', 'm');
          TH.input('[name=minAge]', '14');
          TH.change('[name=maxAge]', '15');
          TH.click('[type=submit]');
        });
        refute.dom('#AddCategory');
      });

      assert(Category.exists({
        org_id: org._id, name: 'Dynomites Wellington', shortName: 'YB M',
        gender: 'm', group: 'A', minAge: 14, maxAge: 15, heatFormat: 'QQF26F8'}));

      assert.dom('#Category [name=addCategory]');
    });

    test("adding speed", ()=>{
      Route.gotoPage(sut.Index);

      assert.dom('#Category', ()=>{
        TH.click('[name=addCategory]');
        assert.dom('#AddCategory', ()=>{
          TH.input('[name=name]', 'Dynomites Wellington');
          TH.input('[name=shortName]', 'YB M');
          TH.selectMenu('[name=type]', 'S');
          TH.input('[name=heatFormat]', 'QQF26F8');
          TH.input('[name=group]', 'A');
          TH.selectMenu('[name=gender]', 'm');
          TH.input('[name=minAge]', '14');
          TH.change('[name=maxAge]', '15');
          TH.click('[type=submit]');
          assert.same(Category.query.count(), 0);
          assert.dom('error', 'must be blank');
          TH.input('[name=heatFormat]', '');
          TH.click('[type=submit]');
        });
      });

      assert(Category.exists({type: 'S', heatFormat: null}));
    });

    group("edit", ()=>{
      let category, category2;
      beforeEach(()=>{
        category = TH.Factory.createCategory();
        category2 = TH.Factory.createCategory();

        Route.gotoPage(sut.Index);

        TH.click('td', category.name);
      });

      test("change heat format", ()=>{
        assert.dom('#EditCategory', function () {
          TH.input('[name=heatFormat]', 'QQF2');
        });
        TH.click('#EditCategory [type=submit]');

        assert.same(category.$reload().heatFormat, 'QQF2');
      });

      test("change name", ()=>{
        assert.dom('#EditCategory', function () {
          assert.dom('h1', 'Edit ' + category.name);
          TH.input('[name=name]', {value: category.name}, 'new name');
          TH.click('[type=submit]');
        });

        assert.dom('#Category td', 'new name');
      });

      test("delete", ()=>{
        assert.dom('#EditCategory', function () {
          TH.click('[name=delete]');
        });

        assert.dom('.Dialog.Confirm', function () {
          assert.dom('h1', 'Delete ' + category.name + '?');
          TH.click('[name=cancel]');
        });

        refute.dom('.Dialog');

        assert(Category.exists(category._id));

        TH.click('#EditCategory [name=delete]');

        assert.dom('.Dialog', function () {
          TH.click('[name=okay]', 'Delete');
        });

        refute.dom('#EditCategory');

        refute(Category.exists(category._id));
      });
    });


  });
});
