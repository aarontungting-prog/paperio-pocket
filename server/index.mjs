import http from 'node:http';
import path from 'node:path';
import {fileURLToPath} from 'node:url';
import express from 'express';
import {Server,Room} from '@colyseus/core';
import {WebSocketTransport} from '@colyseus/ws-transport';
import {Game} from '../dist/engine.mjs';
import {MAPS,getSkin,HATS} from '../dist/catalog.mjs';

const validMap=id=>MAPS.some(m=>m.id===id)?id:'usa';
const validDifficulty=id=>['easy','normal','hard'].includes(id)?id:'normal';

export class Arena extends Room {
 async onCreate(options={}){
  this.maxClients=8;
  this.mode=options.private?'private':'match';
  this.privateRoom=this.mode==='private';
  this.roomOptions={map:validMap(options.map),difficulty:validDifficulty(options.difficulty),respawn:options.respawn!==false};
  this.hostSessionId=null;this.members=new Map();this.players=new Map();this.serial=32;
  this.game=null;this.previous=new Uint8Array(65536);this.pending=[];this.trailCache=new Map();this.tickNumber=0;this.frameEntities=[];
  await this.setMetadata({map:this.roomOptions.map,mode:this.mode});
  if(this.privateRoom)await this.setPrivate(true);
  this.onMessage('aim',(client,angle)=>{if(!this.game?.started)return;const e=this.players.get(client.sessionId);if(e?.alive&&Number.isFinite(angle))e.targetAngle=Math.atan2(Math.sin(angle),Math.cos(angle));});
  this.onMessage('sync',client=>{if(this.game?.started)this.snapshot(client,true);else this.sendLobby(client);});
  this.onMessage('ready',(client,want)=>{
   if(this.game?.started||!this.privateRoom||!this.members.has(client.sessionId))return;
   this.members.get(client.sessionId).ready=Boolean(want);this.broadcastLobby();
  });
  this.onMessage('start',client=>{
   if(this.game?.started||!this.privateRoom||client.sessionId!==this.hostSessionId||this.members.size<2)return;
   if(![...this.members.values()].every(p=>p.ready))return;
   this.startMatch();
  });
 }
 onJoin(client,options={}){
  if(this.game?.started)throw new Error('遊戲已開始，請加入其他房間');
  if(this.members.size>=8)throw new Error('房間已滿');
  if(!this.hostSessionId)this.hostSessionId=client.sessionId;
  const isHost=client.sessionId===this.hostSessionId;
  this.members.set(client.sessionId,{sessionId:client.sessionId,name:typeof options.name==='string'?options.name.trim().slice(0,14)||'玩家':'玩家',skin:getSkin(options.skin),hat:HATS.some(h=>h.id===options.hat)?options.hat:'none',ready:isHost});
  this.broadcastLobby();
  // Quick match rooms contain humans only and begin as soon as two people meet.
  if(this.mode==='match'&&this.members.size>=2)this.startMatch();
 }
 onLeave(client){
  if(!this.game?.started){
   this.members.delete(client.sessionId);
   if(client.sessionId===this.hostSessionId){this.hostSessionId=this.members.keys().next().value||null;const next=this.members.get(this.hostSessionId);if(next)next.ready=true;}
   if(this.clients.length)this.broadcastLobby();else this.disconnect();
   return;
  }
  const e=this.players.get(client.sessionId);if(e){this.game.kill(e,null,'quit');this.players.delete(client.sessionId);}
  if(!this.clients.length)this.disconnect();
 }
 lobbyState(client){
  return {roomId:this.roomId,private:this.privateRoom,started:Boolean(this.game?.started),map:this.roomOptions.map,difficulty:this.roomOptions.difficulty,hostSessionId:this.hostSessionId,selfSessionId:client?.sessionId||'',players:[...this.members.values()].map(p=>({sessionId:p.sessionId,name:p.name,skin:p.skin,hat:p.hat,ready:p.ready,host:p.sessionId===this.hostSessionId}))};
 }
 sendLobby(client){client.send('lobby',this.lobbyState(client));}
 broadcastLobby(){for(const client of this.clients)this.sendLobby(client);}
 startMatch(){
  if(this.game?.started)return;
  this.game=new Game({...this.roomOptions,multiplayer:true,ai:0});
  for(let i=0;i<this.game.grid.length;i++)if(this.game.grid[i]===1)this.game.assign(i,0);
  this.game.entities=[];this.game.player=null;this.players.clear();
  for(const member of this.members.values()){
   const e=this.game.spawn(this.serial++,true);if(!e)throw new Error('地圖空間不足，請建立新房間');
   e.name=member.name;e.skin=member.skin;e.hat=member.hat;e.joinedAt=this.game.time;e.earned=0;e.earnedGems=0;e.peak=this.game.percent(e);this.players.set(member.sessionId,e);
  }
  this.game.player=this.players.values().next().value;this.game.started=true;
  this.previous.fill(0);this.pending=[];this.trailCache.clear();this.tickNumber=0;
  this.broadcastLobby();
  this.setSimulationInterval(dt=>{
   this.game.tick(1/60);this.tickNumber++;this.pending.push(...this.game.drain());
   if(this.tickNumber%3===0)this.flush();
  },1000/60);
  for(const client of this.clients)this.snapshot(client,true);
 }
 entities(full=false){return this.game.entities.map(e=>{const last=this.trailCache.get(e.id),offset=!full&&last?.ref===e.trail?last.length:0;return {id:e.id,human:e.human,x:e.x,y:e.y,px:e.px,py:e.py,angle:e.angle,targetAngle:e.targetAngle,skin:e.skin,hat:e.hat,name:e.name,alive:e.alive,trailOffset:offset,trail:e.trail.slice(offset),outside:e.outside,kills:e.kills,captures:e.captures,wallBoost:e.wallBoost};});}
 snapshot(client,full=false,delta=[],events=[]){
  if(!this.game?.started)return;
  const e=this.players.get(client.sessionId);if(!e)return;
  client.send('snapshot',{full,tick:this.tickNumber,map:this.game.options.map,playerId:e.id,grid:full?Array.from(this.game.grid):delta,entities:full?this.entities(true):this.frameEntities,time:this.game.time-e.joinedAt,earned:e.earned,earnedGems:e.earnedGems,peak:e.peak,events:events.filter(v=>v.playerId===undefined||v.playerId===e.id)});
 }
 flush(){
  if(!this.game?.started)return;
  const delta=[];for(let i=0;i<this.previous.length;i++)if(this.previous[i]!==this.game.grid[i]){delta.push(i,this.game.grid[i]);this.previous[i]=this.game.grid[i];}
  const events=this.pending.splice(0);
  for(const e of this.players.values()){
   e.peak=Math.max(e.peak,this.game.percent(e));
   for(const v of events)if(v.type==='reward'&&v.playerId===e.id){e.earned+=v.coins||0;e.earnedGems+=v.gems||0;}
  }
  this.frameEntities=this.entities();
  for(const client of this.clients)this.snapshot(client,false,delta,events);
  for(const e of this.game.entities)this.trailCache.set(e.id,{ref:e.trail,length:e.trail.length});
  if(this.game.over){this.lock();for(const client of this.clients){const e=this.players.get(client.sessionId);if(e?.alive&&!events.some(v=>v.type==='end'&&v.playerId===e.id))client.send('ended');}}
 }
}
const app=express();app.get('/health',(_req,res)=>res.json({ok:true}));
app.use(express.static(path.resolve(path.dirname(fileURLToPath(import.meta.url)),'../dist')));
const server=new Server({transport:new WebSocketTransport({server:http.createServer(app),maxPayload:4096})});
server.define('arena',Arena).filterBy(['map','difficulty','respawn']);
await server.listen(Number(process.env.PORT)||2567,'0.0.0.0');
console.log('Paperio: http://localhost:'+(process.env.PORT||2567));

