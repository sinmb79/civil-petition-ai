import test from "node:test";
import assert from "node:assert/strict";

import { DraftEngine, generateStubDraft } from "../packages/draft-engine/src/index.js";
import { validateDraftReplyShape } from "../packages/draft-engine/src/validate.js";

const baseInput = {
  petition_id: "P-001",
  raw_text: "연락처 010-1234-5678, 주민번호 900101-1234567, 이메일 test@example.com",
  legal_sources: [
    {
      title: "Civil Petition Act",
      article: "Article 10",
      effective_date: "2024-01-01",
      source_url: "https://example.gov/law/10"
    }
  ]
};

test("schema validation for stub output passes", () => {
  const output = generateStubDraft(baseInput);
  assert.equal(validateDraftReplyShape(output), true);
});

test("openai mode calls configured openai client", async () => {
  process.env.DRAFT_ENGINE_MODE = "openai";
  let called = 0;

  const client = {
    async generateStructuredDraft() {
      called += 1;
      return generateStubDraft(baseInput);
    }
  };

  const engine = new DraftEngine(client);
  await engine.generate(baseInput);

  assert.equal(called, 1);
  delete process.env.DRAFT_ENGINE_MODE;
});

test("openai mode uses masked petition text", async () => {
  process.env.DRAFT_ENGINE_MODE = "openai";
  let capturedInput;

  const client = {
    async generateStructuredDraft(input) {
      capturedInput = input;
      return generateStubDraft(baseInput);
    }
  };

  const engine = new DraftEngine(client);
  await engine.generate(baseInput);

  assert.match(capturedInput.raw_text, /\[MASKED_PHONE\]/);
  assert.match(capturedInput.raw_text, /\[MASKED_RRN\]/);
  assert.match(capturedInput.raw_text, /\[MASKED_EMAIL\]/);
  assert.doesNotMatch(capturedInput.raw_text, /010-1234-5678/);
  assert.doesNotMatch(capturedInput.raw_text, /900101-1234567/);
  assert.doesNotMatch(capturedInput.raw_text, /test@example.com/);

  delete process.env.DRAFT_ENGINE_MODE;
});
