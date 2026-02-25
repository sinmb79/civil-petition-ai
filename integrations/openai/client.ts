type JsonSchemaFormat = {
  type: 'json_schema';
  name: string;
  schema: Record<string, unknown>;
  strict: boolean;
};

type OpenAIResponse = {
  output_text?: string;
  output?: Array<{
    content?: Array<{
      type?: string;
      text?: string;
    }>;
  }>;
  usage?: {
    input_tokens?: number;
    output_tokens?: number;
    total_tokens?: number;
  };
};

export type StructuredOutputRequest = {
  systemPrompt: string;
  userPrompt: string;
  schemaName: string;
  schema: Record<string, unknown>;
  model?: string;
};

export class OpenAIClient {
  constructor(
    private readonly apiKey: string,
    private readonly baseUrl = 'https://api.openai.com/v1'
  ) {}

  async createStructuredOutput<T>(request: StructuredOutputRequest): Promise<T> {
    const format: JsonSchemaFormat = {
      type: 'json_schema',
      name: request.schemaName,
      schema: request.schema,
      strict: true
    };

    const maxOutputTokens = resolveMaxOutputTokens();
    const response = await fetch(`${this.baseUrl}/responses`, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${this.apiKey}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        model: request.model ?? process.env.OPENAI_MODEL ?? 'gpt-4.1-mini',
        max_output_tokens: maxOutputTokens,
        input: [
          {
            role: 'system',
            content: [{ type: 'input_text', text: request.systemPrompt }]
          },
          {
            role: 'user',
            content: [{ type: 'input_text', text: request.userPrompt }]
          }
        ],
        text: { format }
      })
    });

    if (!response.ok) {
      throw new Error(`OpenAI responses API failed: ${response.status} ${response.statusText}`);
    }

    const payload = (await response.json()) as OpenAIResponse;
    logStructured('openai.responses.usage', {
      model: request.model ?? process.env.OPENAI_MODEL ?? 'gpt-4.1-mini',
      max_output_tokens: maxOutputTokens,
      usage: payload.usage ?? null
    });
    const text = this.extractText(payload);
    return JSON.parse(text) as T;
  }

  private extractText(payload: OpenAIResponse): string {
    if (payload.output_text) {
      return payload.output_text;
    }

    const chunks = (payload.output ?? [])
      .flatMap((entry) => entry.content ?? [])
      .map((part) => part.text ?? '')
      .filter(Boolean);

    if (chunks.length === 0) {
      throw new Error('OpenAI response did not include structured output text.');
    }

    return chunks.join('\n');
  }
}

function resolveMaxOutputTokens(): number {
  const raw = Number(process.env.OPENAI_MAX_TOKENS ?? 800);
  if (!Number.isFinite(raw) || raw <= 0) {
    return 800;
  }

  return Math.min(Math.floor(raw), 1000);
}

function logStructured(event: string, payload: Record<string, unknown>): void {
  console.info(
    JSON.stringify({
      event,
      timestamp: new Date().toISOString(),
      ...payload
    })
  );
}

export function createOpenAIClientFromEnv(): OpenAIClient {
  const apiKey = process.env.OPENAI_API_KEY;
  if (!apiKey) {
    throw new Error('OPENAI_API_KEY is required for DraftEngine generation.');
  }

  return new OpenAIClient(apiKey);
}
