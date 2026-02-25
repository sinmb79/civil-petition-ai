import { readdirSync, readFileSync } from "node:fs";
import { join } from "node:path";
import { runPipeline } from "../../src/pipeline.js";
import { validateCitationCompleteness } from "../../src/validators/citation-validator.js";
import { validateDraftSchema } from "../../src/validators/schema.js";

const scenarioDir = join(process.cwd(), "tests/evals/scenarios");
const legalSources = JSON.parse(readFileSync(join(process.cwd(), "tests/evals/mocks/legal-sources.json"), "utf8"));
const auditCases = JSON.parse(readFileSync(join(process.cwd(), "tests/evals/mocks/audit-cases.json"), "utf8"));

const scenarioFiles = readdirSync(scenarioDir)
  .filter((file) => file.endsWith(".json"))
  .sort();

let failCount = 0;

for (const file of scenarioFiles) {
  const scenario = JSON.parse(readFileSync(join(scenarioDir, file), "utf8"));
  const errors = [];

  const result = runPipeline({
    petition: scenario.petition,
    legalSources,
    auditCases,
    aiMode: "stub"
  });

  const schemaErrors = validateDraftSchema(result);
  if (schemaErrors.length > 0) {
    errors.push(`schema validation failed: ${schemaErrors.join("; ")}`);
  }

  if (scenario.expected.must_include_citation_fields) {
    const citationErrors = validateCitationCompleteness(result.legal_basis);
    if (citationErrors.length > 0) {
      errors.push(`citation validation failed: ${citationErrors.join("; ")}`);
    }
  }

  if (!scenario.expected.decision_allowed.includes(result.decision)) {
    errors.push(
      `decision mismatch: expected one of [${scenario.expected.decision_allowed.join(", ")}], got ${result.decision}`
    );
  }

  if (result.audit_risk.level !== scenario.expected.audit_level_expected) {
    errors.push(`audit level mismatch: expected ${scenario.expected.audit_level_expected}, got ${result.audit_risk.level}`);
  }

  if (scenario.expected.rules_expected) {
    const actualRules = [...result.audit_risk.rules].sort();
    const expectedRules = [...scenario.expected.rules_expected].sort();
    if (JSON.stringify(actualRules) !== JSON.stringify(expectedRules)) {
      errors.push(`audit rules mismatch: expected ${expectedRules.join(",")}, got ${actualRules.join(",")}`);
    }
  }

  const repeated = runPipeline({
    petition: scenario.petition,
    legalSources,
    auditCases,
    aiMode: "stub"
  });

  const deterministicCheck =
    result.audit_risk.score === repeated.audit_risk.score &&
    result.audit_risk.level === repeated.audit_risk.level &&
    JSON.stringify(result.audit_risk.rules) === JSON.stringify(repeated.audit_risk.rules);

  if (!deterministicCheck) {
    errors.push("audit deterministic check failed between repeated runs");
  }

  if (errors.length > 0) {
    failCount += 1;
    console.error(`❌ ${scenario.id} (${file})`);
    errors.forEach((error) => console.error(`   - ${error}`));
  } else {
    console.log(`✅ ${scenario.id} (${file})`);
  }
}

if (failCount > 0) {
  console.error(`\nEvaluation failed: ${failCount} scenario(s) failed.`);
  process.exit(1);
}

console.log(`\nAll evaluations passed (${scenarioFiles.length} scenarios).`);
