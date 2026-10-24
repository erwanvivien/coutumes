import { absoluteUrl } from '.';

export const accountUrl = (): string => absoluteUrl('/account');
export const accountLoginUrl = (): string => absoluteUrl('/account/login');
export const accountLogoutUrl = (): string => absoluteUrl('/account/logout');

export const legalTermsUrl = (): string => absoluteUrl('/legal/terms');
export const legalPrivacyUrl = (): string => absoluteUrl('/legal/privacy');

/** The list of the signed-in user's shops. */
export const homePath = (): string => absoluteUrl('/');
/** Creating a new shop (it has no slug yet). */
export const newStorePath = (): string => absoluteUrl('/boutique');

export const storePath = (slug: string): string => absoluteUrl(`/${slug}`);
export const monthPath = (slug: string, month: string): string => absoluteUrl(`/${slug}/${month}`);
export const presentationPath = (slug: string, month: string): string =>
  absoluteUrl(`/${slug}/${month}/presentation`);
/** A week, by its Monday: /{slug}/semaine/2026-10-12 */
export const weekPath = (slug: string, monday: string): string =>
  absoluteUrl(`/${slug}/semaine/${monday}`);
export const weekPresentationPath = (slug: string, monday: string): string =>
  absoluteUrl(`/${slug}/semaine/${monday}/presentation`);
export const sharePath = (token: string): string => absoluteUrl(`/p/${token}`);
export const storeSettingsPath = (slug: string): string => absoluteUrl(`/${slug}/boutique`);
