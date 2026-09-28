import { absoluteUrl } from '.';

export const accountUrl = (): string => absoluteUrl('/account');
export const accountLoginUrl = (): string => absoluteUrl('/account/login');
export const accountLogoutUrl = (): string => absoluteUrl('/account/logout');

export const legalTermsUrl = (): string => absoluteUrl('/legal/terms');
export const legalPrivacyUrl = (): string => absoluteUrl('/legal/privacy');
