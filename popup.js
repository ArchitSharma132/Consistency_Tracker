const t=document.getElementById('t');
chrome.storage.local.get('show',v=>t.checked=v.show!==false);
t.onchange=()=>chrome.storage.local.set({show:t.checked});
document.getElementById('s').onclick=()=>{chrome.tabs.create({url:chrome.runtime.getURL('newtab.html#settings')});window.close()};
