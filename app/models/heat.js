AppModel.Heat = Heat;

function Heat(number, format) {
  this.number = number;
  format = format.replace(/\d+/g,'');
  this.type = format[0];
  format = format.slice(1);
  this.total = format.length;
  this.rankIndex = format.indexOf('F');
};

var FINAL_NAMES = ['Final', 'Semi Final', 'Quarter Final'];

Heat.prototype = {
  constructor: Heat,

  get name() {
    return this.getName(this.number);
  },

  className: function(number) {
    if (number == null) number = this.number;
    if (number < 0) return 'general';
    else if (number <= this.rankIndex) return 'qual';
    return 'final';
  },

  getName: function (number) {
    if (number === -2) return "Qual Rank";
    if (number === -1) return "General";
    if (number === 0) return "Start order";
    if (number <= this.rankIndex) {
      var heatName = 'Qual ' + number;
    } else {
      var heatName = FINAL_NAMES[this.total - number];
    }

    return heatName;
  },

  scoreToNumber: function (score) {
    if (score.match(/^\s*t/i)) {
      return 9999999;
    }

    if (score.match(/^\s*dnc/i)) {
      return -1;
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
    for(var i = this.total; i >= -1; --i) {
      i && results.push([i, this.getName(i)]);
    }
    return results;
  },

  sortByStartOrder: function (results) {
    var x = this.number;

    if (x < 0) x = 1;
    this.sort(results, x <= this.rankIndex ? 0 : x - 1);

    if (x > this.rankIndex) {
      (x-1) === this.rankIndex && results.sort(function (a, b) {
        return a.rankMult === b.rankMult ? 0 :
          a.rankMult < b.rankMult ? -1 : 1; // lower rank is better
      });
      return results.reverse();
    }

    if (x % 2 === 0) {
      var mark = Math.ceil(results.length/2);
      var bottom = results.splice(0, mark);
      Array.prototype.push.apply(results, bottom);
    }
    return results;
  },

  sort: function (results, number) {
    if (results.length === 0) return results;
    if (number == null) number = this.number;
    var rankIndex = this.rankIndex;

    // set qual ranks
    for(var x=rankIndex; x > 0; --x) {
      results.sort(sortByHeat);

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

    // sort by heat number
    x = number;

    if (x >= 0 && x <= rankIndex) {
      results.sort(sortByHeat);

    } else {
      results.sort(this.compareResults(0));
    }
    return results;


    function setRanks(from , to) {
      var rank = (to - from - 1)/2 + from + 1;

      for(var i = from; i < to; ++i) {
        var row = results[i];
        row[rankName] = rank;
        row.rankMult = (row.rankMult || 1) * rank;
      }
    }

    function sortByHeat(a, b) {
      var aScore = a.scores[x], bScore = b.scores[x];
      if (aScore == null) aScore = -5;
      if (bScore == null) bScore = -5;
      return aScore == bScore ? 0 : aScore > bScore ? -1 : 1;
    }
  },

  compareResults: function (min) {
    if (min == null) min = 1;
    var rankIndex = this.rankIndex;
    return function (a, b) {
      var aScores = a.scores, bScores = b.scores;
      var aLen = aScores.length;

      if (aLen !== bScores.length)
        return aLen > bScores.length ? -1 : 1;

      for(--aLen; aLen >= min; --aLen) {
        if (aLen === rankIndex)
          return a.rankMult === b.rankMult ? 0 :
          a.rankMult < b.rankMult ? -1 : 1; // lower rank is better

        if (aScores[aLen] !== bScores[aLen])
          return aScores[aLen] > bScores[aLen] ? -1 : 1;
      }
      return 0;
    };
  },

  headers: function (callback) {
    var num = this.number;

    if (num === -1) {
      callback(-2, 'Rank');
      for(var i = this.total; i > 0; --i) {
        if (i == this.rankIndex)
          callback(-2, this.getName(-2));
        callback(i, this.getName(i));
      }
    } else if (num === 0) {
      callback(0, 'Start order');
    }
    else {
      callback(num, "Result");
      if (num <= this.rankIndex) return;
      --num;
      callback(num === this.rankIndex ? -2 : num, 'Previous heat');
    }
  },

  numberToScore: function (score, index) {
    if (index === 0) {
      return score;
    }
    if (index === -2) {
      return Math.round(score*100)/100;
    }
    if (score == null) return '';
    if (score == -1) return 'DNC';
    if (score === 9999999) return "Top";
    var result = "" + Math.floor(score / 10000);
    var dec = Math.floor(score/10) % 1000;

    if (dec) result += "." + ("" + (dec + 1000)).replace(/0+$/,'').slice(1);
    if (score % 10) result += "+";
    return result;
  },
};
