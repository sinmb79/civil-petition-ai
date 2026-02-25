import type { AuditCase } from '@civil-petition/core';

const HIGH_RISK_TOKENS = ['특혜', '봐주기', '청탁', '민원인 요구', '지인', '아는 사람', '압력'];

const tokenize = (value: string): string[] =>
  value
    .toLowerCase()
    .split(/\s+/)
    .map((token) => token.trim())
    .filter(Boolean);

export const matchAuditCases = (petitionText: string, tags: string[], corpus: AuditCase[]): AuditCase[] => {
  const petitionTokens = new Set([...tokenize(petitionText), ...tags.map((tag) => tag.toLowerCase())]);

  return corpus.filter((auditCase) => {
    const summary = auditCase.summary.toLowerCase();
    const caseTags = auditCase.tags.map((tag) => tag.toLowerCase());

    const petitionTokenMatch = [...petitionTokens].some(
      (token) => summary.includes(token) || caseTags.some((caseTag) => caseTag.includes(token)),
    );

    const riskTokenMatch = HIGH_RISK_TOKENS.some(
      (token) => summary.includes(token.toLowerCase()) || caseTags.includes(token.toLowerCase()),
    );

    return petitionTokenMatch || riskTokenMatch;
  });
};
