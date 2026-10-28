/* Learning screens: home (dashboard) + shared history rows. Practice hub/setup live in screens-practice.js */
const STATUS = {completed:[['Hoàn thành','Completed'],'success'],in_progress:[['Đang làm','In progress'],'accent'],abandoned:[['Bỏ dở','Abandoned'],'default']};

function weakSkillsList(limit=3,{buttons=true}={}){
  return `<div class="list list--divided">${MASTERY.slice(0,limit).map(([code,v])=>`<div class="list-box-item"><div class="grow">${meter(v*100,100,{label:tx(SKILLS[code].name),right:Math.round(v*100)+'%',color:v<.5?'danger':v<.65?'warning':'success',size:'sm'})}</div>${buttons?btn(T('Luyện','Practice'),{v:'secondary',size:'sm',action:'startExam',data:{id:SKILLS[code].practice}}):''}</div>`).join('')}</div>`;
}
function historyRow(h){
  const ex=EXAMS[h.exam], st=STATUS[h.status];
  return `<button type="button" class="list-box-item" data-action="openHistory" data-exam="${h.exam}" data-status="${h.status}" data-fk="hist:${h.exam}:${h.date}">${skillTile(ex.skill,'sm')}<span class="grow" style="min-width:0"><span class="list-box-item__label truncate">${tx(ex.title)}</span><span class="list-box-item__description">${fmtDate(h.date)} · ${h.mode==='mock'?T('Thi thử','Mock'):T('Luyện tập','Practice')}${h.mins?` · ${h.mins} ${T('phút','min')}`:''}</span></span><span class="col gap-1" style="align-items:flex-end"><span class="tnum font-semibold">${tx(h.score)}${h.est?` <span class="text-xs text-muted font-medium">${T('ước tính','est.')}</span>`:''}</span>${chip(tx(st[0]),st[1],null,{size:'sm'})}</span></button>`;
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
  const plan = `<div class="card card--lg hero-result" style="padding-right:${m?(R?'16px':'110px'):'190px'};min-height:${m?150:170}px">
      <span class="eyebrow">${T('Kế hoạch hôm nay','Today’s plan')}</span>
      <div class="text-xl font-bold tracking-tight">${R?T('Hoàn thành phần Reading của Test 01, rồi luyện Part 5','Finish Test 01 Reading, then practise Part 5'):T('Luyện Part 5: giới từ & từ loại','Practise Part 5: prepositions & word forms')}</div>
      <div class="row row--wrap gap-2">${chip(T('≈ 20 phút','≈ 20 min'),'default','clock')}${chip(T('Vì: Giới từ là kỹ năng yếu nhất','Because: prepositions are your weakest skill'),'accent','target')}</div>
      ${R?`<div class="plan-resume">${skillTile(rex.skill,'sm')}<div class="grow" style="min-width:0">${progressBar(answeredOf(R),R.qids.length,{label:m?resumeLabel(R):`${tx(rex.title)} · ${resumeLabel(R)}`,right:R.remaining!=null?`${T('còn','left')} ${fmt(R.remaining)}`:'',size:'sm'})}</div></div>`:''}
      <div class="row row--wrap">${btn(R?T('Tiếp tục bài thi thử','Resume mock test'):T('Bắt đầu','Start'),{ic:'play-fill',action:R?'resume':'startExam',data:R?{}:{id:'toeic-r-part5'},size:'lg',full:m&&!!R})}${R&&!m?btn(T('Sau đó: Part 5','Then: Part 5'),{v:'tertiary',size:'lg',action:'openSetup',data:{id:'toeic-test-01',part:'P5'}}):''}</div>
      ${m&&R?'':mascot({mood:'wave',size:m?100:160})}
    </div>`;
  const kpis = `<div class="grid ${m?'grid-2':'grid-3'}" style="${m?'gap:10px':''}">
    ${stat(T('Điểm ước tính','Estimated score'),'600',{small:'/ 990',right:trend('30'),count:600,foot:m?'':`<span class="text-xs text-muted">${T('Mục tiêu 750 · còn 150 điểm','Goal 750 · 150 pts to go')}</span>`})}
    ${stat(T('Học tuần này','This week'),'95',{small:T('/ 150 phút','/ 150 min'),foot:progressBar(95,150,{size:'sm',aria:T('Phút học tuần này','Minutes this week')}),count:95})}
    ${m?'':stat(T('Chính xác 7 ngày','7-day accuracy'),'68%',{right:trend('5%'),foot:`<span class="text-xs text-muted">${T('42 câu trong 7 ngày','42 questions in 7 days')}</span>`})}
  </div>`;
  const weak = `<div class="card">${cardHead(T('Kỹ năng cần luyện','Skills to practice'),btn(T('Tất cả','All'),{v:'ghost',size:'sm',iconR:'chevron-right',action:'go',data:{to:'progress'}}))}${weakSkillsList()}</div>`;
  const recent = `<div class="card">${cardHead(T('Hoạt động gần đây','Recent activity'),btn(T('Lịch sử','History'),{v:'ghost',size:'sm',iconR:'chevron-right',action:'go',data:{to:'progress'}}))}<div class="list list--flush">${HISTORY.slice(1,4).map(historyRow).join('')}</div></div>`;
  if (m) return guestBanner+plan+kpis+weak+recent;
  return guestBanner+plan+kpis+`<div class="grid grid-2 grid--stretch">${recent}${weak}</div>`;
}
function homeEmpty(){
  const m=isM(), last=S.extraHistory[0], R=last&&S.result;
  const resumeNew = S.resume?`<div class="card">${cardHead(T('Tiếp tục bài đang làm','Continue where you left off'),'','',skillTile(EXAMS[S.resume.examId].skill,'sm'))}<div class="font-semibold">${tx(EXAMS[S.resume.examId].title)}</div>${progressBar(answeredOf(S.resume),S.resume.qids.length,{label:resumeLabel(S.resume)})}<div>${btn(T('Tiếp tục','Resume'),{ic:'play-fill',action:'resume',full:m})}</div></div>`:'';
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

