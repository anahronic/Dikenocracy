# Protocol Notes

## DTI epoch and day numbering (author clarification, 2026-11-18)

The author clarified the intended convention: JDN 0 (astronomical Julian Day 0) is the zero reference point of the
count, not the first day of Year 1; JDN 1 is Year 1, Day 1; each DTI year has exactly 360 days.

- `DY = floor((JDN - 1) / 360) + 1`, `DOY = ((JDN - 1) mod 360) + 1`, `JDN = (DY - 1) * 360 + DOY`
- boundaries: JDN 0 = epoch anchor (no Year 0), JDN 1 = DY1-001, JDN 360 = DY1-360, JDN 361 = DY2-001
- days before the epoch (JDN < 0) are not defined by the clarification and are rejected

This implementation follows the clarification. The published DKP-0-TIME-001 text still states the zero-based form
(`DY = floor(JDN / 360)`, `DOY = (JDN mod 360) + 1`, inverse `DY * 360 + (DOY - 1)`), and its test-vector table was
computed with that form:

| Date | JDN | Published table | Published formula | Clarified (this code) |
|---|---|---|---|---|
| 2026-01-01 | 2461042 | DY6836-083 | DY6836-083 | DY6837-082 |
| 2026-01-02 | 2461043 | DY6836-084 | DY6836-084 | DY6837-083 |
| 1970-01-01 | 2440588 | DY6779-149 | DY6779-149 | DY6780-148 |
| 2000-01-01 | 2451545 | DY6815-026 | DY6809-306 | DY6810-305 |

The protocol text is not changed here: an erratum (sections 3, 5.1, 5.2 example, 6.2, 6.3, 9, 10) is prepared for the
author's approval. The earlier note of 2026-11-17 (which kept the zero-based formula and only questioned the
2000-01-01 row) is superseded.

## Astronomical Julian Date vs civil date

An astronomical Julian Date starts at noon. A civil (Gregorian) date maps to the JDN of the day whose noon falls on that
date (Fliegel-Van Flandern). The two must not be mixed: 2000-01-01 00:00 is JD 2451544.5, whose integer astronomical
day is 2451544, while the civil date 2000-01-01 has JDN 2451545. This package converts civil dates only; the epoch and
the integer-day numbering are the same in both conventions.
