export KORU_PORT=3500
export KORU_HOSTNAME=piki.vimaly.com

export KORU_DEST_SERVER=app@$KORU_HOSTNAME
export APP_MAILURL="smtp://app:$(cat /u/private/intra-authtoken.txt)@mail.${APP_MAILDOMAIN}:465"
