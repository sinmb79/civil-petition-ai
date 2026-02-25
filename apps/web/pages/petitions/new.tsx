import Link from 'next/link';
import { FormEvent, useState } from 'react';
import { ErrorBanner } from '../../components/ErrorBanner';

type ApiError = { error: string; request_id?: string };

export default function NewPetitionPage() {
  const [rawText, setRawText] = useState('');
  const [processingType, setProcessingType] = useState('standard');
  const [budgetRelated, setBudgetRelated] = useState(false);
  const [discretionary, setDiscretionary] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<ApiError | null>(null);

  async function onSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setLoading(true);
    setError(null);
    try {
      const response = await fetch('/api/petitions', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          raw_text: rawText,
          processing_type: processingType,
          budget_related: budgetRelated,
          discretionary: discretionary
        })
      });
      if (!response.ok) {
        const json = (await response.json()) as ApiError;
        setError(json);
        return;
      }
      window.location.href = '/petitions';
    } catch {
      setError({ error: 'Unexpected network error' });
    } finally {
      setLoading(false);
    }
  }

  return (
    <main>
      <h1>Create Petition</h1>
      <p>
        <Link href="/petitions">Back to list</Link>
      </p>
      {error ? <ErrorBanner message={error.error} requestId={error.request_id} /> : null}
      <form className="card" onSubmit={onSubmit}>
        <label>
          raw_text
          <textarea value={rawText} rows={6} onChange={(event) => setRawText(event.target.value)} />
        </label>
        <label>
          processing_type
          <select value={processingType} onChange={(event) => setProcessingType(event.target.value)}>
            <option value="standard">standard</option>
            <option value="expedited">expedited</option>
          </select>
        </label>
        <label>
          <input
            type="checkbox"
            checked={budgetRelated}
            onChange={(event) => setBudgetRelated(event.target.checked)}
          />{' '}
          budget_related
        </label>
        <label>
          <input
            type="checkbox"
            checked={discretionary}
            onChange={(event) => setDiscretionary(event.target.checked)}
          />{' '}
          discretionary
        </label>

        <button disabled={loading}>{loading ? 'Creating...' : 'Create Petition'}</button>
      </form>
    </main>
  );
}
