export const drafts = [
  {
    id: 'draft-001',
    tenant_id: 'tenant-1',
    tenant_code: 'TN01',
    petition_id: 'petition-100',
    petition_summary: '도로 보수 요청 민원에 대한 처리 요청',
    fact_analysis: '현장 확인 결과 보행자 통행량이 높고 균열이 확인되었습니다.',
    legal_review: '지방자치단체 관리 도로 유지 의무에 따라 보수 필요성이 인정됩니다.',
    decision: '부분수용',
    action_plan: '2주 내 긴급보수 후 본예산 반영 검토',
    legal_basis: [
      {
        law_name: '지방자치법',
        article_number: '제9조',
        effective_date: '2024-01-01',
        source_link: 'https://example.org/law/local-autonomy#9'
      },
      {
        law_name: '도로법',
        article_number: '제37조',
        effective_date: '2023-06-01',
        source_link: 'https://example.org/law/road#37'
      }
    ],
    audit_risk: {
      level: 'MODERATE',
      findings: ['예산 배정 지연 시 동일 민원 반복 가능성'],
      recommendations: ['임시 조치 결과를 민원인에게 선통보']
    }
  },
  {
    id: 'draft-002',
    tenant_id: 'tenant-2',
    tenant_code: 'TN02',
    petition_id: 'petition-200',
    petition_summary: '가로등 교체 요청',
    fact_analysis: '장비 수명 만료 확인',
    legal_review: '시설물 안전 확보 의무 있음',
    decision: '수용',
    action_plan: '다음 주 교체 시행',
    legal_basis: [
      {
        law_name: '지방자치법',
        article_number: '제9조',
        effective_date: '2024-01-01',
        source_link: 'https://example.org/law/local-autonomy#9'
      }
    ],
    audit_risk: {
      level: 'LOW',
      findings: [],
      recommendations: []
    }
  }
];

export function findDraftById(id) {
  return drafts.find((draft) => draft.id === id) ?? null;
}
