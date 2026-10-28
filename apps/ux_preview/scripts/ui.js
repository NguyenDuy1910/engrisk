/* HeroUI-shaped component helpers + Engrisk patterns (mascot, language & appearance pickers). */
const esc = s => String(s ?? '').replace(/[&<>"']/g, c => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
const fmt = sec => { sec=Math.max(0,Math.floor(sec)); return String(Math.floor(sec/60)).padStart(2,'0')+':'+String(sec%60).padStart(2,'0'); };
const icon = (n,size=16,cls='') => `<svg class="gi ${cls}" width="${size}" height="${size}" viewBox="0 0 16 16" fill="currentColor" aria-hidden="true">${GI[n]||''}</svg>`;
const attrs = d => Object.entries(d||{}).map(([k,v])=>`data-${k}="${esc(v)}"`).join(' ');

/** Button — v: primary|secondary|tertiary|ghost|outline|danger|danger-soft · size: sm|md|lg|xl */
function btn(label,{v='primary',size='',action,data,ic,iconR,disabled,full,aria,cls='',id,pending,style}={}){
  const fk = action ? `${action}:${Object.values(data||{}).join(',')}` : '';
  const nudge = iconR && /arrow-right|chevron-right/.test(iconR) ? 'gi--nudge' : '';
  return `<button type="button" ${id?`id="${id}"`:''} class="button button--${v} ${size?'button--'+size:''} ${full?'button--full-width':''} ${!label?'button--icon-only':''} ${cls}" ${action?`data-action="${action}"`:''} ${attrs(data)} data-fk="${esc(fk)}" ${disabled||pending?'disabled':''} ${pending?'data-pending="true" aria-busy="true"':''} ${aria?`aria-label="${esc(aria)}" title="${esc(aria)}"`:''} ${style?`style="${style}"`:''}>${pending?`<span class="spinner spinner--sm spinner--current">${SPIN}</span>`:ic?icon(ic):''}${label?`<span>${label}</span>`:''}${iconR?icon(iconR,16,nudge):''}</button>`;
}
/** Chip — color: default|accent|success|warning|danger · v: soft|primary|tertiary */
const chip = (label,color='default',ic,{size='',v='soft'}={}) => `<span class="chip chip--${color} chip--${v} ${size?'chip--'+size:''}">${ic?icon(ic,12):''}<span>${label}</span></span>`;
const phase = p => `<span class="phase" title="Roadmap phase">${p}</span>`;
const sim = (t) => `<span class="sim">${icon('circle-info',11)}${t||T('Mô phỏng','Simulated')}</span>`;
const pct = (v,m) => Math.max(0,Math.min(100,Math.round(v/m*100)));
/** Inline accuracy: bar + % on one line, fixed % width so rows/tiles line up */
const accBar = v => { const p=Math.round(v*100), c=v<.55?'danger':v<.7?'warning':'success'; return `<span class="acc acc--${c}" role="meter" aria-valuenow="${p}" aria-valuemin="0" aria-valuemax="100" aria-label="${T('Độ chính xác','Accuracy')} ${p}%"><span class="acc__bar"><i style="width:${p}%"></i></span><b class="tnum">${p}%</b></span>`; };
const progressBar = (val,max,{label,right,color,size,aria}={}) => `<div class="progress-bar ${size?'progress-bar--'+size:''} ${color?'progress-bar--'+color:''}" role="progressbar" aria-valuenow="${val}" aria-valuemin="0" aria-valuemax="${max}" ${aria||label?`aria-label="${esc(aria||label)}"`:''}>${label!=null?`<span class="progress-bar__label">${label}</span>`:'<span></span>'}${right!=null?`<span class="progress-bar__output">${right}</span>`:'<span></span>'}<div class="progress-bar__track"><div class="progress-bar__fill" style="width:${pct(val,max)}%"></div></div></div>`;
const meter = (val,max,{label,right,color,size}={}) => `<div class="meter ${size?'meter--'+size:''} ${color?'meter--'+color:''}" role="meter" aria-valuenow="${val}" aria-valuemin="0" aria-valuemax="${max}" aria-label="${esc(label||'')}"><span class="meter__label">${label||''}</span><span class="meter__output">${right||''}</span><div class="meter__track"><div class="meter__fill" style="width:${pct(val,max)}%"></div></div></div>`;
const ring = (val,max,{size=120,stroke=10,color='accent',inner=''}={}) => { const r=(size-stroke)/2, C=2*Math.PI*r, p=Math.max(0,Math.min(1,val/max)); return `<div class="progress-circle" style="width:${size}px;height:${size}px;--stroke:var(--${color})" role="progressbar" aria-valuenow="${val}" aria-valuemin="0" aria-valuemax="${max}"><svg width="${size}" height="${size}" viewBox="0 0 ${size} ${size}" aria-hidden="true"><circle class="progress-circle__track" cx="${size/2}" cy="${size/2}" r="${r}" fill="none" stroke-width="${stroke}"/><circle class="progress-circle__fill" style="--C:${C}" cx="${size/2}" cy="${size/2}" r="${r}" fill="none" stroke-width="${stroke}" stroke-linecap="round" stroke-dasharray="${C}" stroke-dashoffset="${C*(1-p)}" transform="rotate(-90 ${size/2} ${size/2})"/></svg><div class="progress-circle__value">${inner}</div></div>`; };
const ALERT_ICON = {default:'circle-info',accent:'circle-info',success:'circle-check-fill',warning:'triangle-exclamation',danger:'circle-exclamation'};
const alertBox = (color,title,desc,extra='',{ic,flat}={}) => `<div class="alert alert--${color} ${flat?'alert--flat':''}" role="${color==='danger'?'alert':'status'}"><span class="alert__indicator">${icon(ic||ALERT_ICON[color]||'circle-info')}</span><div class="alert__content"><div class="alert__title">${title}</div>${desc?`<div class="alert__description">${desc}</div>`:''}${typeof extra==='string'&&extra?`<div style="margin-top:8px">${extra}</div>`:''}</div></div>`;
const tabs = (label,opts,val,action,{full,size}={}) => `<div class="tabs ${full?'tabs--full':''} ${size?'tabs--'+size:''}" role="tablist" aria-label="${esc(label)}">${opts.map(([v,l,ic])=>`<button type="button" role="tab" class="tabs__tab" aria-selected="${v===val}" data-action="${action}" data-v="${v}" data-fk="${action}:${v}">${ic?icon(ic,14):''}${l}</button>`).join('')}</div>`;
/** Empty state — pass mood to use the mascot instead of an icon tile */
const empty = (ic,title,desc,actions='',{color='accent',mood}={}) => `<div class="empty-state">${mood?mascot({mood,size:96}):`<span class="icon-tile icon-tile--lg icon-tile--${color}">${icon(ic,22)}</span>`}<div class="text-base font-semibold">${title}</div><p>${desc}</p>${actions?`<div class="row row--wrap row--center" style="margin-top:8px">${actions}</div>`:''}</div>`;
const sk = (h=14,w='100%',r) => `<div class="skeleton" style="height:${h}px;width:${w};${r?`border-radius:${r}px`:''}"></div>`;
const avatar = (t,{size='',color='accent',cls='',style=''}={}) => `<span class="avatar ${size?'avatar--'+size:''} avatar--${color} ${cls}" style="${style}" aria-hidden="true">${esc(t)}</span>`;
const cardHead = (title,right='',desc='',ic='') => `<div class="card__header"><div class="row gap-3" style="min-width:0">${ic}<div style="min-width:0"><h3 class="card__title">${title}</h3>${desc?`<div class="card__description">${desc}</div>`:''}</div></div>${right?`<div class="row shrink-0">${right}</div>`:''}</div>`;
const sectionTitle = (title,count,right='') => `<div class="row row--between"><h2 class="section-title">${title}${count!=null?`<span class="count">${count}</span>`:''}</h2>${right}</div>`;
const trend = (txt,up=true) => chip(txt,up?'success':'danger',up?'arrow-up':'arrow-down',{size:'sm'});
const stat = (label,value,{small,right,foot,count}={}) => {
  const val = count!=null?`<span data-count="${count}">${value}</span>`:value;
  return isM()
  ? `<div class="card stat" style="gap:4px"><span class="stat__label truncate" style="display:block">${label}</span><div class="stat__value">${val}${small?`<small>${small}</small>`:''}</div>${right?`<div>${right}</div>`:''}${foot||''}</div>`
  : `<div class="card stat"><div class="stat__label"><span>${label}</span>${right||''}</div><div class="stat__value">${val}${small?`<small>${small}</small>`:''}</div>${foot||''}</div>`; };
const tile = (ic,color='default',size='') => `<span class="icon-tile icon-tile--${color} ${size?'icon-tile--'+size:''}">${icon(ic,size==='sm'?14:size==='lg'||size==='xl'?22:18)}</span>`;
const skillTile = (skill,size='') => `<span class="icon-tile icon-tile--tint tint-${skill||'mock'} ${size?'icon-tile--'+size:''}">${icon(skill?SKILL_ICON[skill]:'graduation-cap',size==='sm'?14:size==='lg'?22:18)}</span>`;
/* Distinct icon per TOEIC Part / IELTS question type (catalog tiles, studio navigator). */
const PART_ICON = {P1:'picture',P2:'comments',P3:'persons',P4:'microphone',P5:'font',P6:'file-text',P7:'files',L1:'square-dashed-text',L2:'map-pin',L3:'list-check',L4:'pencil',R1:'check-double',R2:'list-ul',R3:'link'};
const TYPE_ICON = {'reading.tfng':'check-double','reading.headings':'list-ul','reading.completion':'text','reading.matching_features':'link','reading.multi':'list-check','listening.form':'square-dashed-text','listening.map':'map-pin','listening.multi':'list-check','listening.notes':'pencil'};
/** Skill-tinted icon tile with an arbitrary icon (Part / question-type tiles) */
const tintTile = (ic,skill,size='') => `<span class="icon-tile icon-tile--tint tint-${skill||'mock'} ${size?'icon-tile--'+size:''}">${icon(ic,size==='sm'?14:size==='lg'?22:18)}</span>`;

/* ---------- Exam cover art ----------
 * Generated (no stock imagery): skill-tinted gradient (tokens only) + motif per kind/track/skill + big translucent label + provenance badge.
 * spec = {track:'toeic'|'ielts'|'personal', skill:'listening'|'reading'|'mixed'|'writing'|'speaking', kind, label:'04', origin:'official'|'community'|'tenant'|'personal', author?:PEOPLE key, tenant?:TENANTS key} */
const COVER_SKIP = /^(TOEIC|IELTS|ETS|IDP|L&R)$/;
function coverLabel(title){
  const t = String(Array.isArray(title) ? (title[1]??title[0]) : title||'');
  let m;
  if ((m=t.match(/Part\s*(\d)/i))) return 'P'+m[1];
  if ((m=t.match(/Task\s*(\d)/i))) return 'T'+m[1];
  if ((m=t.match(/(\d+)\s*$/))) return m[1].padStart(2,'0');
  const acr = (t.match(/\b[A-Z]{3,5}\b/g)||[]).find(w=>!COVER_SKIP.test(w)); if (acr) return acr;
  if ((m=t.match(/(\d+\+?)/))) return m[1];
  const seg = t.split(/[:·—]/).pop().trim().split(/\s+/).filter(w=>/^[A-Za-zÀ-ỹ]/.test(w));
  return (seg.slice(0,2).map(w=>w[0]).join('')||'E').toUpperCase();
}
/** Cover spec from a S.content row (Studio, moderation, contribute) */
function coverSpec(item){
  return {track:String(item.exam||'').startsWith('ielts')?'ielts':'toeic', skill:item.skill||'mixed', kind:item.kind||'practice_set', label:coverLabel(item.title),
    origin:item.origin==='community'?'community':item.scope&&item.scope!=='engrisk'?'tenant':'official', author:item.owner, tenant:item.scope};
}
const examSpec = id => { const ex=EXAMS[id]; if (!ex) return {track:'toeic',skill:'mixed',kind:'practice_set',label:'?',origin:'official'};
  return {track:ex.track, skill:ex.kind==='personal_practice'?'personal':ex.skill||'mixed', kind:ex.kind, label:ex.cover||coverLabel(ex.title), origin:ex.kind==='personal_practice'?'personal':ex.origin||'official', author:ex.author, tenant:ex.tenant}; };
const COVER_WAVE = [16,28,44,24,56,38,68,50,32,60,42,22,48,34,18,40,26,14];
function coverArt(s){
  const lines = (x,y,ws,step=9) => ws.map((w,i)=>`<rect class="cv-ink" x="${x}" y="${y+i*step}" width="${w}" height="4" rx="2"/>`).join('');
  const wave = (x,y,n,k,gap=6,sc=1) => COVER_WAVE.slice(0,n).map((h,i)=>{ const hh=Math.max(4,h*sc); return `<rect class="${i<k?'cv-tint':'cv-soft'}" x="${x+i*gap}" y="${y-hh/2}" width="3.5" height="${hh}" rx="1.75"/>`; }).join('');
  const ielts = s.track==='ielts', sk = s.skill;
  if (sk==='listening' && ielts) /* IELTS listening: form completion card + audio strip */
    return `<g transform="rotate(3 144 60)"><rect class="cv-paper" x="100" y="10" width="86" height="100" rx="7"/>
      <rect class="cv-tint" x="110" y="20" width="40" height="6" rx="3"/>
      ${[0,1,2,3].map(i=>`<rect class="cv-ink" x="110" y="${36+i*14}" width="${[22,28,18,24][i]}" height="4" rx="2"/><rect class="cv-dash" x="${142}" y="${32+i*14}" width="34" height="10" rx="3"/>`).join('')}
      ${wave(112,98,11,5,6,.22)}</g>`;
  if (sk==='listening') /* TOEIC listening: waveform with playhead */
    return `${wave(82,60,18,8,6.2)}<rect class="cv-ink" x="80" y="59" width="114" height="2" rx="1"/><circle class="cv-tint" cx="${82+8*6.2-1.3}" cy="60" r="5"/><circle class="cv-paper" cx="${82+8*6.2-1.3}" cy="60" r="2"/>`;
  if (sk==='reading' && ielts) /* IELTS reading: passage with lettered paragraphs + headings */
    return `<g transform="rotate(3 144 60)"><rect class="cv-paper" x="98" y="8" width="90" height="104" rx="7"/>
      <rect class="cv-tint" x="108" y="17" width="52" height="6" rx="3"/>
      ${['A','B','C'].map((l,i)=>`<rect class="cv-tint" x="108" y="${31+i*26}" width="12" height="12" rx="3"/><text class="cv-tag" x="114" y="${40+i*26}" text-anchor="middle">${l}</text>${lines(126,31+i*26,[52,44,48].slice(0,i===2?2:3),7)}`).join('')}</g>`;
  if (sk==='reading') /* TOEIC reading: page of text with a highlighted blank */
    return `<g transform="rotate(-5 140 60)"><rect class="cv-paper cv-back" x="96" y="14" width="76" height="94" rx="7"/></g>
      <g transform="rotate(3 146 60)"><rect class="cv-paper" x="106" y="10" width="80" height="100" rx="7"/>
      <rect class="cv-tint" x="115" y="19" width="36" height="6" rx="3"/>${lines(115,34,[60,52])}
      <rect class="cv-ink" x="115" y="52" width="20" height="4" rx="2"/><rect class="cv-dash" x="138" y="49" width="24" height="10" rx="3"/><rect class="cv-ink" x="165" y="52" width="12" height="4" rx="2"/>
      ${lines(115,68,[58,62,40])}</g>`;
  if (sk==='writing')
    return `<g transform="rotate(3 144 60)"><rect class="cv-paper" x="102" y="10" width="82" height="100" rx="7"/>${lines(112,22,[54,62,58,62,36,48,30],10)}</g>
      <g transform="rotate(-38 150 70)"><rect class="cv-tint" x="146" y="34" width="9" height="62" rx="3"/><path class="cv-ink" d="M146 96h9l-4.5 9z"/></g>`;
  if (sk==='speaking')
    return `<path class="cv-paper" d="M104 22h76a8 8 0 0 1 8 8v44a8 8 0 0 1-8 8h-48l-14 14v-14h-14a8 8 0 0 1-8-8v-44a8 8 0 0 1 8-8z"/>${wave(116,52,10,6,6.4,.5)}`;
  if (sk==='personal')
    return `<g transform="rotate(3 144 60)"><rect class="cv-paper" x="104" y="12" width="80" height="96" rx="7"/><rect class="cv-tint" x="113" y="21" width="30" height="6" rx="3"/>${lines(113,36,[60,54,62,40,56,48],10)}</g>`;
  /* Full mock (mixed L+R): stacked answer sheets, bubble grid, L/R section bars */
  const ans=[1,3,0,2,1,3];
  return `<g transform="rotate(-7 128 62)"><rect class="cv-paper cv-back" x="90" y="16" width="70" height="92" rx="7"/></g>
    <g transform="rotate(4 146 60)"><rect class="cv-paper" x="108" y="8" width="78" height="104" rx="7"/>
    <rect class="cv-ink" x="117" y="17" width="34" height="5" rx="2.5"/>
    ${ans.map((a,r)=>[0,1,2,3].map(c=>`<circle class="${c===a?'cv-tint':'cv-ring'}" cx="${124+c*14}" cy="${33+r*10}" r="3.4"/>`).join('')).join('')}
    <rect class="cv-l" x="117" y="96" width="26" height="6" rx="3"/><rect class="cv-r" x="146" y="96" width="31" height="6" rx="3"/></g>`;
}
function coverBadge(s,compact){
  if (s.origin==='community'){ const p=PEOPLE[s.author];
    return compact ? `<span class="cover__mark cover__mark--community">${icon('persons',9)}</span>`
      : `<span class="cover__badge"><span class="cover__av avatar--${p?p.color:'accent'}">${esc(p?p.initials:'?')}</span>${T('Cộng đồng','Community')}</span>`; }
  if (s.origin==='tenant'){ const t=TENANTS[s.tenant]||TENANTS.sunrise;
    return compact ? `<span class="cover__mark cover__mark--tenant">${t.mark}</span>` : `<span class="cover__badge"><span class="cover__av cover__av--tenant">${t.mark}</span>${esc(t.name)}</span>`; }
  if (s.origin==='personal') return compact ? '' : `<span class="cover__badge">${icon('folder',12)}${T('Của bạn','Yours')}</span>`;
  return compact ? '' : `<span class="cover__badge">${icon('shield-check',12)}Engrisk Original</span>`;
}
/** Cover art HTML for an EXAMS id or a spec (decorative; provenance is repeated in text by callers). */
function examCover(idOrSpec,{h=120,compact=false}={}){
  const s = typeof idOrSpec==='string' ? examSpec(idOrSpec) : {track:'toeic',skill:'mixed',kind:'practice_set',label:'',origin:'official',...idOrSpec};
  const tint = s.skill==='mixed'||!s.skill ? 'mock' : s.skill, label=String(s.label||'');
  const fs = Math.round(h*(compact?(label.length<=2?.46:label.length===3?.36:.3):(label.length<=2?.74:label.length===3?.56:.44)));
  const w = compact ? Math.round(h*1.36) : null;
  return `<div class="cover ${compact?'cover--compact':''} tint-${tint}" style="--cover-h:${h}px;${w?`--cover-w:${w}px;`:''}" aria-hidden="true">
    <span class="cover__label" style="font-size:${fs}px">${esc(label)}</span>
    <svg class="cover__art" viewBox="0 0 200 120" preserveAspectRatio="${compact?'xMidYMid slice':'xMaxYMid meet'}" aria-hidden="true">${coverArt(s)}</svg>
    ${coverBadge(s,compact)}</div>`;
}
const kbd = k => `<kbd class="kbd">${k}</kbd>`;
const switchEl = (on,action,label) => `<button type="button" class="switch" role="switch" aria-checked="${on}" data-action="${action}" data-fk="${action}" aria-label="${esc(label)}"><span class="switch__control"><span class="switch__thumb"></span></span></button>`;

/* ---------- Mascot: "Pip" the penguin ----------
 * Colors: body/beak/feet/cheeks = Theme Builder swatches; headphones = current --accent (follows palette).
 * Moods: wave (greeting) · happy (success) · think (onboarding, empty) · cheer (results ≥ 60%) · calm (encourage). */
function mascot({mood='wave',size=160,cls='',label}={}){
  const eyesOpen = `<g class="mascot__eyes"><circle cx="66" cy="${mood==='think'?73:76}" r="6" fill="var(--sw-navy)"/><circle cx="94" cy="${mood==='think'?73:76}" r="6" fill="var(--sw-navy)"/><circle cx="68" cy="${mood==='think'?71:74}" r="2" fill="#fff"/><circle cx="96" cy="${mood==='think'?71:74}" r="2" fill="#fff"/></g>`;
  const eyesHappy = `<path d="M60 77q6-7 12 0M88 77q6-7 12 0" stroke="var(--sw-navy)" stroke-width="3.5" fill="none" stroke-linecap="round"/>`;
  const eyes = (mood==='happy'||mood==='cheer') ? eyesHappy : eyesOpen;
  const mouth = mood==='cheer' ? `<path d="M70 88q10 14 20 0z" fill="var(--mascot-beak)"/><path d="M74 92q6 5 12 0" fill="var(--sw-red)"/>` : `<path d="M71 87q9 11 18 0z" fill="var(--mascot-beak)"/>`;
  const wingL = mood==='cheer' ? `<g transform="rotate(-32 22 72)"><ellipse cx="22" cy="72" rx="10" ry="26" fill="var(--mascot-body)"/></g>` : `<g transform="rotate(14 33 110)"><ellipse cx="33" cy="110" rx="10" ry="28" fill="var(--mascot-body)"/></g>`;
  const wingR = (mood==='wave'||mood==='cheer') ? `<g transform="rotate(32 138 72)"><ellipse class="mascot__wave" cx="138" cy="72" rx="10" ry="26" fill="var(--mascot-body)"/></g>` : `<g transform="rotate(-14 127 110)"><ellipse cx="127" cy="110" rx="10" ry="28" fill="var(--mascot-body)"/></g>`;
  const extras = mood==='cheer'
    ? `<path class="mascot__spark" d="M20 30l3 7 7 3-7 3-3 7-3-7-7-3 7-3z" fill="var(--sw-yellow)"/><path class="mascot__spark" d="M142 22l2 5 5 2-5 2-2 5-2-5-5-2 5-2z" fill="var(--sw-pink)"/><circle class="mascot__spark" cx="150" cy="60" r="4" fill="var(--sw-green)"/><circle class="mascot__spark" cx="12" cy="66" r="3" fill="var(--sw-blue)"/>`
    : mood==='think' ? `<circle cx="134" cy="44" r="4" fill="var(--default)"/><circle cx="144" cy="30" r="6" fill="var(--default)"/><circle cx="152" cy="12" r="9" fill="var(--default)"/>`
    : mood==='happy' ? `<path class="mascot__spark" d="M140 34l2 5 5 2-5 2-2 5-2-5-5-2 5-2z" fill="var(--sw-yellow)"/>` : '';
  return `<svg class="mascot ${cls}" width="${size}" height="${Math.round(size*1.1)}" viewBox="0 0 160 176" role="img" aria-label="${esc(label||T('Pip — linh vật Engrisk','Pip — the Engrisk mascot'))}">
    <ellipse cx="80" cy="168" rx="42" ry="6" fill="currentColor" opacity=".08"/>
    <g class="mascot__bob">
      <ellipse cx="62" cy="158" rx="14" ry="7" fill="var(--mascot-feet)"/><ellipse cx="98" cy="158" rx="14" ry="7" fill="var(--mascot-feet)"/>
      ${mood==='cheer'?'':wingL}${(mood==='wave'||mood==='cheer')?'':wingR}
      <ellipse cx="80" cy="100" rx="50" ry="60" fill="var(--mascot-body)"/>
      <ellipse cx="80" cy="116" rx="34" ry="40" fill="#fff"/>
      <path d="M80 52c-25 0-38 13-38 28 0 14 11 22 23 22 7 0 11-3 15-7 4 4 8 7 15 7 12 0 23-8 23-22 0-15-13-28-38-28z" fill="#fff"/>
      ${eyes}${mouth}
      <ellipse cx="56" cy="92" rx="6" ry="3.5" fill="var(--mascot-cheek)"/><ellipse cx="104" cy="92" rx="6" ry="3.5" fill="var(--mascot-cheek)"/>
      <path d="M32 80C32 22 128 22 128 80" fill="none" stroke="var(--accent)" stroke-width="7" stroke-linecap="round"/>
      <rect x="22" y="70" width="17" height="27" rx="8.5" fill="var(--accent)"/><rect x="121" y="70" width="17" height="27" rx="8.5" fill="var(--accent)"/>
      ${mood==='cheer'?wingL:''}${(mood==='wave'||mood==='cheer')?wingR:''}
    </g>
    ${extras}
  </svg>`;
}

/* ---------- Language picker (HeroUI Dropdown pattern) ---------- */
function langPicker(place,{up=false,full=false}={}){
  const open=S.langMenu===place, cur=LANGS.find(l=>l[0]===S.lang);
  return `<div class="dropdown" data-dropdown="1">
    <button type="button" class="button button--tertiary button--sm" data-action="langMenu" data-p="${place}" data-fk="lang:${place}" aria-haspopup="menu" aria-expanded="${open}" aria-label="${T('Ngôn ngữ hiển thị','Display language')}">${icon('globe')}<span>${full?cur[1]:cur[0].toUpperCase()}</span>${icon('chevron-down',12)}</button>
    ${open?`<div class="dropdown__menu ${up?'dropdown__menu--up':''}" role="menu" aria-label="${T('Chọn ngôn ngữ','Choose language')}">
      ${LANGS.map(([c,n,en,ok])=>`<button type="button" class="menu-item" role="menuitemradio" aria-checked="${c===S.lang}" data-action="setLang" data-v="${c}" data-fk="setLang:${c}" ${ok?'':'disabled'}><span class="menu-item__code">${c.toUpperCase()}</span><span class="grow"><span style="display:block;font-weight:500">${n}</span><span class="text-xs text-muted">${en}</span></span>${c===S.lang?icon('check',14,'text-accent'):ok?'':chip(T('Sắp có','Soon'),'default',null,{size:'sm'})}</button>`).join('')}
      <div class="separator" style="margin:6px 0"></div><div class="text-xs text-muted" style="padding:4px 10px 6px">${T('Nội dung đề thi luôn bằng tiếng Anh. Giải thích hiển thị theo ngôn ngữ bạn chọn.','Exam content is always in English. Explanations follow your language.')}</div>
    </div>`:''}
  </div>`;
}

/* ---------- Appearance picker: HeroUI presets + light/dark/system ---------- */
function palettePicker(){
  return `<div class="palette-grid" role="radiogroup" aria-label="${T('Bảng màu','Color theme')}">${PALETTES.map(p=>`<button type="button" class="palette" role="radio" aria-checked="${S.palette===p.id}" data-action="setPalette" data-v="${p.id}" data-fk="pal:${p.id}">
      <span class="palette__preview" aria-hidden="true"><i style="background:${p.accent}"></i><i style="background:color-mix(in oklab,${p.accent} 18%,${p.bg})"></i><i style="background:${p.bg}"></i></span>
      <span class="row row--between"><span><span style="display:block;font-weight:600;font-size:13px">${p.name}</span><span class="text-xs text-muted">${S.lang==='en'?'HeroUI preset':p.vi}</span></span>${S.palette===p.id?icon('circle-check-fill',16,'text-accent'):''}</span></button>`).join('')}</div>
    <div class="row row--wrap gap-2" style="margin-top:4px">${tabs(T('Chế độ','Mode'),[['light',T('Sáng','Light'),'sun'],['dark',T('Tối','Dark'),'moon'],['system',T('Theo hệ thống','System'),'display']],S.mode,'setMode',{size:'sm'})}</div>`;
}
