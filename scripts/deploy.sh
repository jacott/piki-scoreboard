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

cd $dest

if [ -e ../current -a "$(grep "NODE_PATH=" config/${branch}.cfg)" = "$(grep "NODE_PATH=" ../current/config/${branch}.cfg)" ];then
    rsync -a ../current/node_modules ./
    diff -q ../current/npm-shrinkwrap.json ./npm-shrinkwrap.json >/dev/null ||
        $NPM install
else
    $NPM install
fi

$NODE scripts/bundle.js $branch

MD5SUM=$(cat build/index.js build/index.css app/index.html|md5sum -b);MD5SUM=${MD5SUM/ */}

echo -e "window.KORU_APP_VERSION='${MD5SUM},${version}';\c"|cat - build/index.js >app/index.js
cat <<EOF >>config/$branch.cfg
export KORU_APP_VERSION="${MD5SUM},${version}"
EOF
mv build/index.css app

cd app

echo -e "\nCompressing...\c"

zopfli index.js index.css index.html


cd ../..

echo -e "\nTransferring...\c"

rsync -a --info=progress2 --delete --exclude='node_modules/**' --compare-dest=../current staging/ ${KORU_DEST_SERVER}:${app_dir}/staging

echo -e "\nInstalling..."

ssh ${KORU_DEST_SERVER} ${app_dir}/staging/scripts/install_pkg.sh $branch

echo "SUCCESS"

cd $app_dir

rm -rf current

mv staging current
