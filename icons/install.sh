#!/bin/bash
set -e

cd "${0%/*}"
rm -rf build
mkdir build
node ./make-font.js $(cd svg && ls)
cd ../app/public
rm -f app-icons-*.woff2
mv ~-/build/app-icons-*.woff2 .
name=$(echo app-icons-*.woff2)
echo $name
cd ../ui
cat >app-icons-family.css <<EOF
@font-face {
  font-display: block;
  font-family: 'App icons';
  src: url('/public/${name}') format('woff2');
}
EOF
cd ..
cp service-worker.js service-worker.js~
sed <service-worker.js~ >service-worker.js "s/const APP_ICONS_WOFF2.*;/const APP_ICONS_WOFF2 = '\/public\/${name}';/"
