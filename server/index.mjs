import http from 'node:http';
import path from 'node:path';
import {fileURLToPath} from 'node:url';
import express from 'express';
import {Server,Room} from '@colyseus/core';
import {WebSocketTransport} from '@colyseus/ws-transport';
import {Game} from '../dist/engine.mjs';
import {MAPS,getSkin,HATS} from '../dist/catalog.mjs';

export class Arena extends Room {
 async onCreate(options){
  this.maxClients=8;this.players=new Map();this.serial=32;this.previous=new Uint8Array(65536);this.pending=[];this.trailCache=new Map();this.tickNumber=0;
  const map=MAPS.some(m=>m.id===options.map)?options.map:'usa';
  this.game=new Game({map,multiplayer:true,difficulty:['easy','normal','hard'].includes(options.difficulty)?options.difficulty:'normal',respawn:options.respawn!==false});
  // Keep exactly the map's AI population; humans use their own separate slots.
  for(let i=0;i<this.game.grid.length;i++)if(this.game.grid[i]===1)this.game.assign(i,0);
  this.game.entities=this.game.entities.filter(e=>e.id!==1);this.game.player=this.game.entities[0];this.game.started=true;
  await this.setMetadata({map});if(options.private)await this.setPrivate(true);
  this.onMessage('aim',(client,angle)=>{const e=this.players.get(client.sessionId);if(e?.alive&&Number.isFinite(angle))e.targetAngle=Math.atan2(Math.sin(angle),Math.cos(angle));});
  this.onMessage('sync',client=>this.snapshot(client,true));
  let elapsed=0;
  this.setSimulationInterval(dt=>{
   this.game.tick(1/60);this.tickNumber++;this.pending.push(...this.game.drain());elapsed+=dt;
   if(elapsed>=50){elapsed%=50;this.flush();}
  },1000/60);
 }
 onJoin(client,options){
  if(this.serial>=63)throw new Error('此房間已完成多輪，請建立新房間');
  const e=this.game.spawn(this.serial++,true);if(!e)throw new Error('地圖空間不足，請建立新房間');
  e.name=typeof options.name==='string'?options.name.trim().slice(0,14)||'玩家':'玩家';e.skin=getSkin(options.skin);e.hat=HATS.some(h=>h.id===options.hat)?options.hat:'none';
  e.joinedAt=this.game.time;e.earned=0;e.earnedGems=0;e.peak=this.game.percent(e);
  this.players.set(client.sessionId,e);this.snapshot(client,true);
 }
 onLeave(client){const e=this.players.get(client.sessionId);if(e){this.game.kill(e,null,'quit');this.players.delete(client.sessionId);}if(!this.clients.length)this.disconnect();}
 entities(full=false){return this.game.entities.map(e=>{const last=this.trailCache.get(e.id),offset=!full&&last?.ref===e.trail?last.length:0;return {id:e.id,human:e.human,x:e.x,y:e.y,px:e.px,py:e.py,angle:e.angle,targetAngle:e.targetAngle,skin:e.skin,hat:e.hat,name:e.name,alive:e.alive,trailOffset:offset,trail:e.trail.slice(offset),outside:e.outside,kills:e.kills,captures:e.captures,wallBoost:e.wallBoost};});}
 snapshot(client,full=false,delta=[],events=[]){
  const e=this.players.get(client.sessionId);if(!e)return;
  client.send('snapshot',{full,tick:this.tickNumber,map:this.game.options.map,playerId:e.id,grid:full?Array.from(this.game.grid):delta,entities:full?this.entities(true):this.frameEntities,time:this.game.time-e.joinedAt,earned:e.earned,earnedGems:e.earnedGems,peak:e.peak,events:events.filter(v=>v.playerId===undefined||v.playerId===e.id)});
 }
 flush(){
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
