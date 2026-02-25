import test from 'node:test';
import assert from 'node:assert/strict';
import { maskPIIForLLM, maskPIIForStorage } from '../packages/core/pii.js';

const text =
  '연락처 010-1234-5678, 이메일 test.user@example.com, 주민등록번호 900101-1234567, 카드 1234567890123456, 주소 서울시 강남구 역삼동 123-45 번지';

test('LLM 마스킹은 더 강해야 함', () => {
  const result = maskPIIForLLM(text);
  assert.equal(result.piiDetected, true);
  for (const t of ['phone', 'email', 'rrn', 'financial_number', 'address_keyword']) {
    assert.ok(result.piiTypes.includes(t));
  }
  assert.equal(result.masked.includes('010-1234-5678'), false);
  assert.equal(result.masked.includes('900101-1234567'), false);
  assert.equal(result.masked.includes('1234567890123456'), false);
  assert.ok(result.masked.includes('주소(마스킹됨)'));
});

test('저장용 마스킹은 정책상 일부 식별자 유지', () => {
  const result = maskPIIForStorage(text);
  assert.ok(result.masked.includes('EMAIL(t********@example.com)'));
  assert.ok(result.masked.includes('NUM(************3456)'));
  assert.ok(result.masked.includes('서울시 강...'));
});
