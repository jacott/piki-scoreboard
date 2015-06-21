#!/bin/bash
set -em

. `dirname $0`/environ.sh

top_dir=$PWD

init ${1-$(basename $top_dir)}

mkdir -p /u/backup/${branch}db.pg
cd /u/backup/${branch}db.pg
rm -rf pikiprod
pg_dump --compress=0 --format=d --file=pikiprod pikiprod

if [ ! -e .git ];then
    git init .
fi

git add .

git commit -am 'auto' || echo ""
