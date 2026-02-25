export interface OrdinanceApiClientConfig {
  apiKey: string;
  baseUrl?: string;
}

export class OrdinanceApiClient {
  static fromEnv(): OrdinanceApiClient {
    return new OrdinanceApiClient({ apiKey: process.env.ORDINANCE_API_KEY ?? '' });
  }

  constructor(private readonly config: OrdinanceApiClientConfig) {}

  async request(_query: string): Promise<unknown> {
    if (!this.config.apiKey) throw new Error('Missing API key for ordinance-api integration.');
    return {};
  }
}
