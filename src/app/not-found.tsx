import Link from 'next/link';

export default function NotFound() {
  return (
    <main className="page">
      <div className="empty">
        <h3>We couldn’t find that page</h3>
        <p>The client may not be assigned to you, or the link is out of date.</p>
        <Link href="/" className="btn btn-primary">Back to your clients</Link>
      </div>
    </main>
  );
}
