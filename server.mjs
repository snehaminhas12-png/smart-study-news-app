import http from 'node:http';
import { readFile } from 'node:fs/promises';
import { extname, join, normalize } from 'node:path';
import { fileURLToPath } from 'node:url';
const root = fileURLToPath(new URL('.', import.meta.url));
const types = { '.html':'text/html; charset=utf-8','.css':'text/css; charset=utf-8','.js':'text/javascript; charset=utf-8','.json':'application/json; charset=utf-8','.svg':'image/svg+xml' };
const server = http.createServer(async (req,res) => {
  const pathname = decodeURIComponent(new URL(req.url, 'http://localhost').pathname);
  if (pathname.startsWith('/api/')) { res.writeHead(404,{'Content-Type':'application/json'});res.end(JSON.stringify({error:'Set up the Cloudflare Worker API to enable Gemini.'}));return; }
  let path = normalize(join(root, pathname));
  if (!path.startsWith(root)) { res.writeHead(403);res.end('Forbidden');return; }
  try { let data; try { data=await readFile(path); } catch { data=await readFile(join(root,'index.html'));path=join(root,'index.html'); } res.writeHead(200,{'Content-Type':types[extname(path)]||'application/octet-stream','Cache-Control':'no-cache'});res.end(data); }
  catch { res.writeHead(500);res.end('Unable to read site files.'); }
});
const port=Number(process.env.PORT||3000);server.listen(port,()=>console.log(`Daylight is ready at http://localhost:${port}/login`));
