import { describe, expect, it, vi } from 'vitest';
import { EmbeddingService } from '../src/embedding.js';

describe('EmbeddingService openai mode', () => {
  it('calls OpenAI client with mocked implementation', async () => {
    const embed = vi.fn(async (input: string) => [input.length, 1, 0]);
    const service = new EmbeddingService('openai', { embed });

    const result = await service.embed('raw_text_masked sample');

    expect(embed).toHaveBeenCalledTimes(1);
    expect(embed).toHaveBeenCalledWith('raw_text_masked sample');
    expect(result).toEqual([22, 1, 0]);
  });
});
