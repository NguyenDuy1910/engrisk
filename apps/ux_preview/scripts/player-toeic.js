/* TOEIC Listening & Reading player — "test book + answer sheet" model.
 * Mock: Listening is paced by one continuous recording (no pause/replay), Reading has a 75-minute clock,
 * Part 1–2 choices are spoken only, nothing may be written in the test book (no highlight in mock).
 * Practice: chosen parts, optional timer, per-page check, replay/speed, synced transcript, eliminate options, highlight. */
const nums = qids => { const a=qids.map(id=>numLabel(Q[id])); return a.length>1?`${a[0]}–${a[a.length-1]}`:a[0]; };
function tq(qid,opts={}){
  const E=S.exam, q=Q[qid], review=opts.review, st=qState(E,qid,review);
  return `<div class="tq ${E&&E.focus===qid&&!review?'is-focus':''}" data-qwrap="${qid}" id="tq-${qid}">
    <div class="tq__head"><span class="qnum">${q.n}</span><span class="tq__stem">${q.stem?esc(q.stem):`<span class="text-muted">${T('Chọn đáp án cho chỗ trống','Choose the answer for blank')} ${q.n}</span>`}</span>${review?'':flagBtn(qid)}</div>
    ${choiceList(qid,{review,ans:opts.ans,compact:true})}
    ${st!=='open'?feedbackBlock(qid,{review,ans:opts.ans}):''}</div>`;
}
function partBanner(page){
  const E=S.exam, P=ALL_PARTS[page.part], firstOfPart=E.pages.findIndex(p=>p.part===page.part)===E.page;
  return `<div class="part-banner"><span class="part-banner__tag">${partLabel(page.part)}</span><b>${P.short}</b>${P.range?`<span class="text-muted text-sm">· ${T('Câu','Questions')} ${P.range}</span>`:''}
    ${P.dir?`<details class="part-banner__dir" ${firstOfPart&&E.mode==='mock'?'open':''}><summary>${T('Hướng dẫn','Directions')}${icon('chevron-down',12)}</summary><p>${P.dir}</p></details>`:''}</div>`;
}
function blankDoc(html,qids){
  const E=S.exam;
  return html.replace(/<span class="blank" data-q="(t\d+)">(\d+)<\/span>/g,(m,id,n)=>{ const a=E.answers[id], q=Q[id], txt=a&&q.options.find(o=>o[0]===a);
    return `<button type="button" class="blank ${E.focus===id?'is-focus':''} ${a?'is-filled':''}" data-action="focusQ" data-q="${id}">(${n})${txt?` <span>${esc(txt[1])}</span>`:' ______'}</button>`; });
}
function toeicStimulus(page,{review}={}){
  const g=page.gid&&G[page.gid], q=Q[page.qids[0]];
  if (page.part==='P1') return `<figure class="photo-frame">${PHOTOS[q.img]}<figcaption class="text-xs text-muted">${T('Ảnh minh họa cho prototype — bản thật dùng ảnh chụp','Prototype illustration — production uses photographs')}</figcaption></figure>`;
  if (!g) return '';
  if (g.type==='passage') return `<div class="docs">${review?zoneHtml(page.gid,g.html,{review}):`<div class="doc-plain">${blankDoc(g.html,page.qids)}</div>`}</div>`;
  if (g.type==='docs') return `<div class="docs">${g.docs.map((d,i)=>`<section class="doc-wrap"><span class="doc-label">${d.label}</span>${zoneHtml(page.gid+':'+i,d.html,{review})}</section>`).join('')}</div>`;
  if (g.graphic) return `<div class="graphic-wrap">${g.graphic}</div>`;
  return '';
}
function toeicPageBody(page){
  const E=S.exam, m=isM(), qs=page.qids.map(id=>tq(id)).join('');
  const checkBtn = E.mode==='practice'&&E.tools.instant&&page.qids.some(id=>!E.checked[id]) ? `<div>${btn(`${T('Kiểm tra','Check')} (${page.qids.filter(id=>!isBlank(E.answers[id])&&!E.checked[id]).length})`,{action:'checkPage',ic:'check',disabled:!page.qids.some(id=>!isBlank(E.answers[id])&&!E.checked[id])})}</div>` : '';
  const audio = page.section==='L' ? (E.mode==='mock'?mockAudio():practiceAudio(page)) : '';
  const head = `${partBanner(page)}${audio}`;
  if (page.part==='P1') return head+`<div class="tp-split tp-split--photo">${toeicStimulus(page)}<div class="col gap-3">${qs}${checkBtn}</div></div>`;
  if (page.part==='P2'||page.part==='P5') return head+`<div class="tp-single">${qs}${checkBtn}</div>`;
  const g=G[page.gid];
  const groupTitle = `<p class="group-title">${g.title}</p>`;
  if (page.part==='P3'||page.part==='P4') return head+groupTitle+(g.graphic?`<div class="tp-split">${`<div class="col gap-3">${qs}${checkBtn}</div>`}${toeicStimulus(page)}</div>`:`<div class="tp-single">${qs}${checkBtn}</div>`);
  if (m) return head+groupTitle+tabs(T('Hiển thị','View'),[['p',T('Văn bản','Text'),'file-text'],['q',`${T('Câu','Q')} ${nums(page.qids)}`,'list-check']],E.mTab,'mTab',{full:true})+(E.mTab==='p'?toeicStimulus(page):`<div class="col gap-3">${qs}${checkBtn}</div>`);
  return head+groupTitle+`<div class="tp-split tp-split--read"><div class="tp-pane" data-scroll="stim-${page.gid}">${toeicStimulus(page)}</div><div class="tp-pane col gap-3" data-scroll="qs-${page.gid}">${qs}${checkBtn}</div></div>`;
}
function answerSheet(){
  const E=S.exam;
  const secs=[...new Set(E.qids.map(id=>Q[id].section))];
  return `<div class="answer-sheet" aria-label="${T('Phiếu trả lời','Answer sheet')}">${secs.map(sec=>`<div class="as-sec">${SECTION[sec].toUpperCase()}${E.sections&&E.sec!==sec?` <span class="text-xs text-muted">· ${E.sec==='L'?T('mở sau phần Listening','opens after Listening'):T('đã kết thúc','closed')}</span>`:''}</div>
    ${[...new Set(E.qids.filter(id=>Q[id].section===sec).map(id=>Q[id].part))].map(p=>`<div class="as-part">${p.replace('P','Part ')}</div>${E.qids.filter(id=>Q[id].part===p).map(id=>{ const q=Q[id], pi=E.pages.findIndex(pg=>pg.qids.includes(id)), allowed=pageAllowed(E,pi), a=E.answers[id], ch=E.mode==='practice'&&E.checked[id];
      return `<div class="as-row ${E.focus===id?'is-current':''} ${E.flags[id]?'is-flag':''}"><button type="button" class="as-num" data-action="qJump" data-q="${id}" ${allowed?'':'disabled'} aria-label="${T('Đi tới câu','Go to question')} ${q.n}">${q.n}</button>${q.options.map(([k])=>`<button type="button" class="bubble ${a===k?'is-on':''} ${ch?(k===q.answer?'is-correct':a===k?'is-wrong':''):''}" data-action="sheetMark" data-q="${id}" data-k="${k}" ${allowed&&!ch?'':'disabled'} aria-label="${q.n} ${k}" aria-pressed="${a===k}">${k}</button>`).join('')}</div>`; }).join('')}`).join('')}`).join('')}</div>`;
}
function toeicHeader(){
  const E=S.exam, ex=EXAMS[E.examId], m=isM();
  if (m) return `<header class="exam__bar">${btn('',{v:'ghost',ic:'xmark',action:'saveExit',aria:T('Lưu và thoát','Save & exit')})}<div class="grow col" style="gap:0;min-width:0"><h1 class="text-sm font-semibold truncate">${tx(ex.title)}</h1><span class="save-status" id="save-badge">${saveBadge()}</span></div>${timerHtml()}<div class="dropdown" data-dropdown="1">${btn('',{v:'ghost',size:'sm',ic:'ellipsis',action:'pPop',data:{v:'more'},aria:T('Công cụ','Tools')})}${S.pPop==='more'?`<div class="dropdown__menu player-pop">${E.mode==='practice'?`<button type="button" class="menu-item" data-action="pPause">${icon('pause-fill')}${T('Tạm dừng','Pause')}</button>`:''}<button type="button" class="menu-item" data-action="pPop" data-v="settings">${icon('gear')}${T('Cỡ chữ & màu nền','Text size & colour')}</button>${canHighlight(E)?`<button type="button" class="menu-item" data-action="notesToggle">${icon('square-list-ul')}${T('Ghi chú','Notes')} (${E.notes.length})</button>`:''}<button type="button" class="menu-item" data-action="openSubmit">${icon('paper-plane')}${T('Nộp bài','Submit')}</button></div>`:S.pPop==='settings'?settingsPopover():''}</div></header>`;
  const steps = E.sections ? `<ol class="stepper">${E.sections.map((s,i)=>`<li class="${i===E.secIdx?'is-current':i<E.secIdx?'is-done':''}">${icon(s.key==='L'?'headphones':'book-open',14)}${SECTION[s.key]}<span class="text-muted">${s.key==='L'?'1–100':'101–200'}</span></li>`).join('')}</ol>` : `<span class="text-sm text-muted">${E.parts.map(p=>p.replace('P','Part ')).join(' · ')}</span>`;
  return `<header class="exam__bar tp-bar">${btn('',{v:'ghost',size:'sm',ic:'xmark',action:'saveExit',aria:T('Lưu và thoát','Save & exit')})}<div class="col" style="gap:0;min-width:0"><h1 class="text-sm font-semibold truncate">${tx(ex.title)}</h1><span class="text-xs text-muted">${E.mode==='mock'?T('Thi thử · quy tắc phòng thi','Mock · exam rules'):T('Luyện tập','Practice')}</span></div>
    <div class="grow row row--center">${steps}</div><span class="save-status" id="save-badge" aria-live="polite">${saveBadge()}</span>${timerHtml()}${toolButtons()}${btn(T('Nộp bài','Submit'),{size:'sm',ic:'paper-plane',action:'openSubmit'})}</header>`;
}
function rToeicPlayer(){
  const E=S.exam, page=curPage(), m=isM(), last=E.page===E.pages.length-1;
  const seg=curSeg(E), behind = E.track&&seg&&seg.page!==E.page;
  const follow = behind?`<div class="follow-bar">${icon('headphones',14)}<span>${T('Audio đang phát ở','Audio is playing at')} ${T('câu','Q')} ${nums(E.pages[seg.page].qids)}</span>${btn(T('Đi tới','Go'),{size:'sm',v:'secondary',action:'followAudio'})}</div>`:'';
  const offline = viewState('exam')==='error'?alertBox('warning',T('Mất kết nối','You’re offline'),T('Đáp án được lưu tạm trên thiết bị và đồng bộ khi có mạng. Đồng hồ thi vẫn tính theo máy chủ.','Answers are saved on this device and sync when you’re back online. The exam clock follows the server.')):'';
  const prevI=[...Array(E.page).keys()].reverse().find(i=>pageAllowed(E,i)), nextI=E.pages.findIndex((p,i)=>i>E.page&&pageAllowed(E,i));
  const nav = `<footer class="exam__foot">${btn(m?'':T('Trước','Previous'),{v:'tertiary',ic:'chevron-left',action:'pGo',data:{i:prevI??''},disabled:prevI==null,aria:T('Trang trước','Previous')})}
    ${m?`<button type="button" class="button button--ghost grow tnum" data-action="openSheet">${icon('layout-cells-large')}${T('Phiếu','Sheet')} ${answeredCount()}/${E.qids.length}</button>`:`<span class="text-sm text-muted tnum">${T('Câu','Questions')} ${nums(page.qids)} · ${T('trang','page')} ${E.page+1}/${E.pages.length}</span><span class="row text-xs text-muted" style="gap:6px;margin-left:12px">${kbd('A')}–${kbd('D')} ${T('chọn','choose')} ${kbd('←')}${kbd('→')} ${T('trang','page')} ${kbd('F')} ${T('đánh dấu','flag')}${E.mode==='practice'&&page.audio?` ${kbd('Space')} ${T('phát/dừng','play/pause')}`:''}</span><div class="grow"></div>`}
    ${nextI>=0&&!last?btn(m?'':T('Tiếp','Next'),{iconR:'chevron-right',action:'pGo',data:{i:nextI},aria:T('Trang tiếp','Next')})
      : E.sections&&E.secIdx<E.sections.length-1 ? `<span class="text-xs text-muted" style="text-align:right">${T('Reading mở khi audio Listening kết thúc','Reading opens when the Listening audio ends')}</span>`
      : btn(T('Nộp bài','Submit'),{action:'openSubmit',ic:'paper-plane'})}</footer>`;
  if (m) return playerRoot(`<div class="m-shell m-exam">${toeicHeader()}${progressBar(answeredCount(),E.qids.length,{size:'sm',aria:T('Tiến độ','Progress')})}${follow}<div class="m-content" data-scroll="pg-${E.page}">${offline}${toeicPageBody(page)}</div>${nav}${E.notesOpen?notesPanel():''}</div>`);
  return playerRoot(`<div class="exam">${toeicHeader()}${offline?`<div style="padding:12px 16px 0">${offline}</div>`:''}<div class="exam__body"><div class="exam__work">${follow}<div class="exam__single tp-body" data-scroll="pg-${E.page}"><div class="tp-inner">${toeicPageBody(page)}</div></div>${nav}</div>
    <aside class="exam__nav" aria-label="${T('Phiếu trả lời','Answer sheet')}">${progressBar(answeredCount(),E.qids.length,{label:T('Phiếu trả lời','Answer sheet'),right:`${answeredCount()}/${E.qids.length}`,size:'sm'})}${E.notesOpen?notesPanel():answerSheet()}</aside></div></div>`);
}
