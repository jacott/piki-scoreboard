var Fiber = Npm.require('fibers');
var Future = Npm.require('fibers/future');

var replSetName, collNameIndex, localPort, localDb;

initLocal();

if (process.env.METEOR_MODE.match(/dev|test/i)) initRepl();

function initLocal() {
  var m = /:(\d+)\/(.*)$/.exec(process.env.MONGO_URL);
  localPort = m[1];
  replSetName = m[2];
  collNameIndex = replSetName.length+1;

  var url = process.env.OPLOG_URL || "mongodb://127.0.0.1:"+localPort+"/local";
  localDb = Future.wrap(Npm.require('mongodb').MongoClient.connect)(url, {auto_reconnect: true, poolSize: 1}).wait();
}

function initRepl() {
  var result = command({replSetGetStatus: 1});

  if (! result.ok) {
    result = command({
      replSetInitiate: {
        _id: replSetName,
        members: [{_id : 0, host: '127.0.0.1:' + localPort}]
      }
    });
    if (! result.ok) throw new Error(JSON.stringify(result));
    result = command({replSetGetStatus: 1}, 400);
  }

  while (result.myState !== 1) {
    result = command({replSetGetStatus: 1}, 100);
  }

  function command(cmd, waitTime) {
    var future = new Future;

    if (waitTime)
      setTimeout(run, waitTime);
    else
      run();

    function run() {
      localDb.admin().command(cmd, function (err, result) {
        if(err) future.throw(err);
        future.return(result);
      });
    };

    return future.wait().documents[0];
  }


}

function oplogQuery(db) {
  var future = new Future();
  var done;

  var query = {
    ns: new RegExp(replSetName.replace(/[-\/\\^$*+?.()|[\]{}]/g, '\\$&') + '\\.'),
    op: {$in: ['i', 'u', 'd']},
  };

  var cursor = db.collection('oplog.rs').find(query, {
    sort: {$natural: -1},
    limit: 1
  });

  cursor.each(function (err, doc) {
    if(err) future.throw(err);
    done || future.return(doc && doc.ts);
    done = true;
  });

  var latestTs = future.wait();

  if(latestTs) {
    query['ts'] = {$gt: latestTs};
  }

  return query;
}
