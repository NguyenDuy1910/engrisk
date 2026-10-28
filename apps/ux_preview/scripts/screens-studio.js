/* Content Studio: library (studio), exam editor (studio-editor), package import (studio-import).
 * Contract with app.js: studioInitial(), studioEditorTitle(), rStudio(), rStudioEditor(), rStudioImport(),
 * STUDIO_ACTIONS (merged into A), studioChange(el,key)/studioInput(el,key) → true when handled.
 * State S.studio = {f,q,exam,origin (library filters) · ed (open draft: tab, question, audio playhead, edits, fixes) · imp (import wizard)}.
 * Content rows live in S.content (shared with contribute + moderation); publish/submit mutate them. */

const ST_TODAY = '2026-10-27';
const ST_STATUS = {draft:[['Bản nháp','Draft'],'default','pencil'],in_review:[['Chờ duyệt','In review'],'accent','clock'],changes_requested:[['Cần chỉnh sửa','Changes requested'],'warning','comment'],scheduled:[['Đã lên lịch','Scheduled'],'accent','calendar'],published:[['Đã xuất bản','Published'],'success','circle-check'],archived:[['Lưu trữ','Archived'],'default','box']};
const ST_VIS = {public:[['Công khai','Public'],'globe'],tenant:[['Thành viên','Members only'],'persons-lock'],private:[['Riêng tư','Private'],'lock']};
const ST_TIER = {guest:['Khách','Guest'],registered:['Đã đăng ký','Registered'],premium:['Premium','Premium']};
const ST_ORIGIN = {human:[['Biên soạn','Authored'],'pencil'],imported:[['Nhập gói','Imported'],'file-zipper'],community:[['Cộng đồng','Community'],'persons']};
const ST_EXAM = {toeic_lr:'TOEIC L&R',ielts_academic:'IELTS Academic'};
const ST_SPEAKERS = [['N','Narrator · US'],['W-US','Woman · US'],['W-AU','Woman · AU'],['M-UK','Man · UK'],['M-CA','Man · CA']];
const ST_PERQ = {P1:32,P2:26,P3:24,P4:24,L1:30,L2:30,L3:30,L4:30};
const ST_PARTS = {'st-toeic-p3-office':['P3'],'cd-p5-prepositions':['P5'],'cd-p7-emails':['P7'],'cd-p1-photos':['P1'],'cd-p2-replies':['P2'],'sr-hw-week6':['P5'],'sr-listening-drill':['P3','P4'],'sr-reading-quiz':['P7'],'cd-ielts-tfng':['R1'],'cd-new':['P5']};
const ST_TAGS = ['grammar.preposition','grammar.verb_form','grammar.word_form','grammar.connector','listening.photo','listening.question_response','listening.detail','listening.inference','listening.graphic','reading.main_idea','reading.detail','reading.cross_reference','reading.insertion','reading.tfng','reading.completion','reading.headings','reading.matching_features'];
const ST_FIELD = {options:['Phương án','Options'],explanation:['Giải thích','Explanation'],stem:['Câu hỏi','Stem'],audio:['Audio','Audio']};
const ST_LICENCE = {engrisk:[['Giấy phép không độc quyền cho Engrisk','Engrisk non-exclusive licence'],['Bạn giữ bản quyền. Engrisk được hiển thị, chỉnh sửa nhỏ và phân phối bộ đề trong nền tảng; bạn có thể rút lại cho các lượt làm mới.','You keep copyright. Engrisk may display, lightly edit and distribute the set on the platform; you can withdraw it for new attempts.']],ccby:[['CC BY 4.0','CC BY 4.0'],['Bất kỳ ai cũng được dùng lại, kể cả thương mại, miễn là ghi công bạn.','Anyone may reuse it, including commercially, as long as they credit you.']]};

/* ---------- Small helpers ---------- */
const stItem = id => S.content.find(c=>c.id===id);
const stEdItem = () => S.studio.ed && stItem(S.studio.ed.id);
const stStatusChip = s => { const v=ST_STATUS[s]||ST_STATUS.draft; return chip(tx(v[0]),v[1],v[2],{size:'sm'}); };
const stVisLabel = v => { const x=ST_VIS[v]||ST_VIS.public; return `<span class="row gap-1 nowrap text-sm">${icon(x[1],14,'text-muted')}${tx(x[0])}</span>`; };
const stOwner = k => PEOPLE[k]||{name:k,initials:'?',color:'accent'};
const stMe = () => S.role==='teacher'?'hanh':S.role==='content_admin'?'thao':'minh';
const stCanReview = () => can('content.review')||can('content.review_tenant');
const stCanImport = () => can('content.import')||can('content.publish_tenant');
const stModOk = () => typeof A!=='undefined'&&typeof A.modOpen==='function';
const stField = (label,control,{id,desc,req,err}={}) => `<div class="textfield"><label class="label ${req?'label--required':''}" ${id?`for="${id}"`:''}>${label}</label>${control}${err?`<span class="field-error">${err}</span>`:desc?`<span class="description">${desc}</span>`:''}</div>`;
const stRange = ns => ns.length>1?`${ns[0]}–${ns[ns.length-1]}`:String(ns[0]);
const stPartName = p => tx(ALL_PARTS[p].name);
function stSpec(c){
  if (typeof coverSpec==='function') return coverSpec(c);
  const m=/(\d+)\s*$/.exec(tx(c.title));
  return {track:c.exam==='ielts_academic'?'ielts':'toeic',skill:c.skill,kind:c.kind,label:m?m[1].padStart(2,'0'):'',origin:c.origin==='community'?'community':c.scope==='engrisk'?'official':'tenant'};
}
function stThumb(c,w=56,h=40){
  const inner = typeof examCover==='function' ? examCover(stSpec(c),{h,compact:true})
    : `<span class="st-thumb__fb tint-${c.skill==='mixed'?'mock':c.skill}">${icon(c.skill==='mixed'?'graduation-cap':SKILL_ICON[c.skill]||'file-text',Math.round(h*.45))}</span>`;
  return `<span class="st-thumb" style="width:${typeof w==='number'?w+'px':w};height:${h}px" aria-hidden="true">${inner}</span>`;
}
const stPhotoAlt = img => { const m=/aria-label="Photograph: ([^"]+)"/.exec(PHOTOS[img]||''); return m?m[1].charAt(0).toUpperCase()+m[1].slice(1)+'.':''; };
const stEvidence = b => { if (!b||['P1','P2'].includes(b.part)) return ''; const m=/“([^”]+)”/.exec((b.exp&&b.exp[1])||''); return m?m[1]:''; };

/* ---------- Draft model: parts, numbering, questions, audio, issues ---------- */
function stParts(c){
  if (ST_PARTS[c.id]) return ST_PARTS[c.id];
  if (c.exam==='ielts_academic') return c.skill==='listening'?['L1','L2','L3','L4']:['R1','R2','R3'];
  if (c.kind==='full_mock') return ['P1','P2','P3','P4','P5','P6','P7'];
  return c.skill==='listening'?['P1','P2','P3','P4']:['P5','P6','P7'];
}
function stModel(c){
  const parts=stParts(c), total=c.q[1], real=parts.reduce((a,p)=>a+ALL_PARTS[p].real,0)===total;
  let counts=parts.map(p=>ALL_PARTS[p].real);
  if (!real){ const sum=counts.reduce((a,b)=>a+b,0); counts=counts.map(x=>Math.floor(x/sum*total)); let r=total-counts.reduce((a,b)=>a+b,0); for(let i=0;r>0;i=(i+1)%counts.length,r--) counts[i]++; }
  const qs=[]; let n=1;
  parts.forEach((p,pi)=>{ const start=real?parseInt(ALL_PARTS[p].range,10):n; for(let k=0;k<counts[pi];k++) qs.push({n:start+k,part:p,idx:k,gi:qs.length}); n=start+counts[pi]; });
  const pick=i=>qs[Math.max(0,Math.min(qs.length-1,i))]||{};
  const p1=qs.filter(q=>q.part==='P1'), L=parts.filter(p=>ALL_PARTS[p].section==='L');
  const altQ=p1.length?p1[Math.min(2,p1.length-1)].n:null, cms=stComments(c).length, n0=c.issues||0;
  /* Seeded defects follow the same order as stIssues candidates: missing · audio · alt · key */
  const altIdx=(c.q[0]<c.q[1]?1:0)+(L.length&&(c.audio==='partial'||c.audio==='missing')?1:0), keyIdx=altIdx+(altQ?1:0);
  return {parts,counts,qs,real,L,altQ,altOn:!cms&&!!altQ&&n0>altIdx,keyOn:!cms&&n0>keyIdx,
    keyQ:(qs.find(q=>q.part==='P6')||pick(1)).n, dupQ:(qs.find(q=>q.part==='P5'&&q.idx===11)||pick(2)).n};
}
const ST_BANK = {};
const stBankList = part => ST_BANK[part] || (ST_BANK[part]=Object.keys(Q).filter(k=>Q[k].part===part&&['toeic01','ielts-r01','ielts-l01'].includes(Q[k].bank)).sort((a,b)=>firstNum(Q[a])-firstNum(Q[b])));
function stBase(M,qq){ const list=stBankList(qq.part); if(!list.length) return null; const exact=M.real&&list.find(k=>firstNum(Q[k])===qq.n); return Q[exact||list[qq.idx%list.length]]; }
/** Effective question = bank/import base + author edits (S.studio.ed.q[n]) */
function stQ(c,ed,M,qq){
  const e=ed.q[qq.n]||{}, empty=qq.gi>=c.q[0]&&!ed.fixed.missing&&!e.authored, b=empty?null:stBase(M,qq);
  const sec=ALL_PARTS[qq.part].section, ielts=/^[RL]\d$/.test(qq.part);
  const open = ielts && b && !b.options;
  const baseOpts = b&&b.options ? b.options : ielts ? (sec==='R'?TFNG:[]) : ABCD(...Array(qq.part==='P2'?3:4).fill(''));
  const opts = baseOpts.map(([k,t])=>[k, e.opts&&e.opts[k]!=null?e.opts[k]:t]);
  const answer = e.answer!==undefined ? e.answer : (!b||(M.keyOn&&qq.n===M.keyQ)||open ? null : b.answer);
  const fixedStem = qq.part==='P1'||qq.part==='P2';
  return {...qq, empty, base:b, open, accepted:e.accepted!=null?e.accepted:(open?[].concat(b.answer).join(' / '):''),
    stem:e.stem!=null?e.stem:(b?(b.stem||(b.group&&G[b.group]?`(${T('Chỗ trống','Blank')} ${qq.n})`:'')):''), fixedStem,
    opts, answer, expVi:e.expVi!=null?e.expVi:(b&&b.exp?b.exp[0]:''), expEn:e.expEn!=null?e.expEn:(b&&b.exp&&!stComments(c).some(cm=>cm.q===qq.n&&cm.field==='explanation')?b.exp[1]:''),
    img:b&&b.img?b.img:(qq.part==='P1'?['office','warehouse'][qq.idx%2]:null),
    alt:e.alt!=null?e.alt:((M.altOn&&qq.n===M.altQ)||!b?'':stPhotoAlt(b.img||'office')),
    ev:e.ev!=null?e.ev:stEvidence(b), diff:e.diff||2+qq.n%3, tags:e.tags||(b&&b.skill?[b.skill]:[]), group:b?b.group:null};
}
const stMissing = (c,ed,M) => ed.fixed.missing?[]:M.qs.filter(q=>q.gi>=c.q[0]&&!(ed.q[q.n]&&ed.q[q.n].authored));
function stAudio(c,ed,M){
  M=M||stModel(c); if (!M.L.length) return null;
  let t=0; const bands=[], units=[];
  M.L.forEach(p=>{ const qs=M.qs.filter(q=>q.part===p), grp=['P3','P4'].includes(p)?3:1, start=t; let k=0; t+=20;
    for(let i=0;i<qs.length;i+=grp){ const g=qs.slice(i,i+grp); units.push({key:`${p}-${g[0].n}`,part:p,ns:g.map(x=>x.n),at:t,len:ST_PERQ[p]*g.length,k:k++}); t+=ST_PERQ[p]*g.length; }
    bands.push({part:p,start,end:t}); });
  const hasFile=c.audio!=='missing'||!!ed.fixed.upload, aligned=ed.align==='done';
  const miss = c.audio==='missing'?units.length:c.audio==='partial'?Math.min(2,units.length):0;
  const low = aligned?[...new Set([.2,.55,.85].map(f=>Math.floor(units.length*f)))]:[];
  units.forEach((u,i)=>{ u.low=low.includes(i); u.st = !aligned&&i>=units.length-miss ? 'missing' : u.low&&!ed.confirmed[u.key] ? 'check' : 'ok'; });
  return {dur:t,bands,units,hasFile,file:`${c.id.replace(/^st-|^cd-|^sr-/,'')}_listening.mp3`};
}
function stUnitLines(u){
  const P=u.part, k=u.k;
  const src = P==='P1'?TOEIC_Q[['t1','t2'][k%2]].audio.lines : P==='P2'?TOEIC_Q[['t7','t8','t9'][k%3]].audio.lines : P==='P3'?TOEIC_G.t_p3a.lines : P==='P4'?TOEIC_G.t_p4a.lines : ((IELTS_G['i_'+P.toLowerCase()]||{}).lines||[]);
  const last=src.length?src[src.length-1][0]:0, sc=Math.min(2.4,(u.len-4)/(last+4));
  return src.map(([o,s,text],i)=>({key:`${u.key}:${i}`,i,at:u.at+1+o*sc,end:i<src.length-1?u.at+1+src[i+1][0]*sc:u.at+1+(last+4)*sc,spk:s==='N'?'N':s==='W'?(k%2?'W-AU':'W-US'):(k%2?'M-CA':'M-UK'),text}));
}
const stComments = c => (typeof REVIEW_COMMENTS!=='undefined'&&REVIEW_COMMENTS[c.id])||[];
const stCommentDone = (c,cm,i) => !!cm.resolved||(c.resolved||[]).includes(i);
/** Checklist: blocking + non-blocking issues, each resolvable by editing (dynamic) or a quick fix */
function stIssues(c,ed){
  const M=stModel(c), A=stAudio(c,ed,M), out=[], cms=stComments(c), contrib=ed.as==='contributor';
  if (cms.length) cms.forEach((cm,i)=>out.push({id:'rc'+i,block:true,ic:'comment',done:stCommentDone(c,cm,i),title:[`Góp ý câu ${cm.q} · ${ST_FIELD[cm.field]?ST_FIELD[cm.field][0]:cm.field}`,`Comment on Q${cm.q} · ${ST_FIELD[cm.field]?ST_FIELD[cm.field][1]:cm.field}`],desc:cm.text,by:cm.by,go:{tab:'questions',q:cm.q},fix:'resolve',fixL:['Đánh dấu đã sửa','Mark as fixed'],i}));
  else {
    const cand=[], m0=M.qs.filter(q=>q.gi>=c.q[0]);
    if (m0.length){ const left=stMissing(c,ed,M).length; cand.push({id:'missing',block:true,ic:'file-plus',done:!left,title:[`${m0.length} câu chưa có nội dung (câu ${m0[0].n}–${m0[m0.length-1].n})`,`${m0.length} questions have no content (Q${m0[0].n}–${m0[m0.length-1].n})`],desc:left?[`Còn ${left} câu — soạn trực tiếp${contrib?'':' hoặc lấy từ ngân hàng đã kiểm duyệt'}.`,`${left} left — write them${contrib?'':' or pull from the verified bank'}.`]:null,go:{tab:'questions',q:m0[0].n},fix:contrib?null:'bank',fixL:['Lấy từ ngân hàng','Pull from bank']}); }
    if (A&&(c.audio==='partial'||c.audio==='missing')){ const miss=A.units.filter(u=>u.st==='missing'); const ns=miss.flatMap(u=>u.ns);
      cand.push({id:'audio',block:true,ic:'music-note',done:A.hasFile&&!miss.length,title:c.audio==='missing'?['Chưa có file audio Listening','No listening audio file']:[`${miss.length||2} cue audio bị thiếu${ns.length?` (câu ${stRange(ns)})`:''}`,`${miss.length||2} audio cues missing${ns.length?` (Q${stRange(ns)})`:''}`],go:{tab:'audio'},fix:A.hasFile?'align':'upload',fixL:A.hasFile?['Tự căn chỉnh','Auto-align']:['Tải audio lên','Upload audio']}); }
    if (M.altQ){ const q=stQ(c,ed,M,M.qs.find(x=>x.n===M.altQ)); cand.push({id:'alt',block:true,ic:'picture',done:!!q.alt.trim(),title:[`Câu ${M.altQ}: ảnh Part 1 thiếu mô tả (alt text)`,`Q${M.altQ}: Part 1 photo has no alt text`],go:{tab:'questions',q:M.altQ},fix:'alt',fixL:['Gợi ý mô tả (AI)','Suggest alt text (AI)']}); }
    { const q=stQ(c,ed,M,M.qs.find(x=>x.n===M.keyQ)); cand.push({id:'key',block:true,ic:'circle-check',done:!!q.answer||q.open,title:[`Câu ${M.keyQ}: chưa chọn đáp án đúng`,`Q${M.keyQ}: no correct answer selected`],go:{tab:'questions',q:M.keyQ}}); }
    cand.push({id:'exp',block:false,ic:'globe',done:!!ed.fixed.exp,title:[`${Math.min(9,M.qs.length)} câu thiếu giải thích tiếng Anh`,`${Math.min(9,M.qs.length)} questions lack an English explanation`],go:{tab:'questions'},fix:'exp',fixL:['Dịch nháp (AI)','Draft translation (AI)']});
    cand.push({id:'dup',block:false,ic:'copy',done:!!ed.fixed.dup,title:[`Câu ${M.dupQ} giống 92% một câu trong ngân hàng`,`Q${M.dupQ} is 92% similar to a bank item`],go:{tab:'questions',q:M.dupQ},fix:'dup',fixL:['Không phải trùng lặp','Not a duplicate']});
    cand.push({id:'tags',block:false,ic:'tag',done:!!ed.fixed.tags,title:[`${Math.min(4,M.qs.length)} câu chưa gắn thẻ kỹ năng`,`${Math.min(4,M.qs.length)} questions have no skill tag`],go:{tab:'questions'},fix:'tags',fixL:['Gợi ý thẻ (AI)','Suggest tags (AI)']});
    out.push(...cand.slice(0,c.issues||0));
  }
  if (A&&ed.align==='done'){ const n=A.units.filter(u=>u.st==='check').length; out.push({id:'conf',block:false,ic:'ear',done:!n,title:[`3 cue có độ tin cậy thấp${n?` · còn ${n}`:''}`,`3 low-confidence cues${n?` · ${n} left`:''}`],go:{tab:'audio'},fix:'confirm',fixL:['Xác nhận tất cả','Confirm all']}); }
  return out;
}
function stQState(c,ed,M,A,q,dupOn){
  if (q.empty) return 'empty';
  if ((!q.answer&&!q.open)||(q.part==='P1'&&!q.alt.trim())) return 'err';
  const cms=stComments(c).some((cm,i)=>cm.q===q.n&&!stCommentDone(c,cm,i));
  const unit=A&&A.units.find(u=>u.ns.includes(q.n));
  if (cms||(unit&&unit.st!=='ok')||(dupOn&&q.n===M.dupQ)) return 'warn';
  return 'ok';
}
const ST_QST = {ok:[['Hoàn chỉnh','Complete'],'success','circle-check'],warn:[['Cần kiểm tra','Needs review'],'warning','triangle-exclamation'],err:[['Có lỗi','Has errors'],'danger','circle-exclamation'],empty:[['Chưa soạn','Not written'],'default','circle-dashed']};

/* ---------- State ---------- */
function studioInitial(){ return {f:'all',q:'',exam:'all',origin:'all',ed:null,imp:{step:1,tpl:'excel',file:null,rights:'',ok:false,phase:'idle'}}; }
function stNewEd(c,as){
  const M=stModel(c), cms=stComments(c), t=Array.isArray(c.title)?c.title:[c.title,c.title];
  const first = as==='contributor'&&cms.length ? cms[0].q : (M.qs[0]||{}).n;
  const fq = M.qs.find(q=>q.n===first)||M.qs[0]||{};
  return {id:c.id,as:as||null,tab:as==='contributor'&&cms.some((cm,i)=>!stCommentDone(c,cm,i))?'questions':'overview',qsel:fq.n,part:fq.part||M.parts[0],qf:'all',pv:false,
    t:0,playing:false,zoom:1,align:'idle',spart:M.L[0]||null,su:0,confirmed:{},fixed:{},q:{},lines:{},spk:{},
    titleVi:t[0],titleEn:t[1],desc:'',vis:c.visibility,tier:c.tier,shuffle:false,practice:true,
    notes:'',sched:'now',date:'2026-11-03',licence:c.licence||null,rights:false,save:'saved'};
}
function stEnsureEd(){
  const ed=S.studio.ed; if (ed&&stItem(ed.id)) return ed;
  const id = S.role==='learner'?'cd-p7-emails':S.role==='teacher'?'sr-listening-drill':'st-toeic-test-04';
  S.studio.ed=stNewEd(stItem(id),S.role==='learner'?'contributor':null); return S.studio.ed;
}
function studioEditorTitle(){ const c=stEdItem(); return c?tx(c.title):T('Trình soạn đề','Exam editor'); }
let stSaveT=null, stTimer=null, stAlignT=null, stImpT=null;
function stDirty(){
  const ed=S.studio.ed; if(!ed) return; ed.save='saving'; const b=document.getElementById('st-save'); if(b) b.innerHTML=stSaveHtml();
  clearTimeout(stSaveT); stSaveT=setTimeout(()=>{ if(!S.studio.ed) return; S.studio.ed.save='saved'; const b2=document.getElementById('st-save'); if(b2) b2.innerHTML=stSaveHtml(); },700);
}
const stSaveHtml = () => S.studio.ed&&S.studio.ed.save==='saving' ? `<span class="spinner spinner--sm">${SPIN}</span>${T('Đang lưu…','Saving…')}` : `${icon('cloud-arrow-up-in',14)}${T('Đã lưu tự động','Autosaved')}`;

/* =====================================================================
   STUDIO — library
   ===================================================================== */
const ST_FILTERS = [['all',['Tất cả','All'],()=>true],['draft',['Bản nháp','Drafts'],c=>c.status==='draft'||c.status==='changes_requested'],['in_review',['Chờ duyệt','In review'],c=>c.status==='in_review'],['scheduled',['Đã lên lịch','Scheduled'],c=>c.status==='scheduled'],['published',['Đã xuất bản','Published'],c=>c.status==='published'],['archived',['Lưu trữ','Archived'],c=>c.status==='archived']];
function stTodos(rows){
  const out=[];
  if (stCanReview()) rows.filter(c=>c.status==='in_review').forEach(c=>out.push({c,ic:'shield-check',col:'accent',t:[`Duyệt: ${tx(c.title)}`,`Review: ${tx(c.title)}`],d:[`${stOwner(c.owner).name} gửi ${fmtDate(c.submitted||c.updated)} · hạn phản hồi 3 ngày`,`Sent by ${stOwner(c.owner).name} ${fmtDate(c.submitted||c.updated)} · respond within 3 days`],act:'review'}));
  rows.filter(c=>(c.status==='draft'||c.status==='changes_requested')&&c.issues>0&&c.origin!=='community').forEach(c=>out.push({c,ic:'triangle-exclamation',col:'danger',t:[`${c.issues} vấn đề cần xử lý: ${tx(c.title)}`,`${c.issues} issues to fix: ${tx(c.title)}`],d:[`${c.q[0]}/${c.q[1]} câu · ${stOwner(c.owner).name}`,`${c.q[0]}/${c.q[1]} questions · ${stOwner(c.owner).name}`],act:'open'}));
  rows.filter(c=>c.status==='scheduled').forEach(c=>out.push({c,ic:'calendar',col:'default',t:[`Sẽ xuất bản ${fmtDate(c.publishAt)}: ${tx(c.title)}`,`Publishing ${fmtDate(c.publishAt)}: ${tx(c.title)}`],d:[`Kiểm tra lần cuối trước khi lên catalog`,`Final check before it goes live`],act:'open'}));
  return out.slice(0,5);
}
const ST_VERB = {published:['đã xuất bản','published'],in_review:['gửi duyệt','submitted'],draft:['cập nhật bản nháp','updated the draft'],changes_requested:['nhận góp ý cho','got feedback on'],scheduled:['lên lịch','scheduled'],archived:['lưu trữ','archived']};
function rStudio(){
  const st=viewState('studio'), m=isM(), SS=S.studio, scope=contentScope(), tenant=scope!=='engrisk';
  const banner = `<div class="card st-scope tint-band ${tenant?'tint-speaking':'tint-listening'}"><div class="row gap-3 grow" style="min-width:0">${tile(tenant?'persons-lock':'globe',tenant?'success':'accent')}<div style="min-width:0"><div class="row gap-2"><span class="font-semibold">${tenant?T('Thư viện Tenant · Sunrise English','Tenant library · Sunrise English'):T('Thư viện Platform · Engrisk','Platform library · Engrisk')}</span>${chip(tenant?T('Chỉ thành viên','Members only'):T('Danh mục công khai','Public catalog'),tenant?'success':'accent',tenant?'lock':'globe',{size:'sm'})}</div><div class="text-sm text-muted">${tenant?T('Đề xuất bản ở đây chỉ hiển thị cho học viên của Sunrise English.','Sets published here are visible to Sunrise English learners only.'):T('Đề xuất bản ở đây xuất hiện trong Luyện đề cho mọi học viên; đóng góp cộng đồng được duyệt trước khi lên.','Sets published here appear in Practice tests for every learner; community sets are reviewed first.')}</div></div></div>
    ${m?'':`<div class="row gap-2 shrink-0">${stCanImport()?btn(T('Nhập gói đề','Import package'),{v:'secondary',ic:'file-zipper',action:'go',data:{to:'studio-import'}}):''}${btn(T('Tạo đề mới','New test'),{ic:'plus',action:'stNew'})}</div>`}</div>`;
  if (st==='loading') return banner+`<div class="grid ${m?'grid-2':'grid-4'}">${[1,2,3,4].map(()=>`<div class="card">${sk(14,'50%')}${sk(28,'40%')}</div>`).join('')}</div><div class="card">${sk(20,'30%')}${[1,2,3,4,5].map(()=>`<div class="row gap-3">${sk(40,'56px',8)}<div class="grow col gap-2">${sk(14,'40%')}${sk(12,'25%')}</div>${sk(20,'80px',10)}</div>`).join('')}</div>`;
  if (st==='error') return banner+alertBox('danger',T('Không tải được thư viện nội dung','Couldn’t load the content library'),T('Bản nháp đã lưu không bị ảnh hưởng. Thử lại sau ít phút.','Saved drafts are not affected. Try again in a few minutes.'),btn(T('Thử lại','Retry'),{v:'tertiary',size:'sm',ic:'arrows-rotate-right',action:'setState',data:{s:'default'}}));
  const all = st==='empty'?[]:S.content.filter(c=>c.scope===scope&&!(c.origin==='community'&&c.status==='draft'));
  if (!all.length) return banner+`<div class="card card--lg">${empty('layers',T('Chưa có nội dung trong thư viện','No content in this library yet'),tenant?T('Tạo bài cho lớp hoặc nhập gói đề có sẵn. Bài chỉ hiển thị cho thành viên Sunrise.','Create a set for your class or import a package. Sets stay visible to Sunrise members only.'):T('Tạo đề đầu tiên hoặc nhập gói đề (Excel/ZIP) để bắt đầu.','Create your first test or import a package (Excel/ZIP) to start.'),(m?'':btn(T('Tạo đề mới','New test'),{ic:'plus',action:'stNew'}))+(stCanImport()&&!m?btn(T('Nhập gói đề','Import package'),{v:'tertiary',ic:'file-zipper',action:'go',data:{to:'studio-import'}}):''))}</div>`;
  const pub=all.filter(c=>c.status==='published'), drafts=all.filter(c=>c.status==='draft'||c.status==='changes_requested'), rev=all.filter(c=>c.status==='in_review');
  const plays=pub.reduce((a,c)=>a+(c.plays||0),0);
  const kpis = `<div class="grid ${m?'grid-2':'grid-4'}" style="${m?'gap:10px':''}">${stat(T('Đang soạn','Drafting'),String(drafts.length),{foot:m?'':`<span class="text-xs text-muted">${drafts.reduce((a,c)=>a+(c.issues||0),0)} ${T('vấn đề mở','open issues')}</span>`})}${stat(T('Chờ duyệt','In review'),String(rev.length),{foot:m?'':`<span class="text-xs text-muted">${tenant?`${rev.length} ${T('từ giáo viên','from teachers')}`:`${rev.filter(c=>c.origin==='community').length} ${T('từ cộng đồng','from community')}`}</span>`})}${stat(T('Đã xuất bản','Published'),String(pub.length),{small:T('bộ','sets'),foot:m?'':`<span class="text-xs text-muted">${all.filter(c=>c.status==='scheduled').length} ${T('đã lên lịch','scheduled')}</span>`})}${stat(tenant?T('Lượt làm của lớp','Class attempts'):T('Lượt làm','Attempts'),fmtNum(plays),{foot:m?'':`<span class="text-xs text-muted">${T('tổng trên bộ đề đã xuất bản','total on published sets')}</span>`})}</div>`;
  const todos=stTodos(all);
  const todoCard = `<div class="card">${cardHead(T('Việc cần làm','To do'),`<span class="text-xs text-muted">${todos.length}</span>`,'',tile('list-check','default','sm'))}${todos.length?`<div class="list list--flush">${todos.map(td=>`<button type="button" class="list-box-item" data-action="${td.act==='review'?'stReview':'stOpenRow'}" data-id="${td.c.id}" data-fk="todo:${td.c.id}">${tile(td.ic,td.col,'sm')}<span class="grow" style="min-width:0"><span class="list-box-item__label truncate">${tx(td.t)}</span><span class="list-box-item__description truncate">${tx(td.d)}</span></span>${icon('chevron-right',14,'text-muted')}</button>`).join('')}</div>`:`<p class="text-sm text-muted">${T('Không còn việc tồn đọng.','Nothing pending.')}</p>`}</div>`;
  if (m) return banner+kpis+todoCard+stMobileList(all)+alertBox('default',T('Soạn và nhập gói trên máy tính','Author and import on a computer'),T('Trên điện thoại bạn theo dõi, duyệt và xuất bản. Trình soạn audio/câu hỏi cần màn hình lớn.','On mobile you can monitor, review and publish. The audio/question editor needs a large screen.'),'',{ic:'display',flat:true});
  const recent=[...all].sort((a,b)=>b.updated.localeCompare(a.updated)).slice(0,5);
  const activity = `<div class="card">${cardHead(T('Hoạt động gần đây','Recent activity'),'','',tile('clock-arrow-rotate-left','default','sm'))}<div class="list list--flush">${recent.map(c=>{const o=stOwner(c.owner); return `<div class="list-box-item">${avatar(o.initials,{size:'sm',color:o.color})}<span class="grow" style="min-width:0"><span class="list-box-item__label truncate" style="font-weight:400"><b class="font-medium">${o.name}</b> ${tx(ST_VERB[c.status])} <span class="font-medium">${esc(tx(c.title))}</span></span><span class="list-box-item__description">${fmtDate(c.updated)}</span></span></div>`;}).join('')}</div></div>`;
  return banner+kpis+`<div class="grid grid-2 grid--stretch">${todoCard}${activity}</div>`+stTable(all);
}
function stFiltered(all){
  const SS=S.studio, f=ST_FILTERS.find(x=>x[0]===SS.f)||ST_FILTERS[0], q=SS.q.trim().toLowerCase();
  return all.filter(c=>f[2](c)&&(SS.exam==='all'||c.exam===SS.exam)&&(SS.origin==='all'||c.origin===SS.origin)&&(!q||tx(c.title).toLowerCase().includes(q)||c.id.includes(q)));
}
function stRowMenu(c){
  const open=S.navMenu==='st:'+c.id;
  return `<div class="dropdown" data-dropdown="1">${btn('',{v:'ghost',size:'sm',ic:'ellipsis-vertical',action:'navMenu',data:{v:'st:'+c.id},aria:T('Thao tác cho','Actions for')+' '+tx(c.title)})}
    ${open?`<div class="dropdown__menu" role="menu" style="min-width:200px">
      <button type="button" class="menu-item" role="menuitem" data-action="stOpenRow" data-id="${c.id}">${icon('pencil')}<span class="grow">${T('Mở trình soạn','Open editor')}</span></button>
      <button type="button" class="menu-item" role="menuitem" data-action="stPreview" data-id="${c.id}">${icon('eye')}<span class="grow">${T('Xem trước','Preview')}</span></button>
      ${c.status==='in_review'&&stCanReview()?`<button type="button" class="menu-item" role="menuitem" data-action="stReview" data-id="${c.id}">${icon('shield-check')}<span class="grow">${T('Mở trong hàng đợi duyệt','Open in review queue')}</span></button>`:''}
      <button type="button" class="menu-item" role="menuitem" data-action="stDuplicate" data-id="${c.id}">${icon('copy-plus')}<span class="grow">${T('Nhân bản thành bản nháp','Duplicate as draft')}</span></button>
      ${c.status!=='archived'?`<button type="button" class="menu-item" role="menuitem" data-action="stArchive" data-id="${c.id}">${icon('box')}<span class="grow">${T('Lưu trữ','Archive')}</span></button>`:''}
    </div>`:''}</div>`;
}
function stTable(all){
  const SS=S.studio, rows=stFiltered(all);
  const filters = `<div class="row row--between row--wrap gap-3">${tabs(T('Lọc theo trạng thái','Filter by status'),ST_FILTERS.map(([v,l,fn])=>[v,`${tx(l)} <span class="st-count">${all.filter(fn).length}</span>`]),SS.f,'stFilter',{size:'sm'})}
    <div class="row gap-2"><div class="input-group" style="width:220px"><span class="input-group__prefix">${icon('magnifier',14)}</span><input id="st-search" class="input input--secondary" placeholder="${T('Tìm theo tên hoặc mã','Search name or ID')}" value="${esc(SS.q)}" data-input="stSearch" aria-label="${T('Tìm nội dung','Search content')}"></div>
    <select id="st-fexam" class="select select--secondary" style="width:160px" data-input="stExam" aria-label="${T('Kỳ thi','Exam')}"><option value="all">${T('Mọi kỳ thi','All exams')}</option>${Object.entries(ST_EXAM).map(([v,l])=>`<option value="${v}" ${SS.exam===v?'selected':''}>${l}</option>`).join('')}</select>
    <select id="st-forigin" class="select select--secondary" style="width:150px" data-input="stOrigin" aria-label="${T('Nguồn','Origin')}"><option value="all">${T('Mọi nguồn','All origins')}</option>${Object.entries(ST_ORIGIN).map(([v,l])=>`<option value="${v}" ${SS.origin===v?'selected':''}>${tx(l[0])}</option>`).join('')}</select></div></div>`;
  const body = rows.length ? `<div class="st-tablewrap"><table class="table st-table"><thead><tr><th>${T('Bộ đề','Test')}</th><th>${T('Trạng thái · revision','Status · revision')}</th><th>${T('Hiển thị · truy cập','Visibility · access')}</th><th>${T('Cập nhật','Updated')}</th><th>${T('Hoàn thiện','Completeness')}</th><th><span class="sr-only">${T('Thao tác','Actions')}</span></th></tr></thead><tbody>${rows.map(c=>{
      const o=stOwner(c.owner), og=ST_ORIGIN[c.origin], full=c.q[0]>=c.q[1];
      return `<tr class="is-click" data-action="${c.status==='in_review'&&stCanReview()?'stReview':'stOpenRow'}" data-id="${c.id}" tabindex="0" aria-label="${esc(tx(c.title))}">
      <td><span class="row gap-3">${stThumb(c)}<span style="min-width:0"><span class="font-medium st-title">${esc(tx(c.title))}</span><span class="row gap-1 text-xs text-muted nowrap">${c.exam==='ielts_academic'?'IELTS':'TOEIC'} · ${tx(KIND[c.kind])} · ${icon(og[1],12)}${tx(og[0])}</span></span></span></td>
      <td>${stStatusChip(c.status)}<div class="text-xs text-muted nowrap tnum" style="margin-top:2px">Rev ${c.rev}${c.status==='scheduled'?` · ${fmtDate(c.publishAt)}`:''}</div></td>
      <td>${stVisLabel(c.visibility)}<span class="row gap-1 nowrap text-xs text-muted" style="margin-top:2px">${c.tier==='premium'?icon('crown-diamond',12,'text-warning'):icon('person',12)}${tx(ST_TIER[c.tier])}</span></td>
      <td><span class="row gap-2 nowrap" title="${esc(o.name)}">${avatar(o.initials,{size:'xs',color:o.color})}<span class="text-sm tnum text-muted">${fmtDate(c.updated)}</span><span class="sr-only">· ${esc(o.name)}</span></span></td>
      <td><span class="st-comp">${progressBar(c.q[0],c.q[1],{size:'sm',color:full?'success':'',aria:T('Hoàn thiện','Completeness')})}<span class="text-xs tnum ${full?'text-muted':'font-medium'}">${c.q[0]}/${c.q[1]}${c.issues?` · <span class="text-danger">${icon('circle-exclamation',11)}${c.issues}</span>`:''}</span></span></td>
      <td data-stop="1">${stRowMenu(c)}</td></tr>`;}).join('')}</tbody></table></div>`
    : empty('magnifier',T('Không có nội dung khớp bộ lọc','No content matches the filters'),T('Đổi trạng thái, kỳ thi hoặc từ khóa.','Change the status, exam or search term.'),btn(T('Xóa bộ lọc','Clear filters'),{v:'tertiary',size:'sm',action:'stClear'}),{color:'default'});
  return `<div class="card">${cardHead(T('Tất cả nội dung','All content'),`<span class="text-xs text-muted">${rows.length}/${all.length}</span>`)}${filters}${body}</div>`;
}
function stMobileList(all){
  const SS=S.studio, rows=stFiltered(all);
  return `<div class="card">${cardHead(T('Nội dung','Content'),`<span class="text-xs text-muted">${rows.length}</span>`)}${tabs(T('Lọc theo trạng thái','Filter by status'),ST_FILTERS.filter(f=>f[0]!=='archived').map(([v,l])=>[v,tx(l)]),SS.f,'stFilter',{size:'sm'})}
    ${rows.length?`<div class="list list--flush list--divided">${rows.map(c=>`<button type="button" class="list-box-item" data-action="${c.status==='in_review'&&stCanReview()?'stReview':'stOpenRow'}" data-id="${c.id}" data-fk="mrow:${c.id}">${stThumb(c,52,40)}<span class="grow" style="min-width:0"><span class="list-box-item__label truncate">${esc(tx(c.title))}</span><span class="list-box-item__description">${tx(KIND[c.kind])} · ${c.q[0]}/${c.q[1]} ${T('câu','Qs')}${c.issues?` · ${c.issues} ${T('vấn đề','issues')}`:''}</span></span>${stStatusChip(c.status)}</button>`).join('')}</div>`:`<p class="text-sm text-muted">${T('Không có nội dung ở trạng thái này.','Nothing in this status.')}</p>`}</div>`;
}

/* =====================================================================
   STUDIO EDITOR
   ===================================================================== */
function stPrimary(c,ed){
  if (ed.as==='contributor') return {l:T('Gửi duyệt','Submit for review'),ic:'paper-plane'};
  if (can('content.publish')) return {l:ed.sched==='later'?T('Lên lịch xuất bản','Schedule'):c.status==='published'?T(`Xuất bản rev ${c.rev+1}`,`Publish rev ${c.rev+1}`):T('Xuất bản','Publish'),ic:'rocket'};
  return {l:T('Xuất bản cho lớp','Publish to class'),ic:'persons'};
}
function rStudioEditor(){
  const ed=stEnsureEd(), c=stItem(ed.id), M=stModel(c), A=stAudio(c,ed,M), iss=stIssues(c,ed), m=isM(), contrib=ed.as==='contributor';
  const open=iss.filter(i=>!i.done), blk=open.filter(i=>i.block).length;
  if (m) return stMobileEditor(c,ed,M,A,iss);
  const og=ST_ORIGIN[c.origin], pr=stPrimary(c,ed);
  const crumbs = contrib?['contribute',T('Đóng góp đề','Contribute')]:['studio','Content Studio'];
  const head = `<div class="card st-head"><div class="row gap-4">${stThumb(c,104,68)}
    <div class="grow col gap-1" style="min-width:0"><nav class="row gap-1 text-xs text-muted" aria-label="${T('Đường dẫn','Breadcrumb')}"><button type="button" class="link text-xs" data-action="go" data-to="${crumbs[0]}">${crumbs[1]}</button>${icon('chevron-right',12)}<code class="st-code">${c.id}</code></nav>
      <h2 class="text-lg font-semibold truncate">${esc(tx(c.title))}</h2>
      <div class="row row--wrap gap-1">${stStatusChip(c.status)}${chip(c.status==='published'?T(`Rev ${c.rev} đang phát hành · sửa tạo rev ${c.rev+1}`,`Rev ${c.rev} live · edits create rev ${c.rev+1}`):`Rev ${c.rev}`,'default','code-fork',{size:'sm'})}${chip(`${ST_EXAM[c.exam]} · ${tx(KIND[c.kind])}`,'default',null,{size:'sm'})}${chip(tx(og[0]),c.origin==='community'?'accent':'default',og[1],{size:'sm'})}${contrib?chip(T('Chế độ người đóng góp','Contributor mode'),'accent','person-pencil',{size:'sm'}):''}</div></div>
    <div class="row gap-2 shrink-0"><span id="st-save" class="save-status" role="status">${stSaveHtml()}</span>${btn(T('Xem trước','Preview'),{v:'tertiary',ic:'eye',action:'stPreview',data:{id:c.id}})}${btn(pr.l,{ic:pr.ic,action:'stPublish'})}</div></div></div>`;
  const badge = n => n?` <span class="st-badge ${blk?'st-badge--danger':''}" aria-label="${n} ${T('vấn đề','issues')}">${n}</span>`:'';
  const qIss=open.filter(i=>i.go&&i.go.tab==='questions').length, aIss=open.filter(i=>i.go&&i.go.tab==='audio').length;
  const tabBar = tabs(T('Phần của trình soạn','Editor sections'),[['overview',T('Tổng quan','Overview'),'layout-header'],['structure',T('Cấu trúc','Structure'),'layers'],['audio',T('Audio & Script','Audio & Script')+badge(aIss),'music-note'],['questions',T('Câu hỏi','Questions')+badge(qIss),'list-check'],['publish',(contrib?T('Kiểm tra & gửi duyệt','Check & submit'):T('Kiểm tra & xuất bản','Check & publish'))+badge(open.length),'rocket']],ed.tab,'stTab');
  const status = c.status==='in_review'&&!contrib ? alertBox('accent',T('Bộ đề đang chờ duyệt','This set is in review'),T('Sửa trong lúc duyệt sẽ tạo bản nháp mới; người duyệt vẫn xem bản đã gửi.','Editing during review creates a new draft; reviewers still see the submitted version.'),stModOk()&&stCanReview()?btn(T('Mở trong hàng đợi duyệt','Open in review queue'),{v:'tertiary',size:'sm',ic:'shield-check',action:'stReview',data:{id:c.id}}):'',{flat:true})
    : c.status==='changes_requested'&&contrib ? alertBox('warning',T('Người duyệt yêu cầu chỉnh sửa','The reviewer requested changes'),T('Sửa theo từng góp ý (hiển thị ngay trên câu liên quan), đánh dấu đã sửa rồi gửi duyệt lại.','Address each comment (shown on the related question), mark it fixed, then resubmit.'),'',{flat:true}) : '';
  const body = ed.tab==='structure'?stStructureTab(c,ed,M,A):ed.tab==='audio'?stAudioTab(c,ed,M,A):ed.tab==='questions'?stQuestionsTab(c,ed,M,A):ed.tab==='publish'?stPublishTab(c,ed,M,A,iss):stOverviewTab(c,ed,M,A,iss);
  return head+`<div class="row row--between">${tabBar}</div>`+status+body;
}

/* ---------- Tab: Overview ---------- */
function stOverviewTab(c,ed,M,A,iss){
  const contrib=ed.as==='contributor', blk=iss.filter(i=>i.block&&!i.done).length, done=c.q[1]-stMissing(c,ed,M).length;
  const info = `<div class="card card--lg">${cardHead(T('Thông tin bộ đề','Test details'),'','',tile('file-text','default','sm'))}
    <div class="grid grid-2" style="gap:12px">${stField(T('Tên hiển thị (VI)','Display name (VI)'),`<input id="st-tvi" class="input input--secondary" value="${esc(ed.titleVi)}" data-input="stTitleVi">`,{id:'st-tvi',req:true})}${stField(T('Tên hiển thị (EN)','Display name (EN)'),`<input id="st-ten" class="input input--secondary" value="${esc(ed.titleEn)}" data-input="stTitleEn">`,{id:'st-ten',req:true})}</div>
    <div class="grid grid-3" style="gap:12px">${stField(T('Kỳ thi','Exam'),`<select id="st-exam" class="select select--secondary" disabled>${Object.entries(ST_EXAM).map(([v,l])=>`<option ${c.exam===v?'selected':''}>${l}</option>`).join('')}</select>`,{id:'st-exam'})}${stField(T('Loại','Type'),`<select id="st-kind" class="select select--secondary" disabled>${Object.entries(KIND).filter(([k])=>k!=='personal_practice').map(([v,l])=>`<option ${c.kind===v?'selected':''}>${tx(l)}</option>`).join('')}</select>`,{id:'st-kind'})}${stField(T('Kỹ năng','Skill'),`<select id="st-skill" class="select select--secondary" disabled><option>${c.skill==='mixed'?'L + R':SKILL_AREA[c.skill]||c.skill}</option></select>`,{id:'st-skill'})}</div>
    <span class="description" style="margin-top:-8px">${T('Kỳ thi, loại và kỹ năng cố định sau khi tạo để giữ đúng cấu trúc đề.','Exam, type and skill are fixed after creation to keep the structure valid.')}</span>
    ${stField(T('Mô tả cho người học','Description for learners'),`<textarea id="st-desc" class="textarea textarea--secondary" rows="3" data-input="stDesc" placeholder="${T('VD: Đề đủ 7 Part, độ khó tương đương mục tiêu 650–750.','e.g. All 7 parts, difficulty for a 650–750 target.')}">${esc(ed.desc)}</textarea>`,{id:'st-desc'})}</div>`;
  const cover = `<div class="card">${cardHead(T('Ảnh bìa','Cover'),btn(T('Tải ảnh riêng','Upload image'),{v:'ghost',size:'sm',ic:'arrow-up-from-square',action:'noop'}),T('Tự tạo từ kỳ thi, loại đề và nguồn gốc.','Generated from exam, type and provenance.'))}<div class="st-cover">${stThumb(c,'100%',132)}</div></div>`;
  const access = contrib
    ? `<div class="card">${cardHead(T('Hiển thị & ghi công','Visibility & credit'),'','',tile('persons','accent','sm'))}<div class="list list--divided">
        <div class="list-box-item">${icon('globe',16,'text-muted')}<span class="grow"><span class="list-box-item__label">${T('Công khai sau khi được duyệt','Public once approved')}</span><span class="list-box-item__description">${T('Xuất bản trong thư viện Engrisk với nhãn “Cộng đồng”.','Published in the Engrisk library with a “Community” label.')}</span></span></div>
        <div class="list-box-item">${avatar(stOwner(c.owner).initials,{size:'xs',color:stOwner(c.owner).color})}<span class="grow"><span class="list-box-item__label">${T('Ghi công','Credit')}: ${stOwner(c.owner).name}</span><span class="list-box-item__description">${T('Hiển thị trên thẻ đề và trang kết quả.','Shown on the test card and results page.')}</span></span></div>
        <div class="list-box-item">${icon('file-check',16,'text-muted')}<span class="grow"><span class="list-box-item__label">${T('Giấy phép','Licence')}: ${ed.licence?tx(ST_LICENCE[ed.licence][0]):T('chưa chọn','not chosen')}</span><span class="list-box-item__description">${T('Chọn ở bước Kiểm tra & gửi duyệt.','Choose it in Check & submit.')}</span></span></div></div></div>`
    : `<div class="card">${cardHead(T('Phát hành & quyền truy cập','Release & access'),'','',tile('lock','default','sm'))}
      <div class="col gap-2" role="radiogroup" aria-label="${T('Hiển thị','Visibility')}">${Object.entries(ST_VIS).map(([v,[l,ic]])=>{ const lockd=v==='public'&&!can('content.publish'); return `<button type="button" role="radio" aria-checked="${ed.vis===v}" class="choice st-choice" data-action="stVis" data-v="${v}" data-fk="vis:${v}" ${lockd?'disabled':''}>${icon(ic,16,'text-muted')}<span class="grow"><span class="choice__title">${tx(l)}</span><span class="choice__desc">${v==='public'?(lockd?T('Chỉ Engrisk xuất bản công khai','Only Engrisk publishes publicly'):T('Mọi học viên trong Luyện đề','Every learner in Practice tests')):v==='tenant'?(c.scope==='engrisk'?T('Tổ chức có giấy phép nội dung','Organizations with a content licence'):T('Thành viên Sunrise English','Sunrise English members')):T('Chỉ người soạn và người duyệt','Authors and reviewers only')}</span></span>${ed.vis===v?icon('circle-check-fill',16,'text-accent'):''}</button>`;}).join('')}</div>
      ${can('content.publish')?stField(T('Gói truy cập','Access tier'),`<select id="st-tier" class="select select--secondary" data-input="stTier">${Object.entries(ST_TIER).map(([v,l])=>`<option value="${v}" ${ed.tier===v?'selected':''}>${tx(l)}</option>`).join('')}</select>`,{id:'st-tier',desc:T('Khách: làm thử không cần tài khoản · Premium: gói trả phí.','Guest: no account needed · Premium: paid plan.')}):''}</div>`;
  const prog = `<div class="card">${cardHead(T('Mức hoàn thiện','Completeness'),btn(T('Xem kiểm tra','View checks'),{v:'ghost',size:'sm',iconR:'chevron-right',action:'stTab',data:{v:'publish'}}))}
    ${progressBar(done,c.q[1],{label:T('Câu hỏi','Questions'),right:`${done}/${c.q[1]}`,color:done>=c.q[1]?'success':''})}
    ${A?progressBar(A.units.filter(u=>u.st==='ok').length,A.units.length,{label:T('Cue audio','Audio cues'),right:`${A.units.filter(u=>u.st==='ok').length}/${A.units.length}`,color:A.units.every(u=>u.st==='ok')?'success':'warning'}):''}
    <div class="row row--between text-sm"><span class="text-muted">${T('Lỗi chặn xuất bản','Blocking issues')}</span>${blk?chip(`${blk}`,'danger','circle-exclamation',{size:'sm'}):chip(T('Không có','None'),'success','check',{size:'sm'})}</div></div>`;
  const revs = `<div class="card">${cardHead(T('Lịch sử revision','Revision history'),'','',tile('code-fork','default','sm'))}<div class="list list--flush">${[...Array(Math.min(c.rev,3))].map((_,i)=>{ const r=c.rev-i, live=c.status==='published'&&i===0; return `<div class="list-box-item"><span class="st-rev tnum">r${r}</span><span class="grow"><span class="list-box-item__label">${live?T('Đang phát hành','Live'):i===0?tx(ST_STATUS[c.status][0]):T('Đã thay thế','Superseded')}</span><span class="list-box-item__description">${stOwner(c.owner).name} · ${fmtDate(i===0?c.updated:['2026-09-14','2026-08-02'][i-1])}</span></span>${live?chip(T('Live','Live'),'success','circle-check',{size:'sm'}):''}</div>`;}).join('')}</div></div>`;
  return `<div class="grid grid-main"><div class="col gap-4">${info}${cover}</div><div class="col gap-4">${prog}${access}${revs}</div></div>`;
}

/* ---------- Tab: Structure ---------- */
function stStructureTab(c,ed,M,A){
  const secs=[...new Set(M.parts.map(p=>ALL_PARTS[p].section))], mins={L:c.exam==='ielts_academic'?30:45,R:c.exam==='ielts_academic'?60:75}, fixed=c.kind==='full_mock'&&M.real;
  const miss=new Set(stMissing(c,ed,M).map(q=>q.n));
  const rows = secs.map(s=>{ const ps=M.parts.filter(p=>ALL_PARTS[p].section===s), n=ps.reduce((a,p)=>a+M.counts[M.parts.indexOf(p)],0);
    return `<tr class="st-sec"><td colspan="6"><span class="row gap-2">${skillTile(s==='L'?'listening':'reading','sm')}<span class="font-semibold">${SECTION[s]}</span><span class="text-sm text-muted">· ${n} ${T('câu','questions')} · ${M.real||c.kind!=='practice_set'?mins[s]:Math.max(5,Math.round(n*(s==='L'?0.5:0.8)))} ${T('phút','min')}${s==='L'?` · ${T('audio phát một lần','audio plays once')}`:''}</span></span></td></tr>`
      + ps.map(p=>{ const qs=M.qs.filter(q=>q.part===p), d=qs.filter(q=>!miss.has(q.n)).length, band=A&&A.bands.find(b=>b.part===p);
        return `<tr><td><span class="row gap-2 nowrap">${btn('',{v:'ghost',size:'sm',ic:'grip',action:'noop',aria:T('Kéo để sắp xếp','Drag to reorder'),disabled:fixed})}<span class="icon-tile icon-tile--sm icon-tile--tint tint-${s==='L'?'listening':'reading'}">${icon(ALL_PARTS[p].icon,14)}</span><span class="font-medium">${stPartName(p)}</span></span></td>
          <td class="tnum nowrap">${stRange([qs[0].n,qs[qs.length-1].n])}</td><td class="tnum">${qs.length}</td>
          <td class="tnum text-muted">${band?fmt(band.end-band.start):'—'}</td>
          <td><span class="st-comp">${progressBar(d,qs.length,{size:'sm',color:d>=qs.length?'success':'',aria:stPartName(p)})}<span class="text-xs tnum">${d}/${qs.length}</span></span></td>
          <td>${btn(T('Mở câu hỏi','Open questions'),{v:'ghost',size:'sm',iconR:'chevron-right',action:'stGoQ',data:{q:qs[0].n}})}</td></tr>`;}).join(''); }).join('');
  const table = `<div class="card">${cardHead(T('Section & Part','Sections & parts'),fixed?chip(T('Cấu trúc chuẩn — khóa','Standard structure — locked'),'default','lock',{size:'sm'}):btn(T('Thêm Part','Add part'),{v:'tertiary',size:'sm',ic:'plus',action:'noop'}),fixed?T('Đề thi thử giữ đúng 7 Part và số câu của TOEIC L&R.','Full mocks keep the 7 TOEIC L&R parts and real question counts.'):'')}
    <table class="table"><thead><tr><th>Part</th><th>${T('Câu','Questions')}</th><th>${T('Số câu','Count')}</th><th>Audio</th><th>${T('Hoàn thiện','Completeness')}</th><th><span class="sr-only">${T('Mở','Open')}</span></th></tr></thead><tbody>${rows}</tbody></table></div>`;
  const rules = `<div class="card">${cardHead(T('Quy tắc làm bài','Test rules'),'','',tile('sliders','default','sm'))}<div class="list list--divided">
    <div class="list-box-item"><span class="grow"><span class="list-box-item__label">${T('Cho phép chế độ luyện tập','Allow practice mode')}</span><span class="list-box-item__description">${T('Chọn Part, xem đáp án từng câu.','Pick parts, check answers per question.')}</span></span>${switchEl(ed.practice,'stPractice',T('Cho phép chế độ luyện tập','Allow practice mode'))}</div>
    <div class="list-box-item"><span class="grow"><span class="list-box-item__label">${T('Đảo thứ tự phương án','Shuffle options')}</span><span class="list-box-item__description">${T('Không áp dụng cho Part 1–2 (đọc theo audio).','Not applied to Parts 1–2 (read in the audio).')}</span></span>${switchEl(ed.shuffle,'stShuffle',T('Đảo thứ tự phương án','Shuffle options'))}</div>
    <div class="list-box-item" style="opacity:.75"><span class="grow"><span class="list-box-item__label">${T('Audio phát một lần ở chế độ thi thử','Audio plays once in mock mode')}</span><span class="list-box-item__description">${T('Theo quy chế thi thật.','Matches real exam rules.')}</span></span>${chip(T('Bắt buộc','Required'),'default','lock',{size:'sm'})}</div></div></div>`;
  const dirs = `<div class="card">${cardHead(T('Hướng dẫn mỗi Part','Part directions'),'',T('Tiếng Anh, hiển thị ở đầu mỗi Part.','English, shown at the start of each part.'))}${M.parts.filter(p=>PARTS[p]).slice(0,2).map(p=>`<div class="card card--secondary" style="padding:12px;gap:4px"><span class="text-xs font-semibold text-muted">${stPartName(p)}</span><span class="text-sm">${esc(PARTS[p].dir)}</span></div>`).join('')||`<p class="text-sm text-muted">${T('IELTS dùng hướng dẫn theo từng nhóm câu (question set).','IELTS uses directions per question set.')}</p>`}</div>`;
  return table+`<div class="grid grid-main">${dirs}${rules}</div>`;
}

/* ---------- Tab: Audio & Script ---------- */
function stAmp(t,A){
  const b=A.bands.find(x=>t>=x.start&&t<x.end); if (!b) return .04;
  if (t<b.start+1.5) return .04;
  const u=A.units.find(x=>t>=x.at&&t<x.at+x.len); if (u&&t<u.at+1.2) return .05;
  const k=Math.floor(t*2), r=Math.abs(Math.sin(k*12.9898)*43758.5453)%1;
  return Math.min(1,.18+.62*r*(.55+.45*Math.abs(Math.sin(t/3.1)))+(t<b.start+20?-.08:0));
}
function stWaveSvg(A,ed){
  const W=1000, dur=A.dur, span=dur/ed.zoom, s0=Math.max(0,Math.min(dur-span,ed.t-span/2)), x=t=>(t-s0)/span*W, N=200, bw=W/N;
  const step=[5,10,15,30,60,120,300,600].find(s=>span/s<=10)||600;
  let ticks=''; for(let t=Math.ceil(s0/step)*step;t<=s0+span;t+=step){ const xx=x(t); ticks+=`<line class="st-tick" x1="${xx}" x2="${xx}" y1="14" y2="20"/>${xx<W-30?`<text class="st-ruler" x="${xx+3}" y="11">${fmt(t)}</text>`:''}`; }
  const bands=A.bands.map((b,i)=>{ const x1=Math.max(0,x(b.start)), x2=Math.min(W,x(b.end)); if(x2<=x1) return ''; return `<rect class="st-band ${i%2?'st-band--alt':''}" x="${x1}" y="24" width="${x2-x1}" height="18" rx="4"/>${x2-x1>54?`<text class="st-band__label" x="${x1+6}" y="37">${b.part.replace('P','Part ').replace(/^L(\d)/,'Part $1').replace(/^R(\d)/,'Passage $1')}</text>`:''}`; }).join('');
  let bars=''; for(let i=0;i<N;i++){ const t=s0+(i+.5)*span/N, h=Math.max(1.5,stAmp(t,A)*30); bars+=`<rect class="st-bar ${t<=ed.t?'is-past':''}" x="${i*bw+1}" y="${84-h}" width="${bw-2}" height="${h*2}" rx="1"/>`; }
  let lastX=-99, cues='';
  A.units.forEach(u=>{ const xx=x(u.at); if(xx<0||xx>W) return; const lab=stRange(u.ns)+(u.st==='missing'?' !':u.st==='check'?' ?':''), w=lab.length*6.4+10;
    cues+=`<line class="st-cue st-cue--${u.st}" x1="${xx}" x2="${xx}" y1="48" y2="122"/>`;
    if (xx-lastX>w+4&&xx+w<W+2){ cues+=`<g class="st-cuetag st-cuetag--${u.st}"><rect x="${xx-w/2<0?0:xx-w/2}" y="124" width="${w}" height="16" rx="8"/><text x="${(xx-w/2<0?0:xx-w/2)+w/2}" y="135.5" text-anchor="middle">${lab}</text></g>`; lastX=xx; } });
  const px=x(ed.t);
  return `<svg viewBox="0 0 ${W} 146" width="100%" height="146" preserveAspectRatio="none" role="img" aria-label="${T('Dạng sóng audio','Audio waveform')} · ${fmt(ed.t)} / ${fmt(dur)} · ${A.units.length} cue"><line class="st-tick" x1="0" x2="${W}" y1="20" y2="20"/>${ticks}${bands}${bars}${cues}<line class="st-playhead" x1="${px}" x2="${px}" y1="16" y2="142"/><path class="st-playhead__cap" d="M${px-5} 14h10l-5 6z"/></svg>`;
}
function stWaveRefresh(){
  const ed=S.studio.ed, c=stEdItem(); if(!ed||!c) return; const A=stAudio(c,ed);
  const w=document.getElementById('st-wave'); if(w) w.innerHTML=stWaveSvg(A,ed);
  const tm=document.getElementById('st-time'); if(tm) tm.textContent=`${fmt(ed.t)} / ${fmt(A.dur)}`;
}
function stTick(){
  const ed=S.studio.ed;
  if (!ed||!ed.playing||S.screen!=='studio-editor'||isM()||!['audio','questions'].includes(ed.tab)){ if(ed) ed.playing=false; clearInterval(stTimer); stTimer=null; return; }
  const A=stAudio(stEdItem(),ed); ed.t=Math.min(A.dur,ed.t+.25);
  if (ed.playUntil!=null&&ed.t>=ed.playUntil){ ed.playing=false; ed.playUntil=null; render(); return; }
  if (ed.t>=A.dur){ ed.playing=false; render(); return; }
  stWaveRefresh(); const mt=document.getElementById('st-seg-time'); if(mt) mt.textContent=fmt(ed.t);
}
function stPlay(on){ const ed=S.studio.ed; ed.playing=on; clearInterval(stTimer); stTimer=on?setInterval(stTick,250):null; }
function stAudioTab(c,ed,M,A){
  if (!A) return `<div class="card card--lg">${empty('headphones',T('Bộ đề không có phần nghe','This set has no listening'),T('Audio, script và cue chỉ dùng cho Listening. Soạn nội dung đọc ở tab Câu hỏi.','Audio, script and cues apply to Listening only. Write reading content in the Questions tab.'),btn(T('Mở Câu hỏi','Open questions'),{v:'tertiary',action:'stTab',data:{v:'questions'}}),{color:'default'})}</div>`;
  const ok=A.units.filter(u=>u.st==='ok').length, chk=A.units.filter(u=>u.st==='check'), mis=A.units.filter(u=>u.st==='missing'), running=ed.align==='running';
  const zoom = tabs(T('Thu phóng','Zoom'),[[1,'1×'],[2,'2×'],[4,'4×'],[8,'8×']].map(([v,l])=>[String(v),l]),String(ed.zoom),'stZoom',{size:'sm'});
  const alignBtn = btn(running?T('Đang căn chỉnh…','Aligning…'):T('Tự căn chỉnh (forced alignment)','Auto-align (forced alignment)'),{v:'secondary',size:'sm',ic:'magic-wand',action:'stAlign',pending:running,disabled:!A.hasFile});
  const wave = A.hasFile ? `<div id="st-wave" class="st-wave" data-action="stWaveSeek" title="${T('Bấm để tua tới vị trí','Click to seek')}">${stWaveSvg(A,ed)}</div>
      <div class="row row--between row--wrap gap-3"><div class="row gap-2">${btn('',{v:'tertiary',size:'sm',ic:'chevron-left',action:'stCue',data:{dir:-1},aria:T('Cue trước','Previous cue')})}<button type="button" class="audio__play st-play ${ed.playing?'is-playing':''}" data-action="stPlayToggle" data-fk="stPlay" aria-label="${ed.playing?T('Tạm dừng','Pause'):T('Phát','Play')}">${icon(ed.playing?'pause-fill':'play-fill',18)}</button>${btn('',{v:'tertiary',size:'sm',ic:'chevron-right',action:'stCue',data:{dir:1},aria:T('Cue sau','Next cue')})}<span id="st-time" class="tnum font-medium" style="min-width:110px">${fmt(ed.t)} / ${fmt(A.dur)}</span></div>
        <div class="legend"><span>${icon('circle-check',12,'text-success')}${T('Khớp','Aligned')} ${ok}</span><span>${icon('circle-question',12,'text-warning')}${T('Cần kiểm tra','Check')} ${chk.length}</span><span>${icon('circle-exclamation',12,'text-danger')}${T('Thiếu','Missing')} ${mis.length}</span></div></div>`
    : `<div class="dropzone">${icon('music-note',28,'text-muted')}<span class="font-medium">${T('Chưa có audio cho phần nghe','No listening audio yet')}</span><span class="text-sm text-muted">${T('MP3/WAV/M4A, 44.1 kHz, tối đa 200 MB. Tệp được quét mã độc và đo độ to trước khi dùng.','MP3/WAV/M4A, 44.1 kHz, up to 200 MB. Files are malware-scanned and loudness-measured before use.')}</span>${btn(T('Chọn tệp audio (mô phỏng)','Choose audio file (simulated)'),{ic:'arrow-up-from-square',action:'stFix',data:{f:'upload'}})}</div>`;
  const timeline = `<div class="card card--lg">${cardHead(A.hasFile?A.file:T('Audio Listening','Listening audio'),A.hasFile?`<div class="row gap-2">${zoom}${alignBtn}</div>`:'',A.hasFile?`${fmt(A.dur)} · ${A.units.length} cue · ${A.bands.length} Part`:'',tile('music-note','accent','sm'))}
    ${running?alertBox('accent',T('Đang căn chỉnh script với audio…','Aligning the script to the audio…'),T('Mỗi dòng script được gán mốc thời gian; cue câu hỏi được tạo tự động.','Each script line gets timestamps; question cues are created automatically.')+' '+sim(),'',{flat:true}):''}${wave}</div>`;
  const parts=M.L, sp=ed.spart&&parts.includes(ed.spart)?ed.spart:parts[0], pu=A.units.filter(u=>u.part===sp), per=sp==='P1'||sp==='P2'?2:1, su=Math.min(ed.su,Math.max(0,pu.length-per));
  const shown=pu.slice(su,su+per);
  const lines = shown.flatMap(u=>stUnitLines(u).map(l=>({...l,u})));
  const confOf = l => l.u.st==='missing'?null:l.u.low?[.62,.71,.58][l.i%3]:.9+((l.i*7+l.u.k*3)%9)/100;
  const rows = lines.map(l=>{ const cf=confOf(l), act=ed.t>=l.at&&ed.t<l.end, txt=ed.lines[l.key]!=null?ed.lines[l.key]:l.text, spk=ed.spk[l.key]||l.spk;
    return `<div class="st-line ${act?'is-active':''}"><button type="button" class="st-line__time tnum" data-action="stSeekT" data-t="${l.at}" data-fk="seek:${l.key}" aria-label="${T('Phát từ','Play from')} ${fmt(l.at)}">${l.u.st==='missing'?'—':`${fmt(l.at)}–${fmt(l.end)}`}</button>
      <span>${chip('Q'+stRange(l.u.ns),'default',null,{size:'sm'})}</span>
      <select id="st-spk-${l.key}" class="select select--secondary st-sel" data-input="stSpk" data-k="${l.key}" aria-label="${T('Người nói · giọng','Speaker · accent')} ${fmt(l.at)}">${ST_SPEAKERS.map(([v,lab])=>`<option value="${v}" ${spk===v?'selected':''}>${lab}</option>`).join('')}</select>
      <input id="st-line-${l.key}" class="input input--secondary" value="${esc(txt)}" data-input="stLine" data-k="${l.key}" aria-label="${T('Lời thoại tiếng Anh','English transcript line')} ${fmt(l.at)}">
      <span class="st-conf">${cf==null?chip(T('Chưa căn','Unaligned'),'danger','circle-exclamation',{size:'sm'}):cf<.8?chip(Math.round(cf*100)+'%','warning','triangle-exclamation',{size:'sm'}):`<span class="text-xs tnum text-muted">${Math.round(cf*100)}%</span>`}</span></div>`; }).join('');
  const script = `<div class="card">${cardHead(T('Script & cue','Script & cues'),parts.length>1?tabs(T('Part của script','Script part'),parts.map(p=>[p,p.replace(/^P/,'Part ')]),sp,'stSPart',{size:'sm'}):'')}
    ${alertBox('default',T('Script được bảo vệ','Script is protected'),T('Người học chỉ thấy transcript ở trang xem lại sau khi nộp bài, không thấy khi đang làm.','Learners see the transcript only in review after submitting, never during the test.'),'',{ic:'lock',flat:true})}
    <div class="st-line st-line--head text-xs text-muted" aria-hidden="true"><span>${T('Thời gian','Time')}</span><span>${T('Câu','Q')}</span><span>${T('Người nói · giọng','Speaker · accent')}</span><span>${T('Lời thoại (tiếng Anh)','Transcript (English)')}</span><span>${T('Tin cậy','Conf.')}</span></div>
    <div class="col gap-1">${rows}</div>
    <div class="row row--between"><span class="text-xs text-muted tnum">${T('Đoạn','Segment')} ${per>1?`${su+1}–${Math.min(pu.length,su+per)}`:su+1} / ${pu.length} · ${stPartName(sp)}</span><div class="row gap-1">${btn('',{v:'tertiary',size:'sm',ic:'chevron-left',action:'stSU',data:{d:-per},disabled:su<=0,aria:T('Đoạn trước','Previous segments')})}${btn('',{v:'tertiary',size:'sm',ic:'chevron-right',action:'stSU',data:{d:per},disabled:su+per>=pu.length,aria:T('Đoạn sau','Next segments')})}</div></div></div>`;
  const qc = A.hasFile ? `<div class="card">${cardHead(T('Kiểm tra file audio','Audio file QC'),chip(T('Đạt','Passed'),'success','circle-check',{size:'sm'}))}<div class="list list--divided">${[
      [T('Thời lượng','Duration'),fmt(A.dur),''],[T('Định dạng','Format'),'MP3 · 192 kbps','44.1 kHz · mono'],[T('Độ to','Loudness'),'−16.2 LUFS',T('mục tiêu −16 ±1','target −16 ±1')],['True peak','−1.4 dBTP','≤ −1.0'],[T('Tạp âm nền','Noise floor'),'SNR 38 dB','≥ 30 dB'],[T('Quét mã độc','Malware scan'),T('Sạch','Clean'),'ClamAV']
    ].map(([k,v,n])=>`<div class="list-box-item st-kv"><span class="grow text-sm text-muted">${k}</span><span class="text-sm font-medium tnum">${v}</span>${n?`<span class="text-xs text-muted st-kv__n">${n}</span>`:'<span class="st-kv__n"></span>'}${icon('circle-check',14,'text-success')}</div>`).join('')}</div></div>` : '';
  const probs=[...chk,...mis];
  const cov = `<div class="card">${cardHead(T('Độ phủ cue','Cue coverage'),`<span class="text-sm tnum font-medium">${ok}/${A.units.length}</span>`)}
    ${meter(ok,A.units.length,{label:T('Cue đã khớp','Aligned cues'),right:Math.round(ok/A.units.length*100)+'%',color:mis.length?'danger':chk.length?'warning':'success'})}
    ${probs.length?`<div class="list list--flush">${probs.map(u=>`<div class="list-box-item">${u.st==='missing'?tile('circle-exclamation','danger','sm'):tile('circle-question','warning','sm')}<span class="grow"><span class="list-box-item__label">Q${stRange(u.ns)} · ${u.part.replace(/^P/,'Part ')}</span><span class="list-box-item__description">${u.st==='missing'?T('Chưa có mốc thời gian','No timestamp'):T('Độ tin cậy thấp — nghe lại','Low confidence — listen again')}</span></span>${u.st==='check'?btn(T('Xác nhận','Confirm'),{v:'secondary',size:'sm',action:'stConfirm',data:{k:u.key}}):''}${btn('',{v:'ghost',size:'sm',ic:'play-fill',action:'stJumpUnit',data:{k:u.key},aria:T('Nghe đoạn','Play segment')+' Q'+stRange(u.ns),disabled:u.st==='missing'})}</div>`).join('')}</div>`:`<div class="row gap-2 text-sm text-success">${icon('circle-check-fill',16)}${T('Mọi câu đều có cue đã xác nhận.','Every question has a confirmed cue.')}</div>`}</div>`;
  return timeline+script+`<div class="grid grid-2 grid--stretch">${cov}${qc}</div>`;
}

/* ---------- Tab: Questions (navigator · editor · preview) ---------- */
function stQuestionsTab(c,ed,M,A){
  const dupOn=stIssues(c,ed).some(i=>i.id==='dup'&&!i.done);
  const all=M.qs.map(qq=>stQ(c,ed,M,qq)), st=Object.fromEntries(all.map(q=>[q.n,stQState(c,ed,M,A,q,dupOn)]));
  const cur=all.find(q=>q.n===ed.qsel)||all[0];
  const fl = ed.qf==='issues'?all.filter(q=>st[q.n]==='err'||st[q.n]==='warn'):ed.qf==='empty'?all.filter(q=>st[q.n]==='empty'):all.filter(q=>q.part===cur.part);
  const nav = `<div class="card st-pane st-nav">${cardHead(T('Câu hỏi','Questions'),`<span class="text-xs text-muted tnum">${all.filter(q=>st[q.n]!=='empty').length}/${all.length}</span>`)}
    ${tabs(T('Lọc câu hỏi','Filter questions'),[['all',T('Theo Part','By part')],['issues',T('Có vấn đề','Issues')],['empty',T('Chưa soạn','Empty')]],ed.qf,'stQF',{size:'sm',full:true})}
    ${ed.qf==='all'?`<div class="list st-partlist">${M.parts.map(p=>{ const qs=all.filter(q=>q.part===p), bad=qs.filter(q=>st[q.n]==='err'||st[q.n]==='empty').length; return `<button type="button" class="list-box-item st-partbtn" data-action="stPart" data-p="${p}" data-fk="part:${p}" ${cur.part===p?'aria-current="true"':''}><span class="icon-tile icon-tile--sm icon-tile--tint tint-${ALL_PARTS[p].section==='L'?'listening':'reading'}">${icon(ALL_PARTS[p].icon,14)}</span><span class="grow truncate text-sm font-medium">${p.replace(/^P/,'Part ').replace(/^R(\d)/,'Passage $1').replace(/^L(\d)/,'Part $1')}</span>${bad?`<span class="text-xs text-danger tnum">${icon('circle-exclamation',11)} ${bad}</span>`:`<span class="text-xs text-muted tnum">${qs.length}</span>`}</button>`;}).join('')}</div><div class="separator st-navsep"></div>`:''}
    ${fl.length?`<div class="qgrid st-qgrid">${fl.map(q=>`<button type="button" class="qbtn st-q--${st[q.n]} ${q.n===cur.n?'is-current':''}" data-action="stSelQ" data-q="${q.n}" data-fk="q:${q.n}" aria-label="${T('Câu','Question')} ${q.n}: ${tx(ST_QST[st[q.n]][0])}" ${q.n===cur.n?'aria-current="true"':''}>${q.n}</button>`).join('')}</div>`:`<p class="text-sm text-muted">${T('Không có câu nào.','No questions.')}</p>`}
    <div class="legend st-legend">${['ok','warn','err','empty'].map(s=>`<span><i class="st-q--${s}"></i>${tx(ST_QST[s][0])}</span>`).join('')}</div></div>`;
  return `<div class="st-qwrap"><div class="st-qpanes">${nav}${stQEditor(c,ed,M,A,cur,st[cur.n],all,dupOn)}${stQPreview(c,ed,cur)}</div></div>`;
}
function stStimulus(c,ed,M,A,q){
  const P=q.part, sec=ALL_PARTS[P].section;
  if (P==='P1') return `<div class="col gap-2"><span class="eyebrow">${T('Ngữ liệu · ảnh','Stimulus · photo')}</span><div class="st-figure">${PHOTOS[q.img]||''}</div>
    ${stField(T('Mô tả ảnh (alt text)','Image description (alt text)'),`<textarea id="st-alt" class="textarea textarea--secondary" rows="2" data-input="stAlt" aria-invalid="${!q.alt.trim()}" placeholder="${T('Mô tả người, vật và hành động trong ảnh (tiếng Anh)','Describe people, objects and actions in English')}">${esc(q.alt)}</textarea>`,{id:'st-alt',req:true,err:!q.alt.trim()?T('Bắt buộc — trình đọc màn hình đọc mô tả này.','Required — screen readers read this description.'):null,desc:T('Không mô tả đáp án; chỉ tả những gì nhìn thấy.','Don’t give away the answer; describe only what is visible.')})}</div>`;
  if (sec==='L'&&A){ const u=A.units.find(x=>x.ns.includes(q.n)); if(!u) return '';
    const ls=stUnitLines(u);
    return `<div class="col gap-2"><span class="eyebrow">${T('Ngữ liệu · đoạn audio','Stimulus · audio segment')}</span><div class="st-seg">${btn('',{v:'secondary',size:'sm',ic:ed.playing?'pause-fill':'play-fill',action:'stJumpUnit',data:{k:u.key},aria:T('Nghe đoạn','Play segment'),disabled:u.st==='missing'||!A.hasFile})}<span class="grow"><span class="text-sm font-medium">Q${stRange(u.ns)} · <span class="tnum">${u.st==='missing'?T('chưa có mốc','no timestamp'):`${fmt(u.at)}–${fmt(u.at+u.len)}`}</span></span><span class="text-xs text-muted" style="display:block">${ed.playing?`${T('Đang phát','Playing')} <span id="st-seg-time" class="tnum">${fmt(ed.t)}</span>`:`${ls.length} ${T('dòng script','script lines')}`}</span></span>${u.st==='ok'?chip(T('Khớp','Aligned'),'success','check',{size:'sm'}):u.st==='check'?chip(T('Cần kiểm tra','Check'),'warning','circle-question',{size:'sm'}):chip(T('Thiếu cue','No cue'),'danger','circle-exclamation',{size:'sm'})}${btn(T('Sửa script','Edit script'),{v:'ghost',size:'sm',iconR:'chevron-right',action:'stScriptOf',data:{k:u.key}})}</div>
      <div class="st-transcript">${ls.slice(0,4).map(l=>`<div><b>${l.spk.split('-')[0]}</b> ${esc(ed.lines[l.key]!=null?ed.lines[l.key]:l.text)}</div>`).join('')}</div></div>`; }
  if (q.group&&G[q.group]&&(G[q.group].html||G[q.group].docs)){ const g=G[q.group];
    return `<div class="col gap-2"><div class="row row--between"><span class="eyebrow">${T('Ngữ liệu · đoạn văn','Stimulus · passage')}</span>${btn(T('Sửa đoạn văn','Edit passage'),{v:'ghost',size:'sm',ic:'pencil',action:'noop'})}</div><div class="st-passage"><div class="text-xs text-muted" style="margin-bottom:6px">${esc(g.title||'')}</div>${g.html||g.docs.map(d=>`<div class="text-xs font-semibold text-muted">${d.label}</div>${d.html}`).join('')}</div></div>`; }
  return '';
}
function stQEditor(c,ed,M,A,q,state,all,dupOn){
  const i=all.indexOf(q), contrib=ed.as==='contributor';
  const cms=stComments(c).map((cm,ix)=>({...cm,ix})).filter(cm=>cm.q===q.n);
  const comments = cms.map(cm=>{ const done=stCommentDone(c,cm,cm.ix), by=stOwner(cm.by);
    return `<div class="st-comment ${done?'is-done':''}">${avatar(by.initials,{size:'xs',color:by.color})}<div class="grow"><div class="text-xs text-muted">${by.name} · ${T('góp ý về','on')} ${tx(ST_FIELD[cm.field]||[cm.field,cm.field])}</div><div class="text-sm">${esc(tx(cm.text))}</div></div>${done?chip(T('Đã sửa','Fixed'),'success','check',{size:'sm'}):btn(T('Đánh dấu đã sửa','Mark fixed'),{v:'secondary',size:'sm',action:'stFix',data:{f:'resolve',i:cm.ix}})}</div>`; }).join('');
  const qs=ST_QST[state];
  const head = `<div class="row row--between gap-2"><div class="row gap-2" style="min-width:0"><h3 class="card__title">${T('Câu','Question')} ${q.n}</h3><span class="text-sm text-muted truncate">${stPartName(q.part)}</span>${chip(tx(qs[0]),qs[1],qs[2],{size:'sm'})}</div><div class="row gap-1 shrink-0">${btn('',{v:'tertiary',size:'sm',ic:'chevron-left',action:'stSelQ',data:{q:(all[i-1]||q).n},disabled:i<=0,aria:T('Câu trước','Previous question')})}${btn('',{v:'tertiary',size:'sm',ic:'chevron-right',action:'stSelQ',data:{q:(all[i+1]||q).n},disabled:i>=all.length-1,aria:T('Câu sau','Next question')})}</div></div>`;
  const emptyNote = q.empty ? alertBox('default',T('Câu này chưa có nội dung','This question is empty'),contrib?T('Nhập câu hỏi và phương án bên dưới; câu được tính là đã soạn khi có nội dung.','Type the question and options below; it counts as written once it has content.'):T('Soạn trực tiếp hoặc lấy câu từ ngân hàng đã kiểm duyệt ở tab Kiểm tra.','Write it here or pull from the verified bank in the Check tab.'),'',{ic:'circle-dashed',flat:true}) : '';
  const stem = stField(T('Câu hỏi (tiếng Anh)','Question stem (English)'),`<textarea id="st-stem" class="textarea textarea--secondary" rows="2" data-input="stStem" ${q.fixedStem?'disabled':''} placeholder="${T('Nhập câu hỏi…','Type the question…')}">${esc(q.fixedStem?(q.part==='P1'?'Look at the picture marked number '+q.n+' in your test book.':'Mark your answer on your answer sheet.'):q.stem)}</textarea>`,{id:'st-stem',desc:q.fixedStem?T('Part 1–2 không in câu hỏi; phương án được đọc trong audio.','Parts 1–2 don’t print a stem; options are read in the audio.'):''});
  const opts = q.open
    ? stField(T('Đáp án chấp nhận','Accepted answers'),`<input id="st-acc" class="input input--secondary" value="${esc(q.accepted)}" data-input="stAcc">`,{id:'st-acc',desc:T('Phân tách bằng “ / ”. Không phân biệt hoa thường.','Separate with “ / ”. Case-insensitive.')})
    : `<fieldset class="st-opts"><legend class="label label--required">${T('Phương án · chọn đáp án đúng','Options · pick the correct answer')}</legend>${q.opts.map(([k,t])=>`<div class="st-opt ${q.answer===k?'is-key':''}"><label class="radio" title="${T('Đáp án đúng','Correct answer')}"><input type="radio" id="st-key-${k.replace(/\s/g,'')}" name="st-key-${q.n}" data-input="stKey" data-v="${k}" ${q.answer===k?'checked':''} aria-label="${T('Đáp án đúng là','Correct answer is')} ${k}"><span class="radio__control"></span></label><span class="option__key">${k.length>1?k[0]:k}</span>${k.length>1?`<span class="grow text-sm font-medium">${k}</span>`:`<input class="input input--secondary grow" id="st-opt-${k}" value="${esc(t)}" data-input="stOpt" data-k="${k}" aria-label="${T('Phương án','Option')} ${k}" placeholder="${T('Phương án','Option')} ${k}">`}${q.answer===k?chip(T('Đúng','Correct'),'success','check',{size:'sm'}):''}</div>`).join('')}${!q.answer?`<span class="field-error">${icon('circle-exclamation',12)} ${T('Chưa chọn đáp án đúng.','No correct answer selected.')}</span>`:''}</fieldset>`;
  const exp = `<div class="grid grid-2" style="gap:12px">${stField(T('Giải thích (VI)','Explanation (VI)'),`<textarea id="st-evi" class="textarea textarea--secondary" rows="4" data-input="stExpVi">${esc(q.expVi)}</textarea>`,{id:'st-evi',req:true})}${stField(T('Giải thích (EN)','Explanation (EN)'),`<textarea id="st-een" class="textarea textarea--secondary" rows="4" data-input="stExpEn">${esc(q.expEn)}</textarea>`,{id:'st-een'})}</div>
    ${stField(T('Bằng chứng (evidence span)','Evidence span'),`<input id="st-ev" class="input input--secondary" value="${esc(q.ev)}" data-input="stEv" placeholder="${T('Trích đoạn trong bài/script chứa đáp án','Quote from the text/script that proves the answer')}">`,{id:'st-ev',desc:T('Được tô sáng khi người học xem lại.','Highlighted when learners review.')})}`;
  const meta = `<div class="grid grid-2" style="gap:12px;align-items:start"><div class="textfield"><span class="label">${T('Thẻ kỹ năng','Skill tags')}</span><div class="row row--wrap gap-1">${q.tags.map(t=>`<span class="chip chip--default chip--soft chip--sm">${icon('tag',12)}<span>${t}</span><button type="button" class="st-chipx" data-action="stTagRm" data-t="${t}" data-fk="tagrm:${t}" aria-label="${T('Bỏ thẻ','Remove tag')} ${t}">${icon('xmark',10)}</button></span>`).join('')}</div><select id="st-tagadd" class="select select--secondary" data-input="stTagAdd" aria-label="${T('Thêm thẻ kỹ năng','Add skill tag')}"><option value="">${T('+ Thêm thẻ…','+ Add tag…')}</option>${ST_TAGS.filter(t=>!q.tags.includes(t)).map(t=>`<option value="${t}">${t}</option>`).join('')}</select></div>
    <div class="textfield"><span class="label" id="st-diff-l">${T('Độ khó','Difficulty')}</span><div class="toggle-group" role="radiogroup" aria-labelledby="st-diff-l">${[1,2,3,4,5].map(d=>`<button type="button" class="toggle" role="radio" aria-checked="${q.diff===d}" aria-pressed="${q.diff===d}" data-action="stDiff" data-v="${d}" data-fk="diff:${d}">${d}</button>`).join('')}</div><span class="description">${diffLabel(q.diff)}</span></div></div>`;
  const dup=dupOn&&q.n===M.dupQ, unit=A&&A.units.find(u=>u.ns.includes(q.n));
  const flags=[[!q.answer&&!q.open?'danger':'success',!q.answer&&!q.open?T('Chưa có đáp án để kiểm tra tính duy nhất','No key to check uniqueness'):T('Chỉ một phương án đúng','Exactly one correct option')],
    [q.opts.length&&Math.max(...q.opts.map(o=>o[1].length))>2.2*Math.max(1,Math.min(...q.opts.map(o=>o[1].length)))?'warning':'success',q.opts.length&&Math.max(...q.opts.map(o=>o[1].length))>2.2*Math.max(1,Math.min(...q.opts.map(o=>o[1].length)))?T('Độ dài phương án chênh lệch — có thể lộ đáp án','Option lengths differ — may give the answer away'):T('Độ dài phương án cân bằng','Balanced option lengths')],
    [dup?'warning':'success',dup?T('Giống 92% câu 101 trong ngân hàng toeic01','92% similar to Q101 in bank toeic01'):T('Không phát hiện trùng lặp với ngân hàng','No duplicate found in the bank')],
    ...(unit&&unit.st==='check'?[['warning',T('Cue audio độ tin cậy thấp','Low-confidence audio cue')]]:[])];
  const ai = `<div class="block-ai"><span class="block-ai__head">${icon('sparkles',14)}${T('Kiểm tra chất lượng tự động','Automated quality checks')} ${sim()}</span>${flags.map(([col,t])=>`<span class="row gap-2 text-sm">${icon(col==='success'?'circle-check':col==='warning'?'triangle-exclamation':'circle-exclamation',14,'text-'+col)}${t}</span>`).join('')}</div>`;
  return `<div class="card card--lg st-pane st-editor">${head}${comments}${emptyNote}${stStimulus(c,ed,M,A,q)}${stem}${opts}${exp}${meta}${ai}</div>`;
}
function stQPreview(c,ed,q){
  const show=ed.pv;
  return `<div class="card st-pane st-preview">${cardHead(T('Xem trước','Preview'),`<span class="row gap-2 text-xs text-muted">${T('Đáp án','Answer')}${switchEl(show,'stPv',T('Hiện đáp án trong xem trước','Show answer in preview'))}</span>`,T('Như người học thấy','As learners see it'))}
    <div class="st-device"><div class="text-xs text-muted">${stPartName(q.part)} · ${T('Câu','Question')} ${q.n}</div>
      ${q.part==='P1'?`<div class="st-figure st-figure--sm">${PHOTOS[q.img]||''}</div>`:''}
      ${q.fixedStem?`<div class="text-sm text-muted">${q.part==='P1'?'Look at the picture and listen.':'Listen and choose the best response.'}</div>`:`<div class="qstem" style="font-size:15px;line-height:22px">${esc(q.stem)||`<span class="text-muted">${T('(chưa có câu hỏi)','(no stem yet)')}</span>`}</div>`}
      ${q.open?`<div class="input" style="min-height:36px" aria-hidden="true">${show?esc(q.accepted):''}</div>`:`<div class="options">${q.opts.map(([k,t])=>`<div class="option ${show&&q.answer===k?'is-correct':''}" style="min-height:40px;padding:8px 10px"><span class="option__key">${k.length>1?k[0]:k}</span><span class="option__text text-sm">${q.fixedStem&&!show?'':esc(t)||'<span class="text-muted">—</span>'}${k.length>1?esc(k):''}</span></div>`).join('')}</div>`}
      ${show&&(S.lang==='en'?q.expEn:q.expVi)?`<div class="block-verified"><span class="block-verified__head">${icon('shield-check',14)}${T('Giải thích','Explanation')}</span><span class="text-sm">${esc(S.lang==='en'?q.expEn:q.expVi)}</span></div>`:''}</div></div>`;
}

/* ---------- Tab: Check & publish ---------- */
function stIssueRow(it,contrib){
  return `<div class="list-box-item st-issue ${it.done?'is-done':''}">${it.done?tile('circle-check','success','sm'):tile(it.ic,it.block?'danger':'warning','sm')}<span class="grow" style="min-width:0"><span class="list-box-item__label">${tx(it.title)}</span>${it.done?`<span class="list-box-item__description">${T('Đã xử lý','Resolved')}</span>`:it.desc?`<span class="list-box-item__description">${esc(tx(it.desc))}</span>`:''}</span>
    ${it.done?'':`<span class="row gap-1 shrink-0">${it.fix&&!(contrib&&['bank'].includes(it.fix))?btn(tx(it.fixL),{v:'secondary',size:'sm',ic:it.fix==='align'?'magic-wand':it.fix==='resolve'?'check':undefined,action:'stFix',data:{f:it.fix,...(it.i!=null?{i:it.i}:{})},pending:it.fix==='align'&&S.studio.ed.align==='running'}):isM()?chip(T('Sửa trên máy tính','Fix on a computer'),'default','display',{size:'sm'}):''}${it.go&&!isM()?btn(T('Sửa','Fix'),{v:'ghost',size:'sm',iconR:'chevron-right',action:'stGo',data:{tab:it.go.tab,q:it.go.q||''}}):''}</span>`}</div>`;
}
function stPublishTab(c,ed,M,A,iss){
  const contrib=ed.as==='contributor', blk=iss.filter(i=>i.block), non=iss.filter(i=>!i.block), openBlk=blk.filter(i=>!i.done).length;
  const ready = !openBlk && (!contrib||(ed.licence&&ed.rights));
  const checklist = `<div class="card">${cardHead(contrib?T('Kiểm tra trước khi gửi duyệt','Pre-submit checks'):T('Kiểm tra trước khi xuất bản','Pre-publish checks'),openBlk?chip(`${openBlk} ${T('lỗi chặn','blocking')}`,'danger','circle-exclamation',{size:'sm'}):chip(T('Sẵn sàng','Ready'),'success','circle-check',{size:'sm'}),'',tile('list-check','default','sm'))}
    <div class="col gap-1"><span class="eyebrow st-eyebrow-muted">${T('Bắt buộc','Blocking')} · ${blk.length}</span>${blk.length?`<div class="list list--flush list--divided">${blk.map(i=>stIssueRow(i,contrib)).join('')}</div>`:`<p class="text-sm text-muted">${T('Không có lỗi chặn.','No blocking issues.')}</p>`}</div>
    <div class="col gap-1"><span class="eyebrow st-eyebrow-muted">${T('Khuyến nghị','Recommended')} · ${non.length}</span>${non.length?`<div class="list list--flush list--divided">${non.map(i=>stIssueRow(i,contrib)).join('')}</div>`:`<p class="text-sm text-muted">${T('Không có cảnh báo.','No warnings.')}</p>`}</div></div>`;
  const edits=Object.keys(ed.q).length, lines=Object.keys(ed.lines).length+Object.keys(ed.spk).length, solved=iss.filter(i=>i.fix==='resolve'&&i.done).length;
  const diffs=[[ed.fixed.missing?'success':'default','file-plus',ed.fixed.missing?T(`+${c.q[1]-c.q[0]} câu từ ngân hàng`,`+${c.q[1]-c.q[0]} questions from the bank`):null],[edits?'accent':'default','pencil',edits?T(`${edits} câu đã chỉnh sửa`,`${edits} questions edited`):null],[ed.align==='done'?'accent':'default','music-note',ed.align==='done'?T('Cue audio được căn chỉnh lại','Audio cues re-aligned'):null],[lines?'accent':'default','text',lines?T(`${lines} thay đổi script`,`${lines} script changes`):null],[ed.titleVi!==(Array.isArray(c.title)?c.title[0]:c.title)||ed.vis!==c.visibility||ed.tier!==c.tier?'accent':'default','sliders',ed.titleVi!==(Array.isArray(c.title)?c.title[0]:c.title)||ed.vis!==c.visibility||ed.tier!==c.tier?T('Thông tin & quyền truy cập thay đổi','Details & access changed'):null]].filter(d=>d[2]);
  if (solved) diffs.unshift(['success','comment',T(`${solved} góp ý của người duyệt đã xử lý`,`${solved} reviewer comments addressed`)]);
  const diff = `<div class="card">${cardHead(c.status==='published'?T(`Thay đổi so với rev ${c.rev}`,`Changes since rev ${c.rev}`):T('Thay đổi trong bản nháp','Changes in this draft'),'','',tile('code-fork','default','sm'))}${diffs.length?`<div class="list list--flush">${diffs.map(([col,ic,t])=>`<div class="list-box-item">${tile(ic,col,'sm')}<span class="grow text-sm">${t}</span></div>`).join('')}</div>`:`<p class="text-sm text-muted">${T('Chưa có thay đổi so với bản đã lưu trước đó.','No changes since the last saved version.')}</p>`}
    ${stField(contrib?T('Ghi chú cho người duyệt','Note to the reviewer'):T('Ghi chú phát hành','Release notes'),`<textarea id="st-notes" class="textarea textarea--secondary" rows="3" data-input="stNotes" placeholder="${contrib?T('VD: Đã sửa phương án câu 3 và giải thích câu 6 theo góp ý.','e.g. Fixed Q3 options and the Q6 explanation as suggested.'):T('VD: Bổ sung 14 câu Part 7, căn chỉnh lại audio Part 4.','e.g. Added 14 Part 7 questions, re-aligned Part 4 audio.')}">${esc(ed.notes)}</textarea>`,{id:'st-notes',desc:contrib?'':T('Hiển thị trong lịch sử revision, không hiển thị cho người học.','Shown in revision history, not to learners.')})}</div>`;
  let side;
  if (contrib){
    side = `<div class="card card--lg">${cardHead(T('Giấy phép & quyền','Licence & rights'),'','',tile('file-check','accent','sm'))}
      <div class="col gap-2" role="radiogroup" aria-label="${T('Giấy phép','Licence')}">${Object.entries(ST_LICENCE).map(([v,[l,d]])=>`<button type="button" role="radio" aria-checked="${ed.licence===v}" class="choice st-choice" data-action="stLicence" data-v="${v}" data-fk="lic:${v}"><span class="grow"><span class="choice__title">${tx(l)}</span><span class="choice__desc">${tx(d)}</span></span>${ed.licence===v?icon('circle-check-fill',16,'text-accent'):''}</button>`).join('')}</div>
      <label class="checkbox"><input type="checkbox" id="st-rights-ok" data-input="stRights" ${ed.rights?'checked':''}><span class="checkbox__control">${icon('check',11)}</span><span class="text-sm">${T('Tôi là tác giả; nội dung là bản gốc, không sao chép đề thi thật của ETS, IDP hay British Council.','I’m the author; the content is original and doesn’t copy real ETS, IDP or British Council tests.')}</span></label>
      <div class="separator"></div>
      <div class="row gap-3">${avatar(stOwner(c.owner).initials,{size:'sm',color:stOwner(c.owner).color})}<span class="grow"><span class="text-sm font-medium" style="display:block">${stOwner(c.owner).name}</span><span class="text-xs text-muted">${T('Ghi công trên thẻ đề sau khi xuất bản','Credited on the test card once published')}</span></span></div>
      ${alertBox('default',T('Duyệt trong 3–5 ngày làm việc','Reviewed within 3–5 working days'),T('Kiểm tra tự động (bản quyền, trùng lặp) chạy ngay khi gửi. Bạn không thể tự duyệt bài của mình.','Automated checks (copyright, duplicates) run on submit. Nobody can approve their own submission.'),'',{ic:'clock',flat:true})}
      ${btn(T('Gửi duyệt','Submit for review'),{ic:'paper-plane',action:'stPublish',full:true,size:'lg',disabled:!ready})}
      ${!ready?`<span class="description">${openBlk?T(`Xử lý ${openBlk} lỗi chặn trước.`,`Resolve ${openBlk} blocking issues first.`):T('Chọn giấy phép và xác nhận quyền tác giả.','Choose a licence and confirm authorship.')}</span>`:''}</div>`;
  } else {
    const pubAdmin=can('content.publish'), wasPub=c.status==='published', inProg=Math.round((c.plays||0)*.004);
    side = `<div class="card card--lg">${cardHead(pubAdmin?T('Xuất bản','Publish'):T('Xuất bản cho lớp','Publish to class'),'','',tile('rocket','accent','sm'))}
      <div class="list list--divided">
        <div class="list-box-item st-kv"><span class="grow text-sm text-muted">${T('Đích','Target')}</span><span class="text-sm font-medium">${pubAdmin?(ed.vis==='public'?T('Danh mục công khai','Public catalog'):tx(ST_VIS[ed.vis][0])):T('Thành viên Sunrise English','Sunrise English members')}</span></div>
        <div class="list-box-item st-kv"><span class="grow text-sm text-muted">Revision</span><span class="text-sm font-medium tnum">${wasPub?`r${c.rev} → r${c.rev+1}`:`r${c.rev}`}</span></div>
        ${pubAdmin?`<div class="list-box-item st-kv"><span class="grow text-sm text-muted">${T('Gói truy cập','Access tier')}</span><span class="text-sm font-medium">${tx(ST_TIER[ed.tier])}</span></div>`:''}</div>
      ${pubAdmin?`<div class="col gap-2" role="radiogroup" aria-label="${T('Thời điểm','Timing')}">${[['now',T('Xuất bản ngay','Publish now')],['later',T('Lên lịch','Schedule')]].map(([v,l])=>`<label class="radio"><input type="radio" id="st-sched-${v}" name="st-sched" data-input="stSched" value="${v}" ${ed.sched===v?'checked':''}><span class="radio__control"></span><span class="text-sm">${l}</span></label>`).join('')}
        ${ed.sched==='later'?stField(T('Ngày xuất bản','Publish date'),`<input id="st-date" type="date" class="input input--secondary" value="${ed.date}" min="${ST_TODAY}" data-input="stDate">`,{id:'st-date',desc:T('Xuất bản lúc 07:00 (giờ Việt Nam).','Goes live at 07:00 (Vietnam time).')}):''}</div>`:''}
      ${alertBox(wasPub?'accent':'default',T('Ảnh hưởng tới người học','Learner impact'),wasPub?T(`${inProg} lượt làm đang dở giữ nguyên rev ${c.rev}; lượt mới dùng rev ${c.rev+1}. Kết quả cũ không bị chấm lại.`,`${inProg} in-progress attempts stay on rev ${c.rev}; new attempts use rev ${c.rev+1}. Past results aren’t re-scored.`):T('Bản đầu tiên — chưa có lượt làm nào bị ảnh hưởng.','First release — no attempts are affected.'),'',{ic:'persons',flat:true})}
      ${btn(stPrimary(c,ed).l,{ic:stPrimary(c,ed).ic,action:'stPublish',full:true,size:'lg',disabled:!ready})}
      ${!ready?`<span class="description">${T(`Xử lý ${openBlk} lỗi chặn để bật nút xuất bản.`,`Resolve ${openBlk} blocking issues to enable publishing.`)}</span>`:''}</div>`;
  }
  return `<div class="grid grid-main"><div class="col gap-4">${checklist}${diff}</div><div class="col gap-4">${side}</div></div>`;
}

/* ---------- Mobile editor: monitor · resolve · publish/submit ---------- */
function stMobileEditor(c,ed,M,A,iss){
  const contrib=ed.as==='contributor', blk=iss.filter(i=>i.block&&!i.done).length, ready=!blk&&(!contrib||(ed.licence&&ed.rights)), done=c.q[1]-stMissing(c,ed,M).length, pr=stPrimary(c,ed);
  const head = `<div class="card"><div class="row gap-3">${stThumb(c,64,48)}<div class="grow" style="min-width:0"><div class="font-semibold">${esc(tx(c.title))}</div><div class="text-xs text-muted">${ST_EXAM[c.exam]} · ${tx(KIND[c.kind])} · Rev ${c.rev}</div></div></div><div class="row row--wrap gap-1">${stStatusChip(c.status)}${contrib?chip(T('Người đóng góp','Contributor'),'accent','person-pencil',{size:'sm'}):''}</div></div>`;
  const stats = `<div class="grid grid-2" style="gap:10px">${stat(T('Câu hỏi','Questions'),`${done}/${c.q[1]}`)}${stat(T('Lỗi chặn','Blocking'),String(blk),{right:blk?icon('circle-exclamation',16,'text-danger'):icon('circle-check',16,'text-success')})}</div>`;
  const desk = alertBox('default',T('Soạn trên máy tính','Edit on a computer'),T('Audio, script và câu hỏi cần màn hình lớn. Trên điện thoại bạn xem tóm tắt, xử lý góp ý và '+(contrib?'gửi duyệt.':'xuất bản.'),'Audio, script and questions need a large screen. On mobile you can review the summary, resolve comments and '+(contrib?'submit.':'publish.')),'',{ic:'display',flat:true});
  const list = `<div class="card">${cardHead(T('Kiểm tra','Checks'),`<span class="text-xs text-muted">${iss.filter(i=>!i.done).length}</span>`)}${iss.length?`<div class="list list--flush list--divided">${iss.map(i=>stIssueRow(i,contrib)).join('')}</div>`:`<p class="text-sm text-muted">${T('Không có vấn đề.','No issues.')}</p>`}</div>`;
  const lic = contrib?`<div class="card">${cardHead(T('Giấy phép','Licence'))}<div class="col gap-2" role="radiogroup" aria-label="${T('Giấy phép','Licence')}">${Object.entries(ST_LICENCE).map(([v,[l,d]])=>`<button type="button" role="radio" aria-checked="${ed.licence===v}" class="choice st-choice" data-action="stLicence" data-v="${v}" data-fk="mlic:${v}"><span class="grow"><span class="choice__title">${tx(l)}</span><span class="choice__desc">${tx(d)}</span></span></button>`).join('')}</div><label class="checkbox"><input type="checkbox" id="st-rights-ok" data-input="stRights" ${ed.rights?'checked':''}><span class="checkbox__control">${icon('check',11)}</span><span class="text-sm">${T('Tôi là tác giả; nội dung là bản gốc, không sao chép đề thi thật.','I’m the author; the content is original and doesn’t copy real tests.')}</span></label></div>`:'';
  return head+stats+desk+list+lic+btn(pr.l,{ic:pr.ic,action:'stPublish',full:true,size:'lg',disabled:!ready})+(!ready?`<span class="description" style="text-align:center">${blk?T(`Còn ${blk} lỗi chặn cần sửa trên máy tính.`,`${blk} blocking issues need fixing on a computer.`):T('Chọn giấy phép và xác nhận quyền tác giả.','Choose a licence and confirm authorship.')}</span>`:'');
}

/* =====================================================================
   STUDIO IMPORT
   ===================================================================== */
const ST_STEPS = [['Chuẩn bị gói','Prepare'],['Tải lên','Upload'],['Kiểm tra','Validate'],['Tạo bản nháp','Create draft']];
const ST_RIGHTS = {own:['Tự biên soạn (nhân sự nội bộ)','Written in-house'],commissioned:['Đặt hàng tác giả · có hợp đồng','Commissioned · under contract'],licensed:['Mua bản quyền từ đối tác','Licensed from a partner'],cc:['Giấy phép mở (CC BY / CC0)','Open licence (CC BY / CC0)']};
const ST_ERRORS = [
  [14,'answer',['Đáp án “E” không hợp lệ — chỉ A–D','Answer “E” is invalid — only A–D'],['Sửa thành A, B, C hoặc D','Change to A, B, C or D']],
  [4,'image_alt',['Thiếu mô tả ảnh (bắt buộc với Part 1)','Missing image description (required for Part 1)'],['Thêm alt text mô tả ảnh q003.png','Add alt text for q003.png']],
  [39,'audio_end',['audio_end 31:05 nhỏ hơn audio_start 31:12','audio_end 31:05 is before audio_start 31:12'],['Kiểm tra lại mốc thời gian câu 38','Re-check the timestamps of Q38']],
  [97,'audio_file',['Không có audio/part4_q95-97.mp3 trong gói','audio/part4_q95-97.mp3 is not in the package'],['Bổ sung tệp hoặc sửa tên trong manifest','Add the file or fix its name']],
  [113,'stem',['Trùng 96% với câu 101 trong ngân hàng toeic01','96% duplicate of Q101 in bank toeic01'],['Viết lại câu hoặc ghi chú lý do giữ','Rewrite or note why it should stay']],
  [126,'option_d',['Thiếu phương án D (Part 5 cần 4 phương án)','Option D missing (Part 5 needs 4 options)'],['Bổ sung option_d','Fill option_d']],
  [148,'passage_id',['Không tìm thấy passage “p7_e12” trong passages.json','Passage “p7_e12” not found in passages.json'],['Thêm passage hoặc sửa mã','Add the passage or fix the ID']]];
function stStepper(step){
  return `<ol class="st-stepper" aria-label="${T('Các bước nhập gói','Import steps')}">${ST_STEPS.map((s,i)=>{ const n=i+1, st=n<step?'done':n===step?'current':'todo';
    return `<li class="st-step st-step--${st}" ${st==='current'?'aria-current="step"':''}><span class="st-step__dot">${st==='done'?icon('check',14):n}</span><span class="st-step__label">${tx(s)}</span></li>`; }).join('')}</ol>`;
}
const stImpPkg = () => contentScope()!=='engrisk'?'sunrise-mock-04.zip':'toeic-test-04.zip';
function rStudioImport(){
  const I=S.studio.imp, m=isM(), err=viewState('studio-import')==='error', tenant=contentScope()!=='engrisk';
  if (err) I.step=2;
  const pkg = stImpPkg();
  if (m) return alertBox('default',T('Nhập gói đề cần máy tính','Package import needs a computer'),T('Chuẩn bị manifest Excel, audio và ảnh rồi tải lên từ Content Studio trên web. Trên điện thoại bạn có thể theo dõi kết quả kiểm tra.','Prepare the Excel manifest, audio and images, then upload from Content Studio on the web. On mobile you can follow validation results.'),'',{ic:'display',flat:true})
    + `<div class="card">${cardHead(T('Lần nhập gần nhất','Latest import'),chip(T('7 lỗi','7 errors'),'danger','circle-exclamation',{size:'sm'}))}<div class="list list--flush"><div class="list-box-item">${tile('file-zipper','default','sm')}<span class="grow"><span class="list-box-item__label">${pkg}</span><span class="list-box-item__description">${T('193/200 dòng hợp lệ','193/200 rows valid')} · ${fmtDate('2026-10-26')}</span></span></div></div>${progressBar(193,200,{size:'sm',color:'warning',aria:T('Dòng hợp lệ','Valid rows')})}</div>`+btn(T('Về Content Studio','Back to Content Studio'),{v:'tertiary',full:true,action:'go',data:{to:'studio'}});
  const stepper = `<div class="card">${stStepper(I.step)}</div>`;
  let body='';
  if (I.step===1){
    const tpls=[['excel','file-text',T('Manifest Excel (.xlsx)','Excel manifest (.xlsx)'),T('1 dòng = 1 câu · có sẵn danh sách thả xuống','1 row = 1 question · built-in dropdowns')],['json','code',T('JSON schema','JSON schema'),T('Cho đối tác tích hợp qua API','For partners integrating via API')],['zip','file-zipper',T('Gói mẫu (.zip)','Sample package (.zip)'),T('Đề 10 câu đầy đủ audio + ảnh','A complete 10-question set with audio + images')]];
    const templates = `<div class="card">${cardHead(T('Mẫu','Templates'),'','',tile('arrow-down-to-line','accent','sm'))}<div class="list list--flush">${tpls.map(([v,ic,t,d])=>`<div class="list-box-item">${tile(ic,'default','sm')}<span class="grow"><span class="list-box-item__label">${t}</span><span class="list-box-item__description">${d}</span></span>${btn(T('Tải về','Download'),{v:'tertiary',size:'sm',ic:'arrow-down-to-line',action:'stTpl',data:{v}})}</div>`).join('')}</div></div>`;
    const tree=[[0,'file-zipper',pkg,''],[1,'file-text','manifest.xlsx',T('200 dòng · 1 dòng/câu','200 rows · 1 per question')],[1,'code','passages.json',T('Đoạn văn Part 6–7 (p6_*, p7_*)','Part 6–7 passages (p6_*, p7_*)')],[1,'folder','audio/',''],[2,'music-note','part1.mp3 … part4.mp3',T('MP3/WAV, 44.1 kHz','MP3/WAV, 44.1 kHz')],[1,'folder','images/',''],[2,'picture','q001.png … q006.png',T('Ảnh Part 1, ≥ 1200 px','Part 1 photos, ≥ 1200 px')],[1,'file-check','LICENSE.txt',T('Căn cứ quyền sử dụng','Rights basis')]];
    const treeC = `<div class="card">${cardHead(T('Cấu trúc gói ZIP','ZIP structure'),'','',tile('folder','default','sm'))}<ul class="st-tree">${tree.map(([d,ic,n,note])=>`<li style="--d:${d}">${icon(ic,14,'text-muted')}<code>${n}</code>${note?`<span class="text-xs text-muted">${note}</span>`:''}</li>`).join('')}</ul></div>`;
    const cols=[['q_no','✓','1–200','101'],['part','✓','P1–P7','P5'],['stem',T('P3–P7','P3–P7'),T('văn bản (EN)','text (EN)'),'The quarterly report must be…'],['option_a … option_d','✓',T('văn bản · P2 chỉ a–c','text · P2 a–c only'),'by'],['answer','✓','A–D','A'],['explanation_vi / _en',T('vi ✓','vi ✓'),T('văn bản','text'),'“by + mốc thời gian” = hạn chót'],['audio_file · audio_start · audio_end','Listening','mp3 · mm:ss','part3.mp3 · 31:12 · 32:24'],['image_file · image_alt','Part 1',T('png/jpg · văn bản','png/jpg · text'),'q001.png · A woman typing…'],['passage_id','P6–P7',T('mã trong passages.json','ID in passages.json'),'p7_e01'],['skill_tag','—','taxonomy','grammar.preposition']];
    const spec = `<div class="card">${cardHead(T('Đặc tả cột manifest','Manifest columns'),'',T('Nội dung đề bằng tiếng Anh; giải thích tiếng Việt bắt buộc.','Exam content in English; Vietnamese explanation required.'),tile('layout-cells','default','sm'))}<table class="table"><thead><tr><th>${T('Cột','Column')}</th><th>${T('Bắt buộc','Required')}</th><th>${T('Định dạng','Format')}</th><th>${T('Ví dụ','Example')}</th></tr></thead><tbody>${cols.map(([c1,r,f,e])=>`<tr><td><code class="st-code">${c1}</code></td><td class="text-sm">${r}</td><td class="text-sm text-muted">${f}</td><td class="text-sm">${esc(e)}</td></tr>`).join('')}</tbody></table></div>`;
    body = `<div class="grid grid-2 grid--stretch">${templates}${treeC}</div>${spec}<div class="row row--end">${btn(T('Tiếp tục: tải gói lên','Next: upload package'),{iconR:'arrow-right',action:'stImpStep',data:{v:2}})}</div>`;
  } else if (I.step===2){
    const ready=I.rights&&I.ok;
    body = `<div class="grid grid-main"><div class="card card--lg">${cardHead(T('Tải gói đề','Upload package'),'',tenant?T('Bản nháp tạo trong thư viện Sunrise English.','Drafts are created in the Sunrise English library.'):T('Bản nháp tạo trong thư viện Platform.','Drafts are created in the Platform library.'),tile('cloud-arrow-up-in','accent'))}
      ${err?alertBox('danger',T('Tệp bị từ chối','File rejected'),T('“toeic-test-04.rar” không phải .zip hoặc .xlsx. Nén lại bằng ZIP rồi tải lên lại; không có dữ liệu nào được nhập.','“toeic-test-04.rar” isn’t a .zip or .xlsx. Re-compress as ZIP and upload again; nothing was imported.'),btn(T('Xem cấu trúc gói','See package structure'),{v:'tertiary',size:'sm',action:'stImpStep',data:{v:1}}),{flat:true}):''}
      <div class="dropzone ${err?'st-drop--error':''}">${icon(err?'circle-xmark-fill':'file-zipper',28,err?'text-danger':'text-muted')}<span class="font-medium">${T('Kéo thả gói .zip hoặc manifest .xlsx','Drop a .zip package or .xlsx manifest')}</span><span class="text-sm text-muted">${T('Tối đa 500 MB · quét mã độc trước khi đọc','Up to 500 MB · malware-scanned before reading')}</span>${btn(T('Chọn tệp (mô phỏng)','Choose file (simulated)'),{ic:'arrow-up-from-square',action:'stImpUpload',disabled:!ready})}</div>
      <div class="grid grid-2" style="gap:12px">${stField(T('Căn cứ quyền sử dụng','Rights basis'),`<select id="st-rights" class="select select--secondary" data-input="stImpRights"><option value="">${T('Chọn…','Choose…')}</option>${Object.entries(ST_RIGHTS).map(([v,l])=>`<option value="${v}" ${I.rights===v?'selected':''}>${tx(l)}</option>`).join('')}</select>`,{id:'st-rights',req:true})}${stField(T('Thư viện đích','Target library'),`<input id="st-target" class="input input--secondary" value="${tenant?'Sunrise English · Tenant':'Engrisk · Platform'}" disabled>`,{id:'st-target'})}</div>
      <label class="checkbox"><input type="checkbox" id="st-imp-ok" data-input="stImpOk" ${I.ok?'checked':''}><span class="checkbox__control">${icon('check',11)}</span><span class="text-sm">${T('Gói không chứa đề thi thật của ETS, IDP hay British Council. Hệ thống sẽ so khớp dấu vân tay bản quyền.','The package contains no real ETS, IDP or British Council material. Copyright fingerprints will be checked.')}</span></label>
      ${!ready?`<span class="description">${T('Chọn căn cứ quyền và xác nhận để bật tải lên.','Pick a rights basis and confirm to enable upload.')}</span>`:''}</div>
      <div class="card">${cardHead(T('Hệ thống sẽ kiểm tra','What we check'),'','',tile('shield-check','default','sm'))}<div class="list list--flush">${[['list-check',T('Cột bắt buộc & định dạng','Required columns & formats')],['music-note',T('Ghép audio theo mốc thời gian','Audio matched by timestamps')],['picture',T('Ảnh Part 1 + alt text','Part 1 images + alt text')],['copy',T('Trùng lặp với ngân hàng câu hỏi','Duplicates against the bank')],['shield-exclamation',T('Dấu vân tay bản quyền','Copyright fingerprints')]].map(([ic,t])=>`<div class="list-box-item">${tile(ic,'default','sm')}<span class="grow text-sm">${t}</span></div>`).join('')}</div></div></div>
      <div class="row row--between">${btn(T('Quay lại','Back'),{v:'tertiary',ic:'arrow-left',action:'stImpStep',data:{v:1}})}</div>`;
  } else if (I.step===3){
    if (I.phase==='validating') body = `<div class="card card--lg"><div class="row gap-3"><span class="spinner">${SPIN}</span><span class="grow"><span class="font-medium" style="display:block">${T('Đang kiểm tra','Validating')} ${esc(I.file)}…</span><span class="text-sm text-muted">${T('Đọc manifest, ghép audio/ảnh, so trùng với ngân hàng','Reading the manifest, matching audio/images, checking duplicates')}</span></span>${sim()}</div>${progressBar(62,100,{size:'sm',aria:T('Tiến độ kiểm tra','Validation progress')})}</div>`;
    else {
      const kp = `<div class="grid grid-4">${stat(T('Dòng hợp lệ','Valid rows'),'193',{small:'/ 200'})}${stat(T('Lỗi','Errors'),'7',{right:icon('circle-exclamation',16,'text-danger')})}${stat(T('Audio đã ghép','Audio matched'),'4',{small:'/ 4 '+T('tệp','files')})}${stat(T('Ảnh đã ghép','Images matched'),'6',{small:'/ 6'})}</div>`;
      const tbl = `<div class="card">${cardHead(T('Báo cáo kiểm tra','Validation report'),btn(T('Tải báo cáo CSV','Download CSV'),{v:'tertiary',size:'sm',ic:'arrow-down-to-line',action:'stTpl',data:{v:'csv'}}),`${esc(I.file)} · ${T('7 dòng lỗi sẽ không được nhập nếu bỏ qua','7 invalid rows are skipped if you continue')}`,tile('file-check','default','sm'))}
        <table class="table"><thead><tr><th>${T('Dòng','Row')}</th><th>${T('Cột','Column')}</th><th>${T('Lỗi','Error')}</th><th>${T('Cách sửa','How to fix')}</th></tr></thead><tbody>${ST_ERRORS.map(([r,col,msg,fix])=>`<tr><td class="tnum nowrap">${r} <span class="text-xs text-muted">· ${T('câu','Q')} ${r-1}</span></td><td><code class="st-code">${col}</code></td><td><span class="row gap-2 text-sm">${icon('circle-exclamation',14,'text-danger')}${tx(msg)}</span></td><td class="text-sm text-muted">${tx(fix)}</td></tr>`).join('')}</tbody></table></div>`;
      const match = `<div class="card">${cardHead(T('Ghép tệp','File matching'),'','',tile('link','default','sm'))}<div class="list list--flush list--divided">${[['music-note','part1.mp3','Q1–6 · 03:52'],['music-note','part2.mp3','Q7–31 · 11:20'],['music-note','part3.mp3','Q32–70 · 15:54'],['music-note','part4.mp3',T('Q71–100 · thiếu cue 95–100','Q71–100 · cues 95–100 missing')],['picture','q001–q006.png',T('6 ảnh · 1 thiếu alt','6 images · 1 missing alt')]].map(([ic,f,d])=>`<div class="list-box-item">${tile(ic,'default','sm')}<span class="grow"><code class="st-code">${f}</code><span class="list-box-item__description">${d}</span></span>${/thiếu|missing/.test(d)?chip(T('Cần xử lý','Needs work'),'warning','triangle-exclamation',{size:'sm'}):chip(T('Khớp','Matched'),'success','check',{size:'sm'})}</div>`).join('')}</div></div>`;
      body = kp+tbl+match+`<div class="row row--between">${btn(T('Tải lại gói đã sửa','Upload a fixed package'),{v:'tertiary',ic:'arrow-up-from-square',action:'stImpStep',data:{v:2}})}${btn(T('Bỏ qua 7 dòng lỗi & tạo bản nháp','Skip 7 invalid rows & create draft'),{iconR:'arrow-right',action:'stImpCreate'})}</div>`;
    }
  } else {
    const steps=[[T('Tạo 193 câu hỏi','Creating 193 questions'),true],[T('Liên kết 4 audio & 6 ảnh','Linking 4 audio files & 6 images'),true],[T('Tạo cue theo mốc thời gian','Generating cues from timestamps'),I.phase==='done'],[T('Chuyển 7 dòng lỗi thành việc cần làm','Turning 7 invalid rows into to-dos'),I.phase==='done']];
    body = `<div class="card card--lg" style="max-width:560px;width:100%;align-self:center">${cardHead(T('Đang tạo bản nháp','Creating draft'),sim(),esc(I.file),tile('file-plus','accent'))}<div class="list list--flush">${steps.map(([t,d])=>`<div class="list-box-item">${d?icon('circle-check-fill',16,'text-success'):`<span class="spinner spinner--sm">${SPIN}</span>`}<span class="grow text-sm">${t}</span></div>`).join('')}</div></div>`;
  }
  return stepper+body;
}

/* =====================================================================
   Actions & input hooks
   ===================================================================== */
function stOpen(id,as){
  const c=stItem(id); if(!c) return;
  clearInterval(stTimer); stTimer=null; clearTimeout(stAlignT);
  S.studio.ed=stNewEd(c,as||(S.role==='learner'?'contributor':null)); S.navMenu=null; go('studio-editor');
}
function stPreviewId(c){
  if (c.catalogId&&EXAMS[c.catalogId]) return c.catalogId;
  return c.exam==='ielts_academic'?'ielts-r-bees':c.kind==='full_mock'?'toeic-test-01':c.skill==='listening'?'toeic-l-part3':'toeic-r-part5';
}
function stAlignRun(){
  const ed=S.studio.ed; if(!ed||ed.align==='running') return; const id=ed.id;
  ed.align='running'; ed.confirmed={}; render();
  clearTimeout(stAlignT); stAlignT=setTimeout(()=>{ const e=S.studio.ed; if(!e||e.id!==id) return; e.align='done'; const A=stAudio(stItem(id),e);
    if (S.screen==='studio-editor') toast(T('Đã căn chỉnh script với audio','Script aligned to audio'),T(`${A.units.length} cue · 3 cue độ tin cậy thấp cần nghe lại (mô phỏng).`,`${A.units.length} cues · 3 low-confidence cues to re-check (simulated).`),'success'); else render(); },1600);
}
const STUDIO_ACTIONS = {
  studioOpen:d=>{
    if (d.id==='cd-new'&&!stItem('cd-new')) S.content.unshift({id:'cd-new',scope:'engrisk',title:['Bộ đề đóng góp mới','New contribution'],exam:'toeic_lr',kind:'practice_set',skill:'reading',status:'draft',rev:1,visibility:'public',tier:'guest',origin:'community',owner:'minh',updated:ST_TODAY,q:[0,10],audio:'none',issues:2});
    stOpen(d.id,d.as);
  },
  stNew:()=>{ const scope=contentScope(), n=S.content.filter(c=>c.id.startsWith('st-new')).length+1, id=`st-new-${n}`;
    S.content.unshift({id,scope,title:['Đề mới chưa đặt tên','Untitled test'],exam:'toeic_lr',kind:'practice_set',skill:'reading',status:'draft',rev:1,visibility:scope==='engrisk'?'public':'tenant',tier:scope==='engrisk'?'guest':'registered',origin:'human',owner:stMe(),updated:ST_TODAY,q:[0,10],audio:'none',issues:2});
    ST_PARTS[id]=['P5']; stOpen(id); toast(T('Đã tạo bản nháp','Draft created'),T('Part 5 · 10 câu. Đổi tên ở tab Tổng quan.','Part 5 · 10 questions. Rename it in Overview.'),'success'); },
  stOpenRow:d=>stOpen(d.id),
  stReview:d=>{ S.navMenu=null; if (typeof A.modOpen==='function'&&stCanReview()) A.modOpen({id:d.id}); else stOpen(d.id); },
  stPreview:d=>{ S.navMenu=null; const c=stItem(d.id); if(!c) return; const ex=stPreviewId(c); clearInterval(stTimer); if(S.studio.ed) S.studio.ed.playing=false; A.openExam({id:ex}); if(!c.catalogId) toast(T('Xem trước bằng bộ đề mẫu','Previewing with a sample set'),T('Bản nháp chưa có bản dựng; dùng đề mẫu cùng định dạng (mô phỏng).','The draft has no build yet; using a sample in the same format (simulated).'),'info'); },
  stDuplicate:d=>{ S.navMenu=null; const c=stItem(d.id); const id=`${d.id}-copy`; if(!stItem(id)){ S.content.unshift({...JSON.parse(JSON.stringify(c)),id,status:'draft',rev:1,plays:0,rating:undefined,catalogId:undefined,owner:stMe(),origin:c.origin==='community'?'community':'human',updated:ST_TODAY,title:Array.isArray(c.title)?[c.title[0]+' (bản sao)',c.title[1]+' (copy)']:[c.title+' (bản sao)',c.title+' (copy)']}); if(ST_PARTS[d.id]) ST_PARTS[id]=ST_PARTS[d.id]; } render(); toast(T('Đã nhân bản thành bản nháp','Duplicated as a draft'),tx(stItem(id).title),'success'); },
  stArchive:d=>{ S.navMenu=null; const c=stItem(d.id); c.status='archived'; c.updated=ST_TODAY; render(); toast(T('Đã lưu trữ','Archived'),T('Ẩn khỏi Luyện đề; lượt làm cũ vẫn xem lại được.','Hidden from Practice tests; past attempts stay reviewable.'),'info'); },
  stFilter:d=>{ S.studio.f=d.v; render(); },
  stClear:()=>{ Object.assign(S.studio,{f:'all',q:'',exam:'all',origin:'all'}); render(); },
  stTab:d=>{ S.studio.ed.tab=d.v; stPlay(false); render(); },
  stGo:d=>{ const ed=S.studio.ed; ed.tab=d.tab; if(d.q){ const c=stEdItem(), qq=stModel(c).qs.find(x=>x.n===+d.q); if(qq){ ed.qsel=qq.n; ed.part=qq.part; ed.qf='all'; } } stPlay(false); render(); },
  stGoQ:d=>STUDIO_ACTIONS.stGo({tab:'questions',q:d.q}),
  stSelQ:d=>{ const ed=S.studio.ed, c=stEdItem(), qq=stModel(c).qs.find(x=>x.n===+d.q); if(!qq) return; ed.qsel=qq.n; ed.part=qq.part; stPlay(false); ed.playUntil=null; render(); },
  stPart:d=>{ const ed=S.studio.ed, c=stEdItem(), qq=stModel(c).qs.find(x=>x.part===d.p); ed.part=d.p; if(qq) ed.qsel=qq.n; render(); },
  stQF:d=>{ S.studio.ed.qf=d.v; render(); },
  stPv:()=>{ S.studio.ed.pv=!S.studio.ed.pv; render(); },
  stDiff:d=>{ const ed=S.studio.ed; ed.q[ed.qsel]={...ed.q[ed.qsel],diff:+d.v}; stDirty(); render(); },
  stTagRm:d=>{ const ed=S.studio.ed, c=stEdItem(), M=stModel(c), q=stQ(c,ed,M,M.qs.find(x=>x.n===ed.qsel)); ed.q[ed.qsel]={...ed.q[ed.qsel],tags:q.tags.filter(t=>t!==d.t)}; stDirty(); render(); },
  stVis:d=>{ S.studio.ed.vis=d.v; stDirty(); render(); },
  stLicence:d=>{ S.studio.ed.licence=d.v; stDirty(); render(); },
  stPractice:()=>{ S.studio.ed.practice=!S.studio.ed.practice; stDirty(); render(); },
  stShuffle:()=>{ S.studio.ed.shuffle=!S.studio.ed.shuffle; stDirty(); render(); },
  stZoom:d=>{ S.studio.ed.zoom=+d.v; render(); },
  stPlayToggle:()=>{ const ed=S.studio.ed; ed.playUntil=null; stPlay(!ed.playing); render(); },
  stSeekT:d=>{ S.studio.ed.t=+d.t; render(); },
  stWaveSeek:(d,el,ev)=>{ const ed=S.studio.ed, A=stAudio(stEdItem(),ed), r=el.getBoundingClientRect(), span=A.dur/ed.zoom, s0=Math.max(0,Math.min(A.dur-span,ed.t-span/2));
    ed.t=Math.max(0,Math.min(A.dur,s0+(ev.clientX-r.left)/r.width*span)); stWaveRefresh(); },
  stCue:d=>{ const ed=S.studio.ed, A=stAudio(stEdItem(),ed), ats=A.units.filter(u=>u.st!=='missing').map(u=>u.at);
    const nx = +d.dir>0 ? ats.find(a=>a>ed.t+.5) : [...ats].reverse().find(a=>a<ed.t-.5); if(nx!=null){ ed.t=nx; render(); } },
  stJumpUnit:d=>{ const ed=S.studio.ed, A=stAudio(stEdItem(),ed), u=A.units.find(x=>x.key===d.k); if(!u) return;
    if (ed.playing&&ed.playUntil===u.at+u.len){ stPlay(false); ed.playUntil=null; render(); return; }
    ed.t=u.at; if(ed.tab==='audio'){ ed.spart=u.part; const pu=A.units.filter(x=>x.part===u.part); ed.su=pu.indexOf(u); ed.playUntil=null; } else ed.playUntil=u.at+u.len; stPlay(true); render(); },
  stScriptOf:d=>{ const ed=S.studio.ed, A=stAudio(stEdItem(),ed), u=A.units.find(x=>x.key===d.k); ed.tab='audio'; stPlay(false); if(u){ ed.spart=u.part; ed.su=A.units.filter(x=>x.part===u.part).indexOf(u); ed.t=u.at; } render(); },
  stSPart:d=>{ const ed=S.studio.ed; ed.spart=d.v; ed.su=0; render(); },
  stSU:d=>{ const ed=S.studio.ed; ed.su=Math.max(0,ed.su+(+d.d)); render(); },
  stAlign:()=>stAlignRun(),
  stConfirm:d=>{ S.studio.ed.confirmed[d.k]=true; stDirty(); render(); },
  stFix:d=>{ const ed=S.studio.ed, c=stEdItem(), M=stModel(c);
    if (d.f==='align'){ stAlignRun(); return; }
    if (d.f==='bank'){ ed.fixed.missing=true; toast(T('Đã lấy câu từ ngân hàng','Pulled from the bank'),T(`${c.q[1]-c.q[0]} câu được điền từ ngân hàng đã kiểm duyệt — hãy rà lại (mô phỏng).`,`${c.q[1]-c.q[0]} questions filled from the verified bank — please review (simulated).`),'success'); }
    else if (d.f==='upload'){ ed.fixed.upload=true; toast(T('Đã tải audio lên','Audio uploaded'),T('Đạt kiểm tra độ to & mã độc. Chạy “Tự căn chỉnh” để tạo cue (mô phỏng).','Passed loudness & malware checks. Run “Auto-align” to create cues (simulated).'),'success'); }
    else if (d.f==='alt'){ const q=stQ(c,ed,M,M.qs.find(x=>x.n===M.altQ)); ed.q[M.altQ]={...ed.q[M.altQ],alt:q.img==='warehouse'?'Boxes are stacked on metal shelves in a warehouse.':'A woman is sitting at a desk with a laptop and a potted plant.'}; toast(T('Đã gợi ý mô tả ảnh','Alt text suggested'),T('Hãy đọc lại trước khi xuất bản (mô phỏng AI).','Review it before publishing (simulated AI).'),'info'); }
    else if (d.f==='confirm'){ stAudio(c,ed,M).units.filter(u=>u.st==='check').forEach(u=>ed.confirmed[u.key]=true); }
    else if (d.f==='resolve'){ c.resolved=[...new Set([...(c.resolved||[]),+d.i])]; }
    else { ed.fixed[d.f]=true; if(d.f!=='dup') toast(T('Đã áp dụng gợi ý','Suggestion applied'),T('Nội dung AI là bản nháp — kiểm tra trước khi xuất bản (mô phỏng).','AI content is a draft — review before publishing (simulated).'),'info'); }
    stDirty(); render(); },
  stPublish:()=>{
    const ed=S.studio.ed, c=stEdItem(); if(!ed||!c) return;
    const contrib=ed.as==='contributor', blk=stIssues(c,ed).filter(i=>i.block&&!i.done).length;
    if (blk||(contrib&&(!ed.licence||!ed.rights))){ ed.tab='publish'; stPlay(false); render(); toast(blk?T(`Còn ${blk} lỗi chặn`,`${blk} blocking issues left`):T('Chưa chọn giấy phép','Licence not chosen'),blk?T('Xử lý các mục “Bắt buộc” trước khi tiếp tục.','Resolve the “Blocking” items first.'):T('Chọn giấy phép và xác nhận quyền tác giả.','Choose a licence and confirm authorship.'),'warning'); return; }
    stPlay(false);
    c.title = ed.titleVi===ed.titleEn?ed.titleVi:[ed.titleVi,ed.titleEn]; c.updated=ST_TODAY; c.issues=0; c.q=[c.q[1],c.q[1]]; if(c.audio==='partial'||(c.audio==='missing'&&ed.fixed.upload)) c.audio='ok';
    const back = S.role==='learner'?'contribute':'studio';
    if (contrib){ c.status='in_review'; c.submitted=ST_TODAY; c.licence=ed.licence; S.studio.ed=null; go(back); toast(T('Đã gửi duyệt','Submitted for review'),T('Người duyệt phản hồi trong 3–5 ngày làm việc.','A reviewer will respond within 3–5 working days.'),'success'); return; }
    const wasPub=c.status==='published', admin=can('content.publish');
    if (admin){ c.visibility=ed.vis; c.tier=ed.tier; } else c.visibility='tenant';
    if (wasPub) c.rev++;
    if (admin&&ed.sched==='later'){ c.status='scheduled'; c.publishAt=ed.date; }
    else { c.status='published'; delete c.publishAt; c.plays=c.plays||0; }
    S.studio.ed=null; go('studio');
    toast(c.status==='scheduled'?T(`Đã lên lịch ${fmtDate(c.publishAt)}`,`Scheduled for ${fmtDate(c.publishAt)}`):admin?T(`Đã xuất bản rev ${c.rev}`,`Published rev ${c.rev}`):T('Đã xuất bản cho lớp','Published to your class'),
      !admin?T('Chỉ thành viên Sunrise English nhìn thấy.','Visible to Sunrise English members only.'):wasPub?T(`Lượt làm đang dở giữ rev ${c.rev-1}; lượt mới dùng rev ${c.rev}.`,`In-progress attempts keep rev ${c.rev-1}; new attempts use rev ${c.rev}.`):T('Bộ đề xuất hiện trong Luyện đề.','The set now appears in Practice tests.'),'success');
  },
  /* import */
  stTpl:d=>toast(d.v==='csv'?T('Đã tải báo cáo','Report downloaded'):T('Đã tải mẫu','Template downloaded'),T('Tệp minh họa — không có tệp thật (mô phỏng).','Illustrative — no real file (simulated).'),'info'),
  stImpStep:d=>{ const I=S.studio.imp; I.step=+d.v; if(I.step<3) I.phase='idle'; render(); },
  stImpUpload:()=>{ const I=S.studio.imp; if(viewState('studio-import')==='error'){ render(); return; }
    I.file=stImpPkg(); I.step=3; I.phase='validating'; render();
    clearTimeout(stImpT); stImpT=setTimeout(()=>{ if(S.studio.imp!==I) return; I.phase='done'; if(S.screen==='studio-import') render(); },1300); },
  stImpCreate:()=>{ const I=S.studio.imp; I.step=4; I.phase='creating'; render();
    clearTimeout(stImpT); stImpT=setTimeout(()=>{ if(S.studio.imp!==I) return; I.phase='done'; render();
      stImpT=setTimeout(()=>{ if(S.studio.imp!==I||S.screen!=='studio-import') return; const tenant=contentScope()!=='engrisk', id=tenant?'sr-mock-04':'st-toeic-test-04';
        if (!stItem(id)) S.content.unshift({id,scope:'sunrise',title:['Đề thi thử 04 · Sunrise','Mock test 04 · Sunrise'],exam:'toeic_lr',kind:'full_mock',skill:'mixed',status:'draft',rev:1,visibility:'tenant',tier:'registered',origin:'imported',owner:'hanh',updated:ST_TODAY,q:[193,200],audio:'partial',issues:7});
        const c=stItem(id); c.updated=ST_TODAY; if (c.status==='draft') c.q=[193,c.q[1]];
        S.studio.imp=studioInitial().imp; stOpen(id); S.studio.ed.tab='publish'; render(); toast(T('Đã tạo bản nháp từ gói','Draft created from the package'),T('7 dòng lỗi đã chuyển thành việc cần xử lý trong tab Kiểm tra.','7 invalid rows became to-dos in the Check tab.'),'success'); },700); },1100); },
};

function studioChange(el,k){
  const ed=S.studio.ed;
  switch(k){
    case 'stExam': S.studio.exam=el.value; render(); return true;
    case 'stOrigin': S.studio.origin=el.value; render(); return true;
    case 'stImpRights': S.studio.imp.rights=el.value; render(); return true;
    case 'stImpOk': S.studio.imp.ok=el.checked; render(); return true;
    case 'stRights': ed.rights=el.checked; stDirty(); render(); return true;
    case 'stTier': ed.tier=el.value; stDirty(); render(); return true;
    case 'stSched': ed.sched=el.value; render(); return true;
    case 'stDate': ed.date=el.value||ed.date; stDirty(); return true;
    case 'stSpk': ed.spk[el.dataset.k]=el.value; stDirty(); return true;
    case 'stKey': ed.q[ed.qsel]={...ed.q[ed.qsel],answer:el.dataset.v,authored:true}; stDirty(); render(); return true;
    case 'stTagAdd': { if(!el.value) return true; const c=stEdItem(), M=stModel(c), q=stQ(c,ed,M,M.qs.find(x=>x.n===ed.qsel)); ed.q[ed.qsel]={...ed.q[ed.qsel],tags:[...q.tags,el.value]}; stDirty(); render(); return true; }
    case 'stAlt': case 'stStem': case 'stOpt': case 'stTitleVi': case 'stTitleEn': setTimeout(render,0); return true;
  }
  return ['stSearch','stLine','stExpVi','stExpEn','stEv','stAcc','stDesc','stNotes'].includes(k);
}
function studioInput(el,k){
  const ed=S.studio.ed, cur=()=>ed.q[ed.qsel]||{};
  switch(k){
    case 'stSearch': S.studio.q=el.value; render(); return true;
    case 'stTitleVi': ed.titleVi=el.value; break;
    case 'stTitleEn': ed.titleEn=el.value; break;
    case 'stDesc': ed.desc=el.value; break;
    case 'stNotes': ed.notes=el.value; return true;
    case 'stLine': ed.lines[el.dataset.k]=el.value; break;
    case 'stStem': ed.q[ed.qsel]={...cur(),stem:el.value,authored:true}; break;
    case 'stOpt': { const o={...(cur().opts||{})}; o[el.dataset.k]=el.value; ed.q[ed.qsel]={...cur(),opts:o,authored:true}; break; }
    case 'stAlt': ed.q[ed.qsel]={...cur(),alt:el.value}; break;
    case 'stExpVi': ed.q[ed.qsel]={...cur(),expVi:el.value}; break;
    case 'stExpEn': ed.q[ed.qsel]={...cur(),expEn:el.value}; break;
    case 'stEv': ed.q[ed.qsel]={...cur(),ev:el.value}; break;
    case 'stAcc': ed.q[ed.qsel]={...cur(),accepted:el.value}; break;
    default: return false;
  }
  stDirty(); return true;
}
