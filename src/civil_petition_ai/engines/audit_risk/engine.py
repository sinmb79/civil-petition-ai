"""Audit engine skeleton."""

from __future__ import annotations

from typing import Any

from civil_petition_ai.engines.interfaces import AuditRiskEngine


class BaseAuditEngine(AuditRiskEngine):
    """Empty audit risk class for deterministic rule implementation."""

    def evaluate(self, context: dict[str, Any]) -> dict[str, Any]:
        raise NotImplementedError("Implement deterministic audit risk evaluation rules.")
