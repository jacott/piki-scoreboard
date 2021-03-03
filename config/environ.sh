#!/bin/bash
set -e

export KORU_APP_NAME=piki
export KORU_HOME=$(readlink -fm "$0"/../..)
export TZ=UTC
export LANG="en_US"
export LANGUAGE="en_US:en"
export LC_ALL="en_US.UTF-8"

export NODE=/u/node-v12.21.0-linux-x64/bin/node

case "$1" in
    "demo" | "test" | "check")
        if [[ ! -e $KORU_HOME/node_modules ]]; then
            (cd $KORU_HOME && PATH=${NODE%/*}:$PATH npm ci)
            KORU_MODULES_OKAY=1
        else
            unset KORU_MODULES_OKAY
        fi;;
esac

export BACKUP_DIR=/u/backup
export APP_DOMAIN=$(hostname -f)
export APP_DISPLAY_NAME=Piki

export APP_MAILDOMAIN=vimaly.com
export APP_MAILURL=setup

. $KORU_HOME/node_modules/koru/lib/koru-env.sh "$@"

export APP_URL=${APP_URL-https://${APP_DOMAIN}}

if [[ $APP_MAILURL = setup ]]; then
    APP_MAILURL="smtp://app:$(cat /u/private/intra-authtoken.txt)@mail.${APP_MAILDOMAIN}:465"
fi
