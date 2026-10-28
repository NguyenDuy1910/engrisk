/* Community contribution (contribute) + moderation queue (moderation).
 * Contract with app.js: communityInitial(), rContribute(), rModeration(),
 * COMMUNITY_ACTIONS (merged into A), communityChange(el,key)/communityInput(el,key) → true when handled.
 * Cross-module: REVIEW_COMMENTS (read by the Studio editor in contributor mode), A.modOpen({id}). */

/** Reviewer comments per content item id. q = question number inside the set (1..N, 0 = general).
 *  Shape: { [itemId]: [{q, field:'stem'|'options'|'explanation'|'audio'|'general', by:PEOPLE key, text:[vi,en], resolved:boolean, at:'YYYY-MM-DD'}] }.
 *  A comment also counts as resolved when its index is listed in S.content item.resolved (set by the Studio editor).
 *  Re-seeded by communityInitial() so “Reset prototype” restores it. */
const REVIEW_COMMENTS = {};
const REVIEW_SEED = {
  'cd-p7-emails':[
    {q:3,field:'options',by:'thao',at:'2026-10-26',resolved:false,text:['Phương án B và D đều có thể đúng vì e-mail nhắc cả “Monday” và “next week”. Sửa để chỉ còn một đáp án đúng.','Options B and D can both be argued: the e-mail mentions both “Monday” and “next week”. Revise so only one answer is correct.']},
    {q:6,field:'explanation',by:'thao',at:'2026-10-26',resolved:false,text:['Thiếu giải thích tiếng Anh; hãy trích câu trong e-mail làm bằng chứng cho đáp án.','The English explanation is missing; quote the sentence in the e-mail that supports the answer.']},
  ],
};
const CM_TODAY = '2026-10-27';

/* ---------- Labels & small helpers ---------- */
const CM_STATUS = {
  draft:[['Nháp','Draft'],'default','pencil'], in_review:[['Đang duyệt','In review'],'accent','clock'],
  changes_requested:[['Cần chỉnh sửa','Changes requested'],'warning','comment'], scheduled:[['Đã lên lịch','Scheduled'],'accent','calendar'],
  published:[['Đã xuất bản','Published'],'success','circle-check'], archived:[['Đã từ chối','Rejected'],'danger','circle-xmark-fill'],
};
const CM_EXAM = {toeic_lr:'TOEIC L&R',ielts_academic:'IELTS Academic'};
const CM_FIELD = {general:['Chung','General'],stem:['Đề bài','Stem'],options:['Phương án','Options'],explanation:['Giải thích','Explanation'],audio:['Audio & script','Audio & script']};
const CM_LICENCE = {
  cc_by:[['CC BY 4.0','CC BY 4.0'],['Ai cũng được dùng lại khi ghi công tác giả.','Anyone may reuse with attribution.']],
  nonexclusive:[['Không độc quyền','Non-exclusive licence'],['Tác giả giữ bản quyền; Engrisk được phân phối.','Author keeps copyright; Engrisk may distribute.']],
  internal:[['Nội dung nội bộ Engrisk','Engrisk in-house content'],['Engrisk sở hữu · biên soạn bởi nhân viên.','Owned by Engrisk · written by staff.']],
  tenant:[['Nội dung trung tâm','Center content'],['Sunrise English · chỉ thành viên.','Sunrise English · members only.']],
};
const CM_REJECT = {
  copyright:['Sao chép đề thật / vi phạm bản quyền','Copied real test / copyright issue'], format:['Không đúng định dạng kỳ thi','Doesn’t match the exam format'],
  quality:['Chất lượng chưa đạt sau nhiều lần sửa','Quality below bar after revisions'], duplicate:['Trùng nội dung đã có','Duplicates existing content'],
  unsafe:['Nội dung không phù hợp','Inappropriate content'],
};
const CM_DECISION = {approved:[['Đã duyệt & xuất bản','Approved & published'],'success','circle-check'],changes:[['Yêu cầu chỉnh sửa','Changes requested'],'warning','comment'],rejected:[['Đã từ chối','Rejected'],'danger','circle-xmark-fill']};
const CM_META = {'cd-p5-prepositions':{comments:18}};

const cmDate = iso => new Date(iso+'T12:00:00Z');
const cmDays = (a,b) => Math.round((cmDate(b)-cmDate(a))/864e5);
const cmAdd = (iso,n) => { const d=cmDate(iso); d.setUTCDate(d.getUTCDate()+n); return d.toISOString().slice(0,10); };
const cmMe = () => S.role==='content_admin'?'thao':S.role==='teacher'?'hanh':'minh';
const cmItem = id => S.content.find(c=>c.id===id);
const cmTitle = it => esc(tx(it.title));
const cmStatusChip = (s,size='sm') => { const m=CM_STATUS[s]||CM_STATUS.draft; return chip(tx(m[0]),m[1],m[2],{size}); };
const cmPerson = k => PEOPLE[k]||{name:k,initials:'?',color:'default'};
const cmOrigin = it => it.origin==='community'?[['Cộng đồng','Community'],'accent','persons']:it.scope!=='engrisk'?[['Giáo viên','Teacher'],'success','graduation-cap']:[['Nội bộ','Internal'],'default','shield-check'];
const cmOriginChip = it => { const o=cmOrigin(it); return chip(tx(o[0]),o[1],o[2],{size:'sm'}); };
const cmMeta = it => `${CM_EXAM[it.exam]||''} · ${tx(KIND[it.kind])} · ${it.q[1]} ${T('câu','questions')}`;
const cmSince = ym => { const [y,mo]=ym.split('-'); return `${+mo}/${y}`; };
const cmComments = id => (REVIEW_COMMENTS[id]||[]).map((c,i)=>({...c,i,resolved:c.resolved||((cmItem(id)||{}).resolved||[]).includes(i)}));
/** Cover thumbnail from the Catalog module (examCover + coverSpec), skill tile until it exists. */
const cmThumb = (it,cls='') => (typeof examCover==='function'&&typeof coverSpec==='function')
  ? `<span class="cm-thumb ${cls}" aria-hidden="true">${examCover(coverSpec(it),{compact:true,h:cls==='cm-thumb--sm'?40:cls==='cm-thumb--lg'?(isM()?64:88):52})}</span>`
  : `<span class="cm-thumb ${cls}" aria-hidden="true">${skillTile(it.skill==='mixed'?null:it.skill)}</span>`;
const cmOpenEditor = (id) => { if (typeof A.studioOpen==='function') A.studioOpen({id,as:'contributor'}); else toast(T('Trình soạn đề chưa sẵn sàng','Editor not available'),T('Mô phỏng','Simulated'),'info'); };
/** SLA: review within 3–5 working days; prototype uses 5 calendar days from submission. */
const cmSla = it => { const from=it.submitted||it.updated, due=cmAdd(from,5), left=cmDays(CM_TODAY,due);
  return {due,left,color:left<0?'danger':left<=1?'warning':'default',label:left<0?T(`Quá hạn ${-left} ngày`,`${-left} d overdue`):left===0?T('Hết hạn hôm nay','Due today'):T(`Còn ${left} ngày`,`${left} d left`)}; };

/* ---------- Moderation preview data (exam content always English) ---------- */
const MOD_DATA = {
  'cd-p2-replies':{licence:'cc_by',voice:'human',
    audio:{sec:504,lines:[[0,'N','Part 2. Question 1.'],[3,'W','When does the airport shuttle leave?'],[6,'M','(A) Every thirty minutes. (B) At the front desk. (C) Yes, I left it there.'],[14,'N','Question 2.'],[16,'M','Could you look over my slides before the meeting?'],[20,'W','(A) The meeting room upstairs. (B) Sure, send them over. (C) The slides were on sale.'],[28,'N','Question 3.'],[30,'W','Why was the delivery delayed?'],[33,'M','(A) By express mail. (B) Next Tuesday. (C) A storm closed the highway.']]},
    qs:[{n:1,stem:'Mark your answer on your answer sheet.',opts:ABCD('Every thirty minutes.','At the front desk.','Yes, I left it there.'),key:'A',exp:['“When” hỏi thời gian → (A). (B) trả lời “Where”; (C) lặp âm “leave/left”.','“When” asks for a time → (A). (B) answers “Where”; (C) repeats the sound “leave/left”.']},
      {n:2,stem:'Mark your answer on your answer sheet.',opts:ABCD('The meeting room upstairs.','Sure, send them over.','The slides were on sale.'),key:'B',exp:['Lời nhờ “Could you…?” → đồng ý: (B). (A), (C) lặp từ “meeting”, “slides”.','A request “Could you…?” → agree: (B). (A) and (C) repeat “meeting” and “slides”.']},
      {n:3,stem:'Mark your answer on your answer sheet.',opts:ABCD('By express mail.','Next Tuesday.','A storm closed the highway.'),key:'C',exp:['“Why” hỏi lý do → (C) nêu nguyên nhân dù không có “because”.','“Why” asks for a reason → (C) gives the cause even without “because”.']}],
    checks:{orig:98,fp:0,audio:{dur:'08:24',rate:'44,1 kHz',lufs:'−16,1 LUFS',peak:'−1,2 dBTP'},key:[],pii:0},
    hist:[['2026-10-19','kenji',['Tạo bản nháp','Draft created']],['2026-10-26','kenji',['Gửi duyệt · bản 1','Submitted · revision 1']],['2026-10-26','system',['Kiểm tra tự động hoàn tất · 0 cảnh báo','Automated checks finished · 0 warnings']]]},
  'cd-ielts-tfng':{licence:'nonexclusive',
    passage:{title:'Sensing the city',paras:['Over the past decade, city councils have installed thousands of low-cost sensors on lamp posts, bins and traffic lights. The devices report air quality, noise and footfall every few minutes, allowing officials to respond to problems before residents complain.','Critics argue that the benefits are uneven. Wealthier districts, which already had better services, often received sensors first, while outer suburbs waited years for the same coverage.']},
    qs:[{n:1,stem:'Smart-city sensors send data to officials several times an hour.',opts:TFNG,key:'TRUE',exp:['“report … every few minutes” → nhiều lần mỗi giờ → TRUE.','“report … every few minutes” → several times an hour → TRUE.']},
      {n:2,stem:'Residents in outer suburbs asked councils for more sensors.',opts:TFNG,key:'NOT GIVEN',exp:['Bài chỉ nói vùng ngoại ô phải chờ, không nói cư dân có yêu cầu → NOT GIVEN.','The text says suburbs waited, not that residents asked → NOT GIVEN.']},
      {n:3,stem:'Wealthier districts received sensors at the same time as poorer areas.',opts:TFNG,key:'FALSE',exp:['“Wealthier districts … often received sensors first” → mâu thuẫn → FALSE.','“Wealthier districts … often received sensors first” → contradicts → FALSE.']}],
    checks:{orig:94,fp:0,audio:null,key:[{q:3,text:['AI cho rằng “often” khiến đáp án có thể là NOT GIVEN thay vì FALSE. Kiểm tra lại câu chữ.','AI suggests “often” may make the answer NOT GIVEN rather than FALSE. Check the wording.']}],pii:0},
    hist:[['2026-10-21','tram',['Tạo bản nháp','Draft created']],['2026-10-25','tram',['Gửi duyệt · bản 1','Submitted · revision 1']],['2026-10-25','system',['Kiểm tra tự động hoàn tất · 1 cảnh báo đáp án','Automated checks finished · 1 answer-key warning']]]},
  'st-ielts-r-test-02':{licence:'internal',
    passage:{title:'The return of the night train',paras:['When budget airlines expanded across Europe in the early 2000s, many overnight rail services were withdrawn. Two decades later, a combination of climate concerns and new rolling stock has encouraged operators to reconsider.','Sleeper carriages are expensive to run because each bed earns revenue only once per night, whereas a daytime seat may be sold several times.']},
    qs:[{n:1,stem:'Why were many overnight rail services withdrawn?',opts:ABCD('Rail staff went on strike.','Cheap flights became widely available.','Sleeper carriages were unsafe.','Governments cut rail subsidies.'),key:'B',exp:['“When budget airlines expanded … services were withdrawn” → (B).','“When budget airlines expanded … services were withdrawn” → (B).']},
      {n:2,stem:'According to the writer, sleeper carriages are costly because',opts:ABCD('beds must be replaced often.','they need extra staff.','each bed is sold only once a night.','tickets are heavily discounted.'),key:'C',exp:['“each bed earns revenue only once per night” → (C).','“each bed earns revenue only once per night” → (C).']}],
    checks:{orig:99,fp:0,audio:null,key:[],pii:0},
    hist:[['2026-10-14','quang',['Tạo bản nháp','Draft created']],['2026-10-25','quang',['Gửi duyệt nội bộ · bản 1','Submitted for internal review · revision 1']],['2026-10-25','system',['Kiểm tra tự động hoàn tất · 0 cảnh báo','Automated checks finished · 0 warnings']]]},
  'sr-reading-quiz':{licence:'tenant',
    passage:{title:'E-mail',paras:['To: All evening-class students\nFrom: Sunrise English front office\nSubject: Room change on Thursday','Because of scheduled maintenance, Thursday’s 7 p.m. class will meet in Room 204 instead of Room 310. The lesson will start fifteen minutes later than usual. Please bring your workbook.']},
    qs:[{n:1,stem:'What is the purpose of the e-mail?',opts:ABCD('To announce a new course','To inform students of a room change','To request workbook payments','To cancel a class'),key:'B',exp:['“will meet in Room 204 instead of Room 310” → (B).','“will meet in Room 204 instead of Room 310” → (B).']},
      {n:2,stem:'What time will Thursday’s lesson begin?',opts:ABCD('6:45 p.m.','7:00 p.m.','7:15 p.m.','7:30 p.m.'),key:'C',exp:['7 giờ + “fifteen minutes later” → 7:15 (C).','7 p.m. + “fifteen minutes later” → 7:15 (C).']}],
    checks:{orig:97,fp:0,audio:null,key:[],pii:0},
    hist:[['2026-10-22','duc',['Tạo bản nháp','Draft created']],['2026-10-26','duc',['Gửi duyệt cho tenant · bản 1','Submitted for tenant review · revision 1']]]},
  'cd-p7-emails':{licence:'cc_by',
    passage:{title:'E-mail',paras:['To: Project team\nFrom: Dana Ortiz\nSubject: Vendor visit','The flooring vendor will visit on Monday to measure the new office. Final quotes are due next week, so please send any layout changes to me by Friday.']},
    qs:[{n:3,stem:'When will the vendor visit the office?',opts:ABCD('On Friday','This weekend','On Monday','Next week'),key:'C',exp:['“will visit on Monday” → (C).','“will visit on Monday” → (C).']},
      {n:6,stem:'What are team members asked to do?',opts:ABCD('Measure the office','Send layout changes','Contact the vendor','Approve the final quote'),key:'B',exp:['“please send any layout changes to me by Friday” → (B).','']}],
    checks:{orig:96,fp:0,audio:null,key:[{q:3,text:['AI thấy hai phương án có thể đúng (Monday / next week).','AI found two plausible options (Monday / next week).']}],pii:0},
    hist:[['2026-10-20','minh',['Tạo bản nháp','Draft created']],['2026-10-24','minh',['Gửi duyệt · bản 1','Submitted · revision 1']]]},
  'cd-p5-prepositions':{licence:'cc_by',
    qs:[{n:1,stem:'Please return the signed contract ______ the end of the week.',opts:ABCD('by','until','since','during'),key:'A',exp:['“by + mốc” = hạn chót.','“by + point in time” = deadline.']},
      {n:2,stem:'The store has been closed ______ Monday for renovations.',opts:ABCD('for','since','at','within'),key:'B',exp:['“since + mốc” với thì hoàn thành.','“since + point in time” with the perfect tense.']}],
    checks:{orig:99,fp:0,audio:null,key:[],pii:0},
    hist:[['2026-09-28','minh',['Gửi duyệt · bản 1','Submitted · revision 1']]]},
};
/** Fallback preview for items without seeded review data (e.g. drafts submitted from Studio): reuse the verified Q bank. */
function modData(it){
  if (MOD_DATA[it.id]) return MOD_DATA[it.id];
  const ids = it.exam==='ielts_academic'?['i1','i2']:it.skill==='listening'?['t7','t8']:['t101','t102'];
  const qs = ids.filter(id=>Q[id]).map((id,i)=>({n:i+1,stem:Q[id].stem,opts:Q[id].options,key:Q[id].answer,exp:Q[id].exp}));
  const lines = it.skill==='listening'?ids.flatMap(id=>(Q[id]&&Q[id].audio?Q[id].audio.lines:[])).map((l,i)=>[i*4,l[1],l[2]]):null;
  return {licence:it.origin==='community'?'cc_by':it.scope==='engrisk'?'internal':'tenant',voice:'human',qs,audio:lines?{sec:600,lines}:null,
    checks:{orig:97,fp:0,audio:lines?{dur:'10:00',rate:'44,1 kHz',lufs:'−16,0 LUFS',peak:'−1,0 dBTP'}:null,key:[],pii:0},
    hist:[[it.updated,it.owner,['Tạo bản nháp','Draft created']],[it.submitted||it.updated,it.owner,['Gửi duyệt','Submitted']]]};
}

/* ---------- State ---------- */
function communityInitial(){
  for (const k of Object.keys(REVIEW_COMMENTS)) delete REVIEW_COMMENTS[k];
  for (const [k,v] of Object.entries(REVIEW_SEED)) REVIEW_COMMENTS[k]=v.map(c=>({...c}));
  return {tab:'in_review',sel:null,dtab:'content',mView:'list',check:{},cq:'1',cf:'options',ctext:'',pending:{},reason:'',playing:false,reply:{},thread:{},newType:null,
    decided:[{id:'cd-p5-prepositions',d:'changes',by:'thao',at:'2026-10-03'},{id:'cd-p5-prepositions',d:'approved',by:'thao',at:'2026-10-12',rev:2},{id:'cd-p7-emails',d:'changes',by:'thao',at:'2026-10-26'}]};
}

/* ======================================================================
 * Contribute (learners)
 * ====================================================================== */
const CT_TYPES = [
  {g:'toeic_r',t:'p5',part:'Part 5',name:['Hoàn thành câu','Incomplete sentences'],skill:'reading',ic:'font',size:['10–30 câu','10–30 questions']},
  {g:'toeic_r',t:'p6',part:'Part 6',name:['Hoàn thành đoạn văn','Text completion'],skill:'reading',ic:'file-text',size:['1–4 đoạn · 4 câu/đoạn','1–4 texts · 4 per text']},
  {g:'toeic_r',t:'p7',part:'Part 7',name:['Đọc hiểu','Reading comprehension'],skill:'reading',ic:'files',size:['1–5 đoạn · 2–5 câu/đoạn','1–5 texts · 2–5 per text']},
  {g:'toeic_l',t:'p1',part:'Part 1',name:['Mô tả tranh','Photographs'],skill:'listening',ic:'camera',size:['Ảnh + audio + script','Photo + audio + script']},
  {g:'toeic_l',t:'p2',part:'Part 2',name:['Hỏi – đáp','Question–response'],skill:'listening',ic:'comments',size:['Audio + script · 10–25 câu','Audio + script · 10–25 items']},
  {g:'toeic_l',t:'p3',part:'Part 3',name:['Hội thoại','Conversations'],skill:'listening',ic:'persons',size:['Audio + script · 3 câu/bài','Audio + script · 3 per set']},
  {g:'toeic_l',t:'p4',part:'Part 4',name:['Bài nói ngắn','Short talks'],skill:'listening',ic:'microphone',size:['Audio + script · 3 câu/bài','Audio + script · 3 per talk']},
  {g:'ielts',t:'ielts_passage',part:'Reading',name:['Đoạn đọc IELTS Academic','IELTS Academic passage'],skill:'reading',ic:'book-open',size:['700–900 từ · 13–14 câu','700–900 words · 13–14 questions']},
];
const CT_VERIFIED_AT = 3;

function ctTypeRow(x){
  return `<button type="button" class="list-box-item" data-action="contribNew" data-t="${x.t}" data-fk="contribNew:${x.t}">${`<span class="icon-tile icon-tile--sm icon-tile--tint tint-${x.skill}">${icon(x.ic,14)}</span>`}<span class="grow" style="min-width:0"><span class="list-box-item__label">${x.part} · ${tx(x.name)}</span><span class="list-box-item__description">${tx(x.size)}</span></span>${icon('chevron-right',14,'text-muted')}</button>`;
}
function ctChooser(){
  const pub = S.content.filter(c=>c.origin==='community'&&c.owner==='minh'&&c.status==='published').length;
  const grp = (title,ic,skill,g,extra='') => `<div class="card">${cardHead(title,'','',`<span class="icon-tile icon-tile--sm icon-tile--tint tint-${skill}">${icon(ic,14)}</span>`)}<div class="list list--flush">${CT_TYPES.filter(x=>x.g===g).map(ctTypeRow).join('')}</div>${extra}</div>`;
  const locked = `<div class="separator"></div><div class="list-box-item cm-locked" aria-disabled="true" style="align-items:flex-start">${tile('lock','default','sm')}<span class="grow col gap-1" style="min-width:0"><span class="row row--wrap gap-1"><span class="list-box-item__label">${T('Đề thi thử đầy đủ','Full mock test')}</span>${chip(T('Đã khóa','Locked'),'default',null,{size:'sm'})}</span><span class="list-box-item__description">${T(`Dành cho người biên soạn đã xác minh: cần ${CT_VERIFIED_AT} bộ đã xuất bản, bạn có ${pub}.`,`For verified creators: needs ${CT_VERIFIED_AT} published sets, you have ${pub}.`)}</span></span></div>`;
  return sectionTitle(T('Bắt đầu đóng góp','Start a contribution'))+`<div class="grid grid-3 grid--stretch">${grp('TOEIC Reading','book-open','reading','toeic_r')}${grp('TOEIC Listening','headphones','listening','toeic_l')}${grp('IELTS Academic','graduation-cap','reading','ielts',locked)}</div>`;
}
function ctSteps(it){
  const L=[['Nháp','Draft'],['Gửi duyệt','Submitted'],['Đang duyệt','In review'],['Xuất bản','Published']];
  const idx={draft:0,in_review:2,changes_requested:2,archived:2,scheduled:3,published:3}[it.status]??0;
  const flag=it.status==='changes_requested'?'warn':it.status==='archived'?'danger':'';
  return `<ol class="cm-steps" aria-label="${T('Tiến trình duyệt','Review progress')}">${L.map((l,i)=>{
    const done=i<idx||(i===idx&&it.status==='published'), cur=i===idx&&!done;
    const label=cur&&flag==='warn'?T('Cần chỉnh sửa','Changes requested'):cur&&flag==='danger'?T('Bị từ chối','Rejected'):tx(l);
    const ic=done?'check':cur&&flag==='warn'?'comment':cur&&flag==='danger'?'xmark':cur?'clock':'';
    return `<li class="cm-step ${done?'is-done':''} ${cur?'is-current':''} ${cur&&flag?'is-'+flag:''}" ${cur?'aria-current="step"':''}><span class="cm-step__dot">${ic?icon(ic,10):''}</span><span class="cm-step__label">${label}</span></li>`; }).join('')}</ol>`;
}
function ctCommentList(id,{compact}={}){
  const cs=cmComments(id); if(!cs.length) return '';
  return `<ul class="cm-comments">${cs.map(c=>{ const p=cmPerson(c.by); return `<li class="cm-comment ${c.resolved?'is-resolved':''}">${avatar(p.initials,{size:'xs',color:p.color})}<div class="grow col gap-1" style="min-width:0"><div class="row row--wrap gap-1"><span class="text-sm font-medium">${esc(p.name)}</span>${chip(c.q?`${T('Câu','Q')} ${c.q}`:T('Chung','General'),'default',null,{size:'sm'})}${chip(tx(CM_FIELD[c.field]||CM_FIELD.general),'default',null,{size:'sm'})}${c.resolved?chip(T('Đã sửa','Fixed'),'success','check',{size:'sm'}):''}${compact?'':`<span class="text-xs text-muted">${fmtDate(c.at||CM_TODAY)}</span>`}</div><span class="text-sm">${esc(tx(c.text))}</span></div></li>`; }).join('')}</ul>`;
}
function ctThread(id){
  const th=S.contrib.thread[id]||[], val=S.contrib.reply[id]||'';
  return `${th.length?`<ul class="cm-comments">${th.map(r=>`<li class="cm-comment">${avatar('MN',{size:'xs'})}<div class="grow col gap-1"><span class="text-sm font-medium">${T('Bạn','You')} <span class="text-xs text-muted">· ${fmtDate(r.at)}</span></span><span class="text-sm">${esc(r.text)}</span></div></li>`).join('')}</ul>`:''}
    <div class="cm-reply"><label class="sr-only" for="ct-reply-${id}">${T('Trả lời người duyệt','Reply to reviewer')}</label><textarea id="ct-reply-${id}" class="textarea textarea--secondary" rows="2" data-input="ctReply" data-id="${id}" placeholder="${T('Trả lời người duyệt (không bắt buộc)…','Reply to the reviewer (optional)…')}">${esc(val)}</textarea>${btn(T('Gửi','Send'),{v:'secondary',size:'sm',ic:'paper-plane',action:'contribReply',data:{id}})}</div>`;
}
function ctItem(it){
  const m=isM(), cs=cmComments(it.id), open=cs.filter(c=>!c.resolved).length;
  const head = `<div class="cm-item__head">${cmThumb(it)}<div class="grow" style="min-width:0"><div class="row row--between gap-2" style="align-items:flex-start"><span class="font-medium ${m?'':'truncate'}">${cmTitle(it)}</span>${cmStatusChip(it.status)}</div><span class="text-xs text-muted">${cmMeta(it)} · ${T('Cập nhật','Updated')} ${fmtDate(it.updated)}</span></div></div>`;
  let body='';
  if (it.status==='published'){
    const meta=CM_META[it.id]||{comments:0};
    body=`<div class="row row--between row--wrap gap-2"><div class="cm-kv">${it.rating?`<span>${icon('star-fill',14,'text-warning')}<b class="tnum">${it.rating.toLocaleString(LOCALE[S.lang])}</b></span>`:''}<span>${icon('play-fill',14,'text-muted')}<b class="tnum">${fmtNum(it.plays||0)}</b> ${T('lượt làm','plays')}</span><span>${icon('comment',14,'text-muted')}<b class="tnum">${meta.comments}</b> ${T('bình luận','comments')}</span>${chip(`${T('Bản','Rev.')} ${it.rev}`,'default','branches-down',{size:'sm'})}</div>${btn(T('Xem trong thư viện','View in library'),{v:'tertiary',size:'sm',iconR:'arrow-right',action:'contribView',data:{id:it.id}})}</div>`;
  }
  if (it.status==='changes_requested'){
    const canResubmit=cs.length&&!open;
    body=`<div class="cm-feedback"><div class="row row--between gap-2"><span class="text-sm font-medium">${icon('comment',14,'text-warning')} ${T(`Góp ý của người duyệt · ${open} chưa xử lý`,`Reviewer feedback · ${open} open`)}</span></div>${ctCommentList(it.id,{compact:m})}${ctThread(it.id)}</div>
      <div class="row row--wrap gap-2">${m?btn(T('Sửa tiếp trên máy tính','Continue on computer'),{v:'secondary',size:'sm',ic:'display',action:'contribWeb',data:{id:it.id}}):btn(T('Sửa theo góp ý','Address feedback'),{size:'sm',ic:'pencil',action:'contribEdit',data:{id:it.id}})}${btn(T('Gửi duyệt lại','Resubmit'),{v:m?'primary':'tertiary',size:'sm',ic:'paper-plane',action:'contribSubmit',data:{id:it.id},disabled:!canResubmit})}${canResubmit?'':`<span class="description">${T('Xử lý hết góp ý để gửi lại.','Resolve all feedback to resubmit.')}</span>`}</div>`;
  }
  if (it.status==='draft'){
    const missing=[it.q[0]<it.q[1]?T(`${it.q[1]-it.q[0]} câu chưa hoàn thành`,`${it.q[1]-it.q[0]} questions unfinished`):'',it.audio==='missing'?T('Chưa có audio','Audio missing'):it.audio==='partial'?T('Audio chưa đủ','Audio incomplete'):'',it.issues?T(`${it.issues} lỗi kiểm tra`,`${it.issues} check issues`):''].filter(Boolean);
    const ready=!missing.length;
    body=`<div class="cm-progress">${progressBar(it.q[0],it.q[1],{size:'sm',label:T('Mức hoàn thiện','Completeness'),right:`${it.q[0]}/${it.q[1]}`})}</div>${missing.length?`<div class="row row--wrap gap-1">${missing.map(t=>chip(t,'warning','triangle-exclamation',{size:'sm'})).join('')}</div>`:''}
      <div class="row row--wrap gap-2">${m?btn(T('Soạn tiếp trên máy tính','Continue on computer'),{v:'secondary',size:'sm',ic:'display',action:'contribWeb',data:{id:it.id}}):btn(T('Tiếp tục soạn','Continue editing'),{size:'sm',ic:'pencil',action:'contribEdit',data:{id:it.id}})}${ready?btn(T('Gửi duyệt','Submit for review'),{v:'tertiary',size:'sm',ic:'paper-plane',action:'contribSubmit',data:{id:it.id}}):''}</div>`;
  }
  if (it.status==='in_review'){ const s=cmSla(it);
    body=`<p class="text-sm text-muted">${icon('clock',14)} ${T(`Đã gửi ${fmtDate(it.submitted||it.updated)} · người duyệt phản hồi trước ${fmtDate(s.due)}.`,`Submitted ${fmtDate(it.submitted||it.updated)} · reviewer replies by ${fmtDate(s.due)}.`)}</p>`; }
  if (it.status==='archived') body=`<p class="text-sm text-muted">${T('Lý do','Reason')}: ${esc(tx(CM_REJECT[it.rejectReason]||CM_REJECT.quality))}</p>`;
  return `<li class="cm-item">${head}${ctSteps(it)}${body}</li>`;
}
function ctPolicies(){
  return [
    ['shield-check','success',['Nội dung tự biên soạn','Original work only'],['Bạn tự viết câu hỏi, đoạn văn và script. Kiểm tra nguyên bản chạy tự động khi gửi.','You write the questions, passages and scripts yourself. Originality checks run on submission.']],
    ['shield-exclamation','danger',['Không dùng đề thật','No real test material'],['Cấm sao chép tài liệu của ETS, IDP, British Council hay sách luyện thi. Có đối chiếu dấu vân bản quyền.','Never copy ETS, IDP, British Council or prep-book material. Copyright fingerprints are checked.']],
    ['list-check','accent',['Đáp án + giải thích','Key + explanation'],['Mỗi câu cần đúng một đáp án, giải thích và câu bằng chứng trong bài.','Every question needs one correct key, an explanation and an evidence sentence.']],
    ['headphones','accent',['Quy định audio','Audio rules'],['WAV/MP3 ≥ 44,1 kHz, rõ tiếng, không nhạc nền có bản quyền. Giọng TTS được phép nhưng phải gắn nhãn “Giọng tổng hợp”.','WAV/MP3 ≥ 44.1 kHz, clear speech, no copyrighted music. TTS voices are allowed but must be labelled “Synthetic voice”.']],
    ['file-check','default',['Giấy phép','Licence'],['Chọn: giữ bản quyền và cấp phép không độc quyền cho Engrisk, hoặc CC BY 4.0.','Choose: keep copyright and grant Engrisk a non-exclusive licence, or CC BY 4.0.']],
    ['clock','default',['Thời gian duyệt','Review time'],['Người duyệt phản hồi trong 3–5 ngày làm việc. Góp ý gắn theo từng câu.','A reviewer replies within 3–5 working days, with comments per question.']],
    ['person','default',['Ghi công','Credit'],['Tên hiển thị của bạn xuất hiện trên bộ đề và trong phần “Từ cộng đồng”.','Your display name appears on the set and in “From the community”.']],
    ['trash-bin','default',['Gỡ nội dung','Takedown'],['Bạn có thể yêu cầu gỡ bất cứ lúc nào. Báo cáo vi phạm bản quyền được xử lý trong 48 giờ.','You can request removal anytime. Copyright reports are handled within 48 hours.']],
  ];
}
function ctGuide(){
  const m=isM(), P=ctPolicies();
  const items = m
    ? `<div class="list list--divided">${P.map(([ic,c,t,d])=>`<div class="list-box-item" style="align-items:flex-start">${tile(ic,c,'sm')}<span class="grow"><span class="list-box-item__label">${tx(t)}</span><span class="list-box-item__description">${tx(d)}</span></span></div>`).join('')}</div>`
    : `<div class="cm-policy">${P.map(([ic,c,t,d])=>`<div class="cm-policy__item">${tile(ic,c,'sm')}<div class="col gap-1"><span class="font-medium text-sm">${tx(t)}</span><span class="text-sm text-muted">${tx(d)}</span></div></div>`).join('')}</div>`;
  return `<div class="card card--lg" id="ct-guide">${cardHead(T('Hướng dẫn & chính sách','Guidelines & policy'),btn(T('Điều khoản đóng góp','Contributor terms'),{v:'ghost',size:'sm',iconR:'arrow-up-right-from-square',action:'noop'}),'',tile('file-text','default','sm'))}${items}<p class="text-xs text-muted">${T('TOEIC® là nhãn hiệu của ETS. IELTS™ thuộc British Council, IDP và Cambridge University Press & Assessment. Engrisk không liên kết hay được các tổ chức này xác nhận.','TOEIC® is a trademark of ETS. IELTS™ is owned by the British Council, IDP and Cambridge University Press & Assessment. Engrisk is not affiliated with or endorsed by them.')}</p></div>`;
}
function ctCredit(mine){
  const c=CONTRIBUTORS.minh, pub=mine.filter(x=>x.status==='published').length, rev=mine.filter(x=>x.status==='in_review').length;
  return `<div class="card">${cardHead(T('Ghi công người đóng góp','Contributor credit'),'','',tile('medal','accent','sm'))}
    <div class="row gap-3">${avatar('MN',{size:'lg'})}<div class="grow" style="min-width:0"><div class="font-semibold">Minh Nguyễn</div><div class="text-xs text-muted">${T('Người đóng góp từ','Contributing since')} ${cmSince(c.since)}</div></div></div>
    <div class="grid grid-3 cm-mini">${[[pub,T('Đã xuất bản','Published')],[rev,T('Đang duyệt','In review')],[c.helpful+'%',T('Thấy hữu ích','Found helpful')]].map(([v,l])=>`<div class="card card--secondary"><span class="text-lg font-semibold tnum">${v}</span><span class="text-xs text-muted">${l}</span></div>`).join('')}</div>
    <div class="cm-credit">${icon('person',14,'text-muted')}<span class="text-sm">${T('Biên soạn bởi','Created by')} <b>Minh Nguyễn</b> · ${T('Cộng đồng Engrisk','Engrisk community')} · CC BY 4.0</span></div>
    <p class="text-xs text-muted">${T('Chỉ ghi công, không xếp hạng hay chuỗi ngày. Đổi tên hiển thị trong Tài khoản.','Credit only — no leaderboards or streaks. Change your display name in Account.')}</p></div>`;
}
function ctProcess(){
  const steps=[['pencil',['Soạn & tự kiểm tra','Write & self-check'],['Trình soạn kiểm tra thiếu đáp án, giải thích, audio.','The editor flags missing keys, explanations and audio.']],['shield-check',['Kiểm tra tự động','Automated checks'],['Nguyên bản, bản quyền, chất lượng audio, thông tin cá nhân.','Originality, copyright, audio quality, personal data.']],['persons',['Người duyệt xem xét','Human review'],['3–5 ngày làm việc · góp ý theo từng câu.','3–5 working days · comments per question.']],['rocket',['Xuất bản kèm ghi công','Published with credit'],['Mỗi lần sửa là một bản mới; bài đang làm giữ bản cũ.','Each edit is a new revision; in-progress attempts keep the old one.']]];
  return `<div class="card">${cardHead(T('Quy trình duyệt','How review works'),'','',tile('list-check','default','sm'))}<ol class="cm-process">${steps.map(([ic,t,d],i)=>`<li><span class="cm-process__n">${i+1}</span><div class="col gap-1"><span class="text-sm font-medium">${tx(t)}</span><span class="text-xs text-muted">${tx(d)}</span></div></li>`).join('')}</ol></div>`;
}
function rContribute(){
  const u=user(), m=isM(), st=viewState('contribute');
  if (u.guest) return `<div class="card card--lg">${empty('square-plus',T('Đóng góp đề cần tài khoản','Contributing needs an account'),T('Tạo tài khoản miễn phí để soạn bộ đề, gửi duyệt và được ghi công.','Create a free account to write sets, submit them for review and get credit.'),btn(T('Tạo tài khoản','Create account'),{action:'convert'}),{mood:'wave'})}</div>`;
  if (u.staff) return `<div class="card card--lg">${empty('layers',T('Bạn đang dùng vai trò nhân viên','You’re signed in as staff'),T('Trang này dành cho học viên đóng góp. Soạn đề trong Content Studio và duyệt đóng góp trong hàng đợi kiểm duyệt.','This page is for learner contributors. Author in Content Studio and review contributions in the review queue.'),btn('Content Studio',{ic:'layers',action:'go',data:{to:'studio'}})+btn(T('Hàng đợi kiểm duyệt','Review queue'),{v:'tertiary',ic:'shield-check',action:'go',data:{to:'moderation'}}))}</div>`;
  const mine = st==='empty'?[]:S.content.filter(c=>c.origin==='community'&&c.owner==='minh');
  const order = {changes_requested:0,draft:1,in_review:2,scheduled:3,published:4,archived:5};
  mine.sort((a,b)=>order[a.status]-order[b.status]);
  const pub = mine.filter(x=>x.status==='published'), plays=pub.reduce((s,x)=>s+(x.plays||0),0);
  const rated = pub.filter(x=>x.rating), rating = rated.length?(rated.reduce((s,x)=>s+x.rating,0)/rated.length):null;
  const commPub = S.content.filter(c=>c.origin==='community'&&c.status==='published');
  const stats = mine.length
    ? [[pub.length,T('bộ đã xuất bản','sets published')],[fmtNum(plays),T('lượt làm','plays')],[rating?`★ ${rating.toLocaleString(LOCALE[S.lang],{maximumFractionDigits:1})}`:'—',T('đánh giá TB','avg. rating')]]
    : [[Object.keys(CONTRIBUTORS).length,T('người đóng góp','contributors')],[commPub.length,T('bộ cộng đồng đã duyệt','reviewed community sets')],[fmtNum(commPub.reduce((s,x)=>s+(x.plays||0),0)),T('lượt làm','plays')]];
  const hero = `<div class="card card--lg cm-hero"><div class="cm-hero__body"><span class="eyebrow">${T('Cộng đồng Engrisk','Engrisk community')}</span>
      <h2 class="cm-hero__title">${mine.length?T('Đề bạn soạn đang giúp người khác luyện thi','Your sets are helping others practise'):T('Soạn một bộ đề, giúp hàng nghìn người luyện thi','Write one set, help thousands practise')}</h2>
      <p class="text-muted">${T('Bộ đề gốc của bạn được kiểm duyệt rồi xuất bản miễn phí trong Thư viện, kèm tên bạn.','Your original sets are reviewed, then published free in the Library with your name on them.')}</p>
      <div class="cm-hero__stats" aria-label="${mine.length?T('Tác động của bạn','Your impact'):T('Cộng đồng','Community')}">${stats.map(([v,l])=>`<div><span class="cm-hero__v tnum">${v}</span><span class="text-xs text-muted">${l}</span></div>`).join('')}</div>
      ${m?'':`<div class="row row--wrap gap-2">${btn(T('Bắt đầu với Part 5','Start with Part 5'),{ic:'square-plus',action:'contribNew',data:{t:'p5'}})}${btn(T('Đọc hướng dẫn','Read the guidelines'),{v:'tertiary',action:'contribGuide'})}</div>`}</div>
    <div class="cm-hero__art">${mascot({mood:mine.length?'happy':'wave',size:m?76:132})}</div></div>`;
  const listCard = mine.length
    ? `<div class="card">${cardHead(T('Đóng góp của tôi','My contributions'),`<span class="text-xs text-muted">${mine.length}</span>`)}<ul class="cm-items">${mine.map(ctItem).join('')}</ul></div>`
    : `<div class="card card--lg">${empty('square-plus',T('Chưa có đóng góp nào','No contributions yet'),T('Bắt đầu với một bộ Part 5 ngắn — chỉ cần câu hỏi, đáp án và giải thích, không cần audio.','Start with a short Part 5 set — just questions, keys and explanations, no audio needed.'),m?'':btn(T('Soạn bộ Part 5','Write a Part 5 set'),{ic:'square-plus',action:'contribNew',data:{t:'p5'}}))}</div>`;
  if (m){
    const web = alertBox('default',T('Soạn đề trên máy tính','Author on a computer'),T('Trên điện thoại bạn theo dõi trạng thái, trả lời người duyệt và gửi duyệt. Trình soạn câu hỏi, audio và script dùng trên web.','On your phone you can track status, reply to reviewers and submit. The question, audio and script editor is on the web.'),btn(T('Gửi link soạn đề qua e-mail','E-mail me an editor link'),{v:'tertiary',size:'sm',ic:'envelope',action:'contribWeb'}),{ic:'display',flat:true});
    return hero+web+listCard+(mine.length?ctCredit(mine):ctProcess())+ctGuide();
  }
  const side = mine.length?`<div class="col gap-4">${ctCredit(mine)}${ctProcess()}</div>`:ctProcess();
  return hero+`<div class="grid grid-main ${mine.length?'':'grid--stretch'}">${mine.length?`<div class="col gap-4">${listCard}</div>`:listCard}${side}</div>`+ctChooser()+ctGuide();
}

/* ======================================================================
 * Moderation (staff)
 * ====================================================================== */
const modScope = () => S.content.filter(c=>c.scope===contentScope());
function modLists(){
  const sc=modScope(), C=S.contrib;
  const latest={}; C.decided.forEach(d=>{ latest[d.id]=d; });
  const decided=Object.values(latest).filter(d=>d.d!=='changes'&&sc.some(c=>c.id===d.id&&!['in_review','changes_requested'].includes(c.status))).reverse();
  return {in_review:sc.filter(c=>c.status==='in_review').sort((a,b)=>(a.submitted||a.updated).localeCompare(b.submitted||b.updated)),
    changes_requested:sc.filter(c=>c.status==='changes_requested'),decided};
}
function modSelected(L){
  const C=S.contrib, ids=C.tab==='decided'?L.decided.map(d=>d.id):L[C.tab].map(c=>c.id);
  if (!ids.includes(C.sel)) C.sel=ids[0]||null;
  return C.sel?cmItem(C.sel):null;
}
const modChecklist = it => [
  ['orig',['Nội dung gốc, không trùng tài liệu có bản quyền','Original; no copyrighted material']],
  ['key',['Mỗi câu có đúng một đáp án','Exactly one correct answer per question']],
  ['exp',['Giải thích đầy đủ, có bằng chứng','Explanations complete with evidence']],
  it.skill==='listening'?['media',['Audio rõ, khớp script; TTS có nhãn','Audio clear and matches script; TTS labelled']]:['media',['Đúng định dạng & độ khó của Part','Matches the Part format and difficulty']],
  ['safety',['Không có thông tin cá nhân hay nội dung nhạy cảm','No personal data or sensitive content']],
  ['licence',['Giấy phép & ghi công hợp lệ','Licence and credit are valid']],
];
function modRow(it,L){
  const C=S.contrib, sel=C.sel===it.id, s=cmSla(it), d=C.tab==='decided'?L.decided.find(x=>x.id===it.id):null, p=cmPerson(it.owner);
  const warn=modData(it).checks.key.length+(it.issues&&!modData(it).checks.key.length?it.issues:0);
  const right = d?chip(d.d==='approved'?T('Đã duyệt','Approved'):T('Từ chối','Rejected'),CM_DECISION[d.d][1],CM_DECISION[d.d][2],{size:'sm'})
    : C.tab==='in_review'?`<span class="cm-sla tnum ${s.color==='default'?'text-muted':'text-'+s.color}" title="${esc(s.label)}">${icon('clock',12)}<span aria-hidden="true">${s.left<0?T('Quá hạn','Late'):`${s.left} ${T('ngày','d')}`}</span><span class="sr-only">${s.label}</span></span>`
    : `<span class="cm-sla text-muted">${icon('comment',12)}${cmComments(it.id).filter(c=>!c.resolved).length}<span class="sr-only"> ${T('góp ý chưa xử lý','open comments')}</span></span>`;
  return `<button type="button" class="list-box-item cm-qrow" data-action="modSel" data-id="${it.id}" data-fk="modSel:${it.id}" ${sel?'aria-current="true"':''}>${cmThumb(it,'cm-thumb--sm')}<span class="grow col gap-1" style="min-width:0"><span class="row gap-1" style="min-width:0"><span class="text-sm font-medium truncate">${cmTitle(it)}</span>${warn?`<span class="text-warning shrink-0" title="${T('Có cảnh báo','Has warnings')}">${icon('triangle-exclamation',12)}<span class="sr-only">${T('Có cảnh báo','Has warnings')}</span></span>`:''}</span>
    <span class="row gap-2" style="min-width:0">${cmOriginChip(it)}<span class="text-xs text-muted truncate grow">${esc(p.name)}</span>${right}</span></span></button>`;
}
function modQueue(L){
  const C=S.contrib, n={in_review:L.in_review.length,changes_requested:L.changes_requested.length,decided:L.decided.length};
  const rows = C.tab==='decided'?L.decided.map(d=>cmItem(d.id)):L[C.tab];
  const none = {in_review:[T('Không còn bài chờ duyệt','Nothing waiting'),T('Bài mới gửi sẽ xuất hiện ở đây.','New submissions will appear here.')],changes_requested:[T('Không có bài cần chỉnh sửa','Nothing awaiting changes'),T('Bài đã yêu cầu sửa sẽ chờ người gửi ở đây.','Items sent back wait here for the author.')],decided:[T('Chưa có quyết định','No decisions yet'),T('Bài đã duyệt hoặc từ chối hiển thị ở đây.','Approved or rejected items show here.')]}[C.tab];
  return `<div class="card cm-queue">${cardHead(T('Hàng đợi','Queue'),chip(contentScope()==='engrisk'?T('Thư viện Engrisk','Engrisk library'):'Sunrise English',contentScope()==='engrisk'?'default':'accent',contentScope()==='engrisk'?'globe':'persons-lock',{size:'sm'}))}
    ${tabs(T('Lọc hàng đợi','Filter queue'),[['in_review',`${T('Chờ duyệt','Pending')} ${n.in_review}`],['changes_requested',`${T('Cần sửa','Changes')} ${n.changes_requested}`],['decided',`${T('Đã xử lý','Decided')} ${n.decided}`]],C.tab,'modTab',{full:true,size:'sm'})}
    ${rows.length?`<div class="list list--flush cm-qlist">${rows.map(it=>modRow(it,L)).join('')}</div>`:`<div class="empty-state">${tile('circle-check','success')}<div class="text-sm font-semibold">${none[0]}</div><p class="text-xs text-muted">${none[1]}</p></div>`}</div>`;
}
function modHeader(it){
  const D=modData(it), p=cmPerson(it.owner), c=CONTRIBUTORS[it.owner], lic=CM_LICENCE[D.licence], m=isM();
  const who = c?T(`${c.sets} bộ đã xuất bản · ${c.helpful}% hữu ích · từ ${cmSince(c.since)}`,`${c.sets} sets published · ${c.helpful}% helpful · since ${cmSince(c.since)}`)
    : it.scope==='engrisk'?T('Biên tập viên Engrisk','Engrisk editor'):T('Giáo viên · Sunrise English','Teacher · Sunrise English');
  const s=cmSla(it);
  return `<div class="cm-dhead">${cmThumb(it,'cm-thumb--lg')}<div class="grow col gap-2" style="min-width:0"><div class="row row--between gap-2" style="align-items:flex-start"><h2 class="text-lg font-semibold">${cmTitle(it)}</h2>${cmStatusChip(it.status)}</div>
      <div class="row row--wrap gap-1">${cmOriginChip(it)}${chip(CM_EXAM[it.exam],'default',null,{size:'sm'})}${chip(tx(KIND[it.kind]),'default',null,{size:'sm'})}${chip(`${it.q[1]} ${T('câu','questions')}`,'default','list-ul',{size:'sm'})}${it.audio!=='none'?chip(T('Có audio','Has audio'),'default','headphones',{size:'sm'}):''}${chip(`${T('Bản','Rev.')} ${it.rev}`,'default','branches-down',{size:'sm'})}${it.status==='in_review'?chip(`${T('Hạn','Due')} ${fmtDate(s.due)}`,s.color,'clock',{size:'sm'}):''}</div></div></div>
    <div class="grid ${m?'':'grid-3'} cm-facts">
      <div class="cm-fact">${avatar(p.initials,{size:'sm',color:p.color})}<div class="col gap-0" style="min-width:0"><span class="text-xs text-muted">${T('Người gửi','Submitted by')}</span><span class="text-sm font-medium truncate">${esc(p.name)}</span><span class="text-xs text-muted">${who}</span></div></div>
      <div class="cm-fact">${tile('file-check','default','sm')}<div class="col gap-0" style="min-width:0"><span class="text-xs text-muted">${T('Giấy phép','Licence')}</span><span class="text-sm font-medium">${tx(lic[0])}</span><span class="text-xs text-muted">${tx(lic[1])}</span></div></div>
      <div class="cm-fact">${tile('shield-check','success','sm')}<div class="col gap-0" style="min-width:0"><span class="text-xs text-muted">${T('Cam kết quyền','Rights statement')}</span><span class="text-sm font-medium">${T('Tự biên soạn','Own work')}</span><span class="text-xs text-muted">${T('Không dùng tài liệu ETS/IDP/BC','No ETS/IDP/BC material')}</span></div></div></div>`;
}
function modQuestion(it,q,canComment){
  const anchored=[...cmComments(it.id).filter(c=>c.q===q.n),...(S.contrib.pending[it.id]||[]).filter(c=>c.q===q.n).map(c=>({...c,draft:true}))];
  const exp = tx(q.exp);
  return `<div class="cm-q"><div class="row row--between gap-2"><span class="row gap-2"><span class="cm-q__n tnum">${q.n}</span><span class="text-xs text-muted">${T('Câu','Question')} ${q.n}</span></span>${canComment?btn(T('Góp ý câu này','Comment'),{v:'ghost',size:'sm',ic:'comment',action:'modCommentQ',data:{q:q.n}}):''}</div>
    <div class="cm-q__stem">${esc(q.stem)}</div>
    <ul class="cm-opts" aria-label="${T('Phương án','Options')}">${q.opts.map(([k,t])=>`<li class="cm-opt ${k===q.key?'is-key':''}"><span class="cm-opt__k">${esc(k.length>2?k[0]:k)}</span><span class="grow">${esc(t)}</span>${k===q.key?`<span class="cm-opt__tag">${icon('check',12)}${T('Đáp án','Key')}</span>`:''}</li>`).join('')}</ul>
    ${exp?`<div class="block-verified"><div class="block-verified__head">${icon('circle-check-fill',12)}${T('Giải thích','Explanation')}</div><span class="text-sm">${esc(exp)}</span></div>`:alertBox('warning',T('Thiếu giải thích','Explanation missing'),T('Bản ngôn ngữ này chưa có giải thích.','No explanation in this language yet.'),'',{flat:true})}
    ${modData(it).checks.key.filter(k=>k.q===q.n).map(k=>`<span class="cm-flag">${icon('sparkles',12)}<span><b>${T('AI cảnh báo đáp án','AI key warning')}:</b> ${esc(tx(k.text))}</span></span>`).join('')}
    ${anchored.length?`<ul class="cm-comments">${anchored.map(c=>{ const p=cmPerson(c.by); return `<li class="cm-comment ${c.resolved?'is-resolved':''}">${avatar(p.initials,{size:'xs',color:p.color})}<div class="grow col gap-1"><div class="row gap-1">${chip(tx(CM_FIELD[c.field]||CM_FIELD.general),'default',null,{size:'sm'})}${c.draft?chip(T('Chưa gửi','Not sent'),'accent',null,{size:'sm'}):c.resolved?chip(T('Đã sửa','Fixed'),'success','check',{size:'sm'}):chip(T('Chưa xử lý','Open'),'warning',null,{size:'sm'})}</div><span class="text-sm">${esc(tx(c.text))}</span></div></li>`; }).join('')}</ul>`:''}</div>`;
}
function modContent(it,canComment){
  const D=modData(it), C=S.contrib;
  const audio = D.audio?`<div class="col gap-3"><div class="row row--between"><span class="font-medium">${T('Audio & script','Audio & script')}</span><span class="row gap-1">${chip(D.voice==='tts'?T('Giọng tổng hợp (TTS)','Synthetic voice (TTS)'):T('Giọng người thật','Human voice'),'default','microphone',{size:'sm'})}${sim(T('Âm thanh giả lập','Simulated audio'))}</span></div>
      <div class="audio cm-audio"><button type="button" class="audio__play ${C.playing?'is-playing':''}" data-action="modPlay" data-fk="modPlay" aria-label="${C.playing?T('Tạm dừng','Pause'):T('Phát audio','Play audio')}">${icon(C.playing?'pause-fill':'play-fill',18)}</button><div class="grow col gap-1" style="min-width:0"><div class="wave ${C.playing?'wave--live':''}" aria-hidden="true">${Array.from({length:isM()?28:64},(_,i)=>`<i class="${C.playing&&i<12?'on':''}" style="height:${6+((i*7+3)%19)}px"></i>`).join('')}</div><span class="text-xs text-muted tnum">${C.playing?'00:14':'00:00'} / ${fmt(D.audio.sec)}</span></div></div>
      <ol class="cm-script" aria-label="Script">${D.audio.lines.map(([t,s,x])=>`<li><span class="tnum text-xs text-muted">${fmt(t)}</span><span class="cm-spk">${s}</span><span class="text-sm">${esc(x)}</span></li>`).join('')}</ol></div>`:'';
  const passage = D.passage?`<div class="cm-passage"><div class="text-xs text-muted font-medium">${esc(D.passage.title)}</div>${D.passage.paras.map(p=>`<p>${esc(p).replace(/\n/g,'<br>')}</p>`).join('')}</div>`:'';
  return `${audio}${passage}<div class="col gap-3">${D.qs.map(q=>modQuestion(it,q,canComment)).join('')}</div><p class="text-xs text-muted">${T(`Hiển thị ${D.qs.length}/${it.q[1]} câu.`,`Showing ${D.qs.length} of ${it.q[1]} questions.`)} ${btn(T('Mở bản xem trước đầy đủ','Open full preview'),{v:'ghost',size:'sm',iconR:'arrow-up-right-from-square',action:'noop'})}</p>`;
}
function modChecks(it){
  const K=modData(it).checks;
  const row=(ic,c,title,desc,res,extra='')=>`<div class="list-box-item cm-check" style="align-items:flex-start">${tile(ic,c,'sm')}<span class="grow col gap-1" style="min-width:0"><span class="list-box-item__label">${title}</span><span class="list-box-item__description">${desc}</span>${extra}</span><span class="cm-check__res">${res}</span></div>`;
  const ok = l => chip(l,'success','circle-check',{size:'sm'});
  return `<div class="row row--between"><span class="font-medium">${T('Kết quả kiểm tra tự động','Automated check results')}</span>${sim()}</div><div class="list list--divided">
    ${row('copy-check',K.orig>=90?'success':'warning',T('Mức độ nguyên bản','Originality'),T('So với ngân hàng Engrisk và nguồn web công khai','Against the Engrisk bank and public web sources'),`<span class="cm-meterw">${meter(K.orig,100,{label:T('Nguyên bản','Original'),right:K.orig+'%',color:K.orig>=90?'success':'warning',size:'sm'})}</span>`)}
    ${row('shield-check','success',T('Dấu vân bản quyền','Copyright fingerprint'),T('Đối chiếu tài liệu đã biết của ETS, IDP, British Council và sách luyện thi','Matched against known ETS, IDP, British Council and prep-book material'),ok(T('Không trùng','No match')))}
    ${K.audio?row('headphones','success',T('Chất lượng audio','Audio QC'),`${K.audio.dur} · ${K.audio.rate} · ${K.audio.lufs} · ${K.audio.peak}`,ok(T('Đạt','Pass'))):''}
    ${row('sparkles',K.key.length?'warning':'success',T('AI kiểm tra nhất quán đáp án','AI answer-key consistency'),K.key.length?T('Chỉ là gợi ý — người duyệt quyết định.','Advisory only — the reviewer decides.'):T('Không thấy đáp án mâu thuẫn với nội dung','No key contradicts the content'),K.key.length?chip(`${K.key.length} ${T('cảnh báo','warning')}`,'warning','triangle-exclamation',{size:'sm'}):ok(T('Nhất quán','Consistent')),
      K.key.map(k=>`<span class="cm-flag">${icon('triangle-exclamation',12)}<span><b>${T('Câu','Q')} ${k.q}:</b> ${esc(tx(k.text))}</span></span>`).join(''))}
    ${row('eye','success',T('An toàn & thông tin cá nhân','Safety & personal data'),T('Tên thật, e-mail, số điện thoại, nội dung nhạy cảm','Real names, e-mails, phone numbers, sensitive content'),ok(T('Không phát hiện','None found')))}</div>`;
}
function modHistory(it){
  const D=modData(it), log=S.contrib.decided.filter(d=>d.id===it.id);
  const rows=[...D.hist.map(([at,who,what])=>({at,who,what:tx(what),ic:who==='system'?'shield-check':'pencil'})),
    ...log.map(d=>({at:d.at,who:d.by,what:`${tx(CM_DECISION[d.d][0])}${d.rev?` · ${T('bản','rev.')} ${d.rev}`:''}${d.reason?` · ${tx(CM_REJECT[d.reason])}`:''}`,ic:CM_DECISION[d.d][2]}))].sort((a,b)=>a.at.localeCompare(b.at));
  return `<ol class="cm-timeline">${rows.map(r=>`<li>${tile(r.ic,'default','sm')}<div class="grow col gap-0"><span class="text-sm">${esc(r.what)}</span><span class="text-xs text-muted">${r.who==='system'?T('Hệ thống','System'):esc(cmPerson(r.who).name)} · ${fmtDate(r.at)}</span></div></li>`).join('')}</ol>`;
}
function modDecision(it){
  const C=S.contrib, m=isM(), list=modChecklist(it), done=C.check[it.id]||[], all=list.every(([k])=>done.includes(k));
  const own=it.owner===cmMe(), pend=C.pending[it.id]||[], n=it.q[1];
  const approveWhy = own?T('Bạn không thể duyệt bài của chính mình — cần người duyệt khác.','You can’t approve your own submission — another reviewer is needed.'):!all?T(`Hoàn thành checklist (${done.length}/${list.length}) để duyệt.`,`Complete the checklist (${done.length}/${list.length}) to approve.`):'';
  const target = it.scope==='engrisk'?T('Xuất bản lên Thư viện Engrisk công khai','Publishes to the public Engrisk library'):T('Xuất bản cho thành viên Sunrise English','Publishes to Sunrise English members');
  const checklist = `<fieldset class="cm-checklist"><legend class="text-sm font-medium">${T('Checklist người duyệt','Reviewer checklist')} <span class="text-xs text-muted tnum">${done.length}/${list.length}</span></legend>${list.map(([k,l])=>`<label class="checkbox"><input type="checkbox" data-input="modCheck" data-k="${k}" ${done.includes(k)?'checked':''}><span class="checkbox__control">${icon('check',11)}</span><span class="text-sm">${tx(l)}</span></label>`).join('')}</fieldset>`;
  const composer = `<div class="col gap-2"><span class="text-sm font-medium">${T('Góp ý theo câu','Comment on a question')}</span>
    <div class="cm-composer__sel"><label class="sr-only" for="mod-cq">${T('Câu','Question')}</label><select id="mod-cq" class="select select--secondary" data-input="modCq"><option value="0" ${C.cq==='0'?'selected':''}>${T('Chung','General')}</option>${Array.from({length:n},(_,i)=>`<option value="${i+1}" ${C.cq===String(i+1)?'selected':''}>${T('Câu','Q')} ${i+1}</option>`).join('')}</select>
      <label class="sr-only" for="mod-cf">${T('Mục','Field')}</label><select id="mod-cf" class="select select--secondary" data-input="modCf">${['stem','options','explanation',...(it.skill==='listening'?['audio']:[])].map(f=>`<option value="${f}" ${C.cf===f?'selected':''}>${tx(CM_FIELD[f])}</option>`).join('')}</select></div>
    <label class="sr-only" for="mod-ct">${T('Nội dung góp ý','Comment text')}</label><textarea id="mod-ct" class="textarea textarea--secondary" rows="3" data-input="modCtext" placeholder="${T('Mô tả vấn đề và cách sửa…','Describe the issue and how to fix it…')}">${esc(C.ctext)}</textarea>
    <div class="row row--between">${pend.length?`<span class="text-xs text-muted">${T(`${pend.length} góp ý chờ gửi`,`${pend.length} comments to send`)}</span>`:'<span></span>'}${btn(T('Thêm góp ý','Add comment'),{v:'secondary',size:'sm',ic:'plus',action:'modAddComment'})}</div>
    ${pend.length?`<ul class="cm-pending">${pend.map((c,i)=>`<li><span class="text-xs font-medium nowrap">${c.q?`${T('Câu','Q')} ${c.q}`:T('Chung','General')} · ${tx(CM_FIELD[c.field])}</span><span class="text-xs grow truncate">${esc(c.text[0])}</span>${btn('',{v:'ghost',size:'sm',ic:'xmark',action:'modDelComment',data:{i},aria:T('Xóa góp ý','Remove comment')})}</li>`).join('')}</ul>`:''}</div>`;
  const reason = `<div class="textfield"><label class="label" for="mod-reason">${T('Lý do từ chối','Rejection reason')}</label><select id="mod-reason" class="select select--secondary" data-input="modReason"><option value="">${T('Chọn lý do…','Choose a reason…')}</option>${Object.entries(CM_REJECT).map(([k,l])=>`<option value="${k}" ${C.reason===k?'selected':''}>${tx(l)}</option>`).join('')}</select></div>`;
  const approveL = it.scope==='engrisk'?T('Duyệt & xuất bản','Approve & publish'):T('Duyệt & xuất bản cho lớp','Approve & publish to class');
  if (m) return {panel:`<div class="card">${cardHead(T('Quyết định duyệt','Review decision'),'','',tile('shield-check','accent','sm'))}${checklist}<div class="separator"></div>${composer}<div class="separator"></div>${reason}${approveWhy?`<span class="description">${approveWhy}</span>`:''}</div>`,
    bar:`<div class="cm-mbar">${btn(T('Từ chối','Reject'),{v:'danger-soft',action:'modReject',disabled:!C.reason})}${btn(T('Yêu cầu sửa','Request changes'),{v:'secondary',action:'modChanges',disabled:!pend.length})}${btn(T('Duyệt','Approve'),{ic:'check',action:'modApprove',disabled:own||!all})}</div>`};
  return {panel:`<div class="card cm-decision">${cardHead(T('Quyết định duyệt','Review decision'),'','',tile('shield-check','accent','sm'))}${checklist}<div class="separator"></div>${composer}<div class="separator"></div>
    <div class="col gap-2">${btn(approveL,{ic:'check',action:'modApprove',full:true,disabled:own||!all})}${approveWhy?`<span class="description">${approveWhy}</span>`:`<span class="description">${target} · ${T('ghi công','credit')} ${esc(cmPerson(it.owner).name)}.</span>`}
    ${btn(pend.length?T(`Yêu cầu chỉnh sửa (${pend.length})`,`Request changes (${pend.length})`):T('Yêu cầu chỉnh sửa','Request changes'),{v:'secondary',ic:'comment',action:'modChanges',full:true,disabled:!pend.length})}${pend.length?'':`<span class="description">${T('Thêm ít nhất một góp ý để yêu cầu sửa.','Add at least one comment to request changes.')}</span>`}</div>
    <div class="separator"></div>${reason}${btn(T('Từ chối','Reject'),{v:'danger-soft',ic:'xmark',action:'modReject',full:true,disabled:!C.reason})}</div>`,bar:''};
}
function modStatusPanel(it,L){
  const d=L.decided.find(x=>x.id===it.id), m=isM();
  if (it.status==='changes_requested'){ const cs=cmComments(it.id), open=cs.filter(c=>!c.resolved).length;
    return `<div class="card">${cardHead(T('Đang chờ người gửi','Waiting for the author'),'','',tile('comment','warning','sm'))}<p class="text-sm text-muted">${T(`${open}/${cs.length} góp ý chưa xử lý. Bài trở lại hàng đợi khi người gửi gửi lại.`,`${open}/${cs.length} comments open. The item returns to the queue when resubmitted.`)}</p>${ctCommentList(it.id,{compact:true})}</div>`; }
  if (!d) return '';
  const by=cmPerson(d.by);
  return `<div class="card">${cardHead(tx(CM_DECISION[d.d][0]),'','',tile(CM_DECISION[d.d][2],CM_DECISION[d.d][1],'sm'))}
    <div class="row gap-2">${avatar(by.initials,{size:'xs',color:by.color})}<span class="text-sm">${esc(by.name)} · ${fmtDate(d.at)}${d.rev?` · ${T('Bản','Rev.')} ${d.rev}`:''}</span></div>
    ${d.reason?`<p class="text-sm text-muted">${T('Lý do','Reason')}: ${esc(tx(CM_REJECT[d.reason]))}</p>`:''}
    ${d.d==='approved'&&it.catalogId&&typeof EXAMS!=='undefined'&&EXAMS[it.catalogId]?btn(T('Xem trong thư viện','View in library'),{v:'tertiary',size:'sm',iconR:'arrow-right',action:'contribView',data:{id:it.id},full:m}):''}</div>`;
}
function rModeration(){
  const u=user(), m=isM(), C=S.contrib;
  if (!u.staff||!(can('content.review')||can('content.review_tenant'))) return `<div class="card card--lg">${empty('persons-lock',T('Bạn không có quyền kiểm duyệt','You don’t have review access'),T('Hàng đợi kiểm duyệt dành cho biên tập viên Engrisk và giáo viên của trung tâm.','The review queue is for Engrisk editors and center teachers.'),btn(T('Về Trang chủ','Go to Home'),{v:'tertiary',action:'go',data:{to:'home'}}),{color:'default'})}</div>`;
  if (viewState('moderation')==='empty') return `<div class="card card--lg">${empty('circle-check',T('Đã duyệt hết','All clear'),T('Không có bài nào chờ duyệt trong phạm vi này. Bài mới gửi sẽ xuất hiện tại đây.','Nothing is waiting in this scope. New submissions will appear here.'),btn('Content Studio',{v:'tertiary',ic:'layers',action:'go',data:{to:'studio'}}),{color:'success'})}</div>`;
  const L=modLists(), it=modSelected(L);
  const inReview = it&&it.status==='in_review';
  const detail = it?`<div class="card card--lg cm-detail">${modHeader(it)}${tabs(T('Chi tiết bài gửi','Submission details'),[['content',T('Nội dung','Content'),m?null:'file-text'],['checks',`${m?T('Kiểm tra','Checks'):T('Kiểm tra tự động','Automated checks')}${modData(it).checks.key.length?` · ${modData(it).checks.key.length}`:''}`,m?null:'shield-check'],['history',T('Lịch sử','History'),m?null:'clock']],C.dtab,'modDTab',{size:'sm',full:m})}
      ${C.dtab==='checks'?modChecks(it):C.dtab==='history'?modHistory(it):modContent(it,inReview)}</div>`:'';
  const dec = it?(inReview?modDecision(it):{panel:modStatusPanel(it,L),bar:''}):{panel:'',bar:''};
  if (m){
    if (C.mView!=='detail'||!it) return modQueue(L);
    return `<button type="button" class="link cm-back" data-action="modBack" data-fk="modBack">${icon('chevron-left',14)}${T('Hàng đợi','Queue')}</button>${detail}${dec.panel}${dec.bar}`;
  }
  const empty_ = `<div class="card card--lg">${empty('shield-check',T('Chọn một bài để xem','Select an item'),T('Chọn bài trong hàng đợi để xem nội dung và kết quả kiểm tra.','Pick an item from the queue to see its content and checks.'),'',{color:'default'})}</div>`;
  return `<div class="cm-modwrap"><div class="cm-mod">${modQueue(L)}${it?detail:empty_}<div class="cm-side">${dec.panel}</div></div></div>`;
}

/* ---------- Actions ---------- */
function modDecide(kind){
  const C=S.contrib, it=cmItem(C.sel); if(!it||it.status!=='in_review') return;
  const L=modLists(), ids=L.in_review.map(c=>c.id), i=ids.indexOf(it.id), next=ids[i+1]||ids[i-1]||null, me=cmMe(), title=tx(it.title);
  if (kind==='approved'){
    if (it.owner===me) return;
    it.status='published'; it.updated=CM_TODAY; it.issues=0; it.plays=it.plays||0;
    const cat='cm-'+it.id.replace(/^cd-|^st-/,''); if(!it.catalogId&&typeof EXAMS!=='undefined'&&EXAMS[cat]) it.catalogId=cat;
    C.decided.push({id:it.id,d:'approved',by:me,at:CM_TODAY,rev:it.rev});
    toast(T('Đã duyệt & xuất bản','Approved & published'),T(`“${title}” · bản ${it.rev} · ghi công ${cmPerson(it.owner).name}.`,`“${title}” · rev. ${it.rev} · credited to ${cmPerson(it.owner).name}.`));
  }
  if (kind==='changes'){
    const pend=C.pending[it.id]||[]; if(!pend.length) return;
    REVIEW_COMMENTS[it.id]=[...(REVIEW_COMMENTS[it.id]||[]).map(c=>({...c,resolved:true})),...pend.map(c=>({...c,resolved:false}))];
    it.status='changes_requested'; it.updated=CM_TODAY; it.issues=pend.length; it.resolved=[]; C.pending[it.id]=[];
    C.decided.push({id:it.id,d:'changes',by:me,at:CM_TODAY});
    toast(T('Đã gửi yêu cầu chỉnh sửa','Changes requested'),T(`${pend.length} góp ý đã gửi tới ${cmPerson(it.owner).name}.`,`${pend.length} comments sent to ${cmPerson(it.owner).name}.`),'info');
  }
  if (kind==='rejected'){
    if (!C.reason) return;
    it.status='archived'; it.updated=CM_TODAY; it.rejectReason=C.reason;
    C.decided.push({id:it.id,d:'rejected',by:me,at:CM_TODAY,reason:C.reason});
    toast(T('Đã từ chối bài gửi','Submission rejected'),T(`Lý do: ${tx(CM_REJECT[C.reason])}. Người gửi được thông báo.`,`Reason: ${tx(CM_REJECT[C.reason])}. The author was notified.`),'warning');
  }
  C.reason=''; C.ctext=''; C.dtab='content'; C.playing=false;
  C.sel=next; C.tab='in_review'; if(!next&&isM()) C.mView='list';
  render(true);
}
const COMMUNITY_ACTIONS = {
  /* contribute */
  contribNew:d=>{ S.contrib.newType=d.t||null; if(isM()){ A.contribWeb(); return; } cmOpenEditor('cd-new'); },
  contribEdit:d=>cmOpenEditor(d.id),
  contribView:d=>{ const it=cmItem(d.id); if(it&&it.catalogId&&typeof EXAMS!=='undefined'&&EXAMS[it.catalogId]){ A.openExam({id:it.catalogId}); return; } S.catalog.kind='community'; go('catalog'); },
  contribSubmit:d=>{ const it=cmItem(d.id); if(!it) return; it.status='in_review'; it.submitted=CM_TODAY; it.updated=CM_TODAY; it.issues=0; render(true);
    toast(T('Đã gửi duyệt','Submitted for review'),T(`Người duyệt phản hồi trước ${fmtDate(cmAdd(CM_TODAY,5))}.`,`A reviewer replies by ${fmtDate(cmAdd(CM_TODAY,5))}.`)); },
  contribReply:d=>{ const t=(S.contrib.reply[d.id]||'').trim(); if(!t){ const el=document.getElementById('ct-reply-'+d.id); if(el) el.focus(); return; }
    (S.contrib.thread[d.id]=S.contrib.thread[d.id]||[]).push({text:t,at:CM_TODAY}); S.contrib.reply[d.id]=''; render();
    toast(T('Đã gửi phản hồi','Reply sent'),T('Người duyệt sẽ thấy trong lịch sử bài gửi (mô phỏng).','The reviewer sees it in the submission history (simulated).'),'info'); },
  contribWeb:()=>toast(T('Đã gửi link tới e-mail','Link sent to your e-mail'),T('Mở trên máy tính để soạn câu hỏi, audio và script (mô phỏng).','Open it on a computer to edit questions, audio and scripts (simulated).'),'info'),
  contribGuide:()=>{ const el=document.getElementById('ct-guide'); if(el) el.scrollIntoView({behavior:'smooth',block:'start'}); },
  /* moderation */
  modOpen:d=>{ const it=cmItem(d.id), C=S.contrib; if(!it) return;
    C.tab=it.status==='in_review'?'in_review':it.status==='changes_requested'?'changes_requested':'decided';
    C.sel=it.id; C.dtab='content'; C.mView='detail'; C.playing=false; S.states.moderation=null; go('moderation'); },
  modTab:d=>{ const C=S.contrib; C.tab=d.v; C.sel=null; C.dtab='content'; C.playing=false; render(); },
  modSel:d=>{ const C=S.contrib; if(C.sel!==d.id){ C.dtab='content'; C.playing=false; C.reason=''; } C.sel=d.id; C.mView='detail'; render(isM()); },
  modBack:()=>{ S.contrib.mView='list'; S.contrib.playing=false; render(true); },
  modDTab:d=>{ S.contrib.dtab=d.v; render(); },
  modPlay:()=>{ S.contrib.playing=!S.contrib.playing; render(); },
  modCommentQ:d=>{ const C=S.contrib; C.cq=String(d.q); render(); const el=document.getElementById('mod-ct'); if(el){ el.scrollIntoView({block:'center'}); el.focus(); } },
  modAddComment:()=>{ const C=S.contrib, t=C.ctext.trim(); if(!t){ const el=document.getElementById('mod-ct'); if(el) el.focus(); return; }
    (C.pending[C.sel]=C.pending[C.sel]||[]).push({q:+C.cq,field:+C.cq===0?'general':C.cf,by:cmMe(),at:CM_TODAY,text:[t,t],resolved:false}); C.ctext=''; render(); },
  modDelComment:d=>{ const p=S.contrib.pending[S.contrib.sel]; if(p){ p.splice(+d.i,1); render(); } },
  modApprove:()=>modDecide('approved'),
  modChanges:()=>modDecide('changes'),
  modReject:()=>modDecide('rejected'),
};
function communityChange(el,k){
  const C=S.contrib;
  if (k==='modCheck'){ const a=C.check[C.sel]=C.check[C.sel]||[], i=a.indexOf(el.dataset.k); if(el.checked&&i<0) a.push(el.dataset.k); if(!el.checked&&i>=0) a.splice(i,1); render(); return true; }
  if (k==='modCq'){ C.cq=el.value; render(); return true; }
  if (k==='modCf'){ C.cf=el.value; return true; }
  if (k==='modReason'){ C.reason=el.value; render(); return true; }
  if (k==='modCtext'||k==='ctReply') return true;
  return false;
}
function communityInput(el,k){
  if (k==='modCtext'){ S.contrib.ctext=el.value; return true; }
  if (k==='ctReply'){ S.contrib.reply[el.dataset.id]=el.value; return true; }
  return false;
}
