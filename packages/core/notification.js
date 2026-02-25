export class LogNotificationService {
  async notify(level, payload) {
    const output = {
      level,
      ...payload,
      timestamp: new Date().toISOString()
    };

    if (level === 'warn') {
      console.warn(output);
      return;
    }

    if (level === 'error') {
      console.error(output);
      return;
    }

    console.log(output);
  }
}
