# -*- mode: shell-script -*-
TMPDIR=/tmp

export APP_DOMAIN=test.piki;
export APP_URL=http://${APP_DOMAIN}
export KORU_DB=pikitest
export APP_MAILURL=""

export KORU_LOG_DIR=${TMPDIR}
export BACKUP_DIR=${TMPDIR}/korubackup
