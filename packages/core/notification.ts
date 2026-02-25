export type NotificationLevel = 'info' | 'warn' | 'error';

export interface NotificationPayload {
  title: string;
  message: string;
  metadata?: Record<string, unknown>;
  requestId?: string;
}

export interface NotificationService {
  notify(level: NotificationLevel, payload: NotificationPayload): Promise<void>;
}
