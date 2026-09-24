# Production module boundaries

Each Stagenum capability is organized as a vertical module with three internal
layers:

- `domain/` contains business types, invariants, and events. It imports neither
  frameworks nor infrastructure.
- `application/` contains use cases and the ports they require. It may depend on
  its module's domain but not a database client, Next.js, or vendor SDK.
- `infrastructure/` implements application ports using PostgreSQL or external
  providers. It is the only module layer that knows those implementation tools.

HTTP routes and worker entry points are composition roots: they authenticate and
validate an external request, construct adapters, invoke application use cases,
and translate the result. They do not own business rules.

The initial `system` module demonstrates the dependency direction through
readiness checks without prematurely implementing product behavior. Future
modules follow the accepted architecture names:

1. identity and access;
2. projects and agreements;
3. submissions and reviews;
4. billing;
5. payments and ledger;
6. evidence;
7. notifications;
8. audit and timeline; and
9. operations and jobs.

A module exposes a deliberate public application interface rather than another
module importing its internal database adapter. Cross-module transactions are
coordinated by an application use case and explicit transaction context.
Generic CRUD repositories and unrestricted database access are not public
module APIs.
