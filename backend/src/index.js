import express from 'express';
import dotenv from 'dotenv';
import workshopsRouter from './routes/workshops.js';
import entitiesRouter from './routes/entities.js';
import authRouter from './routes/auth.js';
import registerRouter from './routes/register.js';

dotenv.config();

const app = express();
app.use(express.json());

// Serve Chrome DevTools appspecific manifest to avoid 404 during local dev
app.get('/.well-known/appspecific/com.chrome.devtools.json', (req, res) => {
  res.setHeader('Content-Type', 'application/json');
  res.json({ name: 'power-pages-local-backend', description: 'dev only' });
});

app.use('/api/me', authRouter);
app.use('/api/register', registerRouter);
app.use('/api/workshops', workshopsRouter);
app.use('/api/entities', entitiesRouter);

const port = process.env.PORT || 3000;
app.listen(port, () => {
  console.log(`Backend listening on http://localhost:${port}`);
});
