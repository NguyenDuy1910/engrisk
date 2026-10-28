/* Test-player interactions: keyboard, inputs, drag-and-drop headings, resizable split,
 * text selection → highlight/note, and the exam clocks (section timer, audio track, practice audio). */

/* ---------- Focus tracking (which question the time-on-task and shortcuts apply to) ---------- */
function trackFocus(target){
  const E=S.exam; if(!E||S.screen!=='exam') return;
  const w=target.closest&&target.closest('[data-qwrap]'); if(!w||E.focus===w.dataset.qwrap) return;
  E.focus=w.dataset.qwrap;
  document.querySelectorAll('.player .is-focus').forEach(e=>e.classList.remove('is-focus')); w.classList.add('is-focus');
  document.querySelectorAll('.ip-num.is-current,.as-row.is-current').forEach(e=>e.classList.remove('is-current'));
}
const stepPage = d => { const E=S.exam; let i=E.page+d; while(i>=0&&i<E.pages.length&&!pageAllowed(E,i)) i+=d; if(i>=0&&i<E.pages.length) A.pGo({i}); };

/* ---------- Keyboard ---------- */
function playerKey(ev){
  const t=ev.target;
  if (t.matches&&t.matches('[data-divider]')&&S.exam&&/Arrow(Left|Right)/.test(ev.key)){ ev.preventDefault(); S.exam.split=Math.max(28,Math.min(72,S.exam.split+(ev.key==='ArrowLeft'?-4:4))); render(); return; }
  if (S.screen!=='exam'||!S.exam||S.modal||S.sheet||isM()) return;
  if (t.matches('input:not([type=radio]):not([type=checkbox]),textarea,select')||(t.matches('input[type=radio]')&&ev.key.startsWith('Arrow'))) return;
  if (ev.metaKey||ev.ctrlKey||ev.altKey) return;
  const E=S.exam, q=Q[E.focus];
  if (ev.key===' '&&E.mode==='practice'&&curPage().audio&&!t.matches('button')){ ev.preventDefault(); A.aToggle(); return; }
  if (ev.key==='ArrowRight'){ ev.preventDefault(); E.layout==='ielts'?A.qStep({d:1}):stepPage(1); return; }
  if (ev.key==='ArrowLeft'){ ev.preventDefault(); E.layout==='ielts'?A.qStep({d:-1}):stepPage(-1); return; }
  if (ev.key.toLowerCase()==='f'){ A.flag({}); return; }
  if (!q||!q.options||q.type==='multi'||qState(E,E.focus)!=='open') return;
  const k=ev.key.toUpperCase();
  const o = q.options.find(([key])=>key===k) || (q.options===TFNG ? q.options.find(([key])=>key[0]===k&&(k==='T'||k==='F'||k==='N')) : null);
  if (o){ setAnswer(E.focus,o[0]); S.just={q:E.focus,k:o[0]}; if(document.activeElement) document.activeElement.blur(); render(); }
}

/* ---------- Inputs ---------- */
function playerChange(el,k){
  const E=S.exam;
  if (k==='answer'){ setAnswer(el.dataset.q,el.value); if(E) E.focus=el.dataset.q; S.just={q:el.dataset.q,k:el.value}; render(); return true; }
  if (k==='multi'){ const q=Q[el.dataset.q], a=(E.answers[el.dataset.q]||[]).slice(), i=a.indexOf(el.value); if(el.checked&&i<0&&a.length<q.pick) a.push(el.value); if(!el.checked&&i>=0) a.splice(i,1); a.sort(); setAnswer(el.dataset.q,a); E.focus=el.dataset.q; render(); return true; }
  if (k==='select'){ setAnswer(el.dataset.q,el.value||null); E.focus=el.dataset.q; render(); return true; }
  if (k==='gap'){ render(); return true; }
  if (k==='reviewFlag'){ E.flags[E.focus]=el.checked; render(); return true; }
  return false;
}
function playerInput(el,k){
  const E=S.exam;
  if (k==='gap'){ setAnswer(el.dataset.q,el.value); E.focus=el.dataset.q; return true; }
  if (k==='note'){ const n=E.notes.find(x=>x.id===el.dataset.id); if(n) n.text=el.value; return true; }
  if (k==='volume'){ E.volume=+el.value; return true; }
  return false;
}

/* ---------- Matching headings: drag & drop (click-to-place is the accessible alternative) ---------- */
document.addEventListener('dragstart',ev=>{ const h=ev.target.closest&&ev.target.closest('[data-heading]'); if(h){ ev.dataTransfer.setData('text/plain',h.dataset.heading); ev.dataTransfer.effectAllowed='move'; } });
document.addEventListener('dragover',ev=>{ const s=ev.target.closest&&ev.target.closest('[data-slot]'); if(s&&!s.disabled){ ev.preventDefault(); s.classList.add('is-over'); } });
document.addEventListener('dragleave',ev=>{ const s=ev.target.closest&&ev.target.closest('[data-slot]'); if(s) s.classList.remove('is-over'); });
document.addEventListener('drop',ev=>{ const s=ev.target.closest&&ev.target.closest('[data-slot]'); if(!s||!S.exam) return; ev.preventDefault(); const k=ev.dataTransfer.getData('text/plain'); if(k){ assignHeading(s.dataset.slot,k); S.exam.focus=s.dataset.slot; S.exam.pick=null; render(); } });

/* ---------- Resizable split (IELTS) ---------- */
document.addEventListener('pointerdown',ev=>{
  const d=ev.target.closest&&ev.target.closest('[data-divider]'); if(!d||!S.exam) return;
  ev.preventDefault(); const split=d.parentElement, r=split.getBoundingClientRect(); split.classList.add('is-resizing');
  const move=e=>{ S.exam.split=Math.round(Math.max(28,Math.min(72,(e.clientX-r.left)/r.width*100))); split.style.gridTemplateColumns=`${S.exam.split}% 10px minmax(0,1fr)`; };
  const up=()=>{ split.classList.remove('is-resizing'); document.removeEventListener('pointermove',move); document.removeEventListener('pointerup',up); };
  document.addEventListener('pointermove',move); document.addEventListener('pointerup',up);
});

/* ---------- Text selection → Highlight / Note ---------- */
let selMenuEl=null;
function hideSelMenu(){ if(selMenuEl){ selMenuEl.remove(); selMenuEl=null; } }
function showSelMenu(rect,ctx){
  hideSelMenu(); const app=document.querySelector('.app'); if(!app) return; const ar=app.getBoundingClientRect();
  const el=document.createElement('div'); el.className='sel-menu'; el.setAttribute('role','menu');
  el.innerHTML = ctx.mark ? `<button type="button" role="menuitem" data-sel="clear">${icon('xmark',14)}${T('Bỏ highlight','Remove highlight')}</button>`
    : `<button type="button" role="menuitem" data-sel="hl">${icon('pencil',14)}Highlight</button><button type="button" role="menuitem" data-sel="note">${icon('square-list-ul',14)}${T('Ghi chú','Note')}</button>`;
  el.style.left=`${rect.left-ar.left+rect.width/2}px`; el.style.top=`${rect.top-ar.top}px`;
  app.appendChild(el); selMenuEl=el;
  el.addEventListener('mousedown',e=>e.preventDefault());
  el.addEventListener('click',e=>{ const b=e.target.closest('[data-sel]'); if(!b) return; e.stopPropagation(); applySel(b.dataset.sel,ctx); hideSelMenu(); });
}
function applySel(kind,ctx){
  const E=S.exam;
  if (kind==='clear'){ const mk=ctx.mark, zone=mk.closest('.hl-zone'), id=mk.dataset.note; mk.replaceWith(...mk.childNodes); zone.normalize(); E.hl[zone.dataset.zone]=zone.innerHTML.replace(/ is-ev/g,''); if(id) E.notes=E.notes.filter(n=>n.id!==id); render(); return; }
  const {range,zone}=ctx, quote=range.toString().trim(), mark=document.createElement('mark');
  mark.className = kind==='note' ? 'hl hl--note' : 'hl';
  const id = kind==='note' ? 'n'+Date.now() : null; if(id) mark.dataset.note=id;
  mark.appendChild(range.extractContents()); range.insertNode(mark);
  zone.querySelectorAll('mark.hl mark.hl').forEach(m=>m.replaceWith(...m.childNodes));
  E.hl[zone.dataset.zone]=zone.innerHTML.replace(/ is-ev/g,'');
  window.getSelection().removeAllRanges();
  if (id){ E.notes.push({id,zone:zone.dataset.zone,quote:quote.slice(0,140),text:''}); E.notesOpen=true; render(); requestAnimationFrame(()=>{ const ta=document.querySelector(`[data-input="note"][data-id="${id}"]`); if(ta) ta.focus(); }); }
  else render();
}
function onSelectEnd(ev){
  setTimeout(()=>{
    const E=S.exam; if(!E||S.screen!=='exam'||!canHighlight(E)) return;
    if (ev.target.closest&&ev.target.closest('.sel-menu')) return;
    const sel=window.getSelection(), mk=ev.target.closest&&ev.target.closest('.hl-zone mark.hl');
    if ((!sel||sel.isCollapsed)&&mk){ showSelMenu(mk.getBoundingClientRect(),{mark:mk}); return; }
    if (!sel||sel.isCollapsed||!sel.rangeCount) return;
    const range=sel.getRangeAt(0), node=range.commonAncestorContainer, zone=(node.nodeType===1?node:node.parentElement).closest('.hl-zone');
    if (!zone||sel.toString().trim().length<2) return;
    showSelMenu(range.getBoundingClientRect(),{range,zone});
  },0);
}
document.addEventListener('mouseup',onSelectEnd);
document.addEventListener('touchend',onSelectEnd);

/* ---------- Clocks ---------- */
function updateTimer(E){
  const t=document.getElementById('exam-timer'); if(!t) return;
  t.outerHTML = E.layout==='ielts' ? ieltsTime(E) : timerHtml();
  const c=document.getElementById('check-left'); if(c) c.textContent=fmt(E.remaining);
}
function endTrack(E,here){
  E.track=null; const s=E.sections[E.secIdx];
  if (s.check){ E.phase='check'; E.remaining=s.check; if(here) render(); return; }
  if (E.secIdx<E.sections.length-1){ E.phase='transition'; if(here){ S.modal={type:'section'}; render(); } return; }
  if (here) submitExam('time_expired');
}
function tickExam(E,here){
  if (E.mode==='practice'&&!here) return;            // practice pauses when you leave
  if (E.paused||E.phase==='transition') return;
  if (here&&E.focus&&!E.hidden) E.time[E.focus]=(E.time[E.focus]||0)+1;
  if (E.track){
    const tr=E.track; tr.t++; let changed=false;
    while (tr.i<tr.segs.length&&tr.t>=tr.segs[tr.i].sec){ tr.t-=tr.segs[tr.i].sec; tr.i++; changed=true; }
    if (tr.i>=tr.segs.length){ endTrack(E,here); return; }
    if (changed){ const seg=tr.segs[tr.i];
      /* auto-follow the recording unless the learner deliberately went to another page */
      if (E.lastSegPage==null||E.page===E.lastSegPage){ if(E.page!==seg.page){ E.page=seg.page; E.focus=E.pages[seg.page].qids[0]; } }
      E.lastSegPage=seg.page; if(here) render(); }
    else if (here) updateTimer(E);
    return;
  }
  if (E.remaining!=null){
    E.remaining=Math.max(0,E.remaining-1);
    if (E.remaining===0){
      if (!here) return;                               // server auto-submits; the client reacts when the learner returns
      if (E.phase!=='check'&&E.sections&&E.secIdx<E.sections.length-1){ E.phase='transition'; S.modal={type:'section'}; render(); return; }
      submitExam('time_expired'); return;
    }
    if (here) updateTimer(E); return;
  }
  E.elapsed++; if(here) updateTimer(E);
}
setInterval(()=>{
  const E=S.exam;
  if (E&&!E.submitted) tickExam(E,S.screen==='exam');
  const R=S.resume; if (R&&R.mode==='mock'&&R.remaining!=null&&!(E&&E.examId===R.examId)) R.remaining=Math.max(0,R.remaining-1);
},1000);
/* practice audio (simulated playback at the chosen speed) */
setInterval(()=>{
  const E=S.exam; if(!E||S.screen!=='exam'||E.paused||E.mode==='mock') return;
  const p=E.pages[E.page]; if(!p||!p.audio) return; const a=E.audio[p.key]; if(!a||!a.playing) return;
  a.t=Math.min(p.audio.sec,a.t+0.2*E.speed);
  if (a.t>=p.audio.sec){ a.playing=false; render(); return; }
  const time=document.getElementById('a-time'); if(time) time.textContent=`${fmt(a.t)} / ${fmt(p.audio.sec)}`;
  const bars=document.querySelectorAll('.audio--practice .wave i'); bars.forEach((b,i)=>b.classList.toggle('on',i/bars.length<a.t/p.audio.sec));
  const cur=p.audio.lines.reduce((c,l,i)=>l[0]<=a.t?i:c,-1); document.querySelectorAll('.transcript__line').forEach((l,i)=>l.classList.toggle('is-current',i===cur));
},200);
