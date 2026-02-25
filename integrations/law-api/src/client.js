import { ILawApiClient } from '../../../packages/legal-engine/src/types.js';

export const LAW_API_ENDPOINTS = {
  SEARCH_LAWS: '/laws/search',
  LAW_ARTICLES_TEMPLATE: '/laws/{lawId}/articles',
};

export class LawApiClient extends ILawApiClient {
  constructor(config = readLawApiConfigFromEnv(), fetchImpl = fetch) {
    super();
    this.config = config;
    this.fetchImpl = fetchImpl;
  }

  async searchLaws(query) {
    const url = new URL(LAW_API_ENDPOINTS.SEARCH_LAWS, this.config.baseUrl);
    url.searchParams.set('query', query);
    return this.request(url);
  }

  async getLawArticles(lawId) {
    const path = LAW_API_ENDPOINTS.LAW_ARTICLES_TEMPLATE.replace('{lawId}', encodeURIComponent(lawId));
    const url = new URL(path, this.config.baseUrl);
    return this.request(url);
  }

  async request(url) {
    const response = await this.fetchImpl(url, {
      method: 'GET',
      headers: {
        Authorization: `Bearer ${this.config.apiKey}`,
        Accept: 'application/json',
      },
    });

    if (!response.ok) {
      throw new Error(`Law API request failed: ${response.status} ${response.statusText}`);
    }

    return response.json();
  }
}

export function readLawApiConfigFromEnv(env = process.env) {
  const apiKey = env.LAW_API_KEY;
  const baseUrl = env.LAW_API_BASE_URL;

  if (!apiKey) {
    throw new Error('LAW_API_KEY is required.');
  }

  if (!baseUrl) {
    throw new Error('LAW_API_BASE_URL is required.');
  }

  return { apiKey, baseUrl };
}
