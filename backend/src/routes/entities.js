import express from 'express';
import { dataverseFetch } from '../dataverseClient.js';

const router = express.Router();

// List of entity folder names from UnpackedSolution/Entities
const ENTITIES = [
  'ppdev_Communitylearner',
  'ppdev_Communitymemberfeedback',
  'ppdev_Communitytrainer',
  'ppdev_Communitytrainingenrolment',
  'ppdev_Communityworkshop',
  'ppdev_Sparoute'
];

function toEntitySet(folderName) {
  // convert to lowercase and append 's' if not present (simple pluralization)
  const base = folderName.toLowerCase();
  return base.endsWith('s') ? base : base + 's';
}

// Register a simple GET list route for each entity.
ENTITIES.forEach((folder) => {
  const entitySet = toEntitySet(folder);
  // expose as /api/entities/<folder>
  router.get(`/${folder}`, async (req, res) => {
    try {
      const top = Math.min(parseInt(req.query.top || '50', 10), 500);
      const path = `/${entitySet}?$top=${top}`;
      const response = await dataverseFetch(path);

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
});

export default router;
