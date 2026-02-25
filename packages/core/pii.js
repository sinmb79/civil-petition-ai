const PHONE_PATTERN = /(?:\+?82[-\s]?)?(?:0\d{1,2})[-.\s]?\d{3,4}[-.\s]?\d{4}(?!\d)/g;
const EMAIL_PATTERN = /\b[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}\b/gi;
const RRN_PATTERN = /(?<!\d)\d{6}-\d{7}(?!\d)/g;
const LONG_NUMBER_PATTERN = /\b\d{12,16}\b/g;
const ADDRESS_PATTERN = /(?:[가-힣A-Za-z0-9\-\s]{1,40})?(?:시|도)\s*(?:[가-힣A-Za-z0-9\-\s]{1,20}(?:구|군))\s*(?:[가-힣A-Za-z0-9\-\s]{1,20}(?:동|읍|면))[^\n,]{0,20}(?:번지|로|길)?/g;

function maskPhone(match, strong) {
  const digits = match.replace(/\D/g, '');
  if (digits.length < 8) return match;
  const visibleTail = strong ? 0 : 2;
  const tail = visibleTail > 0 ? digits.slice(-visibleTail) : '';
  const maskedDigits = `${'*'.repeat(Math.max(0, digits.length - visibleTail))}${tail}`;
  return `PHONE(${maskedDigits})`;
}

function maskEmail(match, strong) {
  const [local = '', domain = ''] = match.split('@');
  if (!domain) return 'EMAIL(***)';
  if (strong) return `EMAIL(${domain})`;
  const visible = local.slice(0, 1);
  return `EMAIL(${visible}${'*'.repeat(Math.max(1, local.length - 1))}@${domain})`;
}

function maskRRN(match, strong) {
  const [front] = match.split('-');
  if (strong) return `RRN(${front.slice(0, 2)}****-*******)`;
  return `RRN(${front}-*******)`;
}

function maskLongNumber(match, strong) {
  const visible = strong ? 0 : 4;
  return `NUM(${'*'.repeat(match.length - visible)}${visible ? match.slice(-visible) : ''})`;
}

function maskAddressKeyword(match, strong) {
  const trimmed = match.trim();
  if (!trimmed) return match;
  if (strong) return '주소(마스킹됨)';
  const head = trimmed.slice(0, Math.min(8, trimmed.length));
  return `${head}...`;
}

function dedupe(arr) {
  return [...new Set(arr)];
}

function maskPII(text, strong) {
  const types = [];
  let masked = text;

  masked = masked.replace(RRN_PATTERN, (m) => {
    types.push('rrn');
    return maskRRN(m, strong);
  });

  masked = masked.replace(PHONE_PATTERN, (m) => {
    types.push('phone');
    return maskPhone(m, strong);
  });

  masked = masked.replace(EMAIL_PATTERN, (m) => {
    types.push('email');
    return maskEmail(m, strong);
  });

  masked = masked.replace(LONG_NUMBER_PATTERN, (m) => {
    types.push('financial_number');
    return maskLongNumber(m, strong);
  });

  masked = masked.replace(ADDRESS_PATTERN, (m) => {
    if (!/(시|도).*(구|군).*(동|읍|면)/.test(m)) return m;
    types.push('address_keyword');
    return maskAddressKeyword(m, strong);
  });

  return {
    masked,
    piiDetected: types.length > 0,
    piiTypes: dedupe(types)
  };
}

export function maskPIIForLLM(text) {
  return maskPII(text, true);
}

export function maskPIIForStorage(text) {
  return maskPII(text, false);
}
