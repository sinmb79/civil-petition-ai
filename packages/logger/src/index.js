export class StructuredLogger {
  constructor(sink = console.log) {
    this.sink = sink;
  }

  log(level, event, context) {
    this.sink(
      JSON.stringify({
        timestamp: new Date().toISOString(),
        level,
        event,
        ...context,
      }),
    );
  }

  lawApiCall(context) {
    this.log(context.error_type ? 'warn' : 'info', 'law_api_call', context);
  }
}
