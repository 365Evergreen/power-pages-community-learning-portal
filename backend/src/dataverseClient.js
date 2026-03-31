import fetch from 'node-fetch';
import { ConfidentialClientApplication } from '@azure/msal-node';

function sanitizeTenantId(raw) {
  if (!raw) return raw;
  // Replace non-standard hyphen-like characters with ascii hyphen
  return raw.replace(/[\u2010\u2011\u2012\u2013\u2014\u2015\u2212]/g, '-')
}

function isValidGuid(g) {
  return /^[0-9a-fA-F]{8}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{12}$/.test(g)
}

function createCCA() {
  const clientId = process.env.AZURE_CLIENT_ID;
  let tenantId = sanitizeTenantId(process.env.AZURE_TENANT_ID || '');
  const clientSecret = process.env.AZURE_CLIENT_SECRET;

  if (!clientId || !tenantId || !clientSecret) return null;

  if (!isValidGuid(tenantId)) {
    throw new Error(
      `Invalid AZURE_TENANT_ID: '${process.env.AZURE_TENANT_ID}'. Ensure it's a plain GUID (no quotes, no Unicode hyphens).`
    );
  }

  const msalConfig = {
    auth: {
      clientId,
      authority: `https://login.microsoftonline.com/${tenantId}`,
      clientSecret
    }
  };

  return new ConfidentialClientApplication(msalConfig);
}

export async function getAccessToken() {
  const cca = createCCA();
  if (!cca) {
    throw new Error('Missing Azure credentials. Fill AZURE_CLIENT_ID, AZURE_CLIENT_SECRET and AZURE_TENANT_ID in environment.');
  }

  const scope = process.env.DATAVERSE_SCOPE || `${process.env.DATAVERSE_URL}/.default`;
  const result = await cca.acquireTokenByClientCredential({ scopes: [scope] });
  if (!result || !result.accessToken) throw new Error('Failed to acquire access token');
  return result.accessToken;
}

export async function dataverseFetch(path, options = {}) {
  const token = await getAccessToken();
  const base = process.env.DATAVERSE_URL.replace(/\/$/, '');
  const url = `${base}/api/data/v9.2${path}`;
  const headers = {
    Accept: 'application/json',
    Authorization: `Bearer ${token}`,
    ...options.headers
  };

  const res = await fetch(url, { ...options, headers });
  return res;
}
