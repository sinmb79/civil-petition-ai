export class MockLegalEngine {
  retrieveRelevantSources() {
    return [
      {
        type: 'STATUTE',
        title: 'Civil Petitions Act',
        article: 'Article 12',
        effective_date: '2024-01-01',
        source_url: 'https://law.example/civil-petitions-act#article-12'
      },
      {
        type: 'ORDINANCE',
        title: 'Seoul Public Service Ordinance',
        reference_number: 'Sec. 4-2',
        effective_date: '2023-07-01',
        source_url: 'https://ordinance.example/seoul-public-service#sec-4-2'
      }
    ];
  }
}
