import express from 'express';
import dotenv from 'dotenv';
import workshopsRouter from './routes/workshops.js';

dotenv.config();

const app = express();
app.use(express.json());

// Serve Chrome DevTools appspecific manifest to avoid 404 during local dev
app.get('/.well-known/appspecific/com.chrome.devtools.json', (req, res) => {
  res.setHeader('Content-Type', 'application/json');
  res.json({ name: 'power-pages-local-backend', description: 'dev only' });
});

app.use('/api/workshops', workshopsRouter);

const port = process.env.PORT || 3000;
app.listen(port, () => {
  console.log(`Backend listening on http://localhost:${port}`);
});
