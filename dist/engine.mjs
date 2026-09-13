import {SKINS,NAMES,mapPolygon,insidePolygon,getSkin,getMap} from './catalog.mjs';
export const GRID=256, WORLD=2048, CELL=WORLD/GRID, SPEED=140;
const TAU=Math.PI*2;
const clamp=(x,a,b)=>Math.max(a,Math.min(b,x));
const distance=(a,b)=>Math.hypot(a.x-b.x,a.y-b.y);
const angleDelta=(a,b)=>Math.atan2(Math.sin(b-a),Math.cos(b-a));
export class Game {
 constructor(options={}){
  this.options={ai:12,difficulty:'normal',respawn:true,map:'usa',skin:'melon',hat:'none',name:'你',...options};
  // A private room may add up to seven AI opponents. Single-player keeps each
  // map's fixed AI count; multiplayer uses the room's explicit AI setting.
  this.options.ai=this.options.multiplayer?clamp(Math.round(this.options.ai||0),0,7):getMap(this.options.map).ai;
  this.random=options.random||Math.random;this.grid=new Uint8Array(GRID*GRID);this.mask=new Uint8Array(GRID*GRID);
  this.trails=new Uint8Array(GRID*GRID);this.ages=new Float32Array(GRID*GRID);this.counts=new Int32Array(64);
  this.dirty=new Set();this.entities=[];this.events=[];this.time=0;this.over=false;this.started=false;this.paused=false;
  this.earned=0;this.earnedGems=0;this.captures=0;this.peak=0;this.nextId=1;this.revision=0;this.respawns=[];
  this.queue=new Int32Array(GRID*GRID);this.visited=new Int32Array(GRID*GRID);this.searchStamp=0;
  this.polygon=mapPolygon(this.options.map);this.total=0;
  for(let y=0;y<GRID;y++)for(let x=0;x<GRID;x++){let i=y*GRID+x;if(insidePolygon((x+.5)/GRID,(y+.5)/GRID,this.polygon)){this.mask[i]=1;this.total++;}}
  this.counts[0]=this.total;
  this.spawnRadius=42;
  let p=this.spawn(1,true);this.player=p;
  for(let i=0;i<clamp(Math.round(this.options.ai),0,30);i++)this.spawn(i+2,false);
  this.peak=this.percent(p);this.initial=this.peak;
 }
 index(x,y){return Math.floor(y/CELL)*GRID+Math.floor(x/CELL);}
 valid(x,y,margin=0){
  if(x<0||y<0||x>=WORLD||y>=WORLD||!this.mask[this.index(x,y)])return false;
  if(margin)for(let a=0;a<TAU;a+=Math.PI/4)if(!this.valid(x+Math.cos(a)*margin,y+Math.sin(a)*margin))return false;
  return true;
 }
 owner(x,y){return this.valid(x,y)?this.grid[this.index(x,y)]:0;}
 // Movement uses the smooth polygon rather than the stair-stepped ownership grid.
 movementValid(x,y,margin=9){
  if(!this.valid(x,y)||!insidePolygon(x/WORLD,y/WORLD,this.polygon))return false;
  const p=this.polygon,limit=margin*margin;
  for(let i=0;i<p.length;i++){
   const a=p[i],b=p[(i+1)%p.length],ax=a[0]*WORLD,ay=a[1]*WORLD,dx=(b[0]-a[0])*WORLD,dy=(b[1]-a[1])*WORLD;
   const t=clamp(((x-ax)*dx+(y-ay)*dy)/(dx*dx+dy*dy||1),0,1);
   if((x-ax-t*dx)**2+(y-ay-t*dy)**2<limit)return false;
  }return true;
 }
 percent(e){return this.counts[e.id]/this.total*100;}
 assign(i,id){let old=this.grid[i];if(old===id)return;this.counts[old]--;this.counts[id]++;this.grid[i]=id;this.dirty.add(old);this.dirty.add(id);}
 spawn(id,human=false){
  let best=null,bestScore=-1;
  for(let t=0;t<700;t++){
   let x=t===0&&human?WORLD*.5:WORLD*(.06+this.random()*.88),y=t===0&&human?WORLD*.5:WORLD*(.06+this.random()*.88);
   const radius=this.spawnRadius;
   if(!this.valid(x,y,radius+12))continue;
   let neutral=true;for(let a=0;a<TAU;a+=Math.PI/3)if(this.owner(x+Math.cos(a)*(radius+4),y+Math.sin(a)*(radius+4)))neutral=false;
   if(!neutral||this.owner(x,y))continue;
   let near=this.entities.filter(e=>e.alive).reduce((d,e)=>Math.min(d,Math.hypot(x-e.x,y-e.y)),9999);
   if(human&&!this.options.multiplayer){best={x,y};break;}
   let score=near+(this.random()*.05);if(score>bestScore){bestScore=score;best={x,y};}if(near>260&&t>20)break;
  }
  if(!best||(!human&&bestScore<this.spawnRadius*2+19))return null;
  let old=this.entities.find(e=>e.id===id);if(old)this.entities.splice(this.entities.indexOf(old),1);
  let skin=human?getSkin(this.options.skin):SKINS[(id*7+Math.floor(this.random()*9))%SKINS.length];
  let e={id,human,...best,px:best.x,py:best.y,angle:-Math.PI/2,targetAngle:-Math.PI/2,skin,hat:human?this.options.hat:'none',name:human?this.options.name:NAMES[(id-2)%NAMES.length],alive:true,trail:[],trailCells:[],travel:0,outside:false,kills:0,plan:[],state:'expand',thinkAt:this.random()*.3,planAt:0,spawnTime:this.time,attackUntil:0,home:{...best},captures:0};
  for(let y=Math.floor((e.y-this.spawnRadius)/CELL);y<=Math.ceil((e.y+this.spawnRadius)/CELL);y++)for(let x=Math.floor((e.x-this.spawnRadius)/CELL);x<=Math.ceil((e.x+this.spawnRadius)/CELL);x++){
   let i=y*GRID+x;if(this.mask[i]&&Math.hypot((x+.5)*CELL-e.x,(y+.5)*CELL-e.y)<this.spawnRadius)this.assign(i,id);
  }
  this.entities.push(e);this.revision++;return e;
 }
 aim(angle){if(!Number.isFinite(angle)||this.over)return;this.player.targetAngle=angle;this.started=true;}
 clearTrail(e){for(const i of e.trailCells)if(this.trails[i]===e.id)this.trails[i]=0;e.trailCells=[];e.trail=[];e.outside=false;}
 kill(victim,killer,reason='cut'){
  if(!victim?.alive||this.over)return;
  victim.alive=false;this.clearTrail(victim);
  for(let i=0;i<this.grid.length;i++)if(this.grid[i]===victim.id)this.assign(i,killer&&killer!==victim&&killer.alive?killer.id:0);
  if(killer&&killer!==victim&&killer.alive){killer.kills++;if(killer.human){this.earned+=35;this.events.push({type:'reward',playerId:killer.id,coins:35,kills:1,best:this.percent(killer)});}}
  this.events.push({type:'kill',victimId:victim.id,killerId:killer?.id,victim:victim.name,killer:killer?.name,reason,x:victim.x,y:victim.y,color:victim.skin.color,human:victim.human});
  this.revision++;
  if(victim.human){if(!this.options.multiplayer)this.over=true;this.events.push({type:'end',playerId:victim.id,reason,killer:killer?.name});}
  else if(this.options.respawn)this.respawns.push({id:victim.id,at:this.time+7+this.random()*5});
  if(killer?.human&&killer.alive){this.peak=Math.max(this.peak,this.percent(killer));this.checkVictory(killer);}
 }
 capture(e){
  if(!e.trailCells.length){this.clearTrail(e);return;}
  const before=this.counts[e.id];
  const added=new Set(e.trailCells.filter(i=>this.mask[i]&&this.grid[i]!==e.id));
  for(const i of added)this.assign(i,e.id);
  const labels=this.visited;labels.fill(0);let label=0;const enclosed=new Set();
  for(let start=0;start<this.grid.length;start++){
   if(!this.mask[start]||this.grid[start]===e.id||labels[start])continue;
   label++;let head=0,tail=1,edge=false,touchesNewTrail=false;this.queue[0]=start;labels[start]=label;
   while(head<tail){
    let i=this.queue[head++],x=i%GRID,y=(i/GRID)|0;
    for(const n of [x>0?i-1:-1,x<GRID-1?i+1:-1,y>0?i-GRID:-1,y<GRID-1?i+GRID:-1]){
     if(n<0||!this.mask[n]){edge=true;continue;}
     if(added.has(n))touchesNewTrail=true;
     if(!labels[n]&&this.grid[n]!==e.id){labels[n]=label;this.queue[tail++]=n;}
    }
   }
   // Every coast-connected component is exterior, not only the largest one.
   // A disconnected inherited base must not fill an old pocket elsewhere.
   if(!edge&&touchesNewTrail)enclosed.add(label);
  }
  for(let i=0;i<this.grid.length;i++)if(enclosed.has(labels[i]))this.assign(i,e.id);
  this.clearTrail(e);e.plan=[];e.state='expand';e.home={x:e.x,y:e.y};e.thinkAt=this.time+.12;
  const gained=this.counts[e.id]-before;e.captures++;this.revision++;
  if(e.human){
   this.captures++;this.peak=Math.max(this.peak,this.percent(e));let coins=Math.max(2,Math.round(gained/this.total*500));this.earned+=coins;
   const gems=e.captures%5===0?1:0;this.earnedGems+=gems;
   this.events.push({type:'reward',playerId:e.id,coins,gems,captures:1,best:this.percent(e)});
   this.events.push({type:'capture',playerId:e.id,gain:gained/this.total*100,x:e.x,y:e.y,color:e.skin.color});
  }
  for(const other of this.entities)if(other.alive&&other.id!==e.id&&this.counts[other.id]===0)this.kill(other,e,'base');
  this.checkVictory(e);
 }
 checkVictory(e){
  if(e.human&&this.options.multiplayer&&!this.entities.some(q=>q.alive&&q.id!==e.id)){
   for(let i=0;i<this.grid.length;i++)if(this.mask[i])this.assign(i,e.id);
   this.peak=100;this.over=true;this.events.push({type:'reward',playerId:e.id,coins:500,best:100});this.earned+=500;this.events.push({type:'end',playerId:e.id,reason:'win',cause:'elimination'});return;
  }
  const noOpponents=!this.entities.some(q=>q.alive&&q.id!==e.id);
  if(e.human&&noOpponents&&this.percent(e)>=94.5&&!this.over){
   for(let i=0;i<this.grid.length;i++)if(this.mask[i])this.assign(i,e.id);
   this.peak=100;this.over=true;this.events.push({type:'reward',playerId:e.id,coins:500,best:100});this.earned+=500;this.events.push({type:'end',playerId:e.id,reason:'win',cause:'coastline'});return;
  }
  // A rounded coastline can leave a handful of raster cells unreachable by a
  // final loop. Once the player has reached the last half percent, award those
  // cells too so every completed match can actually finish at 100%.
  if(e.human&&this.percent(e)>=99.5&&!this.over){
   for(let i=0;i<this.grid.length;i++)if(this.mask[i])this.assign(i,e.id);
   this.peak=100;this.over=true;this.events.push({type:'reward',playerId:e.id,coins:500,best:100});this.earned+=500;this.events.push({type:'end',playerId:e.id,reason:'win'});
  }
 }
 tick(dt){
  if(!this.started||this.paused||this.over)return;
  dt=Math.min(dt,.05);this.time+=dt;
  for(const e of this.entities){
   if(!e.alive)continue;
   if(!e.human)this.think(e);
   e.angle+=clamp(angleDelta(e.angle,e.targetAngle),-4.3*dt,4.3*dt);
   const speed=SPEED;let nx=e.x+Math.cos(e.angle)*speed*dt,ny=e.y+Math.sin(e.angle)*speed*dt;
   e.px=e.x;e.py=e.y;
   e.wallBoost=false;
   if(!this.movementValid(nx,ny)){
    // Search the closest forward tangent on the rasterized coastline. Keep its
    // direction while pushing outward, but allow deliberate steering inland.
    const reference=e.wallAngle??e.angle;let found=null;
    for(let step=0;step<=36&&!found;step++)for(const sign of [1,-1]){
     const a=reference+sign*step*Math.PI/36,d=speed*1.45*dt;
     const x=e.x+Math.cos(a)*d,y=e.y+Math.sin(a)*d;
     if(this.movementValid(x,y)){found={x,y,a};break;}
    }
    if(!found)continue;
    nx=found.x;ny=found.y;e.angle=found.a;e.wallAngle=found.a;e.wallBoost=true;
   }else e.wallAngle=null;
   e.x=nx;e.y=ny;e.travel+=Math.hypot(nx-e.px,ny-e.py);
   const i=this.index(nx,ny);
   const cx=i%GRID,cy=(i/GRID)|0;
   for(const [ox,oy] of [[0,0],[-1,0],[1,0],[0,-1],[0,1]]){
    if(cx+ox<0||cx+ox>=GRID||cy+oy<0||cy+oy>=GRID)continue;
    const n=i+oy*GRID+ox,id=this.trails[n];if(!id)continue;
    if(id!==e.id) this.kill(this.entities.find(q=>q.id===id),e,'cut');
   }
   if(this.over)break;
   if(!e.alive)continue;
   // A kill may have changed ownership under the head during this same tick.
   const safe=this.grid[i]===e.id;
   if(safe){if(e.outside)this.capture(e);}
   else{
    if(!e.outside){e.outside=true;e.trail=[{x:e.px,y:e.py}];e.outAt=this.time;}
    if(this.trails[i]!==e.id){this.trails[i]=e.id;this.ages[i]=e.travel;e.trailCells.push(i);}
    let last=e.trail[e.trail.length-1];if(!last||distance(e,last)>4)e.trail.push({x:e.x,y:e.y});
   }
  }
  if(!this.over&&this.percent(this.player)<75){
   for(let i=this.respawns.length-1;i>=0;i--)if(this.respawns[i].at<this.time){const r=this.respawns[i];if(this.spawn(r.id))this.respawns.splice(i,1);else r.at=this.time+8;}
  }
 }
 lineClear(a,b,e,margin=11){
  const d=distance(a,b),steps=Math.max(1,Math.ceil(d/7));
  for(let n=1;n<=steps;n++){const x=a.x+(b.x-a.x)*n/steps,y=a.y+(b.y-a.y)*n/steps;if(!this.valid(x,y,margin))return false;
   const i=this.index(x,y);for(const k of [i,i-1,i+1,i-GRID,i+GRID])if(this.trails[k]===e.id&&e.travel-this.ages[k]>50)return false;
  }return true;
 }
 findHome(e){
  let candidates=[];
  for(let y=1;y<GRID-1;y+=2)for(let x=1;x<GRID-1;x+=2){let i=y*GRID+x;if(this.grid[i]===e.id&&this.grid[i-1]===e.id&&this.grid[i+1]===e.id&&this.grid[i-GRID]===e.id&&this.grid[i+GRID]===e.id){let p={x:(x+.5)*CELL,y:(y+.5)*CELL};candidates.push({p,d:distance(e,p)});}}
  candidates.sort((a,b)=>a.d-b.d);
  for(const {p} of candidates.slice(0,90))if(Math.abs(angleDelta(e.angle,Math.atan2(p.y-e.y,p.x-e.x)))<2.3&&this.lineClear(e,p,e))return [p];
  // Search a return route around the bot's own exposed trail.
  const start=this.index(e.x,e.y),parents=new Int32Array(GRID*GRID);parents.fill(-1);parents[start]=start;
  let head=0,tail=1,found=-1;this.queue[0]=start;
  while(head<tail&&head<35000){let i=this.queue[head++],x=i%GRID,y=(i/GRID)|0;
   if(this.grid[i]===e.id&&i!==start&&this.grid[i-1]===e.id&&this.grid[i+1]===e.id){found=i;break;}
   for(const [dx,dy] of [[1,0],[-1,0],[0,1],[0,-1]]){
    if(x+dx<2||x+dx>=GRID-2||y+dy<2||y+dy>=GRID-2)continue;
    let n=i+dx+dy*GRID;if(parents[n]!==-1||!this.mask[n])continue;
    let px=(x+dx+.5)*CELL,py=(y+dy+.5)*CELL;
    if(head<4&&Math.abs(angleDelta(e.angle,Math.atan2(py-e.y,px-e.x)))>1.6)continue;
    let blocked=false;
    for(let oy=-1;oy<=1;oy++)for(let ox=-1;ox<=1;ox++){let z=n+ox+oy*GRID;if(!this.mask[z]||(this.trails[z]===e.id&&e.travel-this.ages[z]>55))blocked=true;}
    if(blocked)continue;parents[n]=i;this.queue[tail++]=n;
   }
  }
  if(found<0)return candidates.length?[candidates[0].p]:[];
  let path=[];for(let n=found;n!==start;n=parents[n])path.push({x:(n%GRID+.5)*CELL,y:(((n/GRID)|0)+.5)*CELL});path.reverse();
  let result=[],last=e,index=0;
  while(index<path.length){let next=index;for(let j=index;j<path.length;j++){if(this.lineClear(last,path[j],e,12))next=j;else break;}result.push(path[next]);last=path[next];index=next+1;}
  return result;
 }
 makeLoop(e){
  let best=null,bestScore=-Infinity;const harder=this.options.difficulty==='hard',easy=this.options.difficulty==='easy';
  const enemies=this.entities.filter(q=>q.alive&&q.id!==e.id&&distance(e,q)<440);
  for(let t=0;t<18;t++){
   const angle=t===0?e.angle:this.random()*TAU,u={x:Math.cos(angle),y:Math.sin(angle)},v={x:-u.y,y:u.x};
   let edge=0;while(edge<270&&this.owner(e.x+u.x*edge,e.y+u.y*edge)===e.id)edge+=12;
   let depth=55+this.random()*(easy?55:95),width=55+this.random()*55;
   let far=edge+depth;
   const side=this.random()<.5?1:-1;
   let a={x:e.x+u.x*far+v.x*width*side,y:e.y+u.y*far+v.y*width*side};
   let b={x:e.x+u.x*far-v.x*width*side,y:e.y+u.y*far-v.y*width*side};
   let c={x:e.x-u.x*8,y:e.y-u.y*8};
   if(this.owner(c.x,c.y)!==e.id)c={x:e.x,y:e.y};
   if(Math.abs(angleDelta(e.angle,Math.atan2(a.y-e.y,a.x-e.x)))>2.1)continue;
   if(!this.lineClear(e,a,e,29)||!this.lineClear(a,b,e,29)||!this.lineClear(b,c,e,29))continue;
   let score=0;
   for(let n=1;n<=7;n++){let f=n/8,p={x:(a.x+b.x)*f/2+e.x*(1-f),y:(a.y+b.y)*f/2+e.y*(1-f)};const owner=this.owner(p.x,p.y);score+=owner===e.id?-4:owner?14:10;}
   for(const other of enemies){let d=Math.min(distance(other,a),distance(other,b));score-=Math.max(0,260-d)*(harder?.6:.35);}
   score-=far*.045;score+=this.random()*12;
   if(score>bestScore){bestScore=score;best=[a,b,c];}
  }
  if(best){e.plan=best;e.state='expand';e.planAt=this.time;return;}
  // Reposition through owned land when there is no safe expansion in front.
  let target=null,bestDist=0;
  for(let a=0;a<TAU;a+=.35)for(let d=40;d<=130;d+=24){let p={x:e.x+Math.cos(a)*d,y:e.y+Math.sin(a)*d};if(this.owner(p.x,p.y)===e.id&&this.lineClear(e,p,e,24)){let score=d-Math.abs(angleDelta(e.angle,a))*30;if(score>bestDist){bestDist=score;target=p;}}}
  e.plan=target?[target]:this.findHome(e);e.planAt=this.time;
 }
 think(e){
  while(e.plan.length&&distance(e,e.plan[0])<30)e.plan.shift();
  if(this.time>=e.thinkAt){
   const hard=this.options.difficulty==='hard',easy=this.options.difficulty==='easy';e.thinkAt=this.time+(hard?.18:easy?.45:.28);
   let emergency=false;
   if(e.outside){
    for(const o of this.entities){if(!o.alive||o.id===e.id||distance(e,o)>(hard?500:350))continue;
     for(let j=0;j<e.trail.length-7;j+=5)if(distance(o,e.trail[j])<(hard?115:easy?65:90)){emergency=true;break;}
     if(emergency)break;
    }
    if(this.time-e.outAt>9)emergency=true;
   }
   if(!this.valid(e.x+Math.cos(e.angle)*48,e.y+Math.sin(e.angle)*48,18))emergency=true;
   if(emergency&&e.state!=='return'){e.plan=this.findHome(e);e.state='return';e.planAt=this.time;}
   else if(!emergency&&e.state!=='return'&&!easy){
    let target=null,score=0;
    for(const o of this.entities){
     if(!o.alive||o.id===e.id||!o.outside||distance(e,o)>(hard?500:360))continue;
     let homeDistance=Infinity;
     for(let j=0;j<o.trail.length;j+=6){let p=o.trail[j],d=distance(e,p);if(d>(hard?245:175)||d<12)continue;
      if(Math.abs(angleDelta(e.angle,Math.atan2(p.y-e.y,p.x-e.x)))>1.65||!this.lineClear(e,p,e,19))continue;
      if(homeDistance===Infinity){for(let r=16;r<350;r+=24){let got=false;for(let a=0;a<TAU;a+=.6)if(this.owner(o.x+Math.cos(a)*r,o.y+Math.sin(a)*r)===o.id){homeDistance=r;got=true;break;}if(got)break;}if(homeDistance===Infinity)homeDistance=360;}
      let s=homeDistance-d-(hard?20:55);if(s>score){score=s;target={x:p.x,y:p.y};}
     }
    }
    if(target){e.plan=[target];e.state='attack';e.attackUntil=this.time+2.4;e.planAt=this.time;}
   }
   if(e.state==='attack'&&this.time>e.attackUntil){e.plan=e.outside?this.findHome(e):[];e.state=e.outside?'return':'expand';}
   if(!e.plan.length||this.time-e.planAt>13){
    if(e.outside){e.plan=this.findHome(e);e.state='return';e.planAt=this.time;}
    else this.makeLoop(e);
   }
  }
  if(e.plan.length)e.targetAngle=Math.atan2(e.plan[0].y-e.y,e.plan[0].x-e.x);
 }
 ranking(){return this.entities.filter(e=>e.alive).sort((a,b)=>this.counts[b.id]-this.counts[a.id]);}
 drain(){return this.events.splice(0);}
}

