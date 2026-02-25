export class MockAuditEngine {
  evaluate() {
    return {
      level: 'LOW',
      findings: [],
      recommendations: []
    };
  }
}
