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
    {h:720, tag:'Day 30', organ:'liver', title:'Liver fat within reach', body:'Liver guidelines say losing 3 to 5% of body weight reduces fat in the liver. For you that is roughly 3 to 4.5 kg, and a month without junk is how it starts.', src:'AASLD practice guidance'},
    {h:1440, tag:'Day 60', organ:'tongue', title:'Your taste resets', body:'After two to three months on less salt, people start to prefer less salt. Ketchup and chip seasoning begin to taste like too much.', src:'Bertino et al., American Journal of Clinical Nutrition, 1982'},
    {h:2160, tag:'Day 90', organ:'hormones', title:'Mind and hormones', body:'In the SMILES trial, 12 weeks of better eating put 32% of people with depression into remission, against 8%. And as belly fat drops, testosterone climbs back.', src:'Jacka et al., BMC Medicine, 2017'},
    {h:4320, tag:'Day 180', organ:null, title:'Half a year free', body:'About ₹75,000 kept, and six months of meals that built muscle instead of belly fat.', src:'Your November order rate'},
    {h:8760, tag:'Day 365', organ:null, title:'One year free', body:'About ₹1.5 lakh kept, and a year in which your arteries, liver and brain stopped paying the junk tax.', src:'Your November order rate'}
  ];

  const ORGANS = [
    {id:'brain', name:'Brain', side:'l', top:2},
    {id:'tongue', name:'Taste', side:'r', top:9},
    {id:'arteries', name:'Arteries', side:'r', top:27},
    {id:'face', name:'Face & belly', side:'l', top:22},
    {id:'liver', name:'Liver', side:'l', top:41},
    {id:'gut', name:'Gut', side:'r', top:47},
    {id:'appetite', name:'Appetite', side:'l', top:60},
    {id:'hormones', name:'Hormones', side:'r', top:66}
  ];

  // Story decks. unlock = days after install. The video deck is built by the app.
  const DECKS = [
    {id:'nov', label:'Your Nov', glyph:'₹10k', color:'#5a0f16', unlock:0, art:'rupee', frames:[
      {big:'26 orders. 24 days.', body:'Zomato and Swiggy, 1 to 24 November, with Blinkit runs on top. About ₹10,000.', src:'Your order history'},
      {big:'A third after 10 PM.', body:'Late-night fees, paid again and again. Night is your danger window.', src:'Your order history'},
      {big:'Payment failed. You tried again.', body:'At least five times you reordered within two minutes of a failed payment. That is wanting, not hunger.', src:'Your order history'},
      {big:'₹1.5 lakh a year.', body:'At November’s pace. Before a single doctor’s bill.', src:'Your order history'}
    ]},
    {id:'supersize', label:'30 days', glyph:'30d', color:'#43120c', unlock:0, art:'burger', frames:[
      {big:'30 days.', body:'Filmmaker Morgan Spurlock ate only McDonald’s, three meals a day, for a month.', src:'Super Size Me, 2004'},
      {big:'+11 kg.', body:'He put on about 11 kg and reported mood swings and exhaustion along the way.', src:'Super Size Me, 2004'},
      {big:'His doctors were alarmed.', body:'His liver results got so bad that his doctors urged him to stop.', src:'Super Size Me, 2004'},
      {big:'His was a stunt. Yours is a habit.', body:'He did it for one month on camera. You did 26 orders in 24 days without one.', src:'Your order history'}
    ]},
    {id:'gut', label:'Gut, 10 days', glyph:'1300', color:'#3b2410', unlock:0, art:'bugs', frames:[
      {big:'10 days of McDonald’s.', body:'A 22-year-old genetics student ate only McDonald’s for 10 days so his father, a professor at King’s College London, could track his gut bacteria.', src:'Tim and Tom Spector, 2015'},
      {big:'About 1,300 species gone.', body:'More than a third of the bacterial species he started with. One person, not a trial, but it shows how fast it hits.', src:'Tim and Tom Spector, 2015'},
      {big:'He turned grey.', body:'He felt fine for three days, then sluggish. By the end of the week his friends said he looked grey.', src:'Tim and Tom Spector, 2015'},
      {big:'It works both ways.', body:'Gut bacteria shift within days of a diet change. Your next three clean days start the rebuild.', src:'David et al., Nature, 2014'}
    ]},
    {id:'ward', label:'The ward', glyph:'NIH', color:'#10263a', unlock:1, art:'bed', frames:[
      {big:'20 people. 28 days. One ward.', body:'The NIH admitted 20 adults and controlled every bite: two weeks of ultra-processed food, two weeks of unprocessed.', src:'Hall et al., Cell Metabolism, 2019'},
      {big:'+500 kcal a day.', body:'On ultra-processed food they ate about 500 kcal more a day, even though meals were matched for sugar, fat, salt and fibre.', src:'Hall et al., Cell Metabolism, 2019'},
      {big:'+1 kg, then −1 kg.', body:'About 1 kg gained in two weeks on processed food, about 1 kg lost on unprocessed, eating as much as they liked both times.', src:'Hall et al., Cell Metabolism, 2019'},
      {big:'Your hunger lies on this food.', body:'It is not just willpower. This food overrides fullness.', src:'Hall et al., Cell Metabolism, 2019'}
    ]},
    {id:'decade', label:'A decade early', glyph:'10y', color:'#3a1020', unlock:2, art:'heart', frames:[
      {big:'A decade early.', body:'South Asians tend to get heart disease younger than other groups, often by up to ten years.', src:'American Heart Association statement on South Asians, 2018'},
      {big:'101 million.', body:'Indians living with diabetes. Another 136 million have prediabetes.', src:'ICMR-INDIAB, Lancet Diabetes & Endocrinology, 2023'},
      {big:'56%.', body:'ICMR estimates that 56.4% of India’s total disease burden comes from unhealthy diets.', src:'ICMR-NIN Dietary Guidelines for Indians, 2024'}
    ]},
    {id:'liver', label:'1 in 3 livers', glyph:'1/3', color:'#3a2a10', unlock:3, art:'liver', frames:[
      {big:'1 in 3.', body:'About one in three Indian adults has fatty liver disease.', src:'Shalimar et al., Journal of Clinical and Experimental Hepatology, 2022'},
      {big:'You won’t feel it.', body:'Early fatty liver causes no symptoms. It builds quietly while you feel fine.', src:'AIIMS gastroenterology'},
      {big:'3 to 5% fixes a lot.', body:'Losing 3 to 5% of body weight reduces liver fat. For you that is roughly 3 to 4.5 kg.', src:'AASLD practice guidance'}
    ]},
    {id:'memory', label:'4 days', glyph:'4d', color:'#1a1a3a', unlock:4, art:'brain', frames:[
      {big:'4 days.', body:'Healthy young adults ate a high-fat, high-sugar breakfast for four days.', src:'Attuquayefio et al., PLOS ONE, 2017'},
      {big:'Memory dropped.', body:'Their hippocampus-dependent learning and memory got worse: the part of the brain your revision depends on.', src:'Attuquayefio et al., PLOS ONE, 2017'},
      {big:'Anxiety up about half.', body:'Higher ultra-processed food intake is linked to a 48–53% higher risk of anxiety and common mental disorders.', src:'Lane et al., BMJ, 2024'}
    ]},
    {id:'shot', label:'Warning shot', glyph:'!', color:'#2a1a10', unlock:5, art:'pipe', frames:[
      {big:'Narrow pipes clog first.', body:'The arteries of the penis are narrower than the heart’s, so they show damage first.', src:'Montorsi et al., artery-size hypothesis'},
      {big:'Years of warning.', body:'Erection problems often appear years before a heart attack. Doctors treat them as an early warning sign.', src:'Montorsi et al., artery-size hypothesis'},
      {big:'Belly fat makes estrogen.', body:'Fat tissue turns testosterone into estrogen. Men carrying extra fat have lower testosterone, and losing the fat brings it back.', src:'Endocrinology of obesity'}
    ]}
  ];

  // Reels: full-screen warnings.
  const REELS = [
    {id:'r1', me:1, big:'You reordered in 2 minutes.', body:'The payment failed. You tried again straight away, at least five times. That is the habit holding the phone.', src:'Your order history'},
    {id:'r2', me:1, big:'26 orders in 24 days.', body:'1 to 24 November. About ₹10,000. A third after 10 PM.', src:'Your order history'},
    {id:'r3', me:1, big:'₹1.5 lakh a year.', body:'At November’s pace, that is what delivery junk costs you in a year.', src:'Your order history'},
    {id:'r4', big:'Your hunger lies on this food.', body:'On ultra-processed food, people ate about 500 kcal more a day and gained about 1 kg in two weeks, with meals matched for sugar, fat, salt and fibre.', src:'Hall et al., Cell Metabolism, 2019'},
    {id:'r5', big:'About 50% more heart deaths.', body:'A review covering nearly 10 million people linked higher ultra-processed food intake to around a 50% higher risk of dying from heart disease.', src:'Lane et al., BMJ, 2024'},
    {id:'r6', big:'Anxiety up by about half.', body:'48 to 53% higher risk of anxiety and common mental disorders. The exam needs a calm brain.', src:'Lane et al., BMJ, 2024'},
    {id:'r7', big:'4 days to a worse memory.', body:'Lean, healthy young adults ate a high-fat, high-sugar breakfast for four days. Their hippocampus-dependent memory got worse.', src:'Attuquayefio et al., PLOS ONE, 2017'},
    {id:'r8', big:'1,300 species in 10 days.', body:'A student ate only McDonald’s for 10 days. His gut lost about 1,300 bacterial species, and his friends said he had turned grey.', src:'Tim and Tom Spector, 2015'},
    {id:'r9', big:'30 days. 11 kg.', body:'Morgan Spurlock ate only McDonald’s for a month. He put on about 11 kg and his liver results alarmed his doctors.', src:'Super Size Me, 2004'},
    {id:'r10', big:'56% of India’s disease.', body:'ICMR estimates that 56.4% of India’s total disease burden comes from unhealthy diets.', src:'ICMR-NIN Dietary Guidelines for Indians, 2024'},
    {id:'r11', big:'1 in 3 Indians: fatty liver.', body:'About one in three Indian adults has fatty liver disease. Early on it causes no symptoms at all.', src:'Shalimar et al., Journal of Clinical and Experimental Hepatology, 2022'},
    {id:'r12', big:'101 million diabetics.', body:'India has about 101 million people with diabetes and another 136 million with prediabetes.', src:'ICMR-INDIAB, Lancet Diabetes & Endocrinology, 2023'},
    {id:'r13', big:'A decade early.', body:'South Asians tend to get heart disease younger than other groups, often by up to ten years.', src:'American Heart Association statement on South Asians, 2018'},
    {id:'r14', big:'Belly fat makes estrogen.', body:'Fat tissue turns testosterone into estrogen. Men carrying extra fat have lower testosterone. Losing the fat brings it back.', src:'Endocrinology of obesity'},
    {id:'r15', big:'The warning shot.', body:'The penis’s arteries are narrower than the heart’s, so they clog first. Erection problems often show up years before a heart attack.', src:'Montorsi et al., artery-size hypothesis'},
    {id:'r16', big:'One meal, four hours.', body:'A single high-fat fast-food meal cut the arteries’ ability to widen for about four hours.', src:'Vogel et al., American Journal of Cardiology, 1997'},
    {id:'r17', big:'1 in 5 deaths.', body:'Poor diet was linked to about 11 million deaths worldwide in 2017, around one in five adult deaths.', src:'GBD 2017 Diet Collaborators, The Lancet, 2019'}
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

  const TRIGGERS = ['Late night','Bored','Stressed','After a test','With friends','Actually hungry','Other'];

  return {RATE, FALLBACK_START, TRACK0, HISTORY, MILES, ORGANS, DECKS, REELS, FLIPS, KITCHEN, TRIGGERS};
})();
