# Contributing

## Branching

`main` is always deployable. Work branches off `develop`:

```
feat/screening-retake
fix/slot-double-booking
chore/bump-prisma
```

Squash-merge into `develop`, release by merging `develop` into `main` with a tag.

## Commits

Conventional commits: `feat:`, `fix:`, `chore:`, `docs:`, `refactor:`, `test:`.
Reference the issue in the body, not the subject line.

## Definition of done

- Types check and tests pass locally (`npm run build && npm run test`).
- New endpoints have Zod validation and, where they touch health data, an audit
  event.
- Schema changes ship as a Prisma migration with a rollback plan noted in the PR.
- The PR template risk questions are answered honestly, including "no".
- User-facing copy follows the interface voice: plain verbs, sentence case, and
  errors that say what to do next.

## Review

Two things a reviewer must check beyond correctness:

1. Could this leak health data — into a log, an error body, an audit metadata
   field, or a response the caller should not see?
2. Does this change what the product claims to do clinically? If yes, it needs
   regulatory sign-off before merge.
