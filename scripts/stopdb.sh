#!/bin/bash
set -e

. `dirname "$0"`/environ.sh
init ${1-$(basename $PWD)}

mongod --shutdown --dbpath $MONGO_DIR
