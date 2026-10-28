/* IELTS on computer player — mirrors the computer-delivered layout:
 * header (candidate · time left · settings/help/hide), part instruction strip, resizable split
 * (passage | questions) for Reading, question sets with official-style instructions, bottom
 * question navigator by part with Review flag and arrows. Highlight + notes in both modes (as in the real test). */
const qMinutesLeft = E => E.remaining!=null ? Math.ceil(E.remaining/60) : null;
function iq(qid,inner,{review,ans}={}){
  const E=S.exam, q=Q[qid], st=qState(E,qid,review);
  return `<div class="iq ${E&&E.focus===qid&&!review?'is-focus':''}" data-qwrap="${qid}" id="iq-${qid}">${inner}${st!=='open'?feedbackBlock(qid,{review,ans}):''}</div>`;
}
const iqHead = (q,review) => `<div class="iq__head"><span class="qnum">${numLabel(q)}</span><span class="iq__stem">${esc(q.stem||'')}</span>${review?'':flagBtn(qidOfQ(q))}</div>`;
const qidOfQ = q => Object.keys(Q).find(k=>Q[k]===q);
function fillGaps(html,opts){ return html.replace(/\{\{(\w+)\}\}/g,(m,id)=>gapInput(id,{review:opts.review,ans:opts.answers&&opts.answers[id]})); }
function setBlock(setId,qids,opts={}){
  const E=S.exam, s=SETS[setId], review=opts.review, A=opts.answers||{};
  const a = id => review?A[id]:undefined;
  const limit = s.limit?`<p class="qset__limit">Write <b>${s.limit}</b> for each answer.</p>`:'';
  let body='';
  if (s.type==='tfng'||s.type==='mc') body = qids.map(id=>iq(id,`${iqHead(Q[id],review)}${choiceList(id,{review,ans:a(id),compact:true})}`,{review,ans:a(id)})).join('');
  if (s.type==='summary'||s.type==='form'||s.type==='notes'){
    const fb = qids.filter(id=>qState(E,id,review)!=='open').map(id=>`<div class="iq" data-qwrap="${id}"><span class="qnum">${Q[id].n}</span>${feedbackBlock(id,{review,ans:a(id)})}</div>`).join('');
    body = `<div class="fill-box">${s.title?`<div class="fill-box__title">${s.title}</div>`:''}<div class="fill-box__body">${fillGaps(s.html,{review,answers:A})}</div></div>${fb}`;
  }
  if (s.type==='headings'){
    const used = qids.map(id=>review?A[id]:E.answers[id]).filter(Boolean);
    body = `<div class="list-box"><div class="list-box__title">List of Headings</div>${s.list.map(([k,t])=>`<button type="button" class="heading-chip ${E&&E.pick===k?'is-picked':''} ${used.includes(k)?'is-used':''}" draggable="${!review}" data-heading="${k}" data-action="pickHeading" data-v="${k}" ${review?'disabled':''}><b>${k}</b> ${esc(t)}</button>`).join('')}</div>
      <p class="text-xs text-muted">${T('Kéo tiêu đề vào ô, hoặc chọn tiêu đề rồi bấm vào ô. Bấm ô đã điền để gỡ.','Drag a heading into a box, or pick a heading then click a box. Click a filled box to clear it.')}</p>
      <div class="iq iq--example"><span class="qnum qnum--ghost">Ex</span><span class="iq__stem">Paragraph ${s.example[0]}</span><span class="slot is-filled is-example"><b>${s.example[1]}</b> ${esc(s.list.find(l=>l[0]===s.example[1])[1])}</span></div>
      ${qids.map(id=>{ const q=Q[id], v=review?A[id]:E.answers[id], st=qState(E,id,review), ok=st!=='open'&&isCorrect(q,v), h=v&&s.list.find(l=>l[0]===v);
        return iq(id,`<div class="iq__head"><span class="qnum">${q.n}</span><span class="iq__stem">${q.stem}</span><button type="button" class="slot ${v?'is-filled':''} ${st!=='open'?(ok?'is-correct':'is-wrong'):''}" data-slot="${id}" data-action="slotClick" data-q="${id}" ${st!=='open'?'disabled':''} aria-label="${T('Ô tiêu đề cho','Heading box for')} ${q.stem}">${h?`<b>${h[0]}</b> ${esc(h[1])}`:`<span class="text-muted">${T('Thả tiêu đề vào đây','Drop heading here')}</span>`}</button>${review?'':flagBtn(id)}</div>`,{review,ans:a(id)}); }).join('')}`;
  }
  if (s.type==='multi') body = qids.map(id=>iq(id,`${iqHead(Q[id],review)}${multiList(id,{review,ans:a(id)})}`,{review,ans:a(id)})).join('');
  if (s.type==='features') body = `<div class="list-box"><div class="list-box__title">List of Researchers</div>${s.list.map(([k,t])=>`<div class="list-box__row"><b>${k}</b> ${esc(t)}</div>`).join('')}</div>`+qids.map(id=>iq(id,`<div class="iq__head"><span class="qnum">${Q[id].n}</span><span class="iq__stem">${esc(Q[id].stem)}</span>${selectInput(id,s.list,{review,ans:a(id)})}${review?'':flagBtn(id)}</div>`,{review,ans:a(id)})).join('');
  if (s.type==='map') body = `<div class="map-wrap">${MAPS[s.map]}</div><table class="grid-table"><thead><tr><th></th>${s.letters.map(l=>`<th>${l}</th>`).join('')}</tr></thead><tbody>${qids.map(id=>{ const q=Q[id], v=review?A[id]:E.answers[id], st=qState(E,id,review);
      return `<tr class="${E&&E.focus===id&&!review?'is-focus':''}" data-qwrap="${id}" id="iq-${id}"><th><span class="qnum">${q.n}</span> ${q.stem}</th>${s.letters.map(l=>`<td class="${st!=='open'?(l===q.answer?'is-correct':v===l?'is-wrong':''):''}"><input type="radio" name="ans-${id}" value="${l}" data-input="answer" data-q="${id}" ${v===l?'checked':''} ${st!=='open'?'disabled':''} aria-label="${q.n} ${q.stem} ${l}"></td>`).join('')}</tr>`; }).join('')}</tbody></table>`
    + qids.filter(id=>qState(E,id,review)!=='open').map(id=>`<div class="iq"><span class="qnum">${Q[id].n}</span>${feedbackBlock(id,{review,ans:a(id)})}</div>`).join('');
  return `<section class="qset"><h3 class="qset__range">Questions ${s.range}</h3><p class="qset__instr">${s.instr}</p>${s.note?`<p class="qset__note">${s.note}</p>`:''}${limit}${body}</section>`;
}
function setsFor(qids){ const out=[]; qids.forEach(id=>{ const s=Q[id].set, last=out[out.length-1]; if(last&&last[0]===s) last[1].push(id); else out.push([s,[id]]); }); return out; }
function ieltsQuestions(page,opts={}){ return setsFor(page.qids).map(([s,ids])=>setBlock(s,ids,opts)).join(''); }
function ieltsPassage(page,opts={}){ const g=G[page.gid]; return `<article class="passage passage--ielts"><p class="passage__intro">${g.intro}</p><h2 class="passage__title">${g.title}</h2>${zoneHtml(page.gid,g.html,opts)}</article>`; }
function ieltsNav(){
  const E=S.exam, fq=E.focus;
  return `<nav class="ip-nav" aria-label="${T('Điều hướng câu hỏi','Question navigation')}">
    <label class="ip-nav__review" title="${T('Đánh dấu câu hiện tại để xem lại','Mark the current question for review')}"><input type="checkbox" data-input="reviewFlag" ${E.flags[fq]?'checked':''}><span>Review</span></label>
    <div class="ip-nav__parts">${E.pages.map((p,i)=>{ const cur=i===E.page, allowed=pageAllowed(E,i), done=p.qids.filter(id=>!isBlank(E.answers[id])).reduce((a,id)=>a+pointsOf(Q[id]),0), tot=p.qids.reduce((a,id)=>a+pointsOf(Q[id]),0);
      return `<div class="ip-part ${cur?'is-current':''}"><button type="button" class="ip-part__btn" data-action="pGo" data-i="${i}" ${allowed?'':'disabled'}>${tx(ALL_PARTS[p.part].name)}${cur?'':` <span class="text-muted">${done} of ${tot}</span>`}</button>${cur?`<div class="ip-part__nums">${p.qids.flatMap(id=>(Array.isArray(Q[id].n)?Q[id].n:[Q[id].n]).map(n=>`<button type="button" class="ip-num ${!isBlank(E.answers[id])?'is-answered':''} ${fq===id?'is-current':''} ${E.flags[id]?'is-flag':''} ${E.mode==='practice'&&E.checked[id]?(isCorrect(Q[id],E.answers[id])?'is-correct':'is-wrong'):''}" data-action="qJump" data-q="${id}" aria-label="${T('Câu','Question')} ${n}">${n}</button>`)).join('')}</div>`:''}</div>`; }).join('')}</div>
    <div class="ip-nav__arrows">${btn('',{v:'tertiary',size:'sm',ic:'arrow-left',action:'qStep',data:{d:-1},aria:T('Câu trước','Previous question')})}${btn('',{size:'sm',ic:'arrow-right',action:'qStep',data:{d:1},aria:T('Câu tiếp','Next question')})}${btn('',{v:'secondary',size:'sm',ic:'check',action:'openSubmit',aria:T('Nộp bài','Submit')})}</div></nav>`;
}
function ieltsHeader(){
  const E=S.exam, ex=EXAMS[E.examId], u=user(), m=isM();
  return `<header class="ip-bar">${btn('',{v:'ghost',size:'sm',ic:'xmark',action:'saveExit',aria:T('Lưu và thoát','Save & exit')})}
    <div class="col" style="gap:0;min-width:0">${m?`<span class="text-sm font-semibold truncate">${ex.skill==='listening'?'Listening':'Reading'}</span>`:`<span class="text-xs text-muted">${T('Thí sinh','Test taker')}</span><span class="text-sm font-semibold truncate">${esc(u.name)} · ${u.guest?'—':'0123 4567'}</span>`}</div>
    <div class="grow row row--center">${ieltsTime(E)}</div>
    ${m?'':`<span class="save-status" id="save-badge">${saveBadge()}</span>`}${toolButtons({compact:m})}${btn(m?'':T('Ẩn','Hide'),{v:'ghost',size:'sm',ic:'eye-slash',action:'pHide',aria:T('Ẩn màn hình','Hide screen')})}</header>`;
}
/** CD-IELTS style clock: whole minutes left; warning colour at 10 and 5 minutes; audio time while the recording plays */
function ieltsTime(E){
  const ml=qMinutesLeft(E);
  const txt = E.phase==='check' ? `<span class="tnum">${fmt(E.remaining)}</span> ${T('để kiểm tra','to check')}`
    : E.track ? `${icon('headphones',14)}<span class="tnum">${fmt(trackLeft(E))}</span>`
    : ml!=null ? (E.remaining<=60?`<span class="tnum">${fmt(E.remaining)}</span>`:`<span class="tnum">${ml}</span> ${isM()?T('phút','min'):T('phút còn lại','minutes left')}`) : `${icon('stopwatch',14)}<span class="tnum">${fmt(E.elapsed)}</span>`;
  const warn = E.remaining!=null&&E.phase!=='check' ? (E.remaining<=300?'is-danger':E.remaining<=600?'is-warn':'') : (E.phase==='check'?'is-warn':'');
  return `<span class="ip-time ${warn}" id="exam-timer" role="timer" aria-live="off">${txt}</span>`;
}
function rIeltsPlayer(){
  const E=S.exam, page=curPage(), m=isM(), P=ALL_PARTS[page.part], listening=page.section==='L';
  const strip = `<div class="ip-strip"><b>${tx(P.name)}</b><span>${listening?T(`Nghe và trả lời câu hỏi ${P.range}.`,`Listen and answer questions ${P.range}.`):T(`Đọc văn bản và trả lời câu hỏi ${P.range}.`,`Read the text and answer questions ${P.range}.`)}</span>${EXAMS[E.examId].bank&&E.qids.length<EXAMS[E.examId].count?`<span class="text-xs text-muted">· ${T('bản demo','demo')}: ${page.qids.length} ${T('câu mẫu','sample items')}</span>`:''}</div>`;
  const audio = listening ? `<div class="ip-audio">${E.mode==='mock'?mockAudio():practiceAudio(page)}</div>` : '';
  const checkBtn = E.mode==='practice'&&E.tools.instant&&page.qids.some(id=>!E.checked[id]) ? `<div class="row">${btn(T('Kiểm tra trang này','Check this part'),{action:'checkPage',ic:'check',disabled:!page.qids.some(id=>!isBlank(E.answers[id])&&!E.checked[id])})}</div>` : '';
  const qpane = `<div class="ip-q" data-scroll="iq-${E.page}">${ieltsQuestions(page)}${checkBtn}</div>`;
  let body;
  if (listening) body = `<div class="ip-body ip-body--single">${qpane}</div>`;
  else if (m) body = `<div style="padding:8px 12px 0">${tabs(T('Hiển thị','View'),[['p',T('Bài đọc','Passage'),'file-text'],['q',`${T('Câu hỏi','Questions')} ${P.range}`,'list-check']],E.mTab,'mTab',{full:true})}</div><div class="ip-body ip-body--single">${E.mTab==='p'?`<div class="ip-p" data-scroll="ip-${E.page}">${ieltsPassage(page)}</div>`:qpane}</div>`;
  else body = `<div class="ip-body ip-split" style="grid-template-columns:${E.split}% 10px minmax(0,1fr)"><div class="ip-p" data-scroll="ip-${E.page}">${ieltsPassage(page)}</div><div class="ip-divider" role="separator" aria-orientation="vertical" aria-label="${T('Kéo để đổi kích thước','Drag to resize')}" tabindex="0" data-divider="1"><span></span></div>${qpane}</div>`;
  const offline = viewState('exam')==='error'?`<div style="padding:8px 16px 0">${alertBox('warning',T('Mất kết nối','You’re offline'),T('Đáp án được lưu tạm trên thiết bị và đồng bộ khi có mạng.','Answers are saved on this device and sync when you’re back online.'))}</div>`:'';
  return playerRoot(`<div class="ielts">${ieltsHeader()}${strip}${offline}${audio}${body}${E.notesOpen?notesPanel():''}${ieltsNav()}</div>`);
}
