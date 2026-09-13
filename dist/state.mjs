import {SKINS,HATS,MAPS,MISSIONS} from './catalog.mjs';
export const SAVE_KEY='paperio-pocket-v1';
const number=(v,d=0,max=1e9)=>Number.isFinite(v)?Math.max(0,Math.min(max,v)):d;
export function cleanState(raw={}){
 if(!raw||typeof raw!=='object')raw={};const s=raw.settings||{},stats=raw.stats||{},skinIds=Array.isArray(raw.ownedSkins)?raw.ownedSkins:[],hatIds=Array.isArray(raw.ownedHats)?raw.ownedHats:[];
 return {version:1,coins:Math.floor(number(raw.coins,600)),gems:Math.floor(number(raw.gems,10)),
 ownedSkins:[...new Set([...SKINS.filter(s=>s.price===0).map(s=>s.id),...(Array.isArray(raw.ownedSkins)?raw.ownedSkins:[]).filter(id=>SKINS.some(s=>s.id===id))])],
 ownedHats:[...new Set(['none',...(Array.isArray(raw.ownedHats)?raw.ownedHats:[]).filter(id=>HATS.some(s=>s.id===id))])],
 skin:SKINS.some(x=>x.id===raw.skin&&(x.price===0||skinIds.includes(x.id)))?raw.skin:'melon',
 hat:HATS.some(x=>x.id===raw.hat&&(x.price===0||hatIds.includes(x.id)))?raw.hat:'none',
 map:MAPS.some(x=>x.id===raw.map)?raw.map:'usa',
 settings:{difficulty:['easy','normal','hard'].includes(s.difficulty)?s.difficulty:'normal',respawn:s.respawn!==false,sound:s.sound!==false,haptic:s.haptic!==false,name:typeof s.name==='string'&&s.name.trim()?s.name.trim().slice(0,14):'圈地小高手'},
 stats:{games:Math.floor(number(stats.games)),kills:Math.floor(number(stats.kills)),captures:Math.floor(number(stats.captures)),best:number(stats.best,0,100),seconds:Math.floor(number(stats.seconds)),wins:Math.floor(number(stats.wins))},
 mapBests:Object.fromEntries(MAPS.map(m=>[m.id,number(raw.mapBests?.[m.id],0,100)])),
 daily:cleanDaily(raw.daily),
 claimed:[]};
}
export function buy(state,item,kind='skins'){
 const list=kind==='skins'?state.ownedSkins:state.ownedHats,key=kind==='skins'?'skin':'hat';
 if(!item||(kind==='skins'?SKINS:HATS).find(x=>x.id===item.id)!==item)return {ok:false,reason:'invalid'};
 if(!list.includes(item.id)){const currency=item.currency||'coins';if(state[currency]<item.price)return {ok:false,reason:'funds',missing:item.price-state[currency],currency};state[currency]-=item.price;list.push(item.id);}
 state[key]=item.id;return {ok:true};
}
export function claim(state,id){ensureDaily(state);const m=MISSIONS.find(m=>m.id===id);if(!m||state.daily.claimed.includes(id)||state.daily.stats[m.key]<m.goal)return false;state.daily.claimed.push(id);state.coins+=m.coins;state.gems+=m.gems;return true;}

export function dayKey(now=Date.now()){return new Date(now+8*3600000).toISOString().slice(0,10);}
function cleanDaily(raw,now=Date.now()) {const date=dayKey(now),valid=raw?.date===date;return {date,stats:Object.fromEntries(['games','kills','captures','best','seconds','wins'].map(k=>[k,valid?number(raw.stats?.[k]):0])),claimed:valid&&Array.isArray(raw.claimed)?raw.claimed.filter(id=>MISSIONS.some(m=>m.id===id)):[]};}
export function ensureDaily(state,now=Date.now()){if(state.daily?.date!==dayKey(now))state.daily=cleanDaily(null,now);return state.daily;}
export function recordDaily(state,values){const daily=ensureDaily(state);for(const [k,v] of Object.entries(values))if(k in daily.stats&&Number.isFinite(v))daily.stats[k]=k==='best'?Math.max(daily.stats[k],v):daily.stats[k]+Math.max(0,v);}
