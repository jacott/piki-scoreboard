#!/bin/bash
set -e

. `dirname $0`/environ.sh

${meteor}/mongodb/bin/mongod --shutdown --dbpath /u/pikidb
