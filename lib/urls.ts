import type { AbsoluteUrl } from ".";
import { absoluteUrl } from ".";

export const accountUrl = (): AbsoluteUrl => absoluteUrl("/account");
export const accountLoginUrl = (): AbsoluteUrl => absoluteUrl("/account/login");
export const accountLogoutUrl = (): AbsoluteUrl =>
  absoluteUrl("/account/logout");

export const legalTermsUrl = (): AbsoluteUrl => absoluteUrl("/legal/terms");
export const legalPrivacyUrl = (): AbsoluteUrl => absoluteUrl("/legal/privacy");
