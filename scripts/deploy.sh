#!/bin/bash
set -e
cd `dirname "$0"`/..

uglify=`npm bin`/uglifyjs

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

echo -e "bundle client: css, js..."

$NODE --es_staging scripts/bundle.js $branch >/dev/null

MD5SUM=$(cat node_modules/yaajs/yaa.js config/$branch-config.js build/index.js \
                 build/index.css app/index.html|md5sum -b)
MD5SUM=${MD5SUM/ */}

cp app/index.html build/
sed <build/index.html >app/index.html "s/CACHE_BUST_HASH/$MD5SUM/g"

echo "$version,$MD5SUM" >build/version

mv build/index.css app

cd app

echo "Compressing..."

${uglify} <../build/index.js --safari10 --define isClient=true --define isServer=false -m -o index.js
gzip -k index.css index.html index.js


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
    LICENSE README.md .koru ${PKG_LOCK} package.json scripts

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
