#!/bin/bash
. `dirname $0`/environ.sh

export METEOR_SETTINGS='{"public": {"version": "'`cat /u/app/${branch}/version`'"}}'

daemon -P /u/run -n ${branch} -O /u/log/${branch}.log -E /u/run/${branch}.log -D /u/app/${branch} -- ${meteor}/bin/node main.js
