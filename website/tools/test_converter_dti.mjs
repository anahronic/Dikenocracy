// DTI regression test (2026-11-18): converter.js vs the author's clarified DTI convention:
//   JDN 0 = epoch anchor (not a date); JDN 1 = DY1-001; DY = floor((JDN-1)/360)+1; DOY = ((JDN-1) mod 360)+1;
//   inverse JDN = (DY-1)*360 + DOY. The published DKP-0-TIME-001 text (5.1, 6.2, 9, 10) still states the zero-based
//   form; that conflict is reported (section 6 below), not hidden. Usage: node website/tools/test_converter_dti.mjs
import fs from 'node:fs';
import vm from 'node:vm';
const src = fs.readFileSync(process.argv[2] || new URL('../converter/converter.js', import.meta.url), 'utf8');
const ctx = vm.createContext({});
vm.runInContext(src + String.fromCharCode(10) + ';globalThis.__api = { gregorianToJdn, jdnToGregorian, isValidGregorian, jdnToDti, dtiToJdn, fmtDti, jdnToHebrew, hebrewToJdn, isValidHebrew, fmtHebrewDateString, fmtHebrewNumeric, fromHebrewNumberYear, fromHebrewNumberDay, hebrewMonthsInYear, hebrewLeapYear };', ctx);
const A = ctx.__api;
const out = { checks: [], failures: [], conflicts_with_published_text: [] };
const ok = (name, cond, detail) => { (cond ? out.checks : out.failures).push(detail === undefined ? name : `${name}: ${JSON.stringify(detail)}`); };
const g2j = (y, m, d) => { const a = Math.floor((14 - m) / 12), Y = y + 4800 - a, M = m + 12 * a - 3; return d + Math.floor((153 * M + 2) / 5) + 365 * Y + Math.floor(Y / 4) - Math.floor(Y / 100) + Math.floor(Y / 400) - 32045; };
const clarified = j => ({ dy: Math.floor((j - 1) / 360) + 1, doy: ((j - 1) % 360) + 1 });
const throws = (f) => { try { f(); return false; } catch { return true; } };

// 0) boundaries required by the author
ok('JDN 0 is the epoch anchor, not a date', A.jdnToDti(0).epoch === true && A.jdnToDti(0).dy === null && A.fmtDti(A.jdnToDti(0)) === 'DTI epoch (JDN 0)', A.jdnToDti(0));
for (const [j, dy, doy] of [[1, 1, 1], [360, 1, 360], [361, 2, 1], [720, 2, 360], [721, 3, 1]]) {
  const t = A.jdnToDti(j);
  ok(`JDN ${j} = DY${dy}-${String(doy).padStart(3, '0')}`, t.dy === dy && t.doy === doy && A.dtiToJdn(dy, doy) === j && A.fmtDti(t) === `DY${dy}-${String(doy).padStart(3, '0')}`, t);
}
ok('no Year 0: DY 0 rejected', throws(() => A.dtiToJdn(0, 1)));
ok('negative DY rejected', throws(() => A.dtiToJdn(-1, 360)));
ok('before the epoch (JDN -1) is not converted', throws(() => A.jdnToDti(-1)));
ok('JDN 0 civil date: proleptic Gregorian 4714 BC Nov 24 (converter year -4714; no year 0) = Julian 4713 BC Jan 1', A.gregorianToJdn(-4714, 11, 24) === 0 && A.jdnToGregorian(0).year === -4714 && A.jdnToGregorian(0).month === 11 && A.jdnToGregorian(0).day === 24, A.jdnToGregorian(0));

// 1) recomputed vectors (Gregorian civil date -> JDN by Fliegel-Van Flandern -> clarified DTI)
for (const [y, m, d, j, dy, doy] of [[2026, 1, 1, 2461042, 6837, 82], [2026, 1, 2, 2461043, 6837, 83], [1970, 1, 1, 2440588, 6780, 148],
                                    [2000, 1, 1, 2451545, 6810, 305], [2023, 10, 7, 2460225, 6834, 345]]) {
  const jj = A.gregorianToJdn(y, m, d), t = A.jdnToDti(jj);
  ok(`vector ${y}-${m}-${d}`, jj === j && jj === g2j(y, m, d) && t.dy === dy && t.doy === doy, { jj, t, expect: [j, dy, doy] });
}
// 2) exhaustive Gregorian -> DTI -> Gregorian over 1600..2400 and agreement with the clarified formula
let n = 0, bad = 0;
for (let j = g2j(1600, 1, 1); j <= g2j(2400, 12, 31); j++) {
  const t = A.jdnToDti(j), c = clarified(j); n++;
  const back = A.dtiToJdn(t.dy, t.doy);
  if (t.dy !== c.dy || t.doy !== c.doy || back !== j) { bad++; if (bad < 4) ok('dti roundtrip', false, { j, t, c, back }); }
  const g = A.jdnToGregorian(j); const gj = A.gregorianToJdn(g.year ?? g[0], g.month ?? g[1], g.day ?? g[2]);
  if (gj !== j) { bad++; if (bad < 4) ok('greg roundtrip', false, { j, g }); }
}
ok(`exhaustive 1600-2400 (${n} days) DTI = clarified formula, round trips`, bad === 0, bad);
let early = 0;
for (let j = 1; j <= 5000; j++) { const t = A.jdnToDti(j); if (A.dtiToJdn(t.dy, t.doy) !== j || t.doy < 1 || t.doy > 360 || t.dy < 1) early++; }
ok('first 5000 days after the epoch round-trip, DOY 1..360, DY >= 1', early === 0, early);
// 5) astronomical Julian Date (days start at noon) vs civil date: kept separate, epoch and numbering unchanged
const jdToAstroDay = (jd) => Math.floor(jd);              // integer astronomical day containing the instant
ok('JD 2451545.0 (2000-01-01 12:00) lies in astronomical day 2451545 = civil 2000-01-01 JDN', jdToAstroDay(2451545.0) === g2j(2000, 1, 1));
ok('JD 2451544.5 (2000-01-01 00:00) lies in astronomical day 2451544, which began at noon on 1999-12-31: civil dates must use the civil JDN, not floor(JD)',
   jdToAstroDay(2451544.5) === 2451544 && g2j(2000, 1, 1) === 2451545);
ok('JD 0.0 (noon, epoch) and JD 0.5 fall in astronomical day 0 = the epoch anchor', jdToAstroDay(0.0) === 0 && jdToAstroDay(0.5) === 0 && A.jdnToDti(jdToAstroDay(0.5)).epoch === true);
ok('JD 1.0 begins astronomical day 1 = DY1-001', A.fmtDti(A.jdnToDti(jdToAstroDay(1.0))) === 'DY1-001');
// 3) validation
ok('Feb 29 2024 valid', A.isValidGregorian(2024, 2, 29));
ok('Feb 29 2023 invalid', !A.isValidGregorian(2023, 2, 29));
ok('Feb 29 1900 invalid (century)', !A.isValidGregorian(1900, 2, 29));
ok('Feb 29 2000 valid (400-year)', A.isValidGregorian(2000, 2, 29));
ok('Apr 31 invalid', !A.isValidGregorian(2026, 4, 31));
let threw0 = false, threw361 = false;
try { const r = A.dtiToJdn(6837, 0); threw0 = r === null || r === undefined || Number.isNaN(r); } catch { threw0 = true; }
try { const r = A.dtiToJdn(6837, 361); threw361 = r === null || r === undefined || Number.isNaN(r); } catch { threw361 = true; }
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
// 6) conflict with the frozen published text (reported for the erratum, not a test failure)
const text = (j) => ({ dy: Math.floor(j / 360), doy: (j % 360) + 1 });
for (const [y, m, d, pub] of [[2026, 1, 1, 'DY6836-083'], [2026, 1, 2, 'DY6836-084'], [1970, 1, 1, 'DY6779-149'], [2000, 1, 1, 'DY6815-026']]) {
  const j = g2j(y, m, d), t = text(j);
  out.conflicts_with_published_text.push({ date: `${y}-${m}-${d}`, jdn: j, published_table: pub, published_formula: `DY${t.dy}-${String(t.doy).padStart(3, '0')}`, clarified: A.fmtDti(A.jdnToDti(j)) });
}
console.log(JSON.stringify(out, null, 1));
process.exit(out.failures.length ? 1 : 0);
