export function createCaptchaMiddleware(enabled) {
  return function captchaCheck(req, res, next) {
    if (!enabled) {
      return next();
    }

    const token = req.headers['x-turnstile-token'] || req.body?.captchaToken;
    if (token !== 'valid-test-token') {
      return res.status(403).json({ message: 'Captcha verification failed' });
    }

    next();
  };
}
