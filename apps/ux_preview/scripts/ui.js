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
