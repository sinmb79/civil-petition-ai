"""Audit engine test skeleton."""

import pytest

from civil_petition_ai.engines.audit_risk import BaseAuditEngine


def test_audit_engine_requires_implementation() -> None:
    engine = BaseAuditEngine()

    with pytest.raises(NotImplementedError):
        engine.evaluate({"petition_id": "P-001"})
