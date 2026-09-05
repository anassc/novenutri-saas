import { defineConfig, loadEnv } from 'vite';
import react from '@vitejs/plugin-react';
import path from 'path';
import { handleGerarPlano } from './api/gerar-plano';
import { handleSolicitarRecuperacao, handleRedefinirSenha } from './api/auth-recovery';

// https://vitejs.dev/config/
export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, process.cwd(), '');

  return {
    plugins: [
      react(),
      {
        name: 'api-auth-middleware',
        configureServer(server) {
          // 1. AI Meal Plan Endpoint
          server.middlewares.use('/api/gerar-plano', async (req, res, next) => {
            if (req.method === 'POST') {
              let bodyStr = '';
              req.on('data', (chunk) => {
                bodyStr += chunk;
              });
              req.on('end', async () => {
                try {
                  const body = bodyStr ? JSON.parse(bodyStr) : {};
                  const loadedEnv = loadEnv(server.config.mode || mode, process.cwd(), '');
                  const mergedEnv = { ...process.env, ...env, ...loadedEnv };
                  const result = await handleGerarPlano(body, mergedEnv);
                  res.setHeader('Content-Type', 'application/json');
                  if (result.success) {
                    res.statusCode = 200;
                    res.end(JSON.stringify(result.data));
                  } else {
                    res.statusCode = 500;
                    res.end(JSON.stringify({ error: result.error }));
                  }
                } catch (err: any) {
                  res.statusCode = 500;
                  res.setHeader('Content-Type', 'application/json');
                  res.end(JSON.stringify({ error: err.message || 'Server error' }));
                }
              });
            } else {
              next();
            }
          });

          // 2. Password Recovery Request Endpoint
          server.middlewares.use('/api/solicitar-recuperacao', async (req, res, next) => {
            if (req.method === 'POST') {
              let bodyStr = '';
              req.on('data', (chunk) => {
                bodyStr += chunk;
              });
              req.on('end', async () => {
                try {
                  const body = bodyStr ? JSON.parse(bodyStr) : {};
                  const host = req.headers.host || 'localhost:3000';
                  const protocol = req.headers['x-forwarded-proto'] || 'http';
                  const baseUrl = `${protocol}://${host}`;
                  const result = await handleSolicitarRecuperacao(body, baseUrl);
                  res.setHeader('Content-Type', 'application/json');
                  res.statusCode = result.success ? 200 : 400;
                  res.end(JSON.stringify(result));
                } catch (err: any) {
                  res.statusCode = 500;
                  res.setHeader('Content-Type', 'application/json');
                  res.end(JSON.stringify({ success: false, error: err.message || 'Server error' }));
                }
              });
            } else {
              next();
            }
          });

          // 3. Password Reset Execution Endpoint
          server.middlewares.use('/api/redefinir-senha', async (req, res, next) => {
            if (req.method === 'POST') {
              let bodyStr = '';
              req.on('data', (chunk) => {
                bodyStr += chunk;
              });
              req.on('end', async () => {
                try {
                  const body = bodyStr ? JSON.parse(bodyStr) : {};
                  const result = await handleRedefinirSenha(body);
                  res.setHeader('Content-Type', 'application/json');
                  res.statusCode = result.success ? 200 : 400;
                  res.end(JSON.stringify(result));
                } catch (err: any) {
                  res.statusCode = 500;
                  res.setHeader('Content-Type', 'application/json');
                  res.end(JSON.stringify({ success: false, error: err.message || 'Server error' }));
                }
              });
            } else {
              next();
            }
          });
        },
      },
    ],
    resolve: {
      alias: {
        '@': path.resolve(__dirname, './src'),
      },
    },
    server: {
      port: 3000,
      open: true,
    },
  };
});


