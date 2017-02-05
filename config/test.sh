# -*- mode: shell-script -*-
TMPDIR=/dev/shm
if [[ ! -d $TMPDIR ]];then
    TEMPDIR=/tmp
fi

export APP_DOMAIN=test.piki;
export APP_URL=http://${APP_DOMAIN}
export APP_DB=pikitest
export APP_MAILURL=""

export LOG_DIR=${TMPDIR}
export BACKUP_DIR=${TMPDIR}/korubackup
export NODE=`type -p node`
