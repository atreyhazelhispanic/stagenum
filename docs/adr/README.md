# Architecture Decision Records

Architecture Decision Records (ADRs) capture significant StagePaid technical
decisions, the context in which they were made, and the consequences the team
accepts. They complement the
[initial system architecture](../architecture/initial-system-architecture.md)
without turning that overview into a history of every implementation choice.

## Statuses

- **Proposed:** Draft decision under active review.
- **Accepted:** Current decision that implementations should follow.
- **Superseded:** Replaced by a newer ADR; the original remains in history.
- **Deprecated:** No longer recommended, but not replaced by one specific ADR.
- **Rejected:** Considered and intentionally not adopted.

Accepted ADRs are immutable decision records. A material change creates a new
ADR that links to and supersedes the earlier record. Typographical corrections
and link repairs do not require supersession.

## Index

| ADR | Decision | Status |
| --- | --- | --- |
| [ADR-001](0001-modular-monolith.md) | Start with a modular monolith | Accepted |
| [ADR-002](0002-typescript-primary-language.md) | Use TypeScript as the primary application language | Accepted |

## Naming

ADR filenames use a four-digit sequence and a short kebab-case title:

```text
0001-modular-monolith.md
0002-primary-application-language.md
```

Copy [`template.md`](template.md) when drafting a new decision.
