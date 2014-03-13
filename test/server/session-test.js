(function (test, v) {
  buster.testCase('server/session:', {
    setUp: function () {
      test = this;

      TH.stubOplog();
      v = {
        org: TH.Factory.createOrg(),
        user: TH.Factory.createUser({_id: 'uid1'}),
        sub: TH.subStub('uid1'),
        pub: TH.getPublish('Session'),
        userSpy: test.spy(AppModel.User, 'observeId'),
      };
    },

    tearDown: function () {
      AppOplog.stopAllObservers();
      v = null;
    },

    "buildUpdater": {
      setUp: function () {
        v.sess = {
          added: test.stub(),
          changed: test.stub(),
          removed: test.stub(),
          buildUpdater: Session.prototype.buildUpdater,
        };
      },

      "test passes to sess": function () {
        var updater = v.sess.buildUpdater('Foo', {foo: 'bar'});


        assert.same(updater.foo, 'bar');

        updater.added('123', {stuff: 'data'});
        assert.calledWith(v.sess.added, 'Foo', '123', {stuff: 'data'});

        updater.changed('2123', {stuff: 'change'});
        assert.calledWith(v.sess.changed, 'Foo', '2123', {stuff: 'change'});

        updater.removed('453');
         assert.calledWith(v.sess.removed, 'Foo', '453');
      },

      "test filter options": function () {
        var updater = v.sess.buildUpdater('Foo', {fields: v.fields = ['moe', 'joe']});


        assert.same(updater.fields, v.fields);

        updater.added('123', {junk: 'junk'});
        assert.calledWith(v.sess.added, 'Foo', '123', {junk: 'junk'}, v.fields);

        updater.changed('2123', {stuff: 'change'});
        assert.calledWith(v.sess.changed, 'Foo', '2123', {stuff: 'change'}, v.fields);
      },
    },

    "test guest user": function () {
      v.sub.userId = null;

      v.pub.call(v.sub);
      var guestUser = AppModel.User.guestUser();
      assert.called(v.sub.sendSpy, {msg: 'added', collection: 'User', id: guestUser._id, fields: guestUser.attributes});
    },

    "test added": function () {
      v.pub.call(v.sub);

      var sess = Session._private.get(v.sub);

      sess.added('User', '123', {_id: '123', name: 'foo'});

      assert.calledWith(sess.conn.send, {msg: 'added', collection: 'User', id: '123', fields: {_id: '123', name: 'foo'}});

      sess.added('User', '123', v.attrs = {_id: '123', name: 'fox'});

      // should not send attribute _id if calling sendChanged
      assert.calledWith(sess.conn.send,{msg: 'changed', collection: 'User', id: '123', fields: {name: 'fox'}});
      assert.equals(v.attrs, {_id: '123', name: 'fox'});


      // test filtering
      sess.added('User', 'a999',
                 {_id: 'a999', name: 'foo', misc: 123, foo: 'bar',},
                 ['misc', 'foo']);
      assert.calledWith(sess.conn.send, {msg: 'added', collection: 'User', id: 'a999', fields: {misc: 123, foo: 'bar',}});

      // test filtering
      sess.added('User', 'a999',
                 v.attrs = {_id: 'a999', name: 'foo', misc: 343},
                 ['misc', 'foo']);
      assert.calledWith(sess.conn.send,{msg: 'changed', collection: 'User', id: 'a999', fields: {misc: 343}});

      assert.equals(v.attrs, {_id: 'a999', name: 'foo', misc: 343});
    },

    "test changed": function () {
      TH.Factory.createUser({_id: '123', username: 'x', org_id: '123'});
      v.pub.call(v.sub);

      var sess = Session._private.get(v.sub);

      sess.changed('User', '123', {_id: '123', name: 'foo'});

      assert.calledWith(sess.conn.send,{msg: 'added', collection: 'User', id: '123', fields: {
        _id: '123', email: "email-x@test.co", initials: "u", name: "fn x",
        username: 'x', org_id: '123', role: 'a',
      }});

      sess.changed('User', '123', v.attrs = {name: 'fox'});

      // should not send attribute _id if calling sendChanged
      assert.calledWith(sess.conn.send,{msg: 'changed', collection: 'User', id: '123', fields: {name: 'fox'}});
      assert.equals(v.attrs, {name: 'fox'});


      // test filtering
      sess.changed('User', '123',
                 v.attrs = {_id: '123', name: 'foo', misc: 343},
                 ['misc', 'foo']);
      assert.calledWith(sess.conn.send,{msg: 'changed', collection: 'User', id: '123', fields: {misc: 343}});

      assert.equals(v.attrs, {_id: '123', name: 'foo', misc: 343});
    },

    "test init and stop": function () {
      assert.same(v.pub.call(v.sub), undefined);

      assert.called(v.sub.ready);

      var sess = Session._private.get(v.sub);

      assert.calledOnceWith(v.userSpy, v.user._id);
      assert.calledWith(v.sub.sendSpy, {msg: 'added', collection: 'User', id: v.user._id, fields: v.user.attributes});
      assert.attributesEqual(sess.user, v.user);

      assert.same(sess.user.attributes, AppModel.User.memFind('uid1'));

      v.sub.stopFunc();
      assert.equals(AppOplog.observers(),{});

      refute(AppModel.User.memFind('uid1'));
    },

    "with Session": {
      setUp: function () {
        v.pub.call(v.sub);

        v.sess = Session._private.get(v.sub);
      },

      "test memFind": function () {
        assert.same(v.sess.userId, v.user._id);
        assert.equals(AppModel.Org.memFind(v.org._id), v.org.attributes);
      },
    },
  });
})();
