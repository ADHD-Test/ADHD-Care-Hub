# Architecture

## Shape

A two-tier application in one repository, deployed as two artefacts.

```
Browser ──HTTPS──> React SPA (static, CDN/nginx)
                       │  fetch, Bearer access token
                       ▼
                  Express API (Node 20, TypeScript)
                       │  Prisma
                       ▼
                  PostgreSQL 16
```

External dependencies to be selected before pilot: video provider for
teleconsultation, transactional email, and object storage if documents are ever
uploaded. Each becomes a sub-processor and must appear in the processing record.

## Repository layout

```
backend/    Express API, Prisma schema, migrations, seed
frontend/   React SPA (Vite, TypeScript, Tailwind, TanStack Query)
docs/       Architecture, GDPR, regulatory positioning
.github/    CI, CODEOWNERS, PR template
```

Backend modules are vertical slices: `router` (HTTP and validation) → `service`
(business rules) → Prisma. Anything reused across modules lives in `lib/`.
Modules do not import each other's services; if two need the same rule, it moves
to `lib/`.

## Request flow

1. `helmet`, CORS allowlist, JSON body cap, rate limit.
2. `authenticate` verifies the access token and attaches `req.user`.
3. `requireRole` enforces role boundaries where relevant.
4. `validate(schema)` parses the body with Zod; nothing unparsed reaches a service.
5. The service runs the rule and touches the database.
6. `recordAudit` writes the access trail for anything touching health data.
7. `errorHandler` converts `AppError` to a structured response; everything else
   becomes a generic 500 with the detail logged, not returned.

## Authentication

Short-lived access token in memory on the client, refresh token in an
httpOnly, SameSite=strict cookie scoped to `/api/v1/auth`. Refresh tokens are
hashed at rest and rotated single-use, so a stolen token is detectable and
usable at most once. Nothing sensitive is kept in `localStorage`.

MFA is stubbed in the schema (`User.mfaSecret`) and should be mandatory for
`CLINICIAN` and `ADMIN` before any real patient data exists.

## Data handling

- Identity and personal detail are split across `User` and `Profile`.
- Free-text clinical notes are encrypted in the application layer
  (`lib/crypto.ts`, AES-256-GCM) so a database dump alone does not expose them.
- IP addresses are hashed before they are stored on audit or session rows.
- The logger redacts a named list of PHI-bearing fields. Extend that list with
  every new field that can hold free text about a person.

## Environments

| Environment | Purpose | Data |
| --- | --- | --- |
| local | development | seeded fixtures only |
| staging | integration and UAT | synthetic data only, never a production copy |
| production | pilot and live | real data, EU region, restricted access |

Hosting should be EU-region for the pilot (Germany or another EU member state)
with a data processing agreement in place with each provider.

## What is deliberately not here yet

These are the next architectural decisions, not oversights:

- Video consultation provider integration (`Consultation.videoRoomId` is the seam).
- Email verification and password reset flows.
- Background job runner for reminders and the scheduled erasure purge.
- Observability: metrics, traces, and an alerting policy.
- Terminology and interoperability (FHIR resources) if payer or provider
  integration becomes a requirement.
