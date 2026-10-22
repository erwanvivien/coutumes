import { createSign } from 'node:crypto';

const TOKEN_URL = 'https://oauth2.googleapis.com/token';
const SCOPE = 'https://www.googleapis.com/auth/spreadsheets.readonly';

export type ServiceAccount = {
  email: string;
  privateKey: string;
};

let cachedToken: { value: string; expiresAt: number } | undefined;

const base64Url = (input: string | Buffer): string => Buffer.from(input).toString('base64url');

/** Exchanges a self-signed JWT for a short-lived access token (Google's service-account flow),
 * without pulling in the googleapis SDK for a single read-only call. */
export const getAccessToken = async (account: ServiceAccount): Promise<string> => {
  const now = Math.floor(Date.now() / 1000);
  if (cachedToken !== undefined && cachedToken.expiresAt > now + 60) {
    return cachedToken.value;
  }

  const header = base64Url(JSON.stringify({ alg: 'RS256', typ: 'JWT' }));
  const claims = base64Url(
    JSON.stringify({ iss: account.email, scope: SCOPE, aud: TOKEN_URL, iat: now, exp: now + 3600 }),
  );
  const signature = createSign('RSA-SHA256')
    .update(`${header}.${claims}`)
    .sign(account.privateKey, 'base64url');

  const response = await fetch(TOKEN_URL, {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body: new URLSearchParams({
      grant_type: 'urn:ietf:params:oauth:grant-type:jwt-bearer',
      assertion: `${header}.${claims}.${signature}`,
    }),
    cache: 'no-store',
  });
  if (!response.ok) {
    throw new Error(`Google token exchange failed (${response.status}): ${await response.text()}`);
  }

  const body = (await response.json()) as { access_token: string; expires_in: number };
  cachedToken = { value: body.access_token, expiresAt: now + body.expires_in };
  return body.access_token;
};
