import fs from 'fs';
import path from 'path';

export type RuleSet = {
  forbiddenClaims: string[];
  piiPatterns: string[];
  requestInfoConflictPhrases: string[];
  watchEnabled: boolean;
};

const RULE_FILE_NAMES = {
  forbiddenClaims: 'forbidden_claims.ko.yml',
  piiPatterns: 'pii_patterns.yml',
  consistencyPhrases: 'consistency_phrases.ko.yml',
  config: 'rule_config.yml'
} as const;

let ruleDirectory = path.resolve(process.cwd(), 'rules');
let currentRules: RuleSet = {
  forbiddenClaims: [],
  piiPatterns: [],
  requestInfoConflictPhrases: [],
  watchEnabled: false
};
let initialized = false;
let watching = false;
let watchers: fs.FSWatcher[] = [];

export function initializeRuleLoader(options?: { watch?: boolean }): RuleSet {
  if (!initialized) {
    const loaded = tryLoadRules();
    if (loaded) {
      currentRules = loaded;
    }
    initialized = true;
  }

  const shouldWatch = (options?.watch ?? true) && process.env.NODE_ENV === 'development';
  if (shouldWatch && !watching && currentRules.watchEnabled) {
    startWatching();
  }

  return currentRules;
}

export function getRules(): RuleSet {
  if (!initialized) {
    initializeRuleLoader();
  }
  return currentRules;
}

export function reloadRules(): boolean {
  const loaded = tryLoadRules();
  if (!loaded) {
    return false;
  }

  currentRules = loaded;
  return true;
}

export function __setRuleDirectoryForTests(directory: string): void {
  ruleDirectory = directory;
}

export function __resetRuleLoaderForTests(): void {
  closeWatchers();
  initialized = false;
  watching = false;
  currentRules = {
    forbiddenClaims: [],
    piiPatterns: [],
    requestInfoConflictPhrases: [],
    watchEnabled: false
  };
}

function startWatching(): void {
  watching = true;
  const files = Object.values(RULE_FILE_NAMES);
  for (const file of files) {
    const filePath = path.join(ruleDirectory, file);
    const watcher = fs.watch(filePath, () => {
      reloadRules();
    });
    watchers.push(watcher);
  }
}

function closeWatchers(): void {
  for (const watcher of watchers) {
    watcher.close();
  }
  watchers = [];
}

function tryLoadRules(): RuleSet | null {
  try {
    const forbiddenClaimsRaw = parseYamlSubset(path.join(ruleDirectory, RULE_FILE_NAMES.forbiddenClaims));
    const piiPatternsRaw = parseYamlSubset(path.join(ruleDirectory, RULE_FILE_NAMES.piiPatterns));
    const consistencyRaw = parseYamlSubset(path.join(ruleDirectory, RULE_FILE_NAMES.consistencyPhrases));
    const configRaw = parseYamlSubset(path.join(ruleDirectory, RULE_FILE_NAMES.config));

    return validateRuleSet(forbiddenClaimsRaw, piiPatternsRaw, consistencyRaw, configRaw);
  } catch {
    return null;
  }
}

function parseYamlSubset(filePath: string): unknown {
  // JSON is a valid YAML subset; we keep parser minimal to avoid external dependencies.
  const raw = fs.readFileSync(filePath, 'utf8');
  return JSON.parse(raw);
}

function validateRuleSet(
  forbiddenClaimsRaw: unknown,
  piiPatternsRaw: unknown,
  consistencyRaw: unknown,
  configRaw: unknown
): RuleSet {
  const forbiddenClaims = readStringArray(forbiddenClaimsRaw, 'forbidden_claims');
  const piiPatternMap = readStringMap(piiPatternsRaw, 'pii_patterns');
  const requestInfoConflictPhrases = readStringArray(
    consistencyRaw,
    'request_info_conflict_phrases'
  );
  const watchEnabled = readBoolean(configRaw, 'watch_enabled');

  // Precompile patterns to fail fast on invalid regex.
  const piiPatterns = Object.values(piiPatternMap);
  piiPatterns.forEach((pattern) => {
    // eslint-disable-next-line no-new
    new RegExp(pattern);
  });

  return {
    forbiddenClaims,
    piiPatterns,
    requestInfoConflictPhrases,
    watchEnabled
  };
}

function readStringArray(input: unknown, key: string): string[] {
  if (!isRecord(input) || !Array.isArray(input[key])) {
    throw new Error(`Invalid rule: ${key}`);
  }

  const values = input[key] as unknown[];
  if (!values.every((value) => typeof value === 'string')) {
    throw new Error(`Invalid rule array: ${key}`);
  }

  return values as string[];
}

function readStringMap(input: unknown, key: string): Record<string, string> {
  if (!isRecord(input) || !isRecord(input[key])) {
    throw new Error(`Invalid rule map: ${key}`);
  }

  const value = input[key] as Record<string, unknown>;
  for (const entry of Object.values(value)) {
    if (typeof entry !== 'string') {
      throw new Error(`Invalid map value: ${key}`);
    }
  }

  return value as Record<string, string>;
}

function readBoolean(input: unknown, key: string): boolean {
  if (!isRecord(input) || typeof input[key] !== 'boolean') {
    throw new Error(`Invalid boolean rule: ${key}`);
  }
  return input[key] as boolean;
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return !!value && typeof value === 'object' && !Array.isArray(value);
}
