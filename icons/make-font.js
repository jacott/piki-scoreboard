const fs = require('fs');

const crypto = require('crypto');
const Svgicons2svgfont = require('svgicons2svgfont');
const svg2ttf = require('svg2ttf');
const wawoff = require('wawoff2');

const fontStream = new Svgicons2svgfont({fontName: 'app icons', fontHeight: 2000, normalize: true});

let svg = '';

fontStream
  .on('data', chunk =>{svg += chunk.toString()})
  .on('finish', ()=>{
    const md5sum = crypto.createHash('md5');
    const ttf = svg2ttf(svg, {ts: 0}).buffer;
    md5sum.update(ttf);

    wawoff.compress(ttf).then(woff2 => {
      fs.writeFileSync("build/app-icons-"+md5sum.digest('hex')+".woff2", woff2);
    }, error => {
      console.log(error);
    });
  })
  .on('error',err =>{console.log(err)});

process.argv.slice(2).forEach(name =>{
  const glyph = fs.createReadStream("svg/"+name);
  name = name.replace(/[-\/]/g, '_').replace(/\.svg$/, '');
  glyph.metadata = {
    unicode: [name],
    name: name,
  };
  console.log('name', name);

  fontStream.write(glyph);
});

fontStream.end();
