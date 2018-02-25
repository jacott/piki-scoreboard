define(function (require, exports, module) {
  var test, v;
  const koru     = require('koru');
  const Val      = require('koru/model/validation');
  const Random   = require('koru/random').global;
  const util     = require('koru/util');
  const TH       = require('test-helper');
  const Factory  = require('test/factory');
  const Category = require('./category');
  const Result   = require('./result');

  TH.testCase(module, {
    setUp() {
      test = this;
      v = {};
      v.categories = TH.Factory.createList(3, 'createCategory');
      v.catIds = util.mapField(v.categories);

      v.competitor = TH.Factory.buildCompetitor({category_ids: v.catIds});
      v.competitor.$$save();

      v.rpc = TH.mockRpc();
      test.stub(koru, 'info');

      TH.loginAs(TH.Factory.createUser('su'));

      test.spy(Val, 'ensureString');
      test.spy(Val, 'ensureNumber');
    },

    tearDown() {
      TH.clearDB();
      v = null;
    },

    "test result has competitor"() {
      this.stub(Random, 'fraction').returns(0.54321);
      const comp2 = Factory.buildCompetitor({category_ids: v.catIds});
      comp2.$$save();
      let res = Result.where({competitor_id: comp2._id}).fetchOne();
      assert(res);
      assert.equals(res.event_id, v.competitor.event_id);
      assert.equals(res.scores, [0.54321]);
    },

    "competitor registration": {
      setUp() {
        v.cat1 = TH.Factory.createCategory({_id: 'cat1', type: 'L', heatFormat: 'QQF8'});
        v.cat2 = TH.Factory.createCategory({_id: 'cat2', type: 'B', heatFormat: 'QQF26F8'});
        v.event = TH.Factory.createEvent({heats: undefined});
      },

      "test new category"() {
        var result = TH.Factory.buildResult({category_id: v.cat1._id});
        result.$$save();
        assert.equals(v.event.$reload().heats, {cat1: 'LQQF8'});

        var result = TH.Factory.buildResult({category_id: v.cat2._id});
        result.$$save();
        assert.equals(v.event.$reload().heats, {cat1: 'LQQF8', cat2: 'BQQF26F8'});

      },

      "test no more in category"() {
        const results = [1,2].map(()=>{
          const result = TH.Factory.buildResult({category_id: v.cat1._id});
          result.$$save();
          return result;
        });

        results[0].$remove();
        assert.equals(v.event.$reload().heats, {cat1: 'LQQF8'});

        results[1].$remove();
        assert.equals(v.event.$reload().heats, {});
      },
    },

    "Result.setScore": {
      setUp() {
        v.category = TH.Factory.createCategory({heatFormat: "QQF26F8", type: 'L'});
        v.event = TH.Factory.createEvent({heats: [v.category._id]});
        v.result = TH.Factory.createResult({scores: [1]});
      },

      "test authorized"() {
        v.otherOrg = TH.Factory.createOrg();
        TH.loginAs(v.user = TH.Factory.createUser());

        assert.accessDenied(function () {
          v.rpc("Result.setScore", v.result._id, 1, '23.5+');
        });
      },

      "test can't call setBoulderScore"() {
        assert.accessDenied(function () {
          v.rpc("Result.setBoulderScore", v.result._id, 1, 2, 3, 4);
        });
      },

      "test index out of range"() {
        assert.accessDenied(function () {
          v.rpc("Result.setScore", v.result._id, -1, '23.5+');
        });

        assert.accessDenied(function () {
          v.rpc("Result.setScore", v.result._id, 5, '23.5+');
        });
      },

      "test invalid time"() {
        assert.accessDenied(function () {
          v.rpc("Result.setScore", v.result._id, 99, '2:63');
        });
      },

      "test update time"() {
        v.rpc("Result.setScore", v.result._id, 99, '2:23');

        assert.calledWith(Val.ensureNumber, 99);
        assert.calledWith(Val.ensureString, v.result._id, '2:23');

        assert.equals(v.result.$reload().time, (2*60+23));
      },

      "test updates"() {
        v.rpc("Result.setScore", v.result._id, 1, '23.5+');

        assert.calledWith(Val.ensureNumber, 1);
        assert.calledWith(Val.ensureString, v.result._id, '23.5+');

        assert.equals(v.result.$reload().scores, [1, 235005]);
      },

      "test delete middle score"() {
        v.result.$update({scores: [1, 220000, 440000]});

        v.rpc("Result.setScore", v.result._id, 1, '  ');

        assert.equals(v.result.$reload(true).scores, [1, undefined, 440000]);
      },

      "test delete last score"() {
        v.result.$update({scores: [1, 220000, 440000]});

        v.rpc("Result.setScore", v.result._id, 2, '');

        assert.equals(v.result.$reload().scores, [1, 220000, undefined]);
      },
    },

    "Result.setBoulderScore": {
      setUp() {
        v.category = TH.Factory.createCategory({heatFormat: "Q:3F8:2", type: 'B'});
        v.event = TH.Factory.createEvent({heats: [v.category._id]});
        v.result = TH.Factory.createResult({scores: [1]});
      },

      "test authorized"() {
        v.otherOrg = TH.Factory.createOrg();
        TH.loginAs(v.user = TH.Factory.createUser());

        assert.accessDenied(function () {
          v.rpc("Result.setBoulderScore", v.result._id, 1, 1, 3, 7);
        });
      },

      "test can't call setScore"() {
        assert.accessDenied(function () {
          v.rpc("Result.setScore", v.result._id, 1, '23.5+');
        });
      },

      "test index out of range"() {
        assert.accessDenied(function () {
          v.rpc("Result.setBoulderScore", v.result._id, -1, 1, 2, 3);
        });

        assert.accessDenied(function () {
          v.rpc("Result.setBoulderScore", v.result._id, 1, 4, 4, 5);
        });
      },

      "test bonus > top"() {
        assert.exception(()=>{
          v.rpc("Result.setBoulderScore", v.result._id, 1, 1, 4, 3);
        }, {error: 400});
      },

      "test top,  bonus range"() {
        // top > 0, bonus 0
        v.rpc("Result.setBoulderScore", v.result._id, 1, 1, 0, 3);
        assert.equals(v.result.$reload().scores, [1, 1019696]);
      },

      "test dnc"() {
        v.rpc("Result.setBoulderScore", v.result._id, 1, 2, "dnc");

        assert.calledWith(Val.ensureNumber, 1, 2);
        assert.calledWith(Val.ensureString, v.result._id);

        assert.equals(v.result.$reload().scores, [1, -1]);
        assert.equals(v.result.problems[0][1], -1);

        v.rpc("Result.setBoulderScore", v.result._id, 1, 1, 0, 0);

        assert.equals(v.result.$reload().scores, [1, 9999]);
        assert.equals(v.result.problems[0], [0, -1]);
      },

      "test clear middle"() {
        v.result.$update({scores: [1, 2, 3, 4], problems: [[2,1],[4],[7,8]]});
        v.rpc("Result.setBoulderScore", v.result._id, 2, 1);
        assert.equals(v.result.$reload(true).scores, [1, 2, , 4]);
        assert.equals(v.result.problems, [[2, 1], [null], [7, 8]]);
      },

      "test clear"() {
        v.rpc("Result.setBoulderScore", v.result._id, 1, 2);

        assert.calledWith(Val.ensureNumber, 1, 2);
        assert.calledWith(Val.ensureString, v.result._id);

        assert.equals(v.result.$reload().scores, [1]);
        assert.equals(v.result.problems[0], [,null]);

        v.rpc("Result.setBoulderScore", v.result._id, 1, 1);

        assert.equals(v.result.$reload().scores, [1]);
        assert.equals(v.result.problems[0], [null, null]);
      },

      "test update attempts"() {
        v.rpc("Result.setBoulderScore", v.result._id, 1, 2, 3, 4);

        assert.calledWith(Val.ensureNumber, 1, 2, 3, 4);
        assert.calledWith(Val.ensureString, v.result._id);

        assert.equals(v.result.$reload().scores, [1, 1019596]);
        assert.equals(v.result.problems[0][1], 403);

        v.rpc("Result.setBoulderScore", v.result._id, 1, 1, 1, 1);
        assert.equals(v.result.$reload().scores, [1, 2029495]);
        assert.equals(v.result.problems[0], [101, 403]);

        v.rpc("Result.setBoulderScore", v.result._id, 1, 2, 5, 0);
        assert.equals(v.result.$reload().scores, [1, 1029893]);
        assert.equals(v.result.problems[0], [101, 5]);
      },

      "test other ruleVersion, update attempts"() {
        v.event.ruleVersion = 0;
        v.rpc("Result.setBoulderScore", v.result._id, 1, 2, 3, 4);

        assert.calledWith(Val.ensureNumber, 1, 2, 3, 4);
        assert.calledWith(Val.ensureString, v.result._id);

        assert.equals(v.result.$reload().scores, [1, 1950196]);
        assert.equals(v.result.problems[0][1], 403);

        v.rpc("Result.setBoulderScore", v.result._id, 1, 1, 1, 1);
        assert.equals(v.result.$reload().scores, [1, 2940295]);
        assert.equals(v.result.problems[0], [101, 403]);

        v.rpc("Result.setBoulderScore", v.result._id, 1, 2, 5, 0);
        assert.equals(v.result.$reload().scores, [1, 1980293]);
        assert.equals(v.result.problems[0], [101, 5]);
      },
    },

    "test displayTimeTaken"() {
      var result = TH.Factory.buildResult();

      assert.same(result.displayTimeTaken(), "");

      result.time = 5*60 + 59;
      assert.same(result.displayTimeTaken(), "5:59");

      result.time = 69;
      assert.same(result.displayTimeTaken(), "1:09");

    },

    "test unscoredHeat"() {
      var category = TH.Factory.createCategory({heatFormat: "QQF26F8"});
      var event = TH.Factory.createEvent({heats: [category._id]});
      var result = TH.Factory.createResult();

      assert.same(result.unscoredHeat(), 1);

      result.scores.push(123);
      result.scores.push(223);
      assert.same(result.unscoredHeat(), 3);
    },

    "test associated"() {
      var result = TH.Factory.createResult();

      assert(result.climber);
      assert(result.category);
      assert(result.event);
    },

    "test created when competitor registered"() {
      var cat1Comp = TH.Factory.buildCompetitor({category_ids: v.catIds});
      cat1Comp.$$save();
      assert(v.r2 = Result.query.where({category_id: v.categories[0]._id}).fetchOne());
      v.results = Result.query.where({category_id: v.categories[1]._id}).fetch();
      assert.same(v.results.length, 2);
      v.result = v.results[0];

      assert.same(v.result.event_id, v.competitor.event_id);
      assert.same(v.result.climber_id, v.competitor.climber_id);
      assert.between(v.result.scores[0], 0, 1);
      refute.same(v.r2.scores[0], v.result.scores[0]);
    },

    "test deleted when competitor cat removed"() {
      v.competitor.category_ids = v.catIds.slice(1);
      v.competitor.$$save();

      assert.same(Result.query.where('category_id', v.categories[0]._id).count(), 0);
      assert.same(Result.query.where('category_id', v.categories[1]._id).count(), 1);
      assert.same(Result.query.where('category_id', v.categories[2]._id).count(), 1);
    },

    "test all deleted when competitor deregistered"() {
      var climber = TH.Factory.createClimber();
      var comp2 = TH.Factory.buildCompetitor({event_id: v.competitor.event_id, category_id: v.competitor.category_id});
      comp2.$$save();


      v.competitor.$remove();

      assert.same(Result.query.count(), 1);
    },

  });
});
