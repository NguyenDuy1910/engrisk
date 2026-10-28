/* Exam engine (practice + mock), results, review, IELTS Writing & Speaking */
function newAttempt(id){
  const ex=EXAMS[id];
  return {examId:id,mode:ex.mode,qids:ex.qids.slice(),idx:0,answers:{},checked:{},flags:{},remaining:ex.mode==='mock'?ex.seconds:null,elapsed:0,save:'saved',audio:{},mTab:'q'};
}
const qidOf = q => Object.keys(Q).find(k=>Q[k]===q);
const audioKey = q => q.group||(q.section==='L'?qidOf(q):null);
const isCorrect = (q,a) => { if(a==null||a==='') return false; if(q.type==='fill_blank') return q.answer.some(x=>x.toLowerCase()===String(a).trim().toLowerCase()); return a===q.answer; };
const answeredCount = () => S.exam.qids.filter(id=>S.exam.answers[id]!=null&&S.exam.answers[id]!=='').length;

function audioCard(q){
  const E=S.exam, key=audioKey(q), a=E.audio[key]||{s:'idle',p:0}, mock=E.mode==='mock', m=isM(), qid=qidOf(q);
  const done=a.s==='done', playing=a.s==='playing', canPlay=!playing && (!done || !mock), n=m?26:44;
  const bars = Array.from({length:n},(_,i)=>`<i class="${i/n<a.p?'on':''}" style="height:${6+((i*7+3)%19)}px"></i>`).join('');
  const label = playing?T('Đang phát…','Playing…'):done?(mock?T('Đã phát · không nghe lại','Played · no replay in exam mode'):T('Đã nghe xong','Finished')):T('Nhấn để phát','Tap to play');
  return `<div class="audio" role="group" aria-label="${T('Trình phát âm thanh','Audio player')}">
      <button type="button" class="audio__play ${playing?'is-playing':''}" data-action="audioPlay" data-k="${key}" data-fk="audio:${key}" ${canPlay?'':'disabled'} aria-label="${done&&!mock?T('Nghe lại','Replay'):T('Phát','Play')}">${icon(playing?'pause-fill':done&&!mock?'arrow-rotate-left':'play-fill',18)}</button>
      <div class="grow col gap-1" style="min-width:0"><div class="row row--between"><span class="text-sm font-medium truncate">${q.group?tx(G[q.group].title):q.part+' · Question–response'}</span>${mock?chip(T('Phát 1 lần','Plays once'),'warning','headphones',{size:'sm'}):chip(T('Nghe lại được','Replay allowed'),'default','arrow-rotate-left',{size:'sm'})}</div>
      <div class="wave ${playing?'wave--live':''}" aria-hidden="true">${bars}</div><span class="row row--between text-xs text-muted" aria-live="polite"><span>${label}</span>${sim(T('Âm thanh giả lập','Simulated audio'))}</span></div>
    </div>
    ${!mock&&E.checked[qid]?`<details class="disclosure"><summary>Transcript${icon('chevron-down',14)}</summary><div class="disclosure__body" style="white-space:pre-line">${esc(q.group?G[q.group].transcript:q.transcript)}</div></details>`:''}`;
}
function questionBlock(qid,{review=false,result=null}={}){
  const q=Q[qid], E=S.exam, mock=!review&&E.mode==='mock';
  const ans = review ? result.items.find(i=>i.qid===qid).ans : E.answers[qid];
  const checked = review || (!mock && E.checked[qid]);
  const justChecked = !review && S.justChecked===qid;
  const hide = mock && q.hideInMock;
  let opts;
  if (q.type==='fill_blank'){
    const ok = checked && isCorrect(q,ans);
    opts = `<div class="textfield"><label class="label" for="blank-${qid}">${T('Câu trả lời','Your answer')} <span class="text-muted" style="font-weight:400">· ${q.limit}</span></label><input id="blank-${qid}" class="input" style="max-width:360px" data-input="blank" data-q="${qid}" value="${esc(ans||'')}" ${checked?'disabled':''} autocomplete="off" spellcheck="false" placeholder="${T('Nhập từ còn thiếu','Type the missing words')}" ${checked&&!ok?'aria-invalid="true"':''}>
      ${checked?(ok?`<span>${chip(T('Chính xác','Correct'),'success','check')}</span>`:`<span class="field-error">${T('Đáp án đúng','Correct answer')}: <b>${esc(q.answer[0])}</b></span>`):''}</div>`;
  } else {
    opts = `<fieldset class="options" ${checked?'disabled':''}><legend class="sr-only">${T('Chọn đáp án','Choose an answer')}</legend>${q.options.map(([k,t])=>{
      let cls = ans===k?'is-selected':''; let tag='';
      if (checked){ if(k===q.answer){cls='is-correct';tag=chip(ans===k?T('Bạn chọn · Đúng','Your pick · Correct'):T('Đáp án đúng','Correct answer'),'success','check',{size:'sm'});} else if(ans===k){cls='is-wrong'+(justChecked?' is-reveal':'');tag=chip(T('Bạn chọn','Your pick'),'danger','xmark',{size:'sm'});} else cls=''; }
      if (!checked && S.just && S.just.q===qid && S.just.k===k) cls+=' is-just';
      return `<label class="option ${cls}"><input type="radio" name="ans-${qid}" value="${k}" id="opt-${qid}-${k}" data-input="answer" data-q="${qid}" ${ans===k?'checked':''}><span class="option__key">${k}</span><span class="option__text">${hide?`<span class="sr-only">${T('Đáp án','Option')} ${k}</span>`:esc(t)}</span>${tag?`<span class="option__tag">${tag}</span>`:''}</label>`;}).join('')}</fieldset>`;
  }
  const good = isCorrect(q,ans);
  const feedback = checked ? `<div class="block-verified ${justChecked?'is-reveal':''}">
      <div class="row row--between"><span class="block-verified__head">${icon('shield-check',14)}${T('Đáp án đã kiểm duyệt','Verified answer')}</span>${chip(good?T('Chính xác','Correct'):ans==null||ans===''?T('Bỏ trống','Blank'):T('Chưa đúng','Not quite'),good?'success':'danger',good?'check':'xmark',{size:'sm',v:'primary'})}</div>
      <p class="text-sm" style="line-height:22px">${esc(tx(q.exp))}</p>
      ${q.ai?`<span>${chip(T('Câu hỏi do AI tạo · bạn đã duyệt','AI-generated · approved by you'),'accent','sparkles',{size:'sm'})}</span>`:''}
      ${!good?`<div>${btn(T('Hỏi AI Tutor về câu này','Ask the AI Tutor'),{v:'secondary',size:'sm',ic:'sparkles',action:'askTutor',data:{q:qid,a:ans||''}})}</div>`:''}
    </div>`:'';
  const pos = (review?result.items.findIndex(i=>i.qid===qid):E.qids.indexOf(qid))+1, total = review?result.items.length:E.qids.length;
  return `<div class="qwrap">
    <div class="row row--between"><div class="row gap-2">${chip(`<span class="tnum">${T('Câu','Q')} ${pos}/${total}</span>`,'default')}<span class="text-sm text-muted">${SECTION[q.section]} · ${q.part}</span></div>${!review?`<button type="button" class="button button--sm ${E.flags[qid]?'button--secondary':'button--ghost'}" data-action="flag" data-fk="flag" aria-pressed="${!!E.flags[qid]}" style="${E.flags[qid]?'--button-fg:var(--warning-soft-foreground);--button-bg:var(--warning-soft)':''}">${icon('bookmark')}<span>${E.flags[qid]?T('Đã đánh dấu','Flagged'):T('Đánh dấu','Flag')}</span></button>`:''}</div>
    ${!review&&q.section==='L'&&(!q.group||!isM())?audioCard(q):''}
    <div class="qstem">${hide?T('Nghe câu hỏi và chọn câu trả lời phù hợp nhất.','Listen and choose the best response.'):esc(q.stem)}</div>
    ${opts}
    ${!review&&!mock&&!checked?`<div>${btn(T('Kiểm tra','Check'),{action:'check',disabled:ans==null||ans==='',ic:'check'})}</div>`:''}
    ${feedback}
  </div>`;
}
function qnav(){
  const E=S.exam, secs=[...new Set(E.qids.map(id=>Q[id].section))];
  return secs.map(sec=>`<div class="col gap-2"><span class="text-xs font-medium text-muted">${SECTION[sec]}</span><div class="qgrid">${E.qids.map((id,i)=>Q[id].section!==sec?'':`<button type="button" class="qbtn ${E.answers[id]!=null&&E.answers[id]!==''?'is-answered':''} ${i===E.idx?'is-current':''} ${E.flags[id]?'is-flagged':''} ${E.mode==='practice'&&E.checked[id]?(isCorrect(Q[id],E.answers[id])?'is-correct':'is-wrong'):''}" data-action="qGo" data-i="${i}" data-fk="qGo:${i}" aria-label="${T('Câu','Question')} ${i+1}" ${i===E.idx?'aria-current="step"':''}>${i+1}</button>`).join('')}</div></div>`).join('')
  + `<div class="legend"><span><i style="background:var(--accent-soft)"></i>${T('Đã trả lời','Answered')}</span><span><i></i>${T('Chưa trả lời','Unanswered')}</span><span><i style="background:var(--warning);border-radius:50%"></i>${T('Đánh dấu','Flagged')}</span></div>`;
}
function saveBadge(){
  const s = viewState('exam')==='error' ? 'offline' : S.exam.save;
  return s==='saving'?`<span class="spinner spinner--sm">${SPIN}</span>${T('Đang lưu…','Saving…')}`
    : s==='offline'?`<span class="text-warning row gap-1">${icon('cloud-slash',12)}${T('Lưu trên thiết bị','Saved on device')}</span>`
    : `${icon('circle-check',12,'text-success')}${T('Đã lưu','Saved')}`;
}
function timerHtml(){
  const E=S.exam; if (E.mode==='mock'){ const r=E.remaining; return `<span id="exam-timer" class="timer ${r<=60?'is-danger':r<=300?'is-warn':''}" role="timer" aria-label="${T('Thời gian còn lại','Time left')}">${icon('clock',14)}<span>${fmt(r)}</span></span>`; }
  return `<span id="exam-timer" class="timer" role="timer" aria-label="${T('Thời gian đã luyện','Time spent')}">${icon('stopwatch',14)}<span>${fmt(E.elapsed)}</span></span>`;
}
function rExam(){
  if (!S.exam) S.exam=newAttempt('toeic-mini-mock');
  const E=S.exam, ex=EXAMS[E.examId], qid=E.qids[E.idx], q=Q[qid], grp=q.group?G[q.group]:null, m=isM();
  const last = E.idx===E.qids.length-1, offline = viewState('exam')==='error';
  const offlineBanner = offline?`<div style="padding:${m?'8px 12px 0':'12px 16px 0'}">${alertBox('warning',T('Mất kết nối','You’re offline'),T('Đáp án được lưu tạm trên thiết bị và sẽ đồng bộ khi có mạng. Đồng hồ thi vẫn tính theo máy chủ.','Answers are saved on this device and will sync when you’re back online. The exam timer follows the server.'))}</div>`:'';
  if (m){
    const showPassage = grp&&grp.type==='passage';
    return `<div class="m-shell m-exam">
      <header class="exam__bar">${btn('',{v:'ghost',ic:'xmark',action:'saveExit',aria:T('Lưu và thoát','Save & exit')})}
        <div class="grow col" style="gap:0;min-width:0"><h1 class="text-sm font-semibold truncate">${tx(ex.title)}</h1><span class="save-status" id="save-badge">${saveBadge()}</span></div>
        ${timerHtml()}${btn('',{v:'tertiary',size:'sm',ic:'layout-cells-large',action:'openSheet',aria:T('Danh sách câu hỏi','Question list')})}</header>
      <div style="padding:0">${progressBar(answeredCount(),E.qids.length,{size:'sm',aria:T('Tiến độ bài làm','Progress')})}</div>
      ${offlineBanner}
      ${q.section==='L'&&q.group?`<div style="padding:12px 16px 0">${audioCard(q)}</div>`:''}
      ${showPassage?`<div style="padding:12px 16px 0">${tabs(T('Hiển thị','View'),[['p',T('Đoạn văn','Passage'),'file-text'],['q',`${T('Câu','Q')} ${E.idx+1}`,'list-check']],E.mTab,'mTab',{full:true})}</div>`:''}
      <div class="m-content" data-scroll="exam-${E.mTab}" style="padding-top:16px">
        ${showPassage&&E.mTab==='p'?`<div class="passage"><div class="text-base font-semibold" style="margin-bottom:8px">${tx(grp.title)}</div>${grp.html}</div>`:questionBlock(qid)}
      </div>
      <div class="m-qbar">${btn(T('Trước','Prev'),{v:'tertiary',ic:'chevron-left',action:'qPrev',disabled:E.idx===0})}
        <button type="button" class="button button--ghost tnum" data-action="openSheet" data-fk="sheet2">${E.idx+1} / ${E.qids.length}</button>
        ${last?btn(T('Nộp bài','Submit'),{action:'openSubmit'}):btn(T('Tiếp','Next'),{iconR:'chevron-right',action:'qNext'})}</div>
    </div>`;
  }
  const split = grp&&grp.type==='passage';
  return `<div class="exam">
    <header class="exam__bar">${btn('',{v:'ghost',size:'sm',ic:'xmark',action:'saveExit',aria:T('Lưu và thoát','Save & exit')})}<div class="separator separator--vertical" style="height:24px;align-self:center"></div>
      ${skillTile(Q[qid].section==='L'?'listening':'reading','sm')}<div class="col" style="gap:0;min-width:0"><h1 class="text-sm font-semibold truncate">${tx(ex.title)}</h1><span class="text-xs text-muted">${ex.mode==='mock'?T('Chế độ thi','Exam mode'):T('Luyện tập','Practice')} · ${SECTION[q.section]}</span></div>
      <div class="grow"></div><span class="save-status" id="save-badge" aria-live="polite">${saveBadge()}</span>${timerHtml()}
      ${btn(T('Lưu & thoát','Save & exit'),{v:'tertiary',size:'sm',action:'saveExit'})}${btn(T('Nộp bài','Submit'),{size:'sm',action:'openSubmit',ic:'paper-plane'})}</header>
    ${offlineBanner}
    <div class="exam__body">
      <div class="exam__work">
        ${split?`<div class="exam__split"><div class="exam__pane exam__pane--passage" data-scroll="passage-${q.group}" tabindex="0" aria-label="${T('Đoạn văn','Passage')}"><div class="passage"><div class="row gap-2" style="margin-bottom:14px">${tile('file-text','default','sm')}<span class="text-base font-semibold">${tx(grp.title)}</span></div>${grp.html}</div></div><div class="exam__pane" data-scroll="q"><div class="stagger">${questionBlock(qid)}</div></div></div>`
          :`<div class="exam__single" data-scroll="q">${questionBlock(qid)}</div>`}
        <footer class="exam__foot">${btn(T('Câu trước','Previous'),{v:'tertiary',ic:'chevron-left',action:'qPrev',disabled:E.idx===0})}
          <span class="row text-xs text-muted" style="gap:6px;margin-left:8px">${kbd('A')}–${kbd('D')} ${T('chọn','choose')} ${kbd('←')}${kbd('→')} ${T('chuyển câu','move')} ${kbd('F')} ${T('đánh dấu','flag')}</span>
          <div class="grow"></div>${last?btn(T('Nộp bài','Submit'),{action:'openSubmit',ic:'paper-plane'}):btn(T('Câu tiếp','Next'),{iconR:'chevron-right',action:'qNext'})}</footer>
      </div>
      <aside class="exam__nav" aria-label="${T('Điều hướng câu hỏi','Question navigation')}">
        ${progressBar(answeredCount(),E.qids.length,{label:T('Đã trả lời','Answered'),right:`${answeredCount()}/${E.qids.length}`,size:'sm'})}
        ${qnav()}
        ${ex.mode==='mock'?alertBox('accent',T('Chế độ thi','Exam mode'),T('Đáp án và giải thích hiển thị sau khi nộp bài.','Answers and explanations appear after you submit.'),'',{flat:true}):alertBox('success',T('Luyện tập','Practice'),T('Bấm “Kiểm tra” để xem đáp án và giải thích từng câu.','Press “Check” to see the answer and explanation.'),'',{flat:true})}</aside>
    </div>
  </div>`;
}

/* ---------- Results & review ---------- */
function buildResult(examId,qids,answers,flags,mode,reason){
  const ex=EXAMS[examId];
  const items = qids.map((id,i)=>{const a=answers[id]; return {qid:id,pos:i+1,ans:a??null,ok:isCorrect(Q[id],a),blank:a==null||a==='',flag:!!(flags&&flags[id])};});
  const sections={}; items.forEach(it=>{const s=Q[it.qid].section; sections[s]=sections[s]||{raw:0,n:0}; sections[s].n++; if(it.ok) sections[s].raw++;});
  let total=null; if (ex.track==='toeic'&&mode==='mock'){ total=0; Object.values(sections).forEach(s=>{s.scaled=5+Math.round(s.raw/s.n*98)*5; total+=s.scaled;}); }
  const skm={}; items.forEach(it=>{const c=Q[it.qid].skill; skm[c]=skm[c]||{c:0,n:0}; skm[c].n++; if(it.ok) skm[c].c++;});
  const skills=Object.entries(skm).map(([code,v])=>({code,...v})).sort((a,b)=>a.c/a.n-b.c/b.n);
  return {examId,mode,items,sections,total,skills,reason,raw:items.filter(i=>i.ok).length,n:items.length,guest:S.persona==='guest'};
}
const rawLabel = r => `${r.raw}/${r.n}`;
function rResults(){
  if (!S.result) S.result=buildResult('toeic-mini-mock',EXAMS['toeic-mini-mock'].qids,CANNED['toeic-mini-mock'],{},'mock');
  const R=S.result, ex=EXAMS[R.examId], m=isM();
  if (viewState('results')==='loading') return `<div class="card card--lg" style="align-items:center;padding:56px;text-align:center">${mascot({mood:'think',size:110})}<span class="spinner">${SPIN}</span><div class="text-lg font-semibold">${T('Đang chấm bài…','Grading…')}</div><p class="text-muted">${T('Chấm tự động theo đáp án đã kiểm duyệt.','Graded against verified answer keys.')}</p></div>`;
  const weakest=R.skills[0], recId=SKILLS[weakest.code].practice, p=Math.round(R.raw/R.n*100);
  const mood = p>=60?'cheer':p>=40?'happy':'calm';
  const headline = p>=80?T('Xuất sắc!','Excellent!'):p>=60?T('Làm tốt lắm!','Nice work!'):p>=40?T('Đang tiến bộ!','Getting there!'):T('Khởi đầu tốt — luyện tiếp nhé','Good start — keep going');
  const summary = `<div class="card card--lg hero-result" style="padding-right:${m?'16px':'200px'}">
    <div class="row row--wrap gap-2">${chip(ex.kind==='full_mock'?T('Thi thử','Mock'):T('Luyện tập','Practice'),'accent')}${R.reason==='time_expired'?chip(T('Hết giờ · nộp tự động','Time up · auto-submitted'),'warning','clock'):chip(T('Đã nộp','Submitted'),'success','check')}<span class="text-sm text-muted">${tx(ex.title)}</span></div>
    <div class="text-2xl font-bold tracking-tight">${headline}</div>
    <div class="row gap-5">${ring(R.total??R.raw, R.total!=null?990:R.n,{size:m?92:124,stroke:m?9:11,inner:`<span class="${m?'text-lg':'text-2xl'} font-semibold tnum"><span data-count="${p}">${p}</span>%</span><span class="text-xs text-muted">${T('chính xác','accuracy')}</span>`})}
      <div class="col gap-1" style="min-width:0">${R.total!=null?`<span class="text-sm font-medium text-muted">${T('Điểm TOEIC ước tính','Estimated TOEIC score')}</span><span class="${m?'text-4xl':'text-5xl'} font-bold tnum tracking-tight" data-count="${R.total}">${R.total}</span><span class="text-sm text-muted">${T('Đúng','Correct')} ${rawLabel(R)}${m?'':' · 10–990'}</span>`
        :`<span class="text-sm font-medium text-muted">${T('Kết quả','Result')}</span><span class="text-5xl font-bold tnum tracking-tight">${rawLabel(R)}</span><span class="text-sm text-muted">${T('Bài ngắn không quy đổi thang điểm','Quick sets aren’t converted to a scale')}</span>`}</div></div>
    ${R.total!=null?alertBox('accent',T('Điểm ước tính, không phải điểm chính thức','Estimated, not an official score'),T('Quy đổi theo bảng mô phỏng (scaled_estimate). Chính xác hơn khi bạn làm đề đầy đủ.','Converted with a simulated table (scaled_estimate). More accurate with full tests.'),'',{flat:true}):''}
    ${m?'':mascot({mood,size:170})}
  </div>`;
  const sections = R.total!=null?`<div class="grid grid-2">${Object.entries(R.sections).map(([k,s])=>stat(SECTION[k],String(s.scaled),{small:'/ 495',right:skillTile(k==='L'?'listening':'reading','sm'),foot:`<span class="text-xs text-muted">${T('Đúng','Correct')} ${s.raw}/${s.n}</span>`,count:s.scaled})).join('')}</div>`:'';
  const skills = `<div class="card">${cardHead(T('Theo kỹ năng','By skill'),`<span class="text-xs text-muted">${R.skills.length}</span>`)}<div class="list list--divided">${R.skills.map(s=>`<div class="list-box-item">${meter(s.c,s.n,{label:tx(SKILLS[s.code].name),right:`${s.c}/${s.n}`,color:s.c/s.n<.5?'danger':s.c/s.n<1?'warning':'success',size:'sm'})}</div>`).join('')}</div></div>`;
  const f=S.resultFilter, list=R.items.filter(i=>f==='all'||(f==='wrong'&&!i.ok&&!i.blank)||(f==='blank'&&i.blank)||(f==='flag'&&i.flag));
  const answers = `${sectionTitle(T('Đáp án','Answers'),R.items.length)}<div class="card">${tabs(T('Lọc','Filter'),[['all',T('Tất cả','All')],['wrong',`${T('Sai','Wrong')} · ${R.items.filter(i=>!i.ok&&!i.blank).length}`],['blank',`${T('Bỏ trống','Blank')} · ${R.items.filter(i=>i.blank).length}`],['flag',T('Đánh dấu','Flagged')]],f,'resultFilter',{size:'sm',full:m})}
    ${list.length?`<div class="list">${list.map(it=>`<button type="button" class="list-box-item" data-action="openReview" data-i="${it.pos-1}" data-fk="rev:${it.pos}"><span class="qbtn ${it.ok?'is-correct':it.blank?'':'is-wrong'}" style="width:36px;flex-shrink:0;display:inline-flex;align-items:center;justify-content:center" aria-hidden="true">${it.pos}</span><span class="grow" style="min-width:0"><span class="list-box-item__label truncate">${esc(Q[it.qid].stem)}</span><span class="list-box-item__description">${tx(SKILLS[Q[it.qid].skill].name)}${it.flag?T(' · đã đánh dấu',' · flagged'):''}</span></span>${chip(it.ok?T('Đúng','Correct'):it.blank?T('Bỏ trống','Blank'):T('Sai','Wrong'),it.ok?'success':it.blank?'default':'danger',null,{size:'sm'})}${icon('chevron-right',14,'text-muted')}</button>`).join('')}</div>`:empty('circle-check',T('Không có câu nào','Nothing here'),T('Không có câu trong bộ lọc này.','No questions match this filter.'),'',{color:'success'})}</div>`;
  const next = `<div class="card card--lg tint-band tint-${weakest.code.startsWith('listening')?'listening':'reading'}"><div class="row">${chip(T('Bước tiếp theo','Next step'),'accent','target')}</div><div class="col gap-1"><div class="text-lg font-semibold">${T('Luyện','Practice')} “${tx(SKILLS[weakest.code].name)}”</div><p class="text-sm text-muted">${T('Kỹ năng thấp nhất trong bài này','Your lowest skill in this set')} (${weakest.c}/${weakest.n}).</p></div>
    <div class="col gap-2">${btn(T('Luyện ngay','Practice now'),{ic:'play-fill',action:'startExam',data:{id:recId},full:true})}${R.items.some(i=>!i.ok)?btn(T('Xem lại câu sai','Review mistakes'),{v:'tertiary',action:'openReview',data:{i:R.items.findIndex(i=>!i.ok)},full:true}):''}</div></div>`;
  const convert = R.guest?`<div class="card card--lg" style="box-shadow:inset 0 0 0 1.5px var(--accent)">${tile('bookmark','accent')}<div class="col gap-1"><div class="text-lg font-semibold">${T(`Lưu kết quả ${rawLabel(R)} này?`,`Save this ${rawLabel(R)} result?`)}</div><p class="text-sm text-muted">${T('Tạo tài khoản miễn phí để giữ lịch sử, xem tiến bộ theo kỹ năng và dùng AI Tutor.','Create a free account to keep your history, see progress by skill and use the AI Tutor.')}</p></div><div class="col gap-2">${btn(T('Tạo tài khoản','Create account'),{action:'convert',full:true})}${btn(T('Để sau','Later'),{v:'ghost',action:'go',data:{to:'catalog'},full:true})}</div></div>`:'';
  if (m) return summary+convert+next+sections+skills+answers;
  return `<div class="grid grid-main"><div class="col gap-4">${summary}${sections}${answers}</div><div class="col gap-4">${convert}${next}${skills}</div></div>`;
}
function rReview(){
  if (!S.result) S.result=buildResult('toeic-mini-mock',EXAMS['toeic-mini-mock'].qids,CANNED['toeic-mini-mock'],{},'mock');
  const R=S.result, m=isM(), rv=S.review; rv.idx=Math.min(rv.idx,R.items.length-1);
  const it=R.items[rv.idx], q=Q[it.qid], grp=q.group?G[q.group]:null;
  const pool = R.items.map((x,i)=>i).filter(i=>!rv.onlyWrong||!R.items[i].ok), pi=pool.indexOf(rv.idx);
  const prev = pi>0?pool[pi-1]:(pi===-1?pool.filter(i=>i<rv.idx).pop():undefined), next = pi>=0?pool[pi+1]:pool.find(i=>i>rv.idx);
  const stim = grp ? (grp.type==='passage'
      ? `<div class="card card--lg">${cardHead(tx(grp.title),chip(T('Bằng chứng được tô sáng','Evidence highlighted'),'warning','bulb',{size:'sm'}),'',tile('file-text','default','sm'))}<div class="passage">${grp.html.replace(`class="ev" data-ev="${it.qid}"`,`class="ev is-ev" data-ev="${it.qid}"`)}</div></div>`
      : `<div class="card card--lg">${cardHead('Transcript · '+tx(grp.title),'','',skillTile('listening','sm'))}<p style="white-space:pre-line;line-height:24px">${esc(grp.transcript)}</p></div>`)
    : q.transcript?`<div class="card card--lg">${cardHead('Transcript','','',skillTile('listening','sm'))}<p style="white-space:pre-line;line-height:24px">${esc(q.transcript)}</p></div>`:'';
  const head = `<div class="row row--between"><div class="row gap-2">${m?'':btn(T('Kết quả','Results'),{v:'ghost',size:'sm',ic:'chevron-left',action:'go',data:{to:'results'}})}<span class="text-sm text-muted tnum">${T('Câu','Question')} ${it.pos} / ${R.items.length}</span></div><label class="row text-sm gap-2" style="cursor:pointer">${switchEl(rv.onlyWrong,'reviewWrong',T('Chỉ xem câu sai','Mistakes only'))}${T('Chỉ câu sai','Mistakes only')}</label></div>`;
  const nav = `<div class="row">${btn(T('Câu trước','Previous'),{v:'tertiary',ic:'chevron-left',action:'reviewGo',data:{i:prev??''},disabled:prev==null})}<div class="grow"></div>${btn(T('Câu tiếp','Next'),{v:'tertiary',iconR:'chevron-right',action:'reviewGo',data:{i:next??''},disabled:next==null})}</div>`;
  const qb = `<div class="card card--lg">${questionBlock(it.qid,{review:true,result:R})}</div>`;
  if (m) return head+qb+stim+nav;
  if (!stim) return head+`<div class="col gap-4" style="max-width:760px;width:100%;margin:0 auto">${qb}${nav}</div>`;
  return head+`<div class="grid grid-2" style="align-items:start"><div class="col gap-4">${stim}</div><div class="col gap-4">${qb}${nav}</div></div>`;
}

/* ---------- IELTS Writing (P2) ---------- */
const words = t => (t.trim().match(/\S+/g)||[]).length;
function rWriting(){
  if (!S.writing) S.writing={text:'',phase:'editing',remaining:2400,mobileMode:null};
  const W=S.writing, m=isM(), wc=words(W.text), target=W.mobileMode==='intro'?50:250;
  const bar = `<header class="exam__bar">${btn('',{v:'ghost',size:m?'':'sm',ic:m?'xmark':'chevron-left',action:'go',data:{to:'catalog'},aria:T('Thoát','Exit')})}${skillTile('writing','sm')}<div class="col grow" style="gap:0;min-width:0"><h1 class="text-sm font-semibold truncate">IELTS Writing Task 2</h1><span class="text-xs text-muted">${W.phase==='editing'?T('Tự lưu','Autosave'):T('Nhận xét AI','AI feedback')} · ${phase('P2')}</span></div>
     ${W.phase==='editing'?`${m?'':`<span class="save-status">${icon('circle-check',12,'text-success')}${T('Đã lưu','Saved')}</span>`}<span id="w-timer" class="timer ${W.remaining<300?'is-warn':''}" role="timer">${icon('clock',14)}<span>${fmt(W.remaining)}</span></span>${m?'':btn(T('Nộp bài','Submit'),{size:'sm',ic:'paper-plane',action:'writingSubmit'})}`:''}</header>`;
  const promptCard = `<div class="card">${cardHead(T('Đề bài','Task'),'',T('Khuyến nghị 40 phút · tối thiểu 250 từ','Recommended 40 min · at least 250 words'),tile('file-text','default','sm'))}<p class="text-base" style="line-height:26px">${W_PROMPT}</p></div>`;
  const wrap = inner => `<div class="${m?'m-shell':'exam'}">${bar}<div class="${m?'m-content':'exam__single'}" data-scroll="w"><div class="qwrap">${inner}</div></div></div>`;
  if (W.phase==='evaluating') return wrap(`<div class="card card--lg" style="align-items:center;text-align:center;padding:40px">${mascot({mood:'think',size:120})}<span class="spinner">${SPIN}</span><div class="text-lg font-semibold">${T('AI đang chấm bài viết…','AI is grading your essay…')}</div><p class="text-muted">${T('Thường mất khoảng 30 giây. Bạn có thể rời màn hình — kết quả sẽ nằm trong Tiến độ.','Usually about 30 seconds. You can leave — results will appear in Progress.')} ${sim()}</p></div>`);
  if (W.phase==='failed'||(W.phase==='feedback'&&viewState('writing')==='error')) return wrap(alertBox('danger',T('Chưa chấm được bài viết','Couldn’t grade your essay'),T('Bài làm đã được lưu an toàn. Hệ thống sẽ tự thử lại; bạn cũng có thể thử ngay.','Your essay is safely saved. We’ll retry automatically, or you can retry now.'),btn(T('Thử lại','Retry'),{v:'tertiary',size:'sm',ic:'arrows-rotate-right',action:'writingRetry'}))+promptCard);
  if (W.phase==='feedback'){
    const crit=[['Task Response',6.5,['Trả lời đủ hai quan điểm và nêu ý kiến; phần kết luận còn thiếu.','Covers both views and gives an opinion; the conclusion is missing.']],['Coherence & Cohesion',6.0,['Bố cục rõ; cần từ nối đa dạng hơn.','Clear structure; use more varied linking words.']],['Lexical Resource',6.5,['Từ vựng phù hợp chủ đề (commute, office space).','Topic vocabulary is appropriate (commute, office space).']],['Grammatical Range & Accuracy',5.5,['Lỗi chia động từ số ít/số nhiều lặp lại.','Repeated subject–verb agreement errors.']]];
    const inline=[['many company','many companies'],['Some peoples','Some people'],['the benefits is','the benefits are'],['working from home save','working from home saves'],['teamwork become','teamwork becomes']];
    return wrap(`<div class="card card--lg hero-result" style="padding-right:${m?'16px':'170px'}"><div class="row row--wrap">${chip(T('Ước tính của AI','AI estimate'),'accent','sparkles')}${chip(T('Không phải điểm IELTS chính thức','Not an official IELTS score'),'default')}</div>
        <div class="row gap-5">${ring(6,9,{size:m?88:112,stroke:9,inner:`<span class="text-2xl font-semibold tnum">6.0</span>`})}<div class="col gap-1"><span class="text-sm text-muted font-medium">${T('Band ước tính','Estimated band')}</span><span class="text-3xl font-bold tnum">5.5 – 6.5</span><span class="text-sm text-muted">${wc||words(W_SAMPLE)} ${T('từ','words')} · rubric ielts_writing_task2_v1</span></div></div>
        ${(wc||words(W_SAMPLE))<250?alertBox('warning',T('Bài dưới 250 từ','Under 250 words'),T('Bài thi thật bị trừ điểm Task Response.','The real exam would lower Task Response.'),'',{flat:true}):''}
        ${m?'':mascot({mood:'happy',size:140})}</div>
      <div class="card">${cardHead(T('Theo tiêu chí','By criterion'))}<div class="list list--divided">${crit.map(([n,b,c])=>`<div class="list-box-item" style="align-items:flex-start"><span class="avatar avatar--sm avatar--accent tnum" style="font-weight:600">${b.toFixed(1)}</span><span class="grow"><span class="list-box-item__label">${n}</span><span class="text-sm text-muted">${tx(c)}</span></span></div>`).join('')}</div></div>
      <div class="card">${cardHead(T('Sửa lỗi gợi ý','Suggested fixes'),chip(`${inline.length} ${T('lỗi','issues')}`,'danger',null,{size:'sm'}))}<div class="list list--divided">${inline.map(([a,b])=>`<div class="list-box-item"><span style="text-decoration:line-through" class="text-danger">${a}</span>${icon('arrow-right',14,'text-muted')}<span class="text-success font-medium">${b}</span></div>`).join('')}</div>${W.text&&W.text!==W_SAMPLE?`<p class="text-xs text-muted">${sim(T('Nhận xét cố định cho bản demo','Fixed demo feedback'))}</p>`:''}</div>
      <div class="row row--wrap">${btn(T('Viết lại bài này','Rewrite this essay'),{v:'tertiary',ic:'arrow-rotate-left',action:'writingReset'})}${btn(T('Hỏi AI Tutor về nhận xét','Ask the AI Tutor'),{v:'secondary',ic:'sparkles',action:'go',data:{to:'tutor'}})}</div>`);
  }
  if (m && !W.mobileMode) return `<div class="m-shell">${bar}<div class="m-content">${promptCard}
      ${alertBox('accent',T('Bài luận dài dễ viết hơn trên máy tính','Long essays are easier on a computer'),T('Bài làm tự lưu — bạn có thể bắt đầu ở đây và hoàn thành trên web.','Your work autosaves — start here and finish on the web.'),'',{ic:'display',flat:true})}
      <div class="col gap-2">${[['full','pencil',T('Viết toàn bài trên điện thoại','Write the full essay here'),T('40 phút · 250+ từ','40 min · 250+ words')],['intro','thunderbolt',T('Luyện ngắn: chỉ viết mở bài','Quick drill: introduction only'),T('10 phút · 40–60 từ · phù hợp điện thoại','10 min · 40–60 words · phone-friendly')],['web','display',T('Tiếp tục trên web','Continue on the web'),T('Gửi link tới email của bạn','Email me a link')]].map(([v,i,t,d])=>`<button type="button" class="choice" data-action="wMode" data-v="${v}" data-fk="wmode:${v}">${tile(i,v==='intro'?'accent':'default','sm')}<span class="grow"><span class="choice__title">${t}</span><span class="choice__desc">${d}</span></span>${icon('chevron-right',14,'text-muted')}</button>`).join('')}</div>
    </div></div>`;
  const editor = `<div class="col gap-2" style="height:100%"><div class="row row--between"><label for="w-text" class="label">${T('Bài làm của bạn','Your essay')}</label>${!W.text?btn(T('Dùng bài mẫu (demo)','Use sample (demo)'),{v:'ghost',size:'sm',ic:'copy',action:'wSample'}):''}</div>
      <textarea id="w-text" class="textarea grow" style="min-height:${m?280:380}px;font-size:16px;padding:16px" data-input="writing" placeholder="${T('Bắt đầu viết…','Start writing…')}" spellcheck="false">${esc(W.text)}</textarea>
      <div class="row row--between text-xs"><span id="w-count" class="tnum font-medium ${wc>=target?'text-success':'text-muted'}">${wc} / ${target} ${T('từ','words')}</span><span class="text-muted">${T('Không kiểm tra chính tả — giống bài thi thật.','No spell-check — like the real exam.')}</span></div></div>`;
  if (m) return `<div class="m-shell">${bar}<div class="m-content"><details class="disclosure"><summary>${T('Đề bài','Task')}${icon('chevron-down',14)}</summary><div class="disclosure__body" style="color:var(--foreground)">${W_PROMPT}</div></details>${editor}</div><div class="m-sticky">${btn(T('Nộp bài','Submit'),{full:true,ic:'paper-plane',action:'writingSubmit'})}</div></div>`;
  return `<div class="exam">${bar}<div class="exam__split" style="grid-template-columns:minmax(0,.85fr) minmax(0,1.15fr)"><div class="exam__pane exam__pane--passage"><div class="col gap-4">${promptCard}<div class="card card--secondary">${cardHead(T('Gợi ý cấu trúc','Structure tips'),'','',tile('bulb','warning','sm'))}<ol style="padding-left:18px;color:var(--muted);line-height:24px"><li>${T('Mở bài: diễn đạt lại đề + quan điểm','Intro: paraphrase + position')}</li><li>${T('Thân bài 1: quan điểm A + ví dụ','Body 1: view A + example')}</li><li>${T('Thân bài 2: quan điểm B + ví dụ','Body 2: view B + example')}</li><li>${T('Kết luận: khẳng định lại ý kiến','Conclusion: restate your opinion')}</li></ol></div></div></div><div class="exam__pane">${editor}</div></div></div>`;
}

/* ---------- IELTS Speaking (P2) ---------- */
function rSpeaking(){
  if (!S.speaking) S.speaking={phase:'intro',t:0};
  const P=S.speaking, m=isM();
  const bar = `<header class="exam__bar">${btn('',{v:'ghost',size:m?'':'sm',ic:m?'xmark':'chevron-left',action:'go',data:{to:'catalog'},aria:T('Thoát','Exit')})}${skillTile('speaking','sm')}<div class="col grow" style="gap:0"><h1 class="text-sm font-semibold">IELTS Speaking Part 2</h1><span class="text-xs text-muted">Cue card · ${phase('P2')}</span></div>${['prep','recording'].includes(P.phase)?`<span id="spk-timer" class="timer ${P.phase==='recording'?'is-danger':''}" role="timer">${icon(P.phase==='recording'?'microphone':'clock',14)}<span>${fmt(P.phase==='prep'?60-P.t:P.t)}</span></span>`:''}</header>`;
  const cue = `<div class="card" style="text-align:left;width:100%">${cardHead('Cue card','','',tile('square-list-ul','default','sm'))}<p class="text-base font-medium">Describe a place in your city where you like to spend time.</p><ul style="margin:0;padding-left:20px;line-height:26px;color:var(--muted)"><li>where it is</li><li>how often you go there</li><li>what you do there</li></ul><p>and explain why you like it.</p></div>`;
  let body='';
  if (P.phase==='intro') body = cue+`<div class="card">${cardHead(T('Cách làm','How it works'))}<div class="list list--divided">${[['clock',T('1 phút chuẩn bị','1 minute to prepare'),T('Có thể ghi chú nhanh.','Jot down notes.')],['microphone',T('Nói 1–2 phút','Speak for 1–2 minutes'),T('Ghi âm tự dừng ở 2:00.','Recording stops at 2:00.')],['sparkles',T('AI nhận xét 4 tiêu chí','AI feedback on 4 criteria'),T('Ước tính, không chính thức.','Estimated, not official.')]].map(([i,t,d])=>`<div class="list-box-item">${tile(i,'default','sm')}<span class="grow"><span class="list-box-item__label">${t}</span><span class="list-box-item__description">${d}</span></span></div>`).join('')}</div>${btn(T('Bắt đầu','Start'),{size:'lg',full:true,ic:'microphone',action:'spk',data:{p:'permission'}})}</div>`;
  if (P.phase==='permission') body = `<div class="col gap-4" style="align-items:center;text-align:center;padding-top:12px">${mascot({mood:'think',size:110})}<div class="text-lg font-semibold">${T('Engrisk cần quyền dùng micro','Engrisk needs microphone access')}</div><p class="text-muted" style="max-width:340px">${T('Chỉ ghi âm khi bạn nhấn nút. Bản ghi lưu riêng tư và chỉ dùng để chấm bài.','We only record when you press the button. Recordings are private and used only for feedback.')}</p>
      <div class="sys-dialog" role="dialog" aria-label="System dialog (simulated)"><div class="font-semibold">“Engrisk” ${T('muốn truy cập micro','would like to access the microphone')}</div><div class="text-xs text-muted">${T('Hộp thoại hệ thống','System dialog')} ${sim()}</div><div class="row row--center">${btn(T('Không cho phép','Don’t allow'),{v:'tertiary',size:'sm',action:'spk',data:{p:'denied'}})}${btn(T('Cho phép','Allow'),{size:'sm',action:'spk',data:{p:'prep'}})}</div></div></div>`;
  if (P.phase==='denied') body = alertBox('danger',T('Chưa có quyền micro','Microphone access denied'),T('Mở Cài đặt → Engrisk → Micro và bật quyền, rồi quay lại. Bạn vẫn có thể luyện bằng cách đọc cue card và tự ghi chú.','Open Settings → Engrisk → Microphone, turn it on, then come back. You can still practice with the cue card and notes.'),`<div class="row">${btn(T('Thử lại','Try again'),{v:'tertiary',size:'sm',ic:'arrows-rotate-right',action:'spk',data:{p:'permission'}})}${btn(T('Mở Cài đặt','Open Settings'),{v:'ghost',size:'sm',action:'noop'})}</div>`,{ic:'microphone-slash'})+cue;
  if (P.phase==='prep') body = cue+`<div class="card"><div class="textfield"><label class="label" for="spk-notes">${T('Ghi chú nhanh','Quick notes')}</label><textarea id="spk-notes" class="textarea textarea--secondary" rows="3" placeholder="West Lake · weekends · jogging…"></textarea></div><div id="spk-prep">${progressBar(P.t,60,{label:T('Thời gian chuẩn bị','Preparation'),right:`${60-P.t}s`})}</div>${btn(T('Bắt đầu nói ngay','Start speaking now'),{size:'lg',ic:'microphone',action:'spk',data:{p:'recording'},full:true})}</div>`;
  if (P.phase==='recording') body = `<div class="col gap-5" style="align-items:center;text-align:center;padding-top:8px">${m?'':cue}${chip(T('Đang ghi âm','Recording'),'danger','microphone')}<div class="wave wave--live" style="height:56px;max-width:320px;width:100%" aria-hidden="true">${Array.from({length:32},(_,i)=>`<i class="on" style="height:${10+((i*11)%40)}px;background:var(--danger)"></i>`).join('')}</div>
      <button type="button" class="mic" data-action="spk" data-p="recorded" data-fk="spk:stop" aria-label="${T('Dừng ghi âm','Stop recording')}">${icon('stop-fill',28)}</button><span class="text-sm text-muted">${P.t<60?T('Cố gắng nói ít nhất 1 phút','Try to speak for at least a minute'):T('Tốt! Có thể dừng bất cứ lúc nào','Great! Stop whenever you’re ready')} · ${T('tự dừng ở 2:00','stops at 2:00')}</span></div>`;
  if (P.phase==='recorded') body = `<div class="card">${cardHead(T('Bản ghi của bạn','Your recording'),`<span class="text-sm text-muted tnum">${fmt(P.t)}</span>`)}<div class="audio" style="box-shadow:none;padding:0"><button type="button" class="audio__play" data-action="noop" data-fk="playrec" aria-label="${T('Nghe lại bản ghi','Play recording')}">${icon('play-fill',18)}</button><div class="wave">${Array.from({length:40},(_,i)=>`<i style="height:${6+((i*13)%22)}px"></i>`).join('')}</div></div>${P.t<30?alertBox('warning',T('Bản ghi khá ngắn','Recording is short'),T('Phần 2 thường cần 1–2 phút để đánh giá chính xác.','Part 2 usually needs 1–2 minutes for a reliable estimate.'),'',{flat:true}):''}
      <div class="row">${btn(T('Ghi lại','Re-record'),{v:'tertiary',ic:'arrow-rotate-left',action:'spk',data:{p:'prep'}})}<div class="grow"></div>${btn(T('Nộp để AI nhận xét','Submit for AI feedback'),{ic:'paper-plane',action:'spk',data:{p:'evaluating'}})}</div></div>`+cue;
  if (P.phase==='evaluating') body = `<div class="card card--lg" style="align-items:center;text-align:center;padding:40px">${mascot({mood:'think',size:110})}<span class="spinner">${SPIN}</span><div class="text-lg font-semibold">${T('Đang chuyển giọng nói thành văn bản và chấm…','Transcribing and grading…')}</div><p class="text-muted">${T('Bản ghi đã lưu an toàn.','Your recording is safely saved.')} ${sim()}</p></div>`;
  if (P.phase==='feedback') body = `<div class="card card--lg hero-result" style="padding-right:${m?'16px':'160px'}"><div class="row row--wrap">${chip(T('Ước tính của AI','AI estimate'),'accent','sparkles')}${chip(T('Không chính thức','Not official'))}</div><div class="row gap-5">${ring(6,9,{size:m?88:104,stroke:9,inner:`<span class="text-2xl font-semibold tnum">6.0</span>`})}<div class="col gap-1"><span class="text-sm text-muted font-medium">${T('Band ước tính','Estimated band')}</span><span class="text-3xl font-bold tnum">5.5 – 6.5</span></div></div>${m?'':mascot({mood:'happy',size:130})}</div>
      <div class="card">${cardHead(T('Theo tiêu chí','By criterion'))}<div class="list list--divided">${[['Fluency & Coherence','6.0',['Nói liên tục, đôi chỗ ngập ngừng khi chuyển ý.','Fluent, with some hesitation between ideas.']],['Lexical Resource','6.5',['Dùng tốt “peaceful”, “unwind”.','Good use of “peaceful”, “unwind”.']],['Grammatical Range','6.0',['Chủ yếu câu đơn; thử thêm mệnh đề quan hệ.','Mostly simple sentences; try relative clauses.']],['Pronunciation','6.0*',['*Độ tin cậy thấp hơn — AI chấm phát âm còn hạn chế.','*Lower confidence — AI pronunciation scoring is limited.']]].map(([n,b,c])=>`<div class="list-box-item" style="align-items:flex-start"><span class="avatar avatar--sm avatar--accent tnum" style="font-weight:600">${b}</span><span class="grow"><span class="list-box-item__label">${n}</span><span class="text-sm text-muted">${tx(c)}</span></span></div>`).join('')}</div></div>
      <details class="disclosure"><summary>${T('Transcript (tự động)','Transcript (automatic)')}${icon('chevron-down',14)}</summary><div class="disclosure__body" style="color:var(--foreground)">I’d like to talk about West Lake, which is <mark>near to</mark> my house. I go there <mark>almost every weekends</mark> to jog and unwind…</div></details>
      <div class="row">${btn(T('Nói lại','Try again'),{v:'tertiary',ic:'arrow-rotate-left',action:'spk',data:{p:'prep'}})}${btn(T('Về danh mục','Back to sets'),{v:'ghost',action:'go',data:{to:'catalog'}})}</div>`;
  return `<div class="${m?'m-shell':'exam'}">${bar}<div class="${m?'m-content':'exam__single'}"><div class="qwrap" style="${P.phase==='recording'||P.phase==='permission'?'align-items:center':''}">${body}</div></div></div>`;
}
