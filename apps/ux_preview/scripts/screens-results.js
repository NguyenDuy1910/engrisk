/* Results (score report) and Review (group-based answer review) for TOEIC & IELTS attempts. */
const partLabel = p => p.replace(/^P(\d)$/,'Part $1').replace(/^R(\d)$/,'Passage $1').replace(/^L(\d)$/,'Part $1').replace('PX',T('Bộ riêng','Personal'));
const fmtAns = (q,a) => isBlank(a)?'—':Array.isArray(a)?a.join(', '):String(a);
const keyOf = q => Array.isArray(q.answer)?(q.type==='gap'?q.answer[0]:q.answer.join(', ')):q.answer;
function defaultResult(){ return buildResult('toeic-test-01',examQids(EXAMS['toeic-test-01']),CANNED['toeic-test-01'],{t72:true},'mock',null,{time:{t1:9,t2:11,t7:6,t8:7,t9:8,t32:14,t33:12,t34:18,t71:9,t72:21,t73:10,t101:22,t102:31,t103:48,t104:19,t131:26,t132:64,t133:21,t134:17,t147:52,t148:28,t149:24,t176:46,t177:39,t178:96}}); }

function rResults(){
  if (!S.result) S.result=defaultResult();
  const R=S.result, ex=EXAMS[R.examId], m=isM(), ielts=R.track==='ielts';
  if (viewState('results')==='loading') return `<div class="card card--lg" style="align-items:center;padding:56px;text-align:center">${mascot({mood:'think',size:110})}<span class="spinner">${SPIN}</span><div class="text-lg font-semibold">${T('Đang chấm bài…','Grading…')}</div><p class="text-muted">${T('Chấm tự động theo đáp án đã kiểm duyệt.','Graded against verified answer keys.')}</p></div>`;
  const p=Math.round(R.raw/R.n*100), mood=p>=60?'cheer':p>=40?'happy':'calm';
  const headline = p>=80?T('Xuất sắc!','Excellent!'):p>=60?T('Làm tốt lắm!','Nice work!'):p>=40?T('Đang tiến bộ!','Getting there!'):T('Khởi đầu tốt — luyện tiếp nhé','Good start — keep going');
  const secEntries = Object.entries(R.sections);
  const scoreBlock = R.total!=null
    ? `<span class="text-sm font-medium text-muted nowrap">${T('Điểm TOEIC ước tính','Estimated TOEIC score')}</span><span class="${m?'text-4xl':'text-5xl'} font-bold tnum tracking-tight" data-count="${R.total}">${R.total}</span><span class="text-sm text-muted">${secEntries.map(([k,s])=>`<span class="nowrap">${SECTION[k]} <b class="tnum">${s.scaled}</b></span>`).join(' · ')}</span>`
    : ielts ? `<span class="text-sm font-medium text-muted nowrap">${T('Band ước tính','Estimated band')} · ${SECTION[secEntries[0][0]]}</span><span class="${m?'text-4xl':'text-5xl'} font-bold tnum tracking-tight">${R.band.toFixed(1)}</span><span class="text-sm text-muted">${T('Đúng','Correct')} ${rawLabel(R)} → ≈ ${secEntries[0][1].raw40}/40</span>`
    : `<span class="text-sm font-medium text-muted">${T('Kết quả','Result')}</span><span class="text-5xl font-bold tnum tracking-tight">${rawLabel(R)}</span><span class="text-sm text-muted">${T('Luyện tập không quy đổi thang điểm','Practice isn’t converted to a scale')}</span>`;
  const summary = `<div class="card card--lg hero-result" style="padding-right:${m?'24px':'170px'}">
    <div class="row row--wrap gap-2">${chip(R.mode==='mock'?T('Thi thử','Mock'):T('Luyện tập','Practice'),'accent')}${R.reason==='time_expired'?chip(T('Hết giờ · nộp tự động','Time up · auto-submitted'),'warning','clock'):''}<span class="text-sm text-muted">${tx(ex.title)} · ${fmt(R.seconds)}</span></div>
    <div class="text-2xl font-bold tracking-tight">${headline}</div>
    <div class="row gap-5">${ring(R.raw,R.n,{size:m?92:116,stroke:m?9:10,inner:`<span class="${m?'text-lg':'text-2xl'} font-semibold tnum"><span data-count="${p}">${p}</span>%</span><span class="text-xs text-muted">${T('chính xác','accuracy')}</span>`})}<div class="col gap-1" style="min-width:0">${scoreBlock}</div></div>
    ${R.total!=null||ielts?`<p class="text-xs text-muted row gap-1">${icon('circle-info',12)}${T('Điểm ước tính từ bảng quy đổi, không phải điểm chính thức.','Estimated from a conversion table — not an official score.')}</p>`:''}
    ${m?'':mascot({mood,size:140})}</div>`;
  /* by part (TOEIC) / by question type (IELTS) */
  const rows = ielts ? R.skills.map(s=>({label:tx(SKILLS[s.code].name),sub:tx(ALL_PARTS[SKILLS[s.code].part].name),c:s.c,n:s.n,act:{id:SKILLS[s.code].practice,part:SKILLS[s.code].part}}))
    : Object.entries(R.parts).map(([k,s])=>({label:partLabel(k),sub:ALL_PARTS[k].short,c:s.c,n:s.n,act:{id:ex.bank?R.examId:'toeic-test-01',part:k}}));
  const breakdown = `<div class="card">${cardHead(ielts?T('Theo dạng câu hỏi','By question type'):T('Theo Part','By part'))}
    ${m?`<div class="list list--divided">${rows.map(r=>`<div class="list-box-item" style="flex-direction:column;align-items:stretch;gap:6px"><div class="row row--between gap-2"><span class="text-sm truncate"><b>${r.label}</b> <span class="text-muted">· ${r.sub}</span></span><span class="text-sm tnum font-semibold">${r.c}/${r.n}</span></div><div class="row gap-3">${accBar(r.c/r.n)}${btn(T('Luyện','Practise'),{v:'ghost',size:'sm',action:'openSetup',data:r.act})}</div></div>`).join('')}</div>`
    :`<table class="table"><thead><tr><th>${ielts?T('Dạng câu','Type'):'Part'}</th><th>${T('Đúng','Correct')}</th><th style="width:34%">${T('Độ chính xác','Accuracy')}</th><th></th></tr></thead><tbody>${rows.map(r=>`<tr><td><b>${r.label}</b><div class="text-xs text-muted">${r.sub}</div></td><td class="tnum">${r.c}/${r.n}</td><td>${accBar(r.c/r.n)}</td><td style="text-align:right">${btn(T('Luyện','Practise'),{v:'ghost',size:'sm',action:'openSetup',data:r.act})}</td></tr>`).join('')}</tbody></table>`}</div>`;
  const f=S.resultFilter, list=R.items.filter(i=>f==='all'||(f==='wrong'&&!i.ok&&!i.blank)||(f==='blank'&&i.blank)||(f==='flag'&&i.flag));
  const filt = tabs(T('Lọc','Filter'),[['all',`${T('Tất cả','All')} · ${R.items.length}`],['wrong',`${T('Sai','Wrong')} · ${R.items.filter(i=>!i.ok&&!i.blank).length}`],['blank',`${T('Bỏ trống','Blank')} · ${R.items.filter(i=>i.blank).length}`],['flag',`${T('Đánh dấu','Flagged')} · ${R.items.filter(i=>i.flag).length}`]],f,'resultFilter',{size:'sm',full:m});
  const sheet = ielts
    ? `<table class="table table--key"><thead><tr><th>#</th><th>${T('Bạn trả lời','Your answer')}</th><th>${T('Đáp án','Answer')}</th><th></th></tr></thead><tbody>${list.map(it=>`<tr class="is-click" data-action="openReview" data-i="${it.pos-1}" tabindex="0"><td class="tnum font-semibold">${it.n}</td><td class="${it.ok?'text-success':it.blank?'text-muted':'text-danger'}">${esc(fmtAns(Q[it.qid],it.ans))}</td><td>${esc(keyOf(Q[it.qid]))}</td><td>${it.ok?icon('check',14,'text-success'):icon('xmark',14,'text-danger')}${it.max>1?` <span class="text-xs text-muted">${it.pts}/${it.max}</span>`:''}</td></tr>`).join('')}</tbody></table>`
    : `<div class="sheet-grid">${list.map(it=>`<button type="button" class="sheet-cell ${it.ok?'is-correct':it.blank?'is-blank':'is-wrong'} ${it.flag?'is-flag':''}" data-action="openReview" data-i="${it.pos-1}" data-fk="rev:${it.pos}" title="${T('Câu','Q')} ${it.n}: ${fmtAns(Q[it.qid],it.ans)} → ${keyOf(Q[it.qid])}"><span class="sheet-cell__n tnum">${it.n}</span><span class="sheet-cell__a">${it.blank?'—':esc(fmtAns(Q[it.qid],it.ans))}${it.ok?'':`<small>→${esc(keyOf(Q[it.qid]))}</small>`}</span></button>`).join('')}</div>`;
  const answers = `<div class="card">${cardHead(ielts?T('Bảng đáp án','Answer key'):T('Phiếu trả lời','Answer sheet'),btn(T('Xem lại toàn bộ','Review all'),{v:'ghost',size:'sm',iconR:'chevron-right',action:'openReview',data:{i:0}}))}${filt}${list.length?sheet:empty('circle-check',T('Không có câu nào','Nothing here'),T('Không có câu trong bộ lọc này.','No questions match this filter.'),'',{color:'success'})}</div>`;
  const slow = R.items.filter(i=>i.time).sort((a,b)=>b.time-a.time).slice(0,3);
  const timing = slow.length?`<div class="card">${cardHead(T('Câu tốn nhiều thời gian nhất','Slowest questions'))}<div class="list list--flush">${slow.map(it=>`<button type="button" class="list-box-item" data-action="openReview" data-i="${it.pos-1}"><span class="qnum">${it.n}</span><span class="grow list-box-item__label truncate">${partLabel(it.part)} · ${tx(SKILLS[Q[it.qid].skill].name)}</span><span class="tnum font-semibold">${it.time}s</span>${it.ok?icon('check',14,'text-success'):icon('xmark',14,'text-danger')}</button>`).join('')}</div></div>`:'';
  const wrongN = R.items.filter(i=>!i.ok).length, weakest=R.skills[0];
  const next = `<div class="card card--lg tint-band tint-${weakest.code.startsWith('listening')?'listening':'reading'}"><span class="eyebrow">${T('Bước tiếp theo','Next step')}</span><div class="col gap-1"><div class="text-lg font-semibold">${wrongN?`${T('Làm lại','Redo')} ${wrongN} ${T('câu sai','missed questions')}`:T('Không có câu sai','No mistakes')}</div><p class="text-sm text-muted">${T('Kỹ năng yếu nhất','Weakest skill')}: <b>${tx(SKILLS[weakest.code].name)}</b> (${weakest.c}/${weakest.n})</p></div>
    <div class="col gap-2">${wrongN?btn(T('Làm lại câu sai','Redo missed questions'),{ic:'arrow-rotate-left',action:'redoWrong',full:true}):''}${btn(T('Luyện kỹ năng này','Practise this skill'),{v:'outline',action:'openSetup',data:{id:SKILLS[weakest.code].practice,part:SKILLS[weakest.code].part},full:true})}</div></div>`;
  const convert = R.guest?`<div class="card card--lg" style="box-shadow:inset 0 0 0 1.5px var(--accent)">${tile('bookmark','accent')}<div class="col gap-1"><div class="text-lg font-semibold">${T(`Lưu kết quả ${rawLabel(R)} này?`,`Save this ${rawLabel(R)} result?`)}</div><p class="text-sm text-muted">${T('Tạo tài khoản miễn phí để giữ lịch sử, highlight, ghi chú và dùng AI Tutor.','Create a free account to keep your history, highlights, notes and use the AI Tutor.')}</p></div><div class="col gap-2">${btn(T('Tạo tài khoản','Create account'),{action:'convert',full:true})}${btn(T('Để sau','Later'),{v:'ghost',action:'go',data:{to:'catalog'},full:true})}</div></div>`:'';
  if (m) return summary+convert+next+breakdown+answers+timing;
  return `<div class="grid grid-main"><div class="col gap-4">${summary}${breakdown}${answers}</div><div class="col gap-4">${convert}${next}${timing}</div></div>`;
}
function rReview(){
  if (!S.result) S.result=defaultResult();
  const R=S.result, m=isM(), rv=S.review; rv.idx=Math.max(0,Math.min(rv.idx,R.items.length-1));
  const it=R.items[rv.idx], pages=buildPages(R.items.map(i=>i.qid)), pi=pages.findIndex(p=>p.qids.includes(it.qid)), page=pages[pi], g=page.gid&&G[page.gid];
  if (S.reviewEvFor!==rv.idx){ S.reviewEv=it.qid; S.reviewEvFor=rv.idx; }
  const A=Object.fromEntries(R.items.map(i=>[i.qid,i.ans]));
  const pageOk = p => p.qids.every(id=>R.items.find(i=>i.qid===id).ok);
  const pool = pages.map((p,i)=>i).filter(i=>!rv.onlyWrong||!pageOk(pages[i]));
  const prev = pool.filter(i=>i<pi).pop(), next = pool.find(i=>i>pi);
  const firstItem = i => R.items.findIndex(x=>x.qid===pages[i].qids[0]);
  const pills = `<div class="review-pills" role="navigation" aria-label="${T('Danh sách câu','Questions')}">${R.items.map((x,i)=>`<button type="button" class="pill ${x.ok?'is-correct':x.blank?'is-blank':'is-wrong'} ${page.qids.includes(x.qid)?'is-current':''} ${rv.onlyWrong&&x.ok?'is-dim':''}" data-action="reviewGo" data-i="${i}" aria-label="${T('Câu','Question')} ${x.n}">${x.n}</button>`).join('')}</div>`;
  const head = `<div class="row row--between row--wrap gap-2"><div class="row gap-2">${btn(m?'':T('Kết quả','Results'),{v:'ghost',size:'sm',ic:'chevron-left',action:'go',data:{to:'results'},aria:T('Kết quả','Results')})}<span class="text-sm text-muted">${partLabel(page.part)} · ${ALL_PARTS[page.part].short}</span></div><label class="row text-sm gap-2" style="cursor:pointer">${switchEl(rv.onlyWrong,'reviewWrong',T('Chỉ câu sai','Mistakes only'))}${T('Chỉ câu sai','Mistakes only')}</label></div>${pills}`;
  /* stimulus */
  let stim='';
  if (page.audio) stim += `<div class="card">${cardHead('Transcript',chip(T('Có trong bản đầy đủ: nghe lại từng câu','Full product: replay line by line'),'default','headphones',{size:'sm'}),'',skillTile('listening','sm'))}${transcriptHtml(page.audio.lines,-1,{seek:false})}</div>`;
  if (page.part==='P1') stim = `<div class="card">${toeicStimulus(page,{review:true})}</div>`+stim;
  else if (g&&R.track==='toeic'&&(g.type!=='audio'||g.graphic)) stim += `<div class="card">${cardHead(g.title,g.type==='audio'?'':chip(T('Bằng chứng được tô sáng','Evidence highlighted'),'warning','bulb',{size:'sm'}))}${toeicStimulus(page,{review:true})}</div>`;
  else if (g&&g.type==='passage') stim += `<div class="card card--lg">${chip(T('Bằng chứng được tô sáng · highlight của bạn được giữ','Evidence highlighted · your highlights kept'),'warning','bulb',{size:'sm'})}${ieltsPassage(page,{review:true})}</div>`;
  else if (page.qids.some(id=>Q[id].set&&SETS[Q[id].set].map)) stim += `<div class="card">${MAPS.park}</div>`;
  const times = page.qids.map(id=>{ const x=R.items.find(i=>i.qid===id); return x.time?chip(`${x.n}: ${x.time}s`,'default','stopwatch',{size:'sm'}):''; }).join('');
  const qs = R.track==='ielts' ? ieltsQuestions(page,{review:true,answers:A}) : page.qids.map(id=>tq(id,{review:true,ans:A[id]})).join('');
  const qcard = `<div class="card card--lg review-q">${times?`<div class="row row--wrap gap-1">${times}</div>`:''}${qs}</div>`;
  const nav = `<div class="row">${btn(T('Trước','Previous'),{v:'tertiary',ic:'chevron-left',action:'reviewGo',data:{i:prev!=null?firstItem(prev):''},disabled:prev==null})}<span class="grow text-sm text-muted" style="text-align:center">${T('Nhóm','Set')} ${pi+1}/${pages.length}</span>${btn(T('Tiếp','Next'),{v:'tertiary',iconR:'chevron-right',action:'reviewGo',data:{i:next!=null?firstItem(next):''},disabled:next==null})}</div>`;
  if (m) return head+qcard+stim+nav;
  if (!stim) return head+`<div class="col gap-4" style="max-width:780px;width:100%;margin:0 auto">${qcard}${nav}</div>`;
  return head+`<div class="grid grid-2" style="align-items:start"><div class="col gap-4 review-stim">${stim}</div><div class="col gap-4">${qcard}${nav}</div></div>`;
}
