const $=s=>document.querySelector(s),pad=n=>String(n).padStart(2,'0');
const store={get:k=>new Promise(r=>chrome.storage.local.get(k,v=>r(v[k]))),set:(k,v)=>new Promise(r=>chrome.storage.local.set({[k]:v},r))};
const dkey=d=>`${d.getFullYear()}-${pad(d.getMonth()+1)}-${pad(d.getDate())}`;
const NAMES={github:'GitHub',leetcode:'LeetCode',codeforces:'Codeforces',hackerrank:'HackerRank',codechef:'CodeChef',atcoder:'AtCoder',manual:'Manual'};
const COLORS={github:'#4cc38a',leetcode:'#ffa116',codeforces:'#5ab0ff',hackerrank:'#2ec866',codechef:'#c9a27a',atcoder:'#9aa5b1',manual:'#c58af9'};
const FONTS={browser:'"Google Sans",Roboto,Arial,sans-serif',system:'system-ui,sans-serif',serif:'Georgia,serif',mono:'ui-monospace,Consolas,monospace'};
const DEF={theme:'browser',a:.6,blur:14,weeks:26,font:'browser',tint:'48,30,20'};
const STALE=30*60*1000;
let cfg={trackers:[],ui:{...DEF}},cache={};

const nd=s=>s.split('-').map((x,i)=>i?x.padStart(2,'0'):x).join('-');
const F={
 async github(u){
  try{const t=await (await fetch(`https://github.com/users/${encodeURIComponent(u)}/contributions`)).text(),ids={},o={};
   for(const m of t.matchAll(/data-date="([\d-]+)"[^>]*?id="([^"]+)"/g))ids[m[2]]=m[1];
   for(const m of t.matchAll(/for="([^"]+)"[^>]*>\s*(\d+|No) contribution/g)){const d=ids[m[1]];if(d&&m[2]!=='No')o[d]=+m[2]}
   if(Object.keys(ids).length)return {data:o}}catch{}
  const j=await (await fetch(`https://github-contributions-api.jogruber.de/v4/${encodeURIComponent(u)}?y=last`)).json();
  if(!j.contributions)throw new Error('User not found');const o={};j.contributions.forEach(c=>{if(c.count)o[c.date]=c.count});return {data:o}},
 async leetcode(u){const y=new Date().getFullYear(),o={};let solved;
  for(const yr of [y,y-1]){
   const r=await fetch('https://leetcode.com/graphql',{method:'POST',headers:{'content-type':'application/json'},
    body:JSON.stringify({query:'query($u:String!,$y:Int){matchedUser(username:$u){submitStats{acSubmissionNum{difficulty count}} userCalendar(year:$y){submissionCalendar}}}',variables:{u,y:yr}})});
   const m=(await r.json()).data?.matchedUser;if(!m)throw new Error('User not found');
   const c=JSON.parse(m.userCalendar.submissionCalendar);for(const t in c)o[new Date(t*1000).toISOString().slice(0,10)]=c[t];
   solved=m.submitStats.acSubmissionNum.find(x=>x.difficulty==='All')?.count}
  return {data:o,note:`${solved} solved`}},
 async codeforces(u){const j=await (await fetch(`https://codeforces.com/api/user.status?handle=${encodeURIComponent(u)}&from=1&count=10000`)).json();
  if(j.status!=='OK')throw new Error(j.comment||'User not found');const o={};
  j.result.forEach(s=>{if(s.verdict==='OK'){const k=dkey(new Date(s.creationTimeSeconds*1000));o[k]=(o[k]||0)+1}});return {data:o}},
 async hackerrank(u){const j=await (await fetch(`https://www.hackerrank.com/rest/hackers/${encodeURIComponent(u)}/submission_histories`)).json();
  const src=j.models||j,o={};if(typeof src!=='object')throw new Error('User not found');for(const k in src)o[nd(k)]=+src[k];return {data:o}},
 async codechef(u){const t=await (await fetch(`https://www.codechef.com/users/${encodeURIComponent(u)}`)).text();
  const m=t.match(/userDailySubmissionsStats\s*=\s*(\[.*?\]);/s);if(!m)throw new Error('Profile not readable');
  const o={};JSON.parse(m[1]).forEach(x=>o[nd(x.date)]=+x.value);return {data:o}},
 async atcoder(u){const from=Math.floor(Date.now()/1000)-400*86400;
  const a=await (await fetch(`https://kenkoooo.com/atcoder/atcoder-api/v3/user/submissions?user=${encodeURIComponent(u)}&from_second=${from}`)).json();
  const o={};a.forEach(s=>{if(s.result==='AC'){const k=dkey(new Date(s.epoch_second*1000));o[k]=(o[k]||0)+1}});return {data:o}}};

const save=()=>Promise.all([store.set('cfg',cfg),store.set('cache',cache)]);
async function load(){const c=await store.get('cfg');if(c)cfg=c;cfg.ui={...DEF,...cfg.ui};cache=(await store.get('cache'))||{};if(cache.__v!==2)cache={__v:2};
  const bg=await store.get('bg');if(bg)$('#bg').style.backgroundImage=`url(${bg})`}

function applyUI(){
  const u=cfg.ui,s=document.documentElement.style;
  document.documentElement.dataset.theme=u.theme;
  s.setProperty('--a',u.a);s.setProperty('--blur',u.blur+'px');s.setProperty('--font',FONTS[u.font]);
  u.theme==='browser'?s.setProperty('--tint',u.tint):s.removeProperty('--tint');
  $('#swb').style.background=`rgb(${u.tint})`;
  document.querySelectorAll('[data-t]').forEach(b=>b.classList.toggle('on',b.dataset.t===u.theme));
  $('#a').value=u.a;$('#blur').value=u.blur;$('#weeks').value=u.weeks;$('#font').value=u.font}

function days(w){const e=new Date();e.setHours(0,0,0,0);const s=new Date(e);s.setDate(s.getDate()-s.getDay()-(w-1)*7);
  const o=[];for(const d=new Date(s);d<=e;d.setDate(d.getDate()+1))o.push(new Date(d));return o}
function streak(data){const d=new Date();d.setHours(0,0,0,0);if(!data[dkey(d)])d.setDate(d.getDate()-1);
  let n=0;while(data[dkey(d)]){n++;d.setDate(d.getDate()-1)}return n}

function render(){
  const ds=days(cfg.ui.weeks);
  $('#list').innerHTML=cfg.trackers.map(t=>{
    const c=cache[t.id]||{},data=t.type==='manual'?(t.data||{}):(c.data||{});
    const nz=Object.values(data).sort((a,b)=>a-b),p=Math.max(1,nz[Math.floor(nz.length*.9)]||1);
    const cells=ds.map(d=>{const k=dkey(d),v=data[k]||0,l=v?Math.min(4,Math.ceil(4*v/p)):0;
      return `<span data-d="${k}" title="${v} on ${d.toDateString()}" ${l?`style="background:color-mix(in srgb,${t.color} ${[0,30,50,75,100][l]}%,transparent)"`:''}></span>`}).join('');
    return `<section class="p"><div class="t"><b><i class="dot" style="background:${t.color}"></i>${esc(t.label||NAMES[t.type])}</b>${c.note?`<small style="opacity:.65;margin-left:8px">${esc(c.note)}</small>`:''}
      <span title="${c.error||'Current streak'}">${c.error?'⚠ ':''}🔥 ${streak(data)}</span></div>
      <div class="h ${t.type==='manual'?'m':''}" data-m="${t.id}" style="--w:${cfg.ui.weeks}">${cells}</div></section>`}).join('')
    ||'<p class="empty">No platforms yet. Open settings (⚙) to add GitHub, LeetCode or any other site.</p>'}

function drawTList(){$('#tlist').innerHTML=cfg.trackers.map(t=>`<div class="item"><i class="dot" style="background:${t.color}"></i>
  <span class="grow">${t.label||NAMES[t.type]}${t.user?' · '+t.user:''}</span><button class="btn" data-del="${t.id}">Remove</button></div>`).join('')||'<div class="hint">None yet.</div>'}

async function sync(force){
  for(const t of cfg.trackers){if(t.type==='manual')continue;const c=cache[t.id];
    if(!force&&c?.data&&!c.error&&Date.now()-c.at<STALE)continue;
    try{const r=await F[t.type](t.user);cache[t.id]={data:r.data,note:r.note,at:Date.now()}}
    catch(e){cache[t.id]={...c,error:`${e.message||'Could not load'}. Showing last saved data.`}}
    await save();render()}}

function tintFrom(img){ // average colour of the wallpaper's left strip, darkened
  const c=document.createElement('canvas');c.width=c.height=16;const x=c.getContext('2d');
  x.drawImage(img,0,0,img.width*.25,img.height,0,0,16,16);const d=x.getImageData(0,0,16,16).data;let r=0,g=0,b=0;
  for(let i=0;i<d.length;i+=4){r+=d[i];g+=d[i+1];b+=d[i+2]}const n=d.length/4;
  return [r,g,b].map(v=>Math.round(v/n*.35)).join(',')}

$('#bgfile').onchange=e=>{const f=e.target.files[0];if(!f)return;const img=new Image();
  img.onload=async()=>{const k=Math.min(1,2560/img.width),c=document.createElement('canvas');c.width=img.width*k;c.height=img.height*k;
    c.getContext('2d').drawImage(img,0,0,c.width,c.height);const url=c.toDataURL('image/jpeg',.88);
    await store.set('bg',url);$('#bg').style.backgroundImage=`url(${url})`;cfg.ui.tint=tintFrom(c);await save();applyUI()};
  img.src=URL.createObjectURL(f)};
$('#bgreset').onclick=async()=>{await store.set('bg','');$('#bg').style.backgroundImage='';cfg.ui.tint=DEF.tint;await save();applyUI()};

document.addEventListener('click',async e=>{
  const s=e.target.closest('.h.m span');
  if(s&&cfg.trackers.find(x=>x.id===s.parentElement.dataset.m)?.source!=='planner'){const t=cfg.trackers.find(x=>x.id===s.parentElement.dataset.m),k=s.dataset.d;t.data=t.data||{};
    t.data[k]=Math.max(0,(t.data[k]||0)+(e.shiftKey?-1:1));if(!t.data[k])delete t.data[k];await save();render()}
  const d=e.target.closest('[data-del]');
  if(d){cfg.trackers=cfg.trackers.filter(x=>x.id!==d.dataset.del);delete cache[d.dataset.del];await save();drawTList();render()}
  const t=e.target.closest('[data-t]');if(t){cfg.ui.theme=t.dataset.t;await save();applyUI()}});
const setUI=(id,key,num)=>$('#'+id).oninput=async e=>{cfg.ui[key]=num?+e.target.value:e.target.value;await save();applyUI();render()};
setUI('a','a',1);setUI('blur','blur',1);setUI('weeks','weeks',1);setUI('font','font');
$('#gear').onclick=()=>{drawTList();$('#dlg').showModal()};
$('#close').onclick=()=>$('#dlg').close();
$('#refresh').onclick=()=>sync(true);
function parseLink(s){
  let u;try{u=new URL(/^https?:/.test(s)?s:'https://'+s)}catch{return null}
  const h=u.hostname.replace(/^www\./,''),p=u.pathname.split('/').filter(Boolean);
  if(h==='github.com'&&p[0])return {type:'github',user:p[0]};
  if(h==='leetcode.com'&&p.length)return {type:'leetcode',user:p[0]==='u'?p[1]:p[0]};
  if(h==='codeforces.com'&&p[0]==='profile'&&p[1])return {type:'codeforces',user:p[1]};
  if(h==='hackerrank.com'){const x=p[0]==='profile'?p[1]:p[0];if(x)return {type:'hackerrank',user:x}}
  if(h==='codechef.com'&&p[0]==='users'&&p[1])return {type:'codechef',user:p[1]};
  if(h==='atcoder.jp'&&p[0]==='users'&&p[1])return {type:'atcoder',user:p[1]};
  return null}
$('#typehint').textContent='Auto-synced: GitHub, LeetCode, Codeforces, HackerRank, CodeChef, AtCoder. Any other link becomes a manual tracker.';
$('#link').oninput=()=>{const p=parseLink($('#link').value);if(p)$('#color').value=COLORS[p.type]};
$('#add').onclick=async()=>{
  const raw=$('#link').value.trim(),label=$('#label').value.trim();let p=raw&&parseLink(raw),msg='';
  if(!raw&&!label)return $('#link').focus();
  if(!p){p={type:'manual',user:''};let host='';try{host=new URL(/^https?:/.test(raw)?raw:'https://'+raw).hostname.replace(/^www\./,'')}catch{}
    if(raw)msg=`${host||'That site'} can't be auto-synced, so it was added as a manual tracker: click squares to log days.`;
    p.host=host}
  const name=label||(p.type==='manual'?p.host:`${NAMES[p.type]} · ${p.user}`);
  if(!name)return $('#label').focus();
  cfg.trackers.push({id:Date.now().toString(36),type:p.type,user:p.user,label:name,color:$('#color').value,data:{}});
  $('#link').value=$('#label').value='';if(msg)$('#typehint').textContent=msg;
  await save();drawTList();render();sync()};

const esc=s=>String(s).replace(/[&<>"]/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;'}[c]));
async function shortcuts(){
  let s=await store.get('sc');
  if(!s){s=await new Promise(r=>chrome.topSites?chrome.topSites.get(x=>r(x.slice(0,4).map(y=>({url:y.url,title:y.title})))):r([]));await store.set('sc',s)}
  const ic=u=>`${chrome.runtime.getURL('/_favicon/')}?pageUrl=${encodeURIComponent(u)}&size=32`;
  $('#tiles').innerHTML=s.map((x,i)=>`<a href="${esc(x.url)}" data-i="${i}"><i><img src="${ic(x.url)}" alt=""></i><span>${esc(x.title)}</span></a>`).join('')
    +'<a href="#" id="addsc"><i>+</i><span>Add shortcut</span></a>';
  $('#addsc').onclick=async e=>{e.preventDefault();let u=prompt('Shortcut URL');if(!u)return;if(!/^https?:/.test(u))u='https://'+u;
    s.push({url:u,title:prompt('Name',new URL(u).hostname)||u});await store.set('sc',s);shortcuts()};
  $('#tiles').oncontextmenu=async e=>{const a=e.target.closest('a[data-i]');if(!a)return;e.preventDefault();
    if(confirm('Remove this shortcut?')){s.splice(+a.dataset.i,1);await store.set('sc',s);shortcuts()}}}

(async()=>{await load();applyUI();render();sync();shortcuts();
  $('#pen').onclick=$('#gear').onclick;
  const showP=v=>$('#panel').hidden=(v===false);showP(await store.get('show'));
  chrome.storage.onChanged.addListener(c=>{if(c.show)showP(c.show.newValue);if(c.cfg&&c.cfg.newValue){cfg=c.cfg.newValue;cfg.ui={...DEF,...cfg.ui};render()}});
  if(location.hash==='#settings'){drawTList();$('#dlg').showModal()}
  if(!(await store.get('bg'))){const i=new Image(); // works only if Chrome allows it; otherwise upload a wallpaper in settings
    i.onload=()=>$('#bg').style.backgroundImage='url(chrome://theme/IDR_THEME_NTP_BACKGROUND)';i.src='chrome://theme/IDR_THEME_NTP_BACKGROUND'}})();
