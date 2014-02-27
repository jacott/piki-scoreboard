set -e

cd `dirname "$0"`/..
topdir=$PWD
tmpdir=$topdir/tmp

branch=$1
. config/${branch}.cfg

if test ! -e app/.meteor;then
    echo "First change to the toplevel directory to run this command: ($0)"
    exit 1
fi

mkdir -p $tmpdir
