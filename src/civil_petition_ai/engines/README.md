# Engine Modules

This directory follows an interface-first modular architecture so each engine can be tested independently.

- petition_structuring
- legal_retrieval
- citation_formatter
- draft_generation
- audit_risk
- output_renderer

Each engine package exposes a base class that raises `NotImplementedError` until a concrete implementation is injected.
This enforces interface-driven development and independent unit testing.
