"""Interface-first engine contracts for independent testing."""

from __future__ import annotations

from abc import ABC, abstractmethod
from typing import Any


class PetitionStructuringEngine(ABC):
    @abstractmethod
    def structure(self, petition_text: str) -> dict[str, Any]:
        """Convert free-text petition input into normalized structured fields."""


class LegalRetrievalEngine(ABC):
    @abstractmethod
    def retrieve(self, query: str) -> list[dict[str, Any]]:
        """Return legal sources with citation fields for a petition query."""


class CitationFormatter(ABC):
    @abstractmethod
    def format(self, legal_sources: list[dict[str, Any]]) -> list[dict[str, Any]]:
        """Normalize and validate citation completeness."""


class DraftGenerationEngine(ABC):
    @abstractmethod
    def generate(self, context: dict[str, Any]) -> dict[str, Any]:
        """Produce the strict output JSON payload."""


class AuditRiskEngine(ABC):
    @abstractmethod
    def evaluate(self, context: dict[str, Any]) -> dict[str, Any]:
        """Produce deterministic LOW/MODERATE/HIGH audit risk output."""


class OutputRenderer(ABC):
    @abstractmethod
    def render(self, payload: dict[str, Any]) -> str:
        """Render machine output into a review-ready representation."""
