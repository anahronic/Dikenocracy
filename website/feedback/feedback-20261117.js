// Protocol feedback (standalone since the Keeper of Knowledge was retired, 2026-11-17).
// Select a passage of a protocol page -> "Leave feedback" -> message -> POST /api/feedback/v1/submit.
// English interface; the browser's own translation may translate it. User text is only ever assigned with
// textContent. Loaded only by protocol pages (/pages/protocols/<slug>.html); does nothing elsewhere.
(() => {
'use strict';
const D=document,H=D.documentElement;
const PROTO=(location.pathname.match(/^\/pages\/protocols\/([a-z0-9-]+)\.html$/)||[])[1]||null;
if(!PROTO||D.getElementById('dkp-feedback')) return;
const host=D.createElement('div');host.id='dkp-feedback';host.setAttribute('translate','yes');
const root=host.attachShadow({mode:'open'});
const css=`
:host{all:initial;position:fixed;inset-block-end:16px;inset-inline-end:16px;z-index:150;font:14px system-ui;color:#eaeaea}
*{box-sizing:border-box}[hidden]{display:none!important}
button{font:inherit;cursor:pointer;color:inherit;background:#121212;border:1px solid #d4af37;border-radius:12px}
button:focus-visible{outline:3px solid #d4af37;outline-offset:3px}
#fb{width:max-content;max-width:220px;padding:8px 12px}
#fbd{position:fixed;inset-inline-end:16px;bottom:16px;width:min(440px,calc(100vw - 32px));max-height:calc(100dvh - 32px);overflow:auto;background:#121212;border:1px solid #d4af37;border-radius:12px;padding:0 14px 14px}
#fbd header{height:48px;display:flex;align-items:center;justify-content:space-between}#fbx{min-width:36px;min-height:32px}
#fbd form{display:grid;gap:8px}#fbd label{font-weight:600}#fbm{margin:0}
#fbd blockquote{margin:0;padding:8px 10px;border-inline-start:3px solid #d4af37;max-height:9em;overflow:auto;white-space:pre-wrap}
#fbd textarea{font:inherit;color:inherit;background:transparent;border:1px solid #8a7a3a;border-radius:8px;padding:8px;resize:vertical;min-height:8em}
#fbd .row{display:flex;gap:8px;justify-content:flex-end;align-items:center}#fbd .row button{padding:6px 12px}
#fbc{margin-inline-end:auto;opacity:.75}#fbd .hp{position:absolute;left:-9999px;width:1px;height:1px;overflow:hidden}#fbs:empty{display:none}
@media(max-width:599px){#fbd{inset-inline:0;bottom:0;width:100%;border-radius:14px 14px 0 0}}
@media(prefers-color-scheme:light){:host{color:#242424}button,#fbd{background:#fffdf7}#fbd textarea{border-color:#a08a3a}}
`;
root.innerHTML='<style>'+css+'</style><button id="fb" type="button" hidden>Leave feedback</button>';
D.body.append(host);
const fb=root.getElementById('fb');
// A usable selection: one range inside the visible page text, not in forms, hidden or collapsed content.
function range(){
const s=window.getSelection();if(!s||s.isCollapsed||s.rangeCount!==1) return null;
const r=s.getRangeAt(0), base=r.commonAncestorContainer;
const bad=el => {
for (;el&&el!==H;el=el.parentElement){
if(el.matches('input,textarea,select,form,[contenteditable]:not([contenteditable="false"]),[hidden],[aria-hidden="true"],script,style,template,details:not([open])')||el.isContentEditable) return true;
const c=getComputedStyle(el);if(!el.getClientRects().length||c.display==='none'||c.visibility!=='visible'||c.opacity==='0'||c.contentVisibility==='hidden') return true;
} return false;
};
if(bad(D.activeElement)||bad(base.nodeType===1 ? base : base.parentElement)) return null;
const walk=D.createTreeWalker(base, NodeFilter.SHOW_ELEMENT);
while (walk.nextNode()) if(r.intersectsNode(walk.currentNode)&&bad(walk.currentNode)) return null;
return r;
}
let fbd=null, fbOpened=0, fbCtx=null;
function sectionOf(r){const hs=[...D.querySelectorAll('article h2[id],article h3[id],article h4[id]')];let best=null;for(const h of hs){if(h.contains(r.startContainer)||(h.compareDocumentPosition(r.startContainer)&Node.DOCUMENT_POSITION_FOLLOWING))best=h;}return best?{id:best.id,title:best.textContent.trim().slice(0,300)}:{id:'',title:''};}
function fbClose(){if(fbd&&!fbd.hidden){fbd.hidden=true;fb.hidden=!range();if(!fb.hidden)fb.focus();}}
function fbOpen(r){
if(!fbd){fbd=D.createElement('section');fbd.id='fbd';fbd.setAttribute('role','dialog');fbd.setAttribute('aria-modal','false');fbd.setAttribute('aria-labelledby','fbt');
fbd.innerHTML='<header><strong id="fbt">Feedback on this passage</strong><button id="fbx" type="button" aria-label="Close">×</button></header>'+
'<form id="fbf" novalidate><p id="fbm"></p><blockquote id="fbq"></blockquote><label for="fbmsg">Your feedback</label>'+
'<textarea id="fbmsg" maxlength="5000" rows="7" required></textarea><input id="fbw" class="hp" tabindex="-1" autocomplete="off" aria-hidden="true">'+
'<p id="fbs" role="status" aria-live="polite"></p><div class="row"><span id="fbc">0 / 5000</span><button type="button" id="fbcancel">Cancel</button><button type="submit" id="fbsend">Send feedback</button></div></form>';
root.append(fbd);const $f=id=>root.getElementById(id);
$f('fbx').onclick=fbClose;$f('fbcancel').onclick=fbClose;$f('fbmsg').oninput=e=>{$f('fbc').textContent=e.target.value.length+' / 5000';};
$f('fbf').onsubmit=async e=>{e.preventDefault();const msg=$f('fbmsg').value.trim(),st=$f('fbs'),btn=$f('fbsend');
if(!msg){st.textContent='Please write your feedback first.';return;}btn.disabled=true;st.textContent='Sending…';
try{const res=await fetch('/api/feedback/v1/submit',{method:'POST',headers:{'Content-Type':'application/json'},credentials:'omit',body:JSON.stringify({slug:PROTO,page_url:location.origin+location.pathname,section:fbCtx.section.id,section_title:fbCtx.section.title,selection:fbCtx.text,message:msg,elapsed_ms:Date.now()-fbOpened,website:$f('fbw').value})});
const d=await res.json().catch(()=>({}));
if(res.ok){const ref=(d.id||'').slice(0,8);st.textContent=d.delivery==='queued'?'Thank you. Your feedback was recorded (reference '+ref+') and will be e-mailed to the author.':'Thank you. Your feedback was recorded (reference '+ref+'). It is kept for the author.';$f('fbmsg').value='';$f('fbc').textContent='0 / 5000';}
else{const c=d.error&&d.error.code;st.textContent=c==='rate_limited'?'Too many submissions. Please try again later.':c==='too_fast'?'Please take a moment to write your feedback, then send it again.':c==='too_long'?'The text is too long (at most 5000 characters).':(d.error&&d.error.message)||('Feedback could not be sent (HTTP '+res.status+').');}
}catch(_){st.textContent='The feedback service is unavailable. Please try again later.';}finally{btn.disabled=false;}};}
const t=r.toString().slice(0,2000);fbCtx={text:t,section:sectionOf(r)};fbOpened=Date.now();
root.getElementById('fbm').textContent=PROTO.toUpperCase()+(fbCtx.section.title?' — '+fbCtx.section.title:'');
root.getElementById('fbq').textContent=t;root.getElementById('fbs').textContent='';fb.hidden=true;fbd.hidden=false;root.getElementById('fbmsg').focus();}
fb.addEventListener('pointerdown', e => e.preventDefault());
fb.onclick=()=>{const r=range();if(r) fbOpen(r);};
D.addEventListener('selectionchange',()=>{if(fbd&&!fbd.hidden) return;fb.hidden=!range();});
D.addEventListener('keydown', e => { if(e.key==='Escape'&&fbd&&!fbd.hidden){ e.preventDefault();fbClose();} });
})();
