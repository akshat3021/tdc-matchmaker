import Link from 'next/link';
import { LogoutButton } from './LogoutButton';

export function Wordmark() {
  return (
    <span className="wordmark">
      <svg width="22" height="22" viewBox="0 0 24 24" fill="none" aria-hidden="true">
        <circle cx="9" cy="12" r="6.5" stroke="currentColor" strokeWidth="1.6" />
        <circle cx="15" cy="12" r="6.5" stroke="var(--wine)" strokeWidth="1.6" />
      </svg>
      <span>The Date Crew</span>
    </span>
  );
}

export function Header({ name }: { name: string }) {
  return (
    <header className="topbar">
      <div className="topbar-inner">
        <Link href="/" className="topbar-brand" aria-label="The Date Crew, matchmaker desk home">
          <Wordmark />
          <span className="topbar-tag">Matchmaker desk</span>
        </Link>
        <div className="topbar-user">
          <span className="topbar-name">{name}</span>
          <LogoutButton />
        </div>
      </div>
    </header>
  );
}
