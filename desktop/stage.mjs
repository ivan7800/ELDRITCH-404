import { copyFile } from 'node:fs/promises';
const root = new URL('../',import.meta.url);
for (const [source,target] of [['ELDRITCH-404.html','game.html'],['assets/icon-512.png','icon.png'],
  ['assets/icon.ico','icon.ico'],['LICENSE','LICENSE']]) {
  await copyFile(new URL(source,root),new URL(target,import.meta.url));
}
