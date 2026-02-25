export interface LogEvent {
  timestamp: string;
  requestId: string;
  sourceReferences: string[];
  riskLevel: 'LOW' | 'MODERATE' | 'HIGH';
}

export interface Logger {
  info(event: LogEvent): void;
  error(event: LogEvent & { error: string }): void;
}
