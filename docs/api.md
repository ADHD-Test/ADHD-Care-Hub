# API reference

Base path `/api/v1`. All responses are `{ "data": ... }` on success and
`{ "error": { "code", "message", "details" } }` on failure.

Authentication: `Authorization: Bearer <accessToken>`. The refresh token lives
in the `adhd_rt` httpOnly cookie.

## Auth

| Method | Path | Auth | Purpose |
| --- | --- | --- | --- |
| POST | `/auth/register` | — | Create an account with the three consent records |
| POST | `/auth/login` | — | Returns an access token, sets the refresh cookie |
| POST | `/auth/refresh` | cookie | Rotates the refresh token |
| POST | `/auth/logout` | yes | Revokes the refresh token |

## Users

| Method | Path | Purpose |
| --- | --- | --- |
| GET | `/users/me` | Account, profile and consent state |
| PATCH | `/users/me/profile` | Update name, phone, locale, timezone |
| GET | `/users/me/export` | GDPR Art. 20 export |
| DELETE | `/users/me` | GDPR Art. 17 erasure request |

## Screening

| Method | Path | Purpose |
| --- | --- | --- |
| POST | `/screening/sessions` | Start a session, returns the items |
| POST | `/screening/sessions/:id/submit` | Submit answers, returns the banded indication |
| GET | `/screening/sessions` | Completed sessions for the signed-in user |

## Consultations

| Method | Path | Purpose |
| --- | --- | --- |
| GET | `/consultations/slots` | Open slots, `?from=&to=` |
| POST | `/consultations` | Book a slot |
| GET | `/consultations` | Bookings for the signed-in user or provider |
| POST | `/consultations/:id/cancel` | Cancel and release the slot |
| POST | `/consultations/:id/notes` | Clinician only, encrypted note |

## Coaching

| Method | Path | Purpose |
| --- | --- | --- |
| GET | `/coaching/programs` | Published programmes |
| GET | `/coaching/programs/:slug` | Programme with module list |
| POST | `/coaching/enrolments` | Join a programme |
| POST | `/coaching/modules/:id/complete` | Mark a module complete |

## Tracking

| Method | Path | Purpose |
| --- | --- | --- |
| PUT | `/tracking/check-ins` | Upsert today's check-in |
| GET | `/tracking/check-ins` | History, `?days=30` |
| GET | `/tracking/routines` | Active routines with recent completions |
| POST | `/tracking/routines` | Create a routine |
| POST | `/tracking/routines/:id/complete` | Mark done for today |

Replace this table with a generated OpenAPI document once the endpoints settle.
