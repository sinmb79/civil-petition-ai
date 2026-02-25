export type LogLevel = 'info' | 'warn' | 'error';

export interface LawApiLogContext {
  request_id: string;
  endpoint: 'search' | 'articles';
  latency_ms: number;
  cache_hit: boolean;
  retry_count: number;
  result_count: number;
  error_type?: string;
}

export interface Logger {
  log(level: LogLevel, event: string, context: Record<string, unknown>): void;
  lawApiCall(context: LawApiLogContext): void;
}

export class StructuredLogger implements Logger {
  constructor(private readonly sink: (line: string) => void = console.log) {}

  log(level: LogLevel, event: string, context: Record<string, unknown>): void {
    this.sink(
      JSON.stringify({
        timestamp: new Date().toISOString(),
        level,
        event,
        ...context,
      }),
    );
  }

  lawApiCall(context: LawApiLogContext): void {
    this.log(context.error_type ? 'warn' : 'info', 'law_api_call', context);
  }
}
