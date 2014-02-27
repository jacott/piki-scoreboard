#!/bin/bash
set -e

. `dirname $0`/environ.sh

echo $MONGO_OPLOG_URL

${meteor}/mongodb/bin/mongod --fork --quiet --oplogSize 1 --replSet piki --bind_ip 127.0.0.1 --smallfiles --port ${dbport}  --logappend --logpath /u/log/mongo-piki.log --dbpath /u/pikidb
