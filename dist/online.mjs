import {Game} from './engine.mjs';
import {defaultServerURL} from './runtime-config.mjs';

// Join a human-only room and resolve as soon as its lobby is available. The
// game promise resolves later, after the host starts a private room or a
// quick-match room finds a second player.
export async function connectArena(mode,options,onLobby,onDisconnect){
 const {Client}=await import('./vendor.mjs');
 const endpoint=options.endpoint||defaultServerURL(location);
 if(!endpoint)throw Error('多人伺服器尚未完成部署');
 const url=new URL(endpoint);if(!['ws:','wss:'].includes(url.protocol))throw Error('伺服器網址請使用 ws:// 或 wss://');
 const client=new Client(url.href);
 const room=mode==='join'?await client.joinById(options.code,options):mode==='create'?await client.create('arena',{...options,private:true}):await client.joinOrCreate('arena',options);
 let g=null,closed=false,lastSent=0,lastAngle=null,lobbyResolved=false,resolveLobby,rejectLobby,resolveStart,rejectStart;
 const lobbyPromise=new Promise((resolve,reject)=>{resolveLobby=resolve;rejectLobby=reject;});
 const startPromise=new Promise((resolve,reject)=>{resolveStart=resolve;rejectStart=reject;});
 const api={room,roomId:room.roomId,startPromise,ready(value){room.send('ready',Boolean(value));},start(){room.send('start');},leave(){if(!closed){closed=true;room.leave();}}};
 const timer=setTimeout(()=>{if(!lobbyResolved){closed=true;room.leave();rejectLobby(Error('取得房間大廳逾時'));}},15000);
 room.onLeave(()=>{clearTimeout(timer);if(closed)return;closed=true;if(!lobbyResolved)rejectLobby(Error('房間已關閉'));else {rejectStart(Error('房間已關閉'));onDisconnect?.();}});
 room.onError((_code,message)=>{if(!lobbyResolved){clearTimeout(timer);closed=true;room.leave();rejectLobby(Error(message||'房間連線失敗'));}else rejectStart(Error(message||'房間連線失敗'));});
 room.onMessage('lobby',state=>{
  state.roomId=room.roomId;api.lobby=state;onLobby?.(state,api);
  if(!lobbyResolved){lobbyResolved=true;clearTimeout(timer);resolveLobby(api);}
 });
 room.onMessage('ended',()=>{if(g&&!g.over)g.events.push({type:'end',reason:'complete'});});
 room.onMessage('snapshot',s=>{
  if(closed||g?.over)return;
  if(!g){if(!s.full)return;g=new Game({map:s.map,multiplayer:true,ai:0});g.online=true;g.roomId=room.roomId;g.events=[];g.started=true;
   g.tick=dt=>{const t=1-Math.exp(-dt*35);for(const e of g.entities){e.x+=(e.netX-e.x)*t;e.y+=(e.netY-e.y)*t;}};
   g.aim=angle=>{const now=performance.now();if(Number.isFinite(angle)&&now-lastSent>=1000/30&&(angle!==lastAngle||now-lastSent>500)){room.send('aim',angle);lastSent=now;lastAngle=angle;}};
   g.leave=()=>{closed=true;room.leave();};api.game=g;
  }
  if(s.full){g.grid.set(s.grid);g.dirty=new Set(Array.from({length:64},(_,i)=>i));}
  else for(let i=0;i<s.grid.length;i+=2){const index=s.grid[i],id=s.grid[i+1];g.dirty.add(g.grid[index]);g.dirty.add(id);g.grid[index]=id;}
  g.counts.fill(0);for(const id of g.grid)g.counts[id]++;
  const previous=new Map(g.entities.map(e=>[e.id,e]));
  g.entities=s.entities.map(e=>{const old=previous.get(e.id);return {...e,trail:[...(old?.trail||[]).slice(0,e.trailOffset),...e.trail],netX:e.x,netY:e.y,x:old?.x??e.x,y:old?.y??e.y};});g.player=g.entities.find(e=>e.id===s.playerId);g.time=s.time;g.earned=s.earned;g.earnedGems=s.earnedGems;g.peak=s.peak;g.captures=g.player.captures;g.events.push(...s.events);g.revision++;
  resolveStart(g);
 });
 room.send('sync');
 return lobbyPromise;
}

