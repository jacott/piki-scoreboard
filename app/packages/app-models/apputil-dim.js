var dimMap = {
  x: ['position', 'left'],
  y: ['position', 'top'],
  w: ['size', 'width'],
  h: ['size', 'height'],
};

var Dim = {
  doc: function (doc, name) {
    var map = dimMap[name];
    return doc[map[0]][map[1]];
  },

  updateDoc: function (doc, name, value) {
    var map = dimMap[name];
    doc.$change([map[0]])[map[1]] = value;
    return doc.$save();
  },
};

Apputil.Dim = Dim;
