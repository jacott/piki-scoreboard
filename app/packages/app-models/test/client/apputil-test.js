(function (test) {
  (typeof d3 !== 'undefined') && buster.testCase('packages/app-models/test/client/apputil:', {
    setUp: function () {
      test = this;
    },

    "test colorOnLight": function () {
      assert.same(Apputil.colorOnLight('#807060'), '#807060');
      assert.same(Apputil.colorOnLight('#a090f0'), '#9384e2');
    },

    "test colorClass": function () {
      assert.same(Apputil.colorClass('#000000'), 'very dark');
      assert.same(Apputil.colorClass('#444444'), 'dark');
      assert.same(Apputil.colorClass('#888888'), 'light');
      assert.same(Apputil.colorClass('#aaaaaa'), 'light');
      assert.same(Apputil.colorClass('#ffffff'), 'very light');
    },


    "test contrastColor": function () {
      assert.same(Apputil.contrastColor('#000000',null,'#010101'), '#010101');
      assert.same(Apputil.contrastColor('#000000', '#123456'), '#bcd6ff');
      assert.same(Apputil.contrastColor('#000000'), '#d4d4d4');
      assert.same(Apputil.contrastColor('#444444', '#555555', '#123456'), '#e4feff');
      assert.same(Apputil.contrastColor('#444444'), '#fcfcfc');
      assert.same(Apputil.contrastColor('#888888'), '#040404');
      assert.same(Apputil.contrastColor('#aaaaaa'), '#040404');
      assert.same(Apputil.contrastColor('#ffffff'), '#303030');
      assert.same(Apputil.contrastColor('#ffffff', '#123456'), '#123456');
      assert.same(Apputil.contrastColor('#aaaaaa', '#123456'), '#000629');
    },

  });
})();
