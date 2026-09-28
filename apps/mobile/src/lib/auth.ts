import type { AuthUser } from '@template/shared';
import * as Linking from 'expo-linking';
import * as SecureStore from 'expo-secure-store';
import * as WebBrowser from 'expo-web-browser';

import { WEBSITE_URL } from '@/lib/website-url';

// expo-secure-store keys are restricted to alphanumeric, ".", "-", and "_".
const AUTH_TOKEN_STORAGE_KEY = 'template-auth-token';

export type { AuthUser };

export async function getStoredToken(): Promise<string | null> {
  return SecureStore.getItemAsync(AUTH_TOKEN_STORAGE_KEY);
}

export async function storeToken(token: string): Promise<void> {
  await SecureStore.setItemAsync(AUTH_TOKEN_STORAGE_KEY, token);
}

export async function signOut(): Promise<void> {
  await SecureStore.deleteItemAsync(AUTH_TOKEN_STORAGE_KEY);
}

export type SignInResult = { type: 'success' } | { type: 'cancel' } | { type: 'error' };

/** Opens the website's login page (same sign-in as the browser) in an in-app browser. On
 * success the website redirects to our `template://auth?token=…` custom scheme, which
 * app/auth.tsx is the authoritative place that stores the token — this is a best-effort
 * duplicate in parallel (storing the same token twice is harmless). */
export async function signIn(): Promise<SignInResult> {
  const redirectUrl = Linking.createURL('auth');
  const authUrl = `${WEBSITE_URL}/api/auth/mobile-token`;

  const result = await WebBrowser.openAuthSessionAsync(authUrl, redirectUrl);
  if (result.type !== 'success') {
    return { type: 'cancel' };
  }

  const { queryParams } = Linking.parse(result.url);
  const token = queryParams?.token;
  if (typeof token !== 'string') {
    return { type: 'error' };
  }

  await storeToken(token);
  return { type: 'success' };
}

/** Calls the website's whoami endpoint with the stored bearer token. Clears the token and
 * returns null if it's missing, expired, or rejected. */
export async function fetchCurrentUser(): Promise<AuthUser | null> {
  const token = await getStoredToken();
  if (token === null) {
    return null;
  }

  try {
    const response = await fetch(`${WEBSITE_URL}/api/account/me`, {
      headers: { Authorization: `Bearer ${token}` },
    });
    if (!response.ok) {
      if (response.status === 401) {
        await signOut();
      }
      return null;
    }
    return (await response.json()) as AuthUser;
  } catch {
    return null;
  }
}
