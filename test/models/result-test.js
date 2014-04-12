(function (test, v) {
  buster.testCase('models/result:', {
    setUp: function () {
      test = this;
      v = {};
      v.categories = TH.Factory.createList(3, 'createCategory');
      v.catIds = Apputil.mapField(v.categories);

      v.competitor = TH.Factory.buildCompetitor({category_ids: v.catIds});
      v.competitor.$$save();
    },

    tearDown: function () {
      v = null;
    },

    "Result.setScore": {
      setUp: function () {
        v.category = TH.Factory.createCategory({heatFormat: "QQF26F8", type: 'L'});
        v.event = TH.Factory.createEvent({heats: [v.category._id]});
        v.result = TH.Factory.createResult({scores: [1]});
      },

      "test authorized": function () {
        if (Meteor.isClient) return assert(true);

        v.otherOrg = TH.Factory.createOrg();
        TH.loginAs(v.user = TH.Factory.createUser());

        assert.accessDenied(function () {
          TH.call("Result.setScore", v.result._id, 1, '23.5+');
        });
      },

      "test can't call setBoulderScore": function () {
        if (Meteor.isClient) return assert(true);

        assert.accessDenied(function () {
          TH.call("Result.setBoulderScore", v.result._id, 1, 2, 3, 4);
        });
      },

      "test index out of range": function () {
        if (Meteor.isClient) return assert(true);

        assert.accessDenied(function () {
          TH.call("Result.setScore", v.result._id, -1, '23.5+');
        });

        assert.accessDenied(function () {
          TH.call("Result.setScore", v.result._id, 5, '23.5+');
        });
      },

      "test invalid time": function () {
        if (Meteor.isClient) return assert(true);

        assert.accessDenied(function () {
          TH.call("Result.setScore", v.result._id, 99, '2:63');
        });
      },

      "test update time": function () {
        test.spy(Meteor.isServer ? global : window, 'check');

        TH.call("Result.setScore", v.result._id, 99, '2:23');

        assert.calledWith(check, 99, Number);
        assert.calledWith(check, [v.result._id, '2:23'], [String]);

        assert.equals(v.result.$reload().time, (2*60+23));
      },

      "test updates": function () {
        test.spy(Meteor.isServer ? global : window, 'check');

        TH.call("Result.setScore", v.result._id, 1, '23.5+');

        assert.calledWith(check, 1, Number);
        assert.calledWith(check, [v.result._id, '23.5+'], [String]);

        assert.equals(v.result.$reload().scores, [1, 235005]);
      },
    },

    "Result.setBoulderScore": {
      setUp: function () {
        v.category = TH.Factory.createCategory({heatFormat: "Q:3F8:2", type: 'B'});
        v.event = TH.Factory.createEvent({heats: [v.category._id]});
        v.result = TH.Factory.createResult({scores: [1]});
      },

      "test authorized": function () {
        if (Meteor.isClient) return assert(true);

        v.otherOrg = TH.Factory.createOrg();
        TH.loginAs(v.user = TH.Factory.createUser());

        assert.accessDenied(function () {
          TH.call("Result.setBoulderScore", v.result._id, 1, 1, 3, 7);
        });
      },

      "test can't call setScore": function () {
        if (Meteor.isClient) return assert(true);

        assert.accessDenied(function () {
          TH.call("Result.setScore", v.result._id, 1, '23.5+');
        });
      },

      "test index out of range": function () {
        if (Meteor.isClient) return assert(true);

        assert.accessDenied(function () {
          TH.call("Result.setBoulderScore", v.result._id, -1, 1, 2, 3);
        });

        assert.accessDenied(function () {
          TH.call("Result.setBoulderScore", v.result._id, 1, 4, 4, 5);
        });
      },

      "test top,  bonus range": function () {
        if (Meteor.isClient) return assert(true);

        // top < bonus
        TH.call("Result.setBoulderScore", v.result._id, 1, 1, 4, 3);
        assert.equals(v.result.$reload().scores, [1, 1950195]);

        // top > 0, bonus 0
        TH.call("Result.setBoulderScore", v.result._id, 1, 1, 0, 3);
        assert.equals(v.result.$reload().scores, [1, 1960196]);
      },

      "test updates": function () {
        test.spy(Meteor.isServer ? global : window, 'check');

        TH.call("Result.setBoulderScore", v.result._id, 1, 2, 3, 4);

        assert.calledWith(check, [1, 2, 3, 4], [Number]);
        assert.calledWith(check, v.result._id, String);

        assert.equals(v.result.$reload().scores, [1, 1950196]);
        assert.equals(v.result.problems[0][1], 403);

        TH.call("Result.setBoulderScore", v.result._id, 1, 1, 1, 1);
        assert.equals(v.result.$reload().scores, [1, 2940295]);
        assert.equals(v.result.problems[0], [101, 403]);

        TH.call("Result.setBoulderScore", v.result._id, 1, 2, 5, 0);
        assert.equals(v.result.$reload().scores, [1, 1980293]);
        assert.equals(v.result.problems[0], [101, 5]);
      },
    },

    "test displayTimeTaken": function () {
      var result = TH.Factory.buildResult();

      assert.same(result.displayTimeTaken(), "");

      result.time = 5*60 + 59;
      assert.same(result.displayTimeTaken(), "5:59");

      result.time = 69;
      assert.same(result.displayTimeTaken(), "1:09");

    },

    "test unscoredHeat": function () {
      var category = TH.Factory.createCategory({heatFormat: "QQF26F8"});
      var event = TH.Factory.createEvent({heats: [category._id]});
      var result = TH.Factory.createResult();

      assert.same(result.unscoredHeat(), 1);

      result.scores.push(123);
      result.scores.push(223);
      assert.same(result.unscoredHeat(), 3);
    },

    "test associated": function () {
      var result = TH.Factory.createResult();

      assert(result.climber);
      assert(result.category);
      assert(result.event);
    },

    "test created when competitor registered": function () {
      var cat1Comp = TH.Factory.buildCompetitor({category_ids: v.catIds});
      cat1Comp.$$save();
      assert(v.r2 = AppModel.Result.findOne({category_id: v.categories[0]._id}));
      v.results = AppModel.Result.find({category_id: v.categories[1]._id}).fetch();
      assert.same(v.results.length, 2);
      v.result = v.results[0];

      assert.same(v.result.event_id, v.competitor.event_id);
      assert.same(v.result.climber_id, v.competitor.climber_id);
      if (Meteor.isClient)
        assert.same(v.result.scores[0], 0);
      else {
        assert.between(v.result.scores[0], 0, 1);
        refute.same(v.r2.scores[0], v.result.scores[0]);
      }
    },

    "test deleted when competitor cat removed": function () {
      v.competitor.category_ids = v.catIds.slice(1);
      v.competitor.$$save();

      assert.same(AppModel.Result.find({category_id: v.categories[0]._id}).count(), 0);
      assert.same(AppModel.Result.find({category_id: v.categories[1]._id}).count(), 1);
      assert.same(AppModel.Result.find({category_id: v.categories[2]._id}).count(), 1);
    },

    "test all deleted when competitor deregistered": function () {
      var climber = TH.Factory.createClimber();
      var comp2 = TH.Factory.buildCompetitor({event_id: v.competitor.event_id, category_id: v.competitor.category_id});
      comp2.$$save();


      v.competitor.$remove();

      assert.same(AppModel.Result.find().count(), 1);
    },
  });
})();
