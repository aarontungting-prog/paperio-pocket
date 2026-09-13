import test from 'node:test';
import assert from 'node:assert/strict';
import {Game,GRID,CELL} from '../dist/engine.mjs';
import {SKINS} from '../dist/catalog.mjs';

function arena(){const g=new Game({map:'square',respawn:false});g.entities=[g.player];g.grid.fill(0);g.trails.fill(0);g.mask.fill(0);g.counts.fill(0);g.total=0;for(let y=10;y<=245;y++)for(let x=10;x<=245;x++){g.mask[y*GRID+x]=1;g.total++;}g.counts[0]=g.total;return g;}
const rect=(g,id,x0,y0,x1,y1)=>{for(let y=y0;y<=y1;y++)for(let x=x0;x<=x1;x++)g.assign(y*GRID+x,id);};
function trace(g,e,points){e.trailCells=[];e.trail=[];e.outside=true;for(let j=1;j<points.length;j++){const a=points[j-1],b=points[j],n=Math.max(Math.abs(a[0]-b[0]),Math.abs(a[1]-b[1]));for(let k=0;k<=n;k++){const x=Math.round(a[0]+(b[0]-a[0])*k/n),y=Math.round(a[1]+(b[1]-a[1])*k/n),i=y*GRID+x;g.trails[i]=e.id;e.trailCells.push(i);e.trail.push({x:(x+.5)*CELL,y:(y+.5)*CELL});}}}
test('a coast-to-coast owned strip must not award either half of the map',()=>{
 const g=arena(),p=g.player;rect(g,1,126,10,129,245);const before=g.counts[1];
 trace(g,p,[[129,100],[139,100],[139,110],[129,110]]);g.capture(p);
 assert.equal(g.grid[105*GRID+135],1,'actual small closed loop fills');
 assert.equal(g.grid[128*GRID+60],0,'left exterior remains neutral');assert.equal(g.grid[128*GRID+200],0,'right exterior remains neutral');
 assert.ok(g.counts[1]-before<150,'only the small loop is awarded');
});
test('joining disconnected inherited bases leaves every coastal region unclaimed',()=>{
 const g=arena(),p=g.player;rect(g,1,10,30,15,245);rect(g,1,240,30,245,245);
 const before=g.counts[1];trace(g,p,[[15,128],[240,128]]);g.capture(p);
 assert.equal(g.grid[60*GRID+128],0);assert.equal(g.grid[200*GRID+128],0);assert.ok(g.counts[1]-before<230);
});
test('unrelated holes in inherited territory are not filled by a later small loop',()=>{
 const g=arena(),p=g.player;rect(g,1,50,50,70,50);rect(g,1,50,70,70,70);rect(g,1,50,50,50,70);rect(g,1,70,50,70,70);
 rect(g,1,100,100,110,110);trace(g,p,[[105,100],[105,90],[115,90],[115,105],[110,105]]);g.capture(p);
 assert.equal(g.grid[60*GRID+60],0);assert.equal(g.grid[95*GRID+110],1);
});
test('elimination transfers completed land only and clears the victims exposed path',()=>{
 const g=arena(),p=g.player;rect(g,1,40,40,50,50);rect(g,2,180,180,190,190);
 const rival={id:2,alive:true,skin:SKINS[1],name:'對手',trail:[],trailCells:[]};g.entities.push(rival);
 trace(g,rival,[[185,180],[185,100],[100,100],[100,180]]);const exposed=120*GRID+185;g.kill(rival,p);
 assert.equal(g.grid[185*GRID+185],1);assert.equal(g.grid[exposed],0);assert.equal(g.trails[exposed],0);assert.equal(g.grid[140*GRID+140],0);assert.equal(g.counts[2],0);
});
test('same-tick inheritance cannot leave a phantom trail on newly owned land',()=>{
 const g=arena(),p=g.player;rect(g,1,40,40,50,50);rect(g,2,100,100,110,110);
 p.x=105.5*CELL;p.y=105.5*CELL;p.angle=p.targetAngle=0;
 const i=g.index(p.x,p.y),rival={id:2,alive:true,skin:SKINS[1],name:'對手',trail:[],trailCells:[i]};g.entities.push(rival);g.trails[i]=2;
 g.started=true;g.tick(1/60);assert.equal(g.grid[i],1);assert.equal(p.outside,false);assert.equal(g.trails[i],0);
});
