var $ = Bart.current;
var Tpl = Bart.Climber;
var Index = Tpl.Index;

App.require('AppModel.User', function () {
  var climberRole = AppModel.User.ROLE.climber;

  var elm;

  Tpl.$extend({
    onBaseEntry: function () {
      document.body.appendChild(Tpl.$autoRender({}));
    },

    onBaseExit: function () {
      Bart.removeId('Climber');
    },
  });

  Index.$helpers({
    climbers: function () {
      var row = Index.Row;
      var elm = document.createElement('tbody');
      AppModel.User.find({org_id: App.orgId, role: {$regex: climberRole}}, {sort: {name: 1}}).forEach(function (doc) {
        elm.appendChild(row.$render(doc));
      });
      return elm;
    },
  });

  Index.$events({
    'click .climbers tr': function (event) {
      event.$actioned = true;

      var data = $.data(this);
      AppRoute.gotoPage(Tpl.Edit, {append: data._id});
    },
  });

  Index.$extend({
    $created: function (ctx, elm) {
      Bart.updateOnCallback(ctx, function (callback) {
        return AppModel.User.Index.observe(function (doc, old) {
          var role = (doc || old).role;
          if (role.indexOf(climberRole) >= 0)
            callback();
        });
      });
    },
  });

  Tpl.Form.$helpers({
    clubList: function () {
      return AppModel.Club.find({}, {sort: {name: 1}}).map(function (doc) {
        return [doc._id, doc.name];
      });
    },
  });

  var base = AppRoute.root.addBase(Tpl);
  base.addTemplate(Index, {defaultPage: true});
  base.addTemplate(Tpl.Add, {
    focus: true,
    data: function () {
      return new AppModel.User({org_id: App.orgId, role: climberRole});
    }
  });

  base.addTemplate(Tpl.Edit, {
    focus: true,
    data: function (page, location) {
      var m = /([^/]*)$/.exec(location.pathname);
      var doc = AppModel.User.findOne({_id: m[1],  role: {$regex: climberRole}});

      if (!doc) AppRoute.abortPage(Tpl);

      return doc;
    }
  });

});
