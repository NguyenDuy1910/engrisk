/* i18n — prototype uses inline bilingual pairs T(vi, en) for brevity.
 * Production: ICU message catalogs keyed by id (i18next / FormatJS on Web, same keys on React Native),
 * locale stored in users.locale; exam content stays in English; explanations localized per locale. */
const LANGS = [
  // code, native name, English name, available in prototype
  ['vi','Tiếng Việt','Vietnamese',true],
  ['en','English','English',true],
  ['ja','日本語','Japanese',false],
  ['ko','한국어','Korean',false],
  ['zh','中文（简体）','Chinese (Simplified)',false],
  ['th','ไทย','Thai',false],
  ['id','Bahasa Indonesia','Indonesian',false],
  ['es','Español','Spanish',false],
];
const LOCALE = {vi:'vi-VN',en:'en-US'};
const T = (vi, en) => (S.lang==='en' && en!=null) ? en : vi;
/** tx: bilingual data field [vi, en] → current language */
const tx = v => Array.isArray(v) ? (S.lang==='en' ? (v[1]??v[0]) : v[0]) : v;
const fmtDate = iso => iso==='today' ? T('Hôm nay','Today') : new Intl.DateTimeFormat(LOCALE[S.lang]||'vi-VN',{day:'numeric',month:'short'}).format(new Date(iso+'T00:00:00'));
const fmtLongDate = iso => new Intl.DateTimeFormat(LOCALE[S.lang]||'vi-VN',{weekday:'long',day:'numeric',month:'long'}).format(new Date(iso+'T00:00:00'));
const fmtNum = n => new Intl.NumberFormat(LOCALE[S.lang]||'vi-VN').format(n);
const browserLang = () => (navigator.language||'vi').slice(0,2).toLowerCase();
