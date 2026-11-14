import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import fs from 'fs';
import path from 'path';

function cameraConfigSyncPlugin() {
  return {
    name: 'camera-config-sync',
    configureServer(server) {
      server.middlewares.use((req, res, next) => {
        if (req.url === '/api/camera-config' && req.method === 'POST') {
          let body = '';
          req.on('data', (chunk) => { body += chunk; });
          req.on('end', () => {
            try {
              const configPath = path.resolve(process.cwd(), 'camera_config.json');
              const parsed = JSON.parse(body || '{}');
              fs.writeFileSync(configPath, JSON.stringify(parsed, null, 2), 'utf-8');
              res.setHeader('Content-Type', 'application/json');
              res.end(JSON.stringify({ success: true, saved: parsed }));
            } catch (err) {
              res.statusCode = 500;
              res.end(JSON.stringify({ error: err.message }));
            }
          });
          return;
        } else if (req.url === '/api/camera-config' && req.method === 'GET') {
          const configPath = path.resolve(process.cwd(), 'camera_config.json');
          res.setHeader('Content-Type', 'application/json');
          if (fs.existsSync(configPath)) {
            res.end(fs.readFileSync(configPath, 'utf-8'));
          } else {
            res.end(JSON.stringify({ index: 1, name: 'Logi C270 HD WebCam' }));
          }
          return;
        }
        next();
      });
    }
  };
}

export default defineConfig({
  plugins: [react(), cameraConfigSyncPlugin()],
  server: {
    port: 3000,
    open: false,
    host: true,
  },
});
