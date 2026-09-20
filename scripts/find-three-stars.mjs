import { g } from './balance.mjs';
import fs from 'node:fs';
let best;
for (const kind of [0,1]) for(let x=150;x<=350;x+=25)for(let y=200;y<=350;y+=25){
 let s=g.newMetro(987,'neighborhood');if(g.routerError(s,x,y))continue;
 const actions=[];const act=(type,args,n)=>{if(n!==s){actions.push({time:s.time,type,args});s=n;}};
 act('place',[x,y,3],g.placeRouter(s,x,y));
 while(s.time<300&&!['complete','over'].includes(s.phase)){
  if(s.phase==='reward')act('reward',['continue'],g.reward(s));
  if(Math.round(s.time*10)%10===0)for(let i=0;i<s.nodes.length;i++)if(!g.isTransit(s.nodes[i].shape)&&!s.cables.some(c=>c.stops.includes(i)))act('connect',[kind,i,3],g.connectCable(s,kind,i,3));
  s=g.metroTick(s);
 }
 const r={x,y,kind,phase:s.phase,time:s.time,month:s.month,delivered:s.delivered,gold:s.gold,actions};
 if(s.phase==='complete'&&s.delivered>=75&&s.gold>=900&&(!best||s.time<best.time||(s.time===best.time&&s.gold>best.gold)))best=r;
}
console.log(best);if(best)fs.writeFileSync('docs/balance/level1-three-stars-plan.json',JSON.stringify(best,null,2));
