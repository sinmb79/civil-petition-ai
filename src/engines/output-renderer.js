import { validateDraftSchema } from "../validators/schema.js";

export function renderOutput(output) {
  const errors = validateDraftSchema(output);
  if (errors.length > 0) {
    throw new Error(`Schema validation failed: ${errors.join(", ")}`);
  }
  return output;
}
