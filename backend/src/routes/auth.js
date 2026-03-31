import { Router } from 'express';

const router = Router();

/**
 * GET /api/me
 *
 * Returns the currently authenticated user.
 *
 * - Local dev:  set MOCK_USER in .env as a JSON string, e.g.
 *     MOCK_USER={"id":"00000000-0000-0000-0000-000000000001","name":"Dev User","email":"dev@example.com"}
 *   If MOCK_USER is not set, returns { authenticated: false }.
 *
 * - Production (Power Pages): auth state is resolved client-side from
 *   window.__PORTAL_USER__ injected by the Liquid template. This endpoint
 *   is only hit as a local-dev fallback.
 */
router.get('/', (req, res) => {
  const rawMock = process.env.MOCK_USER;
  if (rawMock) {
    try {
      const user = JSON.parse(rawMock);
      return res.json({ authenticated: true, user });
    } catch {
      console.warn('[auth] MOCK_USER env var is not valid JSON — ignoring');
    }
  }
  res.json({ authenticated: false, user: null });
});

export default router;
