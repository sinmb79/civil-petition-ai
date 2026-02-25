import { useState } from 'react';
import { DraftReply } from '../lib/types';

type Props = {
  draft: DraftReply;
};

export function DraftReplyView({ draft }: Props) {
  const [tab, setTab] = useState<'basis' | 'risk'>('basis');

  return (
    <div className="card">
      <h2>Generated Draft Reply</h2>
      <p className="section-title">petition_summary</p>
      <p className="section-body">{draft.petition_summary}</p>

      <p className="section-title">fact_analysis</p>
      <p className="section-body">{draft.fact_analysis}</p>

      <p className="section-title">legal_review</p>
      <p className="section-body">{draft.legal_review}</p>

      <p className="section-title">decision</p>
      <p className="section-body">{draft.decision}</p>

      <p className="section-title">action_plan</p>
      <p className="section-body">{draft.action_plan}</p>

      <div className="tabs">
        <button className={`tab ${tab === 'basis' ? 'active' : ''}`} onClick={() => setTab('basis')}>
          Legal Basis
        </button>
        <button className={`tab ${tab === 'risk' ? 'active' : ''}`} onClick={() => setTab('risk')}>
          Audit Risk
        </button>
      </div>

      {tab === 'basis' ? (
        <ul>
          {draft.legal_basis.map((item) => (
            <li key={`${item.law_name}-${item.article_number}`}>
              {item.law_name} {item.article_number} (effective: {item.effective_date}) -{' '}
              <a href={item.source_link} target="_blank" rel="noreferrer">
                source
              </a>
            </li>
          ))}
        </ul>
      ) : (
        <div>
          <p>
            level: <strong>{draft.audit_risk.level}</strong>
          </p>
          <h4>score breakdown</h4>
          <ul>
            {Object.entries(draft.audit_risk.score_breakdown).map(([key, score]) => (
              <li key={key}>
                {key}: {score}
              </li>
            ))}
          </ul>
          <h4>findings</h4>
          <ul>
            {draft.audit_risk.findings.map((finding) => (
              <li key={finding}>{finding}</li>
            ))}
          </ul>
          <h4>recommendations</h4>
          <ul>
            {draft.audit_risk.recommendations.map((item) => (
              <li key={item}>{item}</li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
}
