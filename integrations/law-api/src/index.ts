export interface LawApiClientConfig {
  apiKey: string;
  baseUrl?: string;
}

export class LawApiClient {
  static fromEnv(): LawApiClient {
    return new LawApiClient({ apiKey: process.env.LAW_API_KEY ?? '' });
  }

  constructor(private readonly config: LawApiClientConfig) {}

  async request(_query: string): Promise<unknown> {
    if (!this.config.apiKey) throw new Error('Missing API key for law-api integration.');
    return {};
  }
}
