// In production (Power Pages), calls go directly to the Power Pages Web API.
// In dev (Vite dev server), calls go to the local Express backend.
const isPowerPages = typeof window !== 'undefined' && !!window.__PORTAL_USER__;

export const apiBase = isPowerPages ? '' : '/api';

// Power Pages OData base for Dataverse table access
export const odataBase = isPowerPages ? '/_api' : '/api';

/**
 * Builds a fetch URL. In production the path is absolute (Power Pages serves it);
 * in dev it's proxied through the Vite/Express backend.
 */
export function apiUrl(path) {
  return `${apiBase}${path}`;
}
