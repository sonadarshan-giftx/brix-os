import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import morgan from 'morgan';
import dotenv from 'dotenv';
import rateLimit from 'express-rate-limit';
import routes, { scimRouter } from './routes';

dotenv.config();
const app = express();
const PORT = process.env.PORT || 3002;
const NODE_ENV = process.env.NODE_ENV || 'development';

app.use(helmet({ contentSecurityPolicy: NODE_ENV === 'production', crossOriginEmbedderPolicy: false }));
app.use(cors({ origin: process.env.GATEWAY_URL || '*', credentials: true }));
app.use(morgan(NODE_ENV === 'production' ? 'combined' : 'dev'));
app.use(express.json({ limit: '10mb' }));
app.use(rateLimit({ windowMs: 15 * 60 * 1000, max: 200, standardHeaders: true, legacyHeaders: false }));

app.get('/health', (_, res) => res.json({ service: 'brixstac-workspace-service', status: 'ok', ts: new Date().toISOString() }));
// SCIM routes bypass JWT auth (use their own Bearer token)
app.use('/scim', scimRouter);
app.use('/', routes);

app.use((_req, res) => res.status(404).json({ error: 'Not found' }));
app.use((err: Error, _req: express.Request, res: express.Response, _next: express.NextFunction) => {
  console.error(err);
  res.status(500).json({ error: NODE_ENV === 'production' ? 'Internal server error' : err.message });
});

app.listen(PORT, () => console.log(`[brixstac-workspace-service] running on :${PORT}`));
export default app;
