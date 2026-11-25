// SOS app content. Every claim carries its source.
window.SOS_DATA = (() => {
  const RATE = 420; // rupees a day: about ₹10,000 of delivery orders over 1–24 Nov 2026
  const FALLBACK_START = '2026-11-24T20:40:26+05:30'; // last order before the app: Swiggy, 24 Nov, 8:40 PM
  const TRACK0 = '2026-11-25';

  // Days with delivery orders before tracking began (from Zomato, Swiggy and Blinkit history).
  const HISTORY = ['2026-10-24','2026-10-26','2026-10-29','2026-10-30','2026-10-31','2026-11-01','2026-11-02','2026-11-03','2026-11-04','2026-11-06','2026-11-08','2026-11-09','2026-11-11','2026-11-14','2026-11-15','2026-11-16','2026-11-18','2026-11-19','2026-11-20','2026-11-21','2026-11-22','2026-11-23','2026-11-24'];

  // Milestones, each tied to an organ on the body map.
  const MILES = [
    {h:0, tag:'Hour 0', organ:'arteries', title:'Your arteries get a break', body:'In a classic study, one high-fat fast-food meal cut the ability of blood vessels to widen for about four hours. Today that is not happening to you.', src:'Vogel et al., American Journal of Cardiology, 1997'},
    {h:24, tag:'Day 1', organ:'face', title:'Salt bloat starts to drain', body:'Very salty food makes the body hold on to water. A day off sauces, chips and fast food and that water starts to leave. Face and belly puffiness go first.', src:'Sodium and fluid balance, basic physiology'},
    {h:72, tag:'Day 3', organ:'gut', title:'Your gut bacteria are changing', body:'When people switched diets, their gut bacteria shifted within days. You are feeding a different crowd now.', src:'David et al., Nature, 2014'},
    {h:168, tag:'Day 7', organ:'brain', title:'The habit loses its grip', body:'Every craving you sat through without ordering weakened the link between the cue and the order. Psychologists call it extinction. A week of it is real rewiring.', src:'Extinction learning in habit research'},
    {h:336, tag:'Day 14', organ:'appetite', title:'Eating less without trying', body:'In the NIH ward trial, two weeks on unprocessed food: people ate about 500 kcal a day less on their own and lost about 1 kg.', src:'Hall et al., Cell Metabolism, 2019'},
    {h:720, tag:'Day 30', organ:'liver', title:'Liver fat within reach', body:'Liver guidelines say losing 3 to 5% of body weight reduces fat in the liver. For you that is roughly {liver}, and a month without junk is how it starts.', src:'AASLD practice guidance'},
    {h:1440, tag:'Day 60', organ:'tongue', title:'Your taste resets', body:'After two to three months on less salt, people start to prefer less salt. Ketchup and chip seasoning begin to taste like too much.', src:'Bertino et al., American Journal of Clinical Nutrition, 1982'},
    {h:2160, tag:'Day 90', organ:'hormones', title:'Mind and hormones', body:'In the SMILES trial, 12 weeks of better eating put 32% of people with depression into remission, against 8%. And as belly fat drops, testosterone climbs back.', src:'Jacka et al., BMC Medicine, 2017'},
    {h:4320, tag:'Day 180', organ:null, title:'Half a year free', body:'About ₹75,000 kept, and six months of meals that built muscle instead of belly fat.', src:'Your November order rate'},
    {h:8760, tag:'Day 365', organ:null, title:'One year free', body:'About ₹1.5 lakh kept, and a year in which your arteries, liver and brain stopped paying the junk tax.', src:'Your November order rate'}
  ];

  const ORGANS = [
    {id:'brain', name:'Brain', side:'l', top:2},
    {id:'tongue', name:'Taste', side:'r', top:12},
    {id:'face', name:'Face & belly', side:'l', top:24},
    {id:'arteries', name:'Arteries', side:'r', top:34},
    {id:'liver', name:'Liver', side:'l', top:46},
    {id:'gut', name:'Gut', side:'r', top:56},
    {id:'appetite', name:'Appetite', side:'l', top:68},
    {id:'hormones', name:'Hormones', side:'r', top:78}
  ];

  // Story decks. unlock = days after install. fx: type (default), count, quiz, bars, particles, ecg. mood: tense, pulse, uplift.
  const DECKS = [
    {id:'nov', label:'Your Nov', glyph:'₹10k', color:'#5a0f16', mood:'tense', art:'rupee', unlock:0, frames:[
      {fx:'count', n:26, big:'orders in 24 days', body:'Zomato and Swiggy, 1 to 24 November, with Blinkit runs on top. About ₹10,000.', src:'Your order history'},
      {big:'A third after 10 PM.', body:'Late-night fees, paid again and again. Night is your danger window.', src:'Your order history'},
      {fx:'quiz', q:'The payment failed. What did you do?', options:['Went to sleep','Ordered again in 2 minutes'], answer:1, body:'At least five times you reordered within two minutes of a failed payment. That is wanting, not hunger.', src:'Your order history'},
      {fx:'count', n:150000, pre:'₹', big:'a year at November’s pace', body:'Before a single doctor’s bill.', src:'Your order history'}
    ]},
    {id:'supersize', label:'30 days', glyph:'30d', color:'#43120c', mood:'pulse', art:'burger', unlock:0, frames:[
      {fx:'count', n:30, suf:' days', big:'of nothing but McDonald’s', body:'Filmmaker Morgan Spurlock ate only McDonald’s, three meals a day, for a month.', src:'Super Size Me, 2004'},
      {fx:'count', n:11, pre:'+', suf:' kg', big:'in one month', body:'He also reported mood swings and exhaustion along the way.', src:'Super Size Me, 2004'},
      {fx:'ecg', big:'His doctors were alarmed.', body:'His liver results got so bad that his doctors urged him to stop.', src:'Super Size Me, 2004'},
      {big:'His was a stunt. Yours is a habit.', body:'He did it for one month on camera. You did 26 orders in 24 days without one.', src:'Your order history'}
    ]},
    {id:'gut', label:'Gut, 10 days', glyph:'1300', color:'#3b2410', mood:'tense', art:'bugs', unlock:0, frames:[
      {big:'10 days of McDonald’s.', body:'A 22-year-old genetics student ate only McDonald’s for 10 days so his father, a professor at King’s College London, could track his gut bacteria.', src:'Tim and Tom Spector, 2015'},
      {fx:'quiz', q:'How many gut species did he lose?', options:['About 50','About 1,300'], answer:1, body:'About 1,300: more than a third of the species he started with.', src:'Tim and Tom Spector, 2015'},
      {fx:'particles', kill:0.37, big:'Watch a third disappear.', body:'One person, not a trial, but it shows how fast it hits.', src:'Tim and Tom Spector, 2015'},
      {big:'It works both ways.', body:'Gut bacteria shift within days of a diet change. Your next three clean days start the rebuild.', src:'David et al., Nature, 2014'}
    ]},
    {id:'ward', label:'The ward', glyph:'NIH', color:'#10263a', mood:'pulse', art:'bed', unlock:1, frames:[
      {big:'20 people. 28 days. One ward.', body:'The NIH admitted 20 adults and controlled every bite: two weeks of ultra-processed food, two weeks of unprocessed.', src:'Hall et al., Cell Metabolism, 2019'},
      {fx:'count', n:500, pre:'+', suf:' kcal', big:'a day, without noticing', body:'On ultra-processed food they ate about 500 kcal more a day.', src:'Hall et al., Cell Metabolism, 2019'},
      {fx:'quiz', q:'Was it the extra sugar and fat?', options:['Yes','No, the processing'], answer:1, body:'Meals were matched for sugar, fat, salt and fibre. The processing itself drove the overeating.', src:'Hall et al., Cell Metabolism, 2019'},
      {big:'Your hunger lies on this food.', body:'About 1 kg gained in two weeks on processed food, about 1 kg lost on unprocessed, eating as much as they liked both times.', src:'Hall et al., Cell Metabolism, 2019'}
    ]},
    {id:'decade', label:'A decade early', glyph:'10y', color:'#3a1020', mood:'pulse', art:'heart', unlock:2, frames:[
      {fx:'ecg', big:'A decade early.', body:'South Asians tend to get heart disease younger than other groups, often by up to ten years.', src:'American Heart Association statement on South Asians, 2018'},
      {fx:'count', n:101, suf:' million', big:'Indians with diabetes', body:'Another 136 million have prediabetes.', src:'ICMR-INDIAB, Lancet Diabetes & Endocrinology, 2023'},
      {fx:'count', n:56, suf:'%', big:'of India’s disease comes from diet', body:'ICMR’s estimate: 56.4% of the total disease burden is down to unhealthy diets.', src:'ICMR-NIN Dietary Guidelines for Indians, 2024'}
    ]},
    {id:'liver', label:'1 in 3 livers', glyph:'1/3', color:'#3a2a10', mood:'tense', art:'liver', unlock:3, frames:[
      {big:'1 in 3 Indian adults.', body:'About one in three has fatty liver disease.', src:'Shalimar et al., Journal of Clinical and Experimental Hepatology, 2022'},
      {big:'You won’t feel it.', body:'Early fatty liver causes no symptoms. It builds quietly while you feel fine.', src:'AIIMS gastroenterology'},
      {big:'3 to 5% fixes a lot.', body:'Losing 3 to 5% of body weight reduces liver fat. For you that is roughly {liver}.', src:'AASLD practice guidance'}
    ]},
    {id:'memory', label:'4 days', glyph:'4d', color:'#1a1a3a', mood:'tense', art:'brain', unlock:4, frames:[
      {fx:'count', n:4, suf:' days', big:'of junk breakfasts', body:'Healthy young adults ate a high-fat, high-sugar breakfast for four days.', src:'Attuquayefio et al., PLOS ONE, 2017'},
      {big:'Memory dropped.', body:'Their hippocampus-dependent learning and memory got worse: the part of the brain your revision depends on.', src:'Attuquayefio et al., PLOS ONE, 2017'},
      {fx:'count', n:50, suf:'%', big:'higher anxiety risk, roughly', body:'Higher ultra-processed food intake is linked to a 48–53% higher risk of anxiety and common mental disorders.', src:'Lane et al., BMJ, 2024'}
    ]},
    {id:'shot', label:'Warning shot', glyph:'!', color:'#2a1a10', mood:'pulse', art:'pipe', unlock:5, frames:[
      {big:'Narrow pipes clog first.', body:'The arteries of the penis are narrower than the heart’s, so they show damage first.', src:'Montorsi et al., artery-size hypothesis'},
      {fx:'ecg', big:'Years of warning.', body:'Erection problems often appear years before a heart attack. Doctors treat them as an early warning sign.', src:'Montorsi et al., artery-size hypothesis'},
      {big:'Belly fat makes estrogen.', body:'Fat tissue turns testosterone into estrogen. Men carrying extra fat have lower testosterone, and losing the fat brings it back.', src:'Endocrinology of obesity'}
    ]},
    {id:'sleep', label:'2 AM brain', glyph:'2AM', color:'#14183a', mood:'tense', art:'moon', unlock:6, frames:[
      {big:'Tired brains want junk.', body:'After one night of lost sleep, the brain’s reward centre lit up more for high-calorie food, and people wanted more of it.', src:'Greer et al., Nature Communications, 2013'},
      {fx:'quiz', q:'When do most of your orders happen?', options:['Lunchtime','After 10 PM'], answer:1, body:'A third of November’s orders came after 10 PM, when your brain is at its weakest.', src:'Your order history'},
      {big:'Close the door before it opens.', body:'A proper dinner, real food ready, and SOS before any app.', src:'Your plan'}
    ]},
    {id:'salt', label:'8 grams', glyph:'8g', color:'#1f2a33', mood:'pulse', art:'salt', unlock:7, frames:[
      {fx:'count', n:8, suf:' g', big:'of salt a day, the Indian average', body:'An ICMR survey found Indians eat about 8 g of salt a day.', src:'ICMR-NCDIS survey, 2023'},
      {fx:'bars', a:['WHO limit',5], b:['Average Indian',8], unit:' g', big:'60% over the limit.', body:'WHO says under 5 g. Sauces, chips and fast food are where most of the extra hides.', src:'WHO; ICMR-NCDIS, 2023'},
      {big:'Salt holds water.', body:'The puffy face the morning after an order is water your body held on to. It drains within days of stopping.', src:'Sodium and fluid balance'}
    ]},
    {id:'testo', label:'Testosterone', glyph:'T', color:'#2a1030', mood:'tense', art:'male', unlock:8, frames:[
      {fx:'count', n:25, pre:'−', suf:'%', big:'testosterone, two hours after sugar', body:'In men given a sugary drink, testosterone fell by about a quarter within two hours.', src:'Caronia et al., Clinical Endocrinology, 2013'},
      {big:'Belly fat keeps it low.', body:'Fat tissue converts testosterone into estrogen.', src:'Endocrinology of obesity'},
      {fx:'quiz', q:'What brings it back?', options:['A supplement','Losing belly fat'], answer:1, body:'Weight loss raises testosterone in men carrying extra fat.', src:'Corona et al., European Journal of Endocrinology, 2013'}
    ]},
    {id:'bliss', label:'Engineered', glyph:'Lab', color:'#2a2a10', mood:'uplift', art:'flask', unlock:9, frames:[
      {big:'It was designed to beat you.', body:'Food scientists tune sugar, salt and fat to a “bliss point”: the exact level that makes you want more.', src:'Michael Moss, Salt Sugar Fat, 2013'},
      {big:'Crunch, then melt.', body:'Foods that vanish in the mouth make your brain think you ate less, so you keep going.', src:'Michael Moss, Salt Sugar Fat, 2013'},
      {fx:'quiz', q:'Who wins if you order tonight?', options:['You','Their algorithm'], answer:1, body:'Every order is a win for their algorithm. Every skipped one is yours.', src:''}
    ]},
    {id:'trans', label:'Bakery fat', glyph:'TF', color:'#3a2410', mood:'tense', art:'patty', unlock:10, frames:[
      {fx:'count', n:500000, big:'heart-disease deaths a year', body:'WHO links industrial trans fat to around half a million deaths from heart disease every year.', src:'WHO REPLACE'},
      {big:'Vanaspati lives in bakery food.', body:'Puffs, patties and fried snacks have long been made with partly hydrogenated fat, the main source of trans fat.', src:'WHO; FSSAI'},
      {big:'India capped it at 2%.', body:'Since 2022 FSSAI limits trans fat to 2% of fat in oils and fats. WHO wants industrial trans fat gone entirely.', src:'FSSAI, 2022'}
    ]},
    {id:'early', label:'Early death', glyph:'21%', color:'#300a0a', mood:'pulse', art:'hourglass', unlock:11, frames:[
      {fx:'count', n:21, suf:'%', big:'higher risk of dying early', body:'People eating the most ultra-processed food had about a 21% higher risk of death from any cause.', src:'Lane et al., BMJ, 2024'},
      {fx:'count', n:50, suf:'%', big:'higher risk of dying from heart disease', body:'The same review, covering nearly 10 million people.', src:'Lane et al., BMJ, 2024'},
      {big:'Pick your side.', body:'Every clean day moves you into the other group.', src:''}
    ]},
    {id:'gutmood', label:'Gut & mood', glyph:'90%', color:'#103a2a', mood:'uplift', art:'bugs', unlock:12, frames:[
      {fx:'count', n:90, suf:'%', big:'of your body’s serotonin is made in the gut', body:'Most of the body’s serotonin comes from cells in the gut lining, and gut bacteria shape how much.', src:'Yano et al., Cell, 2015'},
      {fx:'particles', kill:0, big:'Feed the crowd that feeds you.', body:'Dahi, dal, fruit and vegetables feed the bacteria that junk starves.', src:''}
    ]},
    {id:'sperm', label:'Fertility', glyph:'M', color:'#1a2a3a', mood:'tense', art:'male', unlock:13, frames:[
      {big:'Junk diet, lower sperm count.', body:'In about 3,000 young Danish men, those on a Western-style junk-heavy diet had lower sperm counts than those eating fish, vegetables and whole grains.', src:'Nassan et al., JAMA Network Open, 2020'},
      {fx:'quiz', q:'Which diet came out best?', options:['Pizza and fries','Fish, veg, whole grains'], answer:1, body:'The “prudent” diet had the highest sperm counts.', src:'Nassan et al., JAMA Network Open, 2020'}
    ]}
  ];

  // Reels: full-screen animated warnings with soundtrack and voice-over.
  const REELS = [
    {id:'r1', art:'rupee', me:1, mood:'tense', fx:'quiz', q:'Payment failed at 11:26 PM. What did you do?', options:['Slept','Ordered again at 11:28'], answer:1, body:'At least five times. That is the habit holding the phone.', src:'Your order history'},
    {id:'r2', art:'rupee', me:1, mood:'pulse', fx:'count', n:26, big:'orders in 24 days', body:'1 to 24 November. About ₹10,000. A third after 10 PM.', src:'Your order history'},
    {id:'r3', art:'rupee', me:1, mood:'tense', fx:'count', n:150000, pre:'₹', big:'a year on delivery junk', body:'At November’s pace. Before a single doctor’s bill.', src:'Your order history'},
    {id:'r4', art:'burger', mood:'pulse', fx:'count', n:500, pre:'+', suf:' kcal', big:'a day, without noticing', body:'On ultra-processed food people ate about 500 kcal more a day, with meals matched for sugar, fat, salt and fibre.', src:'Hall et al., Cell Metabolism, 2019'},
    {id:'r5', art:'heart', mood:'pulse', fx:'ecg', big:'About 50% more heart deaths.', body:'A review of nearly 10 million people linked high ultra-processed food intake to around a 50% higher risk of dying from heart disease.', src:'Lane et al., BMJ, 2024'},
    {id:'r6', art:'brain', mood:'tense', fx:'count', n:50, suf:'%', big:'more anxiety risk, roughly', body:'48 to 53% higher risk of anxiety and common mental disorders. The exam needs a calm brain.', src:'Lane et al., BMJ, 2024'},
    {id:'r7', art:'brain', mood:'tense', fx:'count', n:4, suf:' days', big:'to a worse memory', body:'Healthy young adults on a junk breakfast for four days did worse on hippocampus-dependent memory tests.', src:'Attuquayefio et al., PLOS ONE, 2017'},
    {id:'r8', art:'bugs', mood:'tense', fx:'particles', kill:0.37, big:'1,300 species in 10 days.', body:'A student ate only McDonald’s for 10 days. His gut lost about 1,300 bacterial species.', src:'Tim and Tom Spector, 2015'},
    {id:'r9', art:'burger', mood:'pulse', fx:'count', n:11, pre:'+', suf:' kg', big:'in 30 days of McDonald’s', body:'Morgan Spurlock’s liver results alarmed his doctors.', src:'Super Size Me, 2004'},
    {id:'r10', art:'heart', mood:'pulse', fx:'count', n:56, suf:'%', big:'of India’s disease comes from diet', body:'ICMR estimates 56.4% of India’s total disease burden is down to unhealthy diets.', src:'ICMR-NIN Dietary Guidelines for Indians, 2024'},
    {id:'r11', art:'liver', mood:'tense', big:'1 in 3 Indians: fatty liver.', body:'About one in three Indian adults has it. Early on it causes no symptoms at all.', src:'Shalimar et al., Journal of Clinical and Experimental Hepatology, 2022'},
    {id:'r12', art:'heart', mood:'pulse', fx:'count', n:101, suf:' million', big:'Indians with diabetes', body:'And another 136 million with prediabetes.', src:'ICMR-INDIAB, Lancet Diabetes & Endocrinology, 2023'},
    {id:'r13', art:'heart', mood:'pulse', fx:'ecg', big:'A decade early.', body:'South Asians tend to get heart disease younger than other groups, often by up to ten years.', src:'American Heart Association statement on South Asians, 2018'},
    {id:'r14', art:'male', mood:'tense', fx:'count', n:25, pre:'−', suf:'%', big:'testosterone after a sugar hit', body:'In men given a sugary drink, testosterone fell by about a quarter within two hours.', src:'Caronia et al., Clinical Endocrinology, 2013'},
    {id:'r15', art:'pipe', mood:'pulse', fx:'ecg', big:'The warning shot.', body:'The penis’s arteries are narrower than the heart’s, so they clog first. Erection problems often show up years before a heart attack.', src:'Montorsi et al., artery-size hypothesis'},
    {id:'r16', art:'salt', mood:'pulse', fx:'bars', a:['WHO limit',5], b:['Average Indian',8], unit:' g salt', big:'60% over the salt limit.', body:'Sauces, chips and fast food are where most of it hides.', src:'WHO; ICMR-NCDIS, 2023'},
    {id:'r17', art:'patty', mood:'tense', fx:'count', n:500000, big:'heart deaths a year from trans fat', body:'WHO links industrial trans fat, the kind in vanaspati bakery food, to around half a million heart-disease deaths a year.', src:'WHO REPLACE'},
    {id:'r18', art:'flask', mood:'uplift', fx:'quiz', q:'Who designed your craving?', options:['You','Food scientists'], answer:1, body:'Sugar, salt and fat are tuned to a “bliss point” built to make you want more.', src:'Michael Moss, Salt Sugar Fat, 2013'},
    {id:'r19', art:'moon', mood:'tense', big:'Tired brains want junk.', body:'One night of lost sleep made the brain’s reward centre fire harder for high-calorie food.', src:'Greer et al., Nature Communications, 2013'},
    {id:'r20', art:'hourglass', mood:'pulse', fx:'count', n:21, suf:'%', big:'higher risk of dying early', body:'For the people eating the most ultra-processed food.', src:'Lane et al., BMJ, 2024'},
    {id:'r21', art:'bugs', good:1, mood:'uplift', fx:'count', n:90, suf:'%', big:'of your serotonin is made in your gut', body:'Dahi, dal, fruit and vegetables feed the bacteria that junk starves.', src:'Yano et al., Cell, 2015'},
    {id:'r22', art:'brain', good:1, mood:'uplift', fx:'count', n:32, suf:'%', big:'went into remission in 12 weeks', body:'In the SMILES trial, people with depression who improved their diet: 32% remission, against 8%.', src:'Jacka et al., BMC Medicine, 2017'}
  ];

  const FLIPS = [
    {big:'12 weeks can lift depression', body:'In the SMILES trial, 32% of people with depression who improved their diet for 12 weeks went into remission, against 8%.'},
    {big:'The body pays you back fast', body:'In the NIH trial, people on unprocessed food ate less without trying and lost about 1 kg in two weeks.'},
    {big:'Your gut is rebuilding', body:'Gut bacteria shift within days of a diet change. Every clean day feeds a better crowd.'},
    {big:'Your taste will turn', body:'After two to three months on less salt, people prefer less salt. The junk will start to taste like too much.'}
  ];

  // Mom's kitchen: one dish per craving.
  const KITCHEN = [
    {id:'burger', craving:'Burger', name:'Keema burger', mins:20, color:'#7a3b1d', art:'burger', steps:['Mix 250 g chicken keema with 1 egg, grated garlic and ginger, salt, chilli and garam masala.','Shape two patties. Air-fry at 180°C for 12 minutes, flipping halfway.','Fold into a roti with sliced onion and hung curd mixed with garlic and a little mustard.']},
    {id:'tacos', craving:'Tacos or nachos', name:'Makki nachos & salsa', mins:15, color:'#8a6a12', art:'chips', steps:['Roll a makki roti thin, cut into triangles and brush with a few drops of ghee.','Air-fry at 180°C for 6 to 8 minutes until crisp.','Salsa: chopped tomato, onion, green chilli, coriander, lemon and salt. Dip: hung curd with garlic and salt.']},
    {id:'chicken', craving:'Fried chicken', name:'Air-fryer chicken bites', mins:30, color:'#8a3a12', art:'drum', steps:['Toss boneless chicken with besan, curd, chilli, ajwain, ginger-garlic paste and salt. Rest 15 minutes.','Air-fry at 190°C for 12 to 15 minutes, shaking halfway.','Serve with mint chutney.']},
    {id:'sweet', craving:'Ice cream or cake', name:'Chocolate whey soft-serve', mins:5, color:'#4a2a1a', art:'cup', steps:['Slice two bananas and freeze them overnight.','Blend with one scoop of chocolate whey, a spoon of cocoa and a splash of milk until thick.','Eat it straight away, like soft-serve.']},
    {id:'soda', craving:'Soda', name:'Shikanji soda', mins:3, color:'#2f6a3a', art:'glass', steps:['Squeeze one lemon into a glass with a pinch of rock salt, roasted jeera and a few mint leaves.','Add ice and top up with plain soda water.','Same fizz, no syrup.']},
    {id:'latte', craving:'Latte or shake', name:'Protein cold coffee', mins:4, color:'#3a2a20', art:'glass', steps:['Dissolve a teaspoon of instant coffee in two spoons of hot water.','Blend with 200 ml milk, one scoop of chocolate whey and ice.','Thick, cold, and it counts towards your protein.']},
    {id:'chips', craving:'Chips or namkeen', name:'Ghee makhana', mins:8, color:'#6a5a2a', art:'bowl', steps:['Warm a teaspoon of ghee in a pan on low.','Roast two cups of makhana for 6 to 8 minutes until they crunch.','Toss with rock salt and red chilli.']},
    {id:'sauce', craving:'Sauces & ketchup', name:'Tamatar chutney', mins:20, color:'#8a1a12', art:'jar', steps:['Cook four chopped tomatoes with garlic and red chilli for 15 minutes.','Add a splash of vinegar, a little jaggery and salt, then blend.','Keeps five days in the fridge. Use it on real food.']}
  ];

  // Hard truths: one a day on the home screen and the widget (same order in both). Short line, longer detail, source.
  const HARD = [
    {t:'26 orders in 24 days. ₹10,000 gone.', d:'Zomato, Swiggy and Blinkit, 1 to 24 November. A third of them after 10 PM.', s:'Your order history'},
    {t:'Payment failed. You ordered again in 2 minutes.', d:'At least five times. That is not hunger. That is the habit holding the phone.', s:'Your order history'},
    {t:'₹1.5 lakh a year at November’s pace.', d:'Before a single doctor’s bill.', s:'Your order history'},
    {t:'One fast-food meal stiffens your arteries for 4 hours.', d:'A single high-fat fast-food meal cut the arteries’ ability to widen for about four hours.', s:'Vogel et al., American Journal of Cardiology, 1997'},
    {t:'Sugar hit: testosterone down 25% in 2 hours.', d:'In men given a sugary drink, testosterone fell by about a quarter within two hours.', s:'Caronia et al., Clinical Endocrinology, 2013'},
    {t:'4 days of junk breakfasts. Memory got worse.', d:'Healthy young adults did worse on hippocampus-dependent memory tests, the kind your revision depends on.', s:'Attuquayefio et al., PLOS ONE, 2017'},
    {t:'1 in 3 Indian adults has fatty liver.', d:'Early on it causes no symptoms. It builds quietly while you feel fine.', s:'Shalimar et al., Journal of Clinical and Experimental Hepatology, 2022'},
    {t:'South Asians get heart disease up to 10 years earlier.', d:'Often a decade before other groups. You are not the exception.', s:'American Heart Association statement on South Asians, 2018'},
    {t:'Junk-heavy diets: about 50% more heart deaths.', d:'A review of nearly 10 million people linked high ultra-processed food intake to around a 50% higher risk of dying from heart disease.', s:'Lane et al., BMJ, 2024'},
    {t:'Erection problems often come years before a heart attack.', d:'The penis’s arteries are narrower than the heart’s, so they clog first.', s:'Montorsi et al., artery-size hypothesis'},
    {t:'On junk, people ate 500 kcal more a day without noticing.', d:'Meals were matched for sugar, fat, salt and fibre. The processing itself drove the overeating.', s:'Hall et al., Cell Metabolism, 2019'},
    {t:'10 days of McDonald’s: about 1,300 gut species gone.', d:'One student, more than a third of his gut bacterial species, in ten days.', s:'Tim and Tom Spector, 2015'},
    {t:'You eat about 8 g of salt a day. The limit is 5.', d:'That is the Indian average, and sauces, chips and fast food are where most of it hides.', s:'ICMR-NCDIS survey, 2023; WHO'},
    {t:'Belly fat turns your testosterone into estrogen.', d:'Men carrying extra fat have lower testosterone. Losing the fat brings it back.', s:'Endocrinology of obesity'},
    {t:'Most ultra-processed food: 21% higher risk of early death.', d:'For the people eating the most, from any cause.', s:'Lane et al., BMJ, 2024'}
  ];


  // Strictly from his Sep–Nov 2026 Swiggy, Zomato, Blinkit and Instamart orders.
  const NEVER = [
    {t:'Taco Bell', d:'Chalupa, nachos & salsa, nuggets & Lava dip, churros, Diablo sauce', n:'9 orders'},
    {t:'Fried chicken & burgers', d:'KFC popcorn & Zinger, Popeyes burgers & wings, Whopper, McChicken, Fish ’N’ Chips, chicken strips, aloo tikki burger, vada pav'},
    {t:'Shakes & sweet coffee', d:'Cookie crumble, hazelnut & chocolate thickshakes, Dark Lord shake, hazelnut lattes'},
    {t:'Ice cream & cake', d:'Baskin Robbins (4 orders), Mercely’s, Amul & NIC tubs, Go Zero, Theobroma cake, brownies, Subway cookies, Cinnabon'},
    {t:'Packet crunch', d:'Cornitos nachos (4 orders), Doritos, Lay’s, Uncle Chipps, Bikano, Crax, Hide & Seek, “protein” puffs, chips & bars'},
    {t:'Fizz & sauces', d:'Nimbooz (4 orders), Limca, ketchup, Veeba spread, Lava & Diablo sauce'},
    {t:'Takeaway Chinese & pizza', d:'Chilli paneer, chilli chicken, hakka noodles, chopsuey, honey chilli potato, spring rolls, Pino’z pizza, mac & cheese'},
    {t:'Processed meat & cheese', d:'Chicken salami, chicken breakfast sausages, cheese slices'}
  ];
  const EAT = [
    {t:'Tandoori fish tikka', d:'With mint chutney (Barbeque Nation, Fishy Fish Fishy)'},
    {t:'Steamed chicken momos', d:'Steamed, whole wheat if they have it, no mayo (Dumpling Hood, Wow! Momo)'},
    {t:'Paneer thali', d:'Shahi paneer, missi roti, black dal (Shree Gurunanak)'},
    {t:'Grilled chicken & rice', d:'The bowl, not the burger (Burgrill)'},
    {t:'Paneer, dahi, bran bread, lauki', d:'From your grocery runs: cook these at home'}
  ];
  const TICK_NEVER = ['Taco Bell chalupa','Nuggets & Lava dip','Cornitos nachos','KFC popcorn','Popeyes burger','Whopper','Hazelnut latte','Thickshakes','Baskin Robbins','Theobroma cake','Nimbooz','Protein puffs','Chilli paneer','Pino’z pizza','Chicken salami'];
  const TICK_EAT = ['Keema burger at home','Makki nachos & salsa','Air-fryer chicken bites','Chocolate whey soft-serve','Protein cold coffee','Ghee makhana','Shikanji soda','Tandoori fish tikka','Paneer bhurji & roti','Rajma chawal','Egg bhurji','Steamed chicken momos','Palak paneer','Dahi with banana','Almonds & walnuts'];
  const EVERYDAY = [
    ['Protein', 'Eggs (whole, whites, omelette or bhurji) · NAKPRO whey · paneer bhurji, matar or palak paneer · soya chunks · chicken curry or dry chicken · fish tikka or fish gravy · mutton gravy'],
    ['Dal & chana', 'Home dal · black dal · rajma · white chana · kala chana · kadhi · chana salad'],
    ['Roti & rice', 'Whole-wheat roti · missi roti · bran bread · rice'],
    ['Sabzi & salad', 'Saag · any home sabzi · cucumber, onion & beetroot salad'],
    ['Dairy & drinks', 'Milk (malai removed) · homemade dahi · chaas · black coffee · amla-lemon water · ajwain water'],
    ['Fruit', 'Banana · apple · pear · papaya · mango · avocado · persimmon'],
    ['Nuts', 'Almonds · walnuts · raisins · roasted chana']
  ];

  // Decoy ordering app: his real restaurants and the exact dishes he ordered (Sep–Nov 2026).
  // No logos or brand styling; labelled as a decoy. [name, price ₹, approx kcal]
  const SHOPS = [
    {id:'taco', name:'Taco Bell', area:'Phase 3, Mohali', cuisine:'Mexican · Tacos · Shakes', eta:'25–30 min', art:'chips', times:9, failed:3, items:[
      ['Crispy Chalupa Taco (Non Veg)',179,390],['Seasoned Nachos & Salsa',119,330],['4 Nuggets',99,230],['5 Nuggets & Lava Dip',149,440],
      ['Soft Crispy Chicken Taco',129,320],['Soft Taco Grilled Shell Mexican Paneer',119,310],['Soft Taco Chipotle Chicken',129,300],
      ['Hazelnut Cold Coffee Thickshake',129,403],['Cookie Crumble Thickshake',149,520],['Mexican Chocolate Thickshake',149,500],
      ['Mexican Chilli Twists',79,260],['2pcs Churros with Chocolate',119,330],['Lava Sauce',25,90],["Devil's Diablo Sauce (10 pouch combo)",49,60],['Green Salsa Avocado Sauce',30,60]]},
    {id:'snack', name:'Snack run', area:'10-minute delivery', cuisine:'Chips · Fizz · Ice cream', eta:'10 min', art:'jar', times:16, items:[
      ['Cornitos Jalapeno Nachos & Salsa Dip',68,400],['Cornitos Peri Peri Nachos & Salsa Dip',68,400],['7UP Nimbooz 350 ml',25,150],
      ["Lay's Magic Masala",20,290],['Doritos Nacho Cheese',20,230],['Bikano Crunchy Munchy Sweet Chilli',26,480],['Parle Hide & Seek Milano',34,290],
      ['Cadbury Rich & Fudgy Brownie',40,230],["Mercely's Death By Chocolate Ice Cream",219,450],['Amul Choco Chip Ice Cream Tub (1 L)',230,1600],
      ['Go Zero Mocha Fudge Brownie',79,140],['Taali Protein Puffs, Smoky Barbeque',51,250],['Epigamia Turbo Chocolate Protein Shake',99,250],
      ['Limca 2 L',98,860],['Del Monte Tomato Ketchup',99,110]]},
    {id:'nbc', name:'Nothing Before Coffee', area:'Phase 5, Mohali', cuisine:'Coffee · Burgers', eta:'25–30 min', art:'glass', times:6, items:[
      ['Hazelnut Latte',161,250],['Batata Vada Pav',99,300],['NBC Aloo Tikki Burger',119,420],['Brownie With Ice Cream',179,550]]},
    {id:'br', name:'Baskin Robbins', area:'Phase 5, Mohali', cuisine:'Ice cream', eta:'20–25 min', art:'cup', times:4, items:[
      ['Gold Medal Ribbon Ice Cream (double)',229,380],['Three Cheers Chocolate Ice Cream',119,250],['Banana N Strawberry Ice Cream',119,200],['Cotton Candy Ice Cream (small)',99,180]]},
    {id:'faasos', name:'Faasos', area:'Phase 5, Mohali', cuisine:'Wraps · Rolls', eta:'25–30 min', art:'bowl', times:3, items:[
      ['Chicken Extravaganza Wrap',199,550],['Hot Garlic Crispy Chicken Wrap',189,560]]},
    {id:'subway', name:'Subway', area:'Phase 3, Mohali', cuisine:'Sandwiches · Cookies', eta:'25–30 min', art:'burger', times:2, items:[
      ['Double Dark Chunk Chocolate Cookie',69,220],['Roasted Chicken Strip Sandwich (6 in)',259,420],['Paneer Tikka Sandwich (6 in)',239,450]]},
    {id:'shake', name:'Milkshake And Co.', area:'Phase 3, Mohali', cuisine:'Shakes', eta:'20–25 min', art:'cup', times:2, items:[
      ['Dark Lord Shake',229,700],['Dark Invader Shake',229,700]]},
    {id:'yumtum', name:'YumTum China', area:'Phase 5, Mohali', cuisine:'Chinese', eta:'30–35 min', art:'bowl', times:2, items:[
      ['Chilly Paneer Combo',279,800],['Veg Hakka Noodles',149,550],['Veg American Chopsuey',179,650]]},
    {id:'cinnabon', name:'Cinnabon', area:'South Mohali', cuisine:'Desserts · Coffee', eta:'25–30 min', art:'cup', times:2, items:[
      ['Apple Crumble Minibon',149,350],['Latte',148,190]]},
    {id:'popeyes', name:'Popeyes', area:'Phase 3, Mohali', cuisine:'Fried chicken · Burgers', eta:'25–30 min', art:'drum', times:1, failed:1, items:[
      ['American Mayo Burst Chicken Burger',179,550],['Bold Chicken Sandwich Burger',249,650],['Boneless Sweet Chilli Chicken Wings',179,420]]},
    {id:'kfc', name:'KFC', area:'Sector 35, Chandigarh', cuisine:'Fried chicken', eta:'30–35 min', art:'drum', times:1, items:[
      ['Chicken Popcorn Regular',129,300],['Jumbo Zinger Meal',349,950],['Pepsi',60,150]]},
    {id:'bk', name:'Burger King', area:'Phase 3, Mohali', cuisine:'Burgers · Shakes', eta:'25–30 min', art:'burger', times:1, items:[
      ['Original Whopper Chicken (XL bun)',229,700],['Chocolate Thick Shake',119,500]]},
    {id:'mcd', name:"McDonald's", area:'Sector 35, Chandigarh', cuisine:'Burgers', eta:'30–35 min', art:'burger', times:1, items:[
      ['McAloo Tikki',69,340],['McChicken',139,420]]},
    {id:'theo', name:'Theobroma', area:'Phase 3, Mohali', cuisine:'Cakes · Desserts', eta:'30–35 min', art:'cup', times:1, failed:1, items:[
      ['Eggless Rich Chocolate Cake (550g)',648,2200]]},
    {id:'fish', name:"Fish 'N' Chips", area:'Sector 67, Mohali', cuisine:'Fried fish · Chicken', eta:'30–35 min', art:'drum', times:1, failed:1, items:[
      ['Fish N Chips Crumbed (10 strips, 2 dips)',499,950],['Chicken Popcorn',199,400]]},
    {id:'dh', name:'Dumpling Hood', area:'Sector 35, Chandigarh', cuisine:'Asian', eta:'30–35 min', art:'bowl', times:1, items:[
      ['Honey Chilli Potato',199,600],['Spring Roll (2 pcs)',149,350]]},
    {id:'pinoz', name:"Pino'z Pizza", area:'Sector 44', cuisine:'Pizza', eta:'30–35 min', art:'chips', times:1, items:[
      ['Chicken Seekh & Chicken Salami Pizza',299,900],['Jalapeno Dip',30,90]]},
    {id:'wok', name:'Wok N Tok', area:'Phase 5, Mohali', cuisine:'Chinese', eta:'30–35 min', art:'bowl', times:1, items:[
      ['Chilli Chicken Meal',178,750]]},
    {id:'xero', name:'Xero Degrees', area:'North Mohali', cuisine:'Fried chicken · Fries', eta:'25–30 min', art:'drum', times:1, items:[
      ['Chicken Strips',299,600]]}
  ];
  const PAST = [
    {shop:'taco', items:['5 Nuggets & Lava Dip','Hazelnut Cold Coffee Thickshake'], total:257, when:'24 Nov, 8:39 PM'},
    {shop:'snack', items:["Mercely's Death By Chocolate Ice Cream",'Cornitos Jalapeno Nachos & Salsa Dip','7UP Nimbooz 350 ml','Epigamia Turbo Chocolate Protein Shake','Bikano Crunchy Munchy Sweet Chilli','Parle Hide & Seek Milano'], total:506, when:'23 Nov, 8:49 PM'},
    {shop:'subway', items:['Double Dark Chunk Chocolate Cookie','Roasted Chicken Strip Sandwich (6 in)'], total:332, when:'22 Nov, 4:33 PM'},
    {shop:'bk', items:['Original Whopper Chicken (XL bun)','Chocolate Thick Shake'], total:348, when:'21 Nov, 2:58 PM'},
    {shop:'taco', items:['Seasoned Nachos & Salsa','4 Nuggets','4 Nuggets','Lava Sauce'], total:363, when:'18 Nov, 11:28 PM', note:'Your payment failed at 11:26. You ordered again 2 minutes later.'},
    {shop:'popeyes', items:['American Mayo Burst Chicken Burger'], total:195, when:'16 Nov, 11:54 PM', note:'16 minutes after a failed Popeyes payment.'},
    {shop:'theo', items:['Eggless Rich Chocolate Cake (550g)'], total:648, when:'15 Nov, 9:26 PM', note:'Ordered again 1 minute after a failed payment.'},
    {shop:'fish', items:['Fish N Chips Crumbed (10 strips, 2 dips)','Chicken Popcorn'], total:695, when:'4 Nov, 11:08 PM', note:'Ordered again 1 minute after a failed payment.'},
    {shop:'taco', items:['Soft Crispy Chicken Taco','Soft Taco Grilled Shell Mexican Paneer','Cookie Crumble Thickshake','5 Nuggets & Lava Dip'], total:513, when:'3 Nov, 10:52 PM', note:'Ordered again 3 minutes after a failed payment.'},
    {shop:'br', items:['Banana N Strawberry Ice Cream','Gold Medal Ribbon Ice Cream (double)'], total:493, when:'2 Nov, 8:10 PM'}
  ];


  // Why the eat list wins: numbers come from his own food list in the app, or cited studies.
  const GOOD = ['Protein that keeps your muscle while the fat comes off, and keeps you full', 'Fibre that slows the sugar rush and feeds your gut bacteria', 'Potassium that helps your body flush salt: less bloat, lower blood pressure', 'Calcium, iron and vitamin C from real food', 'Omega-3 from fish and walnuts for your heart and brain'];
  const BAD = [['One fast-food meal stiffens your arteries for about 4 hours', 'Vogel et al., 1997'], ['A sugar load drops testosterone by about 25% for 2 hours', 'Caronia et al., 2013'], ['On ultra-processed food, people ate about 500 kcal more a day without noticing', 'Hall et al., NIH, 2019'], ['Four days of junk breakfasts made memory measurably worse', 'Attuquayefio et al., 2017'], ['Packet snacks and sauces push your salt far past the 5 g a day limit', 'ICMR-NIN / WHO']];
  const KWHY = {
    burger: ['Lean chicken keema and egg: about 25–30 g protein a burger, air-fried, no mayo', 'The fried burger: refined bun, mayo and frying oil, and stiffer arteries for hours'],
    tacos: ['Whole-grain makki, fresh salsa and hung curd: fibre, vitamin C and live cultures', 'Packet nachos and Lava dip: refined corn fried in oil, salt and cheese sauce'],
    chicken: ['Same crunch with a teaspoon of oil, and the full protein of real chicken', 'Deep-fried popcorn and nuggets: batter that soaks up reused frying oil'],
    sweet: ['A scoop of whey gives 18 g protein; two bananas, 840 mg potassium. No added sugar', 'Ice cream and cake: sugar and cream, and testosterone down about 25% for 2 hours'],
    soda: ['Lemon, rock salt, jeera and mint: vitamin C and zero added sugar', 'Nimbooz and Limca: sugar water that spikes your energy, then drops it'],
    latte: ['Whey, milk and coffee: about 25 g protein and 250 mg calcium, no syrup', 'Your hazelnut thickshake: 403 kcal, 62 g carbs, only 10 g protein'],
    chips: ['Roasted makhana: light and crunchy, with magnesium and potassium', 'Chips and namkeen: refined oil and salt, and the bag is gone before you notice'],
    sauce: ['Fresh tomato and garlic: lycopene, no preservatives, no added sugar', 'Ketchup is about a fifth sugar, and packet sauces are loaded with salt']
  };
  const EATWHY = {
    'Tandoori fish tikka': '32 g protein in 150 g, from a tandoor instead of a fryer. Fish fat is the heart-friendly kind.',
    'Steamed chicken momos': 'Steamed, not fried: the same comfort food without the oil.',
    'Paneer thali': 'Dal, paneer and missi roti: protein from three sources, plus fibre and iron.',
    'Grilled chicken & rice': '38 g protein in one bowl.',
    'Paneer, dahi, bran bread, lauki': 'The base of your home meals: protein, calcium, fibre.'
  };
  const EVERYWHY = {
    'Protein': 'Eggs: 6 g protein each. Whey: 18 g a scoop. Dry chicken: 38 g in 150 g. Soya chunks: 21 g. Protein keeps your muscle while the fat comes off.',
    'Dal & chana': '9–10 g protein and 6–9 g fibre a katori, plus iron. Fibre slows the sugar rush and feeds your gut.',
    'Roti & rice': 'Whole-wheat roti: 3 g fibre. Missi roti: 6 g protein. Slow fuel instead of a refined-flour spike.',
    'Sabzi & salad': 'Saag: 200 mg calcium and 30 mg vitamin C a katori. Leafy greens carry nitrate, which helps your blood vessels relax.',
    'Dairy & drinks': 'Milk: 250 mg calcium a glass. Dahi and chaas carry live cultures for your gut.',
    'Fruit': 'A banana: 420 mg potassium, which helps your body flush salt. Papaya: 88 mg vitamin C a cup.',
    'Nuts': 'Walnuts carry plant omega-3, almonds magnesium. A handful of roasted chana: 6.5 g protein.'
  };

  const TRIGGERS = ['Late night','Bored','Stressed','After a test','With friends','Actually hungry','Other'];

  return {RATE, FALLBACK_START, TRACK0, HISTORY, MILES, ORGANS, DECKS, REELS, FLIPS, KITCHEN, TRIGGERS, HARD, NEVER, EAT, TICK_NEVER, TICK_EAT, EVERYDAY, SHOPS, PAST, GOOD, BAD, KWHY, EATWHY, EVERYWHY};
})();
