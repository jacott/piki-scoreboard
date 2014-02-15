AppModel.Heat = Heat;

function Heat(number, format) {
  this.number = number;
  format = format.replace(/\d+/g,'');
  this.format = format.slice(1);
  this.type = format[0];
  this.rankIndex = format.length - format.indexOf('Q');
};

var FINAL_NAMES = ['Final', 'Semi Final', 'Quarter Final'];

Heat.prototype = {
  constructor: Heat,

  get name() {
    return this.getName(this.number);
  },

  getName: function (number) {
    if (number === -2) return "Qual Rank";
    if (number === -1) return "General result";
    if (number === 0) return "Start list";
    var format = this.format;
    if (format[format.length - number] === 'Q') {
      var heatName = 'Qual ' + number;
    } else {
      var heatName = FINAL_NAMES[format.length - number];
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

  list: function () {
    var results = [];
    for(var i = this.format.length; i >= -1; --i) {
      results.push([i, this.getName(i)]);
    }
    return results;
  },

  sort: function (results) {
    var rankIndex = this.rankIndex;

    for(var x=rankIndex; x > 0; --x) {
      results.sort(function (a, b) {
        var aScore = a.scores[x] || -5, bScore = b.scores[x] || -5;
        return aScore === bScore ? 0 : aScore > bScore ? -1 : 1;
      });

      var previ = 0;
      var rankName = 'rank' + x;

      for(var i = 1; i < results.length; ++i) {
        if (results[previ].scores[x] !== results[i].scores[x]) {
          setRanks(previ, i);
          previ = i;
        }
      }
      setRanks(previ, i);
    }

    function setRanks(from , to) {
      var rank = (to - from - 1)/2 + from + 1;

      for(var i = from; i < to; ++i) {
        var row = results[i];
        row[rankName] = rank;
        row.rankMult = (row.rankMult || 1) * rank;
      }
    }

    results.sort(function (a, b) {
      var aScores = a.scores, bScores = b.scores;
      var aLen = aScores.length;

      if (aLen !== bScores.length)
        return aLen > bScores.length ? -1 : 1;

      for(--aLen; aLen >= 0; --aLen) {
        if (aLen === rankIndex)
          return a.rankMult === b.rankMult ? 0 :
          a.rankMult < b.rankMult ? -1 : 1; // lower rank is better

        if (aScores[aLen] !== bScores[aLen])
          return aScores[aLen] > bScores[aLen] ? -1 : 1;
      }
      return 0;
    });
    return results;
  },

  headers: function (callback) {
    var format = this.format;
    var num = this.number;
    var oldType, type;
    var len = format.length;

    if (num === -1) {
      for(var i = 0; i <= len; ++i, oldType = type) {
        type = format[i];
        if (type === 'Q' && oldType === 'F')
          callback(-2, this.getName(-2));

        callback(len - i, this.getName(len - i));
      }
    } else if (num === 0) {
      callback(0, 'Start list');
    }
    else {
      type = format[len - num];

      callback(num, "Result");
      if (type === 'Q') return;
      --num;
      callback(format[len - num] === 'Q' ? -2 : num, 'Previous heat');
    }
  },

  numberToScore: function (score, index) {
    if (index === 0) {
      return score;
    }
    if (score == null) return '';
    if (score === 9999999) return "Top";
    var result = "" + Math.floor(score / 10000);
    var dec = Math.floor(score/10) % 1000;

    if (dec) result += "." + ("" + (dec + 1000)).replace(/0+$/,'').slice(1);
    if (score % 10) result += "+";
    return result;
  },
};
