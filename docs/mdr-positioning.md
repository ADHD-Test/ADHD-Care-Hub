# Regulatory positioning

The MVP is deliberately built as a non-prescribing, non-diagnostic service so it
stays outside the medical device definition at launch. This document exists so
that the boundary is visible in the codebase and cannot be crossed by accident
in a sprint.

Read this before changing anything under `backend/src/modules/screening/`.

## The line

**Inside scope today**

- Presenting a licensed screening questionnaire and returning a banded
  indication with a referral prompt.
- Booking and conducting consultations with qualified clinicians, who make every
  clinical decision themselves.
- Self-tracking (focus, mood, routines) that the user interprets.
- Educational and coaching content.

**Outside scope today**

- Any output phrased as a diagnosis or a probability of having ADHD.
- Any recommendation about medication, dose, or titration.
- Any triage that routes or prioritises patients on clinical grounds.
- Any algorithm that interprets tracking data and tells the user what to do
  clinically.

Under MDR Art. 2(1) and MDCG 2019-11, software crosses into device territory
when it acts for a medical purpose on individual patient data — diagnosis,
prevention, monitoring, prediction, prognosis, or treatment. Software that only
stores, communicates, or performs simple search is not a device. A screening
questionnaire that returns a diagnosis-shaped answer is; one that returns "these
answers suggest speaking to a clinician" is generally not. Rule 11 of Annex VIII
would place a diagnostic-decision version at Class IIa or higher.

## How the boundary is enforced in code

- `screening.service.ts` returns a three-band indication and `isDiagnosis: false`.
  It never produces a score interpretation phrased as a finding.
- Result copy in `ScreeningPage.tsx` states that only a clinician can diagnose.
- The persistent footer in `AppShell.tsx` repeats the non-diagnostic statement.
- `ScreeningSession.disclaimerAckAt` records that the user saw the notice before
  the result was shown.
- CODEOWNERS routes changes in the screening module and in `docs/` to regulatory
  review.

## Triggers for reassessment

Any of these means the classification question reopens before the work starts,
not after:

- Producing a likelihood, probability, or diagnostic label.
- Suggesting, adjusting, or reminding about medication.
- Automated interpretation of tracking data into clinical advice.
- Algorithmic triage or prioritisation of patients.
- Alerting a clinician based on a threshold in patient-entered data.

## If the product does cross the line

Expect: Class IIa under Rule 11, a notified body, ISO 13485 quality management,
ISO 14971 risk management, IEC 62304 software lifecycle, clinical evaluation
under MDR Annex XIV, and post-market surveillance. Plan roughly 12–18 months and
budget accordingly. Also note the German national layer — DiGA listing via BfArM
if reimbursement is the goal, which requires the device classification first.

Confirm the current position with a regulatory consultant before any public
launch. This document records intent; it is not a conformity assessment.
