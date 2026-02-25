import { RateLimitError, TimeoutError, UpstreamError } from '../../integrations/law-api/errors.js';

export const generateDraft = async (req, legalService, logger) => {
  try {
    const laws = await legalService.searchLaws(req.query, req.requestId);
    logger.log('info', 'generate_draft_law_summary', {
      request_id: req.requestId,
      petition_id: req.petitionId,
      search_result_count: laws.length,
    });

    return {
      status: 200,
      body: {
        petition_summary: req.query,
        fact_analysis: '',
        legal_review: '',
        decision: '',
        action_plan: '',
        legal_basis: laws,
        audit_risk: { level: 'LOW', findings: [], recommendations: [] },
      },
    };
  } catch (error) {
    if (error instanceof RateLimitError) return { status: 429, body: { message: error.message } };
    if (error instanceof TimeoutError) return { status: 504, body: { message: error.message } };
    if (error instanceof UpstreamError) return { status: 502, body: { message: error.message } };
    return { status: 500, body: { message: 'Unknown error' } };
  }
};
