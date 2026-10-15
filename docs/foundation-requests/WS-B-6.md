# WS-B-6: `CertificateCard` splits the verification code across two lines

- **From:** WS-B, area home (Student Home), 2026-10-15
- **Status:** closed. Landed by the foundation maintainer on 2026-10-15: `CertificateCard`
  renders the code in a `whitespace-nowrap` span through a `<nowrap>` tag in
  `domain.certificate.code` (en and fr), and the paragraph no longer has `break-all`. The code
  stays whole down to a 320 px screen.
- **Frozen files concerned:** `src/components/domain/CertificateCard.tsx`

## Problem

`CertificateCard` renders the verification code inside the whole sentence, with
`break-all` on the paragraph:

```tsx
<p className="break-all">{t('certificate.code', { code: certificate.verificationCode })}</p>
```

When "Code de vérification : RH-XXXXXXXXXX" does not fit on one line, `break-all` cuts the
code anywhere, for example "RH-MY22GJS" / "WAO". A learner or a parent copies this code to
verify the certificate, so it should never be split. `overflow-wrap: anywhere` alone still
breaks at the hyphen.

The line needs about 272 px in French for the seeded code (`RH-MY22GJSWAO`) and up to 312 px
for a code of wide letters (`RH-WWWWWWWWWW`); the code alone needs at most 167 px (text-sm).

## Failing cases (checked in Chromium, `lea.demo`, `/fr/student`)

| Viewport | Card content width | Code |
| --- | --- | --- |
| 320 × 900 | 248 px | split (no layout can fix this outside the card) |
| 640–700 px, before the WS-B mitigation | 240–270 px | split |
| 1280–1300 px, before the WS-B mitigation | 251–257 px | split |

## Wanted change

Keep the code in one piece and let only the label wrap, for example:

```tsx
<p>
  {t.rich('certificate.code', {
    code: certificate.verificationCode,
    mono: (chunks) => <span className="whitespace-nowrap">{chunks}</span>,
  })}
</p>
```

with `"code": "Verification code: <mono>{code}</mono>"` in `domain.json` (en and fr), or a
`<code className="whitespace-nowrap">` that holds the code. The code then moves to its own
line on a narrow card instead of being cut.

## Mitigation in place (WS-B)

- `src/app/[locale]/student/(shell)/page.tsx`: the xl split is
  `xl:grid-cols-[minmax(0,2fr)_minmax(20.5rem,1fr)]`, so the side column with the
  certificates is at least 328 px (280 px of card content). A simulation of 2,000 random codes
  in French found 0.1 % that would still need more.
- `src/components/student/RecentCertificates.tsx`: two cards side by side only from `md`
  (was `sm`), so a card is never half of a 640–767 px column.

Checked: the seeded code stays on one line in French at 375, 640, 700, 768, 1024, 1280, 1300,
1366, 1440 and 1600 px. At 320 px it is still split, which needs this request. Both
mitigations can stay once it lands.

## Change (landed)

Landed by the foundation maintainer on 2026-10-15, as the first option of the wanted change:

- `src/messages/{en,fr}/domain.json`: `certificate.code` is `"Verification code:
  <nowrap>{code}</nowrap>"` / `"Code de vérification\u00a0: <nowrap>{code}</nowrap>"` (same key;
  the tag is not named `code` because the argument is).
- `src/components/domain/CertificateCard.tsx`: `t.rich('certificate.code', { code, nowrap })`
  renders the code in `<span translate="no" className="whitespace-nowrap">` (`translate="no"`
  keeps a browser translation away from the code); the `<p>` has no `break-all`. On a narrow
  card the code moves to its own line and only the label wraps.
- `tests/unit/foundation-ui.test.ts` (the rich message in en and fr); `docs/ARCHITECTURE.md` 7.4.

Checked in Chromium, `lea.demo`, Student Home at 320 × 900: the code (`RH-JT2Q7ZCQW3` in the
current seed) is one line box inside the card in en and fr, on its own line after the label,
with no horizontal scroll; the widest possible code, `RH-WWWWWWWWWW` (166 px), also stays on
one line in a 288 px card. WS-B's two mitigations can stay.

