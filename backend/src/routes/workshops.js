import express from 'express';
import { dataverseFetch } from '../dataverseClient.js';

const router = express.Router();

// Basic example: list some ppdev_communityworkshop records
router.get('/', async (req, res) => {
  try {
    // Adjust the query as needed. This uses OData query to fetch top 10.
    const response = await dataverseFetch('/ppdev_communityworkshops?$top=10');
    const contentType = (response.headers.get('content-type') || '').toLowerCase();

    if (!response.ok) {
      const text = await response.text();
      return res.status(response.status).json({ error: text });
    }

    if (!contentType.includes('application/json')) {
      const text = await response.text();
      return res.status(502).json({ error: 'Unexpected non-JSON response from Dataverse', body: text });
    }

    const data = await response.json();
    res.json(data);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

export default router;
