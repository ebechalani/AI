# WS-J-1: reads of the WS-J screens that 3.7 did not list, and the `IssueCertificateButton` behaviour

- **From:** WS-J (Robotics, challenges, achievements, certificates, settings; build spec), 2026-10-16
- **Status:** closed. Landed by the foundation maintainer on 2026-10-16 (documentation only; no
  code, schema, rule or index change).
- **Frozen files concerned:** `docs/ARCHITECTURE.md` (3.7, 7.7)

## Problem

3.7 lets a screen issue only the reads listed for it. Three things in WS-J's screens were not
described, or were described wrongly. Every read below reuses a shape that 3.7 and 3.8 already
list, or is a read by id, so none needs a new index.

1. **(a) Student Robotics.** The row said "global challenge query filtered to `area == 'robotics'`
   in memory". The only repository function, `listChallengesForUser(actor, { upcomingOrOpenOnly:
   true })` (`src/lib/data/challenges.ts`), also runs the school-scoped query whenever the actor
   has a school, so the row did not describe the reads the page issues.
2. **(b) Reads by id that no row named** (the WS-D-2 precedent lists direct gets):
   - the printable certificate page `/certificates/[certificateId]` had no row: `getCertificate`
     reads `certificates/{id}`, and for a teacher viewer also `users/{holderUid}` (`teachesHolder`:
     a teacher reaches a certificate through its holder, a pupil of a class they teach);
   - the row "Student Challenges" did not name the challenge detail's `challenges/{id}` get
     (`getChallenge`);
   - Student Settings had no row: it reads `users/{uid}` with `getUser`.
3. **(c) 7.7** gave `IssueCertificateButton`'s props but not its behaviour, and the stub's TSDoc
   ("offers re-issue") is wrong. A revocation clears `enrollment.certificateId`
   (`revokeCertificateById`, 9.5), so a non-null `existingCertificateId` from Reports is always an
   issued certificate, and a revoked one comes back through the `null` branch (the service issues
   it again with a new code). WS-E's Reports (this round, passing `row.certificateId` in both
   cells) and WS-H later consume the button.

## Change (landed)

`docs/ARCHITECTURE.md`:

- 3.7 row "Student Robotics": "the Student Home challenge queries without the limit (global;
  school only when `schoolId` is not null; `deadlineAt >= now`), filtered to `area == 'robotics'`
  in memory (`listChallengesForUser` with `upcomingOrOpenOnly`; same shapes and indexes as Student
  Home, a limit does not change the shape)".
- 3.7 row "Student Challenges": the sentence "Challenge detail" starts with "`challenges/{id}` by
  id (`getChallenge`);".
- 3.7 new row "Certificate (printable, `/certificates/[certificateId]`)": "`certificates/{id}`
  (`getCertificate`), plus `users/{holderUid}` inside `getCertificate` when the viewer is a
  teacher (a teacher reaches a certificate through its holder, a pupil of a class they teach).
  Direct gets only".
- 3.7 new row "Student Settings": "`users/{uid}` (`getUser`: sign-in identifier, age band, class
  count; the same document the session reads)".
- 7.7, after the paragraph on `FileUpload` and `TutorPanel`: "`IssueCertificateButton`
  (behaviour; the props are unchanged): `existingCertificateId` is the enrollment's
  `certificateId`, which a revocation clears (9.5). With `null`, the control issues after a
  confirmation through `issueCertificateAction`; the service decides (9.5), and a revoked
  certificate is issued again with a new code. With an id, it links to `/certificates/{id}`, whose
  page lets the issuing teacher or a platform admin revoke the certificate or issue a revoked one
  again. Consumers keep the control mounted across the refresh (they pass the new id) so focus
  moves to the new link."

The stub's TSDoc in `src/components/certificates/IssueCertificateButton.tsx` (owned by WS-J) is
corrected by WS-J when it replaces the stub.
