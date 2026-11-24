// Perry's foods, home-cooked with good practice (about 1 tsp ghee or mustard oil per serving unless noted).
// Values are per serving and approximate, worked from IFCT 2017 (NIN, India), USDA FoodData Central and pack labels.
// Columns: id, name, category, serving, grams, kcal, protein g, carbs g, fat g, fibre g, sodium mg, potassium mg, calcium mg, iron mg, vitamin C mg, packaged
window.SOS_FOODS = (() => {
  const rows = [
    ['amla', 'Amla & lemon warm water', 'Drinks', '1 glass', 250, 8, 0.1, 2, 0, 0.4, 5, 40, 6, 0.1, 60, 0],
    ['ajwain', 'Ajwain water', 'Drinks', '1 glass', 250, 2, 0.1, 0.4, 0, 0.2, 5, 10, 8, 0.2, 0, 0],
    ['egg', 'Whole egg', 'Protein', '1 egg', 50, 72, 6.3, 0.4, 4.8, 0, 71, 69, 28, 0.9, 0, 0],
    ['white', 'Egg white', 'Protein', '1 white', 33, 17, 3.6, 0.2, 0.1, 0, 55, 54, 2, 0, 0, 0],
    ['omelette', 'Omelette or bhurji, 2 eggs', 'Protein', '2 eggs + 1 tsp oil', 120, 200, 13, 4, 15, 0.6, 300, 200, 60, 1.9, 6, 0],
    ['milk', 'A2 milk, malai removed', 'Drinks', '210 ml', 210, 105, 6.9, 10.1, 4.2, 0, 92, 315, 252, 0.1, 0, 0],
    ['whey', 'NAKPRO Impact whey', 'Protein', '1 scoop (33 g)', 33, 122, 17.6, 10.7, 1, 0, 60, 160, 120, 0.3, 0, 1],
    ['cosmix', 'Cosmix plant protein', 'Protein', '1 scoop', 33, 120, 20, 4, 2.5, 1, 200, 150, 60, 3, 0, 1],
    ['bran', 'La Americana bran bread', 'Carbs', '1 slice', 25, 60, 2.5, 11, 0.7, 1.8, 120, 50, 15, 0.6, 0, 1],
    ['ketchup', 'Heinz ketchup', 'Add-ons', '1 tbsp', 15, 17, 0.2, 4, 0, 0, 150, 45, 3, 0.1, 1, 1],
    ['roti', 'Whole-wheat roti', 'Carbs', '1 medium, no ghee', 40, 100, 3.5, 20, 0.8, 3, 2, 105, 10, 1.2, 0, 0],
    ['missi', 'Missi roti', 'Carbs', '1 roti', 50, 150, 6, 22, 4, 4, 150, 200, 30, 2, 0, 0],
    ['rice', 'White rice, cooked', 'Carbs', '1 katori (150 g)', 150, 195, 4, 43, 0.4, 0.6, 2, 55, 15, 0.3, 0, 0],
    ['dal', 'Home dal', 'Dal & legumes', '1 katori (150 g)', 150, 170, 9, 23, 5, 6, 350, 400, 40, 2.5, 2, 0],
    ['maah', 'Black dal (maah)', 'Dal & legumes', '1 katori (150 g)', 150, 220, 10, 24, 9, 7, 400, 450, 60, 2.8, 2, 0],
    ['rajma', 'Rajma', 'Dal & legumes', '1 katori (150 g)', 150, 190, 10, 28, 5, 8, 380, 500, 60, 3, 3, 0],
    ['chana', 'White chana curry', 'Dal & legumes', '1 katori (150 g)', 150, 210, 10, 30, 6, 8, 380, 400, 70, 3.2, 3, 0],
    ['kala', 'Kala chana', 'Dal & legumes', '1 katori (150 g)', 150, 200, 10, 28, 5, 9, 350, 450, 60, 3.5, 3, 0],
    ['kadhi', 'Kadhi with potato', 'Dal & legumes', '1 katori (200 g)', 200, 180, 6, 20, 8, 2, 450, 350, 150, 1, 4, 0],
    ['chanasalad', 'White chana salad', 'Dal & legumes', '1 bowl (150 g)', 150, 210, 11, 33, 3.5, 9, 250, 400, 70, 3.5, 10, 0],
    ['paneerb', 'Paneer bhurji (home paneer)', 'Protein', '1 bowl (150 g)', 150, 270, 20, 8, 17, 1.5, 350, 250, 350, 0.8, 10, 0],
    ['matar', 'Matar paneer', 'Protein', '1 katori (200 g)', 200, 280, 15, 15, 18, 4, 450, 350, 250, 1.5, 12, 0],
    ['palak', 'Palak paneer', 'Protein', '1 katori (200 g)', 200, 260, 15, 10, 18, 4, 450, 600, 350, 3, 25, 0],
    ['soya', 'Soya chunks curry', 'Protein', '40 g dry + gravy', 180, 230, 21, 16, 5.5, 5, 350, 700, 140, 6, 6, 0],
    ['chicken', 'Chicken curry, bone-in', 'Protein', '1 bowl (~100 g meat)', 250, 260, 25, 6, 15, 1, 500, 400, 30, 1.5, 5, 0],
    ['drychicken', 'Dry chicken', 'Protein', '150 g cooked', 150, 260, 38, 4, 10, 0.5, 450, 420, 25, 1.4, 3, 0],
    ['burgrill', 'Grilled chicken & rice (Burgrill)', 'Protein', '1 regular bowl', 400, 550, 38, 60, 16, 3, 1100, 500, 50, 2.5, 5, 0],
    ['fish', 'Fish tikka', 'Protein', '150 g', 150, 230, 32, 5, 9, 0.5, 500, 500, 60, 1.2, 5, 0],
    ['fishgravy', 'Fish gravy', 'Protein', '1 bowl', 250, 250, 26, 7, 13, 1, 500, 480, 60, 1.2, 5, 0],
    ['mutton', 'Mutton gravy', 'Protein', '1 bowl (~100 g meat)', 250, 330, 26, 6, 22, 1, 500, 400, 30, 3, 4, 0],
    ['saag', 'Saag', 'Veg', '1 katori (150 g)', 150, 150, 4, 10, 10, 5, 400, 450, 200, 2.5, 30, 0],
    ['sabzi', 'Vegetable sabzi', 'Veg', '1 katori (150 g)', 150, 120, 3, 12, 6, 4, 350, 350, 50, 1.2, 20, 0],
    ['salad', 'Raw salad (cucumber, onion, beetroot)', 'Veg', '1 plate (150 g)', 150, 45, 1.5, 10, 0.2, 2.5, 40, 300, 30, 0.6, 12, 0],
    ['dahi', 'Homemade dahi', 'Drinks', '1 katori (150 g)', 150, 90, 5, 7, 4.5, 0, 70, 230, 180, 0.1, 1, 0],
    ['chaas', 'Diluted curd / chaas', 'Drinks', '1 glass (250 ml)', 250, 60, 3, 5, 2.5, 0, 300, 160, 120, 0.1, 1, 0],
    ['coffee', 'Black coffee', 'Drinks', '1 cup', 240, 2, 0.3, 0, 0, 0, 5, 116, 5, 0, 0, 0],
    ['banana', 'Banana', 'Fruit', '1 medium', 118, 105, 1.3, 27, 0.4, 3.1, 1, 422, 6, 0.3, 10, 0],
    ['apple', 'Apple', 'Fruit', '1 medium', 182, 95, 0.5, 25, 0.3, 4.4, 2, 195, 11, 0.2, 8, 0],
    ['pear', 'Pear', 'Fruit', '1 medium', 178, 101, 0.6, 27, 0.2, 5.5, 2, 206, 16, 0.3, 8, 0],
    ['papaya', 'Papaya', 'Fruit', '1 cup (145 g)', 145, 62, 0.7, 16, 0.4, 2.5, 12, 264, 29, 0.4, 88, 0],
    ['mango', 'Mango', 'Fruit', '1 cup (165 g)', 165, 99, 1.4, 25, 0.6, 2.6, 2, 277, 18, 0.3, 60, 0],
    ['avocado', 'Avocado', 'Fruit', 'half (100 g)', 100, 160, 2, 8.5, 14.7, 6.7, 7, 485, 12, 0.6, 10, 0],
    ['persimmon', 'Persimmon', 'Fruit', '1 medium', 168, 118, 1, 31, 0.3, 6, 2, 270, 13, 0.3, 12, 0],
    ['almonds', 'Almonds', 'Nuts', '10 almonds', 12, 69, 2.5, 2.6, 6, 1.5, 0, 85, 32, 0.4, 0, 0],
    ['walnuts', 'Walnuts', 'Nuts', '4 whole', 14, 92, 2.1, 1.9, 9.1, 0.9, 0, 62, 14, 0.4, 0, 0],
    ['raisins', 'Raisins', 'Nuts', '1 tbsp', 9, 27, 0.3, 7, 0, 0.3, 1, 67, 5, 0.2, 0, 0],
    ['roastchana', 'Roasted chana', 'Nuts', '1 handful (30 g)', 30, 110, 6.5, 17, 1.7, 5, 10, 240, 17, 1.9, 0, 0],
    ['epigamia', 'Epigamia Turbo protein shake', 'Packaged', '1 bottle (250 ml)', 250, 180, 25, 13, 3.5, 0, 200, 300, 300, 0.2, 0, 1],
    ['rawpressery', 'Raw Pressery protein shake', 'Packaged', '1 bottle (250 ml)', 250, 190, 20, 20, 3.5, 1, 150, 300, 250, 0.3, 0, 1],
    ['ritebite', 'RiteBite Max Protein bar', 'Packaged', '1 bar (70 g)', 70, 280, 20, 30, 9, 5, 200, 150, 100, 1.5, 0, 1],
    ['superyou', 'SuperYou protein puffs/wafer', 'Packaged', '1 pack (40 g)', 40, 180, 10, 22, 6, 2, 350, 150, 40, 1, 0, 1],
    ['taali', 'Taali protein puffs', 'Packaged', '1 pack (60 g)', 60, 260, 13, 32, 9, 3, 500, 200, 40, 1.5, 0, 1],
    ['ghee', 'Extra ghee or oil', 'Add-ons', '1 tsp', 5, 45, 0, 0, 5, 0, 0, 0, 0, 0, 0, 0]
  ];
  const FOODS = rows.map(r => ({id:r[0], name:r[1], cat:r[2], unit:r[3], g:r[4], kcal:r[5], p:r[6], c:r[7], f:r[8], fib:r[9], na:r[10], k:r[11], ca:r[12], fe:r[13], vc:r[14], pk:!!r[15]}));
  // One-tap meals from his usual day.
  const TEMPLATES = [
    {id:'t-morning', meal:'morning', name:'Usual early morning', items:[['amla',1],['ajwain',1]]},
    {id:'t-breakfast', meal:'breakfast', name:'Usual breakfast', items:[['egg',2],['white',3],['milk',1],['whey',1]]},
    {id:'t-snack', meal:'snack', name:'Coffee + banana', items:[['coffee',1],['banana',1]]}
  ];
  const MEALS = [['morning','Early morning'],['breakfast','Breakfast'],['lunch','Lunch'],['snack','Snack'],['dinner','Dinner']];
  // Daily references for an adult Indian man: ICMR-NIN 2020 RDAs; sodium limit from WHO (under 2,000 mg, i.e. 5 g salt).
  const MICROS = [
    {k:'fib', name:'Fibre', unit:'g', ref:30, src:'ICMR-NIN'},
    {k:'na', name:'Sodium', unit:'mg', ref:2000, limit:true, src:'WHO limit'},
    {k:'k', name:'Potassium', unit:'mg', ref:3500, src:'ICMR-NIN'},
    {k:'ca', name:'Calcium', unit:'mg', ref:1000, src:'ICMR-NIN'},
    {k:'fe', name:'Iron', unit:'mg', ref:19, src:'ICMR-NIN'},
    {k:'vc', name:'Vitamin C', unit:'mg', ref:80, src:'ICMR-NIN'}
  ];
  return {FOODS, TEMPLATES, MEALS, MICROS};
})();
