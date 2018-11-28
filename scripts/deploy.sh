#!/bin/bash
set -e
cd `dirname "$0"`/..

branch="$1"

lockKey=$branch

. config/environ.sh
. scripts/script-helper

cd /u/build-piki

mkdir -p build
rm -f build/*

[[ -d tmp ]] || mkdir tmp

git clean -f -d
git fetch
git reset --hard
git checkout -B ${2-master} origin/${2-master}

version=`git describe --tags --always --long --match 'v*'`

echo $branch $version $PWD

PKG_LOCK=npm-shrinkwrap.json

if test -e tmp/${PKG_LOCK} && ${NODE} -v | cat - ${PKG_LOCK} | diff -q - tmp/${PKG_LOCK} >/dev/null;then
    :
else
    echo 'npm install...'
    rm -rf node_modules
    npm i
    ${NODE} -v | cat - ${PKG_LOCK} >tmp/${PKG_LOCK}
fi

echo "bundle client: css, js..."

$NODE --es_staging scripts/bundle.js $branch

echo "Compressing..."

MD5SUM=$(cat node_modules/yaajs/yaa.js config/$branch-config.js build/index.js \
                 build/index.css app/index.html|md5sum -b)
MD5SUM=${MD5SUM/ */}

cp app/index.html build/
sed <build/index.html >app/index.html "s/CACHE_BUST_HASH/$MD5SUM/g"

echo "$version,$MD5SUM" >build/version

printf "window.KORU_APP_VERSION='%s,%s';\n" $version $MD5SUM |
    cat - build/index.js >app/index.js

mv build/index.css app

cd app

gzip -9 -k index.css index.html index.js

echo "archiving..."

cd $tmpdir

tarfile=$tmpdir/piki-$branch-$version.tar.gz
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
exec ./scripts/install-piki $branch
"
