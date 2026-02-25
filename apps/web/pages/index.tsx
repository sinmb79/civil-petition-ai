import Link from 'next/link';

export default function HomePage() {
  return (
    <main>
      <h1>Civil Petition UI</h1>
      <div className="card">
        <p>Minimal web flows for petition intake, listing, detail, and draft generation.</p>
        <div className="row">
          <Link href="/petitions">View Petitions</Link>
          <Link href="/petitions/new">New Petition</Link>
        </div>
      </div>
    </main>
  );
}
