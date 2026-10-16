const { spawn } = require('node:child_process');
const { randomBytes } = require('node:crypto');
const http = require('node:http');
const path = require('node:path');
const net = require('node:net');

const startBackend = async (t, extraEnvironment = {}) => {
  const databaseUrl = process.env.MEDIA_TEST_DATABASE_URL;
  if (!databaseUrl) throw new Error('MEDIA_TEST_DATABASE_URL is required');
  const database = new URL(databaseUrl);
  if (!['127.0.0.1', 'localhost'].includes(database.hostname)
    || database.pathname !== '/beute_media_test') throw new Error('Use a disposable local media test database');

  // Keep startup's currency request local as well; tests never call real providers.
  const rateServer = http.createServer((_req, res) => {
    res.setHeader('content-type', 'application/json');
    res.end(JSON.stringify({ rates: { USD: 0.0036, AED: 0.0132 } }));
  });
  await new Promise((resolve) => rateServer.listen(0, '127.0.0.1', resolve));
  const listener = net.createServer();
  await new Promise((resolve) => listener.listen(0, '127.0.0.1', resolve));
  const port = listener.address().port;
  await new Promise((resolve) => listener.close(resolve));
  const jwtSecret = randomBytes(32).toString('hex');
  const child = spawn(process.execPath, ['src/index.js'], {
    cwd: path.join(__dirname, '../..'),
    windowsHide: true,
    env: {
      ...process.env,
      DATABASE_URL: databaseUrl,
      PORT: String(port),
      NODE_ENV: 'test',
      JWT_SECRET: jwtSecret,
      SESSION_SECRET: randomBytes(32).toString('hex'),
      GOOGLE_CLIENT_ID: '',
      GOOGLE_CLIENT_SECRET: '',
      EMAIL_ENABLED: 'false',
      R2_ACCESS_KEY_ID: '',
      FRONTEND_URL: 'http://localhost:4200',
      BACKEND_URL: `http://127.0.0.1:${port}`,
      EXCHANGE_RATE_API_URL: `http://127.0.0.1:${rateServer.address().port}`,
      ...extraEnvironment,
    },
    stdio: ['ignore', 'pipe', 'pipe'],
  });
  let output = '';
  child.stdout.on('data', (data) => { output += data.toString(); });
  child.stderr.on('data', (data) => { output += data.toString(); });
  t.after(async () => {
    if (child.exitCode === null) {
      child.kill();
      await new Promise((resolve) => child.once('exit', resolve));
    }
    await new Promise((resolve) => rateServer.close(resolve));
  });
  await new Promise((resolve, reject) => {
    const timeout = setTimeout(() => reject(new Error(`Test backend startup timed out: ${output}`)), 15000);
    const onData = () => {
      if (output.includes('backend running on')) {
        clearTimeout(timeout);
        resolve();
      }
    };
    child.stdout.on('data', onData);
    child.once('error', (error) => { clearTimeout(timeout); reject(error); });
    child.once('exit', (code) => {
      clearTimeout(timeout);
      reject(new Error(`Test backend exited (${code}): ${output}`));
    });
  });
  return { base: `http://127.0.0.1:${port}`, jwtSecret };
};

module.exports = { startBackend };
