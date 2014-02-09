AppModel.Heat = Heat;

function Heat(number, format) {
  this.number = number;
  this.format = format.replace(/\d+/g,'');
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
  }
};
