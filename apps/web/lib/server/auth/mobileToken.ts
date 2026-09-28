import { decode, encode } from 'next-auth/jwt';

// Separate salt from the browser session cookie's, so a mobile token and a web session token
// are never decodable with each other's key material even though both derive from AUTH_SECRET.
const MOBILE_TOKEN_SALT = 'template-mobile-token';

// Long-lived: unlike the web's cookie session, there's no silent browser refresh to lean on, and
// forcing a re-login every 30 days (Auth.js's default) would be a poor mobile experience.
const MOBILE_TOKEN_MAX_AGE = 400 * 24 * 60 * 60;

const authSecret = (): string => {
  const secret = process.env.AUTH_SECRET;
  if (!secret) {
    throw new Error('AUTH_SECRET is not set');
  }
  return secret;
};

export const mintMobileToken = (userId: string): Promise<string> =>
  encode({
    token: { sub: userId },
    secret: authSecret(),
    salt: MOBILE_TOKEN_SALT,
    maxAge: MOBILE_TOKEN_MAX_AGE,
  });

export const verifyMobileToken = async (token: string): Promise<string | undefined> => {
  try {
    const payload = await decode({ token, secret: authSecret(), salt: MOBILE_TOKEN_SALT });
    return typeof payload?.sub === 'string' ? payload.sub : undefined;
  } catch {
    return undefined;
  }
};
