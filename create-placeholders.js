import fs from 'fs';
import path from 'path';

const assetsDir = path.resolve('src/assets');
const sourceFile = path.join(assetsDir, 'hero.png');

const missingAssets = [
  'icone_logo.png',
  'icone_botao_inicio.png',
  'icone_mapa.png',
  'chat_icon.png',
  'icone_perfil.png',
  'icone_grupos.png',
  'location_icon.png',
  'dices_icon.png',
  'cards_icon.png',
  'trophy_icon.png',
  'star_icon.png',
  'mountains_rpg.png'
];

if (!fs.existsSync(sourceFile)) {
  console.error(`Source file ${sourceFile} does not exist! Creating a tiny 1x1 transparent PNG placeholder...`);
  // If hero.png is not found, we can write a tiny 1x1 transparent PNG base64
  const base64Png = 'iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mNkYAAAAAYAAjCB0C8AAAAASUVORK5CYII=';
  fs.writeFileSync(sourceFile, Buffer.from(base64Png, 'base64'));
}

missingAssets.forEach(asset => {
  const destFile = path.join(assetsDir, asset);
  if (!fs.existsSync(destFile)) {
    fs.copyFileSync(sourceFile, destFile);
    console.log(`Created placeholder: ${asset}`);
  } else {
    console.log(`Asset already exists: ${asset}`);
  }
});

// Copy real logo to logo_connect.png to bust Vite/browser cache
const logoSource = path.join(assetsDir, 'icone_logo.png');
const logoDest = path.join(assetsDir, 'logo_connect.png');
if (fs.existsSync(logoSource)) {
  fs.copyFileSync(logoSource, logoDest);
  console.log(`Copied real logo from icone_logo.png to logo_connect.png to bust cache`);
}

