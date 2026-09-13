import test from 'node:test';
import assert from 'node:assert/strict';
import {Client} from 'colyseus.js';
// Run against npm start; skipped unless explicitly enabled.
const enabled=process.env.TEST_NETWORK==='1';
test('real clients match, join private rooms, receive identical authoritative grids and leave', {skip:!enabled,timeout:30000},async()=>{
 const rooms=[];const endpoint='ws://localhost:2567';
 const join=async(method,...args)=>{const room=await new Client(endpoint)[method](...args);rooms.push(room);room.onMessage('ended',()=>{});return room;};
 const lobby=room=>new Promise((resolve,reject)=>{const timer=setTimeout(()=>reject(Error('lobby timeout')),8000);const remove=room.onMessage('lobby',s=>{clearTimeout(timer);remove();resolve(s);});room.send('sync');});
 const snapshot=room=>new Promise((resolve,reject)=>{const timer=setTimeout(()=>reject(Error('snapshot timeout')),8000);const remove=room.onMessage('snapshot',s=>{if(s.full){clearTimeout(timer);remove();resolve(s);}});room.send('sync');});
 try{
  const a=await join('joinOrCreate','arena',{map:'square'});const la=await lobby(a);assert.equal(la.players.length,1);assert.equal(la.started,false);
  const b=await join('joinOrCreate','arena',{map:'square'});const sb=await snapshot(b);b.onMessage('snapshot',()=>{});const sa=await snapshot(a);a.onMessage('snapshot',()=>{});assert.equal(a.roomId,b.roomId);assert.notEqual(sa.playerId,sb.playerId);assert.equal(sb.entities.filter(e=>e.human).length,2);assert.equal(sb.entities.filter(e=>!e.human).length,0);
  a.send('aim',0);a.send('aim',NaN);a.send('aim',{x:999999});
  const privateRoom=await join('create','arena',{map:'taiwan',private:true});const pl=await lobby(privateRoom);assert.equal(pl.started,false);privateRoom.onMessage('lobby',()=>{});
  const friend=await join('joinById',privateRoom.roomId,{map:'usa'});const fl=await lobby(friend);assert.equal(fl.players.length,2);friend.onMessage('snapshot',()=>{});privateRoom.send('start');await new Promise(r=>setTimeout(r,100));friend.send('ready',true);privateRoom.send('start');const sf=await snapshot(friend);privateRoom.onMessage('snapshot',()=>{});const sp=await snapshot(privateRoom);assert.equal(sf.map,'taiwan');assert.equal(sp.entities.filter(e=>e.human).length,2);assert.equal(sp.entities.filter(e=>!e.human).length,0);
  const stranger=await join('joinOrCreate','arena',{map:'taiwan'});const sl=await lobby(stranger);assert.equal(sl.players.length,1);assert.notEqual(stranger.roomId,privateRoom.roomId);
  await assert.rejects(()=>new Client(endpoint).joinById('missing-room'));
  const current=await snapshot(b);assert.equal(current.grid.length,65536);assert.ok(current.entities.find(e=>e.id===sa.playerId));
  const views=new Map();let compared=0;
  await new Promise((resolve,reject)=>{
   const timer=setTimeout(()=>reject(Error('no shared authoritative frames')),4000);const handlers=[];
   for(const room of [a,b]){
    const grid=new Uint8Array(65536);let initialized=false;
    handlers.push(room.onMessage('snapshot',s=>{
     if(s.full){grid.set(s.grid);initialized=true;}else if(initialized)for(let i=0;i<s.grid.length;i+=2)grid[s.grid[i]]=s.grid[i+1];
     if(!initialized||s.full)return;
     const old=views.get(s.tick);if(old&&old.room!==room.sessionId){try{assert.deepEqual(grid,old.grid);if(++compared===3){clearTimeout(timer);handlers.forEach(h=>h());resolve();}}catch(e){clearTimeout(timer);reject(e);}}
     else views.set(s.tick,{room:room.sessionId,grid:grid.slice()});
    }));room.send('sync');
   }
  });
 }finally{await Promise.all(rooms.map(r=>r.leave()));}
});

