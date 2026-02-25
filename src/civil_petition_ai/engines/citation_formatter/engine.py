"""Citation formatter engine skeleton."""

from __future__ import annotations

from typing import Any

from civil_petition_ai.engines.interfaces import CitationFormatter


class BaseCitationFormatter(CitationFormatter):
    """Empty citation formatter class for completeness validation implementations."""

    def format(self, legal_sources: list[dict[str, Any]]) -> list[dict[str, Any]]:
        raise NotImplementedError("Implement citation completeness validation and formatting.")
