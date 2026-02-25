/**
 * @typedef {{ id: string, title: string, effective_date: string, url: string }} LawSummary
 * @typedef {{ article_no: string, text: string, effective_date: string, url: string }} LawArticle
 * @typedef {{ effective_date: string, data: unknown }} CachedValue
 * @typedef {{
 *   source_type: 'STATUTE',
 *   title: string,
 *   reference_number: string,
 *   article: string,
 *   effective_date: string,
 *   content: string,
 *   source_url: string
 * }} LegalSource
 */

export class ILawApiClient {
  /** @param {string} _query */
  async searchLaws(_query) {
    throw new Error('Not implemented');
  }

  /** @param {string} _lawId */
  async getLawArticles(_lawId) {
    throw new Error('Not implemented');
  }
}

export class ILegalCache {
  /** @template T @param {string} _key @returns {Promise<{effective_date:string,data:T}|null>} */
  async get(_key) {
    throw new Error('Not implemented');
  }

  /** @template T @param {string} _key @param {{effective_date:string,data:T}} _value */
  async set(_key, _value) {
    throw new Error('Not implemented');
  }
}
