const $=s=>document.querySelector(s),pad=n=>String(n).padStart(2,'0');
const key=d=>`${d.getFullYear()}-${pad(d.getMonth()+1)}-${pad(d.getDate())}`;
const esc=s=>String(s).replace(/[&<>"]/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;'}[c]));
const todayK=()=>key(new Date());
let routine=[],log={},quotes=[],trackerId='',day=new Date(),editing=null,lastQ=-1;
// routine: [{id,text,desc}] — same tasks every day
// log: {date:{done:[ids], req:[{id,text,desc}]}} — what was required that day + what was ticked
const save=()=>chrome.storage.local.set({routine,log,quotes});
const snap=()=>routine.map(t=>({id:t.id,text:t.text,desc:t.desc||''}));
const view=k=>{const r=log[k];return(k<todayK()&&r&&r.req.length)?r.req:routine}; // past days keep the list they had
const doneSet=k=>new Set(log[k]?.done||[]);
const complete=k=>{const req=view(k),d=doneSet(k);return req.length>0&&req.every(t=>d.has(t.id))};
const score=k=>complete(k)?1:0; // a day counts only when ALL its tasks are done
const status=s=>$('#status').textContent=s;
function touch(k){const r=log[k]=log[k]||{done:[],req:[]};if(k>=todayK()||!r.req.length)r.req=snap();return r}

async function push(dates){
  if(!trackerId){status('Set the tracker ID below to sync.');$('#det').open=true;return}
  const data={};dates.forEach(k=>data[k]=score(k));
  try{const r=await chrome.runtime.sendMessage(trackerId,{type:'planner-sync',data});
    status(r?.ok?'Synced to tracker ✓':'Tracker did not respond.')}
  catch{status('Tracker not reachable. Check the ID / that it is updated.')}}

function render(){
  const k=key(day),l=view(k),d=doneSet(k),editable=l===routine;
  $('#title').textContent=k===todayK()?'Today':day.toDateString();
  $('#list').innerHTML=l.map(t=>{
    if(editable&&editing===t.id)return `<div class="item editing" data-id="${t.id}"><div class="txt">
      <input type="text" data-et value="${esc(t.text)}" aria-label="Task"><input type="text" data-ed value="${esc(t.desc||'')}" placeholder="Description (optional)" aria-label="Description"></div>
      <div class="acts"><button class="x" data-save="${t.id}" title="Save" aria-label="Save">✓</button></div></div>`;
    return `<div class="item ${d.has(t.id)?'done':''}"><input type="checkbox" data-c="${t.id}" ${d.has(t.id)?'checked':''}>
      <div class="txt"><span class="t">${esc(t.text)}</span>${t.desc?`<span class="desc">${esc(t.desc)}</span>`:''}</div>
      ${editable?`<div class="acts"><button class="x" data-e="${t.id}" title="Edit" aria-label="Edit task">✎</button><button class="x" data-x="${t.id}" title="Remove" aria-label="Remove task">✕</button></div>`:''}</div>`}).join('')
    ||'<div class="empty">No daily tasks yet. Add the tasks you want to do every day.</div>';
  const n=l.filter(t=>d.has(t.id)).length;
  $('#count').textContent=l.length?`${n} / ${l.length} done${complete(k)?' · Day complete ✓':''}`:'';
  $('#list [data-et]')?.focus()}

function add(){const v=$('#new').value.trim();if(!v)return;
  routine.push({id:Date.now().toString(36)+Math.random().toString(36).slice(2,5),text:v,desc:$('#desc').value.trim()});
  $('#new').value=$('#desc').value='';touch(todayK());save().then(render);push([todayK()])}
$('#new').onkeydown=$('#desc').onkeydown=e=>{if(e.key==='Enter')add()};$('#addbtn').onclick=add;

function saveEdit(id){const it=$(`#list [data-id="${id}"]`),t=routine.find(x=>x.id===id);if(!it||!t)return;
  const v=it.querySelector('[data-et]').value.trim();if(v)t.text=v;t.desc=it.querySelector('[data-ed]').value.trim();
  editing=null;touch(todayK());save().then(render)}
$('#list').onclick=e=>{const k=key(day),c=e.target.closest('[data-c]'),x=e.target.closest('[data-x]'),ed=e.target.closest('[data-e]'),sv=e.target.closest('[data-save]');
  if(c){const r=touch(k),i=r.done.indexOf(c.dataset.c);i<0?r.done.push(c.dataset.c):r.done.splice(i,1);save().then(render);push([k])}
  if(x){routine=routine.filter(t=>t.id!==x.dataset.x);touch(todayK());save().then(render);push([todayK()])}
  if(ed){editing=ed.dataset.e;render()}
  if(sv)saveEdit(sv.dataset.save)};
$('#list').onkeydown=e=>{const it=e.target.closest('.editing');if(!it)return;
  if(e.key==='Enter')saveEdit(it.dataset.id);if(e.key==='Escape'){editing=null;render()}};
$('#prev').onclick=()=>{day.setDate(day.getDate()-1);editing=null;render()};
$('#next').onclick=()=>{day.setDate(day.getDate()+1);editing=null;render()};
$('#syncall').onclick=()=>push(Object.keys(log));
$('#tid').onchange=async e=>{trackerId=e.target.value.trim();await chrome.storage.local.set({trackerId});push(Object.keys(log))};

// quotes: random one on hover/focus of the day title
function pick(){if(quotes.length===1)return quotes[0];let i;do{i=Math.floor(Math.random()*quotes.length)}while(i===lastQ);lastQ=i;return quotes[i]}
const showTip=()=>{$('#tip').textContent=quotes.length?pick():'No quotes yet. Add some under "Quotes" below.';$('#tip').style.display='block'};
const hideTip=()=>$('#tip').style.display='none';
$('#title').onmouseenter=$('#title').onfocus=showTip;$('#title').onmouseleave=$('#title').onblur=hideTip;
function renderQ(){$('#qlist').innerHTML=quotes.map((q,i)=>`<div class="q"><span>${esc(q)}</span><button class="x" data-qd="${i}" aria-label="Remove quote">✕</button></div>`).join('')
  ||'<div class="empty" style="padding:6px 0">No quotes yet.</div>'}
function addQ(){const v=$('#qnew').value.trim();if(!v)return;quotes.push(v);$('#qnew').value='';save().then(renderQ)}
$('#qnew').onkeydown=e=>{if(e.key==='Enter')addQ()};$('#qadd').onclick=addQ;
$('#qlist').onclick=e=>{const b=e.target.closest('[data-qd]');if(b){quotes.splice(+b.dataset.qd,1);lastQ=-1;save().then(renderQ)}};

chrome.storage.local.get(['routine','log','quotes','tasks','trackerId'],v=>{
  routine=v.routine||[];log=v.log||{};quotes=v.quotes||[];trackerId=v.trackerId||'';
  if(v.tasks&&!v.routine){ // migrate from the old per-day lists
    const ks=Object.keys(v.tasks).sort(),last=v.tasks[todayK()]||v.tasks[ks[ks.length-1]]||[];
    routine=last.map(t=>({id:t.id,text:t.text,desc:''}));
    for(const k of ks){const l=v.tasks[k];log[k]={req:l.map(t=>({id:t.id,text:t.text,desc:''})),done:l.filter(t=>t.done).map(t=>t.id)}}
    save();chrome.storage.local.remove('tasks')}
  $('#tid').value=trackerId;if(!trackerId)$('#det').open=true;
  render();renderQ();if(trackerId)push([todayK()])});
