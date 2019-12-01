export KORU_PORT=3500
export APP_DOMAIN=piki.vimaly.com
export KORU_DB=piki

export KORU_DEST_SERVER=app@piki-prod
export APP_MAILURL="smtp://app:$(cat /u/private/intra-authtoken.txt)@mail.${APP_MAILDOMAIN}:465"
