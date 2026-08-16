let portfolio = null;
let map = null;
const $ = (id) => document.getElementById(id);
const money = (v) => { const n=Number(v||0); if(n>=1e9)return `$${(n/1e9).toFixed(2)}B`; if(n>=1e6)return `$${(n/1e6).toFixed(1)}M`; return `$${n.toLocaleString()}`; };
const esc = (s) => String(s ?? '').replaceAll('&','&amp;').replaceAll('<','&lt;').replaceAll('>','&gt;').replaceAll('"','&quot;');

function riskColor(score){ return score>=70?'#ff5b56':score>=50?'#f5b84e':score>=30?'#42d7ff':'#52e0bb'; }
function exposureForMaterial(name){ return portfolio.exposures.filter(x=>x.material===name); }
function materialConcentration(name){ return Math.max(...exposureForMaterial(name).map(x=>x.share),0); }
function avgRisk(){ return portfolio.exposures.reduce((a,b)=>a+b.risk_score,0)/portfolio.exposures.length; }

function renderCommand(){
  const avg=avgRisk();
  $('riskGauge').innerHTML=`<div style="text-align:center"><strong style="color:${riskColor(avg)}">${avg.toFixed(0)}</strong><span>/ 100 PORTFOLIO RISK</span></div>`;
  const totalSpend=portfolio.materials.reduce((s,m)=>s+m.annual_spend_usd,0);
  const critical=portfolio.exposures.filter(x=>x.risk_score>=60).length;
  $('portfolioStats').innerHTML=[['Annual material spend',money(totalSpend)],['Critical exposures',critical],['Countries monitored',portfolio.nodes.length],['Revenue base',money(portfolio.annual_revenue_usd)]].map(([a,b])=>`<div class="stat"><span>${a}</span><strong>${b}</strong></div>`).join('');
  const top=[...portfolio.exposures].sort((a,b)=>b.risk_score-a.risk_score).slice(0,5);
  $('topRisks').innerHTML=top.map(x=>`<div class="risk-item"><div class="risk-row"><span>${esc(x.material)} / ${esc(x.country)}</span><strong>${x.risk_score}</strong></div><div class="risk-bar"><i style="width:${x.risk_score}%"></i></div></div>`).join('');
  $('countryList').innerHTML=[...portfolio.nodes].sort((a,b)=>b.risk-a.risk).map(x=>`<div class="country-card"><div class="row"><strong>${esc(x.country)}</strong><strong style="color:${riskColor(x.risk)}">${x.risk}</strong></div><small>Source-country screening risk</small></div>`).join('');
}

function initMap(){
  map=L.map('map',{zoomControl:false,worldCopyJump:true}).setView([25,-25],2);
  L.tileLayer('https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png',{attribution:'&copy; OpenStreetMap &copy; CARTO'}).addTo(map);
  const dest=portfolio.destination;
  L.circleMarker([dest.lat,dest.lon],{radius:8,color:'#42d7ff',fillColor:'#42d7ff',fillOpacity:.9}).bindTooltip(dest.name).addTo(map);
  for(const node of portfolio.nodes){
    const relevant=portfolio.exposures.filter(x=>x.country===node.country);
    const width=Math.max(1.5,Math.min(6,relevant.reduce((s,x)=>s+x.share,0)*4));
    L.polyline([[node.lat,node.lon],[dest.lat,dest.lon]],{color:riskColor(node.risk),weight:width,opacity:.42,dashArray:node.risk>=60?'7 6':null}).addTo(map);
    L.circleMarker([node.lat,node.lon],{radius:5+node.risk/18,color:riskColor(node.risk),weight:1,fillColor:riskColor(node.risk),fillOpacity:.78}).bindPopup(`<strong>${esc(node.country)}</strong><br>Risk ${node.risk}/100<br>${relevant.map(x=>esc(x.material)).join(', ')}`).addTo(map);
  }
}

function renderMaterials(){
  $('materialGrid').innerHTML=portfolio.materials.map(m=>{
    const c=materialConcentration(m.name); const risk=Math.max(...exposureForMaterial(m.name).map(x=>x.risk_score),0);
    return `<article class="material-card"><img src="${m.image}" alt="${esc(m.name)}"><div class="body"><div class="title"><div><span class="eyebrow">${esc(m.category)}</span><h3>${esc(m.name)}</h3></div><span class="symbol">${esc(m.symbol)}</span></div><div class="metric-line"><span>Annual spend</span><strong>${money(m.annual_spend_usd)}</strong></div><div class="metric-line"><span>Largest source share</span><strong>${Math.round(c*100)}%</strong></div><div class="mini-track"><i style="width:${c*100}%"></i></div><div class="metric-line"><span>Inventory buffer</span><strong>${m.inventory_days} days</strong></div><div class="metric-line"><span>Exposure risk</span><strong style="color:${riskColor(risk)}">${risk.toFixed(0)}/100</strong></div></div></article>`;
  }).join('');
  renderFlow();
}

function renderFlow(){
  const svg=$('flowSvg'); const left=110,right=1050,mid=580;
  const countries=[...new Set(portfolio.exposures.map(x=>x.country))];
  const materials=[...new Set(portfolio.exposures.map(x=>x.material))];
  let out='';
  const cy=new Map(countries.map((c,i)=>[c,35+i*(250/Math.max(countries.length-1,1))]));
  const my=new Map(materials.map((m,i)=>[m,35+i*(250/Math.max(materials.length-1,1))]));
  for(const x of portfolio.exposures){ const y1=cy.get(x.country), y2=my.get(x.material); out+=`<path d="M ${left+80} ${y1} C 340 ${y1}, 390 ${y2}, ${mid-80} ${y2}" stroke="${riskColor(x.risk_score)}" stroke-width="${2+x.share*10}" opacity=".28" fill="none"/>`; }
  countries.forEach(c=>{const y=cy.get(c); out+=`<rect x="${left}" y="${y-10}" width="80" height="20" rx="3" fill="#111e27" stroke="#2a3f4a"/><text x="${left+40}" y="${y+4}" text-anchor="middle" fill="#a9bcc5" font-size="9">${esc(c)}</text>`});
  materials.forEach(m=>{const y=my.get(m); out+=`<rect x="${mid-80}" y="${y-10}" width="160" height="20" rx="3" fill="#12222b" stroke="#31505e"/><text x="${mid}" y="${y+4}" text-anchor="middle" fill="#e0edf1" font-size="9">${esc(m)}</text><path d="M ${mid+80} ${y} C 780 ${y}, 850 165, ${right} 165" stroke="#42d7ff" stroke-width="2" opacity=".14" fill="none"/>`;});
  out+=`<rect x="${right}" y="145" width="125" height="40" rx="4" fill="#103045" stroke="#42d7ff"/><text x="${right+62}" y="161" text-anchor="middle" fill="#42d7ff" font-size="9">ONTARIO</text><text x="${right+62}" y="175" text-anchor="middle" fill="#dcecf2" font-size="10">Manufacturing</text>`;
  svg.innerHTML=out;
}

function setupScenario(){
  [...new Set(portfolio.exposures.map(x=>x.country))].sort().forEach(v=>$('countrySelect').insertAdjacentHTML('beforeend',`<option>${esc(v)}</option>`));
  portfolio.materials.map(x=>x.name).sort().forEach(v=>$('materialSelect').insertAdjacentHTML('beforeend',`<option>${esc(v)}</option>`));
  const bind=(id,out,suffix)=>$(id).addEventListener('input',()=>$(out).textContent=`${$(id).value}${suffix}`);
  bind('supplyLoss','supplyLossOut','%');bind('delayDays','delayOut',' days');bind('fxMove','fxOut','%');
}

async function runScenario(){
  const payload={country:$('countrySelect').value||null,material:$('materialSelect').value||null,supply_loss_pct:Number($('supplyLoss').value),delay_days:Number($('delayDays').value),fx_move_pct:Number($('fxMove').value)};
  const response=await fetch('/api/scenario',{method:'POST',headers:{'content-type':'application/json'},body:JSON.stringify(payload)}); const result=await response.json();
  $('scenarioKpis').innerHTML=[['REVENUE AT RISK',money(result.revenue_at_risk_usd)],['INCREMENTAL COST',money(result.incremental_cost_usd)],['DAYS TO IMPACT',`${result.days_to_impact} d`],['EXPOSURES HIT',result.affected_exposures]].map(([a,b])=>`<div class="kpi"><span>${a}</span><strong>${b}</strong></div>`).join('');
  const max=Math.max(...result.details.map(x=>x.revenue_at_risk_usd),1); $('impactBars').innerHTML=result.details.slice(0,8).map(x=>`<div class="bar-row"><span>${esc(x.material)}</span><div class="bar-track"><i style="width:${100*x.revenue_at_risk_usd/max}%"></i></div><strong>${money(x.revenue_at_risk_usd)}</strong></div>`).join('')||'<p class="muted">No exposures selected.</p>';
  $('mitigationList').innerHTML=result.mitigation.map((x,i)=>`<div class="mitigation"><div class="row"><strong>${i+1}. ${esc(x.action)}</strong><strong>${money(x.estimated_value_usd)}</strong></div><small>Estimated protected value</small></div>`).join('');
  renderRecovery(Number($('delayDays').value),result.days_to_impact);
}

function renderRecovery(duration,impact){
  const svg=$('recoverySvg'), w=1100; const points=[]; for(let d=0;d<=duration+45;d+=3){ let avail=d<impact?100:Math.max(18,100-(d-impact)*3.4); if(d>duration)avail=Math.min(100,avail+(d-duration)*2.2); points.push([20+(w-40)*d/(duration+45),190-1.55*avail]); } const path=points.map((p,i)=>`${i?'L':'M'} ${p[0].toFixed(1)} ${p[1].toFixed(1)}`).join(' '); svg.innerHTML=`<line x1="20" y1="190" x2="1080" y2="190" stroke="#243540"/><line x1="20" y1="25" x2="20" y2="190" stroke="#243540"/><path d="${path}" fill="none" stroke="#ff7a3d" stroke-width="3"/><path d="${path} L 1080 190 L 20 190 Z" fill="#ff7a3d" opacity=".08"/><text x="25" y="18" fill="#81929e" font-size="9">Available supply %</text><text x="1000" y="210" fill="#81929e" font-size="9">Days</text>`;
}

function showView(name){ document.querySelectorAll('.view').forEach(v=>v.classList.toggle('active',v.id===`view-${name}`)); document.querySelectorAll('.nav').forEach(b=>b.classList.toggle('active',b.dataset.view===name)); if(name==='command'&&map)setTimeout(()=>map.invalidateSize(),50); }

async function init(){
  portfolio=await (await fetch('/api/portfolio')).json(); renderCommand(); renderMaterials(); initMap(); setupScenario(); await runScenario();
  document.querySelectorAll('.nav').forEach(b=>b.addEventListener('click',()=>showView(b.dataset.view)));
  $('openScenario').addEventListener('click',()=>showView('scenario')); $('runScenario').addEventListener('click',runScenario);
}
init();
