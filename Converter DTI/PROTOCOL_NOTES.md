# Protocol Notes

## 2000-01-01 inconsistency

Canonical implementation in this project follows only:
- DTI-Day = JDN
- `DY = floor(JDN / 360)`
- `DOY = (JDN mod 360) + 1`

For `2000-01-01`:
- `JDN = 2451545`
- DTI = `DY6809-306`

A previously seen table value `DY6815-026` is inconsistent with the canonical formula and is intentionally not used in code or tests.
