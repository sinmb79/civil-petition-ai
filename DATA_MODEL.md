Data Model Definition
1. Petition
{
  "id": "UUID",
  "raw_text": "string",
  "processing_type": "string",
  "budget_related": "boolean",
  "discretionary": "boolean",
  "created_at": "datetime",
  "updated_at": "datetime"
}
2. LegalSource
{
  "id": "UUID",
  "source_type": "STATUTE | ORDINANCE | PRECEDENT | APPEAL | BUDGET | AUDIT",
  "title": "string",
  "reference_number": "string",
  "article": "string",
  "effective_date": "date",
  "content": "string",
  "source_url": "string",
  "created_at": "datetime",
  "updated_at": "datetime"
}
3. Citation
{
  "id": "UUID",
  "petition_id": "UUID",
  "legal_source_id": "UUID",
  "excerpt": "string"
}
4. DraftReply
{
  "id": "UUID",
  "petition_id": "UUID",
  "petition_summary": "string",
  "fact_analysis": "string",
  "legal_review": "string",
  "decision": "ACCEPT | PARTIAL | REJECT | TRANSFER | REQUEST_INFO",
  "action_plan": "string",
  "audit_risk_level": "LOW | MODERATE | HIGH",
  "created_at": "datetime",
  "updated_at": "datetime"
}
5. AuditFinding
{
  "id": "UUID",
  "petition_id": "UUID",
  "risk_type": "string",
  "description": "string",
  "recommendation": "string",
  "severity": "LOW | MODERATE | HIGH"
}
6. TenantRiskProfile
{
  "id": "UUID",
  "tenant_id": "string",
  "risk_type": "string",
  "base_weight": "number",
  "escalation_factor": "number",
  "updated_at": "datetime"
}
7. AuditFindingAggregate
{
  "id": "UUID",
  "tenant_id": "string",
  "risk_type": "string",
  "count": "number",
  "last_detected_at": "datetime",
  "created_at": "datetime",
  "updated_at": "datetime"
}
