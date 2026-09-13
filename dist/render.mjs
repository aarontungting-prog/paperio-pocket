import {GRID,WORLD,CELL} from './engine.mjs';
import {mapPolygon,getSkin} from './catalog.mjs';
const TAU=Math.PI*2;
export const mix=(hex,b='#ffffff',amount=.4)=>{let a=parseInt(hex.slice(1),16),c=parseInt(b.slice(1),16);return '#'+[16,8,0].map(s=>Math.round(((a>>s)&255)*(1-amount)+((c>>s)&255)*amount).toString(16).padStart(2,'0')).join('')};
const circle=(c,x,y,r,fill,stroke,width=2)=>{c.beginPath();c.arc(x,y,r,0,TAU);if(fill){c.fillStyle=fill;c.fill();}if(stroke){c.strokeStyle=stroke;c.lineWidth=width;c.stroke();}};
const poly=(c,pts,fill,stroke,width=2)=>{c.beginPath();pts.forEach((p,i)=>i?c.lineTo(...p):c.moveTo(...p));c.closePath();if(fill){c.fillStyle=fill;c.fill();}if(stroke){c.strokeStyle=stroke;c.lineWidth=width;c.stroke();}};
export function star(c,x,y,r,fill,stroke){poly(c,Array.from({length:10},(_,i)=>{let a=i*Math.PI/5-Math.PI/2,k=i%2?r*.46:r;return[x+Math.cos(a)*k,y+Math.sin(a)*k]}),fill,stroke,1.8)}
function eyes(c,r=1){
 for(const x of [-9,9]){c.save();c.scale(r,r);c.beginPath();c.ellipse(x,-1,5.7,8,0,0,TAU);c.fillStyle='#fff';c.fill();c.beginPath();c.ellipse(x+1,1,2.7,4,0,0,TAU);c.fillStyle='#142866';c.fill();c.restore();}
}
export function drawHead(c,skin,size=20,angle=0,hat='none',time=0,shadow=true){
 const s=size/28;c.save();c.scale(s,s);
 if(shadow){c.save();c.translate(0,11);c.scale(1,.4);circle(c,0,0,29,'#173a5224');c.restore();}
 const type=skin.type,col=skin.color,rim=skin.rim;
 c.save();
 if(['melon','pizza'].includes(type)){
  c.rotate(angle);const shape=()=>{c.beginPath();c.moveTo(32,0);c.lineTo(-20,-26);c.quadraticCurveTo(-35,0,-20,26);c.closePath();};
  c.save();c.translate(0,12);shape();c.fillStyle=mix(col,'#000000',.32);c.fill();c.strokeStyle=mix(col,'#000000',.4);c.lineWidth=2;c.stroke();c.beginPath();c.moveTo(-20,-26);c.quadraticCurveTo(-35,0,-20,26);c.strokeStyle=mix(rim,'#000000',.12);c.lineWidth=7;c.stroke();c.restore();
  shape();c.fillStyle=col;c.fill();c.strokeStyle=mix(col,'#000000',.15);c.lineWidth=1.5;c.stroke();
  c.beginPath();c.moveTo(-18,-23);c.quadraticCurveTo(-31,0,-18,23);c.strokeStyle=type==='melon'?'#90f31d':'#e9a34e';c.lineWidth=7;c.stroke();
  if(type==='melon')for(const [x,y] of [[-10,-12],[-11,10],[0,-5],[8,5]])poly(c,[[x+3,y],[x-2,y-2],[x-2,y+4]],'#4a174c');
  else for(const [x,y] of [[-9,-13],[-12,10],[5,0]])circle(c,x,y,5,'#f6514f','#b72f34',1);
  c.strokeStyle='#ffffff70';c.lineWidth=2;c.beginPath();c.moveTo(-15,-22);c.lineTo(27,0);c.stroke();
 }else if(['cube','cat','fox','panda','pig','robot','sushi'].includes(type)){
  c.save();c.rotate(Math.sin(angle)*.1);
  c.beginPath();c.roundRect(-26,-20,52,50,12);c.fillStyle=mix(col,'#000000',.27);c.fill();
  c.beginPath();c.roundRect(-26,-27,52,49,12);c.fillStyle=col;c.fill();c.strokeStyle=rim;c.lineWidth=2;c.stroke();
  c.beginPath();c.roundRect(-22,-23,44,9,6);c.fillStyle='#ffffff38';c.fill();
  if(type==='cat'||type==='fox'){poly(c,[[-25,-14],[-24,-38],[-5,-23]],col,rim);poly(c,[[25,-14],[24,-38],[5,-23]],col,rim);poly(c,[[-22,-22],[-22,-32],[-12,-23]],'#ffcebc');poly(c,[[22,-22],[22,-32],[12,-23]],'#ffcebc');}
  if(type==='panda'){circle(c,-20,-23,10,'#334457');circle(c,20,-23,10,'#334457');c.beginPath();c.roundRect(-25,-23,50,45,13);c.fillStyle='#fff';c.fill();circle(c,-10,-4,10,'#334457');circle(c,10,-4,10,'#334457');}
  if(type==='pig'){circle(c,-19,-23,9,'#fdaac4',rim);circle(c,19,-23,9,'#fdaac4',rim);}
  if(type==='sushi'){
   c.beginPath();c.roundRect(-25,-6,50,30,10);c.fillStyle='#fff6e9';c.fill();c.beginPath();c.roundRect(-26,-25,52,32,10);c.fillStyle='#ff936f';c.fill();
   c.strokeStyle='#ffd1a9';c.lineWidth=4;for(let x=-20;x<25;x+=13){c.beginPath();c.moveTo(x,-22);c.lineTo(x+12,3);c.stroke();}c.fillStyle='#254735';c.fillRect(-7,-26,14,50);
  }else if(type==='robot'){c.strokeStyle='#415d8b';c.lineWidth=4;c.beginPath();c.moveTo(0,-26);c.lineTo(0,-36);c.stroke();circle(c,0,-37,5,'#ff787e');c.beginPath();c.roundRect(-20,-13,40,25,8);c.fillStyle='#294759';c.fill();circle(c,-10,-1,5,'#79fff0');circle(c,10,-1,5,'#79fff0');}
  else{
   eyes(c);if(type==='pig'){c.beginPath();c.ellipse(0,13,12,8,0,0,TAU);c.fillStyle='#df648c';c.fill();circle(c,-4,13,2.2,'#872d64');circle(c,4,13,2.2,'#872d64');}
   else if(['cat','panda','fox'].includes(type)){poly(c,[[-4,10],[4,10],[0,14]],'#57344d');if(type==='cat'){c.strokeStyle='#9f542d';c.lineWidth=2;for(const v of [-1,1]){c.beginPath();c.moveTo(v*14,11);c.lineTo(v*23,8);c.moveTo(v*14,15);c.lineTo(v*23,17);c.stroke();}}}
   else{c.beginPath();c.arc(0,9,5,0,Math.PI);c.strokeStyle=rim;c.lineWidth=2;c.stroke();}
  }c.restore();
 }else{
  circle(c,0,5,28,mix(col,'#000000',.28));circle(c,0,-2,28,col,rim,2);
  if(type==='citrus'||type==='kiwi'){
   circle(c,0,-2,23,type==='kiwi'?'#b6ea71':mix(col,'#ffffff',.15));circle(c,0,-2,5,'#fff6b7');
   for(let i=0;i<9;i++){let a=i/9*TAU;if(type==='kiwi'){c.save();c.translate(Math.cos(a)*12,Math.sin(a)*12-2);c.rotate(a);c.beginPath();c.ellipse(0,0,3,1.4,0,0,TAU);c.fillStyle='#514233';c.fill();c.restore();}else{c.beginPath();c.moveTo(Math.cos(a)*7,Math.sin(a)*7-2);c.lineTo(Math.cos(a)*22,Math.sin(a)*22-2);c.strokeStyle='#fff7c4';c.lineWidth=2;c.stroke();}}
  }else if(type==='donut'){
   circle(c,0,-2,24,'#ffa8d1');circle(c,0,-2,9,'#bb6e4b');circle(c,0,0,6,'#e2fff5');
   for(let i=0;i<15;i++){let a=i*.93,r=13+(i%3)*4;c.strokeStyle=['#fff6b3','#63dbed','#f35ba8'][i%3];c.lineWidth=3;c.beginPath();c.moveTo(Math.cos(a)*r,Math.sin(a)*r-2);c.lineTo(Math.cos(a)*r+4,Math.sin(a)*r+1);c.stroke();}
  }else if(type==='avocado'){circle(c,0,-2,24,'#dcf294');circle(c,0,4,13,'#ae6941','#805238',2);circle(c,-4,0,4,'#c58550');}
  else if(type==='pineapple'||type==='strawberry'){
   if(type==='pineapple'){c.save();c.beginPath();c.arc(0,-2,25,0,TAU);c.clip();c.strokeStyle='#ce922b';c.lineWidth=2;for(let i=-50;i<60;i+=13){c.beginPath();c.moveTo(i,-35);c.lineTo(i+70,35);c.moveTo(i,35);c.lineTo(i+70,-35);c.stroke();}c.restore();}
   else for(const [x,y] of [[-12,-10],[12,-10],[0,2],[-12,12],[12,12]]){c.beginPath();c.ellipse(x,y,1.5,3,0,0,TAU);c.fillStyle='#ffec8b';c.fill();}
   for(let i=-1;i<2;i++)poly(c,[[i*7,-20],[i*16,-43-i*i*4],[i*7+9,-25]],'#53bd52','#279446',1);
  }else if(type==='bee'){c.save();c.beginPath();c.arc(0,-2,27,0,TAU);c.clip();c.fillStyle='#5f473a';c.fillRect(-16,-30,10,60);c.fillRect(5,-30,10,60);c.restore();c.save();c.globalAlpha=.8;c.beginPath();c.ellipse(-14,-25,13,8,-.8,0,TAU);c.ellipse(14,-25,13,8,.8,0,TAU);c.fillStyle='#e3fcff';c.fill();c.restore();eyes(c,.8);}
  else if(type==='ladybug'){c.strokeStyle='#432e4c';c.lineWidth=2;c.beginPath();c.moveTo(0,-27);c.lineTo(0,26);c.stroke();for(const [x,y] of [[-13,-13],[13,-13],[-14,7],[14,7]])circle(c,x,y,6,'#412e4b');circle(c,0,-24,12,'#412e4b');}
  else if(type==='ghost'){c.beginPath();c.roundRect(-23,-28,46,48,[23,23,0,0]);c.fillStyle='#fff';c.fill();poly(c,[[-23,20],[-15,14],[-7,21],[0,14],[9,21],[16,14],[23,20]],'#fff');eyes(c);}
  else if(type==='basketball'){c.save();c.beginPath();c.arc(0,-2,27,0,TAU);c.clip();c.strokeStyle='#793c28';c.lineWidth=2;for(const r of [0,Math.PI/2]){c.save();c.rotate(r);c.beginPath();c.moveTo(-28,0);c.lineTo(28,0);c.stroke();c.beginPath();c.ellipse(-28,0,18,34,0,0,TAU);c.ellipse(28,0,18,34,0,0,TAU);c.stroke();c.restore();}c.restore();}
  else if(type==='earth'){poly(c,[[-21,-19],[-4,-25],[1,-12],[-9,-7],[-2,0],[-9,15],[-17,9],[-16,-3],[-24,-8]],'#86d75c');poly(c,[[12,-21],[22,-12],[15,-2],[24,9],[12,18],[4,9],[8,-2]],'#9be573');}
  else if(type==='galaxy'){c.strokeStyle='#d39eff';c.lineWidth=5;c.beginPath();c.ellipse(0,0,32,10,-.5,0,TAU);c.stroke();for(const [x,y] of [[-9,-11],[13,9],[8,-17]])star(c,x,y,4,'#fff6d5');}
  c.beginPath();c.ellipse(-9,-16,9,4,-.5,0,TAU);c.fillStyle='#ffffff45';c.fill();
 }
 c.restore();drawHat(c,hat);c.restore();
}
export function drawHat(c,hat){
 if(hat==='none')return;c.save();c.translate(0,-28);
 if(hat==='crown'){poly(c,[[-20,1],[-24,-17],[-11,-10],[0,-23],[10,-10],[23,-17],[20,1]],'#ffe546','#a97d1a',2);c.fillStyle='#f6b923';c.fillRect(-20,0,40,6);for(const x of [-22,0,22])circle(c,x,x===0?-23:-17,3.5,'#fff197','#a97d1a',1);circle(c,0,-6,3,'#f979bd');}
 else if(hat==='party'){poly(c,[[-15,2],[0,-35],[15,2]],'#b789fb','#7250b6',2);circle(c,0,-35,5,'#fff06b');for(const [x,y] of [[-3,-20],[5,-7],[-6,-4]])circle(c,x,y,3,'#ffed5b');}
 else if(hat==='sprout'){c.strokeStyle='#429644';c.lineWidth=4;c.beginPath();c.moveTo(0,3);c.quadraticCurveTo(-5,-12,0,-18);c.stroke();c.beginPath();c.ellipse(-9,-17,12,6,.5,0,TAU);c.ellipse(9,-22,12,6,-.5,0,TAU);c.fillStyle='#7dea67';c.fill();}
 else if(hat==='halo'){c.strokeStyle='#ffdf4e';c.lineWidth=5;c.beginPath();c.ellipse(0,-15,23,7,0,0,TAU);c.stroke();c.strokeStyle='#fff2ac';c.lineWidth=1.5;c.stroke();}
 else if(hat==='bow'){poly(c,[[0,-6],[-21,-19],[-24,3]],'#ff6cad','#a63470',2);poly(c,[[0,-6],[21,-19],[24,3]],'#ff6cad','#a63470',2);circle(c,0,-6,6,'#f64a98','#a63470',2);}
 else if(hat==='cap'){c.beginPath();c.arc(0,0,22,Math.PI,TAU);c.fillStyle='#448cf4';c.fill();c.beginPath();c.ellipse(12,0,27,6,.05,0,TAU);c.fillStyle='#2567cf';c.fill();}
 c.restore();
}
function smoothPath(points){
 const p=new Path2D();if(!points.length)return p;
 const n=points.length;let prev=points[n-1],curr=points[0];p.moveTo((prev[0]+curr[0])/2,(prev[1]+curr[1])/2);
 for(let i=0;i<n;i++){curr=points[i];let next=points[(i+1)%n];p.quadraticCurveTo(curr[0],curr[1],(curr[0]+next[0])/2,(curr[1]+next[1])/2);}p.closePath();return p;
}
function simplifyBoundary(points,tolerance=2.5){
 if(points.length<8)return points;
 const weights=[1,2,3,4,3,2,1];points=points.map((_,i)=>{let x=0,y=0;for(let j=-3;j<=3;j++){let p=points[(i+j+points.length)%points.length],w=weights[j+3];x+=p[0]*w;y+=p[1]*w;}return [x/16,y/16];});
 function rdp(p){if(p.length<3)return p;const a=p[0],b=p[p.length-1],dx=b[0]-a[0],dy=b[1]-a[1],den=dx*dx+dy*dy;let index=0,max=tolerance*tolerance;
  for(let i=1;i<p.length-1;i++){const q=p[i],t=den?Math.max(0,Math.min(1,((q[0]-a[0])*dx+(q[1]-a[1])*dy)/den)):0,d=(q[0]-a[0]-t*dx)**2+(q[1]-a[1]-t*dy)**2;if(d>max){max=d;index=i;}}
  return index?[...rdp(p.slice(0,index+1)).slice(0,-1),...rdp(p.slice(index))]:[a,b];
 }
 let far=1,dist=0;for(let i=1;i<points.length;i++){let d=(points[i][0]-points[0][0])**2+(points[i][1]-points[0][1])**2;if(d>dist){far=i;dist=d;}}
 return [...rdp(points.slice(0,far+1)).slice(0,-1),...rdp([...points.slice(far),points[0]]).slice(0,-1)];
}
export function polygonPath(poly,w=WORLD,h=w){return smoothPath(poly.map(p=>[p[0]*w,p[1]*h]));}
function makeTerritories(game,ids){
 const edgeMaps=new Map([...ids].filter(id=>id>0).map(id=>[id,new Map()]));const stride=GRID+1;
 const add=(m,a,b)=>{let v=m.get(a);if(v)v.push(b);else m.set(a,[b]);};
 for(let y=0;y<GRID;y++)for(let x=0;x<GRID;x++){
  const i=y*GRID+x,id=game.grid[i],m=edgeMaps.get(id);if(!m)continue;const a=y*stride+x,b=a+1,d=a+stride,c=d+1;
  if(y===0||game.grid[i-GRID]!==id)add(m,a,b);
  if(x===GRID-1||game.grid[i+1]!==id)add(m,b,c);
  if(y===GRID-1||game.grid[i+GRID]!==id)add(m,c,d);
  if(x===0||game.grid[i-1]!==id)add(m,d,a);
 }
 const result=new Map();
 for(const [id,m] of edgeMaps){
  const path=new Path2D();let bounds={minX:WORLD,maxX:0,minY:WORLD,maxY:0};
  while(m.size){let first=m.keys().next().value,key=first,pts=[],limit=0;
   do{const x=(key%stride)*CELL,y=((key/stride)|0)*CELL;pts.push([x,y]);bounds.minX=Math.min(bounds.minX,x);bounds.maxX=Math.max(bounds.maxX,x);bounds.minY=Math.min(bounds.minY,y);bounds.maxY=Math.max(bounds.maxY,y);
    const outs=m.get(key);if(!outs?.length)break;let next=outs.pop();if(!outs.length)m.delete(key);key=next;
   }while(key!==first&&++limit<100000);
   if(pts.length>2){let simplified=simplifyBoundary(pts);path.addPath(smoothPath(simplified.length>2?simplified:pts));}
  }result.set(id,{path,bounds});
 }return result;
}
const patterns=new Map();
function patternFor(s){
 if(patterns.has(s.id))return patterns.get(s.id);let cn=document.createElement('canvas');cn.width=100;cn.height=100;let c=cn.getContext('2d');c.globalAlpha=.18;c.fillStyle=mix(s.color,'#000000',.35);c.strokeStyle=c.fillStyle;c.lineWidth=2;
 for(const [x,y] of [[22,25],[70,72]]){
  if(s.pattern==='seeds'){c.beginPath();c.ellipse(x,y,4,7,-.35,0,TAU);c.fill();c.globalAlpha=.15;c.beginPath();c.ellipse(x-1,y-2,2,3,-.35,0,TAU);c.fillStyle='#fff';c.fill();c.fillStyle=mix(s.color,'#000000',.35);}
  else if(['stars','sparkles'].includes(s.pattern))star(c,x,y,6,'#ffffff');
  else if(s.pattern==='diamond')poly(c,[[x,y-7],[x+5,y],[x,y+7],[x-5,y]],null,c.strokeStyle,1.5);
  else if(s.pattern==='triangles')poly(c,[[x-4,y+4],[x,y-5],[x+5,y+4]],c.fillStyle);
  else if(s.pattern==='stripes'||s.pattern==='sprinkles'||s.pattern==='lines'){c.lineWidth=3;c.beginPath();c.moveTo(x-4,y-4);c.lineTo(x+5,y+5);c.stroke();}
  else{c.beginPath();c.arc(x,y,s.pattern==='bubbles'?6:4,0,TAU);s.pattern==='bubbles'?c.stroke():c.fill();}
 }
 const pattern=c.createPattern(cn,'repeat');patterns.set(s.id,pattern);return pattern;
}
export class Renderer{
 constructor(canvas,mini){this.canvas=canvas;this.ctx=canvas.getContext('2d',{alpha:false});this.mini=mini;this.mctx=mini.getContext('2d');this.paths=new Map();this.camera={x:WORLD/2,y:WORLD/2};this.particles=[];this.lastMini=-1;this.game=null;this.resize();}
 resize(){const dpr=Math.min(window.devicePixelRatio||1,2);this.width=this.canvas.clientWidth||window.innerWidth;this.height=this.canvas.clientHeight||window.innerHeight;this.dpr=dpr;this.canvas.width=Math.round(this.width*dpr);this.canvas.height=Math.round(this.height*dpr);this.mini.width=280;this.mini.height=220;this.zoom=Math.min(1.1,Math.max(.75,this.width/430));}
 bind(game){this.game=game;this.paths.clear();this.camera={x:game.player.x,y:game.player.y};this.mapPath=polygonPath(game.polygon);this.lastMini=-1;this.particles=[];}
 screenPlayer(){return {x:this.width/2+(this.game.player.x-this.camera.x)*this.zoom,y:this.height*.52+(this.game.player.y-this.camera.y)*this.zoom};}
 burst(x,y,color,count=25){for(let i=0;i<count;i++){let a=Math.random()*TAU,s=35+Math.random()*110;this.particles.push({x,y,vx:Math.cos(a)*s,vy:Math.sin(a)*s,life:1,color,r:2+Math.random()*4});}}
 render(dt=0,time=0){
  const g=this.game;if(!g)return;const c=this.ctx,p=g.player;
  const follow=1-Math.exp(-dt*12);this.camera.x+=(p.x-this.camera.x)*follow;this.camera.y+=(p.y-this.camera.y)*follow;
  c.setTransform(this.dpr,0,0,this.dpr,0,0);c.fillStyle='#a6d7d5';c.fillRect(0,0,this.width,this.height);
  c.translate(this.width/2,this.height*.52);c.scale(this.zoom,this.zoom);c.translate(-this.camera.x,-this.camera.y);
  c.save();c.translate(0,8);c.fillStyle='#72b2b8';c.fill(this.mapPath);c.restore();c.fillStyle='#e8fff5';c.fill(this.mapPath);c.strokeStyle='#75c4c5';c.lineWidth=5;c.stroke(this.mapPath);
  if(g.dirty.size){let ids=new Set(g.dirty);g.dirty.clear();for(const [id,path] of makeTerritories(g,ids))this.paths.set(id,path);}
  const vx=this.camera.x-this.width/(2*this.zoom)-60,vy=this.camera.y-this.height*.52/this.zoom-60,vw=this.width/this.zoom+120,vh=this.height/this.zoom+120;
  for(const e of g.entities){
   if(!e.alive)continue;let entry=this.paths.get(e.id);if(!entry)continue;let {path,bounds:b}=entry;
   if(b.maxX<vx||b.minX>vx+vw||b.maxY<vy||b.minY>vy+vh)continue;
   c.save();c.translate(0,7);c.fillStyle='#32584c32';c.fill(path,'evenodd');c.restore();
   c.strokeStyle=e.skin.rim;c.lineWidth=6;c.lineJoin='round';c.stroke(path);c.fillStyle=e.skin.color;c.fill(path,'evenodd');
   c.save();c.clip(path,'evenodd');c.fillStyle=patternFor(e.skin);c.fillRect(b.minX,b.minY,b.maxX-b.minX,b.maxY-b.minY);c.restore();
   c.strokeStyle='#ffffff20';c.lineWidth=1.8;c.stroke(path);
  }
  for(const e of g.entities){
   if(!e.alive||!e.trail.length)continue;const trail=new Path2D();trail.moveTo(e.trail[0].x,e.trail[0].y);for(let i=1;i<e.trail.length;i++)trail.lineTo(e.trail[i].x,e.trail[i].y);trail.lineTo(e.x,e.y);
   c.lineCap='round';c.lineJoin='round';c.save();c.translate(0,4);c.strokeStyle='#3e56451c';c.lineWidth=20;c.stroke(trail);c.restore();
   c.strokeStyle=e.skin.rim;c.lineWidth=17;c.stroke(trail);c.strokeStyle=mix(e.skin.color,'#ffffff',.58);c.lineWidth=13;c.stroke(trail);c.strokeStyle='#ffffff75';c.lineWidth=2;c.stroke(trail);
   for(let i=Math.floor(time*4)%22;i<e.trail.length-8;i+=23){const pt=e.trail[i];star(c,pt.x,pt.y,2.6+Math.sin(time*5+i), '#ffffffbb');}
  }
  const leader=g.ranking()[0];
  for(const e of [...g.entities].sort((a,b)=>a.y-b.y)){
   if(!e.alive||e.x<vx-50||e.x>vx+vw+50||e.y<vy-50||e.y>vy+vh+50)continue;
   c.save();c.translate(e.x,e.y);drawHead(c,e.skin,18,e.angle,e.hat,time);c.restore();
   if(e!==g.player){c.textAlign='center';c.font='bold 12px Arial';c.strokeStyle='#ffffffdd';c.lineWidth=3;c.strokeText(e.name,e.x,e.y-31);c.fillStyle='#425776';c.fillText(e.name,e.x,e.y-31);}
   if(leader===e&&g.percent(e)>1){c.save();c.translate(e.x,e.y-42);c.scale(.35,.35);drawHat(c,'crown');c.restore();}
  }
  for(let i=this.particles.length-1;i>=0;i--){let p=this.particles[i];p.life-=dt;p.x+=p.vx*dt;p.y+=p.vy*dt;p.vy+=40*dt;if(p.life<=0){this.particles.splice(i,1);continue;}c.globalAlpha=p.life;c.fillStyle=p.color;c.fillRect(p.x,p.y,p.r,p.r);}c.globalAlpha=1;
  if(time-this.lastMini>.18){this.drawMini();this.lastMini=time;}
 }
 drawMini(){
  const g=this.game,c=this.mctx;c.setTransform(1,0,0,1,0,0);c.clearRect(0,0,280,220);
  let xs=g.polygon.map(p=>p[0]),ys=g.polygon.map(p=>p[1]);const minX=Math.min(...xs),maxX=Math.max(...xs),minY=Math.min(...ys),maxY=Math.max(...ys),scale=Math.min(250/(maxX-minX),185/(maxY-minY));
  c.translate((280-(maxX-minX)*scale)/2-minX*scale,(220-(maxY-minY)*scale)/2-minY*scale);c.scale(scale/WORLD,scale/WORLD);
  c.fillStyle='#edfff5ed';c.strokeStyle='#224998';c.lineWidth=3*WORLD/scale;c.fill(this.mapPath);c.stroke(this.mapPath);
  for(const e of g.entities)if(e.alive){const path=this.paths.get(e.id)?.path;if(path){c.fillStyle=e.skin.color;c.fill(path,'evenodd');}}
  for(const e of g.entities)if(e.alive){if(e.human){c.save();c.translate(e.x,e.y);c.rotate(e.angle);let r=7*WORLD/scale;poly(c,[[r,0],[-r,-r*.75],[-r*.55,0],[-r,r*.75]],'#fff','#173ca0',2*WORLD/scale);c.restore();}else circle(c,e.x,e.y,3.1*WORLD/scale,e.skin.color,'#22478d',WORLD/scale);}
 }
}
export function paintPreview(canvas,skin,map,hat,percent,time=0){
 const c=canvas.getContext('2d'),w=canvas.width,h=canvas.height;c.clearRect(0,0,w,h);
 const poly=mapPolygon(map),xs=poly.map(p=>p[0]),ys=poly.map(p=>p[1]),minX=Math.min(...xs),maxX=Math.max(...xs),minY=Math.min(...ys),maxY=Math.max(...ys);
 const sc=Math.min(w*.86/(maxX-minX),h*.60/(maxY-minY));
 c.save();c.translate((w-sc*(maxX+minX))/2,(h-sc*.68*(maxY+minY))/2+30);c.scale(sc,sc*.68);
 const path=polygonPath(poly,1);c.save();c.translate(0,.018);c.fillStyle='#1978b4';c.fill(path);c.restore();c.fillStyle='#fff';c.fill(path);
 c.save();c.clip(path);c.fillStyle=skin.rim;c.fillRect(minX-.01,minY-.01,(maxX-minX)*Math.max(.075,percent/100)+.012,maxY-minY+.02);c.fillStyle=skin.color;c.fillRect(minX-.01,minY-.01,(maxX-minX)*Math.max(.075,percent/100),maxY-minY+.02);c.restore();c.restore();
 c.save();c.translate(w/2,h/2+31);c.scale(1,.25);circle(c,0,0,w*.15,'#292e6140');c.restore();
 c.save();c.translate(w/2,h/2-35+Math.sin(time*2)*8);c.scale(1,.68);drawHead(c,skin,w*.12,-.45+Math.sin(time*.7)*.12,hat,time,false);c.restore();
}
