import { signIn } from '@/lib/server/auth';
import { legalPrivacyUrl, legalTermsUrl } from '@/lib/urls';
import { Apple, Globe } from 'lucide-react';
import Link from 'next/link';
import styles from './page.module.css';

const AUTH_APPLE_ID = process.env.AUTH_APPLE_ID || undefined;
const AUTH_GOOGLE_ID = process.env.AUTH_GOOGLE_ID || undefined;

const LoginPage: React.FC<{
  searchParams: Promise<{ redirectTo?: string }>;
}> = async ({ searchParams }) => {
  // Lets /api/auth/mobile-token (opened by the mobile app) send the user back here to sign in,
  // then bounce back to it afterwards to mint the mobile token — without this, sign-in would
  // always land on the website's homepage instead of returning control to the app.
  const { redirectTo } = await searchParams;
  const callbackUrl = redirectTo ?? '/';

  return (
    <main className={styles.page}>
      <div className={styles.card}>
        <header className={styles.header}>
          <h1 className={styles.title}>APP_NAME</h1>
          <p className={styles.subtitle}>DESC</p>
        </header>

        <div className={styles.providers}>
          {/* Server actions — no client JS needed for the buttons */}

          {AUTH_GOOGLE_ID !== undefined && (
            <form
              action={async () => {
                'use server';
                await signIn('google', { redirectTo: callbackUrl });
              }}
            >
              <button type="submit" className={styles.providerButton}>
                <Globe size={18} />
                Continue with google
              </button>
            </form>
          )}

          {AUTH_APPLE_ID !== undefined && (
            <form
              action={async () => {
                'use server';
                await signIn('apple', { redirectTo: callbackUrl });
              }}
            >
              <button
                type="submit"
                className={`${styles.providerButton} ${styles.providerButtonApple}`}
              >
                <Apple size={18} />
                Continue with apple
              </button>
            </form>
          )}
        </div>

        <p className={styles.footer}>
          by signing in you agree to our <Link href={legalTermsUrl()}>terms</Link> and{' '}
          <Link href={legalPrivacyUrl()}>privacy policy</Link>
        </p>
      </div>
    </main>
  );
};

export default LoginPage;
