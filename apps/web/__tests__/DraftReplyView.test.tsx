import { fireEvent, render, screen } from '@testing-library/react';
import { DraftReplyView } from '../components/DraftReplyView';
import { DraftReply } from '../lib/types';

const draft: DraftReply = {
  petition_id: 'p-1',
  petition_summary: 'summary text',
  fact_analysis: 'fact analysis text',
  legal_review: 'legal review text',
  decision: 'decision text',
  action_plan: 'action plan text',
  legal_basis: [
    {
      law_name: 'Act A',
      article_number: 'Article 1',
      effective_date: '2024-01-01',
      source_link: 'https://example.com'
    }
  ],
  audit_risk: {
    level: 'MODERATE',
    score_breakdown: {
      procedural_omission: 20
    },
    findings: ['finding'],
    recommendations: ['recommendation']
  },
  created_at: '2024-01-01T00:00:00.000Z'
};

describe('DraftReplyView', () => {
  it('renders sections and tab content', () => {
    render(<DraftReplyView draft={draft} />);

    expect(screen.getByText('summary text')).toBeInTheDocument();
    expect(screen.getByText(/Act A/)).toBeInTheDocument();

    fireEvent.click(screen.getByRole('button', { name: 'Audit Risk' }));

    expect(screen.getByText(/MODERATE/)).toBeInTheDocument();
    expect(screen.getByText(/procedural_omission: 20/)).toBeInTheDocument();
  });
});
