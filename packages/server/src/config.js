export function loadPolicyConfig(env = process.env) {
  const rawToggle = env.STORE_RAW_PETITION_TEXT ?? 'true';
  const roleCsv = env.RAW_TEXT_VISIBLE_ROLES ?? 'ADMIN';

  return {
    storeRawPetitionText: rawToggle.toLowerCase() === 'true',
    rawTextVisibleRoles: roleCsv
      .split(',')
      .map((r) => r.trim().toUpperCase())
      .filter(Boolean)
  };
}
