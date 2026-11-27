// Builds foods.js. Run: node tools/build-foods.js
// Raw ingredients are per 100 g. Home dishes are worked out from a recipe and the cooked weight,
// so every dish's numbers trace back to ingredient data (USDA FoodData Central SR Legacy, IFCT 2017, pack labels).
// Columns: kcal, protein, carbs, fat, fibre g, sodium mg, potassium mg, calcium mg, iron mg, vitamin C mg, zinc mg,
// then sugars g (all, incl. milk and fruit), added sugar g, magnesium mg, vitamin B12 µg, vitamin D µg, folate µg, vitamin A µg RAE
const fs = require('fs'), path = require('path');
const I = {
  atta:   [362, 10.5, 76.8, 1.4, 10.8, 2, 363, 34, 3.6, 0, 2.6, 0.4, 0, 137, 0, 0, 44, 0],     // Aashirvaad whole-wheat atta label; minerals USDA
  mgatta: [365, 14.5, 72.9, 1.7, 13.0, 11, 400, 45, 4.3, 0, 3.0, 1.0, 0, 140, 0, 0, 50, 0],     // Aashirvaad Multigrains atta label
  besan:  [387, 22.4, 57.8, 6.7, 10.8, 64, 846, 45, 4.9, 0, 2.8, 10.9, 0, 166, 0, 0, 437, 2],     // USDA chickpea flour
  makki:  [362, 8.1, 76.9, 3.6, 7.3, 35, 287, 6, 3.5, 0, 1.7, 0.6, 0, 127, 0, 0, 25, 11],        // USDA whole-grain cornmeal
  urad:   [341, 25.2, 59.0, 1.6, 18.3, 38, 983, 138, 7.6, 0, 3.4, 1, 0, 267, 0, 0, 216, 2],    // USDA mungo beans (whole urad)
  rajma:  [337, 22.5, 61.3, 1.1, 15.2, 12, 1359, 83, 6.7, 4.5, 2.8, 2.2, 0, 138, 0, 0, 394, 0],  // USDA red kidney beans
  kabuli: [378, 20.5, 63.0, 6.0, 12.2, 24, 718, 57, 4.3, 4.0, 2.8, 10.7, 0, 115, 0, 0, 557, 3],   // USDA chickpeas
  desi:   [360, 20.5, 61.0, 5.0, 17.0, 24, 800, 150, 6.0, 3.0, 3.0, 8, 0, 130, 0, 0, 400, 3],  // IFCT Bengal gram, whole
  toor:   [343, 21.7, 62.8, 1.5, 9.0, 17, 1100, 75, 3.9, 0, 2.5, 1, 0, 183, 0, 0, 456, 1],     // IFCT red gram dal
  soya:   [345, 52, 33, 0.5, 13, 15, 1500, 350, 20, 0, 4.0, 15, 0, 290, 0, 0, 305, 2],          // Nutrela soya chunks label
  paneer: [230, 17, 3.5, 16.5, 0, 25, 100, 400, 0.2, 0, 2.5, 2.5, 0, 20, 0.5, 0.2, 10, 120],         // home paneer, malai removed (estimate)
  chicken:[119, 21.4, 0, 3.1, 0, 77, 229, 12, 0.9, 0, 1.5, 0, 0, 25, 0.37, 0.1, 7, 9],           // USDA broiler meat only, raw
  goat:   [120, 20.5, 0, 4.0, 0, 82, 385, 13, 2.8, 0, 4.0, 0, 0, 31, 1.13, 0, 5, 0],           // USDA goat, curry cut with some fat
  fish:   [95, 18, 0, 2.5, 0, 70, 350, 30, 0.5, 0, 0.5, 0, 0, 27, 1.6, 3.0, 24, 0],              // white fish fillet, raw
  egg:    [143, 12.6, 0.7, 9.5, 0, 142, 138, 56, 1.75, 0, 1.29, 0.4, 0, 12, 0.89, 2.0, 47, 160],      // USDA whole egg
  onion:  [40, 1.1, 9.3, 0.1, 1.7, 4, 146, 23, 0.21, 7.4, 0.17, 4.2, 0, 10, 0, 0, 19, 0],
  tomato: [18, 0.9, 3.9, 0.2, 1.2, 5, 237, 10, 0.27, 13.7, 0.17, 2.6, 0, 11, 0, 0, 15, 42],
  spinach:[23, 2.9, 3.6, 0.4, 2.2, 79, 558, 99, 2.7, 28.1, 0.53, 0.4, 0, 79, 0, 0, 194, 469],
  sarson: [27, 2.9, 4.7, 0.4, 3.2, 20, 384, 115, 1.64, 70, 0.25, 1.3, 0, 32, 0, 0, 12, 151],
  peas:   [81, 5.4, 14.5, 0.4, 5.7, 5, 244, 25, 1.47, 40, 1.24, 5.7, 0, 33, 0, 0, 65, 38],
  potato: [77, 2.0, 17.5, 0.1, 2.1, 6, 425, 12, 0.8, 19.7, 0.3, 0.8, 0, 23, 0, 0, 15, 0],
  veg:    [30, 1.8, 5.5, 0.2, 2.3, 20, 280, 30, 0.6, 35, 0.3, 2.5, 0, 15, 0, 0, 50, 20],        // cauliflower, cabbage, beans, capsicum average
  cucumber:[15, 0.65, 3.6, 0.1, 0.5, 2, 147, 16, 0.28, 2.8, 0.2, 1.7, 0, 13, 0, 0, 7, 5],
  beet:   [43, 1.6, 9.6, 0.2, 2.8, 78, 325, 16, 0.8, 4.9, 0.35, 6.8, 0, 23, 0, 0, 109, 2],
  dahi:   [60, 3.4, 4.7, 3.0, 0, 46, 155, 121, 0.05, 0.5, 0.59, 4.7, 0, 12, 0.37, 0.1, 7, 27],
  oil:    [884, 0, 0, 100, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0],                       // mustard oil, olive oil or ghee
  salt:   [0, 0, 0, 0, 0, 38758, 8, 24, 0.3, 0, 0, 0, 0, 1, 0, 0, 0, 0],
  water:  [0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0]
};
const K = ['kcal','p','c','f','fib','na','k','ca','fe','vc','zn','sug','asug','mg','b12','vd','fol','va'];
// recipe: [[ingredient, grams]...], cooked weight in grams (bones included where noted)
// Home cooking usually uses more oil than a recipe says, so dishes cooked in oil or ghee
// get a 15% calorie safety margin, all of it counted as fat (that's where the extra comes from).
const BUFFER = 0.15;
function dish(parts, yieldG) {
  const t = K.map(() => 0);
  parts.forEach(([n, g]) => { const r = I[n]; if (!r) throw n; r.forEach((v, i) => t[i] += v * g / 100); });
  const out = t.map(v => v / yieldG * 100);
  if (parts.some(([n]) => n === 'oil')) { const extra = out[0] * BUFFER; out[0] += extra; out[3] += extra / 9; out.buf = true; }
  return out;
}
const R = {
  dal:        [dish([['toor',100],['oil',15],['onion',60],['tomato',60],['salt',5]], 500), '100 g toor dal, 1 tbsp oil or ghee tadka, onion, tomato, cooked to 500 g'],
  maah:       [dish([['urad',100],['oil',22],['onion',60],['tomato',80],['salt',6]], 550), '100 g whole urad, 1½ tbsp ghee or oil, cooked to 550 g'],
  rajma:      [dish([['rajma',100],['oil',15],['onion',80],['tomato',100],['salt',6]], 500), '100 g rajma, 1 tbsp oil, cooked to 500 g'],
  chana:      [dish([['kabuli',100],['oil',15],['onion',80],['tomato',100],['salt',6]], 450), '100 g kabuli chana, 1 tbsp oil, cooked to 450 g'],
  kala:       [dish([['desi',100],['oil',10],['onion',50],['tomato',50],['salt',5]], 330), '100 g kala chana, 2 tsp oil, cooked dry-ish to 330 g'],
  chanasalad: [dish([['kabuli',100],['onion',50],['tomato',50],['cucumber',40],['salt',2]], 390), 'boiled kabuli chana with onion, tomato, cucumber, lemon; no oil'],
  kadhi:      [dish([['dahi',300],['besan',40],['potato',100],['oil',10],['salt',5]], 800), '300 g dahi, 40 g besan, 100 g potato, 2 tsp oil, cooked to 800 g'],
  paneerb:    [dish([['paneer',200],['oil',10],['onion',60],['tomato',60],['salt',3]], 300), '200 g home paneer, 2 tsp oil, onion, tomato'],
  matar:      [dish([['paneer',200],['peas',100],['oil',15],['onion',100],['tomato',150],['salt',6]], 700), '200 g home paneer, 100 g peas, 1 tbsp oil, cooked to 700 g'],
  palak:      [dish([['paneer',200],['spinach',400],['oil',15],['onion',80],['tomato',80],['salt',6]], 650), '200 g home paneer, 400 g spinach, 1 tbsp oil'],
  paneergravy:[dish([['paneer',200],['oil',15],['onion',120],['tomato',150],['salt',5]], 550), '200 g home paneer, 1 tbsp oil, onion-tomato gravy, no cream'],
  soya:       [dish([['soya',50],['oil',10],['onion',80],['tomato',100],['salt',4]], 350), '50 g dry soya chunks, 2 tsp oil, cooked to 350 g'],
  chicken:    [dish([['chicken',375],['oil',25],['onion',150],['tomato',150],['dahi',50],['salt',8]], 750), '500 g bone-in chicken (125 g of it bone), 2 tbsp oil; weigh as served, bones in'],
  drychicken: [dish([['chicken',500],['oil',15],['onion',100],['tomato',50],['dahi',50],['salt',7]], 480), '500 g boneless chicken, 1 tbsp oil, bhuna dry'],
  drychickenb:[dish([['chicken',375],['oil',15],['onion',100],['tomato',50],['dahi',50],['salt',7]], 515), '500 g bone-in chicken (125 g bone), 1 tbsp oil; weigh with bones'],
  fish:       [dish([['fish',500],['dahi',100],['besan',20],['oil',15],['salt',5]], 470), '500 g fish, curd-besan marinade, 1 tbsp oil, tandoor or air-fried'],
  fishgravy:  [dish([['fish',500],['oil',25],['onion',150],['tomato',150],['salt',8]], 900), '500 g fish, 2 tbsp oil, onion-tomato gravy'],
  mutton:     [dish([['goat',375],['oil',30],['onion',200],['tomato',150],['dahi',50],['salt',8]], 800), '500 g bone-in mutton (125 g bone), 2 tbsp oil or ghee; weigh with bones'],
  saag:       [dish([['sarson',500],['spinach',150],['makki',30],['oil',20],['onion',50],['salt',6]], 600), 'sarson and palak with makki atta, 4 tsp ghee'],
  sabzi:      [dish([['veg',500],['oil',15],['onion',50],['tomato',50],['salt',4]], 450), 'mixed vegetables, 1 tbsp oil'],
  salad:      [dish([['cucumber',60],['onion',40],['beet',50]], 150), 'cucumber, onion, beetroot, green chilli, lemon'],
  omelette:   [dish([['egg',100],['oil',5],['onion',20],['tomato',20],['salt',1]], 135), '2 eggs, 1 tsp oil, onion, tomato'],
  roti:       [dish([['atta',75]], 100), '30 g atta per roti, about 40 g cooked, no ghee'],
  mgroti:     [dish([['mgatta',75]], 100), '30 g Aashirvaad Multigrains atta per roti, about 40 g cooked, no ghee'],
  missi:      [dish([['besan',20],['atta',20],['oil',3],['onion',10],['salt',1]], 55), '20 g besan + 20 g atta, ½ tsp oil'],
  chaas:      [dish([['dahi',33],['water',67],['salt',0.4]], 100), '1 part dahi to 2 parts water, salted']
};
// [id, name, category, per-100g row or recipe key, units [[label, grams]...], packaged, kind, note]
// kind: 'main' = made at home for lunch or dinner, 'side' = what goes with it
const F = [
  ['amla','Amla & lemon warm water','Drinks',[3.2,0.04,0.8,0,0.16,2,16,2.4,0.04,24,0.02,0.3,0,1,0,0,1,1],[['glass',250]],0,'',''],
  ['ajwain','Ajwain water','Drinks',[0.8,0.04,0.16,0,0.08,2,4,3.2,0.08,0,0.01,0,0,1,0,0,0,0],[['glass',250]],0,'',''],
  ['egg','Whole egg','Protein',I.egg,[['egg',50]],0,'','USDA'],
  ['white','Egg white','Protein',[52,10.9,0.7,0.2,0,166,163,7,0.08,0,0.03,0.7,0,11,0.09,0,4,0],[['white',33]],0,'','USDA'],
  ['omelette','Omelette or bhurji, 2 eggs','Protein','omelette',[['omelette',135]],0,'main',''],
  ['milk','A2 milk, malai removed','Drinks',[50,3.3,4.8,2.0,0,44,150,120,0.03,0,0.42,5.0,0,11,0.5,0.1,5,30],[['glass (210 ml)',210]],0,'','like 2% milk'],
  ['whey','NAKPRO Impact whey','Protein',[369,53.3,32.4,2.9,0,180,480,360,0.9,0,1.0,20,0,150,1.5,0,10,0],[['level scoop',33]],1,'','label: 45 g = 24 g protein, 166 kcal; sugars estimated as milk sugar (label gives carbs only)'],
  ['cosmix','Cosmix plant protein','Protein',[379,62.1,26.8,2.4,15.5,400,400,150,8,0,2.0,2,0,150,0,0,30,0],[['scoop',38]],1,'','label: 38 g = 23.6 g protein, 144 kcal'],
  ['bran','La Americana bran bread','Carbs',[248,8.8,47.8,3.4,4.0,486,227,74,3.1,0,1.3,5,3,80,0,0,40,0],[['slice',27]],1,'side','USDA wheat-bran bread; sugar estimated, check your pack'],
  ['ketchup','Heinz ketchup','Add-ons',[101,1.0,27.4,0.1,0.3,907,281,15,0.35,4.1,0.2,21.3,20,13,0,0,9,24],[['tbsp',15]],1,'','USDA'],
  ['mgroti','Multigrain roti','Carbs','mgroti',[['roti',40]],0,'side',''],
  ['roti','Whole-wheat roti','Carbs','roti',[['roti',40]],0,'side',''],
  ['missi','Missi roti','Carbs','missi',[['roti',55]],0,'side',''],
  ['rice','White rice, cooked','Carbs',[130,2.7,28.2,0.3,0.4,1,35,10,0.2,0,0.5,0.1,0,12,0,0,3,0],[['katori',150]],0,'side','USDA'],
  ['dal','Home dal','Dal & legumes','dal',[['katori',150]],0,'main',''],
  ['maah','Black dal (maah)','Dal & legumes','maah',[['katori',150]],0,'main',''],
  ['rajma','Rajma','Dal & legumes','rajma',[['katori',150]],0,'main',''],
  ['chana','White chana curry','Dal & legumes','chana',[['katori',150]],0,'main',''],
  ['kala','Kala chana','Dal & legumes','kala',[['katori',150]],0,'main',''],
  ['kadhi','Kadhi with potato','Dal & legumes','kadhi',[['katori',150]],0,'main',''],
  ['chanasalad','White chana salad','Dal & legumes','chanasalad',[['bowl',150]],0,'main',''],
  ['paneerb','Paneer bhurji (home paneer)','Protein','paneerb',[['bowl',150]],0,'main',''],
  ['matar','Matar paneer','Protein','matar',[['katori',150]],0,'main',''],
  ['palak','Palak paneer','Protein','palak',[['katori',150]],0,'main',''],
  ['paneergravy','Paneer gravy','Protein','paneergravy',[['katori',150]],0,'main',''],
  ['paneer','Home paneer, plain','Protein',I.paneer,[['piece (50 g)',50]],0,'',''],
  ['soya','Soya chunks curry','Protein','soya',[['katori',150]],0,'main',''],
  ['chicken','Chicken curry, bone-in','Protein','chicken',[['bowl',250]],0,'main',''],
  ['drychicken','Dry chicken, boneless','Protein','drychicken',[['plate',150]],0,'main',''],
  ['drychickenb','Dry chicken, bone-in','Protein','drychickenb',[['plate',200]],0,'main',''],
  ['burgrill','Grilled chicken & rice (Burgrill)','Protein',[158.1,9.5,15,6.3,0.75,275,125,12.5,0.6,1.25,1.0,1,0.5,20,0.2,0,10,10],[['regular bowl',400]],0,'main','restaurant estimate; +15% calories for extra oil'],
  ['fish','Fish tikka','Protein','fish',[['plate',150]],0,'main',''],
  ['fishgravy','Fish gravy','Protein','fishgravy',[['bowl',250]],0,'main',''],
  ['mutton','Mutton gravy','Protein','mutton',[['bowl',250]],0,'main',''],
  ['saag','Saag','Veg','saag',[['katori',150]],0,'main',''],
  ['sabzi','Vegetable sabzi','Veg','sabzi',[['katori',150]],0,'main',''],
  ['salad','Raw salad (cucumber, onion, beetroot)','Veg','salad',[['plate',150]],0,'side',''],
  ['dahi','Homemade dahi','Drinks',I.dahi,[['katori',150]],0,'side',''],
  ['chaas','Diluted curd / chaas','Drinks','chaas',[['glass',250]],0,'side',''],
  ['coffee','Black coffee','Drinks',[1,0.12,0,0,0,2,49,2,0.01,0,0.02,0,0,3,0,0,2,0],[['cup',240]],0,'',''],
  ['banana','Banana','Fruit',[89,1.1,22.8,0.3,2.6,1,358,5,0.26,8.7,0.15,12.2,0,27,0,0,20,3],[['medium',118]],0,'','USDA'],
  ['apple','Apple','Fruit',[52,0.26,13.8,0.17,2.4,1,107,6,0.12,4.6,0.04,10.4,0,5,0,0,3,3],[['medium',182]],0,'','USDA'],
  ['pear','Pear','Fruit',[57,0.36,15.2,0.14,3.1,1,116,9,0.18,4.3,0.1,9.8,0,7,0,0,7,1],[['medium',178]],0,'','USDA'],
  ['papaya','Papaya','Fruit',[43,0.47,10.8,0.26,1.7,8,182,20,0.25,60.9,0.08,7.8,0,21,0,0,37,47],[['cup',145]],0,'','USDA'],
  ['mango','Mango','Fruit',[60,0.82,15,0.38,1.6,1,168,11,0.16,36.4,0.09,13.7,0,10,0,0,43,54],[['cup',165]],0,'','USDA'],
  ['avocado','Avocado','Fruit',[160,2,8.5,14.7,6.7,7,485,12,0.55,10,0.64,0.7,0,29,0,0,81,7],[['half',100]],0,'','USDA'],
  ['persimmon','Persimmon','Fruit',[70,0.58,18.6,0.19,3.6,1,161,8,0.15,7.5,0.11,12.5,0,9,0,0,8,81],[['medium',168]],0,'','USDA'],
  ['almonds','Almonds','Nuts',[579,21.2,21.6,49.9,12.5,1,733,269,3.7,0,3.1,4.4,0,270,0,0,44,0],[['10 almonds',12]],0,'','USDA'],
  ['walnuts','Walnuts','Nuts',[654,15.2,13.7,65.2,6.7,2,441,98,2.9,1.3,3.1,2.6,0,158,0,0,98,1],[['4 halves',14]],0,'','USDA'],
  ['raisins','Raisins','Nuts',[299,3.1,79.2,0.5,3.7,11,749,50,1.9,2.3,0.22,59.2,0,32,0,0,5,0],[['tbsp',9]],0,'','USDA'],
  ['roastchana','Roasted chana','Nuts',[369,21.7,57,5.6,16.8,30,800,58,6.0,0,3.4,8,0,140,0,0,200,3],[['handful',30]],0,'','IFCT'],
  ['epigamia','Epigamia Turbo protein shake','Packaged',[54,10,3,0.2,0,87,120,110,0.05,0,0.4,4,0,12,0.4,0,5,20],[['bottle (250 ml)',250]],1,'','label: 25 g protein, about 135 kcal'],
  ['rawpressery','Raw Pressery protein shake','Packaged',[85.5,9,12,0.35,0.5,60,150,120,0.1,0,0.4,8,4,15,0.3,0,5,20],[['bottle (200 ml)',200]],1,'','label: 18 g protein, 171 kcal; sugar estimated, check your pack'],
  ['rawpressery25','Raw Pressery 25 g protein shake','Packaged',[84,10.1,10.1,0.33,0,60,150,120,0.1,0,0.4,6,3,15,0.3,0,5,20],[['bottle (250 ml)',250]],1,'','label: 84 kcal per 100 ml'],
  ['ritebite','RiteBite Max Protein bar','Packaged',[427,28.6,51.1,21.3,7.1,290,210,140,2.1,0,1.5,5,0,100,0.5,0,50,0],[['bar (70 g)',70]],1,'','label: 20 g protein, 299 kcal; sold as no added sugar, check your pack'],
  ['superyou','SuperYou protein wafer','Packaged',[475,25,51.3,23.5,7.5,300,200,50,1.5,0,1.0,15,10,60,0,0,20,0],[['wafer (40 g)',40]],1,'','label: 10 g protein, 190 kcal; sugar estimated, check your pack'],
  ['taali','Taali protein puffs','Packaged',[415,17,53,15,5,1012,300,50,2.5,0,2.0,3,1,60,0,0,20,0],[['pack (60 g)',60]],1,'','label: 415 kcal per 100 g'],
  ['sugar','Sugar or brown sugar','Add-ons',[380,0.1,98,0,0,28,133,83,0.7,0,0.03,97,97,9,0,0,1,0],[['spoon (7 g)',7]],0,'','USDA brown sugar; your spoon weighs 7 g'],
  ['gur','Jaggery (gur)','Add-ons',[383,0.4,95,0.1,0,30,1050,80,2.6,0,0.2,85,85,70,0,0,0,0],[['piece',10]],0,'','IFCT jaggery; counts as added sugar'],
  ['honey','Honey','Add-ons',[304,0.3,82.4,0,0.2,4,52,6,0.42,0.5,0.22,82.1,82.1,2,0,0,2,0],[['tsp',7]],0,'','USDA; counts as added sugar'],
  ['malai','Malai (milk cream)','Add-ons',[340,2.8,2.7,36,0,27,95,66,0.1,0.6,0.2,2.9,0,7,0.2,0.6,4,411],[['tbsp',15]],0,'','USDA heavy cream'],
  ['ghee','Extra ghee or oil','Add-ons',I.oil,[['tsp',5]],0,'side','']
];
const r2 = x => Math.round(x * 100) / 100;
const FOODS = F.map(([id, name, cat, src, units, pk, kind, note]) => {
  const row = typeof src === 'string' ? R[src][0] : src;
  const how = typeof src === 'string' ? R[src][1] + (R[src][0].buf ? '; +15% calories for extra oil' : '') : note;
  const o = {id, name, cat, units, pk: !!pk, kind, note: how};
  K.forEach((k, i) => o[k] = r2(row[i]));
  return o;
});
// Old logs stored a count of servings; these are the serving weights they meant.
const LEGACY_G = {amla:250, ajwain:250, egg:50, white:33, omelette:135, milk:210, whey:33, cosmix:38, bran:27, ketchup:15, roti:40, missi:55, rice:150, dal:150, maah:150, rajma:150, chana:150, kala:150, kadhi:200, chanasalad:150, paneerb:150, matar:200, palak:200, soya:180, chicken:250, drychicken:150, burgrill:400, fish:150, fishgravy:250, mutton:250, saag:150, sabzi:150, salad:150, dahi:150, chaas:250, coffee:240, banana:118, apple:182, pear:178, papaya:145, mango:165, avocado:100, persimmon:168, almonds:12, walnuts:14, raisins:9, roastchana:30, epigamia:250, rawpressery:200, ritebite:70, superyou:40, taali:60, ghee:5, sugar:4, gur:10, honey:7, malai:15};
const out = `// Food data. GENERATED by tools/build-foods.js: edit that file, not this one.
// Every value is per 100 g. Home dishes are worked out from a recipe and its cooked weight.
// Sources: USDA FoodData Central, IFCT 2017 (NIN), pack labels. Daily references: ICMR-NIN 2020; sodium limit WHO.
window.SOS_FOODS = (() => {
  const FOODS = ${JSON.stringify(FOODS)};
  const LEGACY_G = ${JSON.stringify(LEGACY_G)};
  // One-tap meals. Amounts in grams.
  const TEMPLATES = [
    {id:'t-morning', meal:'morning', name:'Usual early morning', items:[['amla',250],['ajwain',250]]},
    {id:'t-breakfast', meal:'breakfast', name:'Usual breakfast', items:[['egg',100],['white',99],['milk',210],['whey',33]]},
    {id:'t-breadomelette', meal:'breakfast', name:'Bread omelette', items:[['egg',100],['white',99],['ghee',5],['bran',54],['milk',210],['whey',33]]},
    {id:'t-snack', meal:'snack', name:'Coffee + banana', items:[['coffee',240],['banana',118]]},
    {id:'t-malai', meal:'snack', name:'Bread, malai & brown sugar', items:[['bran',54],['malai',30],['sugar',7]]}
  ];
  const MEALS = [['morning','Early morning'],['breakfast','Breakfast'],['lunch','Lunch'],['snack','Snack'],['dinner','Dinner']];
  // Daily references for an adult Indian man, ICMR-NIN 2020. Fibre is 40 g per 2,000 kcal. Sodium is the WHO limit (5 g salt).
  const MICROS = [
    {k:'fib', name:'Fibre', unit:'g', ref:40, per2000:true, src:'ICMR-NIN 2020'},
    {k:'na', name:'Sodium', unit:'mg', ref:2000, limit:true, src:'WHO limit'},
    {k:'k', name:'Potassium', unit:'mg', ref:3510, src:'ICMR-NIN 2020'},
    {k:'ca', name:'Calcium', unit:'mg', ref:1000, src:'ICMR-NIN 2020'},
    {k:'fe', name:'Iron', unit:'mg', ref:19, src:'ICMR-NIN 2020'},
    {k:'zn', name:'Zinc', unit:'mg', ref:17, src:'ICMR-NIN 2020', t:true},
    {k:'vc', name:'Vitamin C', unit:'mg', ref:80, src:'ICMR-NIN 2020'},
    {k:'mg', name:'Magnesium', unit:'mg', ref:440, src:'ICMR-NIN 2020', t:true},
    {k:'vd', name:'Vitamin D', unit:'µg', ref:15, src:'ICMR-NIN 2020 (600 IU)', t:true, note:'mostly from sunlight; food rarely covers it'},
    {k:'b12', name:'Vitamin B12', unit:'µg', ref:2.2, src:'ICMR-NIN 2020'},
    {k:'fol', name:'Folate', unit:'µg', ref:300, src:'ICMR-NIN 2020'},
    {k:'va', name:'Vitamin A', unit:'µg', ref:1000, src:'ICMR-NIN 2020'}
  ];
  // Added sugar: under 5% of the day's calories (ICMR-NIN Dietary Guidelines for Indians 2024), so 25 g at 2,000 kcal.
  const SUGAR = {k:'asug', ref:25, per2000:true, limit:true, src:'ICMR-NIN 2024: under 5% of calories'};
  return {FOODS, LEGACY_G, TEMPLATES, MEALS, MICROS, SUGAR};
})();
`;
fs.writeFileSync(path.join(__dirname, '..', 'foods.js'), out);
// report
FOODS.forEach(f => { const u = f.units[0]; const s = g => Math.round(f.kcal*g/100) + ' kcal ' + (f.p*g/100).toFixed(1) + ' P'; console.log(f.id.padEnd(12), ('per100: ' + f.kcal + ' kcal ' + f.p + 'P ' + f.c + 'C ' + f.f + 'F').padEnd(44), '1 ' + u[0] + ' (' + u[1] + ' g): ' + s(u[1])); });
