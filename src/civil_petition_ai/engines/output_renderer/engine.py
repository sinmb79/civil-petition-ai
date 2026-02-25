"""Output renderer engine skeleton."""

from __future__ import annotations

from civil_petition_ai.engines.interfaces import OutputRenderer


class BaseOutputRenderer(OutputRenderer):
    """Empty renderer class for review-ready output rendering."""

    def render(self, payload: dict) -> str:
        raise NotImplementedError("Implement output rendering for review and export.")
