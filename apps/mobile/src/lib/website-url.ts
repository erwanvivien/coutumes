import { assertDefined } from './assert';

// `process.env` has no ambient type in this project (no @types/node), so TS/ESLint see it as
// `any` — cast it to a known shape once here rather than at every call site.
const env = process.env as Record<string, string | undefined>;

const websiteUrl = env.EXPO_PUBLIC_WEBSITE_URL;
assertDefined(websiteUrl, 'EXPO_PUBLIC_WEBSITE_URL is not defined');

export const WEBSITE_URL = websiteUrl;
