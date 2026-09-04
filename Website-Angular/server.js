const express = require('express');
const path = require('path');
const { ngExpressEngine } = require('@nguniversal/express-engine');
const { provideModuleMap } = require('@nguniversal/module-map-ngfactory-loader');

// Import the Angular SSR exports
const { AppServerModule, renderModule, ɵSERVER_CONTEXT } = require('./dist/beute-pro/server/main.server.mjs');

const app = express();
const PORT = process.env.PORT || 4000;

// Serve static files from the browser directory
app.use(express.static(path.join(__dirname, 'dist/beute-pro/browser'), {
  maxAge: '1y',
  index: false
}));

// Handle all routes with Angular SSR
app.get('*', async (req, res) => {
  const protocol = req.protocol;
  const host = req.get('host');
  const url = `${protocol}://${host}${req.originalUrl}`;
  
  try {
    const html = await renderModule(AppServerModule, {
      url,
      document: '<app-root></app-root>',
      extraProviders: [
        { provide: ɵSERVER_CONTEXT, useValue: 'ssr' }
      ]
    });
    res.send(html);
  } catch (error) {
    console.error('SSR Error:', error);
    // Fallback to serving the browser index.html
    res.sendFile(path.join(__dirname, 'dist/beute-pro/browser/index.html'));
  }
});

app.listen(PORT, () => {
  console.log(`Server listening on port ${PORT}`);
});