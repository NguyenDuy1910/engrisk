/* IELTS Academic Reading + Listening — demo content with REAL numbering, question-set instructions
 * and question types (computer-delivered layout). Original texts written for the prototype.
 * Gap placeholders in set/passage HTML: {{qid}} → rendered as an inline answer box. */
const IELTS_PARTS = {
  R1:{section:'R',real:13,range:'1–13',name:['Passage 1','Passage 1'],short:'Reading Passage 1',icon:'file-text'},
  R2:{section:'R',real:13,range:'14–26',name:['Passage 2','Passage 2'],short:'Reading Passage 2',icon:'file-text'},
  R3:{section:'R',real:14,range:'27–40',name:['Passage 3','Passage 3'],short:'Reading Passage 3',icon:'file-text'},
  L1:{section:'L',real:10,range:'1–10',name:['Part 1','Part 1'],short:'Social: conversation',icon:'persons'},
  L2:{section:'L',real:10,range:'11–20',name:['Part 2','Part 2'],short:'Social: monologue',icon:'microphone'},
  L3:{section:'L',real:10,range:'21–30',name:['Part 3','Part 3'],short:'Academic: discussion',icon:'persons'},
  L4:{section:'L',real:10,range:'31–40',name:['Part 4','Part 4'],short:'Academic: lecture',icon:'graduation-cap'},
};
const IELTS_G = {
  i_r1:{part:'R1',type:'passage',title:'Urban Beekeeping',intro:'You should spend about 20 minutes on Questions 1–13, which are based on Reading Passage 1 below.',html:
   `<p>In the last decade, beekeeping has spread from the countryside into the centre of many large cities. Rooftops in London, Paris and New York now host thousands of hives. <span class="ev" data-ev="i1">Supporters argue that urban bees benefit from the variety of flowers in parks and gardens, which often provide a longer flowering season than farmland treated with pesticides.</span> <span class="ev" data-ev="i4">In Paris, anyone keeping bees must now register their hives with the city authorities.</span></p>
    <p><span class="ev" data-ev="i2 i6">However, some ecologists warn that the rapid growth in honeybee colonies may increase competition for food with wild bee species.</span> <span class="ev" data-ev="i3">A 2019 survey in London found that the number of hives had doubled in five years, while the amount of flowering plants had not.</span></p>
    <p><span class="ev" data-ev="i5">Researchers therefore recommend that new urban beekeepers plant pollinator-friendly flowers before installing a hive.</span> <span class="ev" data-ev="i7">Most introductory courses take place over a single weekend</span> and cover hive inspection, swarm prevention and the safe use of protective equipment.</p>`},
  i_r2:{part:'R2',type:'passage',title:'The Rise of the Bicycle',intro:'You should spend about 20 minutes on Questions 14–26, which are based on Reading Passage 2 below.',html:
   `<p class="para"><b class="para__label">A</b> The first two-wheeled machine, built in Germany in 1817, had no pedals at all. Riders sat on a wooden frame and pushed themselves along with their feet, a method that was tiring on anything but a smooth road.</p>
    <p class="para" data-para="B"><b class="para__label">B</b> <span class="ev" data-ev="i14">In the 1860s, French makers attached pedals directly to the front wheel. The result was faster, but the iron tyres and stiff frame transmitted every bump in the road, earning the machine the nickname “boneshaker”.</span></p>
    <p class="para" data-para="C"><b class="para__label">C</b> <span class="ev" data-ev="i15">To go further with each turn of the pedals, designers simply made the front wheel larger. The high-wheeler could reach impressive speeds, yet riders sat so high that a small stone could throw them head-first over the handlebars.</span></p>
    <p class="para" data-para="D"><b class="para__label">D</b> <span class="ev" data-ev="i16 i18">The so-called safety bicycle of 1885 solved the problem with two wheels of equal size and a chain that drove the rear wheel.</span> <span class="ev" data-ev="i18">When air-filled rubber tyres were added three years later, the bicycle became both safe and comfortable, and sales rose dramatically.</span></p>
    <p class="para" data-para="E"><b class="para__label">E</b> <span class="ev" data-ev="i17">The new machine changed more than transport. It gave many women an independent means of travel for the first time and even influenced fashion, as heavy skirts gave way to clothing that was easier to ride in.</span></p>`},
  i_r3:{part:'R3',type:'passage',title:'Sleep and Memory',intro:'You should spend about 20 minutes on Questions 27–40, which are based on Reading Passage 3 below.',html:
   `<p>Scientists have long suspected that sleep plays a role in learning, but only recently have experiments begun to show how. <span class="ev" data-ev="i27">In a series of studies, Dr Hana Sato found that participants who took a short nap in the afternoon recalled newly learned word lists more accurately than those who stayed awake.</span></p>
    <p><span class="ev" data-ev="i28">Professor Lucas Meyer takes a different view of what happens at night. In his opinion, the sleeping brain does not simply store the day’s experiences; it reorganises them, linking new information to older memories during periods of deep sleep.</span></p>
    <p><span class="ev" data-ev="i29">Meanwhile, Dr Priya Nair tracked university students over a full semester and reported that those who regularly slept for less than six hours performed noticeably worse on problem-solving tasks</span>, even when they felt fully alert.</p>`},
  i_l1:{part:'L1',type:'audio',title:'Part 1',intro:'Questions 1–10',sec:20,lines:[
    [0,'M','Good morning, Riverside Sports Centre. How can I help?'],[2,'W','Hi, I’d like to join the centre. My name’s Sarah Dawson — that’s D-A-W-S-O-N.'],
    [7,'M','Thanks. And when would you like to start?'],[9,'W','From the third of June, if possible.'],
    [11,'M','We have a full membership and an off-peak one, which is only before 4 p.m.'],[14,'W','Off-peak is fine — I work evenings. How much is that?'],
    [16,'M','It’s twenty-eight pounds a month. Are you interested in any classes?'],[18,'W','Yes, yoga, please.']]},
  i_l2:{part:'L2',type:'audio',title:'Part 2',intro:'Questions 11–20',sec:16,lines:[
    [0,'M','Welcome to Hillside Nature Park. Let me tell you where everything is.'],[3,'M','As you come in through the main gate, the visitor centre is straight ahead of you.'],
    [7,'M','The café is to the left of the visitor centre, next to the lake.'],[10,'M','If you want a picnic, the picnic area is just inside the gate on your right.'],
    [13,'M','And for bird watchers, the bird hide is at the far end of the lake, in the north-west corner.']]},
  i_l3:{part:'L3',type:'audio',title:'Part 3',intro:'Questions 21–30',sec:16,lines:[
    [0,'W','So, Tom, how do you think our survey went?'],[2,'M','Honestly, not great. We only got thirty responses — far fewer than we needed.'],
    [6,'W','And some people said question four was confusing. They didn’t know what we meant by “regular use”.'],
    [11,'M','Then I think we should rewrite the questions before we send it out again.'],[14,'W','Agreed. Let’s do that first.']]},
  i_l4:{part:'L4',type:'audio',title:'Part 4',intro:'Questions 31–40',sec:16,lines:[
    [0,'W','Today I’m going to talk about urban heat islands — areas of a city that are much warmer than the surrounding countryside.'],
    [5,'W','The main cause is that materials such as concrete absorb heat during the day.'],
    [9,'W','One of the cheapest solutions is planting trees, which provide shade.'],
    [12,'W','The effect is strongest at night, when the stored heat is slowly released.']]},
};
/* Question sets = the instruction blocks shown above each group of questions */
const SETS = {
  r1a:{range:'1–4',type:'tfng',instr:'Do the following statements agree with the information given in Reading Passage 1?',
       note:'<b>TRUE</b> if the statement agrees with the information<br><b>FALSE</b> if the statement contradicts the information<br><b>NOT GIVEN</b> if there is no information on this'},
  r1b:{range:'5–7',type:'summary',instr:'Complete the summary below.',limit:'ONE WORD ONLY',title:'Advice for city beekeepers',
       html:'Researchers suggest that new beekeepers should first plant {{i5}} flowers. Ecologists also warn that too many honeybees can lead to {{i6}} for food with wild species. Introductory courses usually last for one {{i7}}.'},
  r2a:{range:'14–17',type:'headings',instr:'Reading Passage 2 has five paragraphs, A–E. Choose the correct heading for paragraphs B–E from the list of headings below.',
       list:[['i','A machine without pedals'],['ii','Comfort at the cost of speed'],['iii','A rough ride'],['iv','Faster but riskier'],['v','The design that won'],['vi','Changing more than transport'],['vii','Government rules for riders']],example:['A','i']},
  r2b:{range:'18–19',type:'multi',pick:2,instr:'Choose TWO letters, A–E.'},
  r3a:{range:'27–29',type:'features',instr:'Look at the following statements (Questions 27–29) and the list of researchers below. Match each statement with the correct researcher, A–C.',
       list:[['A','Dr Hana Sato'],['B','Professor Lucas Meyer'],['C','Dr Priya Nair']]},
  l1a:{range:'1–5',type:'form',instr:'Complete the form below.',limit:'ONE WORD AND/OR A NUMBER',title:'Riverside Sports Centre — Membership enquiry',
       html:'<table class="form-table"><tr><th>Name</th><td>Sarah {{l1}}</td></tr><tr><th>Start date</th><td>3 {{l2}}</td></tr><tr><th>Membership type</th><td>{{l3}}</td></tr><tr><th>Monthly fee</th><td>£ {{l4}}</td></tr><tr><th>Classes</th><td>{{l5}}</td></tr></table>'},
  l2a:{range:'11–14',type:'map',instr:'Label the map below. Choose the correct letter, A–F.',letters:['A','B','C','D','E','F'],map:'park'},
  l3a:{range:'21–22',type:'multi',pick:2,instr:'Choose TWO letters, A–E.'},
  l3b:{range:'23',type:'mc',instr:'Choose the correct letter, A, B or C.'},
  l4a:{range:'31–33',type:'notes',instr:'Complete the notes below.',limit:'ONE WORD ONLY',title:'Urban heat islands',
       html:'<ul class="notes-list"><li>Main cause: materials like {{l31}} absorb heat by day</li><li>Cheap solution: planting {{l32}} for shade</li><li>Effect is strongest at {{l33}}</li></ul>'},
};
const MAPS = {
  park:`<svg viewBox="0 0 420 260" class="map" role="img" aria-label="Map of Hillside Nature Park">
    <rect width="420" height="260" rx="12" fill="color-mix(in oklab,var(--sw-mint) 30%,var(--surface))"/>
    <ellipse cx="150" cy="80" rx="110" ry="50" fill="color-mix(in oklab,var(--sw-sky) 50%,var(--surface))"/><text x="150" y="84" text-anchor="middle" font-size="12" fill="var(--muted)">Lake</text>
    <path d="M210 260V170h-90M210 170h120" stroke="color-mix(in oklab,var(--sw-orange) 40%,var(--surface))" stroke-width="14" fill="none" stroke-linecap="round"/>
    <rect x="186" y="236" width="48" height="20" rx="4" fill="var(--sw-navy)"/><text x="210" y="250" text-anchor="middle" font-size="10" fill="#fff">Gate</text>
    ${[['A',290,215],['B',350,120],['C',100,170],['D',210,140],['E',330,40],['F',40,40]].map(([l,x,y])=>`<circle cx="${x}" cy="${y}" r="15" fill="var(--surface)" stroke="var(--foreground)" stroke-width="2"/><text x="${x}" y="${y+5}" text-anchor="middle" font-size="14" font-weight="700" fill="var(--foreground)">${l}</text>`).join('')}
    <text x="404" y="20" text-anchor="end" font-size="11" fill="var(--muted)">N ↑</text></svg>`,
};
const IELTS_Q = {
  i1:{n:1,bank:'ielts-r01',part:'R1',section:'R',set:'r1a',group:'i_r1',type:'single',options:TFNG,stem:'Urban bees may have access to flowers for a longer period than bees on farmland.',answer:'TRUE',skill:'reading.tfng',
      exp:['“…provide a longer flowering season than farmland” → khớp → TRUE.','“…provide a longer flowering season than farmland” → matches → TRUE.']},
  i2:{n:2,bank:'ielts-r01',part:'R1',section:'R',set:'r1a',group:'i_r1',type:'single',options:TFNG,stem:'Wild bee species prefer rooftops to parks.',answer:'NOT GIVEN',skill:'reading.tfng',
      exp:['Bài chỉ nói cạnh tranh thức ăn, không nói ong hoang dã thích nơi nào → NOT GIVEN. “Không được nhắc” ≠ “sai”.','The text only mentions competition for food → NOT GIVEN. “Not mentioned” is not “false”.']},
  i3:{n:3,bank:'ielts-r01',part:'R1',section:'R',set:'r1a',group:'i_r1',type:'single',options:TFNG,stem:'The amount of flowering plants in London doubled between 2014 and 2019.',answer:'FALSE',skill:'reading.tfng',
      exp:['Số TỔ ONG tăng gấp đôi “while the amount of flowering plants had not” → mâu thuẫn → FALSE.','HIVES doubled “while the amount of flowering plants had not” → contradiction → FALSE.']},
  i4:{n:4,bank:'ielts-r01',part:'R1',section:'R',set:'r1a',group:'i_r1',type:'single',options:TFNG,stem:'Beekeepers in Paris are required to register their hives.',answer:'TRUE',skill:'reading.tfng',
      exp:['“anyone keeping bees must now register their hives with the city authorities” → TRUE.','“anyone keeping bees must now register their hives…” → TRUE.']},
  i5:{n:5,bank:'ielts-r01',part:'R1',section:'R',set:'r1b',group:'i_r1',type:'gap',answer:['pollinator-friendly','pollinator friendly'],skill:'reading.completion',
      exp:['“plant pollinator-friendly flowers” — từ ghép có gạch nối tính là MỘT từ.','“plant pollinator-friendly flowers” — a hyphenated word counts as ONE word.']},
  i6:{n:6,bank:'ielts-r01',part:'R1',section:'R',set:'r1b',group:'i_r1',type:'gap',answer:['competition'],skill:'reading.completion',
      exp:['“increase competition for food with wild bee species”.','“increase competition for food with wild bee species”.']},
  i7:{n:7,bank:'ielts-r01',part:'R1',section:'R',set:'r1b',group:'i_r1',type:'gap',answer:['weekend'],skill:'reading.completion',
      exp:['“take place over a single weekend” → weekend (giới hạn ONE WORD).','“take place over a single weekend” → weekend (ONE WORD limit).']},
  i14:{n:14,bank:'ielts-r01',part:'R2',section:'R',set:'r2a',group:'i_r2',type:'heading',stem:'Paragraph B',para:'B',answer:'iii',skill:'reading.headings',
      exp:['“every bump in the road… boneshaker” → chuyến đi xóc → iii. “ii” sai vì xe nhanh hơn, không thoải mái hơn.','“every bump in the road… boneshaker” → iii. “ii” is wrong: it was faster, not more comfortable.']},
  i15:{n:15,bank:'ielts-r01',part:'R2',section:'R',set:'r2a',group:'i_r2',type:'heading',stem:'Paragraph C',para:'C',answer:'iv',skill:'reading.headings',
      exp:['“impressive speeds, yet… head-first over the handlebars” → nhanh nhưng nguy hiểm → iv.','“impressive speeds, yet… over the handlebars” → iv.']},
  i16:{n:16,bank:'ielts-r01',part:'R2',section:'R',set:'r2a',group:'i_r2',type:'heading',stem:'Paragraph D',para:'D',answer:'v',skill:'reading.headings',
      exp:['Safety bicycle giải quyết vấn đề và bán chạy → thiết kế chiến thắng → v.','The safety bicycle solved the problem and sold well → v.']},
  i17:{n:17,bank:'ielts-r01',part:'R2',section:'R',set:'r2a',group:'i_r2',type:'heading',stem:'Paragraph E',para:'E',answer:'vi',skill:'reading.headings',
      exp:['“changed more than transport” → vi. Bẫy: “vii” có vẻ liên quan nhưng bài không nói luật lệ.','“changed more than transport” → vi. Trap: “vii” sounds related but rules are never mentioned.']},
  i18:{n:[18,19],bank:'ielts-r01',part:'R2',section:'R',set:'r2b',group:'i_r2',type:'multi',pick:2,stem:'Which TWO features made the safety bicycle successful?',
      options:[['A','a chain that drove the rear wheel'],['B','a larger front wheel'],['C','air-filled rubber tyres'],['D','lower government taxes'],['E','a lighter wooden frame']],answer:['A','C'],skill:'reading.multi',
      exp:['Đoạn D: “a chain that drove the rear wheel” (A) + “air-filled rubber tyres” (C). (B) là high-wheeler ở đoạn C. Mỗi đáp án đúng = 1 điểm, thứ tự không quan trọng.','Paragraph D: chain to the rear wheel (A) + air-filled tyres (C). (B) describes the high-wheeler. Each correct letter = 1 mark, any order.']},
  i27:{n:27,bank:'ielts-r01',part:'R3',section:'R',set:'r3a',group:'i_r3',type:'select',stem:'Short daytime naps can improve the recall of newly learned information.',answer:'A',skill:'reading.matching_features',
      exp:['Dr Hana Sato: “took a short nap… recalled newly learned word lists more accurately” → A.','Dr Hana Sato: nap → better recall → A.']},
  i28:{n:28,bank:'ielts-r01',part:'R3',section:'R',set:'r3a',group:'i_r3',type:'select',stem:'During deep sleep, memories are restructured rather than simply stored.',answer:'B',skill:'reading.matching_features',
      exp:['Professor Lucas Meyer: “does not simply store… it reorganises them” → B.','Professor Lucas Meyer: “does not simply store… it reorganises them” → B.']},
  i29:{n:29,bank:'ielts-r01',part:'R3',section:'R',set:'r3a',group:'i_r3',type:'select',stem:'A lack of sleep can affect performance even when people do not feel tired.',answer:'C',skill:'reading.matching_features',
      exp:['Dr Priya Nair: “performed noticeably worse… even when they felt fully alert” → C.','Dr Priya Nair: worse performance “even when they felt fully alert” → C.']},
  l1:{n:1,bank:'ielts-l01',part:'L1',section:'L',set:'l1a',group:'i_l1',type:'gap',answer:['Dawson'],skill:'listening.form',at:2,
      exp:['Tên được đánh vần D-A-W-S-O-N. Sai chính tả = sai.','The name is spelled D-A-W-S-O-N. Misspelling = wrong.']},
  l2:{n:2,bank:'ielts-l01',part:'L1',section:'L',set:'l1a',group:'i_l1',type:'gap',answer:['June'],skill:'listening.form',at:9,
      exp:['“From the third of June” → June.','“From the third of June” → June.']},
  l3:{n:3,bank:'ielts-l01',part:'L1',section:'L',set:'l1a',group:'i_l1',type:'gap',answer:['off-peak','off peak'],skill:'listening.form',at:14,
      exp:['Có 2 gói được nhắc; người nói chọn “Off-peak”. Bẫy: “full membership” nói trước.','Two types are mentioned; she chooses “off-peak”. Trap: “full membership” comes first.']},
  l4:{n:4,bank:'ielts-l01',part:'L1',section:'L',set:'l1a',group:'i_l1',type:'gap',answer:['28','twenty-eight'],skill:'listening.form',at:16,
      exp:['“twenty-eight pounds a month” → 28.','“twenty-eight pounds a month” → 28.']},
  l5:{n:5,bank:'ielts-l01',part:'L1',section:'L',set:'l1a',group:'i_l1',type:'gap',answer:['yoga'],skill:'listening.form',at:18,
      exp:['“Yes, yoga, please.”','“Yes, yoga, please.”']},
  l11:{n:11,bank:'ielts-l01',part:'L2',section:'L',set:'l2a',group:'i_l2',type:'select',stem:'Café',answer:'C',skill:'listening.map',at:7,exp:['“to the left of the visitor centre, next to the lake” → C.','“to the left of the visitor centre, next to the lake” → C.']},
  l12:{n:12,bank:'ielts-l01',part:'L2',section:'L',set:'l2a',group:'i_l2',type:'select',stem:'Bird hide',answer:'F',skill:'listening.map',at:13,exp:['“far end of the lake, in the north-west corner” → F.','“far end of the lake, in the north-west corner” → F.']},
  l13:{n:13,bank:'ielts-l01',part:'L2',section:'L',set:'l2a',group:'i_l2',type:'select',stem:'Picnic area',answer:'A',skill:'listening.map',at:10,exp:['“just inside the gate on your right” → A.','“just inside the gate on your right” → A.']},
  l14:{n:14,bank:'ielts-l01',part:'L2',section:'L',set:'l2a',group:'i_l2',type:'select',stem:'Visitor centre',answer:'D',skill:'listening.map',at:3,exp:['“straight ahead of you” từ cổng → D.','“straight ahead” from the gate → D.']},
  l21:{n:[21,22],bank:'ielts-l01',part:'L3',section:'L',set:'l3a',group:'i_l3',type:'multi',pick:2,stem:'Which TWO problems did the students have with their survey?',
      options:[['A','too few responses'],['B','an unclear question'],['C','a late submission'],['D','a software failure'],['E','a biased sample']],answer:['A','B'],skill:'listening.multi',at:2,
      exp:['“only got thirty responses — far fewer than we needed” (A) + “question four was confusing” (B).','“far fewer than we needed” (A) + “question four was confusing” (B).']},
  l23:{n:23,bank:'ielts-l01',part:'L3',section:'L',set:'l3b',group:'i_l3',type:'single',stem:'What will the students do next?',options:[['A','interview their tutor'],['B','rewrite the questions'],['C','extend the deadline']],answer:'B',skill:'listening.detail',at:11,
      exp:['“we should rewrite the questions… Let’s do that first.” → B.','“we should rewrite the questions… Let’s do that first.” → B.']},
  l31:{n:31,bank:'ielts-l01',part:'L4',section:'L',set:'l4a',group:'i_l4',type:'gap',answer:['concrete'],skill:'listening.notes',at:5,exp:['“materials such as concrete absorb heat”.','“materials such as concrete absorb heat”.']},
  l32:{n:32,bank:'ielts-l01',part:'L4',section:'L',set:'l4a',group:'i_l4',type:'gap',answer:['trees'],skill:'listening.notes',at:9,exp:['“planting trees, which provide shade”.','“planting trees, which provide shade”.']},
  l33:{n:33,bank:'ielts-l01',part:'L4',section:'L',set:'l4a',group:'i_l4',type:'gap',answer:['night'],skill:'listening.notes',at:12,exp:['“strongest at night”.','“strongest at night”.']},
};
