"""Draft generation engine skeleton."""

from __future__ import annotations

from typing import Any

from civil_petition_ai.engines.interfaces import DraftGenerationEngine


class BaseDraftGenerationEngine(DraftGenerationEngine):
    """Empty draft generation class for strict JSON schema generation."""

    def generate(self, context: dict[str, Any]) -> dict[str, Any]:
        raise NotImplementedError("Implement strict-schema draft generation.")
