"""Legal engine skeleton."""

from __future__ import annotations

from typing import Any

from civil_petition_ai.engines.interfaces import LegalRetrievalEngine


class BaseLegalEngine(LegalRetrievalEngine):
    """Empty legal retrieval class for future concrete adapters."""

    def retrieve(self, query: str) -> list[dict[str, Any]]:
        raise NotImplementedError("Implement retrieval against legal source providers.")
