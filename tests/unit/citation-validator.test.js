import test from 'node:test';
import assert from 'node:assert/strict';

import { CitationValidationError, validateCitations } from '../../packages/citation-validator/src/index.js';

test('validateCitations passes for valid statute and ordinance citations', () => {
  const sources = [
    {
      type: 'STATUTE',
      title: 'Civil Petitions Act',
      article: 'Article 5',
      effective_date: '2024-01-01',
      source_url: 'https://law.example/statute/5'
    },
    {
      type: 'ORDINANCE',
      title: 'Local Ordinance',
      reference_number: 'Section 7',
      effective_date: '2023-04-02',
      source_url: 'https://law.example/ordinance/7'
    }
  ];

  assert.doesNotThrow(() => validateCitations(sources));
});

test('validateCitations fails when statute article is missing', () => {
  const sources = [
    {
      type: 'STATUTE',
      title: 'Civil Petitions Act',
      effective_date: '2024-01-01',
      source_url: 'https://law.example/statute/5'
    }
  ];

  assert.throws(() => validateCitations(sources), CitationValidationError);
});
