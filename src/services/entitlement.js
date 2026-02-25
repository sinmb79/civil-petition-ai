export function hasEntitlement(req) {
  return req.headers['x-has-credits'] === 'true';
}
