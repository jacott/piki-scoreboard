#!/bin/bash
set -em

. `dirname $0`/environ.sh

top_dir=$PWD

init ${1-$(basename $top_dir)}

mkdir -p /u/backup/${branch}db.mongo/piki
cd /u/backup/${branch}db.mongo/piki
rm -f *
mongodump -o .. -h 127.0.0.1:${MONGO_PORT} -d piki

if [ ! -e .git ];then
    git init .
fi

git add .

git commit -am 'auto' || echo ""
