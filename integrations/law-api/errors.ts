export class TimeoutError extends Error {
  constructor(message = 'Law API request timed out') {
    super(message);
    this.name = 'TimeoutError';
  }
}

export class RateLimitError extends Error {
  constructor(message = 'Law API rate limit exceeded') {
    super(message);
    this.name = 'RateLimitError';
  }
}

export class UpstreamError extends Error {
  constructor(
    message: string,
    public readonly status?: number,
  ) {
    super(message);
    this.name = 'UpstreamError';
  }
}
