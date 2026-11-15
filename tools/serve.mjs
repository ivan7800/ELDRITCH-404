import { createServer } from 'node:http';
import { readFile } from 'node:fs/promises';
import { extname, resolve, sep } from 'node:path';
import { spawn } from 'node:child_process';
import { fileURLToPath } from 'node:url';
const root = resolve(process.cwd(),process.env.ELDRITCH_WEB_ROOT || '.');
const port = process.env.PORT ? Number(process.env.PORT) : 4040;
const types = { '.html':'text/html; charset=utf-8', '.css':'text/css; charset=utf-8', '.js':'text/javascript; charset=utf-8',
  '.mjs':'text/javascript; charset=utf-8', '.png':'image/png', '.webmanifest':'application/manifest+json' };
export const server = createServer(async (req,res) => {
  try {
    const pathname = decodeURIComponent(new URL(req.url,'http://localhost').pathname);
    let file = resolve(root,'.'+pathname);
    if (pathname.endsWith('/')) file = resolve(file,'index.html');
    if (!file.startsWith(root+sep) || !types[extname(file)]) { res.writeHead(404).end(); return; }
    const content = await readFile(file);
    res.writeHead(200,{'Content-Type':types[extname(file)],'Cache-Control':'no-cache'}).end(content);
  } catch { res.writeHead(404).end('Not found'); }
});
if (process.argv[1] && resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
  server.listen(port,'127.0.0.1',() => {
    const url = 'http://127.0.0.1:'+server.address().port;
    console.log(url);
    if (process.argv.includes('--open')) {
      const command = process.platform === 'win32' ? ['rundll32.exe','url.dll,FileProtocolHandler',url] :
        process.platform === 'darwin' ? ['open',url] : ['xdg-open',url];
      spawn(command[0],command.slice(1),{stdio:'ignore',detached:true}).on('error',()=>{}).unref();
    }
  });
}
