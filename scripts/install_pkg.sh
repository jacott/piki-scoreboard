#!/bin/bash
set -e

. `dirname $0`/environ.sh

top_dir=$PWD

init ${1-$(basename $top_dir)}

app_dir="/u/app/${branch}"

cd $app_dir/staging

if [ -e ../current -a "$(grep "NODE_PATH=" config/${branch}.cfg)" = "$(grep "NODE_PATH=" ../current/config/${branch}.cfg)" ];then
    rsync -a ../current/node_modules ./
    diff -q ../current/npm-shrinkwrap.json ./npm-shrinkwrap.json >/dev/null ||
        $NPM install
else
    $NPM install
fi

cd $app_dir

# Stop old and decomission old
if test -e current; then
    current/scripts/stop.sh $branch
    rm -rf previous
    mv current previous
fi
mv staging current

mkdir -p current/tmp
# Configure nginx
sed <current/config/${branch}-nginx.conf -e "s/{{KORU_PORT}}/$KORU_PORT/g" -e "s/{{KORU_HOSTNAME}}/$KORU_HOSTNAME/g" >current/tmp/nginx.conf
if test ! -e /etc/nginx/conf.d/$branch.conf || ! diff -q current/tmp/nginx.conf /etc/nginx/conf.d/$branch.conf;then
    mv current/tmp/nginx.conf /etc/nginx/conf.d/$branch.conf
    sudo /usr/sbin/service nginx reload
fi

if [ -x ./current/backup-${branch} ];then
    ./current/backup-${branch}
fi

# start new
./current/scripts/start.sh $branch
