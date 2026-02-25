import Link from 'next/link';
import { useRouter } from 'next/router';
import { useEffect, useState } from 'react';
import { DraftReplyView } from '../../components/DraftReplyView';
import { ErrorBanner } from '../../components/ErrorBanner';
import { DraftReply, Petition } from '../../lib/types';

type DetailResponse = {
  petition: Petition;
  draft: DraftReply | null;
};

type ApiError = { error: string; request_id?: string };

export default function PetitionDetailPage() {
  const router = useRouter();
  const id = router.query.id;
  const [loading, setLoading] = useState(true);
  const [generating, setGenerating] = useState(false);
  const [petition, setPetition] = useState<Petition | null>(null);
  const [draft, setDraft] = useState<DraftReply | null>(null);
  const [error, setError] = useState<ApiError | null>(null);

  useEffect(() => {
    if (!id || typeof id !== 'string') return;

    async function loadDetail() {
      setLoading(true);
      setError(null);
      try {
        const response = await fetch(`/api/petitions/${id}`);
        if (!response.ok) {
          const json = (await response.json()) as ApiError;
          setError(json);
          return;
        }
        const json = (await response.json()) as DetailResponse;
        setPetition(json.petition);
        setDraft(json.draft);
      } catch {
        setError({ error: 'Unexpected network error' });
      } finally {
        setLoading(false);
      }
    }

    void loadDetail();
  }, [id]);

  async function onGenerateDraft() {
    if (!id || typeof id !== 'string') return;
    setGenerating(true);
    setError(null);
    try {
      const response = await fetch(`/api/petitions/${id}/generate-draft`, {
        method: 'POST'
      });
      if (!response.ok) {
        const json = (await response.json()) as ApiError;
        setError(json);
        return;
      }
      const json = (await response.json()) as DraftReply;
      setDraft(json);
    } catch {
      setError({ error: 'Unexpected network error' });
    } finally {
      setGenerating(false);
    }
  }

  return (
    <main>
      <h1>Petition Detail</h1>
      <p>
        <Link href="/petitions">Back to list</Link>
      </p>
      {error ? <ErrorBanner message={error.error} requestId={error.request_id} /> : null}
      {loading ? (
        <div className="card">Loading petition...</div>
      ) : petition ? (
        <>
          <div className="card">
            <p>
              <strong>ID:</strong> {petition.id}
            </p>
            <p>
              <strong>raw_text:</strong> {petition.raw_text}
            </p>
            <p>
              <strong>processing_type:</strong> {petition.processing_type}
            </p>
            <p>
              <strong>budget_related:</strong> {String(petition.budget_related)}
            </p>
            <p>
              <strong>discretionary:</strong> {String(petition.discretionary)}
            </p>
            <button onClick={onGenerateDraft} disabled={generating}>
              {generating ? 'Generating...' : 'Generate Draft'}
            </button>
          </div>

          {draft ? <DraftReplyView draft={draft} /> : <div className="card">No draft generated yet.</div>}
        </>
      ) : (
        <div className="card">Petition not found.</div>
      )}
    </main>
  );
}
