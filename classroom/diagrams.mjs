// SVG rendering code: MIT. Labels and educational relationships: CC BY 4.0.
import { escapeHtml as esc } from './markdown.mjs';
function lines(text,x,y,width=14) {
  const chars=Array.from(text), rows=[];
  for(let i=0;i<chars.length;i+=width) rows.push(chars.slice(i,i+width).join(''));
  return '<text x="'+x+'" y="'+y+'">'+rows.map((s,i)=>'<tspan x="'+x+'" dy="'+(i?22:0)+'">'+esc(s)+'</tspan>').join('')+'</text>';
}
const start = (width,height,title,description) => '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 '+width+' '+height+'" role="img" aria-labelledby="diagram-title diagram-description"><title id="diagram-title">'+esc(title)+'</title><desc id="diagram-description">'+esc(description)+'</desc><style>text{font:15px system-ui,sans-serif;fill:#203e35}.root text{font-weight:700}.branch text{font-size:14px}path{fill:none;stroke:#91ac9d;stroke-width:2}rect{fill:#f2f7f2;stroke:#c9d9cd;rx:12}.root rect{fill:#dcebdc;stroke:#51836a}.active rect{fill:#d6eecb;stroke:#1e6549;stroke-width:3}</style><rect width="100%" height="100%" fill="#fff" style="fill:#fff;stroke:none;rx:0"/>';
export function mindmapSvg(id,title,map) {
  let svg=start(1000,600,id+' '+title,map.branches.map(b=>b.title+': '+b.points.join('；')).join('。'));
  const positions=[[25,35],[585,35],[25,355],[585,355]];
  positions.forEach(([x,y])=>{svg+='<path d="M500 300 Q'+(x<100?350:650)+' '+(y<100?180:420)+' '+(x+195)+' '+(y+90)+'"/>';});
  svg+='<g class="root"><rect x="330" y="245" width="340" height="105"/>'+lines(id,350,276,24)+lines(map.question,350,305,18)+'</g>';
  map.branches.forEach((b,i)=>{const [x,y]=positions[i];svg+='<g class="branch"><rect x="'+x+'" y="'+y+'" width="390" height="175"/>'+lines((i+1)+'. '+b.title,x+18,y+29,24)+b.points.map((p,j)=>lines('• '+p,x+18,y+65+j*48,24)).join('')+'</g>';});
  return svg+'<text x="25" y="587" style="font-size:11px">Agent Engineering Lab · Xeehho · CC BY 4.0</text></svg>';
}
export function architectureSvg(view) {
  const height=Math.max(...view.nodes.map(n=>n.y))+145;
  const nodes=view.nodes.map(n=>({...n,x:30+(n.x-30)*1.28125}));
  let svg=start(1200,height,view.title,view.edges.map(([a,b,label])=>a+' → '+b+'：'+label).join('；')).replace('font:15px','font:18px');
  svg+='<defs><marker id="arrow" markerWidth="8" markerHeight="8" refX="7" refY="3" orient="auto"><path d="M0 0 L7 3 L0 6" style="stroke:#7b9987;fill:#7b9987"/></marker></defs>';
  for (const [a,b,label] of view.edges) {
    const from=nodes.find(n=>n.id===a),to=nodes.find(n=>n.id===b);
    const dx=to.x-from.x,dy=to.y-from.y;
    let x1=from.x+130,y1=from.y+40,x2=to.x+130,y2=to.y+40;
    if(Math.abs(dx)>Math.abs(dy)){x1+=dx>0?130:-130;x2+=dx>0?-130:130;}
    else {y1+=dy>0?40:-40;y2+=dy>0?-40:40;}
    let route='M'+x1+' '+y1+' L'+x2+' '+y2;
    let lx=(x1+x2)/2,ly=(y1+y2)/2-6;
    if(view.id==='request' && a==='task' && b==='context') {route='M980 115 L980 155 L160 155 L160 205';lx=570;ly=147;}
    if(view.id==='request' && a==='business' && b==='context') {route='M1110 755 L1170 755 L1170 825 L10 825 L10 245 L30 245';lx=600;ly=816;}
    if(view.id==='request' && a==='events' && b==='ui') {route='M440 585 L5 585 L5 75 L30 75';lx=210;ly=575;}
    if(view.id==='request' && a==='tool-gate' && b==='tool-adapter') {route='M850 415 L770 415 L770 665 L570 665 L570 715';lx=675;ly=657;}
    if(view.id==='request' && a==='retrieval' && b==='context') {route='M270 375 L270 285';lx=285;ly=346;}
    if(view.id==='request' && a==='context' && b==='retrieval') {route='M90 285 L90 375';lx=90;ly=319;}
    svg+='<path marker-end="url(#arrow)" d="'+route+'"/>';
    const labelChars=Array.from(label),labelLines=[];
    for(let i=0;i<labelChars.length;i+=10) labelLines.push(labelChars.slice(i,i+10).join(''));
    svg+='<text x="'+lx+'" y="'+ly+'" text-anchor="middle" style="font-size:14px;paint-order:stroke;stroke:#fff;stroke-width:5px;stroke-linejoin:round">'+labelLines.map((line,i)=>'<tspan x="'+lx+'" dy="'+(i?17:0)+'">'+esc(line)+'</tspan>').join('')+'</text>';
  }
  for (const n of nodes) svg+='<g data-graph-node="'+n.id+'"><rect x="'+n.x+'" y="'+n.y+'" width="260" height="80"/>'+lines(n.title,n.x+15,n.y+32,15)+'</g>';
  svg+='</svg>';
  return svg.replaceAll('diagram-title','architecture-'+view.id+'-title').replaceAll('diagram-description','architecture-'+view.id+'-description').replaceAll('id="arrow"','id="arrow-'+view.id+'"').replaceAll('url(#arrow)','url(#arrow-'+view.id+')');
}
