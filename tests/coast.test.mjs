import test from 'node:test';
import assert from 'node:assert/strict';
import {Game,WORLD,SPEED} from '../dist/engine.mjs';

for(const map of ['taiwan','usa'])test(`${map}: rounded coastline keeps moving without death, leaks or wall trapping`,()=>{
 const g=new Game({map,respawn:false});g.entities=[g.player];g.started=true;
 for(let i=0;i<g.grid.length;i++)if(g.mask[i])g.assign(i,1);
 const p=g.player,center={x:p.x,y:p.y};let boosts=0;
 for(let direction=0;direction<12;direction++){
  const a=direction*Math.PI/6;let d=0;while(g.movementValid(center.x+Math.cos(a)*(d+1),center.y+Math.sin(a)*(d+1),11))d++;
  p.x=center.x+Math.cos(a)*d;p.y=center.y+Math.sin(a)*d;p.angle=p.targetAngle=a;p.wallAngle=null;let length=0;
  for(let tick=0;tick<360;tick++){
   const before={x:p.x,y:p.y};g.tick(1/60);length+=Math.hypot(p.x-before.x,p.y-before.y);boosts+=p.wallBoost?1:0;
   assert.ok(g.movementValid(p.x,p.y),`${map} exits at direction ${direction}, tick ${tick}`);assert.ok(p.alive);assert.ok(p.x>=0&&p.x<WORLD);
  }
  assert.ok(length>SPEED*3,`${map} trapped at direction ${direction}: distance ${length}`);
 }
 assert.ok(boosts>100);
});
