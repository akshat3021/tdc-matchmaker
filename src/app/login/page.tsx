import type { Metadata } from 'next';
import { redirect } from 'next/navigation';
import { Wordmark } from '@/components/Header';
import { getSessionUser } from '@/lib/auth/session';
import { env } from '@/lib/env';
import { LoginForm } from './LoginForm';

export const metadata: Metadata = { title: 'Sign in' };

/** Only allow same-site relative redirects (prevents open-redirect abuse). */
const safeNext = (n?: string) => (n && n.startsWith('/') && !n.startsWith('//') ? n : '/');

export default async function LoginPage({ searchParams }: { searchParams: { next?: string } }) {
  const next = safeNext(searchParams.next);
  if (await getSessionUser()) redirect(next);

  return (
    <main className="login">
      <section className="login-aside">
        <Wordmark />
        <blockquote>
          <p>Every introduction is a small act of trust. Make each one count.</p>
          <footer>Matchmaker desk</footer>
        </blockquote>
      </section>
      <section className="login-panel">
        <div className="login-card">
          <h1>Sign in</h1>
          <p className="muted">Use your matchmaker account to see your clients.</p>
          <LoginForm next={next} />
          {env.showDemoCredentials && (
            <div className="demo">
              <strong>Demo access</strong>
              <p>
                Username <code>priya</code> or <code>arjun</code>, password <code>Welcome@TDC26</code>.
                Each matchmaker sees only their own seven clients.
              </p>
            </div>
          )}
        </div>
      </section>
    </main>
  );
}
