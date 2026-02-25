import Link from 'next/link';
import { useEffect, useState } from 'react';
import { ErrorBanner } from '../../components/ErrorBanner';
import { Petition } from '../../lib/types';

type ApiResponse = { items: Petition[] };
type ApiError = { error: string; request_id?: string };

export default function PetitionsPage() {
  const [petitions, setPetitions] = useState<Petition[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<ApiError | null>(null);

  useEffect(() => {
    async function load() {
      try {
        const response = await fetch('/api/petitions');
        if (!response.ok) {
          const json = (await response.json()) as ApiError;
          setError(json);
          return;
        }
        const json = (await response.json()) as ApiResponse;
        setPetitions(json.items);
      } catch {
        setError({ error: 'Unexpected network error' });
      } finally {
        setLoading(false);
      }
    }

    void load();
  }, []);

  return (
    <main>
      <h1>Petitions</h1>
      <div className="row">
        <Link href="/petitions/new">Create new petition</Link>
      </div>
      {error ? <ErrorBanner message={error.error} requestId={error.request_id} /> : null}

      {loading ? (
        <div className="card">Loading petitions...</div>
      ) : (
        <div className="card">
          {petitions.length === 0 ? (
            <p>No petitions yet.</p>
          ) : (
            <ul>
              {petitions.map((petition) => (
                <li key={petition.id}>
                  <Link href={`/petitions/${petition.id}`}>
                    {petition.raw_text.slice(0, 80)} ({petition.processing_type})
                  </Link>
                </li>
              ))}
            </ul>
          )}
        </div>
      )}
    </main>
  );
}
