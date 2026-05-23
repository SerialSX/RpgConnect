import fs from 'fs';
import path from 'path';

const assetsDir = path.resolve('src/assets');
const sourceFile = path.join(assetsDir, 'icone_logo.png');
const destFile = path.join(assetsDir, 'logo_connect.png');

if (fs.existsSync(sourceFile)) {
  fs.copyFileSync(sourceFile, destFile);
  console.log(`Copied real logo from icone_logo.png to logo_connect.png`);
} else {
  console.error(`Source file ${sourceFile} does not exist!`);
}
