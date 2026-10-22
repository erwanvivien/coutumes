import { signIn } from '@/lib/server/auth';
import type { Metadata } from 'next';
import styles from './page.module.css';

const AUTH_GOOGLE_ID = process.env.AUTH_GOOGLE_ID || undefined;

export const metadata: Metadata = { title: 'Connexion' };

const GoogleLogo: React.FC = () => (
  <svg width="18" height="18" viewBox="0 0 48 48" aria-hidden>
    <path
      fill="#EA4335"
      d="M24 9.5c3.54 0 6.71 1.22 9.21 3.6l6.85-6.85C35.9 2.38 30.47 0 24 0 14.62 0 6.51 5.38 2.56 13.22l7.98 6.19C12.43 13.72 17.74 9.5 24 9.5z"
    />
    <path
      fill="#4285F4"
      d="M46.98 24.55c0-1.57-.15-3.09-.38-4.55H24v9.02h12.94c-.58 2.96-2.26 5.48-4.78 7.18l7.73 6c4.51-4.18 7.09-10.36 7.09-17.65z"
    />
    <path
      fill="#FBBC05"
      d="M10.53 28.59c-.48-1.45-.76-2.99-.76-4.59s.27-3.14.76-4.59l-7.98-6.19C.92 16.46 0 20.12 0 24c0 3.88.92 7.54 2.56 10.78l7.97-6.19z"
    />
    <path
      fill="#34A853"
      d="M24 48c6.48 0 11.93-2.13 15.89-5.81l-7.73-6c-2.15 1.45-4.92 2.3-8.16 2.3-6.26 0-11.57-4.22-13.47-9.91l-7.98 6.19C6.51 42.62 14.62 48 24 48z"
    />
  </svg>
);

const LoginPage: React.FC<{
  searchParams: Promise<{ redirectTo?: string; error?: string }>;
}> = async ({ searchParams }) => {
  // Lets protected pages send the user back here to sign in, then return to where they were.
  const { redirectTo, error } = await searchParams;
  const callbackUrl = redirectTo ?? '/';

  return (
    <main className={styles.page}>
      <div className={styles.card}>
        <header className={styles.header}>
          <h1 className={styles.title}>Suivi des ventes</h1>
          <p className={styles.subtitle}>
            Chiffre d’affaires, objectifs et présentations mensuelles.
          </p>
        </header>

        {error !== undefined && (
          <p className={styles.error} role="alert">
            La connexion a échoué. Réessayez dans un instant.
          </p>
        )}

        {AUTH_GOOGLE_ID !== undefined ? (
          // Server action — no client JS needed for the button
          <form
            action={async () => {
              'use server';
              await signIn('google', { redirectTo: callbackUrl });
            }}
          >
            <button type="submit" className={styles.providerButton}>
              <GoogleLogo />
              Continuer avec Google
            </button>
          </form>
        ) : (
          <p className={styles.error}>
            La connexion Google n’est pas configurée (AUTH_GOOGLE_ID / AUTH_GOOGLE_SECRET).
          </p>
        )}
      </div>
    </main>
  );
};

export default LoginPage;
