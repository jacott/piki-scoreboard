#!/bin/bash
set -e
test "$2" = "nochdir" || cd `dirname "$0"`/..

function abort {
    echo $*
    exit 1
}

test -e .koru || abort "First change to the toplevel directory to run this command: ($0)"

export NODE=/u/node-v10.14.0-linux-x64/bin/node

export TZ=UTC
export KORU_APP_NAME=piki
export KORU_HOSTNAME=${HOSTNAME-$(hostname -f)}
export KORU_PORT=3000
export KORU_HOME=$PWD
export KORU_MODULE=$(readlink -f node_modules/koru)

export BACKUP_DIR=/u/backup

export APP_MAILDOMAIN=vimaly.com
export APP_DISPLAY_NAME=Piki

tmpdir=$KORU_HOME/tmp
branch=${branch-${1-demo}}
export APP_ENV=$branch
[ -e config/${branch}.sh ] && . config/${branch}.sh

export APP_DOMAIN=${APP_DOMAIN:-$KORU_HOSTNAME}
export NODE_PATH=$(dirname $NODE)

export LOG_DIR=${LOG_DIR-/u/log}
export APP_NAME=${APP_NAME-$KORU_APP_NAME}

export APP_URL=${APP_URL-https://${APP_DOMAIN}}
export PATH=${NODE_PATH}:/bin:/usr/bin:/sbin:/usr/sbin
export APP_DB=${APP_DB-$APP_NAME}

export KORU_LOG_DIR=$LOG_DIR

[[ $(typeset -F run_after_init) ]] && run_after_init "$@"

if [[ ! -d $LOG_DIR ]];then
    echo "no log dir: $LOG_DIR"
    exit 1
fi

if [ "$2" = "--config" ];then
    env|grep -e '^\(APP\|KORU\)_'
    echo -e "NODE=$NODE\nNODE_PATH=$NODE_PATH"
    exit 0
fi
