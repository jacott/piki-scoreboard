#!/bin/bash
set -e
cd `dirname "$0"`/..

branch="$1"

lockKey=$branch

. scripts/script-helper
. config/environ.sh

cd /u/build-piki

mkdir -p build
rm -f build/*

[[ -d tmp ]] || mkdir tmp

git clean -f -d
git fetch
git checkout -B ${2-master} origin/${2-master}
git reset --hard

version=`git describe --tags --always --long --match 'v*'`

echo "$version" >build/version

echo $branch $version $PWD

if test -e tmp/yarn.lock && ${NODE} -v | cat - yarn.lock | diff -q - tmp/yarn.lock >/dev/null;then
    :
else
    echo 'yarn install...'
    rm -rf node_modules
    yarn
    ${NODE} -v | cat - yarn.lock >tmp/yarn.lock
fi

echo -e "bundle client: css, js..."

$NODE --es_staging scripts/bundle.js $branch >/dev/null

mv build/index.css app

cd app

echo "Compressing..."

gzip -k index.css index.html


echo "archiving..."

cd ..

tarfile=$PWD/tmp/piki-$branch-$version.tar.gz
if [ ! -e $tarfile -a -e tmp/piki-current.tar.gz ];then
    rm -f tmp/piki-previous.tar.gz
    mv -f tmp/piki-current.tar.gz tmp/piki-previous.tar.gz
fi
tar -c -z \
    --exclude="*app/**/*-test.js" \
    --file  $tarfile\
    app config db build node_modules \
    LICENSE README.md .koru yarn.lock package.json scripts

cd tmp
ln -sf $(basename $tarfile) piki-current.tar.gz

scp piki-current.tar.gz ${KORU_DEST_SERVER}:/u/tmp
staging=/u/app/piki/staging
ssh ${KORU_DEST_SERVER} "
set -e
rm -rf $staging
mkdir -p $staging
cd $staging
tar xf /u/tmp/piki-current.tar.gz
exec ./scripts/install-piki $branch
"
