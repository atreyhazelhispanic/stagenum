# Production Application Foundation

This guide runs the production TypeScript foundation created for issue #18. It
is intentionally separate from `prototype/`, which remains a synthetic research
artifact.

The foundation contains no production credentials, real customer data, or
implemented project, review, billing, or payment workflow.

## Prerequisites

- Node.js 22.13.0, recorded in `.nvmrc`
- npm
- Docker with Compose for local PostgreSQL and captured email

## First local start

From the repository root:

```bash
nvm use
npm ci
cp .env.example .env.local
docker compose up -d postgres mailpit
set -a
source .env.local
set +a
npm run db:migrate
npm run db:check
npm run dev
```

Open `http://localhost:3000`. Mailpit is available at
`http://localhost:8025`, although the foundation does not send email yet.

In a second shell, load the same environment and start the separate worker
process:

```bash
set -a
source .env.local
set +a
PROCESS_ROLE=worker npm run worker
```

The worker currently verifies database access and observes claimable outbox
work. It does not claim or execute jobs until bounded handlers are implemented.
This prevents foundation code from inventing product behavior.

Stop local infrastructure without deleting its volume:

```bash
docker compose stop
```

## Commands

| Command | Purpose |
| --- | --- |
| `npm run dev` | Start the production web/API foundation in development mode |
| `npm run worker` | Start the separate outbox-compatible worker entry point |
| `npm run db:migrate` | Apply pending forward SQL migrations under one advisory lock |
| `npm run db:check` | Verify the current migration and foundational tables |
| `npm run lint` | Run source linting |
| `npm run typecheck` | Run strict TypeScript checking without emission |
| `npm test` | Run unit and architecture-boundary tests |
| `npm run build` | Produce the production Next.js build |
| `npm run quality` | Run lint, types, tests, and build |

Prototype commands still run from `prototype/` and have their own lockfile and
CI workflow.

## Health contract

- `GET /api/health/live` proves that the web process can answer. It performs no
  database or optional-provider call, so infrastructure trouble does not cause
  a platform restart loop.
- `GET /api/health/ready` checks a bounded PostgreSQL query and verifies that
  the latest repository migration is applied. It returns `503` when the process
  should not receive traffic.

Neither endpoint returns exception, connection, credential, or private-data
details. Worker health will become an operational heartbeat and outbox-age
signal when a hosting provider is selected.

## Configuration and secrets

`src/config/environment.ts` validates configuration at process startup. Error
messages name invalid variables but omit their values. `.env.example` contains
safe local values only; `.env.local` and other real environment files are
ignored.

Deployed staging and production values must come from the platform secret and
configuration facilities. They must not be baked into the image, committed,
copied from production into staging, or exposed through `NEXT_PUBLIC_*` names.

## Database and migrations

The foundation uses the narrow `pg` driver behind infrastructure adapters. The
driver and row shapes do not enter domain or application code. This is not an
ORM selection and does not change ADR-004.

Migrations remain globally ordered SQL files in `db/migrations/`. The runner:

1. takes a PostgreSQL advisory lock so one runner advances the schema;
2. checks immutable SHA-256 checksums for applied files;
3. applies each migration and its history row in one transaction; and
4. never runs migrations automatically during web or worker startup.

The current runner requires each migration file to retain its visible
`BEGIN;`/`COMMIT;` wrapper, which it moves under runner ownership. A future
migration requiring a non-transactional PostgreSQL operation, such as a
concurrent index, needs an explicit runner design and review rather than an
implicit exception.

Production application credentials must not own schema-mutation privileges.
Deployment uses a separate migration identity.

## Module boundaries

`src/modules/README.md` defines the domain, application, and infrastructure
dependency direction. The `system` module demonstrates it with readiness:

```text
HTTP route -> application port/use case -> domain result
                                  ^
                                  |
                    PostgreSQL infrastructure adapter
```

Architecture tests reject framework, PostgreSQL, logging, and provider imports
from domain/application layers. Future product modules add their own narrower
rules as their public interfaces become concrete.

## Container roles

The `Dockerfile` builds one immutable Node.js image. Its default command starts
the web process. A managed platform starts the worker from the same image with:

```bash
PROCESS_ROLE=worker npm run worker
```

The image contains no environment-specific secrets. Staging and production
must promote the same image digest with separate configuration, databases, and
credentials.
