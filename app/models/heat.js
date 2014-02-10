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

  scoreToNumber: function (score) {
    if (score.match(/^\s*t/i)) {
      return 9999999;
    }
    var m = /^\s*(\d+)(?:\.(\d+))?(\+)?\s*$/.exec(score);
    if (m) {
      var extra = (m[2] || '000');
      extra = extra + '000'.slice(extra.length);
      return m[1]*10000 + extra*10 + (m[3] ? 5 : 0);
    }
  },

  numberToScore: function (score) {
    if (score == null) return '';
    if (score === 9999999) return "Top";
    var result = "" + Math.floor(score / 10000);
    var dec = Math.floor(score/10) % 1000;

    if (dec) result += "." + ("" + (dec + 1000)).replace(/0+$/,'').slice(1);
    if (score % 10) result += "+";
    return result;
  },
};
