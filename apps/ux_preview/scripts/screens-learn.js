/* Learning screens: home · catalog · exam-intro */
const STATUS = {completed:[['Hoàn thành','Completed'],'success'],in_progress:[['Đang làm','In progress'],'accent'],abandoned:[['Bỏ dở','Abandoned'],'default']};

function weakSkillsList(limit=3,{buttons=true}={}){
  return `<div class="list list--divided">${MASTERY.slice(0,limit).map(([code,v])=>`<div class="list-box-item"><div class="grow">${meter(v*100,100,{label:tx(SKILLS[code].name),right:Math.round(v*100)+'%',color:v<.5?'danger':v<.65?'warning':'success',size:'sm'})}</div>${buttons?btn(T('Luyện','Practice'),{v:'secondary',size:'sm',action:'startExam',data:{id:SKILLS[code].practice}}):''}</div>`).join('')}</div>`;
}
function historyRow(h){
  const ex=EXAMS[h.exam], st=STATUS[h.status];
  return `<button type="button" class="list-box-item" data-action="openHistory" data-exam="${h.exam}" data-status="${h.status}" data-fk="hist:${h.exam}:${h.date}">${skillTile(ex.skill,'sm')}<span class="grow" style="min-width:0"><span class="list-box-item__label truncate">${tx(ex.title)}</span><span class="list-box-item__description">${fmtDate(h.date)} · ${h.mode==='mock'?T('Thi thử','Mock'):T('Luyện tập','Practice')}${h.mins?` · ${h.mins} ${T('phút','min')}`:''}</span></span><span class="col gap-1" style="align-items:flex-end"><span class="tnum font-semibold">${tx(h.score)}${h.est?` <span class="text-xs text-muted font-medium">${T('ước tính','est.')}</span>`:''}</span>${chip(tx(st[0]),st[1],null,{size:'sm'})}</span></button>`;
}
function weekBars(){
  const max=40;
  return `<div class="row" style="align-items:flex-end;gap:6px;height:72px" aria-hidden="true">${WEEK.map(([d,v],i)=>`<div class="col gap-1" style="flex:1;align-items:center;height:100%;justify-content:flex-end"><div class="weekbar" style="width:100%;max-width:20px;height:${Math.max(4,v/max*52)}px;border-radius:6px;background:${v?(i===5?'var(--accent)':'var(--accent-soft-hover)'):'var(--default)'};transform-origin:bottom;${S._enter?`animation:rise .6s var(--ease-out-quart) ${i*60}ms both`:''}"></div><span class="text-xs text-muted">${tx(d)}</span></div>`).join('')}</div>`;
}
function greetingText(){
  const h=new Date().getHours();
  return h<11?T('Chào buổi sáng','Good morning'):h<18?T('Chào buổi chiều','Good afternoon'):T('Chào buổi tối','Good evening');
}
function rHome(){
  const st=viewState('home'), m=isM(), u=user();
  if (st==='loading') return `<div class="grid ${m?'grid-2':'grid-4'}">${[1,2,3,4].map(()=>`<div class="card">${sk(14,'50%')}${sk(28,'60%')}</div>`).join('')}</div><div class="grid ${m?'':'grid-main'}"><div class="col">${sk(170,'100%',16)}${sk(130,'100%',16)}</div><div class="col">${sk(240,'100%',16)}</div></div>`;
  const guestBanner = u.guest?alertBox('accent',T('Bạn đang dùng chế độ khách','You are using guest mode'),T('Tiến độ gắn với thiết bị này. Tạo tài khoản để lưu trên mọi thiết bị — kết quả đã làm được giữ nguyên.','Progress is tied to this device. Create an account to sync everywhere — your results are kept.'),btn(T('Tạo tài khoản','Create account'),{size:'sm',action:'convert'})):'';
  if (st==='error') return alertBox('danger',T('Không tải được tiến độ','Couldn’t load your progress'),T('Kết nối không ổn định. Bạn vẫn có thể luyện tập — kết quả sẽ được đồng bộ sau.','Connection is unstable. You can still practice — results will sync later.'),`<div class="row">${btn(T('Thử lại','Retry'),{v:'tertiary',size:'sm',ic:'arrows-rotate-right',action:'setState',data:{s:'default'}})}${btn(T('Luyện nhanh','Quick practice'),{size:'sm',ic:'thunderbolt',action:'quick'})}</div>`);
  if (st==='empty') return guestBanner+homeEmpty();
  const R=S.resume, rex=R&&EXAMS[R.examId];
  const plan = `<div class="card card--lg hero-result" style="padding-right:${m?'110px':'190px'};min-height:${m?150:170}px">
      <span class="eyebrow">${T('Kế hoạch hôm nay','Today’s plan')}</span>
      <div class="text-xl font-bold tracking-tight">${R?T('Hoàn thành Mini Mock, rồi 5 câu Giới từ','Finish your Mini Mock, then 5 preposition questions'):T('5 câu Giới từ & một e-mail ngắn','5 preposition questions & a short e-mail')}</div>
      <div class="row row--wrap gap-2">${chip(T('≈ 20 phút','≈ 20 min'),'default','clock')}${chip(T('Vì: Giới từ là kỹ năng yếu nhất','Because: prepositions are your weakest skill'),'accent','target')}</div>
      <div class="row">${btn(R?T('Tiếp tục bài thi thử','Resume mock test'):T('Bắt đầu','Start'),{ic:'play-fill',action:R?'resume':'startExam',data:R?{}:{id:'toeic-r-part5'},size:'lg'})}</div>
      ${mascot({mood:'wave',size:m?100:160})}
    </div>`;
  const kpis = `<div class="grid ${m?'grid-2':'grid-4'}" style="${m?'gap:10px':''}">
    ${stat(T('Điểm ước tính','Estimated score'),'600',{small:'/ 990',right:trend('30'),count:600})}
    ${stat(T('Học tuần này','This week'),'95',{small:T('/ 150 phút','/ 150 min'),foot:progressBar(95,150,{size:'sm',aria:T('Phút học tuần này','Minutes this week')}),count:95})}
    ${stat(T('Chính xác 7 ngày','7-day accuracy'),'68%',{right:trend('5%')})}
    ${stat(T('Còn tới mục tiêu','To your goal'),'150',{small:T('điểm','pts'),right:chip(fmtDate('2026-12-15'),'default','calendar',{size:'sm'}),count:150})}
  </div>`;
  const resume = R?`<div class="card">
      ${cardHead(T('Tiếp tục bài đang làm','Continue where you left off'),chip(T('Thi thử','Mock'),'warning','clock',{size:'sm'}),'',skillTile(null,'sm'))}
      <div class="col gap-2"><div class="text-base font-semibold">${tx(rex.title)}</div>${progressBar(Object.keys(R.answers).length,R.qids.length,{label:`${T('Câu','Question')} ${R.idx+1} / ${R.qids.length}`,right:`${T('còn','left')} ${fmt(R.remaining)}`})}</div>
      <div class="card__footer">${btn(T('Tiếp tục','Resume'),{ic:'play-fill',action:'resume',full:m})}${m?'':btn(T('Xem đề','View test'),{v:'tertiary',action:'openExam',data:{id:R.examId}})}</div></div>`:'';
  const weak = `<div class="card">${cardHead(T('Kỹ năng cần luyện','Skills to practice'),btn(T('Tất cả','All'),{v:'ghost',size:'sm',iconR:'chevron-right',action:'go',data:{to:'progress'}}))}${weakSkillsList()}</div>`;
  const week = `<div class="card">${cardHead(T('Nhịp học tuần này','This week’s rhythm'),`<span class="text-sm text-muted">${T('3 ngày có học','3 active days')}</span>`)}${weekBars()}<p class="text-xs text-muted">${T('Đủ nhịp để đạt mục tiêu. Nghỉ một ngày cũng không sao.','On pace for your goal. Taking a day off is fine.')}</p></div>`;
  const recent = `${sectionTitle(T('Hoạt động gần đây','Recent activity'),HISTORY.length,btn(T('Xem lịch sử','View history'),{v:'ghost',size:'sm',iconR:'chevron-right',action:'go',data:{to:'progress'}}))}<div class="card" style="padding:8px"><div class="list">${HISTORY.slice(1,4).map(historyRow).join('')}</div></div>`;
  if (m) return guestBanner+plan+kpis+resume+weak+week+recent;
  return guestBanner+plan+kpis+`<div class="grid grid-main"><div class="col gap-4">${resume}${recent}</div><div class="col gap-4">${weak}${week}</div></div>`;
}
function homeEmpty(){
  const m=isM(), last=S.extraHistory[0], R=last&&S.result;
  const resumeNew = S.resume?`<div class="card">${cardHead(T('Tiếp tục bài đang làm','Continue where you left off'),'','',skillTile(null,'sm'))}<div class="font-semibold">${tx(EXAMS[S.resume.examId].title)}</div>${progressBar(Object.keys(S.resume.answers).length,S.resume.qids.length,{label:`${T('Câu','Question')} ${S.resume.idx+1}/${S.resume.qids.length}`})}<div>${btn(T('Tiếp tục','Resume'),{ic:'play-fill',action:'resume',full:m})}</div></div>`:'';
  const goalCard = `<div class="card">${cardHead(T('Mục tiêu','Goal'),'','',tile('target','default','sm'))}${S.onb.exam?`<div class="row">${chip(S.onb.exam.startsWith('ielts')?'IELTS':'TOEIC','accent')}<span class="font-semibold">${S.onb.target?T('Mục tiêu ','Target ')+S.onb.target:T('Chưa đặt điểm','No target yet')}</span></div><p class="text-sm text-muted">${S.onb.minutes?S.onb.minutes+T(' phút/ngày · ',' min/day · '):''}${T('Cần 1 bài thi thử để ước tính điểm hiện tại.','One mock test will estimate your current score.')}</p>`:empty('flag',T('Chưa đặt mục tiêu','No goal yet'),T('Đặt mục tiêu để nhận gợi ý chính xác hơn.','Set a goal for better suggestions.'),btn(T('Đặt mục tiêu','Set a goal'),{v:'secondary',size:'sm',action:'go',data:{to:'onboarding'}}),{color:'default'})}</div>`;
  const heroCard = (eyebrow,title,desc,actions,mood) => `<div class="card card--lg hero-result" style="padding-right:${m?'100px':'180px'};min-height:160px"><span class="eyebrow">${eyebrow}</span><div class="text-xl font-bold tracking-tight">${title}</div><p class="text-muted">${desc}</p><div class="row row--wrap">${actions}</div>${mascot({mood,size:m?90:150})}</div>`;
  if (R){
    const weakest=R.skills[0], recId=SKILLS[weakest.code].practice;
    return resumeNew+heroCard(T('Dựa trên bài đầu tiên của bạn','Based on your first set'),T(`Luyện tiếp “${tx(SKILLS[weakest.code].name)}”`,`Practice “${tx(SKILLS[weakest.code].name)}” next`),T(`Bài vừa làm: ${tx(EXAMS[R.examId].title)} — đúng ${rawLabel(R)}. Kỹ năng này thấp nhất (${weakest.c}/${weakest.n}).`,`Last set: ${tx(EXAMS[R.examId].title)} — ${rawLabel(R)} correct. This is your lowest skill (${weakest.c}/${weakest.n}).`),btn(T('Bắt đầu','Start'),{ic:'play-fill',action:'startExam',data:{id:recId}})+btn(T('Xem lại kết quả','Review result'),{v:'tertiary',action:'go',data:{to:'results'}}),'happy')
      +`<div class="grid ${m?'':'grid-2'}"><div class="card">${cardHead(T('Kỹ năng (từ 1 bài)','Skills (from 1 set)'))}<div class="list list--divided">${R.skills.slice(0,3).map(s=>`<div class="list-box-item">${meter(s.c,s.n,{label:tx(SKILLS[s.code].name),right:`${s.c}/${s.n}`,color:s.c/s.n<.5?'danger':s.c/s.n<1?'warning':'success',size:'sm'})}</div>`).join('')}</div><p class="text-xs text-muted">${T('Độ tin cậy tăng sau 3–5 bài.','Confidence grows after 3–5 sets.')}</p></div>${goalCard}</div>`;
  }
  return resumeNew+heroCard(T('Gợi ý cho người mới','For new learners'),T('Bắt đầu với một bài 5 phút','Start with a 5-minute set'),T('Pip cần 1 bài làm để tìm điểm mạnh, điểm yếu của bạn. Không tính giờ, có giải thích sau mỗi câu.','Pip needs one set to find your strengths and weak spots. Untimed, with an explanation after each question.'),btn(T('Bắt đầu: Reading Part 5 & 7','Start: Reading Part 5 & 7'),{ic:'play-fill',action:'startExam',data:{id:'toeic-r-part5'}})+btn(T('Xem tất cả bài','Browse all sets'),{v:'tertiary',action:'go',data:{to:'catalog'}}),'wave')
    +`<div class="grid ${m?'':'grid-2'}"><div class="card">${cardHead(T('Điểm yếu','Weak spots'),'','',tile('chart-column','default','sm'))}${empty('chart-column',T('Chưa có dữ liệu','No data yet'),T('Làm 1 bài để thấy kỹ năng nào cần luyện thêm.','Do one set to see which skills need work.'),'',{mood:'think'})}</div>${goalCard}</div>`;
}

/* ---------- Catalog ---------- */
function examCard(id){
  const ex=EXAMS[id], u=user();
  const locked = ex.tier==='registered'&&u.guest, premium=ex.tier==='premium', disabled = ex.comingSoon||premium, mock = ex.kind==='full_mock';
  const tint = ex.skill||'mock';
  return `<div class="card" style="gap:12px;padding:0;overflow:hidden;${disabled?'opacity:.72':''}">
    <div class="tint-band tint-${tint}" style="padding:16px 16px 12px;display:flex;align-items:flex-start;justify-content:space-between">${skillTile(ex.skill,'lg')}<div class="row gap-1">${ex.phase?phase(ex.phase):''}${chip(tx(KIND[ex.kind]),mock?'accent':'default',null,{size:'sm'})}</div></div>
    <div style="padding:0 16px;display:flex;flex-direction:column;gap:8px;flex:1"><div class="card__title">${tx(ex.title)}</div><div class="card__description" style="display:-webkit-box;-webkit-line-clamp:2;-webkit-box-orient:vertical;overflow:hidden">${tx(ex.desc)}</div>
    <div class="row row--wrap text-xs text-muted gap-3"><span class="row gap-1">${icon('clock',12)}${ex.minutes} ${T('phút','min')}</span><span class="row gap-1">${icon('list-check',12)}${ex.count} ${T('câu','Qs')}</span><span class="row gap-1">${icon('chart-column',12)}${diffLabel(ex.diff)}</span></div></div>
    <div class="row" style="padding:12px 16px;border-top:1px solid var(--separator)">${ex.comingSoon?chip(T('Sắp ra mắt','Coming soon'),'default','clock',{v:'tertiary'}):premium?chip(T('Premium · tương lai','Premium · future'),'warning','crown-diamond'):locked?chip(T('Cần tài khoản','Account needed'),'default','lock'):`<span class="text-xs text-muted">${mock?T('Chế độ thi · có giờ','Exam mode · timed'):T('Có giải thích từng câu','Explanations per question')}</span>`}<div class="grow"></div>
      ${btn(disabled?T('Chưa mở','Locked'):mock?T('Xem đề','View'):T('Bắt đầu','Start'),{v:mock||disabled?'tertiary':'primary',size:'sm',action:'openExam',data:{id},disabled,iconR:disabled?null:'chevron-right'})}</div>
  </div>`;
}
function rCatalog(){
  const c=S.catalog, st=viewState('catalog'), m=isM();
  const skillOpts = c.track==='toeic'?['listening','reading','writing']:['listening','reading','writing','speaking'];
  const search = `<div class="input-group" style="${m?'':'width:300px'}"><span class="input-group__prefix">${icon('magnifier',14)}</span><input class="input" id="cat-q" placeholder="${T('Tìm bài, Part, kỹ năng…','Search sets, parts, skills…')}" value="${esc(c.q)}" data-input="catQ" aria-label="${T('Tìm bài luyện','Search practice sets')}"></div>`;
  const header = `<div class="card card--lg tint-band tint-${c.track==='toeic'?'reading':'writing'}" style="flex-direction:row;align-items:center;gap:20px;overflow:hidden">${m?'':mascot({mood:'think',size:96})}<div class="col gap-1 grow"><span class="eyebrow">${c.track==='toeic'?'TOEIC Listening & Reading':'IELTS Academic'}</span><div class="text-xl font-bold tracking-tight">${T('Chọn một bài ngắn hoặc làm đề thi thử','Pick a quick set or take a mock test')}</div><p class="text-sm text-muted">${T('Bài ngắn bắt đầu ngay; đề thi thử có trang giới thiệu quy tắc.','Quick sets start immediately; mock tests show the rules first.')}</p></div></div>`;
  const filters = `<div class="col gap-3">
    <div class="row row--between row--wrap gap-3">${tabs(T('Kỳ thi','Exam'),[['toeic','TOEIC L&R'],['ielts','IELTS Academic']],c.track,'track',{full:m})}${m?'':search}</div>
    ${m?search:''}
    <div class="row row--between row--wrap gap-3">${tabs(T('Loại bài','Type'),[['all',T('Tất cả','All')],['short',T('Luyện ngắn','Quick')],['mock',T('Thi thử','Mock')]],c.kind,'kind',{size:'sm'})}
      <div class="toggle-group" role="group" aria-label="${T('Kỹ năng','Skill')}">${skillOpts.map(v=>`<button type="button" class="toggle" aria-pressed="${c.skill===v}" data-action="skill" data-v="${v}" data-fk="skill:${v}">${icon(SKILL_ICON[v],14)}${SKILL_AREA[v]}</button>`).join('')}</div></div>
  </div>`;
  if (st==='loading') return header+filters+`<div class="grid ${m?'':'grid-3'}">${[1,2,3,4,5,6].map(()=>`<div class="card">${sk(56,'56px',14)}${sk(16,'80%')}${sk(32)}${sk(12,'60%')}</div>`).join('')}</div>`;
  if (st==='error') return header+filters+alertBox('danger',T('Không tải được danh sách bài','Couldn’t load practice sets'),T('Có thể do kết nối mạng. Bài đang làm dở vẫn tiếp tục được từ Trang chủ.','Possibly a network issue. In-progress tests can still be resumed from Home.'),btn(T('Thử lại','Retry'),{v:'tertiary',size:'sm',ic:'arrows-rotate-right',action:'setState',data:{s:'default'}}));
  let ids = Object.keys(EXAMS).filter(id=>EXAMS[id].track===c.track)
    .filter(id=>c.kind==='all'||(c.kind==='mock'?EXAMS[id].kind==='full_mock':EXAMS[id].kind!=='full_mock'))
    .filter(id=>!c.skill||EXAMS[id].skill===c.skill)
    .filter(id=>!c.q||tx(EXAMS[id].title).toLowerCase().includes(c.q.toLowerCase()));
  if (st==='empty') ids=[];
  const personal = S.lib.personal?`<div class="card" style="flex-direction:row;align-items:center;gap:12px">${skillTile('personal')}<div class="grow"><div class="card__title">${tx(EXAMS[S.lib.personal].title)}</div><div class="row gap-1">${chip(T('Riêng tư · chỉ bạn thấy','Private · only you'),'default','lock',{size:'sm'})}${chip(T('Do AI tạo · bạn đã duyệt','AI-generated · approved by you'),'accent','sparkles',{size:'sm'})}</div></div>${btn(T('Luyện','Practice'),{size:'sm',ic:'play-fill',action:'startExam',data:{id:S.lib.personal}})}</div>`:'';
  return header+filters+personal+sectionTitle(c.kind==='mock'?T('Đề thi thử','Mock tests'):c.kind==='short'?T('Bài luyện ngắn','Quick sets'):T('Tất cả bài','All sets'),ids.length)+(ids.length?`<div class="grid ${m?'':'grid-3'}">${ids.map(examCard).join('')}</div>`
    : `<div class="card">${empty('magnifier',T('Chưa có bài phù hợp','No matching sets'),c.track==='toeic'&&c.skill==='writing'?T('TOEIC Listening & Reading không có phần Writing. TOEIC Speaking & Writing là định dạng tương lai.','TOEIC Listening & Reading has no Writing part. TOEIC Speaking & Writing is a future format.'):T('Thử bỏ bớt bộ lọc hoặc đổi từ khóa.','Try fewer filters or another keyword.'),btn(T('Xóa bộ lọc','Clear filters'),{v:'tertiary',ic:'xmark',action:'resetFilters'}),{mood:'think'})}</div>`)
    +`<button type="button" class="card card--press" data-action="go" data-to="library" data-fk="go:lib-cta" style="flex-direction:row;align-items:center;gap:14px">${tile('file-arrow-up','warning')}<span class="grow"><span class="card__title" style="display:block">${T('Tạo bài luyện từ tài liệu của bạn','Practice from your own material')} ${phase('P3')}</span><span class="card__description">${T('Tải PDF, AI tạo câu hỏi nháp, bạn duyệt trước khi luyện.','Upload a PDF, AI drafts questions, you approve before practicing.')}</span></span>${icon('chevron-right',16,'text-muted')}</button>`;
}

function rIntro(){
  const id=S.introExam, ex=EXAMS[id], m=isM(), mock=ex.mode==='mock';
  const rules = mock
    ? [['clock',T(`Tính giờ ${ex.minutes} phút`,`${ex.minutes}-minute timer`),T('Đồng hồ chạy trên máy chủ — thoát ra vẫn tiếp tục tính.','The timer runs on the server — it keeps going if you leave.')],['headphones',T('Âm thanh phát 1 lần','Audio plays once'),T('Không tua, không phát lại — giống phòng thi.','No seeking or replay — like the real exam.')],['eye-slash',T('Đáp án ẩn đến khi nộp','Answers hidden until you submit'),T('Giải thích và điểm hiển thị ngay sau khi nộp.','Explanations and scores appear right after submitting.')],['bookmark',T('Đánh dấu để xem lại','Flag to review'),T('Quay lại câu đã đánh dấu trước khi nộp.','Return to flagged questions before submitting.')]]
    : [['check',T('Kiểm tra từng câu','Check each answer'),T('Xem đúng/sai và giải thích ngay.','See right/wrong and the explanation instantly.')],['arrow-rotate-left',T('Nghe lại không giới hạn','Unlimited replay'),T('Transcript hiện sau khi trả lời.','Transcript appears after answering.')],['stopwatch',T('Không giới hạn thời gian','No time limit'),T('Có thể tạm dừng và quay lại.','Pause and come back anytime.')]];
  const sections = mock&&ex.track==='toeic' ? [['listening','Listening','Part 1–4',ex.demoNote?T('100 câu · 45 phút','100 Qs · 45 min'):T('5 câu','5 Qs')],['reading','Reading','Part 5–7',ex.demoNote?T('100 câu · 75 phút','100 Qs · 75 min'):T('5 câu','5 Qs')]] : [[ex.skill,ex.skill?SKILL_AREA[ex.skill]:'Mixed',tx(KIND[ex.kind]),ex.count+T(' câu',' Qs')]];
  const head = `<div class="card card--lg tint-band tint-${ex.skill||'mock'}"><div class="row row--wrap">${chip(ex.track.toUpperCase(),'accent')}${chip(tx(KIND[ex.kind]))}${chip(diffLabel(ex.diff))}</div><div class="col gap-1"><h2 class="text-2xl font-bold tracking-tight">${tx(ex.title)}</h2><p class="text-muted">${tx(ex.desc)}</p></div>
    <div class="grid grid-3" style="gap:8px">${[['clock',ex.minutes+T(' phút',' min'),T('Thời lượng','Duration')],['list-check',ex.count+T(' câu',' Qs'),T('Số câu','Questions')],['chart-column',diffLabel(ex.diff),T('Độ khó','Difficulty')]].map(([i,v,l])=>`<div class="card" style="padding:12px;gap:2px"><span class="text-xs text-muted row gap-1">${icon(i,12)}${l}</span><span class="font-semibold">${v}</span></div>`).join('')}</div></div>`;
  const body = head+(ex.demoNote?alertBox('accent',T('Prototype','Prototype'),T('Đề đầy đủ dùng lại 10 câu demo của Mini Mock để minh họa luồng.','The full test reuses the 10 Mini Mock demo questions to illustrate the flow.')):'')+
    `<div class="card">${cardHead(T('Cấu trúc đề','Test structure'))}<div class="list list--divided">${sections.map(([s,a,b,c])=>`<div class="list-box-item">${skillTile(s,'sm')}<span class="grow"><span class="list-box-item__label">${a}</span><span class="list-box-item__description">${b}</span></span><span class="text-sm text-muted tnum">${c}</span></div>`).join('')}</div></div>
     <div class="card">${cardHead(mock?T('Quy tắc chế độ thi','Exam-mode rules'):T('Chế độ luyện tập','Practice mode'),chip(mock?'Mock':'Practice',mock?'warning':'success',null,{size:'sm'}))}<div class="list list--divided">${rules.map(([i,t,d])=>`<div class="list-box-item">${tile(i,mock?'warning':'success','sm')}<span class="grow"><span class="list-box-item__label">${t}</span><span class="list-box-item__description">${d}</span></span></div>`).join('')}</div></div>`;
  if (m) return body;
  return `<div class="grid grid-main"><div class="col gap-4">${body}</div><div class="card card--lg" style="position:sticky;top:0;align-items:center;text-align:center">${mascot({mood:'happy',size:120})}<h3 class="text-lg font-semibold">${T('Sẵn sàng chưa?','Ready?')}</h3><p class="text-sm text-muted">${T('Tự lưu sau mỗi câu trả lời. Có thể tiếp tục trên điện thoại.','Autosaves after every answer. Continue on your phone anytime.')}</p>${introCta()}</div></div>`;
}
function introCta(){ const id=S.introExam, ex=EXAMS[id], u=user(), m=isM();
  if (ex.tier==='registered'&&u.guest) return btn(T('Tạo tài khoản để làm đề','Create an account to start'),{size:'lg',action:'convert',full:true,ic:'lock'});
  if (S.resume&&S.resume.examId===id) return `<div class="col gap-2" style="width:100%">${btn(`${T('Tiếp tục · câu','Resume · Q')} ${S.resume.idx+1}/${S.resume.qids.length}`,{size:'lg',ic:'play-fill',action:'resume',full:true})}${m?'':btn(T('Làm lại từ đầu','Start over'),{v:'ghost',full:true,action:'startExam',data:{id}})}</div>`;
  return btn(ex.mode==='mock'?T('Bắt đầu thi thử','Start mock test'):T('Bắt đầu luyện','Start practice'),{size:'lg',ic:'play-fill',action:'startExam',data:{id},full:true}); }
