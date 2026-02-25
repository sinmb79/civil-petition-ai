"""Independent skeleton tests for the remaining engine modules."""

import pytest

from civil_petition_ai.engines.citation_formatter import BaseCitationFormatter
from civil_petition_ai.engines.draft_generation import BaseDraftGenerationEngine
from civil_petition_ai.engines.output_renderer import BaseOutputRenderer
from civil_petition_ai.engines.petition_structuring import BasePetitionStructuringEngine


def test_petition_structuring_engine_requires_implementation() -> None:
    engine = BasePetitionStructuringEngine()

    with pytest.raises(NotImplementedError):
        engine.structure("민원 내용")


def test_citation_formatter_requires_implementation() -> None:
    engine = BaseCitationFormatter()

    with pytest.raises(NotImplementedError):
        engine.format([])


def test_draft_generation_engine_requires_implementation() -> None:
    engine = BaseDraftGenerationEngine()

    with pytest.raises(NotImplementedError):
        engine.generate({})


def test_output_renderer_requires_implementation() -> None:
    engine = BaseOutputRenderer()

    with pytest.raises(NotImplementedError):
        engine.render({})
