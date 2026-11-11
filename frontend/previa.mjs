import { createServer } from 'node:http';
import { readFile } from 'node:fs/promises';
import { resolve, extname, sep } from 'node:path';
import { fileURLToPath } from 'node:url';
const root = fileURLToPath(new URL('./dist/frontend/browser', import.meta.url));
const types = {'.html':'text/html; charset=utf-8','.js':'text/javascript','.css':'text/css','.svg':'image/svg+xml','.webp':'image/webp','.png':'image/png','.ico':'image/x-icon','.woff2':'font/woff2'};
const server = createServer(async(req,res)=>{
  if(req.method!=='GET'){res.writeHead(405).end();return;}
  try {
    const pathname=decodeURIComponent(new URL(req.url,'http://localhost').pathname);
    const file=resolve(root,extname(pathname)?'.'+pathname:'index.html');
    if(!file.startsWith(root+sep)){res.writeHead(404).end();return;}
    const data=await readFile(file);
    res.writeHead(200,{'Content-Type':types[extname(file)] ?? 'application/octet-stream','Cache-Control':'no-store'}).end(data);
  } catch {res.writeHead(404).end('Arquivo não encontrado.');}
});
server.on('error',e=>{console.error(e.code==='EADDRINUSE'?'A porta 4200 já está em uso. Feche a outra prévia e tente novamente.':e.message);process.exitCode=1;});
server.listen(4200,'127.0.0.1',()=>console.log('DaMatch: http://localhost:4200 · Para encerrar: Ctrl+C'));
