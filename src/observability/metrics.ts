type MetricsState = {
  total_generate_requests: number;
  total_jobs_created: number;
  total_jobs_failed: number;
  total_processing_time_ms: number;
  total_processing_samples: number;
};

const state: MetricsState = {
  total_generate_requests: 0,
  total_jobs_created: 0,
  total_jobs_failed: 0,
  total_processing_time_ms: 0,
  total_processing_samples: 0
};

export function incGenerateRequests(): void {
  state.total_generate_requests += 1;
}

export function incJobsCreated(): void {
  state.total_jobs_created += 1;
}

export function incJobsFailed(): void {
  state.total_jobs_failed += 1;
}

export function recordProcessingTimeMs(ms: number): void {
  if (!Number.isFinite(ms) || ms < 0) {
    return;
  }
  state.total_processing_time_ms += ms;
  state.total_processing_samples += 1;
}

export function getMetricsSnapshot(): {
  total_generate_requests: number;
  total_jobs_created: number;
  total_jobs_failed: number;
  avg_processing_time_ms: number;
} {
  return {
    total_generate_requests: state.total_generate_requests,
    total_jobs_created: state.total_jobs_created,
    total_jobs_failed: state.total_jobs_failed,
    avg_processing_time_ms:
      state.total_processing_samples === 0
        ? 0
        : Number((state.total_processing_time_ms / state.total_processing_samples).toFixed(2))
  };
}

export function __resetMetricsForTests(): void {
  state.total_generate_requests = 0;
  state.total_jobs_created = 0;
  state.total_jobs_failed = 0;
  state.total_processing_time_ms = 0;
  state.total_processing_samples = 0;
}
