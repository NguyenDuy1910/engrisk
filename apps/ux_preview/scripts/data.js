/* Deterministic mock data. Names follow schema.dbml. Bilingual fields are [vi, en]. Exam content is English. */
const SKILLS = {
  'listening.question_response':{name:['Hỏi – đáp (Part 2)','Question–response (Part 2)'],practice:'toeic-l-part3'},
  'listening.detail':{name:['Nghe chi tiết','Listening for detail'],practice:'toeic-l-part3'},
  'listening.inference':{name:['Suy luận khi nghe','Listening inference'],practice:'toeic-l-part3'},
  'grammar.preposition':{name:['Giới từ','Prepositions'],practice:'toeic-r-part5'},
  'grammar.verb_form':{name:['Dạng động từ','Verb forms'],practice:'toeic-r-part5'},
  'reading.main_idea':{name:['Ý chính','Main idea'],practice:'toeic-r-part5'},
  'reading.detail':{name:['Đọc chi tiết','Reading for detail'],practice:'toeic-r-part5'},
  'reading.tfng':{name:['True / False / Not Given','True / False / Not Given'],practice:'ielts-r-bees'},
  'reading.completion':{name:['Hoàn thành câu','Sentence completion'],practice:'ielts-r-bees'},
  'reading.vocabulary':{name:['Từ vựng trong ngữ cảnh','Vocabulary in context'],practice:'toeic-r-part5'},
};
const G = {
  g_l3:{type:'audio',title:'Conversation · Part 3',audioSec:7,
    transcript:'W: Hi Daniel, the printer on the third floor is jammed again.\nM: I know. I’ve called the technician, but he can’t come until Thursday.\nW: Thursday? We need to print the client proposals by tomorrow morning.\nM: You could use the printer in the design department. I’ll let them know you’re coming.'},
  g_r7:{type:'passage',title:'E-mail · Part 7',html:'<p><b>To:</b> All staff<br><b>From:</b> Facilities Team<br><b>Subject:</b> East wing renovation</p><p>Starting Monday, June 3, the east wing of the second floor will be closed for renovation. <span class="ev" data-ev="q8">Employees in the east wing will temporarily work in the training center on the first floor.</span> <span class="ev" data-ev="q9">The work is expected to take two weeks.</span></p><p>Parking spaces near the east entrance will also be unavailable during this period. <span class="ev" data-ev="q10">If you have any questions, please call Linh Pham at extension 214.</span></p>'},
  g_bees:{type:'passage',title:'Urban Beekeeping',html:'<p>In the last decade, beekeeping has spread from the countryside into the centre of many large cities. Rooftops in London, Paris and New York now host thousands of hives. <span class="ev" data-ev="b1">Supporters argue that urban bees benefit from the variety of flowers in parks and gardens, which often provide a longer flowering season than farmland treated with pesticides.</span></p><p><span class="ev" data-ev="b2">However, some ecologists warn that the rapid growth in honeybee colonies may increase competition for food with wild bee species.</span> <span class="ev" data-ev="b3">A 2019 survey in London found that the number of hives had doubled in five years, while the amount of flowering plants had not.</span></p><p><span class="ev" data-ev="b4">Researchers therefore recommend that new urban beekeepers plant pollinator-friendly flowers before installing a hive.</span></p>'},
  g_remote:{type:'passage',title:['Trích từ tài liệu của bạn','From your material'],html:'<p><span class="ev" data-ev="gq1">A 2025 survey of 3,000 office workers found that 58% preferred a hybrid schedule, working from home two or three days a week.</span> <span class="ev" data-ev="gq2">Managers reported that collaboration was strongest on days when whole teams came to the office together.</span></p><p><span class="ev" data-ev="gq3">However, employees with long commutes were the most likely to request fully remote <span data-ev="gq4" class="ev">arrangements</span>.</span></p>'},
};
const ABCD = (...t)=>t.map((x,i)=>['ABCD'[i],x]);
const TFNG = [['T','TRUE'],['F','FALSE'],['NG','NOT GIVEN']];
const Q = {
  q1:{section:'L',part:'Part 2',type:'single_choice',hideInMock:true,audioSec:4,stem:'Where is the marketing meeting being held?',options:ABCD('In conference room B.','At three o’clock.','Yes, I held it.'),answer:'A',skill:'listening.question_response',
      transcript:'Where is the marketing meeting being held?\n(A) In conference room B. (B) At three o’clock. (C) Yes, I held it.',
      exp:['Câu hỏi “Where” hỏi địa điểm → (A) nêu địa điểm. (B) trả lời thời gian (dành cho “When”). (C) lặp âm “held” để gây nhiễu và “Yes/No” không trả lời câu hỏi Wh-.','“Where” asks for a place → (A) gives a place. (B) answers “When”. (C) repeats the sound “held” as a distractor, and Yes/No cannot answer a Wh- question.']},
  q2:{section:'L',part:'Part 2',type:'single_choice',hideInMock:true,audioSec:4,stem:'Would you like me to send the invoice today?',options:ABCD('The voice was clear.','Yes, please, before noon.','Two days ago.'),answer:'B',skill:'listening.question_response',
      transcript:'Would you like me to send the invoice today?\n(A) The voice was clear. (B) Yes, please, before noon. (C) Two days ago.',
      exp:['“Would you like me to…?” là lời đề nghị → đáp lại bằng chấp nhận/từ chối: (B). (A) nhiễu âm invoice/voice. (C) trả lời thời điểm trong quá khứ.','“Would you like me to…?” is an offer → reply by accepting or declining: (B). (A) is a sound-alike (invoice/voice). (C) answers a past time.']},
  q3:{section:'L',part:'Part 3',group:'g_l3',type:'single_choice',stem:'What problem does the woman mention?',options:ABCD('A printer is not working.','A client has canceled an order.','A meeting room is unavailable.','A proposal contains errors.'),answer:'A',skill:'listening.detail',
      exp:['Người phụ nữ nói “the printer on the third floor is jammed again” → máy in không hoạt động.','The woman says “the printer on the third floor is jammed again” → the printer is not working.']},
  q4:{section:'L',part:'Part 3',group:'g_l3',type:'single_choice',stem:'When will the technician come?',options:ABCD('Today','Tomorrow morning','On Thursday','Next week'),answer:'C',skill:'listening.detail',
      exp:['“He can’t come until Thursday.” (B) “tomorrow morning” là hạn in tài liệu, không phải lịch của kỹ thuật viên — bẫy thường gặp.','“He can’t come until Thursday.” (B) “tomorrow morning” is the printing deadline, not the technician’s visit — a common trap.']},
  q5:{section:'L',part:'Part 3',group:'g_l3',type:'single_choice',stem:'What does the man offer to do?',options:ABCD('Repair the printer','Contact another department','Print the proposals himself','Reschedule a client meeting'),answer:'B',skill:'listening.inference',
      exp:['“I’ll let them know you’re coming” — “them” là phòng thiết kế → anh ấy sẽ liên hệ phòng ban khác. Đáp án diễn đạt lại, không lặp nguyên văn.','“I’ll let them know you’re coming” — “them” is the design department → he will contact another department. The answer paraphrases rather than repeats.']},
  q6:{section:'R',part:'Part 5',type:'single_choice',stem:'The quarterly report must be submitted ______ Friday afternoon.',options:ABCD('by','until','within','since'),answer:'A',skill:'grammar.preposition',
      exp:['“by + mốc thời gian” = hạn chót (không muộn hơn). “until” diễn tả hành động kéo dài liên tục đến mốc đó, không hợp với “submit” (xảy ra một lần). “within” đi với khoảng thời gian; “since” dùng với thì hoàn thành.','“by + point in time” = a deadline (no later than). “until” describes an action continuing up to that point, which doesn’t fit a one-off action like “submit”. “within” takes a period; “since” goes with perfect tenses.']},
  q7:{section:'R',part:'Part 5',type:'single_choice',stem:'Ms. Tran was ______ for her outstanding contribution to the project.',options:ABCD('recognize','recognized','recognizing','recognition'),answer:'B',skill:'grammar.verb_form',
      exp:['Chủ ngữ “Ms. Tran” nhận hành động → bị động “was + V3”: was recognized.','The subject “Ms. Tran” receives the action → passive “was + past participle”: was recognized.']},
  q8:{section:'R',part:'Part 7',group:'g_r7',type:'single_choice',stem:'What is the purpose of the e-mail?',options:ABCD('To announce a temporary relocation','To introduce a new facilities manager','To request feedback on a training session','To explain a new parking policy'),answer:'A',skill:'reading.main_idea',
      exp:['E-mail báo nhân viên “will temporarily work in the training center” → thông báo chuyển chỗ làm tạm thời. Bãi đỗ xe chỉ là chi tiết phụ.','Staff “will temporarily work in the training center” → it announces a temporary relocation. Parking is a minor detail.']},
  q9:{section:'R',part:'Part 7',group:'g_r7',type:'single_choice',stem:'How long is the renovation expected to take?',options:ABCD('One week','Two weeks','Three weeks','One month'),answer:'B',skill:'reading.detail',
      exp:['“The work is expected to take two weeks.”','“The work is expected to take two weeks.”']},
  q10:{section:'R',part:'Part 7',group:'g_r7',type:'single_choice',stem:'What should employees do if they have questions?',options:ABCD('Visit the training center','Reply to this e-mail','Call an extension','Speak to their manager'),answer:'C',skill:'reading.detail',
      exp:['“Please call Linh Pham at extension 214.” → gọi số máy lẻ.','“Please call Linh Pham at extension 214.” → call an extension.']},
  b1:{section:'R',part:'Questions 1–3',group:'g_bees',type:'single_choice',stem:'Urban bees may have access to flowers for a longer period than bees on farmland.',options:TFNG,answer:'T',skill:'reading.tfng',
      exp:['“…provide a longer flowering season than farmland” → khớp ý → TRUE.','“…provide a longer flowering season than farmland” → matches → TRUE.']},
  b2:{section:'R',part:'Questions 1–3',group:'g_bees',type:'single_choice',stem:'Wild bee species prefer rooftops to parks.',options:TFNG,answer:'NG',skill:'reading.tfng',
      exp:['Bài chỉ nói về cạnh tranh thức ăn; không nói ong hoang dã thích nơi nào → NOT GIVEN. Đừng nhầm “không được nhắc” với “sai”.','The text only mentions competition for food; it never says where wild bees prefer → NOT GIVEN. “Not mentioned” is not “false”.']},
  b3:{section:'R',part:'Questions 1–3',group:'g_bees',type:'single_choice',stem:'The number of flowering plants in London doubled between 2014 and 2019.',options:TFNG,answer:'F',skill:'reading.tfng',
      exp:['Số TỔ ONG tăng gấp đôi “while the amount of flowering plants had not” → mâu thuẫn → FALSE.','The number of HIVES doubled “while the amount of flowering plants had not” → contradiction → FALSE.']},
  b4:{section:'R',part:'Question 4',group:'g_bees',type:'fill_blank',stem:'Researchers advise new urban beekeepers to plant ______ flowers before installing a hive.',limit:'NO MORE THAN TWO WORDS',answer:['pollinator-friendly','pollinator friendly'],skill:'reading.completion',
      exp:['“…plant pollinator-friendly flowers before installing a hive.” Từ ghép có gạch nối tính là MỘT từ.','“…plant pollinator-friendly flowers before installing a hive.” A hyphenated compound counts as ONE word.']},
  gq1:{section:'R',part:'Personal set',group:'g_remote',type:'single_choice',stem:'According to the survey, what did most workers prefer?',options:ABCD('Fully remote work','A hybrid schedule','Five office days','Flexible hours only'),answer:'B',skill:'reading.detail',exp:['“58% preferred a hybrid schedule”.','“58% preferred a hybrid schedule”.'],ai:true},
  gq2:{section:'R',part:'Personal set',group:'g_remote',type:'single_choice',stem:'When was collaboration strongest?',options:ABCD('When whole teams came to the office together','On Fridays','During online meetings','After training sessions'),answer:'A',skill:'reading.detail',exp:['“…strongest on days when whole teams came to the office together.”','“…strongest on days when whole teams came to the office together.”'],ai:true},
  gq3:{section:'R',part:'Personal set',group:'g_remote',type:'single_choice',stem:'Who was most likely to request fully remote work?',options:ABCD('Managers','New employees','Employees with long commutes','Part-time staff'),answer:'C',skill:'reading.detail',exp:['“employees with long commutes were the most likely…”','“employees with long commutes were the most likely…”'],ai:true},
  gq4:{section:'R',part:'Personal set',group:'g_remote',type:'single_choice',stem:'The word “arrangements” is closest in meaning to',options:ABCD('agreements','decorations','complaints','schedules'),answer:'A',skill:'reading.vocabulary',exp:['“arrangements” ở đây = thỏa thuận làm việc.','Here “arrangements” = working agreements.'],ai:true,
      lowConfidence:['AI không chắc: (A) và (D) đều có thể chấp nhận. Nên sửa phương án D trước khi duyệt.','AI is unsure: (A) and (D) could both be accepted. Edit option D before approving.']},
};
const EXAMS = {
  'toeic-mini-mock':{track:'toeic',title:['TOEIC Mini Mock 01','TOEIC Mini Mock 01'],kind:'full_mock',skill:null,count:10,minutes:15,diff:3,tier:'guest',mode:'mock',qids:['q1','q2','q3','q4','q5','q6','q7','q8','q9','q10'],seconds:900,
    desc:['Bản rút gọn đủ cấu trúc Listening + Reading để làm quen áp lực thời gian và quy tắc phòng thi.','A shortened test with the full Listening + Reading structure to get used to timing and exam rules.']},
  'toeic-l-part3':{track:'toeic',title:['Listening Part 2–3: Hội thoại công sở','Listening Part 2–3: Office conversations'],kind:'practice_set',skill:'listening',count:5,minutes:5,diff:2,tier:'guest',mode:'practice',qids:['q1','q2','q3','q4','q5'],
    desc:['Câu hỏi – đáp và hội thoại ngắn. Nghe lại thoải mái, xem transcript sau khi trả lời.','Question–response and short talks. Replay freely, read the transcript after answering.']},
  'toeic-r-part5':{track:'toeic',title:['Reading Part 5 & 7: Ngữ pháp và e-mail','Reading Part 5 & 7: Grammar and e-mail'],kind:'practice_set',skill:'reading',count:5,minutes:6,diff:3,tier:'guest',mode:'practice',qids:['q6','q7','q8','q9','q10'],
    desc:['Giới từ, dạng động từ và một e-mail ngắn. Kiểm tra từng câu ngay.','Prepositions, verb forms and a short e-mail. Check each answer instantly.']},
  'toeic-full-01':{track:'toeic',title:['TOEIC Full Test 01','TOEIC Full Test 01'],kind:'full_mock',skill:null,count:200,minutes:120,diff:4,tier:'registered',mode:'mock',qids:['q1','q2','q3','q4','q5','q6','q7','q8','q9','q10'],seconds:7200,demoNote:true,
    desc:['Đề đầy đủ 200 câu, 120 phút, điểm quy đổi ước tính 10–990.','Full 200-question, 120-minute test with an estimated 10–990 score.']},
  'toeic-r-part7-dbl':{track:'toeic',title:['Reading Part 7: Đoạn kép','Reading Part 7: Double passages'],kind:'section_test',skill:'reading',count:25,minutes:30,diff:5,tier:'premium',mode:'mock',qids:[],
    desc:['Luyện chuyên sâu đoạn kép/ba đoạn.','In-depth double and triple passages.']},
  'ielts-r-bees':{track:'ielts',title:['Reading: Urban Beekeeping','Reading: Urban Beekeeping'],kind:'practice_set',skill:'reading',count:4,minutes:8,diff:3,tier:'guest',mode:'practice',qids:['b1','b2','b3','b4'],
    desc:['True/False/Not Given và hoàn thành câu với một đoạn văn học thuật ngắn.','True/False/Not Given and sentence completion on a short academic text.']},
  'ielts-w-task2':{track:'ielts',title:['Writing Task 2: Làm việc từ xa','Writing Task 2: Remote work'],kind:'practice_set',skill:'writing',count:1,minutes:40,diff:3,tier:'registered',mode:'practice',screen:'writing',phase:'P2',qids:[],
    desc:['Bài luận 250+ từ. AI chấm ước tính theo 4 tiêu chí IELTS.','A 250+ word essay. AI gives an estimated band on the 4 IELTS criteria.']},
  'ielts-s-part2':{track:'ielts',title:['Speaking Part 2: Một nơi bạn thích','Speaking Part 2: A place you like'],kind:'practice_set',skill:'speaking',count:1,minutes:4,diff:3,tier:'registered',mode:'practice',screen:'speaking',phase:'P2',qids:[],
    desc:['1 phút chuẩn bị, nói 1–2 phút. Ghi âm và nhận nhận xét AI.','1 minute to prepare, speak for 1–2 minutes. Record and get AI feedback.']},
  'ielts-l-mock-01':{track:'ielts',title:['IELTS Listening Mock 01','IELTS Listening Mock 01'],kind:'full_mock',skill:'listening',count:40,minutes:30,diff:4,tier:'registered',mode:'mock',comingSoon:true,qids:[],
    desc:['4 phần, 40 câu.','4 parts, 40 questions.']},
};
const KIND = {full_mock:['Thi thử','Mock test'],section_test:['Theo phần','Section test'],practice_set:['Luyện ngắn','Quick practice'],personal_practice:['Bộ riêng','Personal set']};
const SKILL_AREA = {listening:'Listening',reading:'Reading',writing:'Writing',speaking:'Speaking'};
const SKILL_ICON = {listening:'headphones',reading:'book-open',writing:'pencil',speaking:'microphone'};
const SECTION = {L:'Listening',R:'Reading'};
const diffLabel = d => d<=2?T('Dễ','Easy'):d===3?T('Trung bình','Medium'):T('Khó','Hard');
const CANNED = {
  'toeic-mini-mock':{q1:'A',q2:'A',q3:'A',q4:'B',q5:'B',q6:'B',q7:'B',q8:'A',q9:'B',q10:'A'},
  'toeic-r-part5':{q6:'B',q7:'B',q8:'A',q9:'B',q10:'A'},
  'toeic-l-part3':{q1:'A',q2:'B',q3:'A',q4:'C',q5:'A'},
  'ielts-r-bees':{b1:'T',b2:'F',b3:'F',b4:'pollinator flowers'},
};
const HISTORY = [
  {date:'2026-10-26',exam:'toeic-mini-mock',mode:'mock',status:'in_progress',score:['Câu 6/10','Q 6/10'],mins:6},
  {date:'2026-10-24',exam:'toeic-r-part5',mode:'practice',status:'completed',score:'3/5',mins:7},
  {date:'2026-10-22',exam:'toeic-mini-mock',mode:'mock',status:'completed',score:'600',est:true,mins:15},
  {date:'2026-10-19',exam:'toeic-l-part3',mode:'practice',status:'completed',score:'4/5',mins:6},
  {date:'2026-10-15',exam:'ielts-r-bees',mode:'practice',status:'completed',score:'2/4',mins:9},
  {date:'2026-10-12',exam:'toeic-full-01',mode:'mock',status:'abandoned',score:'—',mins:22},
];
const TREND = [{d:'2026-10-01',v:525},{d:'2026-10-08',v:550},{d:'2026-10-15',v:570},{d:'2026-10-22',v:600}];
const MASTERY = [['grammar.preposition',.42],['listening.inference',.55],['reading.detail',.61],['grammar.verb_form',.64],['reading.main_idea',.72],['listening.question_response',.8]];
const WEEK = [[['T2','Mon'],20],[['T3','Tue'],0],[['T4','Wed'],35],[['T5','Thu'],15],[['T6','Fri'],0],[['T7','Sat'],25],[['CN','Sun'],0]];
const W_PROMPT = 'Some people believe that working from home benefits both employees and employers, while others think it causes more problems. Discuss both views and give your own opinion.';
const W_SAMPLE = 'Nowadays, many company allow their staff to work from home. Some peoples think this is good for both sides, while others disagree. In my opinion, the benefits is bigger than the problems.\n\nOn the one hand, working from home save time because employees do not need to commute. For example, my sister spend two hours every day on the bus before her company let her work remotely. Employers can also reduce the cost of office space.\n\nOn the other hand, some managers worry that teamwork become weaker when people rarely meet. New employees may also feel lonely and learn slower.';
const TUTOR_CHIPS = [
  {id:'why',label:['Vì sao đáp án mình chọn sai?','Why is my answer wrong?'],reply:q=>q.skill==='grammar.preposition'
    ?['“until Friday” nghĩa là việc nộp kéo dài liên tục đến thứ Sáu — không hợp lý với hành động xảy ra một lần. Dùng “until” với động từ trạng thái: “wait until”, “stay open until”.','“until Friday” means the submitting keeps going until Friday — which doesn’t make sense for a one-off action. Use “until” with ongoing verbs: “wait until”, “stay open until”.']
    :['Phương án bạn chọn có từ xuất hiện trong bài nhưng không trả lời đúng câu hỏi — bẫy “lặp từ” phổ biến trong TOEIC.','Your option repeats words from the text but doesn’t answer the question — a common TOEIC “word-match” trap.']},
  {id:'similar',label:['Cho mình 3 câu tương tự','Give me 3 similar questions'],reply:()=> '__REC__'},
  {id:'tip',label:['Mẹo nhớ nhanh?','Any quick tip?'],reply:()=>['“by” = trước hoặc đúng hạn (deadline). “until” = kéo dài đến (duration). Gợi nhớ: “Submit BY, wait UNTIL.”','“by” = on or before a deadline. “until” = continuing up to a point. Remember: “Submit BY, wait UNTIL.”']},
];
const SCREENS = {
  landing:{j:'A',name:'Landing / Khám phá',chrome:'public',phase:'P1',url:'/',states:['default'],purpose:'Giá trị cốt lõi, linh vật Pip, chọn ngôn ngữ, vào luyện ngay không cần đăng ký.',data:['exams','exam_revisions','exam_types','users.locale']},
  auth:{j:'B',name:'Đăng nhập / Đăng ký',chrome:'public',phase:'P1',url:'/login',states:['default','loading','error'],purpose:'Email/mật khẩu, Google, chuyển tài khoản khách thành tài khoản thật.',data:['users','auth_identities','auth_sessions','auth_tokens','tenant_memberships','membership_roles']},
  onboarding:{j:'C',name:'Onboarding mục tiêu',chrome:'public',phase:'P1',url:'/onboarding',states:['default'],purpose:'4 câu hỏi ngắn, Pip dẫn dắt, luôn có thể bỏ qua.',data:['learner_goals','exam_types']},
  home:{j:'D',name:'Dashboard',chrome:'app',nav:'home',phase:'P1',url:'/home',states:['default','loading','empty','error'],purpose:'Một hành động tiếp theo rõ ràng: tiếp tục, gợi ý, điểm yếu.',data:['attempts','learner_goals','learner_skill_stats','attempt_scores','exams']},
  catalog:{j:'E',name:'Danh mục bài luyện',chrome:'app',nav:'catalog',phase:'P1',url:'/practice',states:['default','loading','empty','error'],purpose:'Chọn TOEIC/IELTS, luyện ngắn hay thi thử, theo kỹ năng.',data:['exams','exam_revisions','exam_types','exam_licenses (P4)']},
  'exam-intro':{j:'E',name:'Giới thiệu bài',chrome:'app',nav:'catalog',phase:'P1',url:'/practice/:slug',states:['default'],purpose:'Cấu trúc, quy tắc chế độ thi, bắt đầu/tiếp tục.',data:['exams','exam_revisions','attempts']},
  exam:{j:'F',name:'Làm bài (Reading/Listening)',chrome:'focus',phase:'P1',url:'/attempts/:id',states:['default','error'],purpose:'Chế độ tập trung: timer, điều hướng câu, đánh dấu, tự lưu, nộp bài.',data:['attempts','attempt_responses','exam_revision_items','questions','question_groups','content_assets']},
  writing:{j:'F',name:'IELTS Writing',chrome:'focus',phase:'P2',url:'/attempts/:id (writing)',states:['default','error'],purpose:'Soạn bài dài trên màn hình lớn; AI chấm ước tính.',data:['attempts','attempt_responses','evaluations','ai_runs']},
  speaking:{j:'F',name:'IELTS Speaking',chrome:'focus',phase:'P2',url:'/attempts/:id (speaking)',states:['default'],purpose:'Quyền micro, chuẩn bị, ghi âm, nộp, nhận xét AI.',data:['attempts','attempt_responses','content_assets','evaluations','ai_runs']},
  results:{j:'G',name:'Kết quả',chrome:'app',nav:'progress',phase:'P1',url:'/attempts/:id/result',states:['default','loading'],purpose:'Ăn mừng có chừng mực, điểm (ước tính), kỹ năng, bước tiếp theo.',data:['attempts','attempt_scores','attempt_responses','question_skills','skills','learner_skill_stats']},
  review:{j:'G',name:'Xem lại đáp án',chrome:'app',nav:'progress',phase:'P1',url:'/attempts/:id/review/:n',states:['default'],purpose:'Đáp án đã kiểm duyệt + giải thích + bằng chứng trong bài.',data:['attempt_responses','questions','question_groups']},
  tutor:{j:'H',name:'AI Tutor',chrome:'app',nav:'tutor',phase:'P1',url:'/tutor/:conversationId',states:['default','empty','error','quota'],purpose:'Giải thích câu sai, hỏi tiếp, gợi ý luyện tập — tách bạch AI và đáp án kiểm duyệt.',data:['tutor_conversations','tutor_messages','ai_runs','tenant_entitlements']},
  library:{j:'I',name:'Tài liệu & tạo câu hỏi AI',chrome:'app',nav:'library',phase:'P3',url:'/library',states:['default','empty','error'],purpose:'Tải tài liệu riêng tư → xử lý → AI tạo nháp → duyệt → bộ luyện riêng.',data:['content_assets','source_materials','ai_runs','question_groups','questions','exams','exam_revisions']},
  progress:{j:'J',name:'Tiến độ & lịch sử',chrome:'app',nav:'progress',phase:'P1',url:'/progress',states:['default','loading','empty'],purpose:'Xu hướng điểm ước tính, kỹ năng, lịch sử bài làm.',data:['attempts','attempt_scores','learner_skill_stats','skills']},
  profile:{j:'J',name:'Tài khoản, giao diện & ngôn ngữ',chrome:'app',nav:'profile',phase:'P1',url:'/account',states:['default'],purpose:'Mục tiêu, giao diện (5 preset HeroUI + sáng/tối), ngôn ngữ, đăng nhập, tổ chức.',data:['users (locale, preferences)','auth_identities','learner_goals','tenant_memberships','auth_sessions']},
  org:{j:'K',name:'Tổ chức (xem trước)',chrome:'app',nav:'org',phase:'P4',url:'/org/sunrise',states:['default'],purpose:'Lời mời, chuyển ngữ cảnh tenant, thương hiệu, nội dung được cấp phép.',data:['tenants','tenant_invitations','tenant_memberships','membership_roles','exam_licenses','tenant_entitlements']},
  'design-system':{j:'DS',name:'Theme & Components',chrome:'doc',phase:'—',url:'design-system',states:['default'],purpose:'Theme HeroUI (5 preset từ Theme Builder), motion, linh vật, i18n, component và pattern. Chỉ phục vụ review.',data:[]},
};
const JOURNEYS = {DS:'Design System',A:'Khám phá',B:'Xác thực',C:'Onboarding',D:'Dashboard',E:'Danh mục',F:'Làm bài',G:'Kết quả & xem lại',H:'AI Tutor',I:'Tải lên & AI tạo câu hỏi',J:'Hồ sơ & lịch sử',K:'Tổ chức (tương lai)'};
const TENANTS = {engrisk:{name:'Engrisk',sub:['Cá nhân · Học viên','Personal · Learner'],mark:'E'},sunrise:{name:'Sunrise English',sub:['Học viên · Phase 4','Learner · Phase 4'],mark:'S'}};
/* HeroUI Theme Builder presets offered to learners (brand-named presets excluded: trademarks) */
const PALETTES = [
  {id:'default',name:'Default',vi:'Xanh dương',accent:'oklch(62.04% 0.1950 253.83)',fg:'oklch(99.11% 0 0)',bg:'oklch(97.02% 0.0015 253.83)'},
  {id:'sky',name:'Sky',vi:'Bầu trời',accent:'oklch(78.00% 0.1600 225.00)',fg:'oklch(15% 0.0300 225.00)',bg:'oklch(97.02% 0.0015 225.00)'},
  {id:'lavender',name:'Lavender',vi:'Oải hương',accent:'oklch(77.00% 0.1300 305.00)',fg:'oklch(15% 0.0260 305.00)',bg:'oklch(97.02% 0.0015 305.00)'},
  {id:'mint',name:'Mint',vi:'Bạc hà',accent:'oklch(82.00% 0.1200 155.00)',fg:'oklch(15% 0.0240 155.00)',bg:'oklch(97.02% 0.0015 155.00)'},
  {id:'rabbit',name:'Rabbit',vi:'Cam đào',accent:'oklch(66.78% 0.2232 36.66)',fg:'oklch(15% 0.0300 36.66)',bg:'oklch(97.02% 0.0100 36.66)'},
];
const ORG_ACCENTS = [['Xanh ngọc','Teal','#008080'],['Chàm','Indigo','#2662D9'],['Tím','Purple','#AD5CD6']];
