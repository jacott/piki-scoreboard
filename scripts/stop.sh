#!/bin/bash
. `dirname $0`/environ.sh

daemon --stop -P /u/run -n ${1}
