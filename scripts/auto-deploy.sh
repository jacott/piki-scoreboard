#!/bin/bash
set -e

topdir=`pwd`
if test ! -e app/.meteor;then
    echo "First change to the toplevel directory to run this command"
    exit 1
fi

while [ 1 ];do
    git fetch -q
    if git status -sb | grep -q '\[behind';then
        git pull --force
        scripts/deploy.sh `git status -bs|sed 's/## //'`
    fi
    sleep 5
done
