#!/bin/bash
. `dirname $0`/environ.sh

version=`git describe --always`

echo "deploying $branch, $version"

cd app

bundle=$tmpdir/$branch.tar.gz
branchOld=/u/app/${branch}.old
branchCurrent=/u/app/${branch}
branchNew=/u/app/${branch}.new

echo "" >packages/bart/plugin/mode.js

${meteor}/bin/meteor bundle $bundle

rm -rf $branchOld $branchNew
mkdir -p $branchNew
cd $branchNew
tar xf $bundle

echo "$branch, $version" >$branchNew/bundle/version
if test -e $topdir/config/$branch.js;then
    cp $topdir/config/$branch.js $branchNew/bundle/config.js
fi

if test -e $branchCurrent;then
    $topdir/scripts/stop.sh $branch || echo "not running"
    mv $branchCurrent $branchOld
fi

mv $branchNew/bundle $branchCurrent

if [ -e /u/staging/$branch/scripts/backup-$branch ];then
    echo "backing up"
    /u/staging/$branch/scripts/backup-$branch
fi

echo "starting"
$topdir/scripts/start.sh $branch

echo "deployed successfully"
