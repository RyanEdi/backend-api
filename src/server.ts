import dotenv from 'dotenv';
import path from 'path';
import { Request } from 'express';
import { createProxyMiddleware, fixRequestBody } from 'http-proxy-middleware';
import { resolvePort } from './config/http';
import { createBaseApp } from './shared/createBaseApp';
import cepRouter from './routesCep';

dotenv.config({ path: path.resolve(__dirname, '../.env') });

const app = createBaseApp({ withSession: true });
app.use('/api/consulta-cep', cepRouter);

const GATEWAY_PORT = resolvePort('PORT', 3333);

const AUTH_SERVICE_HOST = process.env.AUTH_SERVICE_HOST || 'localhost';
const CLIENTS_SERVICE_HOST = process.env.CLIENTS_SERVICE_HOST || 'localhost';
const PETITIONS_SERVICE_HOST = process.env.PETITIONS_SERVICE_HOST || 'localhost';

const AUTH_SERVICE_PORT = resolvePort('AUTH_SERVICE_PORT', 3334);
const CLIENTS_SERVICE_PORT = resolvePort('CLIENTS_SERVICE_PORT', 3335);
const PETITIONS_SERVICE_PORT = resolvePort('PETITIONS_SERVICE_PORT', 3336);

const authTarget = `http://${AUTH_SERVICE_HOST}:${AUTH_SERVICE_PORT}`;
const clientsTarget = `http://${CLIENTS_SERVICE_HOST}:${CLIENTS_SERVICE_PORT}`;
const petitionsTarget = `http://${PETITIONS_SERVICE_HOST}:${PETITIONS_SERVICE_PORT}`;

const attachIdentityHeaders = (
  proxyReq: { setHeader: (name: string, value: string) => void },
  req: Request
) => {
  const sessionUserId = (req.session as any)?.usuarioId;
  const isAdmin = (req.session as any)?.isAdmin;

  if (sessionUserId !== undefined) {
    proxyReq.setHeader('x-user-id', String(sessionUserId));
  }

  proxyReq.setHeader('x-user-admin', isAdmin ? 'true' : 'false');
};

app.use(
  '/api/auth',
  createProxyMiddleware({
    target: authTarget,
    changeOrigin: true,
    xfwd: true,
    pathRewrite: { '^/api/auth': '' },
    on: {
      proxyReq: fixRequestBody,
    },
  })
);

app.use(
  '/api/clients',
  createProxyMiddleware({
    target: clientsTarget,
    changeOrigin: true,
    xfwd: true,
    pathRewrite: { '^/': '/api/clients/' },
    on: {
      proxyReq: (proxyReq, req) => {
        attachIdentityHeaders(proxyReq as any, req as Request);
      },
    },
  })
);

app.use(
  '/api/casos',
  createProxyMiddleware({
    target: petitionsTarget,
    changeOrigin: true,
    xfwd: true,
    pathRewrite: { '^/': '/api/casos/' },
    on: {
      proxyReq: (proxyReq, req) => {
        attachIdentityHeaders(proxyReq as any, req as Request);
        fixRequestBody(proxyReq as any, req as Request);
      },
    },
  })
);

app.use(
  '/api/peticoes',
  createProxyMiddleware({
    target: petitionsTarget,
    changeOrigin: true,
    xfwd: true,
    pathRewrite: { '^/': '/api/peticoes/' },
    on: {
      proxyReq: (proxyReq, req) => {
        attachIdentityHeaders(proxyReq as any, req as Request);
        fixRequestBody(proxyReq as any, req as Request);
      },
    },
  })
);

app.use(
  '/api/eventos',
  createProxyMiddleware({
    target: petitionsTarget,
    changeOrigin: true,
    xfwd: true,
    pathRewrite: { '^/': '/api/eventos/' },
    on: {
      proxyReq: (proxyReq, req) => {
        attachIdentityHeaders(proxyReq as any, req as Request);
        fixRequestBody(proxyReq as any, req as Request);
      },
    },
  })
);

// Proxy para /admin/clients
app.use('/admin/clients', (req, res, next) => {
  console.log('[API-GATEWAY] Proxying /admin/clients', req.url, '->', authTarget + req.url);
  next();
});
app.use(
  '/admin/clients',
  createProxyMiddleware({
    target: authTarget, // Aponta para o auth-service
    changeOrigin: true,
    xfwd: true,
    pathRewrite: { '^/admin/clients': '/admin/clients' },
    on: {
      proxyReq: (proxyReq, req) => {
        attachIdentityHeaders(proxyReq as any, req as Request);
      },
    },
  })
);

app.use(
  '/api/petitions',
  createProxyMiddleware({
    target: petitionsTarget,
    changeOrigin: true,
    xfwd: true,
    pathRewrite: { '^/api/petitions': '', // Remove o prefixo /api/petitions
    },
    on: {
      proxyReq: (proxyReq, req) => {
        attachIdentityHeaders(proxyReq as any, req as Request);
      },
    },
  })
);
// Rota GET para o caminho raiz ('/')
app.get('/', (_req, res) => {
  res.send('API Gateway está rodando!');
});

app.get('/health', (_req, res) => {
  res.json({
    service: 'api-gateway',
    status: 'ok',
    timestamp: new Date().toISOString(),
    targets: {
      auth: authTarget,
      clients: clientsTarget,
      petitions: petitionsTarget,
    },
  });
});

async function startServer() {
  try {
    app.listen(GATEWAY_PORT, () => {
      console.log(`API Gateway running on port ${GATEWAY_PORT}`);
    });
  } catch (error) {
    console.error('Erro ao iniciar API Gateway:', error);
    process.exit(1);
  }
}

startServer();
