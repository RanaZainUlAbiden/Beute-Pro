import express from 'express';
import http from 'node:http';
import https from 'node:https';
import { join } from 'node:path';

const app = express();
const browserDirectory = join(import.meta.dirname, 'dist/beute-pro/browser');
const backendUrl = process.env.BACKEND_INTERNAL_URL;
if (!backendUrl) throw new Error('BACKEND_INTERNAL_URL is required');
const backend = new URL(backendUrl);
if (!['http:', 'https:'].includes(backend.protocol)) throw new Error('Invalid backend protocol');

app.disable('x-powered-by');
app.get('/healthz', (_req, res) => res.json({ status: 'OK' }));

// Keep browser requests on one origin; reach the API over Railway private networking.
app.use('/api', (req, res) => {
  const target = new URL(req.originalUrl, backend);
  const transport = target.protocol === 'https:' ? https : http;
  const headers = { ...req.headers, host: target.host };
  headers['x-forwarded-host'] = req.headers.host;
  headers['x-forwarded-proto'] = req.headers['x-forwarded-proto'] || 'https';
  const upstream = transport.request(target, { method: req.method, headers }, (response) => {
    res.writeHead(response.statusCode || 502, response.headers);
    response.pipe(res);
  });
  upstream.setTimeout(30000, () => upstream.destroy(new Error('API request timed out')));
  upstream.on('error', (error) => {
    console.error('API proxy failed:', error.message);
    if (!res.headersSent) res.status(502).json({ error: 'API temporarily unavailable' });
    else res.destroy();
  });
  req.on('aborted', () => upstream.destroy());
  req.pipe(upstream);
});

// Angular's static output includes prerendered route directories and a CSR fallback.
app.use(express.static(browserDirectory, { extensions: ['html'], maxAge: '1h' }));
app.get('/{*path}', (_req, res) => {
  res.sendFile(join(browserDirectory, 'index.csr.html'));
});
app.listen(Number(process.env.PORT || 4000), '::', () => console.log('Frontend listening'));
