// Sert seulement le site compilé (dossier dist) sur le réseau local, pour l'ouvrir depuis un
// téléphone connecté au même wifi. Ce n'est pas le serveur de l'atelier : il n'a aucune API,
// il ne lit ni n'écrit rien, il envoie seulement les fichiers de dist.
import { createServer } from 'node:http';
import { readFile } from 'node:fs/promises';
import { networkInterfaces } from 'node:os';
import path from 'node:path';

const root = path.resolve('dist');
const port = Number(process.env.PORT ?? 4311);
const types = {
  '.html': 'text/html; charset=utf-8',
  '.js': 'text/javascript; charset=utf-8',
  '.css': 'text/css; charset=utf-8',
  '.json': 'application/json; charset=utf-8',
  '.svg': 'image/svg+xml',
  '.png': 'image/png',
  '.jpg': 'image/jpeg',
  '.jpeg': 'image/jpeg',
  '.webp': 'image/webp',
  '.woff2': 'font/woff2',
};

const server = createServer(async (req, res) => {
  try {
    const pathname = decodeURIComponent(
      new URL(req.url ?? '/', 'http://x').pathname,
    );
    const wanted = pathname === '/' ? '/index.html' : pathname;
    const file = path.resolve(path.join(root, wanted));
    if (file !== root && !file.startsWith(root + path.sep)) {
      res.writeHead(403).end('Refusé');
      return;
    }
    const body = await readFile(file);
    res.writeHead(200, {
      'Content-Type': types[path.extname(file)] ?? 'application/octet-stream',
      'X-Content-Type-Options': 'nosniff',
    });
    res.end(body);
  } catch {
    res.writeHead(404).end('Introuvable');
  }
});

server.listen(port, '0.0.0.0', () => {
  const addresses = Object.values(networkInterfaces())
    .flat()
    .filter((i) => i && i.family === 'IPv4' && !i.internal)
    .map((i) => i.address);
  console.log('Site Nostromo disponible sur le réseau local :');
  for (const a of addresses) console.log(`  http://${a}:${port}`);
  console.log('Ctrl+C pour arrêter. Pense à lancer npm run build avant.');
});
