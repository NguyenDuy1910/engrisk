/* Content registry: skills, merged question/group banks, exam catalog, deterministic demo answers. */
const SKILLS = {
  'listening.photo':{name:['Mô tả tranh','Photographs'],practice:'toeic-test-01',part:'P1'},
  'listening.question_response':{name:['Hỏi – đáp','Question–response'],practice:'toeic-l-part3',part:'P2'},
  'listening.detail':{name:['Nghe chi tiết','Listening for detail'],practice:'toeic-l-part3',part:'P3'},
  'listening.inference':{name:['Suy luận khi nghe','Listening inference'],practice:'toeic-l-part3',part:'P3'},
  'listening.graphic':{name:['Câu hỏi đồ họa','Graphic questions'],practice:'toeic-test-01',part:'P4'},
  'grammar.preposition':{name:['Giới từ','Prepositions'],practice:'toeic-r-part5',part:'P5'},
  'grammar.verb_form':{name:['Dạng động từ','Verb forms'],practice:'toeic-r-part5',part:'P5'},
  'grammar.word_form':{name:['Từ loại','Word forms'],practice:'toeic-r-part5',part:'P5'},
  'grammar.connector':{name:['Liên từ & giới từ nối','Connectors'],practice:'toeic-r-part5',part:'P5'},
  'reading.insertion':{name:['Chèn câu','Sentence insertion'],practice:'toeic-test-01',part:'P6'},
  'reading.main_idea':{name:['Ý chính','Main idea'],practice:'toeic-r-part5',part:'P7'},
  'reading.detail':{name:['Đọc chi tiết','Reading for detail'],practice:'toeic-r-part5',part:'P7'},
  'reading.cross_reference':{name:['Liên kết nhiều văn bản','Cross-referencing texts'],practice:'toeic-test-01',part:'P7'},
  'reading.vocabulary':{name:['Từ vựng trong ngữ cảnh','Vocabulary in context'],practice:'toeic-r-part5',part:'P7'},
  'reading.tfng':{name:['True / False / Not Given','True / False / Not Given'],practice:'ielts-r-bees',part:'R1'},
  'reading.completion':{name:['Hoàn thành tóm tắt','Summary completion'],practice:'ielts-r-bees',part:'R1'},
  'reading.headings':{name:['Nối tiêu đề đoạn','Matching headings'],practice:'ielts-r-test-01',part:'R2'},
  'reading.multi':{name:['Chọn nhiều đáp án','Multiple choice (choose two)'],practice:'ielts-r-test-01',part:'R2'},
  'reading.matching_features':{name:['Nối đặc điểm','Matching features'],practice:'ielts-r-test-01',part:'R3'},
  'listening.form':{name:['Điền form','Form completion'],practice:'ielts-l-test-01',part:'L1'},
  'listening.map':{name:['Gắn nhãn bản đồ','Map labelling'],practice:'ielts-l-test-01',part:'L2'},
  'listening.multi':{name:['Chọn nhiều đáp án (nghe)','Multiple choice (listening)'],practice:'ielts-l-test-01',part:'L3'},
  'listening.notes':{name:['Điền ghi chú','Note completion'],practice:'ielts-l-test-01',part:'L4'},
};
const ALL_PARTS = {...PARTS,...IELTS_PARTS};
const G = {...TOEIC_G,...IELTS_G,
  g_remote:{part:'PX',type:'passage',title:['Trích từ tài liệu của bạn','From your material'],html:'<p><span class="ev" data-ev="gq1">A 2025 survey of 3,000 office workers found that 58% preferred a hybrid schedule, working from home two or three days a week.</span> <span class="ev" data-ev="gq2">Managers reported that collaboration was strongest on days when whole teams came to the office together.</span></p><p><span class="ev" data-ev="gq3">However, employees with long commutes were the most likely to request fully remote <span data-ev="gq4" class="ev">arrangements</span>.</span></p>'},
};
const PERSONAL_Q = {
  gq1:{n:1,bank:'personal',part:'PX',section:'R',group:'g_remote',type:'single',stem:'According to the survey, what did most workers prefer?',options:ABCD('Fully remote work','A hybrid schedule','Five office days','Flexible hours only'),answer:'B',skill:'reading.detail',exp:['“58% preferred a hybrid schedule”.','“58% preferred a hybrid schedule”.'],ai:true},
  gq2:{n:2,bank:'personal',part:'PX',section:'R',group:'g_remote',type:'single',stem:'When was collaboration strongest?',options:ABCD('When whole teams came to the office together','On Fridays','During online meetings','After training sessions'),answer:'A',skill:'reading.detail',exp:['“…strongest on days when whole teams came to the office together.”','“…strongest on days when whole teams came to the office together.”'],ai:true},
  gq3:{n:3,bank:'personal',part:'PX',section:'R',group:'g_remote',type:'single',stem:'Who was most likely to request fully remote work?',options:ABCD('Managers','New employees','Employees with long commutes','Part-time staff'),answer:'C',skill:'reading.detail',exp:['“employees with long commutes were the most likely…”','“employees with long commutes were the most likely…”'],ai:true},
  gq4:{n:4,bank:'personal',part:'PX',section:'R',group:'g_remote',type:'single',stem:'The word “arrangements” is closest in meaning to',options:ABCD('agreements','decorations','complaints','schedules'),answer:'A',skill:'reading.vocabulary',exp:['“arrangements” ở đây = thỏa thuận làm việc.','Here “arrangements” = working agreements.'],ai:true,
      lowConfidence:['AI không chắc: (A) và (D) đều có thể chấp nhận. Nên sửa phương án D trước khi duyệt.','AI is unsure: (A) and (D) could both be accepted. Edit option D before approving.']},
};
ALL_PARTS.PX = {section:'R',real:null,range:'',name:['Bộ riêng','Personal set'],short:'Personal set',icon:'folder'};
const Q = {...TOEIC_Q,...IELTS_Q,...PERSONAL_Q};
const firstNum = q => Array.isArray(q.n) ? q.n[0] : q.n;
const numLabel = q => Array.isArray(q.n) ? `${q.n[0]}–${q.n[q.n.length-1]}` : String(q.n);
const pointsOf = q => q.type==='multi' ? q.pick : 1;
const partQids = (bank,part) => Object.keys(Q).filter(k=>Q[k].bank===bank&&Q[k].part===part).sort((a,b)=>firstNum(Q[a])-firstNum(Q[b]));

const EXAMS = {
  'toeic-test-01':{track:'toeic',layout:'toeic',bank:'toeic01',title:['TOEIC Practice Test 01','TOEIC Practice Test 01'],kind:'full_mock',skill:null,count:200,minutes:120,diff:3,tier:'guest',mode:'mock',
    sections:[{key:'L',minutes:45,paced:true,parts:['P1','P2','P3','P4']},{key:'R',minutes:75,parts:['P5','P6','P7']}],
    desc:['Đề đủ 7 Part theo cấu trúc ETS. Bản demo có 25 câu mẫu giữ đúng số thứ tự câu của đề thật.','All 7 parts in the ETS structure. The demo contains 25 sample questions with real question numbers.']},
  'toeic-test-02':{track:'toeic',layout:'toeic',bank:'toeic01',title:['TOEIC Practice Test 02','TOEIC Practice Test 02'],kind:'full_mock',skill:null,count:200,minutes:120,diff:4,tier:'registered',mode:'mock',demoNote:true,
    sections:[{key:'L',minutes:45,paced:true,parts:['P1','P2','P3','P4']},{key:'R',minutes:75,parts:['P5','P6','P7']}],
    desc:['Độ khó cao hơn ở Part 7 đoạn kép/ba.','Harder multiple-passage sets in Part 7.']},
  'toeic-test-03':{track:'toeic',layout:'toeic',bank:'toeic01',title:['TOEIC Practice Test 03','TOEIC Practice Test 03'],kind:'full_mock',skill:null,count:200,minutes:120,diff:5,tier:'premium',mode:'mock',
    sections:[{key:'L',minutes:45,paced:true,parts:['P1','P2','P3','P4']},{key:'R',minutes:75,parts:['P5','P6','P7']}],desc:['Đề nâng cao cho mục tiêu 850+.','Advanced test for 850+ targets.']},
  'toeic-l-part3':{track:'toeic',layout:'toeic',title:['Listening Part 2–3: Hội thoại công sở','Listening Part 2–3: Office conversations'],kind:'practice_set',skill:'listening',count:6,minutes:6,diff:2,tier:'guest',mode:'practice',qids:['t7','t8','t9','t32','t33','t34'],
    desc:['Hỏi – đáp và một hội thoại. Nghe lại, đổi tốc độ, xem transcript sau khi trả lời.','Question–response and a conversation. Replay, change speed, read the transcript after answering.']},
  'toeic-r-part5':{track:'toeic',layout:'toeic',title:['Reading Part 5 & 7: Ngữ pháp và e-mail','Reading Part 5 & 7: Grammar and e-mail'],kind:'practice_set',skill:'reading',count:7,minutes:8,diff:3,tier:'guest',mode:'practice',qids:['t101','t102','t103','t104','t147','t148','t149'],
    desc:['Giới từ, từ loại, liên từ và một e-mail ngắn. Kiểm tra từng câu ngay.','Prepositions, word forms, connectors and a short e-mail. Check each answer instantly.']},
  'ielts-r-test-01':{track:'ielts',layout:'ielts',bank:'ielts-r01',title:['IELTS Academic Reading — Test 01','IELTS Academic Reading — Test 01'],kind:'full_mock',skill:'reading',count:40,minutes:60,diff:3,tier:'guest',mode:'mock',
    sections:[{key:'R',minutes:60,parts:['R1','R2','R3']}],
    desc:['3 passage, 60 phút, giao diện như IELTS trên máy tính. Bản demo: 16 câu mẫu, đủ 5 dạng câu hỏi.','3 passages, 60 minutes, computer-delivered layout. Demo: 16 sample questions across 5 question types.']},
  'ielts-l-test-01':{track:'ielts',layout:'ielts',bank:'ielts-l01',title:['IELTS Listening — Test 01','IELTS Listening — Test 01'],kind:'full_mock',skill:'listening',count:40,minutes:30,diff:3,tier:'guest',mode:'mock',
    sections:[{key:'L',minutes:30,paced:true,parts:['L1','L2','L3','L4'],check:120}],
    desc:['4 phần, audio phát một lần, gõ đáp án trực tiếp, 2 phút kiểm tra cuối bài. Bản demo: 15 câu mẫu.','4 parts, audio plays once, type answers directly, 2-minute check at the end. Demo: 15 sample questions.']},
  'ielts-r-bees':{track:'ielts',layout:'ielts',title:['Reading: Urban Beekeeping','Reading: Urban Beekeeping'],kind:'practice_set',skill:'reading',count:7,minutes:10,diff:3,tier:'guest',mode:'practice',qids:['i1','i2','i3','i4','i5','i6','i7'],
    desc:['True/False/Not Given và hoàn thành tóm tắt trên một passage học thuật ngắn.','True/False/Not Given and summary completion on a short academic passage.']},
  'ielts-w-task2':{track:'ielts',title:['Writing Task 2: Làm việc từ xa','Writing Task 2: Remote work'],kind:'practice_set',skill:'writing',count:1,minutes:40,diff:3,tier:'registered',mode:'practice',screen:'writing',phase:'P2',qids:[],
    desc:['Bài luận 250+ từ. AI chấm ước tính theo 4 tiêu chí IELTS.','A 250+ word essay. AI gives an estimated band on the 4 IELTS criteria.']},
  'ielts-s-part2':{track:'ielts',title:['Speaking Part 2: Một nơi bạn thích','Speaking Part 2: A place you like'],kind:'practice_set',skill:'speaking',count:1,minutes:4,diff:3,tier:'registered',mode:'practice',screen:'speaking',phase:'P2',qids:[],
    desc:['1 phút chuẩn bị, nói 1–2 phút. Ghi âm và nhận nhận xét AI.','1 minute to prepare, speak for 1–2 minutes. Record and get AI feedback.']},
  /* Community sets (published after review; credited, licensed). qids reuse the demo bank of the matching Part/type. */
  'cm-p5-prepositions':{track:'toeic',layout:'toeic',title:['Part 5 · Giới từ chỉ thời gian','Part 5 · Time prepositions'],kind:'practice_set',skill:'reading',count:10,minutes:8,diff:2,tier:'guest',mode:'practice',qids:['t101','t102','t103','t104'],
    origin:'community',author:'minh',rating:4.7,plays:1240,license:'CC BY 4.0',
    desc:['in / on / at / by / until trong ngữ cảnh công sở. Có giải thích từng câu.','in / on / at / by / until in workplace contexts. Explanations for every item.']},
  'cm-p6-memos':{track:'toeic',layout:'toeic',title:['Part 6 · Thông báo nội bộ','Part 6 · Internal memos'],kind:'practice_set',skill:'reading',count:8,minutes:8,diff:3,tier:'guest',mode:'practice',qids:['t131','t132','t133','t134'],
    origin:'community',author:'lan',rating:4.8,plays:3105,license:'CC BY 4.0',
    desc:['Điền từ và chèn câu trong thông báo, memo nội bộ.','Text completion and sentence insertion in internal memos.']},
  'cm-p2-replies':{track:'toeic',layout:'toeic',title:['Part 2 · Phản hồi nhanh','Part 2 · Quick replies'],kind:'practice_set',skill:'listening',count:25,minutes:9,diff:2,tier:'guest',mode:'practice',qids:['t7','t8','t9'],
    origin:'community',author:'kenji',rating:4.5,plays:860,license:'CC BY 4.0',
    desc:['Câu hỏi Wh-, Yes/No và câu gián tiếp; giọng Anh, Mỹ, Úc.','Wh-, yes/no and indirect questions; British, American and Australian voices.']},
  'cm-ielts-tfng':{track:'ielts',layout:'ielts',title:['TFNG: Ong trong thành phố','TFNG: Bees in the city'],kind:'practice_set',skill:'reading',count:12,minutes:15,diff:3,tier:'guest',mode:'practice',qids:['i1','i2','i3','i4'],
    origin:'community',author:'tram',rating:4.6,plays:540,license:'CC BY 4.0',
    desc:['True / False / Not Given trên một passage học thuật ngắn.','True / False / Not Given on a short academic passage.']},
  /* Tenant (Sunrise English) content: members only, assigned by a teacher */
  'sr-midterm':{track:'toeic',layout:'toeic',bank:'toeic01',title:['Kiểm tra giữa kỳ · TOEIC 550+','Mid-term mock · TOEIC 550+'],kind:'full_mock',skill:null,count:200,minutes:120,diff:3,tier:'registered',mode:'mock',
    sections:[{key:'L',minutes:45,paced:true,parts:['P1','P2','P3','P4']},{key:'R',minutes:75,parts:['P5','P6','P7']}],
    origin:'tenant',tenant:'sunrise',author:'hanh',assignedBy:'hanh',due:'2026-11-08',
    desc:['Đề giữa kỳ lớp TOEIC 550+ (Sunrise English). Kết quả gửi cho giáo viên.','Mid-term mock for the TOEIC 550+ class (Sunrise English). Results are shared with your teacher.']},
  'sr-hw-week6':{track:'toeic',layout:'toeic',title:['Bài tập tuần 6 · Part 5','Homework week 6 · Part 5'],kind:'practice_set',skill:'reading',count:15,minutes:12,diff:2,tier:'registered',mode:'practice',qids:['t101','t102','t103','t104'],
    origin:'tenant',tenant:'sunrise',author:'hanh',assignedBy:'hanh',due:'2026-10-31',
    desc:['Từ loại và giới từ — bài tập về nhà tuần 6.','Word forms and prepositions — week 6 homework.']},
};
/** Part keys of an exam (from sections, or derived from an explicit qid list) */
const examParts = ex => ex.sections ? ex.sections.flatMap(s=>s.parts) : [...new Set((ex.qids||[]).map(id=>Q[id].part))];
/** Ordered qids of an exam, optionally limited to selected parts */
const examQids = (ex,parts) => { const ps=parts||examParts(ex); return ex.qids ? ex.qids.filter(id=>ps.includes(Q[id].part)) : ps.flatMap(p=>partQids(ex.bank,p)); };
const examLayout = ex => ex.layout || (examQids(ex).some(id=>Q[id].set)?'ielts':'toeic');
const KIND = {full_mock:['Đề thi thử','Full test'],section_test:['Theo phần','Section test'],practice_set:['Luyện ngắn','Quick practice'],personal_practice:['Bộ riêng','Personal set']};
const SKILL_AREA = {listening:'Listening',reading:'Reading',writing:'Writing',speaking:'Speaking'};
const SKILL_ICON = {listening:'headphones',reading:'book-open',writing:'pencil',speaking:'microphone'};
const SECTION = {L:'Listening',R:'Reading'};
const diffLabel = d => d<=2?T('Dễ','Easy'):d===3?T('Trung bình','Medium'):T('Khó','Hard');
/* Deterministic demo answers (used for history → results) */
const CANNED = {
  'toeic-test-01':{t1:'B',t2:'A',t7:'A',t8:'B',t9:'C',t32:'A',t33:'B',t34:'B',t71:'A',t72:'B',t73:'A',t101:'B',t102:'B',t103:'B',t104:'B',t131:'A',t132:'A',t133:'B',t134:'A',t147:'A',t148:'B',t149:'C',t176:'A',t177:'B',t178:'D'},
  'toeic-r-part5':{t101:'B',t102:'B',t103:'A',t104:'A',t147:'A',t148:'B',t149:'A'},
  'toeic-l-part3':{t7:'A',t8:'B',t9:'A',t32:'A',t33:'C',t34:'A'},
  'ielts-r-bees':{i1:'TRUE',i2:'FALSE',i3:'FALSE',i4:'TRUE',i5:'pollinator',i6:'competition',i7:'week'},
  'ielts-r-test-01':{i1:'TRUE',i2:'FALSE',i3:'FALSE',i4:'TRUE',i5:'pollinator-friendly',i6:'competition',i7:'weekend',i14:'iii',i15:'iv',i16:'v',i17:'vii',i18:['A','B'],i27:'A',i28:'B',i29:'A'},
  'ielts-l-test-01':{l1:'Dawson',l2:'June',l3:'full',l4:'28',l5:'yoga',l11:'C',l12:'E',l13:'A',l14:'D',l21:['A','B'],l23:'B',l31:'concrete',l32:'tree',l33:'night'},
};
const HISTORY = [
  {date:'2026-10-26',exam:'toeic-test-01',mode:'mock',status:'in_progress',score:['Câu 104 / 200','Q 104 / 200'],mins:38},
  {date:'2026-10-24',exam:'toeic-r-part5',mode:'practice',status:'completed',score:'4/7',mins:7},
  {date:'2026-10-22',exam:'toeic-test-01',mode:'mock',status:'completed',score:'600',est:true,mins:118},
  {date:'2026-10-19',exam:'toeic-l-part3',mode:'practice',status:'completed',score:'4/6',mins:6},
  {date:'2026-10-15',exam:'ielts-r-bees',mode:'practice',status:'completed',score:'4/7',mins:9},
  {date:'2026-10-12',exam:'toeic-test-02',mode:'mock',status:'abandoned',score:'—',mins:22},
];
/* Learner's accuracy per part (for catalog/setup); deterministic */
const PART_STATS = {P1:.83,P2:.68,P3:.61,P4:.57,P5:.52,P6:.63,P7:.66,R1:.71,R2:.48,R3:.55,L1:.8,L2:.6,L3:.5,L4:.65};
