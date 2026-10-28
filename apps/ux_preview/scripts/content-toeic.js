/* TOEIC Listening & Reading — demo content with REAL question numbering and part structure.
 * Original (non-ETS) items written for the prototype. Bank "toeic01" = TOEIC Practice Test 01.
 * Audio is simulated: `sec` = demo duration, `lines` = timed transcript [startSec, speaker, text]. */
const ABCD = (...t)=>t.map((x,i)=>['ABCD'[i],x]);
const TFNG = [['TRUE','TRUE'],['FALSE','FALSE'],['NOT GIVEN','NOT GIVEN']];

/* Part definitions (real counts from the ETS examinee handbook) */
const PARTS = {
  P1:{section:'L',real:6,range:'1–6',name:['Part 1 · Mô tả tranh','Part 1 · Photographs'],short:'Photographs',icon:'picture',
      dir:'For each question, you will hear four statements about a picture. Select the one statement that best describes what you see in the picture. The statements will be spoken only one time and will not be printed in your test book.'},
  P2:{section:'L',real:25,range:'7–31',name:['Part 2 · Hỏi – đáp','Part 2 · Question–Response'],short:'Question–Response',icon:'comments',
      dir:'You will hear a question or statement and three responses. Select the best response to the question or statement. They will be spoken only one time and will not be printed in your test book.'},
  P3:{section:'L',real:39,range:'32–70',name:['Part 3 · Hội thoại','Part 3 · Conversations'],short:'Conversations',icon:'persons',
      dir:'You will hear some conversations between two or more people. You will be asked to answer three questions about what the speakers say in each conversation. The conversations will be spoken only one time.'},
  P4:{section:'L',real:30,range:'71–100',name:['Part 4 · Bài nói ngắn','Part 4 · Talks'],short:'Talks',icon:'microphone',
      dir:'You will hear some talks given by a single speaker. You will be asked to answer three questions about what the speaker says in each talk. The talks will be spoken only one time.'},
  P5:{section:'R',real:30,range:'101–130',name:['Part 5 · Hoàn thành câu','Part 5 · Incomplete Sentences'],short:'Incomplete Sentences',icon:'text-indent',
      dir:'A word or phrase is missing in each of the sentences below. Four answer choices are given below each sentence. Select the best answer to complete the sentence.'},
  P6:{section:'R',real:16,range:'131–146',name:['Part 6 · Hoàn thành đoạn văn','Part 6 · Text Completion'],short:'Text Completion',icon:'file-text',
      dir:'Read the texts that follow. A word, phrase, or sentence is missing in parts of each text. Four answer choices for each question are given below the text. Select the best answer to complete the text.'},
  P7:{section:'R',real:54,range:'147–200',name:['Part 7 · Đọc hiểu','Part 7 · Reading Comprehension'],short:'Reading Comprehension',icon:'book-open',
      dir:'In this part you will read a selection of texts, such as magazine and newspaper articles, e-mails, and instant messages. Each text or set of texts is followed by several questions. Select the best answer for each question.'},
};

/* Illustrated "photographs" for Part 1 (prototype illustrations, Theme Builder swatches only) */
const PHOTOS = {
  office:`<svg viewBox="0 0 480 300" role="img" aria-label="Photograph: a woman at a desk in an office" class="photo">
    <rect width="480" height="300" fill="color-mix(in oklab,var(--sw-sky) 18%,var(--surface))"/>
    <rect x="300" y="30" width="140" height="110" rx="6" fill="color-mix(in oklab,var(--sw-sky) 45%,white)"/><path d="M370 30v110M300 85h140" stroke="var(--surface)" stroke-width="6"/>
    <rect x="0" y="210" width="480" height="90" fill="color-mix(in oklab,var(--sw-navy) 12%,var(--surface))"/>
    <rect x="60" y="196" width="360" height="14" rx="4" fill="color-mix(in oklab,var(--sw-orange) 45%,var(--sw-navy))"/>
    <rect x="80" y="210" width="10" height="80" fill="color-mix(in oklab,var(--sw-orange) 35%,var(--sw-navy))"/><rect x="390" y="210" width="10" height="80" fill="color-mix(in oklab,var(--sw-orange) 35%,var(--sw-navy))"/>
    <path d="M330 196l10-46h8l-6 46z" fill="var(--sw-navy)"/><circle cx="352" cy="144" r="14" fill="var(--sw-yellow)"/><path d="M338 150l30-14" stroke="var(--sw-navy)" stroke-width="5" stroke-linecap="round"/>
    <rect x="96" y="150" width="34" height="46" rx="6" fill="color-mix(in oklab,var(--sw-orange) 60%,white)"/><path d="M113 150c-14-30-24-34-30-36M113 150c4-26 16-36 26-38M113 150c-2-24-6-36-4-48" stroke="color-mix(in oklab,var(--sw-green) 60%,var(--sw-teal))" stroke-width="7" stroke-linecap="round" fill="none"/>
    <rect x="200" y="150" width="88" height="6" rx="3" fill="var(--sw-navy)"/><rect x="214" y="100" width="70" height="50" rx="5" fill="var(--sw-navy)"/><rect x="220" y="106" width="58" height="38" rx="3" fill="color-mix(in oklab,var(--sw-blue) 40%,white)"/>
    <ellipse cx="200" cy="112" rx="26" ry="30" fill="color-mix(in oklab,var(--sw-navy) 85%,var(--sw-orange))"/><circle cx="196" cy="118" r="20" fill="color-mix(in oklab,var(--sw-orange) 30%,white)"/>
    <path d="M168 196c0-40 12-58 32-58s32 18 32 58z" fill="var(--sw-purple)"/><path d="M226 168c10 2 20-4 28-14" stroke="color-mix(in oklab,var(--sw-orange) 30%,white)" stroke-width="10" stroke-linecap="round" fill="none"/>
    <rect x="160" y="196" width="80" height="12" rx="4" fill="var(--sw-navy)"/></svg>`,
  warehouse:`<svg viewBox="0 0 480 300" role="img" aria-label="Photograph: boxes on warehouse shelves" class="photo">
    <rect width="480" height="300" fill="color-mix(in oklab,var(--sw-navy) 8%,var(--surface))"/>
    <rect x="0" y="250" width="480" height="50" fill="color-mix(in oklab,var(--sw-navy) 18%,var(--surface))"/>
    ${[40,250].map(x=>`<rect x="${x}" y="30" width="8" height="220" fill="color-mix(in oklab,var(--sw-blue-dark) 70%,var(--sw-navy))"/><rect x="${x+182}" y="30" width="8" height="220" fill="color-mix(in oklab,var(--sw-blue-dark) 70%,var(--sw-navy))"/>${[90,160,240].map(y=>`<rect x="${x}" y="${y}" width="190" height="8" fill="color-mix(in oklab,var(--sw-orange) 70%,var(--sw-red))"/>`).join('')}`).join('')}
    ${[[90,36],[160,46],[240,52]].map(([by,h],li)=>[52,104,156,262,316,370].filter((_,j)=>(j+li)%4!==3).map((x,j)=>`<rect x="${x}" y="${by-h}" width="46" height="${h}" rx="3" fill="color-mix(in oklab,var(--sw-orange) ${30+((j+li)%4)*10}%,var(--sw-yellow))" stroke="color-mix(in oklab,var(--sw-orange) 60%,var(--sw-navy))" stroke-width="1.5"/><path d="M${x+18} ${by-h}v10h10v-10" fill="none" stroke="color-mix(in oklab,var(--sw-orange) 60%,var(--sw-navy))" stroke-width="1.5"/>`).join('')).join('')}
    <rect x="392" y="206" width="70" height="30" rx="4" fill="var(--sw-teal)"/><circle cx="404" cy="244" r="7" fill="var(--sw-navy)"/><circle cx="452" cy="244" r="7" fill="var(--sw-navy)"/><path d="M462 206v-36" stroke="var(--sw-navy)" stroke-width="5" stroke-linecap="round"/></svg>`,
};

const TOEIC_G = {
  t_p3a:{part:'P3',type:'audio',title:'Questions 32–34 refer to the following conversation.',sec:16,lines:[
    [0,'W','Hi Daniel, the printer on the third floor is jammed again.'],
    [3,'M','I know. I’ve called the technician, but he can’t come until Thursday.'],
    [7,'W','Thursday? We need to print the client proposals by tomorrow morning.'],
    [11,'M','You could use the printer in the design department. I’ll let them know you’re coming.']]},
  t_p4a:{part:'P4',type:'audio',title:'Questions 71–73 refer to the following talk and program.',sec:18,lines:[
    [0,'M','Good morning, everyone, and welcome to the Westfield Retail Conference.'],
    [3,'M','Before we begin, one quick change to today’s program.'],
    [6,'M','Because our keynote speaker’s flight was delayed, her talk has been moved to the afternoon,'],
    [10,'M','and the online marketing workshop will now take place at ten o’clock instead.'],
    [14,'M','Also, please remember to pick up your name badge at the registration desk if you haven’t already.']],
    graphic:`<table class="graphic"><caption>Westfield Retail Conference — Morning Program</caption><tbody>
      <tr><th>9:00</th><td>Opening Remarks</td></tr><tr><th>10:00</th><td>Keynote: Retail in 2030</td></tr><tr><th>11:00</th><td>Online Marketing Workshop</td></tr><tr><th>12:30</th><td>Lunch — Garden Hall</td></tr></tbody></table>`},
  t_p6a:{part:'P6',type:'passage',title:'Questions 131–134 refer to the following notice.',html:
    `<div class="doc doc--notice"><div class="doc__head"><b>Harbor Books</b> — Notice to Customers</div>
     <p>Beginning on March 1, Harbor Books will extend its weekday hours. The store will remain open <span class="blank" data-q="t131">131</span> 9:00 P.M. Monday through Friday. <span class="blank" data-q="t132">132</span> We hope this change will make it more <span class="blank" data-q="t133">133</span> for you to visit after work.</p>
     <p>In addition, our café will offer a <span class="blank" data-q="t134">134</span> menu of sandwiches and drinks during the evening hours. We look forward to seeing you!</p></div>`},
  t_p7a:{part:'P7',type:'docs',title:'Questions 147–149 refer to the following e-mail.',docs:[{label:'E-mail',html:
    `<div class="doc doc--email"><dl class="doc__meta"><dt>To:</dt><dd>All staff</dd><dt>From:</dt><dd>Facilities Team</dd><dt>Date:</dt><dd>May 27</dd><dt>Subject:</dt><dd>East wing renovation</dd></dl>
     <p>Starting Monday, June 3, the east wing of the second floor will be closed for renovation. <span class="ev" data-ev="t147">Employees in the east wing will temporarily work in the training center on the first floor.</span> <span class="ev" data-ev="t148">The work is expected to take two weeks.</span></p>
     <p>Parking spaces near the east entrance will also be unavailable during this period. <span class="ev" data-ev="t149">If you have any questions, please call Linh Pham at extension 214.</span></p></div>`}]},
  t_p7b:{part:'P7',type:'docs',title:'Questions 176–178 refer to the following advertisement and e-mail.',docs:[
    {label:'Advertisement',html:`<div class="doc doc--ad"><div class="doc__title">Lakeside Fitness Center</div><div class="doc__sub">Spring Membership Offer</div>
      <p><span class="ev" data-ev="t176">Join before April 30 and pay no registration fee!</span></p>
      <ul><li><b>Standard</b> — $40/month: gym access, 6 A.M.–10 P.M.</li><li><span class="ev" data-ev="t178"><b>Premium</b> — $60/month</span>: includes group classes and pool access</li></ul>
      <p><span class="ev" data-ev="t178">Students receive 15% off any membership with a valid student ID.</span></p></div>`},
    {label:'E-mail',html:`<div class="doc doc--email"><dl class="doc__meta"><dt>From:</dt><dd>Daniel Ortiz</dd><dt>To:</dt><dd>membership@lakesidefitness.com</dd><dt>Date:</dt><dd>April 22</dd><dt>Subject:</dt><dd>My membership</dd></dl>
      <p>Hello,</p><p><span class="ev" data-ev="t178">I signed up for the Premium membership yesterday</span> at the front desk. <span class="ev" data-ev="t177 t178">However, I was charged the full monthly price even though I showed my university ID.</span> Could you please look into this?</p><p>I would also like to know whether the pool is open on Sundays.</p><p>Thank you,<br>Daniel Ortiz</p></div>`}]},
};

const TOEIC_Q = {
  t1:{n:1,bank:'toeic01',part:'P1',section:'L',type:'photo',img:'office',hide:true,stem:'Look at the picture marked number 1 in your test book.',options:ABCD('She’s adjusting a lamp.','She’s typing on a laptop.','She’s watering a plant.','She’s opening a window.'),answer:'B',skill:'listening.photo',
      audio:{sec:9,lines:[[0,'N','Number 1. Look at the picture marked number 1 in your test book.'],[3,'N','(A) She’s adjusting a lamp. (B) She’s typing on a laptop.'],[6,'N','(C) She’s watering a plant. (D) She’s opening a window.']]},
      exp:['Người phụ nữ đang gõ trên laptop → (B). (A) đèn có trong tranh nhưng cô ấy không chạm vào; (C) có cây nhưng không tưới; (D) cửa sổ đóng. Part 1 hay gài “vật có trong tranh nhưng hành động sai”.','She is typing on a laptop → (B). (A) the lamp is there but she isn’t touching it; (C) there is a plant but no watering; (D) the window is closed. Part 1 often uses “right object, wrong action”.']},
  t2:{n:2,bank:'toeic01',part:'P1',section:'L',type:'photo',img:'warehouse',hide:true,stem:'Look at the picture marked number 2 in your test book.',options:ABCD('A worker is loading a truck.','Some boxes have been stacked on shelves.','The shelves are being painted.','Some carts are lined up outside.'),answer:'B',skill:'listening.photo',
      audio:{sec:9,lines:[[0,'N','Number 2. Look at the picture marked number 2 in your test book.'],[3,'N','(A) A worker is loading a truck. (B) Some boxes have been stacked on shelves.'],[6,'N','(C) The shelves are being painted. (D) Some carts are lined up outside.']]},
      exp:['Không có người trong tranh → loại (A), (C) (“are being painted” cần người đang sơn). Bị động hoàn thành “have been stacked” mô tả trạng thái → (B).','There is no person → eliminate (A) and (C) (“are being painted” needs someone painting). The perfect passive “have been stacked” describes a state → (B).']},
  t7:{n:7,bank:'toeic01',part:'P2',section:'L',type:'single',hide:true,stem:'Mark your answer on your answer sheet.',options:ABCD('In conference room B.','At three o’clock.','Yes, I held it.'),answer:'A',skill:'listening.question_response',
      audio:{sec:7,lines:[[0,'W','Where is the marketing meeting being held?'],[3,'M','(A) In conference room B. (B) At three o’clock. (C) Yes, I held it.']]},
      exp:['“Where” hỏi địa điểm → (A). (B) trả lời “When”. (C) lặp âm “held” và Yes/No không trả lời câu hỏi Wh-.','“Where” asks for a place → (A). (B) answers “When”. (C) repeats “held”, and Yes/No can’t answer a Wh- question.']},
  t8:{n:8,bank:'toeic01',part:'P2',section:'L',type:'single',hide:true,stem:'Mark your answer on your answer sheet.',options:ABCD('The voice was clear.','Yes, please, before noon.','Two days ago.'),answer:'B',skill:'listening.question_response',
      audio:{sec:7,lines:[[0,'M','Would you like me to send the invoice today?'],[3,'W','(A) The voice was clear. (B) Yes, please, before noon. (C) Two days ago.']]},
      exp:['“Would you like me to…?” là lời đề nghị → chấp nhận/từ chối: (B). (A) nhiễu âm invoice/voice; (C) trả lời thời điểm quá khứ.','“Would you like me to…?” is an offer → accept or decline: (B). (A) sound-alike invoice/voice; (C) answers a past time.']},
  t9:{n:9,bank:'toeic01',part:'P2',section:'L',type:'single',hide:true,stem:'Mark your answer on your answer sheet.',options:ABCD('Ms. Lee in Accounting.','It’s a reported budget.','By the end of the month.'),answer:'A',skill:'listening.question_response',
      audio:{sec:7,lines:[[0,'W','Who’s responsible for the budget report?'],[3,'M','(A) Ms. Lee in Accounting. (B) It’s a reported budget. (C) By the end of the month.']]},
      exp:['“Who” hỏi người → (A) nêu người + bộ phận. (B) lặp từ “report/budget”; (C) trả lời thời hạn.','“Who” asks for a person → (A) names a person and department. (B) repeats “report/budget”; (C) gives a deadline.']},
  t32:{n:32,bank:'toeic01',part:'P3',section:'L',type:'single',group:'t_p3a',stem:'What problem does the woman mention?',options:ABCD('A printer is not working.','A client has canceled an order.','A meeting room is unavailable.','A proposal contains errors.'),answer:'A',skill:'listening.detail',
      exp:['“the printer on the third floor is jammed again” → máy in không hoạt động.','“the printer on the third floor is jammed again” → the printer is not working.']},
  t33:{n:33,bank:'toeic01',part:'P3',section:'L',type:'single',group:'t_p3a',stem:'When will the technician come?',options:ABCD('Today','Tomorrow morning','On Thursday','Next week'),answer:'C',skill:'listening.detail',
      exp:['“He can’t come until Thursday.” (B) là hạn in tài liệu — bẫy thường gặp.','“He can’t come until Thursday.” (B) is the printing deadline — a common trap.']},
  t34:{n:34,bank:'toeic01',part:'P3',section:'L',type:'single',group:'t_p3a',stem:'What does the man offer to do?',options:ABCD('Repair the printer','Contact another department','Print the proposals himself','Reschedule a client meeting'),answer:'B',skill:'listening.inference',
      exp:['“I’ll let them know you’re coming” — “them” là phòng thiết kế → liên hệ phòng ban khác (diễn đạt lại).','“I’ll let them know you’re coming” — “them” is the design department → contact another department (paraphrase).']},
  t71:{n:71,bank:'toeic01',part:'P4',section:'L',type:'single',group:'t_p4a',stem:'Where most likely is the talk taking place?',options:ABCD('At a conference','At a train station','At a restaurant','At a hotel front desk'),answer:'A',skill:'listening.inference',
      exp:['“welcome to the Westfield Retail Conference” → hội nghị.','“welcome to the Westfield Retail Conference” → a conference.']},
  t72:{n:72,bank:'toeic01',part:'P4',section:'L',type:'single',group:'t_p4a',stem:'Look at the graphic. Which session will begin at 10:00?',options:ABCD('Opening Remarks','Retail in 2030','Online Marketing Workshop','Lunch'),answer:'C',skill:'listening.graphic',
      exp:['Câu hỏi đồ họa: lịch in sẵn ghi 10:00 là Keynote, nhưng người nói thông báo workshop chuyển lên 10 giờ → (C). Luôn đối chiếu thông tin nghe được với bảng.','Graphic question: the printed program shows the keynote at 10:00, but the speaker says the workshop moves to ten o’clock → (C). Always combine what you hear with the graphic.']},
  t73:{n:73,bank:'toeic01',part:'P4',section:'L',type:'single',group:'t_p4a',stem:'What does the speaker remind listeners to do?',options:ABCD('Pick up a name badge','Submit a survey','Turn off mobile phones','Reserve a lunch seat'),answer:'A',skill:'listening.detail',
      exp:['“please remember to pick up your name badge” → (A).','“please remember to pick up your name badge” → (A).']},
  t101:{n:101,bank:'toeic01',part:'P5',section:'R',type:'single',stem:'The quarterly report must be submitted ______ Friday afternoon.',options:ABCD('by','until','within','since'),answer:'A',skill:'grammar.preposition',
      exp:['“by + mốc thời gian” = hạn chót. “until” diễn tả hành động kéo dài đến mốc đó, không hợp với “submit” (xảy ra một lần). “within” đi với khoảng thời gian; “since” dùng với thì hoàn thành.','“by + point in time” = deadline. “until” means continuing up to that point, which doesn’t fit a one-off “submit”. “within” takes a period; “since” goes with perfect tenses.']},
  t102:{n:102,bank:'toeic01',part:'P5',section:'R',type:'single',stem:'Ms. Tran was ______ for her outstanding contribution to the project.',options:ABCD('recognize','recognized','recognizing','recognition'),answer:'B',skill:'grammar.verb_form',
      exp:['Chủ ngữ nhận hành động → bị động “was + V3”: was recognized.','The subject receives the action → passive “was + past participle”: was recognized.']},
  t103:{n:103,bank:'toeic01',part:'P5',section:'R',type:'single',stem:'The new software is designed to make data entry ______ and more accurate.',options:ABCD('fast','faster','fastest','more fastly'),answer:'B',skill:'grammar.word_form',
      exp:['Cấu trúc song song với “more accurate” → so sánh hơn “faster”.','Parallel structure with “more accurate” → comparative “faster”.']},
  t104:{n:104,bank:'toeic01',part:'P5',section:'R',type:'single',stem:'______ the heavy rain, the outdoor concert was held as scheduled.',options:ABCD('Despite','Although','Because','Even'),answer:'A',skill:'grammar.connector',
      exp:['Sau chỗ trống là cụm danh từ “the heavy rain” → giới từ “Despite”. “Although/Because” cần mệnh đề.','A noun phrase follows → the preposition “Despite”. “Although/Because” need a clause.']},
  t131:{n:131,bank:'toeic01',part:'P6',section:'R',type:'single',group:'t_p6a',stem:'',options:ABCD('until','by','since','during'),answer:'A',skill:'grammar.preposition',
      exp:['“remain open” là trạng thái kéo dài → “until 9:00 P.M.”. So sánh với câu 101: “submit by”.','“remain open” is ongoing → “until 9:00 P.M.”. Compare with question 101: “submit by”.']},
  t132:{n:132,bank:'toeic01',part:'P6',section:'R',type:'single',group:'t_p6a',stem:'',options:ABCD('Weekend hours will not change.','The store first opened in 1998.','Please return all books by Friday.','Our café is now hiring.'),answer:'A',skill:'reading.insertion',
      exp:['Câu chèn phải nối tiếp ý “giờ mở cửa ngày thường” → bổ sung thông tin cuối tuần (A). Các câu khác lạc đề.','The inserted sentence must continue the topic of weekday hours → information about weekends (A). The others are off-topic.']},
  t133:{n:133,bank:'toeic01',part:'P6',section:'R',type:'single',group:'t_p6a',stem:'',options:ABCD('convenience','convenient','conveniently','convene'),answer:'B',skill:'grammar.word_form',
      exp:['“make it more + tính từ” → convenient.','“make it more + adjective” → convenient.']},
  t134:{n:134,bank:'toeic01',part:'P6',section:'R',type:'single',group:'t_p6a',stem:'',options:ABCD('limited','limit','limiting','limitation'),answer:'A',skill:'grammar.word_form',
      exp:['Trước danh từ “menu” cần tính từ → “a limited menu”.','An adjective is needed before “menu” → “a limited menu”.']},
  t147:{n:147,bank:'toeic01',part:'P7',section:'R',type:'single',group:'t_p7a',stem:'What is the purpose of the e-mail?',options:ABCD('To announce a temporary relocation','To introduce a new facilities manager','To request feedback on a training session','To explain a new parking policy'),answer:'A',skill:'reading.main_idea',
      exp:['Nhân viên “will temporarily work in the training center” → thông báo chuyển chỗ tạm thời.','Staff “will temporarily work in the training center” → a temporary relocation.']},
  t148:{n:148,bank:'toeic01',part:'P7',section:'R',type:'single',group:'t_p7a',stem:'How long is the renovation expected to take?',options:ABCD('One week','Two weeks','Three weeks','One month'),answer:'B',skill:'reading.detail',
      exp:['“The work is expected to take two weeks.”','“The work is expected to take two weeks.”']},
  t149:{n:149,bank:'toeic01',part:'P7',section:'R',type:'single',group:'t_p7a',stem:'What should employees do if they have questions?',options:ABCD('Visit the training center','Reply to this e-mail','Call an extension','Speak to their manager'),answer:'C',skill:'reading.detail',
      exp:['“please call Linh Pham at extension 214” → gọi số máy lẻ.','“please call Linh Pham at extension 214” → call an extension.']},
  t176:{n:176,bank:'toeic01',part:'P7',section:'R',type:'single',group:'t_p7b',stem:'What is indicated about Lakeside Fitness Center?',options:ABCD('It is waiving a fee for new members.','Its pool closes at 6 P.M.','It recently opened a second location.','It offers free personal training.'),answer:'A',skill:'reading.detail',
      exp:['“pay no registration fee” = miễn phí đăng ký (diễn đạt lại thành “waiving a fee”).','“pay no registration fee” is paraphrased as “waiving a fee”.']},
  t177:{n:177,bank:'toeic01',part:'P7',section:'R',type:'single',group:'t_p7b',stem:'Why did Mr. Ortiz write the e-mail?',options:ABCD('To cancel his membership','To report a billing problem','To ask about class times','To change his membership type'),answer:'B',skill:'reading.main_idea',
      exp:['“I was charged the full monthly price even though I showed my university ID” → sai tiền phí.','“I was charged the full monthly price…” → a billing problem.']},
  t178:{n:178,bank:'toeic01',part:'P7',section:'R',type:'single',group:'t_p7b',stem:'How much should Mr. Ortiz most likely have paid per month?',options:ABCD('$34','$40','$51','$60'),answer:'C',skill:'reading.cross_reference',
      exp:['Câu liên kết 2 văn bản: e-mail → gói Premium + có thẻ sinh viên; quảng cáo → Premium $60, giảm 15% → $51.','Cross-reference: the e-mail says Premium + student ID; the ad says Premium is $60 with 15% off → $51.']},
};
