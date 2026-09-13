import {connectArena} from './online.mjs';
import {defaultServerURL} from './runtime-config.mjs';
import {connectCloud,saveCloud} from './cloud.mjs';
import {Game} from './engine.mjs';
import {Renderer,paintPreview,drawHead,drawHat,polygonPath} from './render.mjs';
import {SKINS,HATS,MAPS,MISSIONS,getSkin,getMap,mapPolygon} from './catalog.mjs';
import {SAVE_KEY,cleanState,buy,claim,ensureDaily,recordDaily} from './state.mjs';
const $=id=>document.getElementById(id),all=s=>[...document.querySelectorAll(s)];
const esc=s=>String(s).replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
const fmt=n=>Math.floor(n).toLocaleString('en-US');
const timeText=t=>`${Math.floor(t/60).toString().padStart(2,'0')}:${Math.floor(t%60).toString().padStart(2,'0')}`;
const difficultyNames={easy:'休閒',normal:'標準',hard:'高手'};
const difficultyDescriptions={easy:'對手偏向小圈擴張，受到威脅時回防，適合熟悉操作。',normal:'對手會尋找截尾機會，並在擴張與保護基地之間做選擇。',hard:'反應更快、觀察範圍更大，會估算你回家的時間，搶先截尾。'};
const svg=(body)=>`<svg viewBox="0 0 64 64" fill="none" xmlns="http://www.w3.org/2000/svg" aria-hidden="true" stroke-linecap="round" stroke-linejoin="round">${body}</svg>`;
const ink='#16348e';
const icons={
 coin:svg(`<circle cx="32" cy="32" r="28" fill="#ffdf24" stroke="${ink}" stroke-width="3.5"/><circle cx="32" cy="30" r="20" fill="#fff246" stroke="#efab06" stroke-width="3"/><path d="M14 16a24 24 0 0 1 26-8" stroke="#fffaa3" stroke-width="4"/><path d="M31 30c-11-14-23 6-11 12 10 5 13-20 23-13 12 9-1 23-11 7" stroke="#f8a610" stroke-width="5"/>`),
 gem:svg(`<path d="M8 15 29 5 47 12 58 30 50 51 29 60 8 47 4 31Z" fill="#ee61f7" stroke="${ink}" stroke-width="3.5"/><path d="M8 15 29 5 34 21 17 30 4 31Z" fill="#ffb1ff"/><path d="m34 21 13-9 11 18-16 8Z" fill="#fa89ff"/><path d="m17 30 17-9 8 17-12 14-15-7Z" fill="#f982ff"/><path d="m8 47 22 5 20-1-21 9Z" fill="#ad35db"/>`),
 settings:svg(`<path d="m26 6 12 0 2 7 6 3 7-1 6 11-5 5v7l4 5-7 10-7-2-6 3-2 6H24l-2-7-6-3-7 1-5-11 5-5v-7l-4-5 7-10 7 2 6-3Z" fill="#f7ffff" stroke="${ink}" stroke-width="4"/><circle cx="32" cy="33" r="11" fill="#3ecdfa" stroke="${ink}" stroke-width="4"/>`),
 play:svg(`<path d="M14 8Q14 2 21 6l34 23q6 4 0 8L21 60q-7 4-7-4Z" fill="#fffef2" stroke="${ink}" stroke-width="3.5"/><path d="m19 56 35-23" stroke="#8fd9ed" stroke-width="3"/>`),
 shop:svg(`<path d="M10 25h44v31H10Z" fill="#c5f5ff" stroke="${ink}" stroke-width="3"/><path d="M14 8h36l9 18c0 8-12 10-14 2-3 9-13 9-15 0-3 9-15 9-17 0-5 7-11 4-11-2Z" fill="#ffe658" stroke="${ink}" stroke-width="3"/><path d="m23 8-3 20M40 8l3 20" stroke="#fff6a1" stroke-width="7"/><path d="M14 8h36l9 18c0 8-12 10-14 2-3 9-13 9-15 0-3 9-15 9-17 0-5 7-11 4-11-2Z" stroke="${ink}" stroke-width="3"/><rect x="19" y="36" width="26" height="20" rx="4" fill="#5bb9f1" stroke="${ink}" stroke-width="3"/>`),
 skins:svg(`<rect x="6" y="15" width="44" height="43" rx="12" fill="#59bff5" stroke="${ink}" stroke-width="3" transform="rotate(-12 28 36)"/><rect x="15" y="6" width="44" height="49" rx="12" fill="#ffe74d" stroke="${ink}" stroke-width="3.5"/><ellipse cx="29" cy="35" rx="8" ry="11" fill="white"/><ellipse cx="47" cy="35" rx="8" ry="11" fill="white"/><ellipse cx="30" cy="38" rx="4" ry="6" fill="${ink}"/><ellipse cx="46" cy="38" rx="4" ry="6" fill="${ink}"/><path d="m26 11 16 0" stroke="#fff9b6" stroke-width="6"/>`),
 map:svg(`<path d="m4 15 18-8 20 8 18-8v43l-18 8-20-8-18 8Z" fill="#dcfcff" stroke="${ink}" stroke-width="3.5"/><path d="m22 8 0 42m20-35v43" stroke="#70c6ef" stroke-width="3"/><path d="M44 21c0 10-12 21-12 21S20 31 20 21a12 12 0 0 1 24 0Z" fill="#ff7292" stroke="${ink}" stroke-width="3"/><circle cx="32" cy="21" r="4" fill="#fff6bc"/>`),
 trophy:svg(`<path d="M17 10H7v10c0 12 11 16 18 13m22-23h10v10c0 12-11 16-18 13" fill="#fff24b" stroke="${ink}" stroke-width="3.5"/><path d="M18 5h28v20c0 17-28 17-28 0Z" fill="#ffe643" stroke="${ink}" stroke-width="3.5"/><path d="M32 39v12m-15 7h30l-5-8H22Z" fill="#ffe64b" stroke="${ink}" stroke-width="4"/><path d="m32 11 3 7 8 1-6 5 2 8-7-4-7 4 2-8-6-5 8-1Z" fill="#ffac2c"/><path d="M23 10v13" stroke="#fffbbb" stroke-width="4"/>`),
 crown:svg(`<path d="m8 21 12 10 12-21 12 21 12-10-8 31H16Z" fill="#ffe631" stroke="${ink}" stroke-width="3.5"/><circle cx="8" cy="20" r="5" fill="#fff472" stroke="${ink}" stroke-width="3"/><circle cx="32" cy="9" r="5" fill="#fff472" stroke="${ink}" stroke-width="3"/><circle cx="56" cy="20" r="5" fill="#fff472" stroke="${ink}" stroke-width="3"/><path d="M18 45h28" stroke="#ffb926" stroke-width="5"/>`),
 skull:svg(`<path d="M32 4C9 4 0 23 7 40l10 6v10c0 6 30 6 30 0V46l10-6C64 23 55 4 32 4Z" fill="#fff" stroke="${ink}" stroke-width="3.5"/><ellipse cx="21" cy="30" rx="8" ry="9" fill="${ink}"/><ellipse cx="44" cy="30" rx="8" ry="9" fill="${ink}"/><path d="m32 37-4 7h8Z" fill="${ink}"/><path d="M25 51v8m14-8v8" stroke="${ink}" stroke-width="3"/><ellipse cx="26" cy="9" rx="10" ry="4" fill="#e0e8ec"/>`),
 bot:svg(`<path d="M32 10V3m-7 0h14" stroke="${ink}" stroke-width="4"/><rect x="9" y="13" width="46" height="40" rx="12" fill="#e7fbff" stroke="${ink}" stroke-width="3"/><rect x="15" y="22" width="34" height="22" rx="7" fill="#519de7"/><circle cx="24" cy="32" r="5" fill="white"/><circle cx="40" cy="32" r="5" fill="white"/><path d="M4 26v12m56-12v12" stroke="${ink}" stroke-width="5"/>`),
 sliders:svg(`<path d="M8 15h48M8 32h48M8 49h48" stroke="#ffffff" stroke-width="5"/><circle cx="22" cy="15" r="6" fill="#bceeff" stroke="#fff" stroke-width="3"/><circle cx="42" cy="32" r="6" fill="#bceeff" stroke="#fff" stroke-width="3"/><circle cx="26" cy="49" r="6" fill="#bceeff" stroke="#fff" stroke-width="3"/>`),
 edit:svg(`<path d="m12 43-3 13 14-3 32-32-11-11Z" fill="#fff" stroke="${ink}" stroke-width="4"/><path d="m36 18 11 11" stroke="${ink}" stroke-width="4"/>`),
 pause:svg(`<rect x="12" y="8" width="13" height="48" rx="4" fill="${ink}"/><rect x="39" y="8" width="13" height="48" rx="4" fill="${ink}"/>`),
 shield:svg(`<path d="m32 5 24 10v17c0 16-24 27-24 27S8 48 8 32V15Z" fill="#a9e5d1" stroke="${ink}" stroke-width="3"/><path d="m19 31 9 9 18-19" stroke="#fff" stroke-width="6"/>`),
 danger:svg(`<path d="m32 6 27 48H5Z" fill="#ffc87e" stroke="#be5671" stroke-width="3"/><path d="M32 23v14m0 9v1" stroke="#be5671" stroke-width="5"/>`),
 fullscreen:svg(`<path d="M8 24V8h16m16 0h16v16m0 16v16H40m-16 0H8V40" stroke="${ink}" stroke-width="5"/>`),
 hand:svg(`<path d="M20 32V11c0-9 11-9 11 0v16l4-7 7 3 7 3 7 3v17L46 60H27L11 43c-7-9 1-15 9-5" fill="#fff" stroke="${ink}" stroke-width="3"/>`),
 rotate:svg(`<rect x="22" y="10" width="24" height="43" rx="5" fill="#fff" stroke="${ink}" stroke-width="3" transform="rotate(20 32 32)"/><path d="M9 37C-1 16 16 3 26 5M9 37l-3-12m3 12 11-6M55 29c10 21-7 34-17 32m17-32 3 12m-3-12-11 6" stroke="${ink}" stroke-width="3"/>`)
};
function icon(name){return icons[name]||icons.skins;}
function hydrate(root=document){root.querySelectorAll('[data-icon]').forEach(el=>el.innerHTML=icon(el.dataset.icon));}
hydrate();
let storageOK=true,raw;
try{raw=JSON.parse(localStorage.getItem(SAVE_KEY)||'{}');}catch{raw={};}
let state=cleanState(raw),game=null,renderer=new Renderer($('game-canvas'),$('minimap')),category='skins',selectedItem=null,selectedKind='skins',toastTimer,feedTimer,resultTimer,beforeBest=0,lastHud=0,lastPreview=0,finished=false,leaderKey='';
let audioContext=null,pointer=null,keys=new Set(),lastTime=performance.now(),accumulator=0;
function save(){saveCloud(state,message=>$('cloud-status').textContent=message);try{localStorage.setItem(SAVE_KEY,JSON.stringify(state));storageOK=true;}catch{if(storageOK)toast('目前瀏覽器無法儲存進度，請確認未封鎖網站儲存空間。');storageOK=false;}}
function toast(message){$('toast').textContent=message;$('toast').classList.add('show');clearTimeout(toastTimer);toastTimer=setTimeout(()=>$('toast').classList.remove('show'),3200);}
function sound(type){
 if(!state.settings.sound)return;try{audioContext??=new(window.AudioContext||window.webkitAudioContext)();if(audioContext.state==='suspended')audioContext.resume();const t=audioContext.currentTime;
 const notes=type==='capture'?[523,659,784]:type==='kill'?[660,880]:type==='end'?[250,180,130]:type==='buy'?[587,784,988]:[520];
 notes.forEach((f,i)=>{let o=audioContext.createOscillator(),a=audioContext.createGain();o.type=type==='end'?'sine':'triangle';o.frequency.value=f;a.gain.setValueAtTime(0,t+i*.065);a.gain.linearRampToValueAtTime(.055,t+i*.065+.008);a.gain.exponentialRampToValueAtTime(.001,t+i*.065+.18);o.connect(a);a.connect(audioContext.destination);o.start(t+i*.065);o.stop(t+i*.065+.2);});}catch{}
}
function vibrate(pattern){if(state.settings.haptic&&navigator.vibrate)navigator.vibrate(pattern);}
function show(id){if(!$ (id).open)$(id).showModal();}
function close(id){$(id).close();}
all('[data-close]').forEach(b=>b.addEventListener('click',()=>b.closest('dialog').close()));
all('dialog').forEach(d=>{if(['pause-dialog','result-dialog'].includes(d.id))return;d.addEventListener('click',e=>{if(e.target===d){let r=d.getBoundingClientRect();if(e.clientX<r.left||e.clientX>r.right||e.clientY<r.top||e.clientY>r.bottom)d.close();}});});
function paintThumb(canvas,skin,hat='none',onlyHat=false){let c=canvas.getContext('2d');c.clearRect(0,0,canvas.width,canvas.height);c.save();c.translate(canvas.width/2,canvas.height*.59);if(onlyHat){c.globalAlpha=.35;drawHead(c,getSkin('aqua'),canvas.width*.24,0);c.globalAlpha=1;c.scale(canvas.width/112,canvas.width/112);drawHat(c,hat);}else drawHead(c,skin,canvas.width*.27,-.25,hat);c.restore();}
function refreshBalances(){ensureDaily(state);all('.coin-balance').forEach(e=>e.textContent=fmt(state.coins));all('.gem-balance').forEach(e=>e.textContent=fmt(state.gems));$('mission-dot').hidden=!MISSIONS.some(m=>!state.daily.claimed.includes(m.id)&&state.daily.stats[m.key]>=m.goal);}
function refreshLobby(){
 const map=getMap(state.map);$('map-name').textContent=map.name;$('map-symbol').textContent=map.symbol;$('map-best').textContent=(state.mapBests[map.id]||0).toFixed(1).replace('.0','')+'%';$('map-progress-fill').style.width=Math.max(3,state.mapBests[map.id]||0)+'%';$('skin-name').textContent=getSkin(state.skin).name;
 $('ai-summary').textContent=getMap(state.map).ai?`${getMap(state.map).ai} 位 AI 對手`:'自由圈地 · 沒有對手';$('difficulty-summary').textContent=getMap(state.map).ai?difficultyNames[state.settings.difficulty]:'單人';
 paintThumb($('profile-avatar'),getSkin(state.skin),state.hat);refreshBalances();
}
function refreshSettings(){
 $('player-name').value=state.settings.name;all('[data-difficulty]').forEach(b=>{const active=b.dataset.difficulty===state.settings.difficulty;b.classList.toggle('active',active);b.setAttribute('aria-pressed',active);});$('difficulty-description').textContent=difficultyDescriptions[state.settings.difficulty];
 for(const k of ['respawn','sound','haptic'])$(k+'-toggle').checked=state.settings[k];
}
function openSettings(){refreshSettings();show('settings-dialog');}
for(const id of ['settings-btn','match-settings-btn'])$(id).addEventListener('click',openSettings);
$('player-name').addEventListener('change',e=>{state.settings.name=e.target.value.trim().slice(0,14)||'圈地小高手';e.target.value=state.settings.name;save();});
all('[data-difficulty]').forEach(b=>b.addEventListener('click',()=>{state.settings.difficulty=b.dataset.difficulty;save();refreshSettings();refreshLobby();}));
for(const k of ['respawn','sound','haptic'])$(k+'-toggle').addEventListener('change',e=>{state.settings[k]=e.target.checked;save();if(k==='sound'&&state.settings.sound)sound('click');});
async function fullscreen(silent=false){
 try{if(!document.fullscreenElement&&document.documentElement.requestFullscreen){await document.documentElement.requestFullscreen();if(matchMedia('(pointer:coarse)').matches)try{await screen.orientation?.lock('portrait');}catch{}}
 else if(!silent&&!document.fullscreenElement)toast('iPhone：在 Safari 分享選單選「加入主畫面」，再從主畫面開啟。');}catch{if(!silent)toast('此瀏覽器未開啟全螢幕。iPhone 可使用「加入主畫面」。');}
}
$('fullscreen-btn').addEventListener('click',()=>fullscreen());
function openShop(owned=false){$('owned-only').checked=owned;category='skins';renderShop();show('shop-dialog');}
$('shop-btn').addEventListener('click',()=>openShop());$('coins-btn').addEventListener('click',()=>openShop());$('wardrobe-btn').addEventListener('click',()=>openShop(true));$('change-skin').addEventListener('click',()=>openShop(true));
all('[data-category]').forEach(b=>b.addEventListener('click',()=>{category=b.dataset.category;renderShop();}));$('owned-only').addEventListener('change',renderShop);
function renderShop(){
 const own=$('owned-only').checked,list=category==='skins'?SKINS:HATS,owned=category==='skins'?state.ownedSkins:state.ownedHats,current=category==='skins'?state.skin:state.hat;
 $('shop-title').textContent=own?'我的造型':'造型商店';all('[data-category]').forEach(b=>{const active=b.dataset.category===category;b.classList.toggle('active',active);b.setAttribute('aria-pressed',active);});
 $('shop-grid').innerHTML=list.filter(item=>!own||owned.includes(item.id)).map(item=>{const isOwned=owned.includes(item.id),equipped=current===item.id;return `<button class="skin-card ${equipped?'equipped':''}" data-item="${item.id}" aria-label="${item.name}${equipped?'，使用中':isOwned?'，已擁有':'，'+item.price+(item.currency==='gems'?' 寶石':' 金幣')}">${equipped?'<span class="card-tag">使用中</span>':''}<canvas width="160" height="134" aria-hidden="true"></canvas><b>${item.name}</b><span class="card-price">${isOwned?'✓ 已擁有':`<span data-icon="${item.currency==='gems'?'gem':'coin'}"></span>${fmt(item.price)}`}</span></button>`}).join('');
 hydrate($('shop-grid'));$('shop-grid').querySelectorAll('[data-item]').forEach(b=>{const item=list.find(s=>s.id===b.dataset.item);paintThumb(b.querySelector('canvas'),category==='skins'?item:getSkin(state.skin),category==='hats'?item.id:'none',category==='hats');b.addEventListener('click',()=>openItem(item,category));});refreshBalances();
}
function openItem(item,kind){selectedItem=item;selectedKind=kind;renderItem();show('item-dialog');}
function renderItem(){
 const item=selectedItem,owned=(selectedKind==='skins'?state.ownedSkins:state.ownedHats).includes(item.id),equipped=(selectedKind==='skins'?state.skin:state.hat)===item.id;
 $('item-title').textContent=item.name;paintThumb($('item-preview'),selectedKind==='skins'?item:getSkin(state.skin),selectedKind==='hats'?item.id:state.hat);
 $('item-rarity').textContent=item.currency==='gems'?'✦ 珍藏造型':selectedKind==='hats'?'自由搭配':'專屬色彩與領地花紋';
 $('item-description').textContent=selectedKind==='hats'?'帽子可以搭配所有造型，裝備後下一局就會登場。':'換上全新角色，尾巴、領地顏色與花紋也會一起改變。';
 $('item-action').innerHTML=equipped?'✓ 使用中':owned?'裝備造型':`<span data-icon="${item.currency==='gems'?'gem':'coin'}"></span>${fmt(item.price)}　購買並裝備`;
 $('item-action').disabled=equipped;$('item-message').textContent=owned?'已永久解鎖':`目前擁有 ${fmt(state[item.currency||'coins'])} ${item.currency==='gems'?'寶石':'金幣'}`;hydrate($('item-action'));
}
$('item-action').addEventListener('click',()=>{const item=selectedItem,result=buy(state,item,selectedKind);if(!result.ok){$('item-message').textContent=`還差 ${fmt(result.missing)} ${result.currency==='gems'?'寶石，完成任務就能獲得。':'金幣，圈地與淘汰對手就能賺取。'}`;return;}save();sound('buy');vibrate(18);renderItem();renderShop();refreshLobby();toast(`已裝備「${item.name}」`);});
function selectMap(id){if(!MAPS.some(m=>m.id===id))return;state.map=id;save();refreshLobby();if($('maps-dialog').open)renderMaps();}
for(const [id,delta] of [['prev-map',-1],['next-map',1]])$(id).addEventListener('click',()=>selectMap(MAPS[(MAPS.findIndex(m=>m.id===state.map)+delta+MAPS.length)%MAPS.length].id));
function renderMaps(){
 $('map-grid').innerHTML=MAPS.map(m=>`<button class="map-card ${m.id===state.map?'selected':''}" data-map="${m.id}" aria-pressed="${m.id===state.map}">${m.id===state.map?'<span class="selected-mark">✓</span>':''}<canvas width="300" height="190" aria-hidden="true"></canvas><b>${m.symbol} ${m.name}</b><small>最高 ${state.mapBests[m.id].toFixed(2)}%</small></button>`).join('');
 $('map-grid').querySelectorAll('[data-map]').forEach(b=>{let cn=b.querySelector('canvas'),c=cn.getContext('2d'),p=mapPolygon(b.dataset.map);let xs=p.map(x=>x[0]),ys=p.map(x=>x[1]),minX=Math.min(...xs),maxX=Math.max(...xs),minY=Math.min(...ys),maxY=Math.max(...ys),scale=Math.min(250/(maxX-minX),152/(maxY-minY));c.translate((300-scale*(minX+maxX))/2,(190-scale*(minY+maxY))/2);c.scale(scale,scale);let path=polygonPath(p,1);c.fillStyle=b.dataset.map===state.map?'#fffdf1':'#fff';c.strokeStyle='#62bddd';c.lineWidth=3/scale;c.fill(path);c.stroke(path);b.addEventListener('click',()=>selectMap(b.dataset.map));});
}
function openMaps(){renderMaps();show('maps-dialog');}for(const id of ['maps-btn','map-info-btn'])$(id).addEventListener('click',openMaps);
function renderMissions(){ensureDaily(state);
 $('mission-list').innerHTML=MISSIONS.map(m=>{const done=state.daily.claimed.includes(m.id),value=Math.min(m.goal,state.daily.stats[m.key]),can=value>=m.goal;return `<div class="mission"><div><b>${m.name}</b><p>${m.desc} · ${m.key==='best'?value.toFixed(1):Math.floor(value)} / ${m.goal}</p><div class="mission-progress"><div style="width:${value/m.goal*100}%"></div></div><div class="mission-reward"><span data-icon="coin"></span>${m.coins}<span data-icon="gem"></span>${m.gems}</div></div><button data-claim="${m.id}" ${done||!can?'disabled':''}>${done?'✓ 已領取':can?'領取':'進行中'}</button></div>`}).join('');hydrate($('mission-list'));
 $('mission-list').querySelectorAll('[data-claim]').forEach(b=>b.addEventListener('click',()=>{if(claim(state,b.dataset.claim)){save();sound('buy');renderMissions();refreshBalances();toast('獎勵已領取！');}}));
}
function openMissions(){renderMissions();show('missions-dialog');}for(const id of ['missions-btn','gems-btn'])$(id).addEventListener('click',openMissions);
$('profile-btn').addEventListener('click',()=>{
 $('profile-card').innerHTML=`<canvas width="180" height="180" aria-hidden="true"></canvas><b>${esc(state.settings.name)}</b>`;paintThumb($('profile-card').querySelector('canvas'),getSkin(state.skin),state.hat);
 $('profile-stats').innerHTML=[[state.stats.best.toFixed(2)+'%','最高佔領率'],[fmt(state.stats.kills),'累計淘汰'],[fmt(state.stats.captures),'成功圈地'],[fmt(state.stats.games),'遊玩場次'],[`${Math.floor(state.stats.seconds/60)} 分鐘`,'遊玩時間'],[`${state.ownedSkins.length} / ${SKINS.length}`,'造型收藏']].map(([value,label])=>`<div><b>${value}</b><small>${label}</small></div>`).join('');$('profile-dialog').querySelector('.save-note').textContent=storageOK?'進度已自動儲存在此裝置':'此瀏覽器目前無法儲存進度';show('profile-dialog');
});
function startGame(onlineGame=null){
 if(game?.online)game.leave();
 for(const d of all('dialog[open]'))d.close();clearTimeout(resultTimer);beforeBest=state.mapBests[state.map];finished=false;keys.clear();pointer=null;$('joystick').hidden=true;leaderKey='';
 game=onlineGame?.online?onlineGame:new Game({...state.settings,skin:state.skin,hat:state.hat,map:state.map});recordDaily(state,{games:1});state.stats.games++;save();
 $('lobby').hidden=true;$('game-screen').hidden=false;$('start-hint').hidden=!!game.online;$('room-badge').hidden=!game.online;$('room-badge').textContent=game.online?'房間 '+game.roomId:'';$('capture-pop').classList.remove('show');$('kill-feed').classList.remove('show');
 renderer.resize();renderer.bind(game);accumulator=0;lastTime=performance.now();lastHud=0;updateHUD();sound('click');
 if(matchMedia('(pointer:coarse)').matches)fullscreen(true);
}
function home(){if(game?.online)game.leave();clearTimeout(resultTimer);all('dialog[open]').forEach(d=>d.close());game=null;keys.clear();pointer=null;$('joystick').hidden=true;$('game-screen').hidden=true;$('lobby').hidden=false;refreshLobby();}
$('play-btn').addEventListener('click',startGame);$('again-btn').addEventListener('click',()=>{if(game?.online){home();show('online-dialog');}else startGame();});$('home-btn').addEventListener('click',home);
function pause(){if(!game||game.over||game.paused)return;$('pause-dialog').querySelector('p').textContent=game.online?'連線對戰會繼續進行，關閉選單即可繼續控制。':'遊戲已暫停，對手也會等你。';if(!game.online)game.paused=true;pointer=null;keys.clear();$('joystick').hidden=true;show('pause-dialog');}
function resume(){close('pause-dialog');if(game){game.paused=false;accumulator=0;lastTime=performance.now();}keys.clear();}
$('pause-btn').addEventListener('click',pause);$('resume-btn').addEventListener('click',resume);$('pause-dialog').addEventListener('cancel',e=>{e.preventDefault();resume();});$('result-dialog').addEventListener('cancel',e=>{e.preventDefault();home();});
$('quit-btn').addEventListener('click',()=>{finish('quit',null,false);home();});
function finish(reason,killer,showResult=true){
 if(!game||finished)return;if(game.online)game.leave();finished=true;game.over=true;keys.clear();pointer=null;$('joystick').hidden=true;
 recordDaily(state,{seconds:Math.floor(game.time),best:game.peak,wins:reason==='win'?1:0});state.stats.seconds+=Math.floor(game.time);state.stats.best=Math.max(state.stats.best,game.peak);state.mapBests[game.options.map]=Math.max(state.mapBests[game.options.map],game.peak);if(reason==='win')state.stats.wins++;
 const bonus=game.time>=10?Math.min(100,Math.floor(game.time/15)*2+Math.floor(game.peak)*2):0;state.coins+=bonus;game.earned+=bonus;save();refreshBalances();
 if(!showResult)return;
 const reasons={complete:'本房間對戰已結束',disconnect:'與伺服器的連線中斷',cut:`${killer||'對手'}切斷了你的尾巴`,base:'你的最後一塊領地被佔領了',win:'100% 達成，整張地圖都是你的！'};
 $('result-title').textContent=reason==='win'?'世界都屬於你！':game.peak>beforeBest?'新的圈地紀錄！':'再畫一個更大的圈！';$('result-reason').textContent=reasons[reason]||'本局遊戲已結束';$('result-percent').textContent=game.peak.toFixed(2);$('new-best').hidden=game.peak<=beforeBest;
 $('result-stats').innerHTML=[[game.player.kills,'淘汰'],[game.captures,'成功圈地'],[timeText(game.time),'存活時間']].map(([value,label])=>`<div><b>${value}</b><small>${label}</small></div>`).join('');$('result-coins').textContent='+'+fmt(game.earned)+(game.earnedGems?' · 💎 '+game.earnedGems:'');sound(reason==='win'?'buy':'end');vibrate([40,30,70]);
 resultTimer=setTimeout(()=>show('result-dialog'),450);
}
function processEvents(){
 for(const ev of game.drain()){
  if(ev.type==='reward'){recordDaily(state,{kills:ev.kills||0,captures:ev.captures||0,best:ev.best||0});state.coins+=ev.coins||0;state.gems+=ev.gems||0;state.stats.kills+=ev.kills||0;state.stats.captures+=ev.captures||0;if(ev.best){state.stats.best=Math.max(state.stats.best,ev.best);state.mapBests[game.options.map]=Math.max(state.mapBests[game.options.map],ev.best);}save();refreshBalances();}
  else if(ev.type==='capture'){renderer.burst(ev.x,ev.y,ev.color,20);$('capture-pop').textContent='+'+ev.gain.toFixed(2)+'%';$('capture-pop').classList.remove('show');void $('capture-pop').offsetWidth;$('capture-pop').classList.add('show');sound('capture');vibrate(15);}
  else if(ev.type==='kill'){renderer.burst(ev.x,ev.y,ev.color,35);if(ev.killerId===game.player.id){$('kill-feed').textContent=`你淘汰了 ${ev.victim}　+35`;sound('kill');}else if(ev.victimId===game.player.id){$('kill-feed').textContent='尾巴要保護好！';}else{$('kill-feed').textContent=ev.killer?`${ev.killer} 淘汰了 ${ev.victim}`:`${ev.victim} 出局`;}clearTimeout(feedTimer);$('kill-feed').classList.add('show');feedTimer=setTimeout(()=>$('kill-feed').classList.remove('show'),2200);}
  else if(ev.type==='end')finish(ev.reason,ev.killer);
 }
}
function updateHUD(){
 if(!game)return;const p=game.player,percent=game.percent(p);$('territory-percent').textContent=percent.toFixed(2)+'%';$('territory-fill').style.width=percent+'%';$('kill-count').textContent=p.kills;$('game-coins').textContent=game.earned;$('match-time').textContent=timeText(game.time);$('alive-count').textContent=game.ranking().length+' 位存活';
 const danger=p.outside;$('zone-status').classList.toggle('danger',danger);$('zone-status').innerHTML=`<span data-icon="${danger?'danger':'shield'}"></span><b>${p.wallBoost?'貼牆加速':danger?'尾巴暴露中':'安全領地'}</b>`;hydrate($('zone-status'));
 const rank=game.ranking(),rows=rank.slice(0,3);if(!rows.includes(p)&&p.alive)rows.push(p);const key=rows.map(e=>`${e.id}:${game.percent(e).toFixed(2)}:${e.skin.id}`).join('|');
 if(key!==leaderKey){leaderKey=key;$('leaderboard').innerHTML=rows.map(e=>`<div class="rank-row ${e===p&&!rank.slice(0,3).includes(p)?'you':''}" style="--rank-color:${e.skin.color}"><div class="rank-avatar"><canvas width="80" height="80"></canvas><span class="rank-number">${rank.indexOf(e)+1}</span></div><div class="rank-data"><b>${game.percent(e).toFixed(2)}%</b><small>${e===p?'你':esc(e.name)}</small></div></div>`).join('');$('leaderboard').querySelectorAll('canvas').forEach((c,i)=>paintThumb(c,rows[i].skin,rows[i].hat));}
}
function canMove(){return game&&!game.over&&!game.paused&&!document.querySelector('dialog[open]');}
function aim(angle){if(!canMove())return;game.aim(angle);$('start-hint').hidden=true;}
$('game-canvas').addEventListener('pointerdown',e=>{
 if(!canMove())return;e.preventDefault();$('game-canvas').setPointerCapture(e.pointerId);
 if(e.pointerType==='mouse'){const p=renderer.screenPlayer();aim(Math.atan2(e.clientY-p.y,e.clientX-p.x));return;}
 if(pointer)return;pointer={id:e.pointerId,x:e.clientX,y:e.clientY};$('joystick').hidden=false;$('joystick').style.left=e.clientX+'px';$('joystick').style.top=e.clientY+'px';$('joystick-knob').style.transform='translate(-50%,-50%)';
},{passive:false});
$('game-canvas').addEventListener('pointermove',e=>{
 if(!canMove())return;
 if(e.pointerType==='mouse'){const p=renderer.screenPlayer(),dx=e.clientX-p.x,dy=e.clientY-p.y;if(Math.hypot(dx,dy)>15)aim(Math.atan2(dy,dx));return;}
 if(!pointer||pointer.id!==e.pointerId)return;e.preventDefault();let dx=e.clientX-pointer.x,dy=e.clientY-pointer.y,d=Math.hypot(dx,dy);if(d>8)aim(Math.atan2(dy,dx));
 if(d>52){pointer.x=e.clientX-dx/d*52;pointer.y=e.clientY-dy/d*52;dx=dx/d*52;dy=dy/d*52;d=52;}
 $('joystick').style.left=pointer.x+'px';$('joystick').style.top=pointer.y+'px';$('joystick-knob').style.transform=`translate(calc(-50% + ${dx*.6}px),calc(-50% + ${dy*.6}px))`;
},{passive:false});
function release(e){if(pointer?.id===e.pointerId){pointer=null;$('joystick').hidden=true;}}
for(const event of ['pointerup','pointercancel','lostpointercapture'])$('game-canvas').addEventListener(event,release);
window.addEventListener('keydown',e=>{if(!game)return;if(e.key==='Escape'||e.key===' '){if(game.over)return;e.preventDefault();$('pause-dialog').open?resume():pause();return;}if(['ArrowUp','ArrowDown','ArrowLeft','ArrowRight','w','a','s','d'].includes(e.key)){if(!canMove())return;e.preventDefault();keys.add(e.key.toLowerCase());keyAim();}});
window.addEventListener('keyup',e=>{keys.delete(e.key.toLowerCase());keyAim();});
function keyAim(){if(!canMove()||!keys.size)return;let x=(keys.has('arrowright')||keys.has('d')?1:0)-(keys.has('arrowleft')||keys.has('a')?1:0),y=(keys.has('arrowdown')||keys.has('s')?1:0)-(keys.has('arrowup')||keys.has('w')?1:0);if(x||y)aim(Math.atan2(y,x));}
window.addEventListener('blur',()=>{keys.clear();if(game?.started)pause();});document.addEventListener('visibilitychange',()=>{if(document.hidden&&game?.started)pause();});
let resizeTimer;function resize(){clearTimeout(resizeTimer);resizeTimer=setTimeout(()=>renderer.resize(),60);if(matchMedia('(pointer:coarse) and (orientation:landscape) and (max-height:600px)').matches&&game?.started)pause();}
window.addEventListener('resize',resize);window.visualViewport?.addEventListener('resize',resize);document.addEventListener('fullscreenchange',resize);
function frame(now){
 let dt=Math.min(.05,Math.max(0,(now-lastTime)/1000));lastTime=now;
 if(game){
  if(!game.paused&&!game.over){keyAim();accumulator+=dt;while(accumulator>=1/60){game.tick(1/60);accumulator-=1/60;if(game.over)break;}processEvents();}
  renderer.render(game.paused?0:dt,now/1000);if(now-lastHud>180){updateHUD();lastHud=now;}
 }else if(now-lastPreview>32){paintPreview($('lobby-preview'),getSkin(state.skin),state.map,state.hat,state.mapBests[state.map],matchMedia('(prefers-reduced-motion:reduce)').matches?0:now/1000);lastPreview=now;}
 requestAnimationFrame(frame);
}
refreshLobby();refreshSettings();save();requestAnimationFrame(frame);
if('serviceWorker' in navigator)navigator.serviceWorker.register('./sw.js').catch(()=>{});
// Optional browser-native tools use the same validated actions as the visible controls.
const modelContext=document.modelContext;
if(modelContext?.registerTool){const controller=new AbortController();window.addEventListener('pagehide',()=>controller.abort(),{once:true});
 const tools=[
  {name:'get_game_state',title:'Read game state',description:'Read current match settings, equipped items, wallet, and live match score.',inputSchema:{type:'object',properties:{},additionalProperties:false},annotations:{readOnlyHint:true},execute:()=>({settings:{...state.settings},skin:state.skin,hat:state.hat,map:state.map,coins:state.coins,gems:state.gems,match:game?{started:game.started,paused:game.paused,over:game.over,percent:game.percent(game.player),kills:game.player.kills}:null})},
  {name:'configure_match',title:'Configure next match',description:'Change difficulty or map for the next match. Does not start gameplay.',inputSchema:{type:'object',properties:{difficulty:{enum:['easy','normal','hard']},map:{enum:MAPS.map(m=>m.id)}},additionalProperties:false},annotations:{readOnlyHint:false},execute:(input)=>{if(game&&!game.over)throw Error('Finish the current match first.');if(!input||typeof input!=='object'||Object.keys(input).some(k=>!['difficulty','map'].includes(k)))throw Error('Invalid match configuration.');if(input.difficulty!==undefined&&!difficultyNames[input.difficulty])throw Error('Invalid difficulty.');if(input.map!==undefined&&!MAPS.some(m=>m.id===input.map))throw Error('Invalid map.');if(input.difficulty)state.settings.difficulty=input.difficulty;if(input.map)selectMap(input.map);save();refreshLobby();refreshSettings();return {settings:{...state.settings},map:state.map};}},
  {name:'start_match',title:'Start a match',description:'Open a new game with the saved settings. The player begins moving when they provide touch, mouse, or keyboard input.',inputSchema:{type:'object',properties:{},additionalProperties:false},annotations:{readOnlyHint:false},execute:()=>{if(game&&!game.over)throw Error('A match is already in progress.');startGame();return {ready:true,ai:game.entities.length-1,map:game.options.map};}}
 ];for(const t of tools)try{Promise.resolve(modelContext.registerTool(t,{signal:controller.signal})).catch(()=>{});}catch{}
}

let connecting=false;
$('multiplayer-btn').addEventListener('click',()=>{if(!connecting)show('online-dialog');});
for(const mode of ['match','create','join'])$('online-'+mode).addEventListener('click',async()=>{
 if(connecting)return;connecting=true;all('#online-dialog button').forEach(b=>b.disabled=true);$('online-status').textContent='連線中…';
 try{
  const endpoint=$('server-url').value.trim();if(!endpoint)throw Error('多人伺服器尚未完成部署，暫時請使用單人遊戲。');localStorage.setItem('paperio-server',endpoint);
  const next=await connectArena(mode,{endpoint,code:$('room-code').value.trim(),map:state.map,...state.settings,skin:state.skin,hat:state.hat},()=>{if(game?.online){processEvents();finish('disconnect');}});
  state.map=next.options.map;startGame(next);toast('已加入房間 '+next.roomId);
 }catch(error){$('online-status').textContent='無法連線：'+(error.message||'請檢查伺服器網址與房號');}
 finally{connecting=false;all('#online-dialog button').forEach(b=>b.disabled=false);}
});
$('online-dialog').addEventListener('cancel',e=>{if(connecting)e.preventDefault();});
$('server-url').value=defaultServerURL(location)||localStorage.getItem('paperio-server')||'';
$('cloud-connect').addEventListener('click',async()=>{
 if(game||connecting)return;connecting=true;const buttons=all('button');const disabled=buttons.map(b=>b.disabled);buttons.forEach(b=>b.disabled=true);$('cloud-status').textContent='正在連接 Firebase…';
 try{const result=await connectCloud(state);state=result.state;localStorage.setItem('paperio-cloud-enabled','1');save();refreshLobby();refreshSettings();$('cloud-status').textContent='Firebase 已連接 · '+result.uid.slice(0,8);}
 catch(error){$('cloud-status').textContent='Firebase 未連接（'+(error.code||error.message)+'），本機進度仍保留。';}
 finally{buttons.forEach((b,i)=>b.disabled=disabled[i]);connecting=false;}
});
setInterval(()=>{const date=state.daily.date;ensureDaily(state);if(date!==state.daily.date){save();refreshBalances();if($('missions-dialog').open)renderMissions();}},10000);
if(localStorage.getItem('paperio-cloud-enabled')==='1')$('cloud-connect').click();

