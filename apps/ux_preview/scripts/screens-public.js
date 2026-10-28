/* Public screens: landing · auth · onboarding */

function langSuggestBanner(){
  const bl = browserLang();
  if (S.langSuggestDone || bl===S.lang || !LANGS.some(l=>l[0]===bl&&l[3])) return '';
  const target = LANGS.find(l=>l[0]===bl);
  return `<div class="banner-lang" role="status">${icon('globe',16)}<span class="grow">${bl==='en'?'It looks like you prefer English. Switch the interface language?':'Có vẻ bạn dùng tiếng Việt. Chuyển ngôn ngữ giao diện?'}</span>${btn(bl==='en'?'Switch to English':'Chuyển sang Tiếng Việt',{size:'sm',action:'setLang',data:{v:bl}})}${btn('',{v:'ghost',size:'sm',ic:'xmark',action:'dismissLangSuggest',aria:T('Đóng','Dismiss')})}</div>`;
}

function rLanding(){
  const m=isM();
  const floats = `
    <div class="float float--1">${skillTile('reading','sm')}<div><div class="text-xs text-muted">${T('TOEIC ước tính','Estimated TOEIC')}</div><div class="row gap-1"><b class="tnum text-base">600</b>${trend('30')}</div></div></div>
    <div class="float float--2" style="max-width:220px">${tile('shield-check','success','sm')}<div><div class="text-xs font-semibold text-success">${T('Đáp án đã kiểm duyệt','Verified answer')}</div><div class="text-xs">${T('“by” + mốc thời gian = hạn chót','“by” + time = deadline')}</div></div></div>
    <div class="float float--3">${avatar('AI',{size:'sm',color:'inverse'})}<div><div class="text-xs text-muted row gap-1">${icon('sparkles',11)}AI Tutor</div><div class="text-xs font-medium">Submit BY, wait UNTIL.</div></div></div>
    <div class="float float--4">${skillTile('listening','sm')}<span class="text-xs font-medium">Part 3 · 5 ${T('phút','min')}</span></div>`;
  const hero = `<section class="hero">
    <div class="col gap-5">
      <div class="row row--wrap">${chip(T('Mới · AI Tutor giải thích câu sai','New · AI Tutor explains mistakes'),'accent','sparkles')}</div>
      <h1 class="hero__title">${T('Luyện thi 15 phút mỗi ngày.','15 minutes of practice a day.')}<br><span class="gradient-text">${T('Biết ngay mình sai ở đâu.','Know exactly where you went wrong.')}</span></h1>
      <p class="hero__lead">${T('TOEIC & IELTS cho người bận rộn. Bắt đầu một bài ngắn ngay — không cần đăng ký. Giải thích đã kiểm duyệt, AI Tutor khi chưa hiểu, tiến bộ theo từng kỹ năng.','TOEIC & IELTS for busy people. Start a short set right now — no sign-up. Verified explanations, an AI Tutor when you’re stuck, and progress by skill.')}</p>
      <div class="row row--wrap">${btn(T('Luyện thử 5 phút','Try a 5-minute set'),{size:m?'lg':'xl',ic:'play-fill',action:'quick',full:m})}${btn(T('Tôi đã có tài khoản','I have an account'),{v:'tertiary',size:m?'lg':'xl',action:'go',data:{to:'auth'},full:m})}</div>
      <div class="row row--wrap gap-3">
        <div class="avatar-group">${[['MN','var(--sw-blue)'],['LH','var(--sw-purple)'],['TK','var(--sw-orange)'],['AY','var(--sw-green)']].map(([t,c])=>avatar(t,{size:'sm',color:'default',style:`background:color-mix(in oklab,${c} 22%,var(--surface));color:color-mix(in oklab,${c} 60%,var(--foreground))`})).join('')}</div>
        <div class="text-sm"><b>12.000+</b> <span class="text-muted">${T('người học ở 9 quốc gia','learners in 9 countries')}</span> ${sim(T('số liệu minh họa','illustrative'))}</div>
      </div>
    </div>
    <div class="hero__art" aria-hidden="${m?'false':'false'}">
      <div class="hero__blob hero__blob--a"></div><div class="hero__blob hero__blob--b"></div><div class="hero__blob hero__blob--c"></div>
      <div class="hero__mascot">${mascot({mood:'wave',size:m?170:230})}</div>
      ${floats}
    </div>
  </section>`;
  const exams = `<section class="row row--wrap row--center gap-3">${[['TOEIC','Listening & Reading','reading'],['IELTS','Academic','writing'],['IELTS','General Training','speaking']].map(([a,b,s])=>`<button type="button" class="card card--press" style="flex-direction:row;align-items:center;gap:12px;padding:12px 16px" data-action="pickTrack" data-v="${a.toLowerCase()}" data-fk="track:${a}${b}">${skillTile(s,'sm')}<span><b>${a}</b> <span class="text-muted">${b}</span></span>${icon('chevron-right',14,'text-muted')}</button>`).join('')}</section>`;
  const steps = [
    ['wave',T('Chọn mục tiêu (hoặc bỏ qua)','Pick a goal (or skip)'),T('4 câu hỏi nhanh, Pip gợi ý bài phù hợp.','4 quick questions; Pip suggests the right set.')],
    ['think',T('Luyện 5–15 phút','Practice 5–15 minutes'),T('Mỗi câu có đáp án kiểm duyệt và bằng chứng trong bài.','Every question has a verified answer and evidence.')],
    ['cheer',T('Thấy mình tiến bộ','See yourself improve'),T('Điểm ước tính và kỹ năng yếu nhất cần luyện tiếp.','Estimated score and your weakest skill to practice next.')],
  ];
  const how = `<section><div class="section-head"><span class="eyebrow">${T('Cách hoạt động','How it works')}</span><h2>${T('Ba bước, mỗi ngày một chút','Three steps, a little every day')}</h2></div>
    <div class="grid ${m?'':'grid-3'}">${steps.map(([mood,t,d],i)=>`<div class="card card--lg" style="align-items:center;text-align:center">${mascot({mood,size:96})}<span class="step-num">${i+1}</span><div class="text-lg font-semibold">${t}</div><p class="text-muted">${d}</p></div>`).join('')}</div></section>`;
  const bento = `<section><div class="section-head"><span class="eyebrow">${T('Tính năng','Features')}</span><h2>${T('Mọi thứ để luyện đúng chỗ yếu','Everything to fix your weak spots')}</h2><p>${T('Không streak gây áp lực, không quảng cáo điểm “chính thức” — chỉ luyện tập rõ ràng và trung thực.','No streak pressure, no fake “official” scores — just clear, honest practice.')}</p></div>
    <div class="bento">
      <div class="card card--lg bento__big tint-band tint-reading" style="justify-content:space-between">
        <div class="col gap-2">${skillTile('reading','lg')}<div class="text-xl font-semibold">${T('Giải thích có bằng chứng','Explanations with evidence')}</div><p class="text-muted">${T('Đáp án kiểm duyệt, giải thích ngắn, và câu chứa bằng chứng được tô sáng ngay trong đoạn văn.','Verified answers, short explanations, and the evidence sentence highlighted in the passage.')}</p></div>
        <div class="col gap-2"><div class="option is-correct"><span class="option__key">A</span><span class="option__text">by</span><span class="option__tag">${chip(T('Đúng','Correct'),'success','check',{size:'sm'})}</span></div><div class="option is-wrong"><span class="option__key">B</span><span class="option__text">until</span><span class="option__tag">${chip(T('Bạn chọn','Your pick'),'danger','xmark',{size:'sm'})}</span></div></div>
      </div>
      <div class="card card--lg tint-band tint-speaking">${skillTile('speaking')}<div class="text-base font-semibold">AI Tutor</div><p class="text-sm text-muted">${T('Hỏi tiếp về câu sai. Luôn ghi rõ là AI.','Ask follow-ups about a mistake. Always labeled as AI.')}</p></div>
      <div class="card card--lg tint-band tint-listening">${skillTile('listening')}<div class="text-base font-semibold">${T('Thi thử như thật','Realistic mock tests')}</div><p class="text-sm text-muted">${T('Âm thanh phát 1 lần, đồng hồ máy chủ, tự lưu.','One-play audio, server timer, autosave.')}</p></div>
      <div class="card card--lg tint-band tint-writing">${skillTile('writing')}<div class="text-base font-semibold">IELTS Writing & Speaking ${phase('P2')}</div><p class="text-sm text-muted">${T('Band ước tính theo 4 tiêu chí.','Estimated band on 4 criteria.')}</p></div>
      <div class="card card--lg tint-band tint-personal">${tile('file-arrow-up','warning')}<div class="text-base font-semibold">${T('Tạo bài từ tài liệu','Practice from your files')} ${phase('P3')}</div><p class="text-sm text-muted">${T('Riêng tư, bạn duyệt trước khi luyện.','Private; you approve before practicing.')}</p></div>
    </div></section>`;
  const langs = `<section class="card card--lg" style="align-items:center;text-align:center;gap:16px">${tile('globe','accent','lg')}<div class="col gap-1"><h2 class="text-2xl font-bold tracking-tight">${T('Học bằng ngôn ngữ của bạn','Learn in your language')}</h2><p class="text-muted">${T('Giao diện và giải thích theo ngôn ngữ bạn chọn; đề thi luôn bằng tiếng Anh.','Interface and explanations in your language; exam content stays in English.')}</p></div>
    <div class="row row--wrap row--center gap-2">${LANGS.map(([c,n,en,ok])=>`<span class="lang-chip ${ok?'':'lang-chip--soon'}">${n}${ok?(c===S.lang?icon('check',12,'text-accent'):''):` · ${T('sắp có','soon')}`}</span>`).join('')}</div>${langPicker('landing-mid',{full:true})}</section>`;
  const quotes = [['MN','var(--sw-blue)','Minh · TOEIC 650 → 735',T('Mỗi tối 15 phút trên điện thoại. Phần giải thích có bằng chứng giúp mình hết nhầm “by” và “until”.','15 minutes every night on my phone. Evidence-based explanations finally fixed my “by” vs “until” mistakes.')],['LH','var(--sw-purple)','Lan · IELTS 6.0 → 6.5',T('Mình thích việc điểm AI luôn hiện dạng khoảng — trung thực hơn nhiều app khác.','I like that AI scores are shown as a range — more honest than other apps.')],['KT','var(--sw-orange)','Kenji · TOEIC 580',T('Giao diện tiếng Anh, đề tiếng Anh, nhưng có thể đổi sang ngôn ngữ của mình sau này.','English UI and English content — and my own language is coming.')]];
  const testimonials = `<section><div class="section-head"><span class="eyebrow">${T('Người học nói gì','What learners say')}</span><h2>${T('Tiến bộ thật, từng chút một','Real progress, bit by bit')}</h2>${sim(T('nội dung minh họa','illustrative content'))}</div>
    <div class="grid ${m?'':'grid-3'}">${quotes.map(([i,c,n,q])=>`<div class="card card--lg"><p class="text-base" style="line-height:26px">“${q}”</p><div class="row gap-3" style="margin-top:auto">${avatar(i,{color:'default',style:`background:color-mix(in oklab,${c} 22%,var(--surface));color:color-mix(in oklab,${c} 60%,var(--foreground))`})}<span class="text-sm font-semibold">${n}</span></div></div>`).join('')}</div></section>`;
  const cta = `<section class="cta-band">${mascot({mood:'cheer',size:m?120:150})}<div class="col gap-3 grow"><h2 class="text-3xl font-bold tracking-tight">${T('Bắt đầu bài đầu tiên ngay hôm nay','Start your first set today')}</h2><p class="text-muted">${T('Miễn phí, không cần thẻ. Kết quả khách được giữ khi bạn tạo tài khoản.','Free, no card needed. Guest results are kept when you sign up.')}</p><div class="row row--wrap ${m?'row--center':''}">${btn(T('Luyện thử 5 phút','Try a 5-minute set'),{size:'lg',ic:'play-fill',action:'quick'})}${btn(T('Xem tất cả bài','Browse all sets'),{v:'tertiary',size:'lg',iconR:'arrow-right',action:'go',data:{to:'catalog'}})}</div></div></section>`;
  const footer = `<footer class="footer">${brand()}<span>© 2026 Engrisk · ${T('Điều khoản','Terms')} · ${T('Quyền riêng tư','Privacy')}</span>${langPicker('footer',{up:true,full:true})}</footer>`;
  return `<div class="landing">${langSuggestBanner()}${hero}${exams}${how}${bento}${langs}${testimonials}${cta}${footer}</div>`;
}

function rAuth(){
  const a=S.auth, st=viewState('auth'), m=isM(), loading=st==='loading', err=st==='error', signup=a.tab==='signup'||a.convert;
  const head = a.convert
    ? `<div class="col gap-2">${m?mascot({mood:'happy',size:80}):''}<h1 class="text-2xl font-bold tracking-tight">${T('Lưu kết quả của bạn','Save your result')}</h1><p class="text-muted">${T(`Tạo tài khoản để giữ kết quả ${S.result?rawLabel(S.result):''} vừa làm. Mọi bài đã làm với tư cách khách được giữ nguyên.`,`Create an account to keep your ${S.result?rawLabel(S.result):''} result. Everything you did as a guest is kept.`)}</p></div>`
    : `<div class="col gap-2">${m?mascot({mood:'wave',size:80}):''}<h1 class="text-2xl font-bold tracking-tight">${a.tab==='signin'?T('Chào mừng trở lại','Welcome back'):T('Tạo tài khoản miễn phí','Create a free account')}</h1><p class="text-muted">${a.tab==='signin'?T('Tiếp tục đúng chỗ bạn dừng lại.','Pick up right where you left off.'):T('Mất chưa đến 1 phút. Không cần thẻ thanh toán.','Takes under a minute. No card required.')}</p></div>`;
  const form = `<div class="col gap-5">
    ${head}
    <div class="card card--lg" style="gap:16px">
      ${a.convert?'':tabs(T('Chế độ','Mode'),[['signin',T('Đăng nhập','Sign in')],['signup',T('Đăng ký','Sign up')]],a.tab,'authTab',{full:true})}
      <button type="button" class="button button--tertiary ${m?'button--lg':''} button--full-width" data-action="google" data-fk="google">${GOOGLE}<span>${T('Tiếp tục với Google','Continue with Google')}</span></button>
      <div class="row text-xs text-muted" style="gap:12px"><span class="separator grow"></span>${T('hoặc dùng email','or use email')}<span class="separator grow"></span></div>
      ${err?alertBox('danger',T('Email hoặc mật khẩu không đúng','Incorrect email or password'),T('Kiểm tra lại hoặc đặt lại mật khẩu. Sau 5 lần sai, đăng nhập bị tạm khóa 15 phút.','Check and try again, or reset your password. After 5 failed attempts, sign-in is locked for 15 minutes.'),'',{flat:true}):''}
      <form class="col gap-4" novalidate onsubmit="return false">
        ${signup?`<div class="textfield"><label class="label" for="f-name">${T('Tên hiển thị','Display name')}</label><input id="f-name" class="input input--secondary" autocomplete="name" placeholder="${T('Ví dụ: Minh','e.g. Alex')}"></div>`:''}
        <div class="textfield"><label class="label label--required" for="f-email">Email</label><input id="f-email" class="input input--secondary" type="email" autocomplete="email" placeholder="you@example.com" value="${esc(a.email)}" data-input="authEmail" data-blur="email" ${err||a.emailInvalid?'aria-invalid="true" aria-describedby="f-email-err"':''}>${err?`<span class="field-error" id="f-email-err">${T('Thông tin đăng nhập không khớp.','Credentials don’t match.')}</span>`:a.emailInvalid?`<span class="field-error" id="f-email-err">${T('Email chưa đúng định dạng.','Please enter a valid email.')}</span>`:''}</div>
        <div class="textfield"><div class="row row--between"><label class="label label--required" for="f-pw">${T('Mật khẩu','Password')}</label>${a.tab==='signin'&&!a.convert?(a.resetSent?chip(T('Đã gửi link đặt lại','Reset link sent'),'success','check',{size:'sm'}):`<button type="button" class="link text-sm" data-action="forgot" data-fk="forgot">${T('Quên mật khẩu?','Forgot password?')}</button>`):''}</div>
          <div class="input-group"><span class="input-group__prefix">${icon('lock',14)}</span><input id="f-pw" class="input input--secondary" type="${a.showPw?'text':'password'}" autocomplete="${a.tab==='signin'?'current-password':'new-password'}" placeholder="${a.tab==='signin'?'••••••••':T('Ít nhất 8 ký tự','At least 8 characters')}" ${err?'aria-invalid="true"':''}><span class="input-group__suffix">${btn('',{v:'ghost',size:'sm',ic:a.showPw?'eye-slash':'eye',action:'togglePw',aria:a.showPw?T('Ẩn mật khẩu','Hide password'):T('Hiện mật khẩu','Show password')})}</span></div>
          ${signup?`<span class="description">${T('Ít nhất 8 ký tự. Engrisk chỉ lưu bản băm (hash) của mật khẩu.','At least 8 characters. Engrisk only stores a hash of your password.')}</span>`:''}
        </div>
        ${btn(signup?T('Tạo tài khoản','Create account'):T('Đăng nhập','Sign in'),{size:'lg',full:true,action:'authSubmit',pending:loading})}
      </form>
    </div>
    ${a.convert?'':`<div class="row row--center">${btn(T('Tiếp tục với tư cách khách','Continue as guest'),{v:'ghost',size:'sm',action:'quick',iconR:'arrow-right'})}</div>`}
    <p class="text-xs text-muted" style="text-align:center">${T('Bằng việc tiếp tục, bạn đồng ý Điều khoản & Chính sách quyền riêng tư.','By continuing you agree to the Terms & Privacy Policy.')} ${sim(T('Không có xác thực thật','No real authentication'))}</p>
  </div>`;
  if (m) return form;
  const benefits = [['shield-check',T('Đáp án kiểm duyệt cho mọi câu','Verified answers on every question')],['chart-line-arrow-up',T('Tiến bộ theo từng kỹ năng','Progress by skill')],['globe',T('Giao diện đa ngôn ngữ','Multilingual interface')]];
  return `<div class="auth"><div class="auth__brand">${mascot({mood:a.convert?'happy':'wave',size:200})}<h2 class="text-3xl font-bold tracking-tight">${T('Luyện ít, hiểu nhiều.','Practice less, understand more.')}</h2><div class="col gap-3">${benefits.map(([i,t])=>`<div class="row gap-3">${tile(i,'accent','sm')}<span class="font-medium">${t}</span></div>`).join('')}</div></div><div class="auth__form"><div>${form}</div></div></div>`;
}

function rOnboarding(){
  const o=S.onb, m=isM();
  const steps=[
    {q:T('Bạn đang luyện thi gì?','Which exam are you preparing for?'),pip:T('Chào bạn! Mình là Pip. Mình sẽ chọn bài hợp với bạn nhé.','Hi! I’m Pip. I’ll pick sets that fit you.'),k:'exam',opts:[['toeic_lr','TOEIC Listening & Reading',T('Thang 10–990','Scale 10–990'),'reading'],['ielts_academic','IELTS Academic',T('Band 0–9','Band 0–9'),'writing'],['ielts_general','IELTS General Training',T('Band 0–9','Band 0–9'),'speaking'],['unsure',T('Chưa chắc','Not sure yet'),T('Bạn có thể đổi bất cứ lúc nào','You can change this anytime'),null]]},
    {q:T('Trình độ hiện tại của bạn?','What’s your current level?'),pip:T('Tự đánh giá là đủ — bài đầu tiên sẽ giúp mình hiệu chỉnh.','A rough guess is fine — your first set will calibrate it.'),k:'level',opts:[['new',T('Mới bắt đầu','Beginner'),T('Ít khi đọc/nghe tiếng Anh','Rarely read or listen in English'),null],['basic',T('Cơ bản','Basic'),T('Hiểu câu đơn giản','Understand simple sentences'),null],['intermediate',T('Trung cấp','Intermediate'),T('Đọc hiểu e-mail, hội thoại công sở','Handle work e-mails and talks'),null],['advanced',T('Khá trở lên','Advanced'),T('Muốn tối ưu điểm số','Want to maximize the score'),null]]},
    {q:T('Mục tiêu của bạn?','What’s your target?'),pip:T('Mục tiêu giúp mình ước tính khoảng cách và nhịp học.','A target helps me estimate the gap and pace.'),k:'target',opts:(o.exam||'toeic_lr').startsWith('ielts')
      ? [['5.5','Band 5.5','',null],['6.5','Band 6.5',T('Phổ biến cho du học','Common for study abroad'),null],['7.0','Band 7.0','',null],['7.5','Band 7.5+','',null]]
      : [['550','550+','',null],['650','650+',T('Phổ biến cho tốt nghiệp','Common for graduation'),null],['750','750+',T('Phổ biến cho tuyển dụng','Common for hiring'),null],['850','850+','',null]]},
    {q:T('Mỗi ngày bạn có bao nhiêu thời gian?','How much time do you have each day?'),pip:T('Không streak, không áp lực — chỉ để gợi ý độ dài bài.','No streaks, no pressure — it only sets the length of sets.'),k:'minutes',opts:[['10',T('10 phút','10 min'),T('1 bài luyện ngắn','One quick set'),null],['20',T('20 phút','20 min'),T('2 bài ngắn hoặc 1 phần đề','Two sets or one section'),null],['30',T('30 phút','30 min'),'',null],['45',T('45 phút trở lên','45+ min'),T('Có thể làm đề thi thử','Room for a mock test'),null]]},
  ];
  const s=steps[o.step], val=o[s.k], last=o.step===steps.length-1;
  return `<div class="col gap-5" style="${m?'':'padding-top:16px'}">
    <div class="row row--between"><span class="text-sm text-muted">${T('Bước','Step')} ${o.step+1} / 4</span>${btn(T('Bỏ qua','Skip'),{v:'ghost',size:'sm',action:'onbSkip'})}</div>
    ${progressBar(o.step+1,4,{size:'sm',aria:T('Tiến độ','Progress')})}
    <div class="row gap-3" style="align-items:flex-end">${mascot({mood:o.step===3?'happy':'think',size:72})}<div class="speech grow">${s.pip}</div></div>
    <h1 class="text-2xl font-bold tracking-tight">${s.q}</h1>
    <div class="col gap-2 stagger" role="radiogroup" aria-label="${esc(s.q)}">${s.opts.map(([v,t,d,sk])=>`<button type="button" class="choice" role="radio" aria-checked="${val===v}" data-action="onbPick" data-k="${s.k}" data-v="${v}" data-fk="onb:${s.k}:${v}">${sk?skillTile(sk,'sm'):tile(s.k==='minutes'?'stopwatch':s.k==='target'?'target':'circle-question','default','sm')}<span class="grow"><span class="choice__title">${t}</span>${d?`<span class="choice__desc">${d}</span>`:''}</span>${val===v?icon('circle-check-fill',18,'text-accent'):''}</button>`).join('')}</div>
    ${s.k==='target'?`<div class="textfield"><label class="label" for="f-date">${T('Ngày thi dự kiến','Planned exam date')} <span class="text-muted" style="font-weight:400">(${T('không bắt buộc','optional')})</span></label><select id="f-date" class="select"><option>${T('Chưa có lịch','Not scheduled')}</option><option>${T('Trong 1 tháng','Within 1 month')}</option><option>${T('Trong 3 tháng','Within 3 months')}</option><option>${T('Trong 6 tháng','Within 6 months')}</option></select></div>`:''}
    <div class="row">${o.step>0?btn(T('Quay lại','Back'),{v:'tertiary',ic:'chevron-left',action:'onbBack'}):''}<div class="grow"></div>${btn(last?T('Hoàn tất','Finish'):T('Tiếp tục','Continue'),{action:last?'onbFinish':'onbNext',disabled:!val,iconR:'arrow-right'})}</div>
  </div>`;
}
