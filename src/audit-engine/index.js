export async function matchAuditCases(provider, query, limit = 5) {
  return provider.searchCases(query, limit);
}

export async function evaluateAuditRisk(provider, query) {
  const matchedCases = await matchAuditCases(provider, query, 5);

  const repeatCases = matchedCases.filter((item) => {
    const haystack = `${item.title} ${item.summary}`;
    return (
      item.tags.includes('repeat') ||
      /반복\s*지적|재지적|repeated\s*audit/i.test(haystack)
    );
  });

  if (repeatCases.length > 0) {
    return {
      level: 'HIGH',
      findings: ['R6_REPEAT_AUDIT_PATTERN'],
      recommendations: ['동일 지적사항의 재발 방지 대책과 이행 증빙을 제출하십시오.'],
      matchedCases
    };
  }

  if (matchedCases.length > 0) {
    return {
      level: 'MODERATE',
      findings: [],
      recommendations: ['유사 감사사례 대비 절차 준수 여부를 추가 점검하십시오.'],
      matchedCases
    };
  }

  return {
    level: 'LOW',
    findings: [],
    recommendations: [],
    matchedCases
  };
}
