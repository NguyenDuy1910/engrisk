/* "Luyện đề" — practice hub (catalog), test setup (exam-intro), player dispatcher. */
const PART_MIN = {P1:4,P2:9,P3:18,P4:14,P5:11,P6:8,P7:56,R1:20,R2:20,R3:20,L1:7,L2:7,L3:8,L4:8,PX:8};
const testStats = id => { const h=[...S.extraHistory,...HISTORY].filter(x=>x.exam===id); const done=h.filter(x=>x.status==='completed'); const best=done.map(x=>+String(tx(x.score)).split('/')[0]).filter(n=>!isNaN(n)).sort((a,b)=>b-a)[0];
  return {count:done.length,best,inProgress:h.some(x=>x.status==='in_progress')||(S.resume&&S.resume.examId===id)}; };
const accColor = v => v<.55?'danger':v<.7?'warning':'success';

/* ---------- Hub ---------- */
function testCard(id){
  const ex=EXAMS[id], u=user(), st=testStats(id), locked=ex.tier==='registered'&&u.guest, premium=ex.tier==='premium';
  const secs = ex.sections ? ex.sections.map(s=>`<span class="row gap-1">${icon(s.key==='L'?'headphones':'book-open',12)}${SECTION[s.key]} · ${s.minutes}′</span>`).join('') : '';
  return `<div class="card test-card ${premium?'is-locked':''}">
    <div class="test-card__top tint-band tint-${ex.skill||'mock'}"><div class="col gap-1"><span class="eyebrow">${ex.track==='toeic'?'TOEIC L&R':ex.skill==='listening'?'IELTS Listening':'IELTS Academic Reading'}</span><div class="text-lg font-semibold tracking-tight">${tx(ex.title)}</div></div>${skillTile(ex.skill,'lg')}</div>
    <div class="test-card__body"><div class="row row--wrap text-xs text-muted gap-3">${secs}<span class="row gap-1">${icon('list-check',12)}${ex.count} ${T('câu','Qs')}</span><span class="row gap-1">${icon('chart-column',12)}${diffLabel(ex.diff)}</span></div>
      <div class="row row--wrap gap-2">${st.inProgress?chip(T('Đang làm dở','In progress'),'accent','clock',{size:'sm'}):''}${st.count?chip(`${T('Đã làm','Taken')} ${st.count}× · ${T('tốt nhất','best')} ${st.best}`,'success','medal',{size:'sm'}):chip(T('Chưa làm','Not taken'),'default',null,{size:'sm'})}</div></div>
    <div class="test-card__foot">${premium?chip(T('Premium · tương lai','Premium · future'),'warning','crown-diamond'):locked?chip(T('Cần tài khoản','Account needed'),'default','lock'):`<span class="text-xs text-muted">${T('Thi thử hoặc luyện từng Part','Full mock or part-by-part')}</span>`}<div class="grow"></div>${btn(premium?T('Chưa mở','Locked'):T('Làm đề','Open'),{size:'sm',v:premium?'tertiary':'primary',action:'openExam',data:{id},disabled:premium,iconR:premium?null:'chevron-right'})}</div></div>`;
}
function partTile(key,examId){
  const P=ALL_PARTS[key], v=PART_STATS[key];
  return `<button type="button" class="card card--press part-tile" data-action="openSetup" data-id="${examId}" data-part="${key}" data-fk="part:${key}">
    <div class="row row--between"><span class="part-tile__num">${key.replace('P','')}</span>${chip(P.section==='L'?'Listening':'Reading',P.section==='L'?'accent':'success',P.section==='L'?'headphones':'book-open',{size:'sm'})}</div>
    <div><div class="font-semibold">${tx(P.name).replace(/^Part \d · /,'')}</div><div class="text-xs text-muted">${T('Câu','Questions')} ${P.range} · ${P.real} ${T('câu/đề','per test')}</div></div>
    ${meter(Math.round(v*100),100,{label:T('Độ chính xác','Accuracy'),right:Math.round(v*100)+'%',color:accColor(v),size:'sm'})}</button>`;
}
function typeTile(code){
  const s=SKILLS[code], v=PART_STATS[s.part]??.6;
  return `<button type="button" class="card card--press part-tile" data-action="openSetup" data-id="${s.practice}" data-part="${s.part}" data-fk="type:${code}">
    <div class="row row--between">${skillTile(code.startsWith('listening')?'listening':'reading','sm')}${chip(tx(ALL_PARTS[s.part].name),'default',null,{size:'sm'})}</div>
    <div class="font-semibold">${tx(s.name)}</div>${meter(Math.round(v*100),100,{label:T('Độ chính xác','Accuracy'),right:Math.round(v*100)+'%',color:accColor(v),size:'sm'})}</button>`;
}
function quickCard(id){
  const ex=EXAMS[id], u=user(), locked=ex.tier==='registered'&&u.guest;
  return `<div class="card" style="flex-direction:row;align-items:center;gap:12px">${skillTile(ex.skill)}<div class="grow" style="min-width:0"><div class="card__title truncate">${tx(ex.title)} ${ex.phase?phase(ex.phase):''}</div><div class="text-xs text-muted">${ex.minutes} ${T('phút','min')} · ${ex.count} ${T('câu','Qs')} · ${diffLabel(ex.diff)}</div></div>${locked?chip(T('Cần tài khoản','Account needed'),'default','lock',{size:'sm'}):''}${btn(T('Bắt đầu','Start'),{size:'sm',v:'secondary',action:'openExam',data:{id},ic:'play-fill'})}</div>`;
}
function rCatalog(){
  const c=S.catalog, st=viewState('catalog'), m=isM(), ielts=c.track==='ielts';
  const match = id => !c.q || tx(EXAMS[id].title).toLowerCase().includes(c.q.toLowerCase());
  const search = `<div class="input-group" style="${m?'':'width:300px'}"><span class="input-group__prefix">${icon('magnifier',14)}</span><input class="input" id="cat-q" placeholder="${T('Tìm đề, Part, dạng câu…','Search tests, parts, types…')}" value="${esc(c.q)}" data-input="catQ" aria-label="${T('Tìm đề','Search tests')}"></div>`;
  const head = `<div class="col gap-3"><div class="row row--between row--wrap gap-3">${tabs(T('Kỳ thi','Exam'),[['toeic','TOEIC L&R'],['ielts','IELTS Academic']],c.track,'track',{full:m})}${m?'':search}</div>${m?search:''}
    ${tabs(T('Loại','Type'),[['all',T('Tất cả','All')],['mock',T('Đề đầy đủ','Full tests')],['part',ielts?T('Dạng câu hỏi','Question types'):T('Theo Part','By part')],['short',T('Bài ngắn','Quick sets')]],c.kind,'kind',{size:'sm'})}</div>`;
  if (st==='loading') return head+`<div class="grid ${m?'':'grid-3'}">${[1,2,3].map(()=>`<div class="card">${sk(80,'100%',12)}${sk(14,'70%')}${sk(12,'50%')}</div>`).join('')}</div>`;
  if (st==='error') return head+alertBox('danger',T('Không tải được thư viện đề','Couldn’t load the test library'),T('Bài đang làm dở vẫn tiếp tục được từ Trang chủ.','In-progress tests can still be resumed from Home.'),btn(T('Thử lại','Retry'),{v:'tertiary',size:'sm',ic:'arrows-rotate-right',action:'setState',data:{s:'default'}}));
  const tests = (ielts?['ielts-l-test-01','ielts-r-test-01']:['toeic-test-01','toeic-test-02','toeic-test-03']).filter(match);
  const quick = Object.keys(EXAMS).filter(id=>EXAMS[id].track===c.track&&EXAMS[id].kind==='practice_set').filter(match);
  const R=S.resume&&EXAMS[S.resume.examId].track===c.track?S.resume:null;
  const resume = R?`<div class="card resume-strip">${skillTile(EXAMS[R.examId].skill)}<div class="grow"><div class="font-semibold">${tx(EXAMS[R.examId].title)}</div><div class="text-xs text-muted">${T('Đang làm dở','In progress')} · ${R.sections?SECTION[R.sec]:''} · ${T('câu','Q')} ${numLabel(Q[R.focus])} · ${R.remaining!=null?`${T('còn','left')} ${fmt(R.remaining)}`:''}</div></div>${btn(T('Tiếp tục','Resume'),{ic:'play-fill',action:'resume',size:'sm'})}</div>`:'';
  const show = k => c.kind==='all'||c.kind===k;
  let out = head+resume;
  if (st==='empty') return out+`<div class="card">${empty('magnifier',T('Không có đề phù hợp','No matching tests'),T('Thử từ khóa khác.','Try another keyword.'),btn(T('Xóa tìm kiếm','Clear search'),{v:'tertiary',action:'resetFilters'}),{mood:'think'})}</div>`;
  if (show('mock')) out += sectionTitle(T('Đề thi thử đầy đủ','Full practice tests'),tests.length,`<span class="text-xs text-muted">${ielts?T('Giao diện IELTS trên máy tính','Computer-delivered layout'):T('Đúng cấu trúc 7 Part · 200 câu','7 parts · 200 questions')}</span>`)+(tests.length?`<div class="grid ${m?'':'grid-3'}">${tests.map(testCard).join('')}</div>`:'');
  if (show('part')) out += ielts
    ? sectionTitle(T('Luyện theo dạng câu hỏi','Practice by question type'),8,`<span class="text-xs text-muted">${T('Mở đúng phần chứa dạng câu đó','Opens the part that contains it')}</span>`)+`<div class="grid ${m?'grid-2':'grid-4'}">${['reading.tfng','reading.completion','reading.headings','reading.matching_features','listening.form','listening.map','listening.multi','listening.notes'].map(typeTile).join('')}</div>`
    : sectionTitle(T('Luyện theo Part','Practice by part'),7,`<span class="text-xs text-muted">${T('Độ chính xác của bạn ở mỗi Part','Your accuracy per part')}</span>`)+`<div class="grid ${m?'grid-2':'grid-4'}">${Object.keys(PARTS).map(p=>partTile(p,'toeic-test-01')).join('')}</div>`;
  if (show('short')) out += sectionTitle(T('Bài luyện ngắn','Quick sets'),quick.length+(S.lib.personal?1:0))+`<div class="grid ${m?'':'grid-2'}">${quick.map(quickCard).join('')}${S.lib.personal?quickCard(S.lib.personal):''}</div>`;
  return out+`<button type="button" class="card card--press" data-action="go" data-to="library" data-fk="go:lib-cta" style="flex-direction:row;align-items:center;gap:14px">${tile('file-arrow-up','warning')}<span class="grow"><span class="card__title" style="display:block">${T('Tạo bài luyện từ tài liệu của bạn','Practice from your own material')} ${phase('P3')}</span><span class="card__description">${T('Tải PDF, AI tạo câu hỏi nháp, bạn duyệt trước khi luyện.','Upload a PDF, AI drafts questions, you approve before practicing.')}</span></span>${icon('chevron-right',16,'text-muted')}</button>`;
}

/* ---------- Setup ---------- */
function setupFor(id,part){
  const ex=EXAMS[id], full=ex.kind==='full_mock';
  return {examId:id,mode:part||!full?'practice':'mock',parts:part?[part]:examParts(ex),limit:'auto',instant:true,replay:true,transcript:true,soundOk:false,sample:false};
}
const setupMinutes = su => { const ex=EXAMS[su.examId]; if (su.mode==='mock') return ex.minutes; if (su.limit==='none') return null; if (su.limit==='auto') return su.parts.reduce((a,p)=>a+(PART_MIN[p]||5),0); return +su.limit; };
function rIntro(){
  const su=S.setup||(S.setup=setupFor(S.introExam)), ex=EXAMS[su.examId], m=isM(), u=user(), full=ex.kind==='full_mock', mock=su.mode==='mock';
  const parts=examParts(ex), hasL=parts.some(p=>ALL_PARTS[p].section==='L'), selL=su.parts.some(p=>ALL_PARTS[p].section==='L');
  const demoN = examQids(ex,mock?parts:su.parts).length, realN = (mock?parts:su.parts).reduce((a,p)=>a+(ALL_PARTS[p].real||0),0)||demoN;
  const structure = ex.sections ? ex.sections.map(s=>`<div class="struct"><div class="row gap-2">${skillTile(s.key==='L'?'listening':'reading','sm')}<b>${SECTION[s.key]}</b><span class="text-muted text-sm">· ${s.minutes} ${T('phút','min')}${s.paced?' · '+T('theo audio','audio-paced'):''}</span></div><div class="row row--wrap gap-1">${s.parts.map(p=>chip(`${p.replace('P','Part ').replace(/^R(\d)/,'Passage $1').replace(/^L(\d)/,'Part $1')} · ${ALL_PARTS[p].real}`,'default',null,{size:'sm'})).join('')}</div></div>`).join('') : '';
  const header = `<div class="card card--lg tint-band tint-${ex.skill||'mock'}"><div class="row row--wrap gap-1">${chip(ex.track.toUpperCase(),'accent')}${chip(tx(KIND[ex.kind]))}${chip(diffLabel(ex.diff))}</div><h2 class="text-2xl font-bold tracking-tight">${tx(ex.title)}</h2><p class="text-muted">${tx(ex.desc)}</p>${structure?`<div class="grid ${m?'':'grid-2'}" style="gap:8px">${structure}</div>`:''}</div>`;
  const modeSel = full ? `<div class="card"><h3 class="card__title">${T('Chọn cách làm','How do you want to practise?')}</h3><div class="grid ${m?'':'grid-2'}" role="radiogroup" aria-label="${T('Chế độ','Mode')}" style="gap:10px">
      ${[['mock','stopwatch',T('Thi thử','Full mock test'),T('Toàn bộ đề, đúng giờ thi, audio phát một lần, không tạm dừng. Đáp án và điểm ước tính sau khi nộp.','Whole test, real timing, audio plays once, no pause. Answers and estimated score after submitting.')],['practice','sliders',T('Luyện tập','Practice'),T('Chọn Part, tự đặt thời gian, kiểm tra từng trang, nghe lại, đổi tốc độ, xem transcript.','Pick parts, set your own time, check each page, replay, change speed, read transcripts.')]].map(([v,i,t,d])=>`<button type="button" class="choice mode-card" role="radio" aria-checked="${su.mode===v}" data-action="suMode" data-v="${v}" data-fk="su:${v}">${tile(i,su.mode===v?'accent':'default')}<span class="grow"><span class="choice__title">${t}</span><span class="choice__desc">${d}</span></span></button>`).join('')}</div></div>` : '';
  const partPick = !mock ? `<div class="card">${cardHead(T('Chọn phần muốn luyện','Choose parts'),`<span class="text-sm text-muted">${su.parts.length}/${parts.length}</span>`)}
      ${(ex.sections||[{key:ALL_PARTS[parts[0]].section,parts}]).map(s=>{ const allOn=s.parts.every(p=>su.parts.includes(p));
        return `<div class="part-pick"><label class="checkbox part-pick__sec"><input type="checkbox" data-input="suSection" data-v="${s.parts.join(',')}" ${allOn?'checked':''}><span class="checkbox__control">${icon('check',11)}</span><b>${SECTION[s.key]}</b><span class="text-xs text-muted">${T('chọn cả phần','select all')}</span></label>
          ${s.parts.map(p=>{ const P=ALL_PARTS[p], v=PART_STATS[p], weakest=p===s.parts.slice().sort((a,b)=>(PART_STATS[a]??1)-(PART_STATS[b]??1))[0], demo=examQids(ex,[p]).length;
            return `<label class="part-row"><span class="checkbox"><input type="checkbox" data-input="suPart" data-v="${p}" ${su.parts.includes(p)?'checked':''}><span class="checkbox__control">${icon('check',11)}</span></span><span class="part-row__tag">${p.replace('P','Part ').replace(/^R(\d)/,'P$1').replace(/^L(\d)/,'Part $1')}</span><span class="grow" style="min-width:0"><span class="block font-medium truncate">${P.short}</span><span class="text-xs text-muted">${P.real?`${P.real} ${T('câu','Qs')} · `:''}${T('demo','demo')} ${demo} · ~${PART_MIN[p]} ${T('phút','min')}</span></span>${v!=null?`<span class="part-row__acc">${meter(Math.round(v*100),100,{right:Math.round(v*100)+'%',color:accColor(v),size:'sm'})}</span>`:''}${weakest&&v!=null?chip(T('Yếu nhất','Weakest'),'warning',null,{size:'sm'}):''}</label>`; }).join('')}</div>`; }).join('')}
      ${!su.parts.length?`<span class="field-error">${T('Chọn ít nhất 1 phần.','Select at least one part.')}</span>`:''}</div>
    <div class="card">${cardHead(T('Thời gian & hỗ trợ','Timing & aids'))}
      <div class="textfield"><span class="label">${T('Giới hạn thời gian','Time limit')}</span>${tabs(T('Giới hạn thời gian','Time limit'),[['none',T('Không giới hạn','No limit')],['auto',`${T('Theo đề','Exam pace')} · ${su.parts.reduce((a,p)=>a+(PART_MIN[p]||5),0)}′`],['15','15′'],['30','30′'],['45','45′']],su.limit,'suLimit',{size:'sm'})}<span class="description">${T('“Theo đề” = thời gian khuyến nghị theo tỉ lệ đề thật cho các phần đã chọn.','“Exam pace” = recommended time for the selected parts at real-test pace.')}</span></div>
      <div class="list list--divided">${[['instant','check',T('Kiểm tra đáp án từng trang','Check answers page by page'),T('Xem đúng/sai, giải thích và bằng chứng ngay.','See right/wrong, explanations and evidence immediately.'),true],['replay','arrow-rotate-left',T('Nghe lại & đổi tốc độ','Replay & speed'),T('Tua lại 5 giây, 0.75× – 1.25×.','Back 5 s, 0.75× – 1.25×.'),selL],['transcript','file-text',T('Transcript đồng bộ sau khi kiểm tra','Synced transcript after checking'),T('Bấm vào câu để nghe lại đoạn đó.','Click a line to replay from there.'),selL]].filter(r=>r[4]).map(([k,i,t,d])=>`<div class="list-box-item">${tile(i,'default','sm')}<span class="grow"><span class="list-box-item__label">${t}</span><span class="list-box-item__description">${d}</span></span>${switchEl(su[k],'suTool:'+k,t).replace('data-action="suTool:'+k+'"',`data-action="suTool" data-v="${k}"`)}</div>`).join('')}</div></div>`
  : `<div class="card">${cardHead(T('Quy tắc phòng thi','Exam rules'),chip('Mock','warning',null,{size:'sm'}))}<div class="list list--divided">${(ex.track==='toeic'
      ? [['headphones',T('Listening chạy theo một bản ghi liên tục ~45 phút','Listening follows one continuous ~45-minute recording'),T('Không tạm dừng, không phát lại. Bạn vẫn xem/sửa được các câu Listening khác trong lúc nghe.','No pause or replay. You can still view and change other Listening answers while it plays.')],['clock',T('Reading 75 phút, bắt đầu ngay sau Listening','Reading: 75 minutes, right after Listening'),T('Tự phân bổ thời gian giữa Part 5, 6, 7.','Allocate your own time across Parts 5–7.')],['layout-cells-large',T('Tô đáp án trên phiếu trả lời','Mark answers on the answer sheet'),T('Giống bài thi giấy: chọn ở câu hỏi hoặc trực tiếp trên phiếu.','Like the paper test: answer in the question or directly on the sheet.')],['pencil',T('Không ghi chú lên đề','No notes in the test book'),T('Highlight/ghi chú chỉ có ở chế độ Luyện tập, đúng quy định TOEIC.','Highlights/notes are practice-only, matching TOEIC rules.')]]
      : [['headphones',T('Audio phát một lần, có thời gian xem trước câu hỏi','Audio plays once, with time to read questions first'),T('Gõ đáp án trực tiếp; sai chính tả là sai. 2 phút kiểm tra cuối bài.','Type answers directly; misspellings are wrong. 2 minutes to check at the end.')],['clock',T('Đồng hồ hiện phút còn lại, đổi màu ở 10 và 5 phút cuối','Timer shows minutes left; warns at 10 and 5 minutes'),''],['pencil',T('Highlight & ghi chú như máy thi thật','Highlight & notes like the real test'),T('Bôi đen văn bản → Highlight / Ghi chú.','Select text → Highlight / Note.')],['eye-slash',T('Nút “Ẩn” che màn hình khi cần','“Hide” covers the screen when needed'),T('Đồng hồ vẫn chạy.','The timer keeps running.')]]
    ).filter(r=>ex.skill!=='reading'||r[0]!=='headphones').map(([i,t,d])=>`<div class="list-box-item">${tile(i,'warning','sm')}<span class="grow"><span class="list-box-item__label">${t}</span>${d?`<span class="list-box-item__description">${d}</span>`:''}</span></div>`).join('')}</div>
    ${ex.track==='ielts'&&m?alertBox('accent',T('Nên làm đề IELTS trên máy tính','Take IELTS mocks on a computer'),T('Bài thi thật trên máy tính; điện thoại phù hợp để luyện từng dạng câu.','The real test is on computer; phones suit question-type practice.'),'',{ic:'display',flat:true}):''}</div>`;
  const sound = (mock?hasL:selL) ? `<div class="card">${cardHead(T('Kiểm tra âm thanh','Sound check'),su.soundOk?chip(T('Đã kiểm tra','Checked'),'success','check',{size:'sm'}):'','',tile('headphones','default','sm'))}<div class="row row--wrap gap-3">${btn(su.sample?T('Đang phát mẫu…','Playing sample…'):T('Phát âm thanh mẫu','Play sample'),{v:'tertiary',size:'sm',ic:su.sample?'pause-fill':'play-fill',action:'suSample'})}<label class="volume">${icon('volume',14)}<input type="range" min="0" max="100" value="80" aria-label="${T('Âm lượng','Volume')}"></label><label class="checkbox"><input type="checkbox" data-input="suSoundOk" ${su.soundOk?'checked':''}><span class="checkbox__control">${icon('check',11)}</span>${T('Tôi nghe rõ','I can hear clearly')}</label></div>${mock&&!su.soundOk?`<span class="description">${T('Nên kiểm tra trước — Listening không thể phát lại trong chế độ thi.','Check first — Listening cannot be replayed in exam mode.')}</span>`:''}</div>` : '';
  const hist = [...S.extraHistory,...HISTORY].filter(h=>h.exam===su.examId);
  const history = `<div class="card">${cardHead(T('Lịch sử làm đề này','Your attempts'),`<span class="text-xs text-muted">${hist.length}</span>`)}${hist.length?`<div class="list">${hist.map(historyRow).join('')}</div>`:`<p class="text-sm text-muted">${T('Chưa có lần làm nào. Kết quả từng lần sẽ hiện ở đây để so sánh.','No attempts yet. Each attempt will appear here for comparison.')}</p>`}</div>`;
  const mins=setupMinutes(su);
  const summary = `<div class="card card--lg setup-summary"><h3 class="card__title">${T('Tóm tắt','Summary')}</h3>
    <dl class="kv"><dt>${T('Chế độ','Mode')}</dt><dd>${mock?T('Thi thử','Mock test'):T('Luyện tập','Practice')}</dd><dt>${T('Phần','Parts')}</dt><dd>${mock?T('Toàn bộ đề','Whole test'):su.parts.length+' / '+parts.length}</dd><dt>${T('Số câu','Questions')}</dt><dd>${realN} <span class="text-xs text-muted">(${T('demo','demo')} ${demoN})</span></dd><dt>${T('Thời gian','Time')}</dt><dd>${mins?mins+' '+T('phút','min'):T('Không giới hạn','No limit')}</dd>${!mock?`<dt>${T('Hỗ trợ','Aids')}</dt><dd>${[su.instant&&T('Kiểm tra','Check'),selL&&su.replay&&T('Nghe lại','Replay'),selL&&su.transcript&&'Transcript'].filter(Boolean).join(' · ')||'—'}</dd>`:''}</dl>
    ${setupCta(su)}</div>`;
  if (m) return header+modeSel+partPick+sound+history;
  return `<div class="grid grid-main"><div class="col gap-4">${header}${modeSel}${partPick}${sound}${history}</div><div class="col gap-4" style="position:sticky;top:0">${summary}${mascot({mood:'happy',size:100,cls:'setup-pip'})}</div></div>`;
}
function setupCta(su){
  const ex=EXAMS[su.examId], u=user(), m=isM();
  if (ex.tier==='registered'&&u.guest) return btn(T('Tạo tài khoản để làm đề','Create an account to start'),{size:'lg',action:'convert',full:true,ic:'lock'});
  const R=S.resume&&S.resume.examId===su.examId?S.resume:null, resumeFirst=R&&su.mode===R.mode;
  const start=btn(su.mode==='mock'?(R?T('Làm lại từ đầu','Start over'):T('Bắt đầu thi thử','Start mock test')):T('Bắt đầu luyện','Start practice'),{size:'lg',ic:'play-fill',action:'suStart',full:true,disabled:su.mode==='practice'&&!su.parts.length,v:resumeFirst?'tertiary':'primary'});
  const resume=R?btn(`${T('Tiếp tục bài đang làm · câu','Resume in-progress · Q')} ${numLabel(Q[R.focus])}`,{size:'lg',ic:'play-fill',action:'resume',full:true,v:resumeFirst?'primary':'tertiary'}):'';
  return R?`<div class="col gap-2" style="width:100%">${resumeFirst?resume+(m?'':start):start+(m?'':resume)}</div>`:start;
}
const introCta = () => setupCta(S.setup||(S.setup=setupFor(S.introExam)));

/* ---------- Player dispatcher ---------- */
function rExam(){
  if (!S.exam) S.exam=newAttempt('toeic-test-01');
  /* a mock that crossed a section boundary while the learner was away resumes on the transition dialog */
  if (S.exam.phase==='transition'&&!S.modal) S.modal={type:'section'};
  return S.exam.layout==='ielts' ? rIeltsPlayer() : rToeicPlayer();
}
