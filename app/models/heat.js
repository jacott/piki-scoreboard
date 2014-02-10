AppModel.Heat = Heat;

function Heat(number, format) {
  this.number = number;
  format = format.replace(/\d+/g,'');
  this.format = format.slice(1);
  this.type = format[0];
};

var FINAL_NAMES = ['Final', 'Semi Final', 'Quarter Final'];

Heat.prototype = {
  constructor: Heat,

  get name() {
    var format = this.format;
    if (format[format.length - this.number] === 'Q') {
      var heatName = 'Qualification ' + this.number;
    } else {
      var heatName = FINAL_NAMES[format.length - this.number];
    }

    return heatName;
  },

  scoreToNumber: function () {
    return 12345;
  },
};
