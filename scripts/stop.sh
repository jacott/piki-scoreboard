#!/bin/bash
. `dirname $0`/environ.sh

init ${1-$(basename $PWD)}

if daemon --running -P /u/run -n ${branch};then
    daemon --stop -P /u/run -n ${branch}
    sleep .2
    while daemon --running -P /u/run -n ${branch};do
        sleep 1
    done
else
    exit 0
fi
