import fs from "node:fs";
import ts from "typescript";
import {g} from "./balance.mjs";
const js=ts.transpileModule(fs.readFileSync("src/game/environment.ts","utf8"),{compilerOptions:{module:ts.ModuleKind.ESNext,target:ts.ScriptTarget.ES2022}}).outputText;
const e=await import("data:text/javascript;base64,"+Buffer.from(js).toString("base64"));
const distance=(a,b)=>Math.hypot(a.x-b.x,a.y-b.y);
function play(id,seed){
 let s=g.newMetro(seed,id),actions=0,maxQueue=0;
 const ports=id=>s.cables.filter(c=>c.stops.includes(id)).length;
 const tryLink=(a,b)=>{const kind=distance(s.nodes[a],s.nodes[b])>260?1:0;let next=g.connectCable(s,kind,a,b);if(next===s)next=g.connectCable(s,0,a,b);if(next===s)return false;s=next;actions++;return true;};
 function build(){
  if(!s.nodes.some(n=>g.isTransit(n.shape))){
   const positions=[];for(let x=100;x<=400;x+=50)for(let y=150;y<=500;y+=50){const p={x,y,shape:3};if(!g.routerError(s,x,y)&&s.nodes.slice(0,3).every(n=>!e.linkTerrainError(s,n,p)))positions.push(p);}
   positions.sort((a,b)=>s.nodes.slice(0,3).reduce((v,n)=>v+distance(a,n)-distance(b,n),0));
   if(positions[0]){s=g.placeRouter(s,positions[0].x,positions[0].y);actions++;}
  }
  for(let target=0;target<s.nodes.length;target++){
   if(g.isTransit(s.nodes[target].shape)||ports(target))continue;
   const points=[];
   for(let n=0;n<s.nodes.length;n++)if(g.isTransit(s.nodes[n].shape)&&ports(n)<g.nodePorts(s.nodes[n]))points.push({...s.nodes[n],id:n,existing:true});
   if(!points.length)continue;
   const starts=points.length;
   for(let x=50;x<1000;x+=100)for(let y=50;y<1200;y+=100)if(!g.routerError(s,x,y))points.push({x,y,shape:3});
   for(const x of [370,630])for(const y of [250,900])if(!g.routerError(s,x,y))points.push({x,y,shape:3});
   const end=points.length;points.push({...s.nodes[target],id:target,existing:true});
   const dist=points.map((_,i)=>i<starts?0:Infinity),prev=points.map(()=>-1),seen=new Set();
   while(seen.size<points.length){let a=-1;for(let i=0;i<points.length;i++)if(!seen.has(i)&&(a<0||dist[i]<dist[a]))a=i;if(a<0||!Number.isFinite(dist[a])||a===end)break;seen.add(a);
    for(let b=starts;b<points.length;b++){
     if(seen.has(b)||distance(points[a],points[b])<80||e.linkTerrainError(s,points[a],points[b]))continue;
     const d=dist[a]+(b===end?0:150)+100+distance(points[a],points[b])*.15;
     if(d<dist[b]){dist[b]=d;prev[b]=a;}
    }
   }
   if(!Number.isFinite(dist[end]))continue;
   const path=[];for(let at=end;at>=0;at=prev[at])path.unshift(at);
   // Validate the complete planned route before spending on it.
   let proposal=s,from=points[path[0]].id,ok=true;
   for(const index of path.slice(1)){
    const p=points[index];let to=p.id;
    if(index!==end){const next=g.placeRouter(proposal,p.x,p.y);if(next===proposal){ok=false;break;}proposal=next;to=proposal.nodes.length-1;}
    const kind=distance(proposal.nodes[from],proposal.nodes[to])>260?1:0;
    let next=g.connectCable(proposal,kind,from,to);if(next===proposal)next=g.connectCable(proposal,0,from,to);
    if(next===proposal){ok=false;break;}proposal=next;from=to;
   }
   if(ok){s=proposal;actions+=path.length-1;}
  }
  for(const c of [...s.cables]){
   if(s.gold>450&&c.stops.every(id=>g.isTransit(s.nodes[id].shape))&&c.stops.some(id=>s.queues[id].length>10)&&s.cables.filter(other=>other.stops.every(id=>c.stops.includes(id))).length<2){s=g.connectCable(s,1,...c.stops);}

   if(c.kind!==2&&s.gold>600&&c.stops.some(id=>s.queues[id].length>=5))s=g.changeCable(s,c.id,distance(s.nodes[c.stops[0]],s.nodes[c.stops[1]])>300?1:2);
  }
 }
 while(s.time<900&&!['over','complete'].includes(s.phase)){
  if(s.phase==='reward'){
   if(s.gold>700){const keys=g.monthlyItems(s),target=s.nodes.findIndex(n=>g.itemSlots(n)>(n.items?.length??0)&&!g.hasItem(n,'bandwidth'));
    const needsBuffer=s.nodes.some((n,i)=>g.itemSlots(n)>(n.items?.length??0)&&!g.hasItem(n,'buffer')&&s.queues[i].length>10);
    if(needsBuffer&&keys.includes('buffer'))s=g.buyItem(s,'buffer');
    else if(target>=0&&keys.includes('bandwidth'))s=g.buyItem(s,'bandwidth');
    else if(keys.includes('buffer'))s=g.buyItem(s,'buffer');
   }
   s=g.reward(s);
   for(const key of [...s.inventory]){const ids=s.nodes.map((n,i)=>({n,i})).filter(({n})=>g.itemAllowed(n,key)&&g.itemSlots(n)>(n.items?.length??0)&&!g.hasItem(n,key)).sort((a,b)=>s.queues[b.i].length-s.queues[a.i].length);if(ids[0])s=g.installItem(s,ids[0].i,key);}
  }
  if(Math.round(s.time*10)%50===0)build();
  s=g.metroTick(s);maxQueue=Math.max(maxQueue,...s.queues.map(q=>q.length));
 }
 return {bottleneck:s.phase==="over"?s.nodes.map((n,i)=>({n,queue:s.queues[i].length,overload:s.overload[i],ports:ports(i),routes:s.queues[i].map(p=>g.routeCable(s,i,p.service))})).filter(n=>n.overload>=25):undefined,id,phase:s.phase,month:s.month,time:s.time,delivered:s.delivered,gold:s.gold,devices:s.nodes.length,actions,maxQueue};
}
const results=[];for(const [id,seed] of [["neighborhood",987],["campus",123],["harbor",987],["downtown",2026],["highlands",45678],["metropolis",987]]){const r=play(id,seed);results.push(r);console.log(r);}
fs.writeFileSync("docs/balance/environment-routes.json",JSON.stringify(results,null,2));
