import fs from 'fs';
import os from 'os';
import path from 'path';
import {
  __resetRuleLoaderForTests,
  __setRuleDirectoryForTests,
  getRules,
  initializeRuleLoader,
  reloadRules
} from '../packages/core/src/rules/loader';

function writeRuleFiles(baseDir: string, overrides?: Partial<Record<string, string>>): void {
  const files: Record<string, string> = {
    'forbidden_claims.ko.yml': JSON.stringify(
      {
        forbidden_claims: ['확정합니다', '보장합니다']
      },
      null,
      2
    ),
    'pii_patterns.yml': JSON.stringify(
      {
        pii_patterns: {
          resident_id: '\\b\\d{6}-?[1-4]\\d{6}\\b',
          phone: '\\b(?:01[0-9]|02|0[3-9][0-9])-?\\d{3,4}-?\\d{4}\\b',
          email: '\\b[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\\.[A-Za-z]{2,}\\b'
        }
      },
      null,
      2
    ),
    'consistency_phrases.ko.yml': JSON.stringify(
      {
        request_info_conflict_phrases: ['수용합니다']
      },
      null,
      2
    ),
    'rule_config.yml': JSON.stringify(
      {
        watch_enabled: true,
        environment: 'development'
      },
      null,
      2
    )
  };

  const merged = { ...files, ...(overrides ?? {}) };
  fs.mkdirSync(baseDir, { recursive: true });
  for (const [name, content] of Object.entries(merged)) {
    if (typeof content !== 'string') {
      continue;
    }
    fs.writeFileSync(path.join(baseDir, name), content, 'utf8');
  }
}

describe('rule loader', () => {
  let tempDir: string;

  beforeEach(() => {
    tempDir = fs.mkdtempSync(path.join(os.tmpdir(), 'rule-loader-'));
    writeRuleFiles(tempDir);
    __resetRuleLoaderForTests();
    __setRuleDirectoryForTests(tempDir);
  });

  afterEach(() => {
    __resetRuleLoaderForTests();
    __setRuleDirectoryForTests(path.resolve(process.cwd(), 'rules'));
    fs.rmSync(tempDir, { recursive: true, force: true });
  });

  it('reloads updated rule file content', () => {
    initializeRuleLoader({ watch: false });
    expect(getRules().requestInfoConflictPhrases).toContain('수용합니다');

    fs.writeFileSync(
      path.join(tempDir, 'consistency_phrases.ko.yml'),
      JSON.stringify(
        {
          request_info_conflict_phrases: ['승인합니다']
        },
        null,
        2
      ),
      'utf8'
    );

    const ok = reloadRules();
    expect(ok).toBe(true);
    expect(getRules().requestInfoConflictPhrases).toContain('승인합니다');
    expect(getRules().requestInfoConflictPhrases).not.toContain('수용합니다');
  });

  it('keeps previous rules when yaml parsing fails', () => {
    initializeRuleLoader({ watch: false });
    const previous = getRules();

    fs.writeFileSync(path.join(tempDir, 'pii_patterns.yml'), '{invalid-json', 'utf8');

    const ok = reloadRules();
    expect(ok).toBe(false);
    expect(getRules()).toEqual(previous);
  });
});
