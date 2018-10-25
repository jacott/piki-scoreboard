define((require, exports, module)=>{
  const BTree           = require('koru/btree');
  const Result          = require('models/result');

  const {private$} = require('koru/symbols');

  const random$ = Symbol(), laneA$ = Symbol(), laneB$ = Symbol(), ranking$ = Symbol();

  const PRIME = [5915587277, 1500450271, 3267000013, 5754853343, 4093082899];
  const GENERAL_RESULTS_PRIME = 3628273133;
  const NOT_CLIMBED_SCORE = 10000000;
  const NO_TIME = 1000000;
  const COMPARE = 'compare', SORT = 'sort', TIEBREAK = 'tiebreak';

  const isQualFormat = stage => stage == 0 || stage == -2;

  const CONVERT_TIME = {
    wc: -1,
    fall: NO_TIME,
    fs: NO_TIME,
    tie: NOT_CLIMBED_SCORE,
  };

  const toNumber = time => typeof time === 'number' ? time : CONVERT_TIME[time] || NOT_CLIMBED_SCORE;

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

  const scoreAB = (idx, scores) =>{
    const qualScore = scores[idx];
    if (qualScore == null || (qualScore[0] == null && qualScore[1] == null))
      return [NOT_CLIMBED_SCORE];

    const laneA = qualScore[0], laneB = qualScore[1];
    if (laneA === 'fs' || laneB === 'fs')
      return [NO_TIME];

    return [toNumber(laneA), toNumber(laneB)];
  };

  const minQual = (idx, scores) => Math.min(...scoreAB(idx, scores));
  const maxQual = (idx, scores) => Math.max(...scoreAB(idx, scores));

  function *finalsOrder(a, b, l, max) {
    if (l < max) {
      yield *finalsOrder(a, b+l, l<<1, max);
      yield *finalsOrder(b, a+l, l<<1, max);
    } else {
      yield a;
    }
  }

  const compareQualResult = (idx, usage=COMPARE) =>{
    const isCompare = usage === COMPARE;
    return (a, b)=>{
      if (a === b) return 0;
      const ma = minQual(idx, a.scores), mb = minQual(idx, b.scores);
      if (isCompare)
        return Math.floor(ma/10) - Math.floor(mb/10);

      const ans = ma - mb;

      if (ans === 0) {
        const ans = maxQual(idx, a.scores) - maxQual(idx, b.scores);
        if (ans !== 0)
          return ans;

        const aRep = a.scores[idx], bRep = b.scores[idx];
        if (aRep != null && bRep != null) {
          const minLen = Math.min(aRep.length, bRep.length);
          for(let i = 2; i < minLen; ++i) {
            const ans = toNumber(aRep[i]) - toNumber(bRep[i]);
            if (ans != 0) return ans;
          }
        }
        if (usage === TIEBREAK) return 0;
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

  const compareQualRerunTIEBREAK = compareQualResult(2, TIEBREAK);
  const compareQualRerunCOMPARE = (a,b)=>{
    const ans = compareQualRerunTIEBREAK(a, b);
    return ans == 0
      ? compareQualResultCOMPARE(a, b) : ans;
  };
  const compareQualRerunSORT = (a,b)=>{
    const ans = compareQualRerunTIEBREAK(a, b);
    return ans == 0
      ? compareQualResultSORT(a, b) : ans;
  };

  const timeFor = (scores, stage)=>{
    if (stage == 0) return minQual(1, scores);
    if (stage == -2) return minQual(2, scores);
    const score = scores[stage+1];
    if (score == null) return NOT_CLIMBED_SCORE;
    return toNumber(score.time);
  };

  const rankQualResults = round =>{
    const {stage} = round;
    const rank = stage == -2 ?  compareQualRerunCOMPARE : compareQualResultCOMPARE;
    const list = new BTree(stage == -2 ? compareQualRerunSORT : compareQualResultSORT);

    let invalid = 0;
    for (const res of round.query) {
      if (minQual(stage == -2 ? 2 : 1, res.scores) >= NO_TIME) ++invalid;
      list.add(res);
    }

    let validSize = list.size - invalid;

    let cutoff;
    if (stage == -2)
      cutoff = 0;
    else {
      for (cutoff of [16, 8, 4]) if (validSize >= cutoff) break;
      round.cutoff = cutoff;
    }

    let ranking;
    let count = -1;

    count = 0;
    let prev = null;

    const random = round[random$];
    const entries = round.entries = new BTree(compareRanking);
    for (const res of list) {
      ++count;

      if (prev === null || rank(prev, res) != 0 || (count-1 == cutoff)) {
        ranking = count;
      } else if (stage == -2 && count < 5)
        ranking = count;
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
    let ans = toNumber(sa.time) - toNumber(sb.time);
    if (ans != 0) return ans;
    ans = compareQualResultTIEBREAK(a, b);
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

  const compareRanking = (a, b)=>{
    const sa = a.scores, sb = b.scores;
    const ans = a[ranking$] - b[ranking$];
    if (ans != 0)
      return ans;
    else {
      const ans = a[random$] - b[random$];
      return ans == 0
        ? a._id === b._id ? 0 : a._id < b._id ? -1 : 1 : ans;
    }
  };
  compareRanking.compareKeys = [ranking$, random$, '_id'];

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
        return bw ? compareQualResultCOMPARE(a, b) : -1;
      } else if (bw) {
        return 1;
      } else {
        const ans = toNumber(mas.time) - toNumber(mbs.time);
        return ans != 0 ? ans : compareQualResultCOMPARE(a, b);
      }
    }
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

    let prev = null, ranking;
    const random = GENERAL_RESULTS_PRIME;
    for(let count = 0; count < cutoff; ++count) {
      const res = finalists[count];
      if (prev === null || compareFinals(prev, res) != 0) {
        ranking = count+1;
      }
      entries.delete(res);
      res[ranking$] = ranking;
      res[random$] = randomOrder(res, random);
      entries.add(res);
      prev = res;
    }
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

  const getCompare = ({stage})=>{
    if (stage == 0) return compareQualResultTIEBREAK;
    if (stage == -2) return compareQualRerunTIEBREAK;
  };

  function *tiesOf(round, cutoff) {
    const compare = getCompare(round);
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
    res.setSpeedScore(
      stage == -2
        ? {time: 'tie', attempt: last+1, stage: 1} : {time: 'tie', attempt: last+1});
  };

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
      const score = res.scores[stage == -2 ? 2 : stage+1];
      if (score == null) return null;
      if (stage < 1) return score[lane];
      return score.time;
    }

    setTime(res, {time, lane, attempt, opponent_id}) {
      const {stage} = this;
      if (lane === undefined && attempt !== undefined)
        lane = attempt+1;
      if (stage == 0) {
        return res.setSpeedScore({time, attempt: lane+1});
      } else if (stage == -2) {
        return res.setSpeedScore({time, attempt: lane+1, stage: 1});
      } else if (opponent_id === undefined) {
        ++attempt;
        return res.setSpeedScore({
          time, attempt, stage, opponent_id: res.scores[stage+1].opponent_id});
      } else {
        return res.setSpeedScore({opponent_id, time, stage, attempt: 1});
      }
    }

    isComplete(res) {
      const {stage} = this;
      if (isQualFormat(stage)) {
        const quals = res.scores[stage == 0 ? 1 : 2];
        return quals !== undefined && quals[0] != null && quals[1] != null;
      }
      const score = res.scores[stage+1];
      return score == null ? false : score.time != null;
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
      let isComplete = true, hasTies = false, nextStage = stage;
      let validCount = 0;
      for (const res of this) {
        if (! this.isComplete(res, 0)) {
          isComplete = false; break;
        }
        this.isTimeValid(res) && ++validCount;
      }
      if (isComplete) {
        if (isQualFormat(stage)) {
          const cutoff = stage == 0 ? 1<<countToStage(validCount) : 3;

          if (stage == -2 || (validCount > 3 && validCount > cutoff)) {
            for (const res of tiesOf(this, cutoff)) {
              hasTies = true;
              addTieAttempt(this, res);
            }
          }
          if (! hasTies && isQualFormat(stage)) {
            nextStage = stage == 0
              ? validCount >= 4 ? countToStage(validCount) : -2
            : -3;
          }
        } else {
          for (const res of this) {
            if (compareKnockout(res, res[laneB$], stage) == 0) {
              addTieAttempt(this, res);
              addTieAttempt(this, res[laneB$]);
              hasTies = true;
            }
          }
          if (! hasTies) {
            if (stage > 1) --nextStage;
            else nextStage = -3;
          }
        }
      }
      return {isComplete: isComplete && ! hasTies, hasTies, nextStage};
    }

    stageScores(res) {
      const {stage} = this;
      return res.scores[stage == -2 ? 2 : stage+1];
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
  SpeedRound.compareRanking = compareRanking;

  SpeedRound[private$] = {
    compareQualStartOrder,
    compareFinals,
    compareKnockout,
    compareQualRerunSORT,
    ranking$,
    random$,
  };

  return SpeedRound;
});