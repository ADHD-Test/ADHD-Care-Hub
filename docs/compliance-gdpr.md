# Data protection notes

Working notes for engineers. Not legal advice, and not a substitute for review
by the data protection officer. Everything below concerns Art. 9 GDPR special
category data, because everything this product stores about a patient is health
data by inference.

## Legal basis

The pilot relies on explicit consent under Art. 9(2)(a). That is why
registration captures three separate consent records (terms, privacy, health
data processing) with the document version attached. Consent is only valid if it
is as easy to withdraw as to give — the withdrawal path must ship before launch.

## Data map

| Category | Where | Notes |
| --- | --- | --- |
| Identity | `User`, `Profile` | Email is the login identifier |
| Consent | `ConsentRecord` | Versioned, never overwritten |
| Screening | `ScreeningSession`, `ScreeningResponse` | Health data |
| Appointments | `Consultation`, `AvailabilitySlot` | Health data by inference |
| Clinical notes | `Consultation.clinicalNoteCipher` | Encrypted at application layer |
| Self-tracking | `DailyCheckIn`, `Routine*` | Health data |
| Access trail | `AuditEvent` | Append-only, retained beyond erasure |

## Data subject rights

| Right | Article | Status |
| --- | --- | --- |
| Access | 15 | `GET /users/me` |
| Portability | 20 | `GET /users/me/export` (JSON) |
| Erasure | 17 | `DELETE /users/me` — soft delete; purge job still to build |
| Rectification | 16 | `PATCH /users/me/profile` |
| Withdraw consent | 7(3) | Endpoint still to build |
| Object / restrict | 18, 21 | Manual process for the pilot; document it |

Erasure is two-stage on purpose: the account is deactivated and tokens revoked
immediately, then a scheduled job purges payloads after the statutory retention
window. Audit rows survive — they are the record of lawful processing, and
deleting them would defeat their purpose. Confirm the applicable retention
period with the DPO before building the purge job; documentation duties under
German medical law can require longer retention than the user expects.

## Engineering rules

1. Never log health data. `lib/logger.ts` holds the redaction list — extend it
   with every new free-text field.
2. Never put health data in `AuditEvent.metadata`. Identifiers and state
   transitions only.
3. Every read of another person's health record goes through `recordAudit`.
4. Staging and local environments never receive a copy of production data.
5. New third-party service means a new sub-processor: it needs a DPA, an entry
   in the processing record, and a line in the privacy policy before it ships.
6. Secrets come from the environment. Nothing is committed, including the
   `PHI_ENCRYPTION_KEY`.

## Before the pilot starts

- [ ] Record of processing activities (Art. 30)
- [ ] Data protection impact assessment — likely mandatory for large-scale
      processing of health data (Art. 35)
- [ ] Data processing agreements with hosting, email, and video providers
- [ ] Technical and organisational measures documented (Art. 32)
- [ ] Breach notification runbook, 72-hour clock
- [ ] Penetration test and dependency audit
- [ ] Deletion and retention schedule signed off
