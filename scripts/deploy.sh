#!/bin/bash
set -e

. "${0%/*}"/../config/environ.sh $1

extraCleanup() {
    :
}

cleanup() {
    extraCleanup
    rm -f $lock
}

tmpdir=/u/build-piki/tmp
mkdir -p $tmpdir

lock="${tmpdir}/lock-piki"

if [ -e $lock ];then
    echo >&2 "deploy in progress: pid $(cat $lock)"
    exit 1
fi

echo >${lock} $$

trap cleanup 0

builddir=/u/build-piki
cd $builddir

mkdir -p build
rm -f build/*

[[ -d tmp ]] || mkdir tmp

git clean -f -d
git fetch
git reset --hard
git checkout -B ${2-master} origin/${2-master}

version=`git describe --tags --always --long --match 'v*'`

echo $KORU_ENV $version $PWD

PKG_LOCK=npm-shrinkwrap.json

if [[ -e package-node.test && -e node_modules ]] && ${NODE} -v |
           cat - ${PKG_LOCK} | diff -q - package-node.test >/dev/null;then
    :
else
    echo 'npm install...'
    PATH=${NODE%/*}:$PATH npm ci
    ${NODE} -v | cat - ${PKG_LOCK} >package-node.test
fi

echo "bundle client: css, js..."

MD5SUM=$(md5sum -b <app/index.html)
MD5SUM=${MD5SUM/ */}

export KORU_APP_VERSION=$(printf "%s,%s" $version $MD5SUM/)

scripts/bundle $KORU_ENV >/dev/null

echo "Compressing..."

IFS="," read -ra va <build/version.sh || true
hash="${va[1]}"

mv app/index.html build/
sed <build/index.html >app/index.html "s/CACHE_BUST_HASH/$hash/g"

cp build/version.sh config/version.sh

mv build/index.{css,js} app/

cd $builddir/app
gzip -9 -k index.css index.html index.js

echo "archiving..."

cd $tmpdir

tarfile=$tmpdir/piki-$KORU_ENV-$version.tar.gz
if [ ! -e $tarfile -a -e piki-current.tar.gz ];then
    rm -f piki-previous.tar.gz
    mv -f piki-current.tar.gz piki-previous.tar.gz
    rm -f $(find -L . ! -newer piki-previous.tar.gz \
                 ! -samefile piki-previous.tar.gz \
                 -name 'piki*-v*.tar.gz')
fi
tar -c -z -C /u/build-piki \
    --exclude="*app/**/*-test.js" \
    --file  $tarfile\
    app config db build node_modules \
    LICENSE README.md .koru ${PKG_LOCK} package.json npm-shrinkwrap.json \
    scripts

ln -sf $(basename $tarfile) piki-current.tar.gz

scp piki-current.tar.gz ${KORU_DEST_SERVER}:/u/tmp
staging=/u/app/piki/staging
ssh ${KORU_DEST_SERVER} "
set -e
rm -rf $staging
mkdir -p $staging
cd $staging
tar xf /u/tmp/piki-current.tar.gz
exec ./scripts/install-piki $KORU_ENV
"
