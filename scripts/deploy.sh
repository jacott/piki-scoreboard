#!/bin/bash
set -e

. `dirname $0`/environ.sh

top_dir=$PWD

init ${1-$(basename $top_dir)}

version=`git describe --tag --always`

echo $branch $version $PWD

app_dir="/u/app/${branch}"
dest="${app_dir}/staging"

rm -rf $dest
mkdir -p $dest

git archive --format=tar HEAD | (cd $dest && tar xf -)

cd $app_dir

if [ -e current ];then
    rsync -a current/node_modules staging/
fi

cd $dest

$NPM install

$NODE scripts/bundle.js $branch

MD5SUM=$(cat build/index.js build/index.css app/index.html|md5sum -b);MD5SUM=${MD5SUM/ */}

echo -e "window.KORU_APP_VERSION='${MD5SUM},${version}';\c"|cat - build/index.js >app/index.js
cat <<EOF >>config/$branch.cfg
export KORU_APP_VERSION="${MD5SUM},${version}"
EOF
mv build/index.css app

cd app

zopfli index.js index.css index.html


cd ../..




# Stop old and decomission old
if test -e current; then
    current/scripts/stop.sh $branch
    rm -rf previous
    mv current previous
fi
mv staging current

mkdir current/tmp
# Configure nginx
sed <current/config/${branch}-nginx.conf -e "s/{{KORU_PORT}}/$KORU_PORT/g" -e "s/{{KORU_HOSTNAME}}/$KORU_HOSTNAME/g" >current/tmp/nginx.conf
if test ! -e /etc/nginx/conf.d/$branch.conf || ! diff -q current/tmp/nginx.conf /etc/nginx/conf.d/$branch.conf;then
    mv current/tmp/nginx.conf /etc/nginx/conf.d/$branch.conf
    sudo /usr/sbin/service nginx reload
fi

# start new
./current/scripts/start.sh $branch
