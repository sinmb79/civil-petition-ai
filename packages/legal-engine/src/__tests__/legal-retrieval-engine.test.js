import test from 'node:test';
import assert from 'node:assert/strict';

import { LegalRetrievalEngine } from '../legal-retrieval-engine.js';
import { ILegalCache } from '../types.js';

class TestCache extends ILegalCache {
  constructor() {
    super();
    this.map = new Map();
  }

  async get(key) {
    return this.map.get(key) ?? null;
  }

  async set(key, value) {
    this.map.set(key, value);
  }
}

test('cache hit prevents duplicate law API calls', async () => {
  let searchCallCount = 0;
  let articlesCallCount = 0;

  const client = {
    async searchLaws() {
      searchCallCount += 1;
      return [
        {
          id: 'LAW-100',
          title: 'Administrative Procedures Act',
          effective_date: '2024-01-01',
          url: 'https://example.gov/laws/LAW-100',
        },
      ];
    },
    async getLawArticles() {
      articlesCallCount += 1;
      return [
        {
          article_no: 'Article 1',
          text: 'Purpose of this act.',
          effective_date: '2024-01-01',
          url: 'https://example.gov/laws/LAW-100/articles/1',
        },
      ];
    },
  };

  const engine = new LegalRetrievalEngine(client, new TestCache());

  const first = await engine.findRelevantSources('petition body', ['procedure']);
  const second = await engine.findRelevantSources('petition body', ['procedure']);

  assert.deepEqual(second, first);
  assert.equal(searchCallCount, 1);
  assert.equal(articlesCallCount, 1);
});

test('empty search result returns empty source list', async () => {
  let articlesCallCount = 0;
  const client = {
    async searchLaws() {
      return [];
    },
    async getLawArticles() {
      articlesCallCount += 1;
      return [];
    },
  };

  const engine = new LegalRetrievalEngine(client, new TestCache());
  const result = await engine.findRelevantSources('petition body', ['missing']);

  assert.deepEqual(result, []);
  assert.equal(articlesCallCount, 0);
});
