/* App: state, shells, overlays, render loop (motion + theme), actions, events, clocks. */
const initial = () => ({
  device: matchMedia('(max-width: 900px)').matches ? 'mobile' : 'desktop',
  mode:'light', palette:'default', lang:'vi', langMenu:null, langSuggestDone:false,
  persona:'returning', tenant:'engrisk', screen:'landing', hist:[],
  states:{}, modal:null, sheet:null, toasts:[],
  catalog:{track:'toeic',kind:'all',skill:null,q:''}, introExam:'toeic-test-01', setup:null, pPop:null, reviewEv:null,
  auth:{tab:'signin',convert:false,showPw:false,resetSent:false,email:'',emailInvalid:false},
  onb:{step:0,exam:null,level:null,target:null,minutes:null},
  resume:resumeSeed(),
  exam:null, result:null, extraHistory:[], review:{idx:0,onlyWrong:true}, resultFilter:'all',
  tutor:{ctx:'t101',myAnswer:'B',messages:null,typing:false,draft:'',opened:false,seen:0},
  writing:null, speaking:null,
  lib:{rightsOk:false,rights:'',materials:[
      {id:'m1',title:'Remote work trends.pdf',meta:['PDF · 2 trang · 184 KB','PDF · 2 pages · 184 KB'],rights:'personal_study_only',status:'ready'},
      {id:'m2',title:'scan_lesson3.pdf',meta:['PDF · 6 trang · 3.1 MB','PDF · 6 pages · 3.1 MB'],rights:'own_work',status:'failed',reason:['Không trích xuất được văn bản (PDF dạng ảnh). Hãy tải bản có thể chọn chữ.','Couldn’t extract text (image-only PDF). Upload a version with selectable text.']}],
    gen:'idle',genFrom:null,drafts:[],personal:null,editing:null},
  org:{invite:'pending',accent:ORG_ACCENTS[0][2]}, notif:true, googleLinked:true,
  role:'learner', content:JSON.parse(JSON.stringify(CONTENT_ITEMS)), studio:studioInitial(), contrib:communityInitial(),
  just:null, justChecked:null, _enter:false,
});
let S = initial();
const isM = () => S.device==='mobile';
const user = () => S.persona==='guest' ? {name:T('Khách','Guest'),first:T('bạn','there'),initials:'K',email:null,guest:true}
  : S.role==='content_admin' ? {name:'Thảo Lê',first:'Thảo',initials:'TL',email:'thao.le@engrisk.vn',staff:true}
  : S.role==='teacher' ? {name:'Hạnh Vũ',first:'Hạnh',initials:'HV',email:'hanh.vu@sunrise.edu.vn',staff:true}
  : S.persona==='new' ? {name:'An Trần',first:'An',initials:'AT',email:'an.tran@example.com'} : {name:'Minh Nguyễn',first:'Minh',initials:'MN',email:'minh.nguyen@example.com'};
/** Permission check for the prototype role (mirrors permissions.key in schema.dbml). */
const can = perm => !user().guest && ROLES[S.role].perms.includes(perm);
/** Content scope = active tenant: engrisk → platform (public) library, sunrise → tenant library. */
const contentScope = () => S.tenant;
const viewState = scr => {
  const s=S.states[scr]; if (s) return s;
  if (S.persona!=='returning' && ['home','progress','tutor','library'].includes(scr)){
    if (scr==='library') return S.lib.materials.length?'default':'empty';
    if (scr==='tutor' && S.tutor.opened) return 'default';
    return 'empty';
  }
  return 'default';
};
const resolvedTheme = () => S.mode==='system' ? (matchMedia('(prefers-color-scheme: dark)').matches?'dark':'light') : S.mode;

function toast(title,desc='',color='success'){
  const id=Date.now()+Math.random(); S.toasts.push({id,title,desc,color});
  document.getElementById('live').textContent=title;
  render(); setTimeout(()=>{ S.toasts=S.toasts.filter(t=>t.id!==id); render(); },3800);
}
function go(screen,opts={}){ if (S.screen!==screen) S.hist.push(S.screen); S.screen=screen; S.modal=null; S.sheet=null; S.langMenu=null; S.navMenu=null; Object.assign(S,opts); render(true); }

/* ---------- Shells ---------- */
function brand(){ const t=TENANTS[S.tenant]; return `<div class="brand"><span class="brand__mark">${t.mark}</span><span class="truncate">${t.name}</span></div>`; }
const NAV_LEARN = () => [['home','house',T('Trang chủ','Home')],['catalog','book-open',T('Luyện đề','Practice tests')],['tutor','sparkles','AI Tutor'],['progress','chart-column',T('Tiến độ','Progress')]];
const NAV_CONTENT = () => [['studio','layers','Content Studio'],['moderation','shield-check',T('Kiểm duyệt','Review queue')]];
const reviewCount = () => S.content.filter(c=>c.scope===contentScope()&&c.status==='in_review').length;
const MNAV = () => [['home','house',T('Trang chủ','Home')],['catalog','book-open',T('Luyện đề','Practice')],['tutor','sparkles','AI Tutor'],['progress','chart-column',T('Tiến độ','Progress')],['profile','person',T('Tôi','Me')]];
const navItem = (id,ic,l,cur,extra='') => `<button type="button" class="sidebar__item" data-action="go" data-to="${id}" data-fk="nav:${id}" ${cur===id?'aria-current="page"':''} title="${esc(l)}">${icon(ic)}<span class="sidebar__label">${l}</span>${extra}</button>`;
const NOTIFS = () => [
  ['clock','warning',T('Bài thi thử đang dở','Mock test in progress'),T('TOEIC Test 01 · Reading còn 38 phút — đồng hồ vẫn chạy.','TOEIC Test 01 · 38 min left in Reading — the clock is running.'),'resume'],
  ['envelope','accent',T('Lời mời từ Sunrise English','Invitation from Sunrise English'),T('Cô Lan mời bạn tham gia với vai trò Học viên.','Ms. Lan invited you as a Learner.'),'org'],
  ['sparkles','default',T('AI Tutor đã trả lời','AI Tutor replied'),T('“by” vs “until” — xem giải thích mới.','“by” vs “until” — see the new explanation.'),'tutor'],
];
/** Workspace (tenant) switcher — the ONLY brand/identity block in the sidebar (HeroUI Pro dashboard pattern) */
function tenantSwitcher(){
  const u=user(), t=TENANTS[S.tenant], open=S.navMenu==='tenant';
  const ctx = S.role==='content_admin' ? [['engrisk','Engrisk',T('Content team · Platform','Content team · Platform')]]
    : S.role==='teacher' ? [['sunrise','Sunrise English',T('Giáo viên · Tenant','Teacher · Tenant')],['engrisk','Engrisk',T('Cá nhân · Học viên','Personal · Learner')]]
    : [['engrisk','Engrisk',T('Cá nhân · Học viên','Personal · Learner')],...(!u.guest&&S.org.invite==='accepted'?[['sunrise','Sunrise English',T('Học viên · Phase 4','Learner · Phase 4')]]:[])];
  return `<div class="dropdown sidebar__switch-wrap" data-dropdown="1">
    <button type="button" class="sidebar__switch" data-action="navMenu" data-v="tenant" data-fk="nav:tenant" aria-haspopup="menu" aria-expanded="${open}" title="${esc(t.name)}">
      <span class="brand__mark" style="${S.tenant==='sunrise'?`background:${S.org.accent}`:''}">${t.mark}</span>
      <span class="grow sidebar__label" style="min-width:0"><span class="truncate" style="display:block;font-weight:700">${t.name}</span><span class="text-xs text-muted truncate" style="display:block">${(ctx.find(c=>c[0]===S.tenant)||[0,0,tx(t.sub)])[2]}</span></span>
      <span class="sidebar__label text-muted">${icon('chevrons-expand-vertical',14)}</span></button>
    ${open?`<div class="dropdown__menu sidebar__menu" role="menu" aria-label="${T('Ngữ cảnh học','Learning context')}"><div class="menu-head">${T('Ngữ cảnh học','Learning context')}</div>
      ${ctx.map(([id,n,r])=>`<button type="button" class="menu-item" role="menuitemradio" aria-checked="${S.tenant===id}" data-action="switchTenant" data-v="${id}"><span class="brand__mark" style="width:28px;height:28px;font-size:13px;${id==='sunrise'?`background:${S.org.accent}`:''}">${TENANTS[id].mark}</span><span class="grow"><span style="display:block;font-weight:500">${n}</span><span class="text-xs text-muted">${r}</span></span>${S.tenant===id?icon('check',14,'text-accent'):''}</button>`).join('')}
      ${u.guest?`<div class="menu-note">${T('Đăng nhập để tham gia lớp của trung tâm.','Sign in to join a learning center.')}</div>`:S.org.invite==='pending'?`<button type="button" class="menu-item" data-action="go" data-to="org">${icon('envelope')}<span class="grow">${T('Lời mời: Sunrise English','Invite: Sunrise English')}</span>${chip(T('Mới','New'),'accent',null,{size:'sm'})}</button>`:''}
      <div class="separator" style="margin:6px 0"></div>
      <button type="button" class="menu-item" data-action="go" data-to="org">${icon('office-badge')}<span class="grow">${T('Tổ chức của tôi','My organizations')}</span>${phase('P4')}</button></div>`:''}</div>`;
}
function userMenu(){
  const u=user(), open=S.navMenu==='user', dark=resolvedTheme()==='dark';
  return `<div class="dropdown sidebar__user-wrap" data-dropdown="1">
    <button type="button" class="sidebar__user" data-action="navMenu" data-v="user" data-fk="nav:user" aria-haspopup="menu" aria-expanded="${open}" title="${esc(u.name)}">${avatar(u.initials,{size:'sm'})}<span class="grow sidebar__label" style="min-width:0"><span class="truncate" style="display:block;font-weight:500">${u.name}</span><span class="truncate text-xs text-muted" style="display:block">${u.email||T('Chế độ khách','Guest mode')}</span></span><span class="sidebar__label text-muted">${icon('ellipsis',16)}</span></button>
    ${open?`<div class="dropdown__menu dropdown__menu--up sidebar__menu" role="menu" aria-label="${T('Tài khoản','Account')}">
      <button type="button" class="menu-item" data-action="go" data-to="profile">${icon('person')}<span class="grow">${T('Tài khoản & mục tiêu','Account & goals')}</span></button>
      <button type="button" class="menu-item" data-action="go" data-to="profile">${icon('palette')}<span class="grow">${T('Giao diện','Appearance')}</span><span class="toolbar__dots" aria-hidden="true" style="padding:2px">${PALETTES.map(p=>`<i class="menu-dot ${S.palette===p.id?'is-on':''}" style="background:${p.accent}"></i>`).join('')}</span></button>
      <div class="menu-item" role="menuitemcheckbox" aria-checked="${dark}">${icon('moon')}<span class="grow">${T('Chế độ tối','Dark mode')}</span>${switchEl(dark,'toggleDark',T('Chế độ tối','Dark mode'))}</div>
      <button type="button" class="menu-item" data-action="go" data-to="profile">${icon('globe')}<span class="grow">${T('Ngôn ngữ','Language')}</span><span class="text-xs text-muted">${LANGS.find(l=>l[0]===S.lang)[1]}</span></button>
      <button type="button" class="menu-item" data-action="noop">${icon('circle-question')}<span class="grow">${T('Trợ giúp & phản hồi','Help & feedback')}</span></button>
      <div class="separator" style="margin:6px 0"></div>
      ${u.guest?`<button type="button" class="menu-item" data-action="convert">${icon('person')}<span class="grow">${T('Tạo tài khoản','Create account')}</span></button>`:`<button type="button" class="menu-item" data-action="logout">${icon('arrow-right-from-square')}<span class="grow">${T('Đăng xuất','Sign out')}</span></button>`}</div>`:''}</div>`;
}
/** Sidebar footer card: only for guests (save-progress conversion). Signed-in learners see progress on Home/Tiến độ, not repeated here. */
function sidebarFooterCard(){
  if (!user().guest) return '';
  return `<div class="card sidebar__card" style="align-items:center;text-align:center">${mascot({mood:'wave',size:56})}<div class="card__title card__title--sm">${T('Lưu tiến độ của bạn','Save your progress')}</div><div class="text-xs text-muted">${T('Kết quả đã làm được giữ nguyên.','Your results are kept.')}</div>${btn(T('Tạo tài khoản','Create account'),{size:'sm',action:'convert',full:true})}</div>`;
}
function notifMenu(){
  const open=S.navMenu==='notif', items=NOTIFS().filter(n=>!(n[4]==='resume'&&!S.resume)&&!(n[4]==='org'&&S.org.invite!=='pending')&&!(user().guest&&n[4]!=='resume'));
  return `<div class="dropdown" data-dropdown="1">${`<button type="button" class="button button--ghost button--sm button--icon-only notif-btn" data-action="navMenu" data-v="notif" data-fk="nav:notif" aria-haspopup="menu" aria-expanded="${open}" aria-label="${T('Thông báo','Notifications')} (${items.length})" title="${T('Thông báo','Notifications')}">${icon('bell')}${items.length?`<span class="notif-dot" aria-hidden="true"></span>`:''}</button>`}
    ${open?`<div class="dropdown__menu notif-menu" role="menu" aria-label="${T('Thông báo','Notifications')}"><div class="menu-head row row--between">${T('Thông báo','Notifications')}<span class="text-xs text-muted">${items.length}</span></div>
      ${items.length?items.map(([ic,c,t,d,to])=>`<button type="button" class="menu-item" style="align-items:flex-start" data-action="${to==='resume'?'resume':'go'}" data-to="${to}">${tile(ic,c,'sm')}<span class="grow"><span style="display:block;font-weight:500">${t}</span><span class="text-xs text-muted">${d}</span></span></button>`).join('')
        :`<div class="menu-note">${T('Không có thông báo mới.','No new notifications.')}</div>`}
      <div class="menu-note">${T('Nhắc học tối đa 1 lần/ngày — chỉnh trong Tài khoản.','At most one study reminder a day — change in Account.')}</div></div>`:''}</div>`;
}
function desktopApp(scr,inner,{title,sub}={}){
  const cur=SCREENS[scr].nav, col=S.sideCollapsed, inProg=S.resume&&!S.exam, u=user();
  return `<div class="shell ${col?'is-collapsed':''}">
    <nav class="sidebar" aria-label="${T('Điều hướng chính','Main navigation')}">
      ${tenantSwitcher()}
      ${col?`<button type="button" class="sidebar__search" data-action="sideSearch" data-fk="nav:search" title="${T('Tìm đề, Part, dạng câu','Search tests, parts, types')}" aria-label="${T('Tìm đề','Search tests')}">${icon('magnifier')}</button>`
        :`<label class="sidebar__search">${icon('magnifier')}<input id="side-q" class="grow" data-input="sideQ" value="${esc(S.catalog.q)}" placeholder="${T('Tìm đề, Part, dạng câu…','Search tests, parts, types…')}" aria-label="${T('Tìm đề','Search tests')}" autocomplete="off">${S.catalog.q?`<button type="button" class="sidebar__clear" data-action="resetFilters" aria-label="${T('Xóa tìm kiếm','Clear search')}">${icon('xmark',12)}</button>`:kbd('/')}</label>`}
      <div class="sidebar__section">${T('Học tập','Learn')}</div>${NAV_LEARN().map(([id,i,l])=>navItem(id,i,l,cur,id==='catalog'&&inProg?`<span class="sidebar__badge" title="${T('Có bài đang làm dở','Test in progress')}"></span>`:'')).join('')}
      ${u.staff?`<div class="sidebar__section">${T('Nội dung','Content')}</div>${NAV_CONTENT().map(([id,i,l])=>navItem(id,i,l,cur,id==='moderation'&&reviewCount()?`<span class="sidebar__label sidebar__end">${chip(String(reviewCount()),'accent',null,{size:'sm'})}</span>`:'')).join('')}`
        :`<div class="sidebar__section">${T('Thư viện','Library')}</div>${navItem('library','folder',T('Tài liệu của tôi','My materials'),cur,`<span class="sidebar__label sidebar__end">${phase('P3')}</span>`)}${u.guest?'':navItem('contribute','square-plus',T('Đóng góp đề','Contribute'),cur)}`}
      <div class="grow"></div>
      <div class="sidebar__label">${sidebarFooterCard()}</div>
      ${userMenu()}
    </nav>
    <div class="main">
      <header class="navbar">${btn('',{v:'ghost',size:'sm',ic:col?'layout-side-content':'layout-side-content-left',action:'toggleSide',aria:col?T('Mở thanh bên','Expand sidebar'):T('Thu gọn thanh bên','Collapse sidebar')})}<div class="navbar__title"><h1 class="page-title truncate">${title}</h1>${sub?`<span class="text-sm text-muted truncate">${sub}</span>`:''}</div>
        ${langPicker('navbar')}${notifMenu()}${scr!=='catalog'&&!['studio','moderation'].includes(cur)?btn(T('Luyện nhanh','Quick practice'),{size:'sm',ic:'thunderbolt',action:'quick'}):''}</header>
      <div class="page" data-scroll="content"><div class="page__inner ${['studio','moderation'].includes(cur)?'page__inner--wide':''}">${inner}</div></div>
    </div></div>`;
}
function mobileApp(scr,inner,{title,sub,back,sticky,large}={}){
  const cur=SCREENS[scr].nav;
  const head = large
    ? `<header class="m-largetitle"><div class="m-largetitle__bar">${brand()}<div class="row gap-1">${langPicker('m-top')}${notifMenu()}</div></div><h1 class="m-largetitle__title">${title}</h1>${sub?`<p class="text-muted" style="margin-top:2px">${sub}</p>`:''}</header>`
    : `<header class="m-appbar">${back?btn('',{v:'ghost',ic:'chevron-left',action:'back',aria:T('Quay lại','Back')}):'<span></span>'}<div class="m-appbar__title truncate">${title}</div><span></span></header>`;
  return `<div class="m-shell">${head}<div class="m-content" data-scroll="content">${inner}</div>
    ${sticky?`<div class="m-sticky">${sticky}</div>`:`<nav class="tabbar" aria-label="${T('Điều hướng chính','Main navigation')}">${MNAV().map(([id,i,l])=>`<button type="button" class="tabbar__item" data-action="go" data-to="${id}" data-fk="tab:${id}" ${cur===id||(id==='profile'&&['library','org','contribute','studio','moderation'].includes(cur))?'aria-current="page"':''}>${icon(i,22)}<span>${l}</span></button>`).join('')}</nav>`}</div>`;
}
function publicShell(inner){
  if (isM()) return `<div class="m-shell"><header class="m-appbar" style="grid-template-columns:1fr auto;padding:0 12px 0 16px">${brand()}<div class="row gap-1">${langPicker('pub-m')}${S.screen==='landing'?btn(T('Đăng nhập','Sign in'),{v:'tertiary',size:'sm',action:'go',data:{to:'auth'}}):btn('',{v:'ghost',ic:'xmark',action:'go',data:{to:'landing'},aria:T('Đóng','Close')})}</div></header><div class="m-content" data-scroll="content">${inner}</div></div>`;
  const full = S.screen==='auth';
  return `<div class="main" style="height:100%"><div class="page" data-scroll="content"><header class="pub-nav">${brand()}<button type="button" class="link" data-action="go" data-to="catalog">${T('Luyện thi','Practice')}</button><button type="button" class="link" data-action="go" data-to="org">${T('Dành cho tổ chức','For organizations')} ${phase('P4')}</button><div class="grow"></div>${langPicker('pub')}${btn(T('Đăng nhập','Sign in'),{v:'ghost',action:'go',data:{to:'auth'}})}${btn(T('Đăng ký miễn phí','Sign up free'),{action:'signupTab'})}</header>${full?inner:`<div class="page__inner" style="max-width:${S.screen==='landing'?1120:480}px">${inner}</div>`}</div></div>`;
}

/* ---------- Overlays ---------- */
function overlays(){
  let html=''; const M=S.modal;
  const dlg = (inner,{role='dialog',ic,color='accent'}={}) => `<div class="modal__backdrop" data-action="overlayClose"><div class="modal__dialog" role="${role}" aria-modal="true" aria-labelledby="dlg-title" data-stop="1"><div class="bottom-sheet__handle"></div>${ic?`<span class="modal__icon" style="background:var(--${color}-soft);color:var(--${color}-soft-foreground)">${icon(ic,18)}</span>`:''}${inner}</div></div>`;
  if (M){
    if (M.type==='submit'){
      const E=S.exam, un=E.qids.filter(id=>isBlank(E.answers[id])), fl=E.qids.filter(id=>E.flags[id]);
      const byPart=[...new Set(E.qids.map(id=>Q[id].part))].map(p=>{ const ids=E.qids.filter(id=>Q[id].part===p); return [p,ids.filter(id=>!isBlank(E.answers[id])).length,ids.length]; });
      const jump = (ids,cls) => `<div class="row row--wrap gap-1">${ids.map(id=>{ const pi=E.pages.findIndex(pg=>pg.qids.includes(id)); return `<button type="button" class="qbtn ${cls}" style="min-width:40px;padding:0 6px" data-action="qJump" data-q="${id}" data-close="1" ${pageAllowed(E,pi)?'':'disabled'}>${numLabel(Q[id])}</button>`; }).join('')}</div>`;
      const lateL = E.sections&&E.sec==='L';
      html+=dlg(`<div class="modal__heading" id="dlg-title">${T('Nộp bài?','Submit your answers?')}</div>
        <div class="grid grid-3" style="gap:8px">${[[answeredCount(),T('Đã trả lời','Answered'),'accent'],[un.length,T('Bỏ trống','Blank'),''],[fl.length,T('Đánh dấu','Flagged'),'warning']].map(([n,l,c])=>`<div class="card card--secondary" style="padding:12px;gap:2px;align-items:center"><span class="text-2xl font-semibold tnum ${c?'text-'+c:''}">${n}</span><span class="text-xs text-muted">${l}</span></div>`).join('')}</div>
        <div class="submit-parts">${byPart.map(([p,a,n])=>`<div class="row row--between text-sm"><span>${partLabel(p)}</span><span class="tnum ${a<n?'text-warning':'text-success'}">${a}/${n}</span></div>`).join('')}</div>
        ${fl.length?`<div class="col gap-2"><span class="text-xs text-muted">${T('Câu đã đánh dấu:','Flagged:')}</span>${jump(fl,'is-flagged')}</div>`:''}
        ${un.length?`<div class="col gap-2"><span class="text-xs text-muted">${T('Câu chưa trả lời — chọn để quay lại:','Unanswered — tap to go back:')}</span>${jump(un,'')}</div>`:''}
        ${lateL?alertBox('warning',T('Bạn đang ở phần Listening','You are still in Listening'),T('Nộp bây giờ sẽ kết thúc cả bài, gồm phần Reading chưa làm.','Submitting now ends the whole test, including the unstarted Reading section.'),'',{flat:true}):''}
        <div class="modal__body">${E.mode==='mock'?T('Sau khi nộp bạn không thể sửa đáp án. Câu bỏ trống tính là sai — không bị trừ điểm khi đoán.','You can’t change answers after submitting. Blanks count as wrong — guessing is never penalised.'):T('Các câu chưa kiểm tra sẽ được chấm khi nộp.','Unchecked questions will be graded on submit.')}</div>
        <div class="modal__footer">${btn(T('Làm tiếp','Keep going'),{v:'tertiary',action:'closeModal'})}${btn(T('Nộp bài','Submit'),{action:'confirmSubmit',ic:'paper-plane'})}</div>`,{ic:'paper-plane'});
    }
    if (M.type==='section') html+=`<div class="modal__backdrop"><div class="modal__dialog" role="dialog" aria-labelledby="dlg-title" style="align-items:center;text-align:center">${tile('book-open','accent','lg')}<div class="modal__heading" id="dlg-title">${T('Phần Listening đã kết thúc','Listening has ended')}</div><div class="modal__body">${T('Phần Reading (Part 5–7) bắt đầu ngay, 75 phút. Bạn không thể quay lại phần Listening.','Reading (Parts 5–7) starts now, 75 minutes. You can’t return to Listening.')}</div>${btn(T('Bắt đầu Reading','Start Reading'),{action:'nextSection',iconR:'arrow-right'})}</div></div>`;
    if (M.type==='grading') html+=`<div class="modal__backdrop"><div class="modal__dialog" role="dialog" aria-labelledby="dlg-title" style="align-items:center;text-align:center;max-width:320px">${mascot({mood:'think',size:90})}<span class="spinner">${SPIN}</span><div class="modal__heading" id="dlg-title">${T('Đang chấm bài…','Grading…')}</div><div class="modal__body">${T('Chấm tự động theo đáp án đã kiểm duyệt.','Graded against verified answer keys.')}</div></div></div>`;
    if (M.type==='exit') html+=dlg(`<div class="modal__heading" id="dlg-title">${T('Lưu và thoát?','Save and exit?')}</div><div class="modal__body">${S.exam&&S.exam.mode==='mock'?T('Đáp án đã được lưu. <b style="color:var(--foreground)">Đồng hồ thi thử vẫn tiếp tục chạy</b> — quay lại trước khi hết giờ, nếu không bài sẽ tự nộp.','Your answers are saved. <b style="color:var(--foreground)">The mock-test timer keeps running</b> — come back before time runs out or it will auto-submit.'):T('Đáp án đã được lưu. Bài luyện tập được tạm dừng.','Your answers are saved. Practice is paused.')}</div><div class="modal__footer">${btn(T('Ở lại','Stay'),{v:'tertiary',action:'closeModal'})}${btn(T('Lưu & thoát','Save & exit'),{action:'confirmExit'})}</div>`,{ic:'bookmark',color:S.exam&&S.exam.mode==='mock'?'warning':'accent'});
    if (M.type==='writingSubmit'){ const wc=words(S.writing.text), target=S.writing.mobileMode==='intro'?50:250;
      html+=dlg(`<div class="modal__heading" id="dlg-title">${T('Nộp bài viết?','Submit your essay?')}</div>${wc<target?alertBox('warning',T(`Bài có ${wc} từ, dưới yêu cầu ${target} từ`,`${wc} words — below the ${target}-word minimum`),T('Bài thi thật sẽ bị trừ điểm Task Response. Bạn vẫn có thể nộp để nhận nhận xét.','The real exam would lower Task Response. You can still submit for feedback.'),'',{flat:true}):`<div class="modal__body">${wc} ${T('từ. AI sẽ chấm ước tính theo 4 tiêu chí.','words. AI will estimate a band on 4 criteria.')}</div>`}<div class="modal__footer">${btn(T('Viết tiếp','Keep writing'),{v:'tertiary',action:'closeModal'})}${btn(T('Nộp bài','Submit'),{action:'writingConfirm',ic:'paper-plane'})}</div>`,{ic:'pencil'}); }
    if (M.type==='delete') html+=dlg(`<div class="modal__heading" id="dlg-title">${T('Xóa tài khoản?','Delete account?')}</div><div class="modal__body">${T('Thông tin cá nhân, tài liệu và phương thức đăng nhập sẽ bị xóa. Kết quả học tập được ẩn danh hóa. Không thể hoàn tác.','Personal info, uploads and sign-in methods will be deleted. Learning results are anonymized. This can’t be undone.')}</div><div class="modal__footer">${btn(T('Hủy','Cancel'),{v:'tertiary',action:'closeModal'})}${btn(T('Xóa vĩnh viễn','Delete permanently'),{v:'danger',action:'confirmDelete'})}</div>`,{role:'alertdialog',ic:'trash-bin',color:'danger'});
  }
  if (S.sheet==='qnav'&&S.exam) html+=`<div class="modal__backdrop" data-action="overlayClose"><div class="modal__dialog" role="dialog" aria-modal="true" aria-labelledby="dlg-title" data-stop="1" style="max-height:80%;overflow:auto"><div class="bottom-sheet__handle"></div><div class="row row--between"><div class="modal__heading" id="dlg-title">${T('Phiếu trả lời','Answer sheet')}</div><span class="text-sm text-muted tnum">${answeredCount()}/${S.exam.qids.length}</span></div>${answerSheet()}<div class="modal__footer">${btn(T('Đóng','Close'),{v:'tertiary',action:'closeModal'})}${btn(T('Nộp bài','Submit'),{action:'openSubmit',ic:'paper-plane'})}</div></div></div>`;
  if (S.toasts.length) html+=`<div class="toast-region">${S.toasts.map(t=>`<div class="toast" role="status" data-id="${t.id}">${icon(t.color==='success'?'circle-check-fill':t.color==='warning'?'triangle-exclamation':'circle-info',16,t.color==='success'?'text-success':t.color==='warning'?'text-warning':'text-accent')}<div class="grow"><div class="font-medium">${t.title}</div>${t.desc?`<div class="text-xs text-muted">${t.desc}</div>`:''}</div>${t.undo&&S.lib.undo?`<button type="button" class="button button--secondary button--sm" data-undo="1">${T('Hoàn tác','Undo')}</button>`:''}</div>`).join('')}</div>`;
  return html;
}

/* ---------- Composition ---------- */
const TITLES = () => ({catalog:T('Luyện đề','Practice tests'),'exam-intro':T('Thiết lập bài làm','Test setup'),results:T('Kết quả','Results'),review:T('Xem lại đáp án','Review answers'),tutor:'AI Tutor',library:T('Tài liệu của tôi','My materials'),progress:T('Tiến độ','Progress'),profile:T('Tài khoản','Account'),org:T('Tổ chức','Organization'),
  contribute:T('Đóng góp đề','Contribute'),studio:'Content Studio','studio-editor':studioEditorTitle(),'studio-import':T('Nhập gói đề','Import package'),moderation:T('Kiểm duyệt','Review queue')});
const RENDER = {landing:rLanding,auth:rAuth,onboarding:rOnboarding,home:rHome,catalog:rCatalog,'exam-intro':rIntro,exam:rExam,writing:rWriting,speaking:rSpeaking,results:rResults,review:rReview,tutor:rTutor,library:rLibrary,progress:rProgress,profile:rProfile,org:rOrg,
  contribute:rContribute,studio:rStudio,'studio-editor':rStudioEditor,'studio-import':rStudioImport,moderation:rModeration};
function screenHtml(){
  const scr=S.screen, def=SCREENS[scr], inner=RENDER[scr]();
  if (def.chrome==='focus') return inner;
  if (def.chrome==='public') return publicShell(inner);
  const u=user(), titles=TITLES();
  const home = {title:`${greetingText()}, ${esc(u.first)}`, sub:u.guest?T('Luyện thử miễn phí — không cần đăng ký','Free practice — no sign-up needed'):S.persona==='returning'?`${fmtLongDate('2026-10-27')} · ${T('Mục tiêu TOEIC 750','Goal: TOEIC 750')}`:T('Bắt đầu hành trình luyện thi của bạn','Start your exam journey')};
  if (isM()){
    const top=['home','catalog','tutor','progress','profile'].includes(scr);
    return mobileApp(scr,inner,{title:scr==='home'?`${T('Chào','Hi')} ${esc(u.first)}`:titles[scr],sub:scr==='home'?home.sub:null,back:!top,large:top,sticky:scr==='exam-intro'?introCta():''});
  }
  return desktopApp(scr,inner,scr==='home'?home:{title:titles[scr]});
}
const urlFor = () => { const d=SCREENS[S.screen]; return `/${S.lang}`+d.url.replace(':slug',(S.setup&&S.setup.examId)||S.introExam).replace(':id','att_7f3c').replace(':conversationId','conv_19a2').replace(':n',String((S.review.idx||0)+1)).replace(':draftId',(S.studio.ed&&S.studio.ed.id)||'new').replace('/:submissionId',S.contrib.sel?'/'+S.contrib.sel:''); };
function frameHtml(){
  if (S.screen==='design-system') return rDesignSystem();
  const style = S.tenant==='sunrise'?`style="--accent:${S.org.accent};--accent-foreground:var(--snow);--focus:${S.org.accent}"`:'';
  const app = `<div class="app ${isM()?'is-mobile':''}" data-tenant="${S.tenant}" ${style}>${isM()?`<div class="m-status" aria-hidden="true"><span>9:41</span><span class="m-status__icons"><i></i><i></i></span></div>`:''}<div class="app__body" ${S._enter?'data-enter':''}>${screenHtml()}</div>${overlays()}</div>`;
  if (isM()) return `<div class="m-frame" aria-label="Mobile preview (HeroUI Native)"><div class="m-screen"><div class="m-island" aria-hidden="true"></div>${app}<div class="m-home" aria-hidden="true"></div></div></div>`;
  return `<div class="d-frame" aria-label="Web preview (HeroUI)"><div class="d-browser" aria-hidden="true"><i></i><i></i><i></i><div class="d-url">${icon('lock',11)}${S.tenant==='sunrise'?'sunrise.engrisk.app':'app.engrisk.vn'}${esc(urlFor())}</div></div>${app}</div>`;
}
function toolbarHtml(){
  const ds=S.screen==='design-system';
  return `${ds?'':`<span class="label">Thiết bị</span>${tabs('Thiết bị',[['desktop','Web','display'],['mobile','Mobile','smartphone']],S.device,'device',{size:'sm'})}
    <span class="label">Người dùng</span>${tabs('Persona',[['guest','Khách'],['new','Người mới'],['returning','Đã học']],S.persona,'persona',{size:'sm'})}
    <span class="label">Vai trò</span>${tabs('Vai trò',[['learner','Học viên'],['teacher','Giáo viên'],['content_admin','Content admin']],S.role,'role',{size:'sm'})}`}
    <span class="label">Ngôn ngữ</span>${tabs('Ngôn ngữ',[['vi','VI'],['en','EN']],S.lang,'setLang',{size:'sm'})}
    <span class="label">Preset</span><div class="toolbar__dots" role="radiogroup" aria-label="HeroUI preset">${PALETTES.map(p=>`<button type="button" class="toolbar__dot" role="radio" aria-checked="${S.palette===p.id}" title="${p.name}" aria-label="${p.name}" data-action="setPalette" data-v="${p.id}" data-fk="tb-pal:${p.id}" style="background:${p.accent}"></button>`).join('')}</div>
    ${tabs('Chế độ',[['light','','sun'],['dark','','moon'],['system','','display']],S.mode,'setMode',{size:'sm'})}
    <span class="label">Tenant</span>${tabs('Tenant',[['engrisk','Engrisk'],['sunrise','Sunrise · P4']],S.tenant,'tenantTb',{size:'sm'})}
    <div class="grow"></div>${ds?btn('Quay lại prototype',{v:'tertiary',size:'sm',ic:'arrow-left',action:'jump',data:{to:S.hist.filter(h=>h!=='design-system').pop()||'landing'}}):btn('Theme & Components',{v:'secondary',size:'sm',ic:'palette',action:'jump',data:{to:'design-system'}})}${btn('',{v:'ghost',size:'sm',ic:'arrows-rotate-right',action:'resetAll',aria:'Đặt lại prototype'})}`;
}
function reviewHtml(){
  const def=SCREENS[S.screen], cur=viewState(S.screen);
  const groups = Object.entries(JOURNEYS).map(([j,n])=>`<div class="review__group"><h4>${j} · ${n}</h4>${Object.entries(SCREENS).filter(([,d])=>d.j===j).map(([id,d])=>`<button type="button" class="review__link" data-action="jump" data-to="${id}" data-fk="jump:${id}" ${S.screen===id?'aria-current="page"':''}><span class="truncate">${d.name}</span><span class="row gap-1 shrink-0"><code>${id}</code>${d.phase!=='—'?phase(d.phase):''}</span></button>`).join('')}</div>`).join('');
  const demo = {exam:S.exam&&!S.exam.submitted?`<div class="row row--wrap gap-1">${S.exam.track?btn('Tua audio tới cuối phần nghe',{v:'tertiary',size:'sm',ic:'stopwatch',action:'ff'}):S.exam.remaining!=null?btn('Tua tới 15 giây cuối',{v:'tertiary',size:'sm',ic:'stopwatch',action:'ff'}):''}${btn('TOEIC thi thử',{v:'ghost',size:'sm',action:'demoStart',data:{id:'toeic-test-01',m:'mock'}})}${btn('TOEIC luyện tập',{v:'ghost',size:'sm',action:'demoStart',data:{id:'toeic-test-01',m:'practice'}})}${btn('IELTS Reading',{v:'ghost',size:'sm',action:'demoStart',data:{id:'ielts-r-test-01',m:'mock'}})}${btn('IELTS Listening',{v:'ghost',size:'sm',action:'demoStart',data:{id:'ielts-l-test-01',m:'mock'}})}</div>`:'',speaking:btn('Đặt lại Speaking',{v:'tertiary',size:'sm',ic:'arrow-rotate-left',action:'spkReset'}),writing:btn('Đặt lại Writing',{v:'tertiary',size:'sm',ic:'arrow-rotate-left',action:'writingReset'}),library:btn('Đặt lại Tài liệu',{v:'tertiary',size:'sm',ic:'arrow-rotate-left',action:'libReset'}),org:btn('Đặt lại lời mời',{v:'tertiary',size:'sm',ic:'arrow-rotate-left',action:'invite',data:{v:'pending'}}),landing:btn('Hiện lại gợi ý ngôn ngữ',{v:'tertiary',size:'sm',ic:'globe',action:'resetLangSuggest'}),results:`<div class="row row--wrap gap-1">${btn('Kết quả TOEIC',{v:'ghost',size:'sm',action:'demoResult',data:{id:'toeic-test-01'}})}${btn('Kết quả IELTS Reading',{v:'ghost',size:'sm',action:'demoResult',data:{id:'ielts-r-test-01'}})}${btn('Kết quả IELTS Listening',{v:'ghost',size:'sm',action:'demoResult',data:{id:'ielts-l-test-01'}})}</div>`}[S.screen]||'';
  return `<div class="review__head"><div class="row row--between"><div class="row gap-2"><span class="brand__mark" style="width:24px;height:24px;font-size:12px;border-radius:7px">E</span><span class="font-semibold">UX Preview</span></div>${chip('Prototype','warning',null,{size:'sm'})}</div><p class="text-xs text-muted">Theme = HeroUI Theme Builder presets · dữ liệu giả lập, không backend. Màn khớp <code>product_flow.md §E</code>, quy tắc ở <code>ux_spec.md</code>.</p></div>
    <div class="review__info" aria-live="polite"><div class="row row--between"><b>${def.name}</b>${def.phase!=='—'?phase(def.phase):''}</div><div><code>${esc(S.screen)}</code> · <span class="text-muted">${def.url}</span></div><div class="text-muted">${def.purpose}</div>
      ${def.data.length?`<div class="col gap-1"><span class="text-xs font-medium text-muted">Dữ liệu (schema.dbml)</span><div class="row row--wrap gap-1">${def.data.map(d=>`<span class="chip chip--default chip--sm" style="font-family:var(--font-mono);font-size:11px;background:var(--surface)">${d}</span>`).join('')}</div></div>`:''}
      ${def.states.length>1?`<div class="col gap-1"><span class="text-xs font-medium text-muted">Trạng thái màn hình</span>${tabs('Trạng thái',def.states.map(s=>[s,{default:'Mặc định',loading:'Tải',empty:'Trống',error:'Lỗi',quota:'Hết lượt'}[s]]),cur,'setState',{size:'sm'})}</div>`:''}${demo?`<div>${demo}</div>`:''}</div>
    <nav aria-label="Danh sách màn hình">${groups}</nav><div style="padding:12px 16px 24px" class="text-xs text-muted">Phím tắt phòng thi (Web): ${kbd('A')}–${kbd('D')} chọn, ${kbd('←')}${kbd('→')} trang/câu, ${kbd('F')} đánh dấu, ${kbd('Space')} phát/dừng audio (luyện tập). Bôi đen văn bản để highlight/ghi chú.</div>`;
}

/* ---------- Render: scroll/focus preservation, theme, motion ---------- */
let lastScreen=null, lastOverlay='';
const seenToasts=new Set();
function applyTheme(){ const h=document.documentElement; h.dataset.theme=resolvedTheme(); h.dataset.palette=S.palette; h.lang=S.lang; }
function countUp(){
  if (matchMedia('(prefers-reduced-motion: reduce)').matches) return;
  document.querySelectorAll('[data-enter] [data-count]').forEach(el=>{ const to=+el.dataset.count, t0=performance.now(), dur=900;
    const step=now=>{ const p=Math.min(1,(now-t0)/dur), e=1-Math.pow(1-p,4); el.textContent=fmtNum(Math.round(to*e)); if(p<1) requestAnimationFrame(step); }; el.textContent='0'; requestAnimationFrame(step); });
}
function confetti(){
  if (matchMedia('(prefers-reduced-motion: reduce)').matches) return;
  const host=document.querySelector('.app'); if(!host) return;
  const colors=['var(--sw-yellow)','var(--sw-pink)','var(--sw-green)','var(--sw-blue)','var(--sw-purple)','var(--sw-orange)'];
  const box=document.createElement('div'); box.className='confetti';
  box.innerHTML=Array.from({length:36},(_,i)=>`<i style="left:${(i*37)%100}%;background:${colors[i%6]};animation-delay:${(i%9)*60}ms;transform:rotate(${i*23}deg)"></i>`).join('');
  host.appendChild(box); setTimeout(()=>box.remove(),2200);
}
function render(screenChanged){
  S._enter=!!screenChanged;
  const keep={}; document.querySelectorAll('[data-scroll]').forEach(el=>keep[el.dataset.scroll]=el.scrollTop);
  const vp=document.getElementById('viewport'), vpTop=vp.scrollTop;
  const ae=document.activeElement, fk=ae&&ae.dataset?ae.dataset.fk:null, fid=ae&&ae.id, sel=ae&&ae.selectionStart;
  applyTheme();
  document.getElementById('toolbar').innerHTML=toolbarHtml();
  document.getElementById('review').innerHTML=reviewHtml();
  vp.classList.toggle('viewport--doc',S.screen==='design-system');
  vp.innerHTML=frameHtml();
  const same=!screenChanged&&lastScreen===S.screen;
  if (same){ document.querySelectorAll('[data-scroll]').forEach(el=>{ if(keep[el.dataset.scroll]!=null) el.scrollTop=keep[el.dataset.scroll]; }); vp.scrollTop=vpTop; }
  else if (S.screen==='design-system') vp.scrollTop=0;
  const entered = screenChanged && lastScreen!==S.screen;
  lastScreen=S.screen;
  const ov=(S.modal&&S.modal.type)||S.sheet||'';
  if (ov&&ov===lastOverlay) document.querySelectorAll('.modal__backdrop,.modal__dialog').forEach(e=>e.style.animation='none');
  lastOverlay=ov;
  document.querySelectorAll('.toast[data-id]').forEach(e=>{ if(seenToasts.has(e.dataset.id)) e.style.animation='none'; else seenToasts.add(e.dataset.id); });
  if (screenChanged) countUp();
  if (entered && S.screen==='results' && S.result && S.result.raw/S.result.n>=.6) confetti();
  let target=fid?document.getElementById(fid):null;
  if (!target&&fk) target=document.querySelector(`[data-fk="${CSS.escape(fk)}"]`);
  if (target&&!target.disabled){ target.focus({preventScroll:true}); if(sel!=null&&target.setSelectionRange) try{target.setSelectionRange(sel,sel);}catch(e){} }
  const modal=document.querySelector('.modal__dialog[data-stop]'); if (modal&&!modal.contains(document.activeElement)){ const b=modal.querySelector('button:not([disabled])'); if(b) b.focus({preventScroll:true}); }
  S.just=null; S.justChecked=null;
}
function themeSwitch(fn){ document.body.classList.add('theming'); fn(); render(); setTimeout(()=>document.body.classList.remove('theming'),450); }

/* ---------- Actions ---------- */
function startExam(id,cfg){
  const ex=EXAMS[id]; if(!ex) return;
  if (ex.screen==='writing'){ S.writing=null; go('writing'); return; }
  if (ex.screen==='speaking'){ S.speaking=null; go('speaking'); return; }
  if (ex.tier==='registered'&&user().guest){ S.setup=setupFor(id); S.introExam=id; go('exam-intro'); return; }
  S.exam=newAttempt(id,cfg||{}); S.result=null; S.states.exam=null; S.pPop=null; go('exam');
}
/** Move focus to a question (switching page if allowed) and bring it into view */
function focusQ(qid){
  const E=S.exam, pi=E.pages.findIndex(p=>p.qids.includes(qid)); if(!pageAllowed(E,pi)) return;
  E.focus=qid; const turned=pi!==E.page; if(turned){ E.page=pi; E.mTab='q'; E.showEv=null; } render(turned);
  requestAnimationFrame(()=>{ const el=document.getElementById('gap-'+qid)||document.getElementById('tq-'+qid)||document.getElementById('iq-'+qid); if(!el) return; el.scrollIntoView({block:'nearest',behavior:'smooth'}); if(el.matches('input')) el.focus({preventScroll:true}); });
}
function assignHeading(qid,k){ const E=S.exam; Object.keys(E.answers).forEach(id=>{ if(id!==qid&&Q[id].set===Q[qid].set&&E.answers[id]===k) E.answers[id]=null; }); setAnswer(qid,k); }
function setAnswer(qid,val){
  const E=S.exam; if(!E) return; E.answers[qid]=val; E.save='saving';
  const b=document.getElementById('save-badge'); if(b) b.innerHTML=saveBadge();
  clearTimeout(setAnswer.t); setAnswer.t=setTimeout(()=>{ if(!S.exam) return; S.exam.save='saved'; const b2=document.getElementById('save-badge'); if(b2) b2.innerHTML=saveBadge(); },600);
}
function submitExam(reason){
  const E=S.exam; if(!E||E.submitted) return; E.submitted=true; S.modal={type:'grading'}; S.sheet=null; S.pPop=null; render();
  setTimeout(()=>{
    const secs=Object.values(E.time).reduce((a,b)=>a+b,0)||E.elapsed;
    S.result=buildResult(E.examId,E.qids,E.answers,E.flags,E.mode,reason,{time:E.time,hl:E.hl,notes:E.notes,cfg:{parts:E.parts,tools:E.tools},seconds:secs}); S.modal=null;
    if (S.resume&&S.resume.examId===E.examId) S.resume=null;
    const R=S.result;
    S.extraHistory.unshift({date:'today',exam:E.examId,mode:E.mode,status:'completed',score:R.total!=null?String(R.total):R.band!=null&&E.mode==='mock'?'Band '+R.band.toFixed(1):rawLabel(R),est:R.total!=null||R.band!=null,mins:Math.max(1,Math.round(secs/60))});
    S.exam=null; S.resultFilter='all'; S.review={idx:0,onlyWrong:true};
    go('results');
    if (reason==='time_expired') toast(T('Hết giờ — bài đã được nộp tự động','Time’s up — submitted automatically'),T('Các câu đã trả lời được chấm bình thường.','Answered questions were graded as usual.'),'warning');
  },900);
}
function personaApply(p){
  S.persona=p; S.states={}; S.extraHistory=[];
  S.resume = p==='returning'?initial().resume:null;
  S.lib=initial().lib; if (p!=='returning') S.lib.materials=[];
  S.tutor=initial().tutor;
  if (p==='guest'){ S.role='learner'; if(S.tenant!=='engrisk') S.tenant='engrisk'; }
}
/** Prototype role switch: staff roles imply a signed-in account and their home tenant. */
function roleApply(r){
  S.role=r; S.navMenu=null; if (S.persona!=='returning') personaApply('returning');
  if (r==='teacher') S.org.invite='accepted';
  S.tenant=ROLES[r].tenant; S.studio=studioInitial();
  const nav=SCREENS[S.screen].nav;
  if (r==='learner'&&['studio','moderation'].includes(nav)) S.screen='home';
  if (r!=='learner'&&nav==='contribute') S.screen='studio';
}
const A = {
  device:d=>{S.device=d.v;render(true);},
  setMode:d=>themeSwitch(()=>{S.mode=d.v;}),
  setPalette:d=>themeSwitch(()=>{S.palette=d.v;}),
  setLang:d=>{ if(!LANGS.find(l=>l[0]===d.v&&l[3])) return; S.lang=d.v; S.langMenu=null; S.langSuggestDone=true; render(); toast(d.v==='en'?'Language set to English':'Đã chuyển sang Tiếng Việt',d.v==='en'?'Exam content stays in English.':'Nội dung đề thi vẫn bằng tiếng Anh.','info'); },
  langMenu:d=>{ S.langMenu = S.langMenu===d.p?null:d.p; render(); },
  dismissLangSuggest:()=>{ S.langSuggestDone=true; render(); },
  resetLangSuggest:()=>{ S.langSuggestDone=false; render(); },
  persona:d=>{personaApply(d.v); if(d.v==='guest'&&!['landing','catalog','exam','results','review','auth','exam-intro','design-system'].includes(S.screen)) S.screen='landing'; render(true);},
  role:d=>themeSwitch(()=>roleApply(d.v)),
  tenantTb:d=>{ if(d.v==='sunrise'){ if(user().guest){toast(T('Khách không thuộc tổ chức nào','Guests don’t belong to organizations'),T('Chọn persona “Đã học” để xem.','Switch persona to “Đã học” to view.'),'warning');return;} S.org.invite='accepted'; } themeSwitch(()=>{S.tenant=d.v;}); },
  resetAll:()=>{ const keep={device:S.device,mode:S.mode,palette:S.palette,lang:S.lang}; S=initial(); Object.assign(S,keep); render(true); },
  jump:d=>{ const nav=SCREENS[d.to].nav;
    if (['studio','moderation'].includes(nav)&&S.role==='learner') roleApply('content_admin');
    if (nav==='contribute'&&(S.role!=='learner'||S.persona==='guest')){ roleApply('learner'); }
    if(d.to==='exam'&&!S.exam) S.exam=S.resume&&S.persona==='returning'?JSON.parse(JSON.stringify(S.resume)):newAttempt('toeic-test-01'); if(d.to==='exam-intro'&&!S.setup) S.setup=setupFor(S.introExam); go(d.to); },
  go:d=>{ if(d.to==='exam'&&!S.exam) S.exam=newAttempt('toeic-test-01'); go(d.to); },
  back:()=>{ let p=S.hist.pop(); while(p==='design-system') p=S.hist.pop(); S.screen=p||'home'; S.modal=null; render(true); },
  setState:d=>{ S.states[S.screen]=d.s==='default'?null:d.s; render(true); },
  noop:()=>toast(T('Chỉ minh họa','Illustration only'),T('Hành động này không được mô phỏng trong prototype.','This action isn’t simulated in the prototype.'),'info'),
  quick:()=>{ if(S.screen==='landing'||S.screen==='auth') personaApply('guest'); startExam('toeic-r-part5'); },
  convert:()=>{ S.auth.convert=true; S.auth.tab='signup'; go('auth'); },
  signupTab:()=>{ S.auth.tab='signup'; S.auth.convert=false; go('auth'); },
  pickTrack:d=>{ S.catalog.track=d.v; S.catalog.skill=null; go('catalog'); },
  authTab:d=>{S.auth.tab=d.v;S.auth.resetSent=false;S.states.auth=null;render();},
  togglePw:()=>{S.auth.showPw=!S.auth.showPw;render();},
  forgot:()=>{S.auth.resetSent=true;render();},
  google:()=>finishAuth('google'), authSubmit:()=>finishAuth('password'),
  onbPick:d=>{ S.onb[d.k]=d.v; if(d.k==='exam') S.onb.target=null; render(); },
  onbNext:()=>{S.onb.step++;render(true);}, onbBack:()=>{S.onb.step--;render(true);},
  onbSkip:()=>{ toast(T('Đã bỏ qua','Skipped'),T('Bạn có thể đặt mục tiêu sau trong Tài khoản.','You can set a goal later in Account.'),'info'); go('home'); },
  onbFinish:()=>{ toast(T('Đã lưu mục tiêu','Goal saved'),T('Gợi ý bài luyện đã được cá nhân hóa.','Suggestions are now personalized.')); go('home'); },
  editGoal:()=>{ S.onb.step=2; go('onboarding'); },
  track:d=>{S.catalog.track=d.v;S.catalog.skill=null;render(true);}, kind:d=>{S.catalog.kind=d.v;render();},
  skill:d=>{S.catalog.skill=S.catalog.skill===d.v?null:d.v;render();},
  resetFilters:()=>{S.catalog.kind='all';S.catalog.skill=null;S.catalog.q='';S.states.catalog=null;render();},
  openExam:d=>{ const ex=EXAMS[d.id]; if(ex.screen){ startExam(d.id); return; } if(ex.kind==='full_mock'||(ex.tier==='registered'&&user().guest)){ S.setup=setupFor(d.id); S.introExam=d.id; go('exam-intro'); } else startExam(d.id); },
  openSetup:d=>{ S.setup=setupFor(d.id,d.part); S.introExam=d.id; go('exam-intro'); },
  startExam:d=>startExam(d.id),
  suMode:d=>{ S.setup.mode=d.v; if(d.v==='practice'&&!S.setup.parts.length) S.setup.parts=examParts(EXAMS[S.setup.examId]); render(); },
  suLimit:d=>{ S.setup.limit=d.v; render(); },
  suTool:d=>{ S.setup[d.v]=!S.setup[d.v]; render(); },
  suSample:()=>{ S.setup.sample=!S.setup.sample; render(); if(S.setup.sample) setTimeout(()=>{ if(S.setup&&S.setup.sample){ S.setup.sample=false; render(); } },2500); },
  suStart:()=>{ const su=S.setup; startExam(su.examId, su.mode==='mock'?{mode:'mock'}:{mode:'practice',parts:su.parts,limit:setupMinutes(su),instant:su.instant,replay:su.replay,transcript:su.transcript}); },
  demoStart:d=>startExam(d.id,{mode:d.m}),
  demoResult:d=>{ S.result=buildResult(d.id,examQids(EXAMS[d.id]),CANNED[d.id]||{},{},'mock'); S.resultFilter='all'; render(true); },
  resume:()=>{ S.exam=JSON.parse(JSON.stringify(S.resume)); S.result=null; S.pPop=null; go('exam'); },
  pGo:d=>{ if(d.i===''||d.i==null) return; const E=S.exam, i=+d.i; if(!pageAllowed(E,i)) return; E.page=i; E.focus=E.pages[i].qids[0]; E.mTab='q'; E.showEv=null; S.pPop=null; render(true); },
  qJump:d=>{ if(d.close) S.modal=null; S.sheet=null; focusQ(d.q); },
  qStep:d=>{ const E=S.exam, i=E.qids.indexOf(E.focus)+(+d.d); if(i<0||i>=E.qids.length) return; focusQ(E.qids[i]); },
  focusQ:d=>focusQ(d.q),
  sheetMark:d=>{ setAnswer(d.q,d.k); S.exam.focus=d.q; S.just={q:d.q,k:d.k}; render(); },
  flag:d=>{ const E=S.exam, id=d.q||E.focus; E.flags[id]=!E.flags[id]; render(); },
  checkPage:()=>{ const E=S.exam, ids=curPage().qids.filter(id=>!isBlank(E.answers[id])&&!E.checked[id]); ids.forEach(id=>E.checked[id]=true); S.justChecked=ids; render(); },
  strike:(d,el,ev)=>{ ev.preventDefault(); const E=S.exam, s=E.struck[d.q]=E.struck[d.q]||[], i=s.indexOf(d.k); if(i>=0) s.splice(i,1); else s.push(d.k); render(); },
  mTab:d=>{ S.exam.mTab=d.v; render(true); },
  aToggle:()=>{ const E=S.exam, p=curPage(); if(!p.audio||E.mode==='mock') return; const a=E.audio[p.key]=E.audio[p.key]||{t:0,playing:false}; if(!a.playing&&a.t>=p.audio.sec){ if(!E.tools.replay) return; a.t=0; } a.playing=!a.playing; render(); },
  aBack:()=>{ const p=curPage(), a=S.exam.audio[p.key]; if(a){ a.t=Math.max(0,a.t-5); render(); } },
  aSpeed:d=>{ S.exam.speed=+d.v; render(); },
  seek:d=>{ const E=S.exam, p=curPage(); if(E.mode==='mock'||!E.tools.replay) return; const a=E.audio[p.key]=E.audio[p.key]||{t:0,playing:false}; a.t=+d.t; a.playing=true; render(); },
  scrub:(d,el,ev)=>{ const E=S.exam, p=curPage(); if(E.mode==='mock'||!E.tools.replay) return; const r=el.getBoundingClientRect(), a=E.audio[p.key]=E.audio[p.key]||{t:0,playing:false}; a.t=Math.max(0,Math.min(p.audio.sec,(ev.clientX-r.left)/r.width*p.audio.sec)); render(); },
  followAudio:()=>{ const E=S.exam, seg=curSeg(E); if(seg){ E.page=seg.page; E.focus=E.pages[seg.page].qids[0]; render(true); } },
  pPop:d=>{ S.pPop=S.pPop===d.v?null:d.v; render(); },
  pFont:d=>{ S.exam.settings.font=d.v; render(); },
  pTone:d=>{ S.exam.settings.tone=d.v; render(); },
  tInstant:()=>{ S.exam.tools.instant=!S.exam.tools.instant; render(); },
  tReplay:()=>{ S.exam.tools.replay=!S.exam.tools.replay; render(); },
  tTranscript:()=>{ S.exam.tools.transcript=!S.exam.tools.transcript; render(); },
  notesToggle:()=>{ S.exam.notesOpen=!S.exam.notesOpen; S.pPop=null; render(); },
  noteDel:d=>{ const E=S.exam; E.notes=E.notes.filter(n=>n.id!==d.id); for(const k in E.hl) E.hl[k]=E.hl[k].replace(new RegExp(`<mark class="hl hl--note" data-note="${d.id}">([\\s\\S]*?)</mark>`),'$1'); render(); },
  pHide:()=>{ S.exam.hidden=!S.exam.hidden; S.pPop=null; render(); },
  pPause:()=>{ const E=S.exam; if(E.mode!=='practice') return; E.paused=!E.paused; for(const k in E.audio) E.audio[k].playing=false; S.pPop=null; render(); },
  pickHeading:d=>{ const E=S.exam; E.pick=E.pick===d.v?null:d.v; render(); },
  slotClick:d=>{ const E=S.exam; if(E.pick){ assignHeading(d.q,E.pick); E.pick=null; } else if(E.answers[d.q]) setAnswer(d.q,null); E.focus=d.q; render(); },
  showEv:d=>{ if(S.screen==='review') S.reviewEv=d.q; else { S.exam.showEv=S.exam.showEv===d.q?null:d.q; if(isM()) S.exam.mTab='p'; } render(); },
  nextSection:()=>{ const E=S.exam; S.modal=null; startSection(E,E.secIdx+1); render(true); },
  redoWrong:()=>{ const R=S.result, ids=R.items.filter(i=>!i.ok).map(i=>i.qid); if(!ids.length) return; S.exam=newAttempt(R.examId,{mode:'practice',qids:ids,instant:true,replay:true,transcript:true}); S.result=null; go('exam'); },
  openSheet:()=>{ S.sheet='qnav'; S.pPop=null; render(); },
  openSubmit:()=>{ S.sheet=null; S.pPop=null; S.modal={type:'submit'}; render(); },
  confirmSubmit:()=>submitExam('learner'),
  saveExit:()=>{ S.pPop=null; S.modal={type:'exit'}; render(); },
  confirmExit:()=>{ const E=S.exam; if(E){ E.save='saved'; E.paused=false; E.hidden=false; for(const k in E.audio) E.audio[k].playing=false; S.resume=JSON.parse(JSON.stringify(E)); } S.exam=null; go(S.persona==='guest'?'catalog':'home'); toast(T('Đã lưu bài làm','Progress saved'),T('Tiếp tục từ Trang chủ hoặc trên điện thoại.','Resume from Home or on your phone.')); },
  closeModal:()=>{ S.modal=null; S.sheet=null; render(); },
  overlayClose:(d,el,ev)=>{ if(ev.target===el){ S.modal=null; S.sheet=null; render(); } },
  ff:()=>{ const E=S.exam; if(!E) return; if(E.track){ const tr=E.track; tr.i=Math.max(0,tr.segs.length-1); tr.t=Math.max(0,tr.segs[tr.i].sec-3); } else if(E.remaining!=null) E.remaining=15; render(); },
  resultFilter:d=>{ S.resultFilter=d.v; render(); },
  openReview:d=>{ S.review.idx=+d.i; if(S.result.items[+d.i].ok) S.review.onlyWrong=false; go('review'); },
  reviewGo:d=>{ if(d.i===''||d.i==null) return; S.review.idx=+d.i; render(true); },
  reviewWrong:()=>{ S.review.onlyWrong=!S.review.onlyWrong; render(); },
  openHistory:d=>{ if(d.status!=='completed'){ if(S.resume&&S.resume.examId===d.exam){ A.resume(); return; } S.setup=setupFor(d.exam); S.introExam=d.exam; go('exam-intro'); return; } const ex=EXAMS[d.exam]; S.result=buildResult(d.exam,examQids(ex),CANNED[d.exam]||{},{},ex.mode); S.resultFilter='all'; go('results'); },
  askTutor:d=>{ S.tutor={ctx:d.q,myAnswer:d.a,messages:null,typing:false,draft:'',opened:true,seen:0}; S.states.tutor=null; go('tutor'); },
  tutorAsk:d=>tutorSend(d.t,true),
  tutorSend:()=>{ const t=S.tutor.draft.trim(); if(t) tutorSend(t,false); },
  rate:()=>toast(T('Cảm ơn phản hồi','Thanks for the feedback'),T('Giúp cải thiện chất lượng giải thích (tutor_messages.learner_rating).','Helps improve explanations (tutor_messages.learner_rating).'),'info'),
  upload:()=>{ const L=S.lib, id='n'+Date.now(); L.materials.unshift({id,title:'My notes - Unit 5.pdf',meta:['PDF · 3 trang · 420 KB','PDF · 3 pages · 420 KB'],rights:L.rights,status:'uploaded'}); L.rightsOk=false; L.rights=''; S.states.library=null; render();
    setTimeout(()=>{ const m=L.materials.find(x=>x.id===id); if(m){m.status='processing';m.p=35;render();} },900);
    setTimeout(()=>{ const m=L.materials.find(x=>x.id===id); if(m){m.p=80;render();} },1900);
    setTimeout(()=>{ const m=L.materials.find(x=>x.id===id); if(m){m.status='ready';render(); toast(T('Tài liệu sẵn sàng','Material ready'),T('Bạn có thể tạo câu hỏi từ tài liệu này.','You can now generate questions from it.'));} },2900); },
  removeMat:d=>{ const L=S.lib, i=L.materials.findIndex(m=>m.id===d.id); if(i<0) return; const removed=L.materials.splice(i,1)[0]; L.undo={item:removed,i}; toast(T('Đã xóa tài liệu','Material deleted'),T('Bấm “Hoàn tác” để khôi phục.','Press “Undo” to restore.'),'info'); S.toasts[S.toasts.length-1].undo=true; render(); setTimeout(()=>{ if(L.undo&&L.undo.item===removed){ L.undo=null; render(); } },3800); },
  undoRemove:()=>{ const L=S.lib; if(L.undo){ L.materials.splice(L.undo.i,0,L.undo.item); L.undo=null; S.toasts=S.toasts.filter(t=>!t.undo); render(); toast(T('Đã khôi phục tài liệu','Material restored'),''); } },
  generate:d=>{ S.lib.gen='generating'; S.lib.genFrom=d.id; render(); setTimeout(()=>{ S.lib.gen='ready'; S.lib.drafts=['gq1','gq2','gq3','gq4'].map(qid=>({qid,status:'draft'})); render(); },1600); },
  draftStatus:d=>{ S.lib.drafts[+d.i].status=d.s; S.lib.editing=null; render(); },
  approveAll:()=>{ S.lib.drafts.forEach(x=>{ if(x.status==='draft') x.status='approved'; }); render(); toast(T('Đã duyệt tất cả câu nháp','All drafts approved'),T('Hoàn tác từng câu nếu cần.','Undo individually if needed.')); },
  editDraft:d=>{ S.lib.editing=+d.i; render(); const el=document.getElementById('edit-'+d.i); if(el) el.focus(); },
  saveDraft:d=>{ const el=document.getElementById('edit-'+d.i); if(el&&el.value.trim()) Q[S.lib.drafts[+d.i].qid].stem=el.value.trim(); S.lib.editing=null; render(); toast(T('Đã lưu chỉnh sửa','Edit saved'),T('Câu hỏi vẫn là nháp đến khi bạn duyệt.','The question stays a draft until approved.'),'info'); },
  createPersonal:()=>{ const qids=S.lib.drafts.filter(x=>x.status==='approved').map(x=>x.qid); EXAMS['personal-remote']={track:'personal',title:['Bộ luyện riêng: Remote work trends','Personal set: Remote work trends'],kind:'personal_practice',skill:'reading',count:qids.length,minutes:qids.length*2,diff:3,tier:'registered',mode:'practice',qids,desc:['Tạo từ tài liệu của bạn.','Built from your material.']}; S.lib.personal='personal-remote'; render(); toast(T('Đã tạo bộ luyện riêng tư','Private set created'),T('Chỉ bạn thấy bộ này.','Only you can see it.')); },
  libReset:()=>{ S.lib=initial().lib; if(S.persona!=='returning') S.lib.materials=[]; render(); },
  wMode:d=>{ if(d.v==='web'){ toast(T('Đã gửi link tiếp tục trên web','Link sent'),T('Bài làm tự lưu và đồng bộ giữa thiết bị (mô phỏng).','Work autosaves and syncs across devices (simulated).'),'info'); return; } S.writing.mobileMode=d.v; render(true); },
  wSample:()=>{ S.writing.text=W_SAMPLE; render(); },
  writingSubmit:()=>{ S.modal={type:'writingSubmit'}; render(); },
  writingConfirm:()=>{ S.modal=null; S.writing.phase='evaluating'; render(true); setTimeout(()=>{ if(S.writing&&S.writing.phase==='evaluating'){ S.writing.phase='feedback'; render(true); } },1800); },
  writingRetry:()=>{ S.states.writing=null; S.writing.phase='evaluating'; render(true); setTimeout(()=>{ if(S.writing){S.writing.phase='feedback'; render(true);} },1500); },
  writingReset:()=>{ S.writing=null; S.states.writing=null; render(true); },
  spk:d=>{ const P=S.speaking; P.phase=d.p; if(d.p==='prep'||d.p==='recording') P.t=0; if(d.p==='evaluating') setTimeout(()=>{ if(S.speaking&&S.speaking.phase==='evaluating'){S.speaking.phase='feedback';render(true);} },1800); render(true); },
  spkReset:()=>{ S.speaking=null; render(true); },
  notif:()=>{S.notif=!S.notif;render();},
  linkGoogle:()=>{S.googleLinked=true;render();toast(T('Đã liên kết Google','Google linked'),'');},
  logout:()=>{ personaApply('guest'); go('landing'); toast(T('Đã đăng xuất','Signed out'),'','info'); },
  deleteAccount:()=>{ S.modal={type:'delete'}; render(); },
  confirmDelete:()=>{ personaApply('guest'); go('landing'); toast(T('Đã gửi yêu cầu xóa tài khoản','Deletion requested'),T('Mô phỏng — không có dữ liệu thật bị xóa.','Simulated — no real data deleted.'),'info'); },
  switchTenant:d=>{ S.navMenu=null; if(S.tenant===d.v){ render(); return; } themeSwitch(()=>{S.tenant=d.v;}); toast(d.v==='sunrise'?T('Đã chuyển sang Sunrise English','Switched to Sunrise English'):T('Đã chuyển về Engrisk','Switched to Engrisk'),T('Phiên đăng nhập đổi active_tenant_id; dữ liệu học tách riêng.','Session active_tenant_id changed; learning data stays separate.'),'info'); },
  navMenu:d=>{ S.navMenu=S.navMenu===d.v?null:d.v; S.langMenu=null; render(); },
  toggleSide:()=>{ S.sideCollapsed=!S.sideCollapsed; S.navMenu=null; render(); },
  toggleDark:()=>themeSwitch(()=>{ S.mode=resolvedTheme()==='dark'?'light':'dark'; }),
  sideSearch:()=>{ S.navMenu=null; S.sideCollapsed=false; render(); requestAnimationFrame(()=>{ const i=document.getElementById('side-q'); if(i){ i.focus(); i.select(); } }); },
  invite:d=>{ S.org.invite=d.v; if(d.v==='accepted'){ S.tenant='sunrise'; toast(T('Đã tham gia Sunrise English','Joined Sunrise English'),T('Tạo membership + vai trò Học viên.','Membership + Learner role created.')); } if(d.v!=='accepted'&&S.tenant==='sunrise') S.tenant='engrisk'; render(true); },
  orgAccent:d=>themeSwitch(()=>{ S.org.accent=d.c; S.tenant='sunrise'; }),
};
/* Feature modules (loaded before app.js) contribute their own actions. */
Object.assign(A, STUDIO_ACTIONS, COMMUNITY_ACTIONS);
function finishAuth(method){
  const convert=S.auth.convert, signup=S.auth.tab==='signup'||convert;
  if (method==='password'){ const email=(document.getElementById('f-email')||{}).value||'';
    if ((!signup&&email.trim().toLowerCase()==='sai@example.com')||!email.includes('@')){ S.states.auth='error'; render(); return; } }
  S.states.auth='loading'; render();
  setTimeout(()=>{
    S.states.auth=null;
    const keepResult=S.result, extra=S.extraHistory.slice(), keepResume=S.resume;
    if (signup){ personaApply('new'); S.extraHistory=convert?extra:[]; S.result=convert?keepResult:null; S.resume=convert?keepResume:null; S.auth.convert=false;
      toast(convert?T('Đã lưu kết quả vào tài khoản mới','Result saved to your new account'):T('Đã tạo tài khoản','Account created'),method==='google'?T('Đăng nhập bằng Google (mô phỏng).','Signed in with Google (simulated).'):T('Kiểm tra email để xác minh (mô phỏng).','Check your email to verify (simulated).'));
      S.onb={step:0,exam:null,level:null,target:null,minutes:null}; go('onboarding'); }
    else { personaApply('returning'); go('home'); toast(T('Chào mừng trở lại','Welcome back'),method==='google'?T('Đăng nhập bằng Google (mô phỏng).','Signed in with Google (simulated).'):''); }
  },900);
}
function tutorSend(text,isChip){
  const TT=S.tutor, q=Q[TT.ctx]; if (TT.typing) return;
  const c = isChip ? TUTOR_CHIPS.find(x=>x.id===text) : null;
  TT.messages.push({from:'me',text:c?tx(c.label):text}); TT.draft=''; TT.typing=true; render();
  setTimeout(()=>{ TT.typing=false; const r=c?c.reply(q):['(Mô phỏng) Câu hỏi hay! Bản thật sẽ trả lời dựa trên đáp án kiểm duyệt của câu này và nói rõ khi không chắc chắn.','(Simulated) Good question! The real tutor answers from this question’s verified key and says when it’s unsure.'];
    if (r==='__REC__'){ TT.messages.push({from:'tutor',text:['Mình chọn từ ngân hàng câu hỏi đã kiểm duyệt (không tự bịa câu mới) để bạn luyện đúng kỹ năng Giới từ:','I picked these from the verified question bank (no invented questions) so you practice prepositions:']}); TT.messages.push({from:'tutor',rec:true}); }
    else TT.messages.push({from:'tutor',text:r});
    render(); const ct=document.querySelector('[data-scroll="content"]'); if(ct) ct.scrollTop=ct.scrollHeight; },1100);
}

/* ---------- Events (generic delegation; test-player specifics live in player-events.js) ---------- */
document.addEventListener('click',ev=>{
  const dsLink=ev.target.closest('[data-ds]'); if (dsLink){ ev.preventDefault(); const t=document.getElementById(dsLink.dataset.ds), vp=document.getElementById('viewport'); if(t) vp.scrollTo({top:vp.scrollTop+t.getBoundingClientRect().top-vp.getBoundingClientRect().top-16,behavior:'smooth'}); return; }
  if (ev.target.closest('.toast [data-undo]')){ A.undoRemove(); return; }
  if (!ev.target.closest('.sel-menu')) hideSelMenu();
  if (S.langMenu && !ev.target.closest('[data-dropdown]')){ S.langMenu=null; render(); }
  if ((S.pPop||S.navMenu) && !ev.target.closest('[data-dropdown]')){ S.pPop=null; S.navMenu=null; render(); }
  trackFocus(ev.target);
  const el=ev.target.closest('[data-action]'); if(!el||el.disabled) return;
  const act=el.dataset.action; if(!act||!A[act]) return;
  if (act!=='overlayClose' && ev.target.closest('[data-stop]') && !el.closest('[data-stop]')) return;
  A[act]({...el.dataset},el,ev);
});
document.addEventListener('keydown',ev=>{
  if ((ev.key==='Enter'||ev.key===' ')&&ev.target.matches('tr[data-action]')){ ev.preventDefault(); ev.target.click(); return; }
  if (ev.key==='Escape'&&(S.langMenu||S.pPop||S.navMenu)){ S.langMenu=null; S.pPop=null; S.navMenu=null; render(); return; }
  if (ev.key==='/'&&!ev.target.matches('input,textarea,select')&&S.screen!=='exam'&&SCREENS[S.screen].chrome==='app'&&!isM()){ ev.preventDefault(); A.sideSearch(); return; }
  if (ev.key==='Escape'&&(S.modal||S.sheet)&&!(S.modal&&['grading','section'].includes(S.modal.type))){ S.modal=null; S.sheet=null; render(); return; }
  if (ev.key==='Enter'&&ev.target.id==='tutor-input'){ A.tutorSend(); return; }
  playerKey(ev);
});
document.addEventListener('change',ev=>{
  const el=ev.target, k=el.dataset.input; if(!k) return;
  if (playerChange(el,k)||studioChange(el,k)||communityChange(el,k)) return;
  if (k==='suPart'){ const p=S.setup.parts, i=p.indexOf(el.dataset.v); if(el.checked&&i<0) p.push(el.dataset.v); if(!el.checked&&i>=0) p.splice(i,1); const order=examParts(EXAMS[S.setup.examId]); p.sort((a,b)=>order.indexOf(a)-order.indexOf(b)); render(); }
  if (k==='suSection'){ const ps=el.dataset.v.split(','), su=S.setup; su.parts = el.checked ? [...new Set([...su.parts,...ps])] : su.parts.filter(p=>!ps.includes(p)); const order=examParts(EXAMS[su.examId]); su.parts.sort((a,b)=>order.indexOf(a)-order.indexOf(b)); render(); }
  if (k==='suSoundOk'){ S.setup.soundOk=el.checked; render(); }
  if (k==='rights'){ S.lib.rights=el.value; render(); }
  if (k==='rightsOk'){ S.lib.rightsOk=el.checked; render(); }
});
document.addEventListener('focusout',ev=>{
  const el=ev.target; if (el.dataset&&el.dataset.blur==='email'){ const v=el.value.trim(); const bad=v!==''&&!/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(v); if (bad!==S.auth.emailInvalid){ S.auth.emailInvalid=bad; setTimeout(render,0); } }
});
document.addEventListener('input',ev=>{
  const el=ev.target, k=el.dataset.input; if(!k) return;
  if (playerInput(el,k)||studioInput(el,k)||communityInput(el,k)) return;
  if (k==='writing'){ S.writing.text=el.value; const wc=words(el.value), target=S.writing.mobileMode==='intro'?50:250, c=document.getElementById('w-count'); if(c){ c.textContent=`${wc} / ${target} ${T('từ','words')}`; c.className=`tnum font-medium ${wc>=target?'text-success':'text-muted'}`; } }
  if (k==='tutorDraft') S.tutor.draft=el.value;
  if (k==='authEmail'){ S.auth.email=el.value; if(S.auth.emailInvalid&&/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(el.value.trim())){ S.auth.emailInvalid=false; render(); } }
  if (k==='catQ'){ S.catalog.q=el.value; render(); }
  if (k==='sideQ'){ S.catalog.q=el.value; if(S.screen!=='catalog'){ if(S.hist[S.hist.length-1]!==S.screen) S.hist.push(S.screen); S.screen='catalog'; S.navMenu=null; } render(); }
});
matchMedia('(prefers-color-scheme: dark)').addEventListener('change',()=>{ if(S.mode==='system') render(); });

/* ---------- Clocks: writing & speaking (test-player clocks in player-events.js) ---------- */
setInterval(()=>{
  const W=S.writing; if (W&&S.screen==='writing'&&W.phase==='editing'&&(!isM()||W.mobileMode)){ W.remaining=Math.max(0,W.remaining-1); const t=document.getElementById('w-timer'); if(t) t.querySelector('span').textContent=fmt(W.remaining); }
  const P=S.speaking; if (P&&S.screen==='speaking'&&(P.phase==='prep'||P.phase==='recording')){ P.t++;
    if (P.phase==='prep'&&P.t>=60){ P.phase='recording'; P.t=0; render(); }
    else if (P.phase==='recording'&&P.t>=120){ P.phase='recorded'; render(); }
    else { const t=document.getElementById('spk-timer'); if(t) t.querySelector('span').textContent=fmt(P.phase==='prep'?60-P.t:P.t); const pr=document.getElementById('spk-prep'); if(pr&&P.phase==='prep') pr.innerHTML=progressBar(P.t,60,{label:T('Thời gian chuẩn bị','Preparation'),right:`${60-P.t}s`}); } }
},1000);

/* Boot: suggest the browser language but never switch automatically */
render(true);
