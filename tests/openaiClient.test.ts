import { OpenAIClient } from '../integrations/openai/client';

describe('OpenAIClient guardrails', () => {
  const originalFetch = global.fetch;

  afterEach(() => {
    global.fetch = originalFetch;
    delete process.env.OPENAI_MAX_TOKENS;
  });

  it('includes max_output_tokens in request body and respects OPENAI_MAX_TOKENS', async () => {
    process.env.OPENAI_MAX_TOKENS = '900';
    const fetchMock = jest.fn().mockResolvedValue({
      ok: true,
      json: async () => ({ output_text: '{"ok":true}', usage: { total_tokens: 42 } })
    });
    global.fetch = fetchMock as any;

    const client = new OpenAIClient('test-key', 'https://api.openai.com/v1');
    await client.createStructuredOutput({
      systemPrompt: 'system',
      userPrompt: 'user',
      schemaName: 'test',
      schema: {
        type: 'object',
        additionalProperties: false,
        required: ['ok'],
        properties: { ok: { type: 'boolean' } }
      }
    });

    const [, init] = fetchMock.mock.calls[0];
    const body = JSON.parse(init.body);
    expect(body.max_output_tokens).toBe(900);
  });
});
