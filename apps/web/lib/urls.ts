import { absoluteUrl } from '.';

export const accountUrl = (): string => absoluteUrl('/account');
export const accountLoginUrl = (): string => absoluteUrl('/account/login');
export const accountLogoutUrl = (): string => absoluteUrl('/account/logout');

export const legalTermsUrl = (): string => absoluteUrl('/legal/terms');
export const legalPrivacyUrl = (): string => absoluteUrl('/legal/privacy');

export const homePath = (): `/${string}` => '/';
export const monthPath = (slug: string): `/${string}` => `/${slug}`;
export const presentationPath = (slug: string): `/${string}` => `/${slug}/presentation`;
export const sharePath = (token: string): `/${string}` => `/p/${token}`;
export const storeSettingsPath = (): `/${string}` => '/boutique';
