# -*- mode: shell-script -*-

export APP_DB=pikidemo
export APP_URL=http://${APP_DOMAIN}
export APP_MAILURL=""

export BACKUP_DIR=/tmp/korubackup
export LOG_DIR=/tmp
export NODE=`type -p node`
if [[ -e build/version.sh ]]; then
    . build/version.sh
fi
