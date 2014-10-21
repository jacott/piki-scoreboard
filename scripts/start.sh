#!/bin/bash
. `dirname $0`/environ.sh

init ${1-$(basename $PWD)}

daemon -P /u/run -n ${branch} -O /u/log/${branch}.log -E /u/log/${branch}.log -D /u/app/${branch}/current/app -- $NODE ../node_modules/koru/lib/koru.js "$branch"
