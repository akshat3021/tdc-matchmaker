'use client';

/** Last-resort boundary. Never renders error details: those stay in server logs. */
export default function GlobalError({ reset }: { error: Error; reset: () => void }) {
  return (
    <main className="page">
      <div className="empty">
        <h3>Something went wrong</h3>
        <p>This page couldn’t load. Your notes and sent introductions are safe.</p>
        <button className="btn btn-primary" onClick={reset}>Try again</button>
      </div>
    </main>
  );
}
