// DTI regression test (2026-11-17): converter.js vs the DKP-0-TIME-001 formula DY = floor(JDN/360), DOY = JDN mod 360 + 1.
// The protocol test-vector table lists 2000-01-01 as DY6815-026; the formula gives DY6809-306 (erratum, see
// DTI_ERRATUM_2026-11-17.md in the workspace). Usage: node website/tools/test_converter_dti.mjs
import fs from 'node:fs';
import vm from 'node:vm';
const src = fs.readFileSync(process.argv[2] || new URL('../converter/converter.js', import.meta.url), 'utf8');
const ctx = vm.createContext({});
vm.runInContext(src + '\n;globalThis.__api = { gregorianToJdn, jdnToGregorian, isValidGregorian, jdnToDti, dtiToJdn, fmtDti, jdnToHebrew, hebrewToJdn, isValidHebrew, fmtHebrewDateString, fmtHebrewNumeric, fromHebrewNumberYear, fromHebrewNumberDay, hebrewMonthsInYear, hebrewLeapYear };', ctx);
const A = ctx.__api;
const out = { checks: [], failures: [] };
const ok = (name, cond, detail) => { (cond ? out.checks : out.failures).push(detail === undefined ? name : `${name}: ${JSON.stringify(detail)}`); };
const g2j = (y, m, d) => { const a = Math.floor((14 - m) / 12), Y = y + 4800 - a, M = m + 12 * a - 3; return d + Math.floor((153 * M + 2) / 5) + 365 * Y + Math.floor(Y / 4) - Math.floor(Y / 100) + Math.floor(Y / 400) - 32045; };
const canon = j => ({ dy: Math.floor(j / 360), doy: (j % 360) + 1 });

// 1) protocol vectors (the 2000-01-01 row is the published one, checked against the formula separately)
for (const [y, m, d, dy, doy] of [[2026, 1, 1, 6836, 83], [2026, 1, 2, 6836, 84], [1970, 1, 1, 6779, 149], [2023, 10, 7, 6833, 346], [2000, 1, 1, 6809, 306]]) {
  const j = A.gregorianToJdn(y, m, d), t = A.jdnToDti(j);
  ok(`vector ${y}-${m}-${d}`, j === g2j(y, m, d) && t.dy === dy && t.doy === doy, { j, t, expect: [dy, doy] });
}
// 2) exhaustive Gregorian -> DTI -> Gregorian over 1600..2400 and agreement with the canonical formula
let n = 0, bad = 0;
for (let j = g2j(1600, 1, 1); j <= g2j(2400, 12, 31); j++) {
  const t = A.jdnToDti(j), c = canon(j); n++;
  const back = A.dtiToJdn(t.dy, t.doy);
  if (t.dy !== c.dy || t.doy !== c.doy || back !== j) { bad++; if (bad < 4) ok('dti roundtrip', false, { j, t, c, back }); }
  const g = A.jdnToGregorian(j); const gj = A.gregorianToJdn(g.year ?? g[0], g.month ?? g[1], g.day ?? g[2]);
  if (gj !== j) { bad++; if (bad < 4) ok('greg roundtrip', false, { j, g }); }
}
ok(`exhaustive 1600-2400 (${n} days) DTI = canonical formula, round trips`, bad === 0, bad);
// 3) validation
ok('Feb 29 2024 valid', A.isValidGregorian(2024, 2, 29));
ok('Feb 29 2023 invalid', !A.isValidGregorian(2023, 2, 29));
ok('Feb 29 1900 invalid (century)', !A.isValidGregorian(1900, 2, 29));
ok('Feb 29 2000 valid (400-year)', A.isValidGregorian(2000, 2, 29));
ok('Apr 31 invalid', !A.isValidGregorian(2026, 4, 31));
let threw0 = false, threw361 = false;
try { const r = A.dtiToJdn(6836, 0); threw0 = r === null || r === undefined || Number.isNaN(r); } catch { threw0 = true; }
try { const r = A.dtiToJdn(6836, 361); threw361 = r === null || r === undefined || Number.isNaN(r); } catch { threw361 = true; }
ok('DOY 0 rejected by dtiToJdn', threw0, 'dtiToJdn accepted DOY 0');
ok('DOY 361 rejected by dtiToJdn', threw361, 'dtiToJdn accepted DOY 361');
// 4) Hebrew: 2023-10-07 and leap-year months, DTI <-> Hebrew through JDN
const h = A.jdnToHebrew(g2j(2023, 10, 7));
ok('2023-10-07 = 22 Tishrei 5784', JSON.stringify(h).includes('5784') && (h.day === 22 || h[2] === 22), h);
ok('5784 is a leap year (13 months)', A.hebrewLeapYear(5784) && A.hebrewMonthsInYear(5784) === 13);
ok('5785 is not a leap year', !A.hebrewLeapYear(5785) && A.hebrewMonthsInYear(5785) === 12);
let hb = 0;
for (let j = g2j(1900, 1, 1); j <= g2j(2100, 12, 31); j++) { const x = A.jdnToHebrew(j); const back = A.hebrewToJdn(x.year, x.month, x.day); if (back !== j) { hb++; if (hb < 3) ok('hebrew roundtrip', false, { j, x, back }); } }
ok('Hebrew <-> JDN round trip 1900-2100', hb === 0, hb);
ok('Hebrew string for 2023-10-07', A.fmtHebrewDateString(h.year, h.month, h.day).includes('תשרי'), A.fmtHebrewDateString(h.year, h.month, h.day));
ok('letter year תשפ"ד = 5784', A.fromHebrewNumberYear('תשפ"ד') === 5784 || A.fromHebrewNumberYear('תשפ״ד') === 5784, [A.fromHebrewNumberYear('תשפ"ד'), A.fromHebrewNumberYear('תשפ״ד')]);
ok('letter day כ"ב = 22', A.fromHebrewNumberDay('כ"ב') === 22 || A.fromHebrewNumberDay('כ״ב') === 22, [A.fromHebrewNumberDay('כ"ב')]);
ok('letter day ט"ו = 15 (not יה)', A.fromHebrewNumberDay('ט"ו') === 15 || A.fromHebrewNumberDay('ט״ו') === 15, [A.fromHebrewNumberDay('ט"ו')]);
console.log(JSON.stringify(out, null, 1));
process.exit(out.failures.length ? 1 : 0);
