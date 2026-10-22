/** Emails allowed to sign in and see the dashboard, from ALLOWED_EMAILS (comma-separated).
 * Empty means nobody: the store's figures are private by default. */
const allowedEmails = (): Set<string> =>
  new Set(
    (process.env.ALLOWED_EMAILS ?? '')
      .split(',')
      .map((email) => email.trim().toLowerCase())
      .filter((email) => email !== ''),
  );

export const isAllowedEmail = (email: string | null | undefined): boolean =>
  typeof email === 'string' && allowedEmails().has(email.toLowerCase());
