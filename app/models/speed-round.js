define((require, exports, module)=>{
  const BTree           = require('koru/btree');
  const Result          = require('models/result');

  const {private$} = require('koru/symbols');

  const random$ = Symbol(), laneA$ = Symbol(), laneB$ = Symbol(), ranking$ = Symbol();

  const PRIME = [5915587277, 1500450271, 3267000013, 5754853343, 4093082899];
  const GENERAL_RESULTS_PRIME = 3628273133;
  const NOT_CLIMBED_SCORE = 10000000;
  const NO_TIME = 1000000;
  const COMPARE = 0, SORT = 1, TIEBREAK = 2;

  const ERROR = {
    hasTies: 'Break ties by further attempts on Lane A.',
    missingScore: 'All scores must be entered.',
    timeVsFS: 'Invalid score combination: time/fall vs false start. Enter "wc" (wildcard) instead of time/fall.',
  };

  const isQualFormat = stage => stage == 0;

  const CONVERT_TIME = {
    wc: -1,
    fall: NO_TIME,
    fs: NO_TIME,
    tie: NO_TIME,
  };

  const toNumber = time => typeof time === 'number' ? time : CONVERT_TIME[time] || NO_TIME;
  const isNotClimbed = time => typeof time !== 'number' && CONVERT_TIME[time] === void 0;
  const stage1ToNumber = time => typeof time === 'number'
        ? time : (time == 'fs' ? NO_TIME+1 : CONVERT_TIME[time]) || NOT_CLIMBED_SCORE;

  const randomOrder = ({scores}, random) => {
    let x = Math.floor(scores[0]*random);
    x ^= x << 13; x ^= x >> 17; x ^= x << 5;
    return (x+10000500001)%999727999;
  };

  const compareQualStartOrder = (a, b)=>{
    const a0 = a.scores[0];
    const b0 = b.scores[0];
    return a0 - b0;
  };
  compareQualStartOrder.compareKeys = ['scores', '_id'];

  const scoreAB = (idx, scores, minQual) =>{
    const qualScore = scores[idx];
    if (qualScore == null || (qualScore[0] == null && qualScore[1] == null))
      return NOT_CLIMBED_SCORE;

    const laneA = qualScore[0], laneB = qualScore[1];
    if (laneA === 'fs' || laneB === 'fs')
      return NO_TIME;

    if (isNotClimbed(laneA) && isNotClimbed(laneB))
      return NOT_CLIMBED_SCORE;

    if (minQual) return Math.min(toNumber(laneA), toNumber(laneB));
    return Math.max(toNumber(laneA), toNumber(laneB));
  };

  const minQual = (idx, scores) => scoreAB(idx, scores, true);
  const maxQual = (idx, scores) => scoreAB(idx, scores, false);

  function *finalsOrder(a, b, l, max) {
    if (l < max) {
      yield *finalsOrder(a, b+l, l<<1, max);
      yield *finalsOrder(b, a+l, l<<1, max);
    } else {
      yield a;
    }
  }

  const compareQualResult = (idx, usage=COMPARE) =>{
    return (a, b)=>{
      if (a === b) return 0;
      const ma = minQual(idx, a.scores), mb = minQual(idx, b.scores);
      const ans = ma - mb;

      if (ans == 0) {
        const ans = maxQual(idx, a.scores) - maxQual(idx, b.scores);
        if (ans != 0 || usage == COMPARE)
          return ans;

        const aRep = a.scores[idx], bRep = b.scores[idx];
        if (aRep != null && bRep != null) {
          const minLen = Math.min(aRep.length, bRep.length);
          for(let i = 2; i < minLen; ++i) {
            const ans = toNumber(aRep[i]) - toNumber(bRep[i]);
            if (ans != 0) return ans;
          }
        }
        if (usage == TIEBREAK) return 0;
        const rnd = a.scores[0] - b.scores[0];
        return rnd == 0
          ? (a._id < b._id ? -1 : 1) : rnd;
      }
      return ans;
    };
  };

  const compareQualResultSORT = compareQualResult(1, SORT);
  const compareQualResultCOMPARE = compareQualResult(1, COMPARE);
  const compareQualResultTIEBREAK = compareQualResult(1, TIEBREAK);

  const timeFor = (scores, stage)=>{
    if (stage == 0) return minQual(1, scores);
    const score = scores[stage+1];
    if (score == null || score.time == null) return NOT_CLIMBED_SCORE;
    return toNumber(score.time);
  };

  const rankQualResults = round =>{
    const {stage} = round;
    const list = new BTree(compareQualResultSORT);

    let invalid = 0;
    for (const res of round.query) {
      if (minQual(1, res.scores) >= NO_TIME) ++invalid;
      list.add(res);
    }

    let validSize = list.size - invalid;

    let cutoff;
    for (cutoff of [16, 8, 4]) if (validSize >= cutoff) break;
    round.cutoff = cutoff;

    let ranking;
    let count = -1;

    count = 0;
    let prev = null;

    const random = round[random$];
    const entries = round.entries = new BTree(compareRankingSORT);
    for (const res of list) {
      ++count;

      if (prev === null ||
          (count-1 == cutoff
           ? compareQualResultTIEBREAK(prev, res)
           : compareQualResultCOMPARE(prev, res)) != 0) {
        ranking = count;
      }
      res[ranking$] = ranking;
      res[random$] = randomOrder(res, random);
      entries.add(res);
      prev = res;
    }
  };

  const compareLevel = (a, b, stage)=>{
    const ass = a.scores, bss = b.scores;
    const als = ass.length-2, bls = bss.length-2;
    for(; stage < 5; ++stage) {
      if (stage > als) {
        if (stage > bls) return 0;
        if (bss[stage+1] != null) return stage;
      } else {
        if (ass[stage+1] != null) return stage;
        if (stage <= bls && bss[stage+1] != null) return stage;
      }
    }
    return 0;
  };

  const winnerLooser = (res, previous)=>{
    for (let stage = previous; stage < 5; ++stage) {
      const rs = res.scores[stage+1];
      if (rs != null) {
        const o = Result.findById(rs.opponent_id);
        if (isWinner(res, o, stage)) return [res, o];
        stage = previous-1;
        res = o;
      }
    }
    return [res];
  };

  const compareKnockout = (a, b, stage)=>{
    if (a === b) return 0;
    if (a === undefined) return 1;
    if (b === undefined) return -1;
    const sa = a.scores[stage+1];
    const sb = b.scores[stage+1];
    if (sb == null) return sa == null ? 0 : -1;
    if (sa == null) return 1;
    let ans = stage == 1
        ? stage1ToNumber(sa.time) - stage1ToNumber(sb.time) : toNumber(sa.time) - toNumber(sb.time);
    if (ans != 0) return ans;
    ans = compareQualResultCOMPARE(a, b);
    if (ans != 0) return ans;
    const tba = sa.tiebreak, tbb = sb.tiebreak;
    if (tba == null || tbb == null) return 0;
    const len = Math.min(tba.length, tbb.length);
    for(let i = 0; i < len; ++i) {
      const ans = toNumber(tba[i]) - toNumber(tbb[i]);
      if (ans != 0) return ans;
    }
    return 0;
  };

  const isWinner = (a, b, stage)=>compareKnockout(a, b, stage) < 0;

  const calcQualStartList = (round)=>{
    const entries = round.entries = new BTree(compareQualStartOrder);
    for (const res of round.query) entries.add(res);

    round.recalcQualsStartList();
  };

  const compareRankingSORT = (a, b)=>{
    const ans = a[ranking$] - b[ranking$];
    if (ans != 0)
      return ans;
    else {
      const ans = a[random$] - b[random$];
      return ans == 0
        ? a._id === b._id ? 0 : a._id < b._id ? -1 : 1 : ans;
    }
  };
  compareRankingSORT.compareKeys = [ranking$, random$, '_id'];

  const compareRankingCOMPARE = (a, b)=> a[ranking$] - b[ranking$];

  const compareKnockoutTimes = (a, b, level)=>{
    if (level != 4 || (compareLevel(a, b, 4) == 0))
      return compareRankingCOMPARE(a, b);
    const mas = a.scores[level+1], mbs = b.scores[level+1];
    if (mas == null)
      return 1;
    else if (mbs == null)
      return -1;

    const ans = toNumber(mas.time) - toNumber(mbs.time);
    return ans != 0 ? ans : compareKnockoutTimes(a, b, level+1);
  };

  const compareFinals = (a, b)=>{
    if (a === b) return 0;
    const level = compareLevel(a, b, 1);
    const mas = a.scores[level+1], mbs = b.scores[level+1];
    if (mas == null)
      return 1;
    else if (mbs == null)
      return -1;

    if (mas.opponent_id === b._id) {
      return compareKnockout(a, b, level);
    } else if (level == 1) {
      const pl = compareLevel(a, b, 2);
      const mas = a.scores[pl+1];
      return mas != null && isWinner(a, Result.findById(mas.opponent_id), pl) ? -1 : 1;
    } else {
      const aOpp = Result.findById(mas.opponent_id);
      const bOpp = Result.findById(mbs.opponent_id);

      const aw = isWinner(a, aOpp, level), bw = isWinner(b, bOpp, level);
      if (aw) {
        return bw ? compareRankingCOMPARE(a, b) : -1;
      } else if (bw) {
        return 1;
      } else {
        const ans = toNumber(mas.time) - toNumber(mbs.time);
        return ans != 0 ? ans : compareKnockoutTimes(a, b, level+1);
      }
    }
  };

  const breakElimWC = (a, b)=>{
    const mas = a.scores[4], mbs = b.scores[4];
    const ans = toNumber(mas && mas.time) - toNumber(mbs && mbs.time);
    return ans != 0 ? ans : compareRankingCOMPARE(a, b);
  };

  const reAddGeneralResult = (entries, res, ranking)=>{
    if (res === null) return;
    entries.delete(res);
    res[ranking$] = ranking;
    res[random$] = randomOrder(res, GENERAL_RESULTS_PRIME);
    entries.add(res);
  };

  const rankGeneralResults = (round)=>{
    rankQualResults(round);

    const {cutoff, entries} = round;

    if (entries.size < cutoff) return;

    const finalists = new Array(cutoff);
    let idx = -1;
    for (const res of entries) {
      finalists[++idx] = res;
    }

    finalists.sort(compareFinals);

    let isWcIn16Elim = false;

    if (finalists.length >= 16 && finalists[0].scores.length == 6) {
      for(let i = 4; i < 8; ++i) {
        const {scores} = finalists[i];
        if (scores.length == 6 && scores[5].time == 'wc') {
          finalists.splice(4, 4, ...finalists.slice(4,8).sort(breakElimWC));
          isWcIn16Elim = true;
          break;
        }
      }
    }

    let prev = null, ranking;
    for(let count = 0; count < cutoff; ++count) {
      const res = finalists[count];
      const pRanking = ranking;
      if (isWcIn16Elim && count > 4 && count < 8) {
        if (breakElimWC(prev, res) != 0) {
          ranking = count+1;
        }
      } else if (prev === null || compareFinals(prev, res) != 0) {
        ranking = count+1;
      }
      reAddGeneralResult(entries, prev, pRanking);
      prev = res;
    }
    reAddGeneralResult(entries, prev, ranking);
  };

  const assignLanes = (resA=null, resB=null)=>{
    if (resA !== null) {
      resA[laneA$] = resA;
      resA[laneB$] = resB;
    }
    if (resB !== null) {
      resB[laneA$] = resA;
      resB[laneB$] = resB;
    }
  };

  const INV_LOG2 = 1/Math.log(2);
  const countToStage = (count)=>Math.max(1, Math.floor(Math.log(.2+Math.min(16, count))*INV_LOG2));

  function *tiesOfQual(round, cutoff) {
    const compare = compareQualResultTIEBREAK;
    const nr = Array.from(round).sort(compare);
    const coRes = nr[cutoff-1];
    let tiesFound = false;
    for(let i = cutoff; i < nr.length; ++i) {
      const res = nr[i];
      if (compare(coRes, res) == 0) {
        tiesFound = true;
        yield res;
      } else
        break;
    }
    if (! tiesFound) return;

    yield coRes;
    for(let i = cutoff - 1; i >=0 ; --i) {
      const res = nr[i];
      if (compare(coRes, res) == 0) {
        yield res;
      } else
        break;
    }
  }

  const addTieAttempt = (round, res)=>{
    const {stage} = round;

    if (stage > 0) {
      const scores = res.scores[stage+1];
      const {tiebreak} = scores;
      let attempt = 2;
      if (tiebreak != null) {
        let last = tiebreak.length-1;

        for(; last >= 0; --last) {
          if (tiebreak[last] != null) {
            if (tiebreak[last] === 'tie') return;
            ++last;
            break;
          }
        }
        attempt += last;
      }
      res.setSpeedScore({time: 'tie', stage, opponent_id: scores.opponent_id, attempt});
      return;
    }
    const scores = round.stageScores(res);
    const start = 2;

    let last = scores.length-1;

    for(; last >= start; --last) {
      if (scores[last] != null) {
        if (scores[last] === 'tie') return;
        ++last;
        break;
      }
    }

    if (last < start) last = start;
    res.setSpeedScore({time: 'tie', attempt: last+1});
  };

  const fallOrTime = (score)=> score === 'fall' || typeof score === 'number';

  const DNCRE = /d?nc/i;

  class SpeedRound {
    constructor(opts) {
      Object.assign(this, opts);
      this.entries = null;
      this[random$] = this.stage == -1
        ? GENERAL_RESULTS_PRIME:  PRIME[this.stage];
    }

    isTimeValid(res) {return timeFor(res.scores, this.stage) < NO_TIME}
    hasClimbed(res) {return timeFor(res.scores, this.stage) < NOT_CLIMBED_SCORE}

    getTime(res, lane) {
      const {stage} = this;
      const score = res.scores[stage+1];
      if (score == null) return null;
      if (stage < 1) return score[lane];
      return score.time;
    }

    setTime(res, {time, lane, attempt, opponent_id}) {
      if (DNCRE.test(time))
        time = '-';
      const {stage} = this;
      if (lane === undefined && attempt !== undefined)
        lane = attempt+1;
      if (stage == 0) {
        return res.setSpeedScore({time, attempt: lane+1});
      } else if (opponent_id === undefined) {
        ++attempt;
        return res.setSpeedScore({
          time, attempt, stage, opponent_id: res.scores[stage+1].opponent_id});
      } else {
        return res.setSpeedScore({opponent_id, time, stage, attempt: 1});
      }
    }

    checkValid(resA) {
      const {stage} = this;
      if (isQualFormat(stage)) {
        const quals = resA.scores[stage == 0 ? 1 : 2];
        return (quals !== undefined && quals[0] != null && quals[1] != null)
          ? '' : ERROR.missingScore;
      }
      const scoreA = resA.scores[stage+1];
      if (scoreA == null || scoreA.time == null) return ERROR.missingScore;
      const scoreB = resA[laneB$].scores[stage+1];
      if (scoreB == null || scoreB.time == null) return ERROR.missingScore;
      if (stage != 1 &&
          ((scoreA.time === 'fs' && fallOrTime(scoreB.time)) ||
           (scoreB.time === 'fs' && fallOrTime(scoreA.time))))
        return ERROR.timeVsFS;
      return '';
    }

    whoWonFinals(resA) {
      const resB = resA[laneB$];
      if (this.hasClimbed(resA) && this.hasClimbed(resB)) {
        const ans = compareKnockout(resA, resB, this.stage);
        return ans == 0 ? null : ans < 0 ? resA : resB;
      }
      return null;
    }

    [Symbol.iterator]() {return this.entries[Symbol.iterator]()}

    onChange(callback) {
      return this.query.onChange(callback);
    }

    calcStartList() {
      const {stage} = this;
      if (isQualFormat(stage))
        return calcQualStartList(this);

      if (stage < 0)
        throw new Error("invalid stage: "+stage);
      const len = Math.max(1<<stage, 4), hlen = len>>1;
      const quals = new SpeedRound({stage: 0, query: this.query});
      rankQualResults(quals);

      const posMap = new Array(hlen), entries = new Array(hlen);

      let count = -1;
      for (const pos of finalsOrder(0, 1, 2, len)) {
        posMap[pos] = ++count;
      }

      const {previous} = this;
      const iter = quals[Symbol.iterator]();

      if (stage == 1) {
        const v1 = iter.next().value, v2 = iter.next().value;
        const [fA, pA] = winnerLooser(v1, previous);
        const [fB, pB] = winnerLooser(v2, previous);

        assignLanes(fA, fB);
        entries[0] = fA;

        assignLanes(pA, pB);
        entries[1] = pA;
      } else {
        for(let i = 0; i < hlen; ++i) {
          const res = winnerLooser(iter.next().value, previous)[0];
          entries[res[ranking$] = posMap[i]] = res;
        }

        for(let i = hlen-1; i >= 0; --i) {
          const resA = entries[posMap[i]];
          const resB = winnerLooser(iter.next().value, previous)[0];
          assignLanes(resA, resB);
        }
      }

      this.entries = entries;
    }

    recalcQualsStartList() {
      const {entries} = this;
      const {size} = entries;
      const step = (3+size)>>1;

      let iterB = entries.values(), ansB;
      for(let i = 0; i < step; ++i) ansB = iterB.next();

      for (const resA of entries) {
        if (ansB.done) {
          iterB = entries.values(); ansB = iterB.next();
        }
        resA[laneB$] = ansB.value;
        ansB.value[laneA$] = resA;
        ansB = iterB.next();
      }
    }

    rankResults() {
      const {stage} = this;
      if (isQualFormat(stage)) return rankQualResults(this);
      if (stage == -1) return rankGeneralResults(this);

      this.calcStartList();
    }

    complete() {
      const {stage} = this;
      let error = '', nextStage = stage;
      let validCount = 0;
      for (const res of this) {
        error = this.checkValid(res);
        if (error !== '') break;
        this.isTimeValid(res) && ++validCount;
      }
      if (error === '') {
        if (isQualFormat(stage)) {
          const cutoff = stage == 0 ? 1<<countToStage(validCount) : 3;

          if (validCount > 3 && validCount > cutoff) {
            for (const res of tiesOfQual(this, cutoff)) {
              error = ERROR.hasTies;
              addTieAttempt(this, res);
            }
          }
          if (error === '') {
            nextStage = stage == 0 && validCount >= 4 ? countToStage(validCount) : -3;
          }
        } else {
          for (const res of this) {
            if (compareKnockout(res, res[laneB$], stage) == 0) {
              addTieAttempt(this, res);
              addTieAttempt(this, res[laneB$]);
              error = ERROR.hasTies;
            }
          }
          if (error === '') {
            if (stage > 1) --nextStage;
            else nextStage = -3;
          }
        }
      }
      return {error, nextStage};
    }

    stageScores(res) {
      const {stage} = this;
      return res.scores[stage+1];
    }

    *attempts(res) {
      const {stage} = this;
      const scores = this.stageScores(res);
      if (scores == null) return;
      if (stage < 1) {
        const start = 2;
        let last = scores.length-1;
        for(; last >= start; --last) if (scores[last] != null) break;

        for(let i = start; i <= last; ++i) {
          yield scores[i];
        }
      } else {
        const {tiebreak} = scores;
        if (tiebreak != null) for (const time of tiebreak)
          yield time;
      }
    }
  }

  SpeedRound.ERROR = ERROR;
  SpeedRound.laneA = res => res[laneA$];
  SpeedRound.laneB = res => res[laneB$];
  SpeedRound.ranking = res => res[ranking$];
  SpeedRound.minQual = (res, idx=1) =>{
    const qualScores = res.scores[idx];
    if (qualScores == null) return '';
    if (qualScores[0] == 'fs' || qualScores[1] == 'fs')
      return 'false start';
    const time = minQual(idx, res.scores);
    if (time == -1) return 'wildcard';
    if (time < NO_TIME) return time;
    if (time == NOT_CLIMBED_SCORE)  return '';
    return 'fall';
  };
  SpeedRound.compareRankingSORT = compareRankingSORT;

  SpeedRound[private$] = {
    compareQualStartOrder,
    compareFinals,
    compareKnockout,
    ranking$,
    random$,
  };

  return SpeedRound;
});
