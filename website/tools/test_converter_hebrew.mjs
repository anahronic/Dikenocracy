// Проверка еврейского календаря в converter/converter.js против ICU (Intl, календарь "hebrew").
//   node website/tools/test_converter_hebrew.mjs [startYear endYear]
// Сравнивает каждый день диапазона (григорианский → еврейский) и обратное преобразование.
import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import vm from 'node:vm';

const src = readFileSync(fileURLToPath(new URL('../converter/converter.js', import.meta.url)), 'utf8');
const ctx = vm.createContext({});
vm.runInContext(src + '\n;globalThis.__api = { gregorianToJdn, jdnToGregorian, jdnToHebrew, hebrewToJdn, fmtHebrewDateString };', ctx);
const api = ctx.__api;

const fmt = new Intl.DateTimeFormat('en-u-ca-hebrew', { timeZone: 'UTC', year: 'numeric', month: 'long', day: 'numeric' });
// ICU month names → pyluach order (1=Nisan … 7=Tishrei … 12=Adar / Adar I, 13=Adar II)
const MONTHS = { Nisan: 1, Iyar: 2, Sivan: 3, Tamuz: 4, Av: 5, Elul: 6, Tishri: 7, Heshvan: 8, Kislev: 9,
  Tevet: 10, Shevat: 11, Adar: 12, 'Adar I': 12, 'Adar II': 13 };

function icuHebrew(y, m, d) {
  const dt = new Date(0);
  dt.setUTCFullYear(y, m - 1, d);            // Date.UTC() maps years 0-99 to 1900-1999
  const parts = Object.fromEntries(fmt.formatToParts(dt).map((p) => [p.type, p.value]));
  const month = MONTHS[parts.month];
  if (!month) throw new Error('unknown ICU month ' + parts.month);
  return { year: Number(parts.year), month, day: Number(parts.day) };
}

const [startYear, endYear] = process.argv.slice(2).map(Number);
const y0 = startYear || 1800, y1 = endYear || 2240;
let checked = 0, bad = 0;
for (let jdn = api.gregorianToJdn(y0, 1, 1); jdn <= api.gregorianToJdn(y1, 12, 31); jdn++) {
  const g = api.jdnToGregorian(jdn);
  const exp = icuHebrew(g.year, g.month, g.day);
  const got = api.jdnToHebrew(jdn);
  const back = api.hebrewToJdn(exp.year, exp.month, exp.day);
  checked++;
  if (got.year !== exp.year || got.month !== exp.month || got.day !== exp.day || back !== jdn) {
    if (bad++ < 10) console.log('MISMATCH', g, 'expected', exp, 'got', got, 'back', back - jdn);
  }
}

// Контрольные даты из обращений пользователей
const cases = [[2023, 10, 7, 'כ״ב תשרי תשפ״ד'], [2026, 10, 14, 'ג׳ חשון תשפ״ז'], [2026, 9, 12, 'א׳ תשרי תשפ״ז']];
for (const [y, m, d, want] of cases) {
  const h = api.jdnToHebrew(api.gregorianToJdn(y, m, d));
  const s = api.fmtHebrewDateString(h.year, h.month, h.day);
  const ok = s === want;
  if (!ok) bad++;
  console.log(`${y}-${m}-${d}: ${s} ${ok ? 'OK' : 'EXPECTED ' + want}`);
}
console.log(`checked ${checked} days ${y0}-${y1}: ${bad ? bad + ' FAILURES' : 'all match ICU'}`);
process.exit(bad ? 1 : 0);
