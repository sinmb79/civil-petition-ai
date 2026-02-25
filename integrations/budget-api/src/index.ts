export interface BudgetApiClientConfig {
  apiKey: string;
  baseUrl?: string;
}

export class BudgetApiClient {
  static fromEnv(): BudgetApiClient {
    return new BudgetApiClient({ apiKey: process.env.BUDGET_API_KEY ?? '' });
  }

  constructor(private readonly config: BudgetApiClientConfig) {}

  async request(_query: string): Promise<unknown> {
    if (!this.config.apiKey) throw new Error('Missing API key for budget-api integration.');
    return {};
  }
}
