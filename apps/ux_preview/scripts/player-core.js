/* Test player engine shared by the TOEIC and IELTS layouts.
 * Attempt = attempts row + attempt_responses + attempt_annotations (see schema.dbml).
 * Modes: mock (exam rules) | practice (learner-configured: parts, time limit, instant check, replay/speed, transcript). */

/* ---------- Attempt creation ---------- */
function buildPages(qids){
  const pages=[];
  qids.forEach(id=>{ const q=Q[id], key=q.group||('q:'+id), last=pages[pages.length-1];
    if (last&&last.key===key) last.qids.push(id);
    else pages.push({key,gid:q.group||null,qids:[id],part:q.part,section:q.section,audio:q.section==='L'?(q.group?{key,sec:G[q.group].sec,lines:G[q.group].lines}:{key,sec:q.audio.sec,lines:q.audio.lines}):null}); });
  return pages;
}
function buildTrack(E,secKey){
  const segs=[]; let lastPart=null; const ielts=E.layout==='ielts';
  E.pages.forEach((p,i)=>{ if(p.section!==secKey||!p.audio) return;
    if (p.part!==lastPart){ lastPart=p.part; segs.push(ielts?{kind:'read',part:p.part,page:i,sec:6}:{kind:'dir',part:p.part,page:i,sec:6}); }
    segs.push({kind:'audio',page:i,key:p.audio.key,sec:p.audio.sec});
    if (!ielts&&p.qids.length>1) segs.push({kind:'gap',page:i,sec:4}); });
  return {segs,i:0,t:0};
}
/** cfg: {mode, parts, limit (minutes|null), instant, replay, transcript} */
function newAttempt(examId,cfg={}){
  const ex=EXAMS[examId], mode=cfg.mode||ex.mode, parts=cfg.parts||examParts(ex), qids=cfg.qids||examQids(ex,parts), layout=examLayout(ex);
  const prac=mode==='practice';
  const E={examId,mode,layout,parts,qids,pages:buildPages(qids),page:0,focus:qids[0],
    answers:{},flags:{},struck:{},checked:{},time:{},hl:{},notes:[],audio:{},speed:1,volume:80,
    settings:{font:'md',tone:'default'},split:52,
    tools:{instant:cfg.instant??prac,replay:cfg.replay??prac,transcript:cfg.transcript??prac},
    limit:cfg.limit??null,elapsed:0,remaining:null,sec:null,track:null,phase:'run',
    save:'saved',mTab:'q',hidden:false,paused:false,notesOpen:false,showEv:null,pick:null,submitted:false};
  if (!prac && ex.sections){ E.sections=ex.sections.map(s=>({...s})); startSection(E,0); }
  else { E.sections=null; E.remaining=E.limit?E.limit*60:null; }
  return E;
}
function startSection(E,i){
  const s=E.sections[i]; E.secIdx=i; E.sec=s.key; E.phase='run';
  if (s.paced){ E.track=buildTrack(E,s.key); E.remaining=null; const first=E.track.segs[0]; if(first) E.page=first.page; }
  else { E.track=null; E.remaining=s.minutes*60; E.page=E.pages.findIndex(p=>p.section===s.key); }
  E.focus=E.pages[E.page].qids[0];
}
const curPage = () => S.exam.pages[S.exam.page];
const trackLeft = E => E.track ? E.track.segs.slice(E.track.i).reduce((a,s)=>a+s.sec,0)-E.track.t : 0;
const curSeg = E => E.track&&E.track.segs[E.track.i];
/** Pages the learner may open now (mock: only the current section) */
const pageAllowed = (E,i) => !E.sections || E.pages[i].section===E.sec;

/* ---------- Scoring ---------- */
const norm = s => String(s??'').trim().toLowerCase().replace(/\s+/g,' ');
function scoreOf(q,a){
  if (a==null||a===''||(Array.isArray(a)&&!a.length)) return 0;
  if (q.type==='gap') return q.answer.some(x=>norm(x)===norm(a))?1:0;
  if (q.type==='multi') return (a||[]).filter(x=>q.answer.includes(x)).length;
  return a===q.answer?1:0;
}
const isCorrect = (q,a) => scoreOf(q,a)===pointsOf(q);
const isBlank = a => a==null||a===''||(Array.isArray(a)&&!a.length);
const answeredCount = () => S.exam.qids.filter(id=>!isBlank(S.exam.answers[id])).length;
/* IELTS raw (out of 40) → band. Ranges 4–40 follow the commonly published Academic Reading / Listening tables; 1–3 → 1.0–2.0 is an Engrisk extrapolation (no official table below 2.5). */
const BAND_R = [[39,9],[37,8.5],[35,8],[33,7.5],[30,7],[27,6.5],[23,6],[19,5.5],[15,5],[13,4.5],[10,4],[8,3.5],[6,3],[4,2.5],[3,2],[2,1.5],[1,1],[0,0]];
const BAND_L = [[39,9],[37,8.5],[35,8],[32,7.5],[30,7],[26,6.5],[23,6],[18,5.5],[16,5],[13,4.5],[10,4],[8,3.5],[6,3],[4,2.5],[3,2],[2,1.5],[1,1],[0,0]];
const toBand = (raw40,sec) => (sec==='L'?BAND_L:BAND_R).find(([min])=>raw40>=min)[1];

function buildResult(examId,qids,answers,flags,mode,reason,extra={}){
  const ex=EXAMS[examId], track=ex.track;
  const items=qids.map((id,i)=>{ const q=Q[id], a=answers[id]??null, pts=scoreOf(q,a), max=pointsOf(q);
    return {qid:id,pos:i+1,n:numLabel(q),part:q.part,ans:a,pts,max,ok:pts===max,blank:isBlank(a),flag:!!(flags&&flags[id]),time:(extra.time||{})[id]||0}; });
  const agg=(key)=>{ const m={}; items.forEach(it=>{ const k=key(it); m[k]=m[k]||{c:0,n:0,time:0,q:0}; m[k].c+=it.pts; m[k].n+=it.max; m[k].time+=it.time; m[k].q++; }); return m; };
  const sections=agg(it=>Q[it.qid].section), parts=agg(it=>it.part);
  let total=null, band=null;
  if (mode==='mock'&&track==='toeic'){ total=0; Object.values(sections).forEach(s=>{ s.scaled=Math.max(5,Math.round(s.c/s.n*99)*5); total+=s.scaled; }); }
  if (track==='ielts'){ Object.entries(sections).forEach(([k,s])=>{ s.raw40=Math.round(s.c/s.n*40); s.band=toBand(s.raw40,k); }); band=Object.values(sections)[0].band; }
  const skm=agg(it=>Q[it.qid].skill);
  const skills=Object.entries(skm).map(([code,v])=>({code,c:v.c,n:v.n})).sort((a,b)=>a.c/a.n-b.c/b.n);
  const raw=items.reduce((a,i)=>a+i.pts,0), n=items.reduce((a,i)=>a+i.max,0);
  return {examId,mode,track,items,sections,parts,total,band,skills,reason,raw,n,guest:S.persona==='guest',hl:extra.hl||{},notes:extra.notes||[],cfg:extra.cfg||null,
    seconds:extra.seconds||items.reduce((a,i)=>a+i.time,0)};
}
const rawLabel = r => `${r.raw}/${r.n}`;

/* ---------- Shared renderers ---------- */
const evHtml = (html,qid) => qid ? html.replace(/class="ev" data-ev="([^"]*)"/g,(m,ids)=>ids.split(' ').includes(qid)?`class="ev is-ev" data-ev="${ids}"`:m) : html;
function zoneHtml(zoneKey,html,{review=false}={}){
  const E=S.exam, saved=review?(S.result&&S.result.hl[zoneKey]):E&&E.hl[zoneKey];
  const ev = review ? S.reviewEv : E&&E.showEv;
  return `<div class="hl-zone" data-zone="${zoneKey}">${evHtml(saved||html,ev)}</div>`;
}
const canHighlight = E => E.mode==='practice' || E.layout==='ielts';
const qState = (E,qid,review) => review ? 'review' : (E.mode==='practice'&&E.checked[qid]) ? 'checked' : 'open';
/** Single-choice options (TOEIC A–D, IELTS MC/TFNG). Strike-through available in practice. */
function choiceList(qid,{review,ans,compact}={}){
  const E=S.exam, q=Q[qid], st=qState(E,qid,review), a=review?ans:E.answers[qid];
  const hide = q.hide && st==='open';   /* Part 1–2 choices are spoken only: hidden until checked, in both modes */
  const struck = (!review&&E.struck[qid])||[];
  return `<fieldset class="options ${compact?'options--compact':''}" ${st!=='open'?'disabled':''}><legend class="sr-only">${T('Câu','Question')} ${numLabel(q)}</legend>${q.options.map(([k,t])=>{
    let cls=a===k?'is-selected':'', tag='';
    if (st!=='open'){ if(k===q.answer){cls='is-correct';tag=chip(a===k?T('Bạn chọn · Đúng','Your pick · Correct'):T('Đáp án','Answer'),'success','check',{size:'sm'});} else if(a===k){cls='is-wrong'+(S.justChecked===qid?' is-reveal':'');tag=chip(T('Bạn chọn','Your pick'),'danger','xmark',{size:'sm'});} else cls=''; }
    if (st==='open'&&S.just&&S.just.q===qid&&S.just.k===k) cls+=' is-just';
    if (struck.includes(k)&&a!==k) cls+=' is-struck';
    const text = hide ? `<span class="text-muted">${T('Phương án','Choice')} (${k}) — ${T('chỉ nghe, không in trên đề','spoken only, not printed')}</span>` : esc(t);
    return `<label class="option ${cls}"><input type="radio" name="ans-${qid}" value="${esc(k)}" data-input="answer" data-q="${qid}" ${a===k?'checked':''}><span class="option__key">${k.length>2?k.split(' ').map(w=>w[0]).join(''):k}</span><span class="option__text">${text}</span>${tag?`<span class="option__tag">${tag}</span>`:''}${st==='open'&&E.mode==='practice'?`<button type="button" class="option__strike" data-action="strike" data-q="${qid}" data-k="${esc(k)}" aria-pressed="${struck.includes(k)}" title="${T('Loại trừ phương án','Eliminate option')}" aria-label="${T('Loại trừ','Eliminate')} ${k}">${icon('eye-slash',14)}</button>`:''}</label>`; }).join('')}</fieldset>`;
}
function gapInput(qid,{review,ans}={}){
  const E=S.exam, q=Q[qid], st=qState(E,qid,review), a=review?ans:E.answers[qid];
  const ok=st!=='open'&&isCorrect(q,a), w=Math.max(7,Math.min(18,(q.answer[0]||'').length+3));
  return `<span class="gap ${st!=='open'?(ok?'is-correct':'is-wrong'):''} ${E&&E.focus===qid&&!review?'is-focus':''}"><span class="gap__n">${q.n}</span><input class="gap__input" id="gap-${qid}" data-input="gap" data-q="${qid}" value="${esc(a||'')}" style="width:${w}ch" autocomplete="off" spellcheck="false" ${st!=='open'?'disabled':''} aria-label="${T('Câu','Question')} ${q.n}"></span>${st!=='open'&&!ok?`<span class="gap__key">${icon('check',12)}${esc(q.answer[0])}</span>`:''}`;
}
function multiList(qid,{review,ans}={}){
  const E=S.exam, q=Q[qid], st=qState(E,qid,review), a=(review?ans:E.answers[qid])||[], full=a.length>=q.pick;
  return `<fieldset class="options options--compact" ${st!=='open'?'disabled':''}><legend class="sr-only">${numLabel(q)}</legend>${q.options.map(([k,t])=>{
    const on=a.includes(k); let cls=on?'is-selected':'';
    if (st!=='open'){ cls = q.answer.includes(k)?(on?'is-correct':'is-missed'):(on?'is-wrong':''); }
    return `<label class="option option--check ${cls}"><input type="checkbox" value="${k}" data-input="multi" data-q="${qid}" ${on?'checked':''} ${!on&&full&&st==='open'?'disabled':''}><span class="option__key">${k}</span><span class="option__text">${esc(t)}</span>${st!=='open'&&q.answer.includes(k)&&!on?`<span class="option__tag">${chip(T('Đáp án','Answer'),'success','check',{size:'sm'})}</span>`:''}</label>`; }).join('')}
    ${st==='open'?`<span class="text-xs text-muted">${T(`Đã chọn ${a.length}/${q.pick}`,`${a.length}/${q.pick} selected`)}</span>`:''}</fieldset>`;
}
function selectInput(qid,list,{review,ans}={}){
  const E=S.exam, q=Q[qid], st=qState(E,qid,review), a=review?ans:E.answers[qid], ok=st!=='open'&&isCorrect(q,a);
  return `<span class="row gap-2"><select class="select select--inline ${st!=='open'?(ok?'is-correct':'is-wrong'):''}" data-input="select" data-q="${qid}" ${st!=='open'?'disabled':''} aria-label="${T('Câu','Question')} ${q.n}"><option value="">—</option>${list.map(([k])=>`<option ${a===k?'selected':''}>${k}</option>`).join('')}</select>${st!=='open'&&!ok?`<span class="gap__key">${icon('check',12)}${q.answer}</span>`:''}</span>`;
}
function flagBtn(qid){
  const E=S.exam, on=!!E.flags[qid];
  return `<button type="button" class="flag ${on?'is-on':''}" data-action="flag" data-q="${qid}" data-fk="flag:${qid}" aria-pressed="${on}" title="${T('Đánh dấu để xem lại','Mark for review')}">${icon('bookmark',14)}<span class="sr-only">${T('Đánh dấu','Flag')}</span></button>`;
}
function feedbackBlock(qid,{review,ans}={}){
  const E=S.exam, q=Q[qid], a=review?ans:E.answers[qid], good=isCorrect(q,a), just=S.justChecked===qid||(Array.isArray(S.justChecked)&&S.justChecked.includes(qid));
  return `<div class="block-verified ${just?'is-reveal':''}">
    <div class="row row--between"><span class="block-verified__head">${icon('shield-check',14)}${T('Đáp án đã kiểm duyệt','Verified answer')}: ${esc(Array.isArray(q.answer)?(q.type==='gap'?q.answer[0]:q.answer.join(', ')):q.answer)}</span>${chip(good?T('Chính xác','Correct'):isBlank(a)?T('Bỏ trống','Blank'):T('Chưa đúng','Not quite'),good?'success':'danger',good?'check':'xmark',{size:'sm',v:'primary'})}</div>
    <p class="text-sm" style="line-height:22px">${esc(tx(q.exp))}</p>
    <div class="row row--wrap gap-1">${q.group&&G[q.group].type!=='audio'?btn(T('Xem bằng chứng','Show evidence'),{v:'ghost',size:'sm',ic:'bulb',action:'showEv',data:{q:qid}}):''}${!good?btn(T('Hỏi AI Tutor','Ask AI Tutor'),{v:'secondary',size:'sm',ic:'sparkles',action:'askTutor',data:{q:qid,a:Array.isArray(a)?a.join(','):(a||'')}}):''}</div></div>`;
}
/* ---------- Audio ---------- */
const spk = s => ({W:'W',M:'M',N:''}[s]??s);
function transcriptHtml(lines,t,{seek=true}={}){
  const cur = lines.reduce((c,l,i)=>l[0]<=t?i:c,-1);
  return `<div class="transcript">${lines.map((l,i)=>`<button type="button" class="transcript__line ${i===cur?'is-current':''}" ${seek?`data-action="seek" data-t="${l[0]}"`:'disabled'}><span class="transcript__t tnum">${fmt(l[0])}</span>${spk(l[1])?`<b>${spk(l[1])}:</b>`:''}<span>${esc(l[2])}</span></button>`).join('')}</div>`;
}
/** Practice player: play/pause, −5s, speed, scrubber, transcript (after check or when allowed) */
function practiceAudio(page){
  const E=S.exam, a=E.audio[page.key]||{t:0,playing:false}, sec=page.audio.sec, n=isM()?24:48;
  const checked=page.qids.every(id=>E.checked[id]), showT=E.tools.transcript&&checked;
  const bars=Array.from({length:n},(_,i)=>`<i class="${i/n<a.t/sec?'on':''}" style="height:${6+((i*7+3)%19)}px"></i>`).join('');
  return `<div class="audio audio--practice" role="group" aria-label="${T('Trình phát âm thanh','Audio player')}">
    <button type="button" class="audio__play ${a.playing?'is-playing':''}" data-action="aToggle" data-fk="aToggle" aria-label="${a.playing?T('Tạm dừng','Pause'):T('Phát','Play')}">${icon(a.playing?'pause-fill':'play-fill',18)}</button>
    <div class="grow col gap-1" style="min-width:0">
      <div class="wave ${a.playing?'wave--live':''}" data-action="scrub" aria-hidden="true">${bars}</div>
      <div class="row row--between text-xs text-muted"><span class="tnum" id="a-time">${fmt(a.t)} / ${fmt(sec)}</span><span class="row gap-1">
        ${E.tools.replay?`${btn('',{v:'ghost',size:'sm',ic:'arrow-rotate-left',action:'aBack',aria:T('Lùi 5 giây','Back 5 seconds')})}<span class="speed" role="group" aria-label="${T('Tốc độ','Speed')}">${[0.75,1,1.25].map(s=>`<button type="button" class="speed__btn" aria-pressed="${E.speed===s}" data-action="aSpeed" data-v="${s}">${s}×</button>`).join('')}</span>`:chip(T('Phát 1 lần','Plays once'),'warning','headphones',{size:'sm'})}
        ${sim(T('Âm thanh giả lập','Simulated audio'))}</span></div></div></div>
    ${showT?`<details class="disclosure" open><summary>${T('Transcript (đồng bộ)','Transcript (synced)')}${icon('chevron-down',14)}</summary><div class="disclosure__body">${transcriptHtml(page.audio.lines,a.t)}</div></details>`
      :E.tools.transcript?`<p class="text-xs text-muted row gap-1">${icon('lock',12)}${T('Transcript mở sau khi bạn kiểm tra đáp án.','The transcript unlocks after you check your answers.')}</p>`:''}`;
}
/** Mock: audio is driven by the section track; learner only controls volume. */
function mockAudio(){
  const E=S.exam, seg=curSeg(E), page=seg&&E.pages[seg.page];
  const label = !seg ? T('Phần nghe đã kết thúc','Listening has ended')
    : seg.kind==='dir' ? `${tx(ALL_PARTS[seg.part].name)} · Directions`
    : seg.kind==='read' ? T(`Thời gian xem trước câu hỏi ${ALL_PARTS[seg.part].range}`,`Time to look at questions ${ALL_PARTS[seg.part].range}`)
    : seg.kind==='gap' ? T('Thời gian trả lời','Answer time')
    : `${T('Đang phát','Now playing')} · ${T('Câu','Questions')} ${page.qids.map(id=>numLabel(Q[id])).join(', ')}`;
  const live = seg&&seg.kind==='audio';
  return `<div class="audio audio--mock" role="status" aria-live="polite"><span class="audio__play ${live?'is-playing':''}" aria-hidden="true">${icon(live?'volume':'clock',18)}</span>
    <div class="grow col gap-1" style="min-width:0"><div class="row row--between"><span class="text-sm font-medium truncate" id="track-label">${label}</span>${isM()?'':chip(T('Không tua, không phát lại','No pause or replay'),'warning','headphones',{size:'sm'})}</div>
    <div class="wave ${live?'wave--live':''}" aria-hidden="true">${Array.from({length:isM()?24:56},(_,i)=>`<i class="${live?'on':''}" style="height:${6+((i*7+3)%19)}px"></i>`).join('')}</div></div>
    <label class="volume" title="${T('Âm lượng','Volume')}">${icon('volume',14)}<input type="range" min="0" max="100" value="${E.volume}" data-input="volume" aria-label="${T('Âm lượng','Volume')}"></label></div>`;
}
/* ---------- Tool popovers (settings, notes) ---------- */
function settingsPopover(){
  const E=S.exam;
  return `<div class="dropdown__menu player-pop" role="dialog" aria-label="${T('Cài đặt hiển thị','Display settings')}">
    <div class="col gap-2" style="padding:6px 6px 10px"><span class="text-xs font-semibold text-muted">${T('Cỡ chữ','Text size')}</span>${tabs(T('Cỡ chữ','Text size'),[['md',T('Chuẩn','Standard')],['lg',T('Lớn','Large')],['xl',T('Rất lớn','Extra large')]],E.settings.font,'pFont',{size:'sm',full:true})}
    <span class="text-xs font-semibold text-muted">${T('Màu nền','Colour')}</span>${tabs(T('Màu nền','Colour'),[['default',T('Mặc định','Default')],['cream',T('Kem dịu mắt','Cream')],['dark',T('Nền tối','Dark')]],E.settings.tone,'pTone',{size:'sm',full:true})}
    ${E.mode==='practice'?`<span class="text-xs font-semibold text-muted">${T('Hỗ trợ luyện tập','Practice aids')}</span>
      <label class="row row--between text-sm">${T('Kiểm tra đáp án từng trang','Check answers per page')}${switchEl(E.tools.instant,'tInstant',T('Kiểm tra ngay','Instant check'))}</label>
      <label class="row row--between text-sm">${T('Nghe lại & đổi tốc độ','Replay & speed')}${switchEl(E.tools.replay,'tReplay',T('Nghe lại','Replay'))}</label>
      <label class="row row--between text-sm">${T('Transcript sau khi kiểm tra','Transcript after checking')}${switchEl(E.tools.transcript,'tTranscript','Transcript')}</label>`:''}</div></div>`;
}
function notesPanel(){
  const E=S.exam;
  return `<aside class="notes-panel" aria-label="${T('Ghi chú','Notes')}"><div class="row row--between"><b>${T('Ghi chú','Notes')} <span class="text-muted">${E.notes.length}</span></b>${btn('',{v:'ghost',size:'sm',ic:'xmark',action:'notesToggle',aria:T('Đóng','Close')})}</div>
    ${E.notes.length?E.notes.map(n=>`<div class="note"><span class="note__quote">“${esc(n.quote)}”</span><textarea class="textarea textarea--secondary" rows="2" data-input="note" data-id="${n.id}" placeholder="${T('Viết ghi chú…','Write a note…')}">${esc(n.text)}</textarea><div class="row row--end">${btn(T('Xóa','Delete'),{v:'ghost',size:'sm',ic:'trash-bin',action:'noteDel',data:{id:n.id}})}</div></div>`).join('')
      :`<p class="text-sm text-muted">${T('Bôi đen một đoạn trong bài → chọn “Ghi chú”.','Select text in the passage → choose “Note”.')}</p>`}</aside>`;
}
function playerOverlays(){
  const E=S.exam; let h='';
  if (E.hidden) h+=`<div class="player-cover" role="dialog" aria-label="${T('Màn hình đang ẩn','Screen hidden')}">${icon('eye-slash',28)}<div class="text-lg font-semibold">${T('Màn hình đang ẩn','Screen hidden')}</div><p class="text-muted">${T('Thời gian vẫn tiếp tục chạy.','The timer is still running.')}</p>${btn(T('Hiện lại bài thi','Show test'),{action:'pHide'})}</div>`;
  if (E.paused) h+=`<div class="player-cover" role="dialog" aria-label="${T('Đã tạm dừng','Paused')}">${icon('pause-fill',28)}<div class="text-lg font-semibold">${T('Đã tạm dừng','Paused')}</div><p class="text-muted">${T('Đồng hồ và âm thanh đã dừng. Chỉ có ở chế độ Luyện tập.','Timer and audio are stopped. Practice mode only.')}</p>${btn(T('Tiếp tục','Resume'),{ic:'play-fill',action:'pPause'})}</div>`;
  if (E.phase==='check') h+=`<div class="check-banner" role="status">${icon('clock',16)}<span>${T('Phần nghe đã kết thúc. Bạn có <b>2 phút</b> để kiểm tra đáp án.','The recording has ended. You have <b>2 minutes</b> to check your answers.')}</span><span class="tnum font-semibold" id="check-left">${fmt(E.remaining)}</span></div>`;
  return h;
}
function saveBadge(){
  const s = viewState('exam')==='error' ? 'offline' : S.exam.save;
  return s==='saving'?`<span class="spinner spinner--sm">${SPIN}</span>${T('Đang lưu…','Saving…')}`
    : s==='offline'?`<span class="text-warning row gap-1">${icon('cloud-slash',12)}${T('Lưu trên thiết bị','Saved on device')}</span>`
    : `${icon('circle-check',12,'text-success')}${T('Đã lưu','Saved')}`;
}
function timerHtml(){
  const E=S.exam;
  if (E.track) return `<span id="exam-timer" class="timer" role="timer" aria-label="${T('Thời lượng audio còn lại','Audio time left')}">${icon('headphones',14)}<span>${fmt(trackLeft(E))}</span></span>`;
  if (E.remaining!=null){ const r=E.remaining; return `<span id="exam-timer" class="timer ${r<=300?'is-danger':r<=600?'is-warn':''}" role="timer" aria-label="${T('Thời gian còn lại','Time left')}">${icon('clock',14)}<span>${fmt(r)}</span></span>`; }
  return `<span id="exam-timer" class="timer" role="timer" aria-label="${T('Thời gian đã làm','Time spent')}">${icon('stopwatch',14)}<span>${fmt(E.elapsed)}</span></span>`;
}
/** Shared action buttons in a player header */
function toolButtons({compact}={}){
  const E=S.exam;
  return `${E.mode==='practice'?btn(compact?'':T('Tạm dừng','Pause'),{v:'tertiary',size:'sm',ic:'pause-fill',action:'pPause',aria:T('Tạm dừng','Pause')}):''}
    ${canHighlight(E)?btn('',{v:E.notesOpen?'secondary':'ghost',size:'sm',ic:'square-list-ul',action:'notesToggle',aria:`${T('Ghi chú','Notes')} (${E.notes.length})`}):''}
    <div class="dropdown" data-dropdown="1">${btn('',{v:S.pPop==='settings'?'secondary':'ghost',size:'sm',ic:'gear',action:'pPop',data:{v:'settings'},aria:T('Cài đặt hiển thị','Display settings')})}${S.pPop==='settings'?settingsPopover():''}</div>`;
}
function playerRoot(inner){
  const E=S.exam, tone=E.settings.tone;
  return `<div class="player player--${E.layout} ${isM()?'player--mobile':''}" data-font="${E.settings.font}" ${tone==='dark'?`data-theme="dark" data-palette="${S.palette}"`:''} ${tone==='cream'?'data-tone="cream"':''}>${inner}${playerOverlays()}</div>`;
}
/* ---------- Resume ---------- */
const answeredOf = E => E.qids.filter(id=>!isBlank(E.answers[id])).length;
const resumeLabel = E => `${E.sections?SECTION[E.sec]+' · ':''}${T('Câu','Question')} ${numLabel(Q[E.focus])}`;
/** Seed for the "returning" persona: Test 01 mock, Listening done, Reading in progress at Q104 */
function resumeSeed(){
  const E=newAttempt('toeic-test-01',{mode:'mock'});
  Object.assign(E.answers,{t1:'B',t2:'B',t7:'A',t8:'C',t9:'A',t32:'A',t33:'C',t34:'B',t71:'A',t72:'B',t73:'A',t101:'A',t102:'B',t103:'C'});
  E.flags.t72=true; E.time={t1:9,t2:9,t7:7,t8:7,t9:7,t32:12,t33:10,t34:16,t71:8,t72:14,t73:9,t101:24,t102:31,t103:52};
  startSection(E,1); E.remaining=38*60+12; E.page=E.pages.findIndex(p=>p.qids.includes('t104')); E.focus='t104';
  return E;
}
