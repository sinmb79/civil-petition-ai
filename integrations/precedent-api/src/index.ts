export interface PrecedentApiClientConfig {
  apiKey: string;
  baseUrl?: string;
}

export class PrecedentApiClient {
  static fromEnv(): PrecedentApiClient {
    return new PrecedentApiClient({ apiKey: process.env.PRECEDENT_API_KEY ?? '' });
  }

  constructor(private readonly config: PrecedentApiClientConfig) {}

  async request(_query: string): Promise<unknown> {
    if (!this.config.apiKey) throw new Error('Missing API key for precedent-api integration.');
    return {};
  }
}
