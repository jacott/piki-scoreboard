define((require)=>{
  const FINAL_NAMES = ['Final', 'Semi final', 'Quarter final'];

  class Heat {
    constructor(number, format) {
      this.number = number;

      var rounds = format.split(/[QF]/);
      format = format.replace(/:\d+/g, '');
      this.cutoffs = format.split('F').slice(1);

      format = format.replace(/\d+/g,'');
      this.type = format[0];
      format = format.slice(1);
      this.total = format.length;
      this.rankIndex = format.indexOf('F');
      if (this.rankIndex === -1)
        this.rankIndex = this.total;

      var pnum = 5;
      for(var i = 1; i <= this.total; ++i) {
        var p = rounds[i];
        if (p) p = p.replace(/^\d*:?/, '');
        if (p)
          pnum = +p;

        rounds[i] = pnum;
        if (i === this.rankIndex)
          pnum = 4;
      }

      this._rounds = rounds;
    }

    get problems() {
      return this._rounds[this.number];
    }

    get name() {
      return this.getName(this.number);
    }

    isFinalRound() {
      return this.number === this.total;
    }

    className(number) {
      if (number == null) number = this.number;
      if (number < 0) return 'general';
      else if (number <= this.rankIndex) return 'qual';
      return 'final';
    }

    getName(number) {
      if (number === -2) return "Qual points";
      if (number === -1) return "General";
      if (number === 0) return "Start order";
      if (number <= this.rankIndex) {
        var heatName = 'Qual ' + number;
      } else {
        var heatName = FINAL_NAMES[this.total - number];
      }

      return heatName;
    }

    numberToScore(score, index, ruleVersion) {
      if (index === 0) {
        return score;
      }
      if (index === -2) {
        return Math.round(score*100)/100;
      }
      if (score == null) return '';
      if (score == -1) return 'DNC';

      switch (this.type) {
      case 'L':
        if (score === 9999999) return "Top";
        var result = "" + Math.floor(score / 10000);
        var dec = Math.floor(score/10) % 1000;

        if (dec) result += "." + ("" + (dec + 1000)).replace(/0+$/,'').slice(1);
        if (score % 10) result += "+";
        return result;
      case 'B':
        if (ruleVersion === 0) {
          return this.numberToBoulderScorePre2018(score, index);
        } else {
          return this.numberToBoulderScore2018(score, index);
        }
      }
    }

    numberToBoulderScorePre2018(score, index) {
      if (score == 0) return "0t 0b"; // redundant?
      var mod, result = "";
      for(var i = 0; i < 2; ++i,
              score = Math.floor(score/10000)) {

        if (mod = (99 - (score % 100)))
          result = mod + result;
        mod = Math.floor(score/100) % 100;
        result = mod + (i == 0 ? 'b' : 't') + result;
        if (i === 0) result = " " + result;
      }
      return result;
    }

    numberToBoulderScore2018(score, index) {
      if (score == 0) return "0T0Z"; // redundant?
      if (score == 9999) return "0T0Z";
      var mod, result = "";
      for (var i = 0; i < 4; ++i, score = Math.floor(score/100)) {
        if (i < 2) {
          mod = 99 - (score % 100);
          result = mod + (i === 0 ? "AZ" : "AT") + result;
        } else {
          mod = score % 100;
          result = mod + (i === 2 ? "Z" : "T") + result;
        }
      }
      return result;
    }

    scoreToNumber(score, index) {
      if (score == null || score.trim() === '')
        return;

      if (index === 99) {
        var m = /^\s*(?:(\d{1,2})[.:])?([0-5]\d)\s*$/.exec(score);
        return m ? (m[1]||0)*60 + +m[2] : false;
      }

      if (score.match(/^\s*d?nc/i)) {
        return -1;
      }

      switch (this.type) {
      case 'L':
        if (score.match(/^\s*t/i)) {
          return 9999999;
        }

        var m = /^\s*(\d+)(?:\.(\d+))?(\+)?\s*$/.exec(score);
        if (m) {
          var extra = (m[2] || '000');
          extra = extra + '000'.slice(extra.length);
          return m[1]*10000 + extra*10 + (m[3] ? 5 : 0);
        }
        break;
      case 'B':
        throw new Error('Boulder scores may not be converted this way');
      }
      return false;
    }

    boulderScoreToNumber(b, ba, t, ta, ruleVersion) {
      if (b == null) return null;
      if (ruleVersion === 0) {
        return t*1000000 + (99-ta)*10000 + b*100 + (99 - ba);
      } else {
        return t*1000000 + b*10000 + (99-ta)*100 + (99 - ba);
      }
    }

    list() {
      var results = [];
      for(var i = this.total; i >= -1; --i) {
        i && results.push([i, this.getName(i)]);
      }
      return results;
    }

    sortByStartOrder(results) {
      if (results.length === 0) return results;

      var x = this.number;

      if (x <= 0) x = 1;

      if (x > this.rankIndex) {
        this.sort(results, x - 1, altStartOrder);
        (x-1) === this.rankIndex && results.sort(function (a, b) {
          return a.rankMult === b.rankMult ? a.scores[0] - b.scores[0] :
            a.rankMult - b.rankMult; // lower rank is better
        });

        var cutoff = +this.cutoffs[x - this.rankIndex - 1];

        var prev, row, rank = 0;
        var compareResults = this.compareResults(1, x - 1);
        for(var i = 0; i < results.length; ++i, prev = row) {
          row = results[i];
          if (! prev || compareResults(prev, row) !== 0)
            rank = i + 1;

          if (rank > cutoff) {
            results.length = i;
            break;
          }

          row.rank = rank;
        }

        return results.reverse();
      }

      this.sort(results, 0);


      if (x % 2 === 0) {
        var mark = Math.ceil(results.length/2);
        var bottom = results.splice(0, mark);
        Array.prototype.push.apply(results, bottom);
      }
      return results;
    }

    sort(results, number, rso) {
      if (results.length === 0) return results;


      if (number == null) number = this.number;
      const rankIndex = this.rankIndex;

      for(var i = 0; i < results.length; ++i) {
        results[i].rankMult = 1;
      }

      // set qual ranks
      for(var x=rankIndex; x > 0; --x) {
        results.sort(sortByHeat);

        var previ = 0;
        var rankName = 'rank' + x;

        for(var i = 1; i < results.length; ++i) {
          if (results[previ].scores[x] != results[i].scores[x]) {
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
        results.sort(this.compareResults(rso ? 1 : 0, x, rso));
        setPoints(results, this.compareResults(0));
      }
      return results;


      function setRanks(from , to) {
        const rank = (to - from - 1)/2 + from + 1;

        for(let i = from; i < to; ++i) {
          var row = results[i];
          row[rankName] = rank;
          row.rankMult = row.rankMult * rank;
        }
      }

      function sortByHeat(a, b) {
        let aScore = a.scores[x], bScore = b.scores[x];
        if (aScore == null) aScore = -5;
        if (bScore == null) bScore = -5;
        return aScore === bScore ? a.scores[0] - b.scores[0] : bScore - aScore;
      }

      function setPoints(results, comparitor) {
        let previ = 0;
        let sumPoints = Heat.pointsTable[0];

        for (let i = 1; i <= results.length; ++i) {
          if (i == results.length || comparitor(results[previ], results[i])) {
            for(let j = previ; j < i; ++j) {
                results[j].sPoints =
                (results[j].scores.length === 1) ? null :
                Math.floor(sumPoints / (i-previ));
            }
            sumPoints = 0;
            previ = i;
          }
          sumPoints += Heat.pointsTable[i] || 0;
        }
      }
    }

    compareResults(min, max, rso) {
      if (min == null) min = 1;
      if (max == null) max = this.number;
      const rankIndex = this.rankIndex;
      const last = this.total;

      return function (a, b) {
        var aScores = a.scores, bScores = b.scores;
        var mLen = max < 0 ? last === rankIndex ? last : Math.max(aScores.length, bScores.length) - 1 : max;
        var as, bs;

        for(; mLen >= min; --mLen) {
          if (mLen === rankIndex) {
            if (a.rankMult === b.rankMult) {
              if ((max === last || max === -1) && a.time !== b.time ) { // final by time
                return (a.time || 0) - (b.time || 0); // lower time is better
              } else
                return rso ? rso(aScores[0], bScores[0]) : 0;
            } else {
              as = a.rankMult;
              bs = b.rankMult;

              if (as == null) as = -5;
              if (bs == null) bs = -5;
              return as - bs; // lower rank is better
            }
          }

          as = aScores[mLen];
          bs = bScores[mLen];

          if (as !== bs) {
            if (as == null) as = -5;
            if (bs == null) bs = -5;

            return bs - as;
          }
        }

        return rso ? rso(aScores[0], bScores[0]) : 0;
      };
    }

    headers(callback) {
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
        if (this.type === 'L' && num === this.total && this.rankIndex !== this.total)
          callback(99, 'Time taken');
        callback(num, "Result");
        if (this.type === 'B') callback(num, "Sum");
        if (num <= this.rankIndex) return;
        --num;
        callback(num === this.rankIndex ? -2 : num, 'Previous heat');
      }
    }

  };

  function altStartOrder(a, b) {
    // pseudo randomize for final ties
    return ((a * 100000000) % 104659)+a - ((b * 100000000) % 104659)+b;
  }


  Heat.pointsTable = [
    100, 80, 65, 55, 51, 47, 43, 40, 37, 34,
    31,  28, 26, 24, 22, 20, 18, 16, 14, 12,
    10,  9,  8,  7,  6,  5,  4,  3,  2,  1,
  ];

  return Heat;
});
