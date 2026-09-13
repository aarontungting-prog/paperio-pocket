import {GAME_SHAPES} from './map-shapes.mjs';
export const SKINS = [
 {id:'melon',name:'夏日西瓜',type:'melon',color:'#ff315d',rim:'#69cb0c',pattern:'seeds',price:0},
 {id:'aqua',name:'經典藍',type:'cube',color:'#16c9ec',rim:'#008abf',pattern:'bubbles',price:0},
 {id:'berry',name:'莓果方塊',type:'cube',color:'#a45af3',rim:'#6c29b9',pattern:'dots',price:0},
 {id:'orange',name:'陽光柳橙',type:'citrus',color:'#ff9928',rim:'#de6417',pattern:'bubbles',price:180},
 {id:'lemon',name:'檸檬汽水',type:'citrus',color:'#ffda2c',rim:'#c4a014',pattern:'bubbles',price:220},
 {id:'kiwi',name:'奇異果',type:'kiwi',color:'#90d93e',rim:'#886036',pattern:'seeds',price:280},
 {id:'donut',name:'草莓甜甜圈',type:'donut',color:'#ff8bc2',rim:'#c5686f',pattern:'sprinkles',price:350},
 {id:'pizza',name:'起司披薩',type:'pizza',color:'#ffd663',rim:'#cf8534',pattern:'pepperoni',price:400},
 {id:'pineapple',name:'鳳梨派對',type:'pineapple',color:'#ffcb31',rim:'#c19208',pattern:'diamond',price:450},
 {id:'avocado',name:'酪梨抱抱',type:'avocado',color:'#c4e669',rim:'#347c43',pattern:'dots',price:500},
 {id:'strawberry',name:'草莓牛奶',type:'strawberry',color:'#f75778',rim:'#bb244f',pattern:'seeds',price:550},
 {id:'sushi',name:'鮭魚壽司',type:'sushi',color:'#ff977d',rim:'#ec6759',pattern:'stripes',price:600},
 {id:'bee',name:'嗡嗡小蜜蜂',type:'bee',color:'#f9cc3b',rim:'#bf9315',pattern:'stripes',price:650},
 {id:'ladybug',name:'幸運瓢蟲',type:'ladybug',color:'#ed415a',rim:'#aa2137',pattern:'dots',price:650},
 {id:'ghost',name:'棉花幽靈',type:'ghost',color:'#8ddcf2',rim:'#448bd2',pattern:'stars',price:700},
 {id:'cat',name:'橘貓隊長',type:'cat',color:'#ffaa51',rim:'#c16c29',pattern:'stripes',price:750},
 {id:'panda',name:'熊貓糰子',type:'panda',color:'#afbccc',rim:'#46596f',pattern:'dots',price:800},
 {id:'fox',name:'小狐狸',type:'fox',color:'#fa7b42',rim:'#b64a23',pattern:'triangles',price:850},
 {id:'pig',name:'粉紅小豬',type:'pig',color:'#f590b2',rim:'#c65c8d',pattern:'bubbles',price:900},
 {id:'robot',name:'太空機器人',type:'robot',color:'#6ce2c2',rim:'#249b91',pattern:'diamond',price:950},
 {id:'basketball',name:'灌籃高手',type:'basketball',color:'#e99646',rim:'#a96028',pattern:'lines',price:650},
 {id:'earth',name:'小小地球',type:'earth',color:'#369fea',rim:'#2269b4',pattern:'islands',price:15,currency:'gems'},
 {id:'galaxy',name:'星河漫遊',type:'galaxy',color:'#8856de',rim:'#392877',pattern:'stars',price:20,currency:'gems'},
 {id:'gold',name:'黃金傳說',type:'cube',color:'#ffcf3e',rim:'#c18a0b',pattern:'sparkles',price:25,currency:'gems'},
];
export const HATS=[
 {id:'none',name:'不戴帽子',price:0},{id:'crown',name:'王者皇冠',price:500},
 {id:'party',name:'派對尖帽',price:200},{id:'sprout',name:'發芽了',price:250},
 {id:'halo',name:'天使光環',price:400},{id:'bow',name:'蝴蝶結',price:350},
 {id:'cap',name:'棒球帽',price:300}
];
export const MAPS=[
 {id:'usa',ai:12,name:'美國本土',label:'大陸征服',symbol:'🇺🇸'},
 {id:'circle',ai:14,name:'經典圓形',label:'圓形競技場',symbol:'◉'},
 {id:'square',ai:16,name:'經典方形',label:'方形競技場',symbol:'▧'},
 {id:'taiwan',ai:6,name:'台灣本島',label:'環島挑戰',symbol:'🇹🇼'},
 {id:'heart',ai:10,name:'愛心島',label:'心動圈地',symbol:'♥'},
 {id:'star',ai:8,name:'星星島',label:'星際爭霸',symbol:'★'},
];
export const MISSIONS=[
 {id:'first',name:'第一塊新領地',desc:'完成 1 次圈地',key:'captures',goal:1,coins:30,gems:0},
 {id:'loop10',name:'圈地上癮',desc:'今日累計完成 10 次圈地',key:'captures',goal:10,coins:75,gems:0},
 {id:'kill3',name:'尾巴獵人',desc:'今日累計淘汰 3 位對手',key:'kills',goal:3,coins:60,gems:0},
 {id:'ten',name:'嶄露頭角',desc:'單局佔領 10% 地圖',key:'best',goal:10,coins:90,gems:0},
 {id:'games5',name:'再來一局',desc:'遊玩 5 局',key:'games',goal:5,coins:60,gems:0},
 {id:'quarter',name:'一方霸主',desc:'單局佔領 25% 地圖',key:'best',goal:25,coins:150,gems:1},
 {id:'half',name:'半個世界',desc:'單局佔領 50% 地圖',key:'best',goal:50,coins:225,gems:2},
 {id:'world',name:'世界都屬於你',desc:'達成 100% 佔領',key:'best',goal:100,coins:450,gems:4},
];
export const NAMES=['麻糬','小宇宙','NOVA','不准偷我家','Mochi','西瓜大王','夜貓子','LUNA','圈圈','小橘','吃一口','Orbit','海鹽','來追我呀','Bubbles','皮皮','KIKI','流星','抹茶','豆花','Pixel','北極星','芋圓','抱走你地盤','小熊','Mango','小火箭','藍鯨','阿柴','晴天'];
export const getSkin=id=>SKINS.find(s=>s.id===id)||SKINS[0];
export const getMap=id=>MAPS.find(s=>s.id===id)||MAPS[0];
export function mapPolygon(id){
 if(GAME_SHAPES[id])return GAME_SHAPES[id];
 if(id==='star')return Array.from({length:10},(_,i)=>{const a=i*Math.PI/5-Math.PI/2,r=i%2?.24:.47;return [.5+Math.cos(a)*r,.5+Math.sin(a)*r]});
 if(id==='heart')return Array.from({length:120},(_,i)=>{let t=i/120*Math.PI*2;return [.5+.027*Math.sin(t)**3*16,.49-.027*(13*Math.cos(t)-5*Math.cos(2*t)-2*Math.cos(3*t)-Math.cos(4*t))]});
 if(id==='square')return Array.from({length:80},(_,i)=>{const a=i/80*Math.PI*2;return [.5+.465*Math.sign(Math.cos(a))*Math.abs(Math.cos(a))**.2,.5+.465*Math.sign(Math.sin(a))*Math.abs(Math.sin(a))**.2]});
 return Array.from({length:160},(_,i)=>[.5+.47*Math.cos(i/160*Math.PI*2),.5+.47*Math.sin(i/160*Math.PI*2)]);
}
export function insidePolygon(x,y,p){let inside=false;for(let i=0,j=p.length-1;i<p.length;j=i++){const a=p[i],b=p[j];if((a[1]>y)!==(b[1]>y)&&x<(b[0]-a[0])*(y-a[1])/(b[1]-a[1])+a[0])inside=!inside;}return inside;}
