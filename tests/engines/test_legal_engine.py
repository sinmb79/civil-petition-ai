"""Legal engine test skeleton."""

import pytest

from civil_petition_ai.engines.legal_retrieval import BaseLegalEngine


def test_legal_engine_requires_implementation() -> None:
    engine = BaseLegalEngine()

    with pytest.raises(NotImplementedError):
        engine.retrieve("도로 점용 허가")
