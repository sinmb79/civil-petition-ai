export class InMemoryStore {
  constructor() {
    this.jobs = [];
    this.drafts = [];
  }

  addJob(job) {
    this.jobs.push({ ...job, created_at: new Date(), updated_at: new Date() });
  }

  addDraft(draft, ttlHours) {
    const now = new Date();
    const expiresAt = new Date(now.getTime() + ttlHours * 60 * 60 * 1000);
    this.drafts.push({ ...draft, expires_at: expiresAt, created_at: now, updated_at: now });
    this.purgeExpiredDrafts(now);
  }

  purgeExpiredDrafts(now = new Date()) {
    this.drafts = this.drafts.filter((draft) => draft.expires_at > now);
  }

  getDailyMetrics(date = new Date()) {
    const y = date.getUTCFullYear();
    const m = date.getUTCMonth();
    const d = date.getUTCDate();
    const jobs = this.jobs.filter((job) => {
      const c = job.created_at;
      return c.getUTCFullYear() === y && c.getUTCMonth() === m && c.getUTCDate() === d;
    });

    const total = jobs.length;
    const avg = total ? jobs.reduce((sum, j) => sum + (j.processing_time_ms || 0), 0) / total : 0;
    const highRisk = total ? jobs.filter((j) => j.audit_risk_level === 'HIGH').length / total : 0;
    const failures = total ? jobs.filter((j) => j.error_flag).length / total : 0;

    return {
      total_requests: total,
      avg_processing_time: Math.round(avg),
      high_risk_ratio: Number(highRisk.toFixed(4)),
      failure_rate: Number(failures.toFixed(4))
    };
  }
}
