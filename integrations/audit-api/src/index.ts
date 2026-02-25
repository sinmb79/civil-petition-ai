export interface AuditApiClientConfig {
  apiKey: string;
  baseUrl?: string;
}

export class AuditApiClient {
  static fromEnv(): AuditApiClient {
    return new AuditApiClient({ apiKey: process.env.AUDIT_API_KEY ?? '' });
  }

  constructor(private readonly config: AuditApiClientConfig) {}

  async request(_query: string): Promise<unknown> {
    if (!this.config.apiKey) throw new Error('Missing API key for audit-api integration.');
    return {};
  }
}
