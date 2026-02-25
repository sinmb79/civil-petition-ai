"""Petition structuring engine skeleton."""

from __future__ import annotations

from typing import Any

from civil_petition_ai.engines.interfaces import PetitionStructuringEngine


class BasePetitionStructuringEngine(PetitionStructuringEngine):
    """Empty petition structuring class for future concrete implementations."""

    def structure(self, petition_text: str) -> dict[str, Any]:
        raise NotImplementedError("Implement petition text structuring rules.")
