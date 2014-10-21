set -e
cd `dirname "$0"`/..

function abort {
    echo $*
    exit 1
}

test -e .koru || abort "First change to the toplevel directory to run this command: ($0)"

export KORU_HOME=$PWD

tmpdir=$KORU_HOME/tmp
if [ ! -e "$tmpdir" ];then
    mkdir -p "$tmpdir"
fi

function init {
    test "$1" = "" && usage "environment not specified"
    branch=$1
    if [ $branch = current ];then
        branch=$(basename $(dirname $PWD))
    fi
    . config/${branch}.cfg

    if [ "$LOG_DIR" = "" ];then
        LOG_DIR=/u/log
    fi

    if [ ! -d "$LOG_DIR" ];then
        echo "no log dir: $LOG_DIR"
        exit 1
    fi
}
