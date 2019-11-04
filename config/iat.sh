# -*- mode: shell-script -*-

export KORU_DB=pikidemo
export APP_URL=http://${APP_DOMAIN}
export APP_MAILURL=""

if [[ -e build/version.sh ]]; then
    . build/version.sh
fi
