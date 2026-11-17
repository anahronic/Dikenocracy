(() => {
'use strict';const D=document,H=D.documentElement;
if(D.getElementById('dkp-keeper')) return;
const names={en:'Keeper of Knowledge',ru:'Хранитель знаний',he:'שומר הידע',ar:'حارس المعرفة',de:'Hüter des Wissens',es:'Guardián del conocimiento',fr:'Gardien du savoir',it:'Custode della conoscenza',pt:'Guardião do conhecimento',zh:'知识守护者'};
const asks={en:'Ask about the selected text',ru:'Спросить о выделенном тексте',he:'שאל על הטקסט שנבחר',ar:'اسأل عن النص المحدد',de:'Zum markierten Text fragen',es:'Preguntar sobre el texto seleccionado',fr:'Question sur le texte sélectionné',it:'Chiedi del testo selezionato',pt:'Perguntar sobre o texto selecionado',zh:'询问所选文字'};
const closes={en:'Close',ru:'Закрыть',he:'סגור',ar:'إغلاق',de:'Schließen',es:'Cerrar',fr:'Fermer',it:'Chiudi',pt:'Fechar',zh:'关闭'};
const host=D.createElement('div');host.id='dkp-keeper';
const root=host.attachShadow({mode:'open'});
const css=`
:host{all:initial;position:fixed;inset-block-end:16px;inset-inline-end:16px;z-index:150;font:14px system-ui;color:#eaeaea}
*{box-sizing:border-box}button{font:inherit;cursor:pointer;color:inherit;background:#121212;border:1px solid #d4af37;border-radius:12px}button:focus-visible{outline:3px solid #d4af37;outline-offset:3px}
#open{width:48px;height:48px;display:grid;place-items:center;}svg{width:34px;height:34px;color:#e4bf47}
#share{position:absolute;inset-inline-end:56px;bottom:0;width:max-content;max-width:220px;padding:8px}
#dialog{position:fixed;inset-inline-end:16px;bottom:80px;width:min(440px,calc(100vw - 32px));height:min(720px,calc(100dvh - 96px));background:#121212;overflow:hidden;}
header{height:48px;display:flex;align-items:center;justify-content:space-between;padding:8px 12px;}#close{min-width:36px;min-height:32px}iframe{display:block;width:100%;height:calc(100% - 48px);border:0;background:#121212}[hidden]{display:none!important}
@media(max-width:599px){#dialog{inset-inline:0;bottom:0;width:100%;height:85dvh;border-radius:14px 14px 0 0}}
#fb{position:absolute;inset-inline-end:56px;bottom:44px;width:max-content;max-width:220px;padding:8px}#fbd{position:fixed;inset-inline-end:16px;bottom:80px;width:min(440px,calc(100vw - 32px));max-height:calc(100dvh - 96px);overflow:auto;background:#121212;border:1px solid #d4af37;border-radius:12px;padding:0 14px 14px}#fbd form{display:grid;gap:8px}#fbd label{font-weight:600}#fbd blockquote{margin:0;padding:8px 10px;border-inline-start:3px solid #d4af37;max-height:9em;overflow:auto;white-space:pre-wrap}#fbd textarea{font:inherit;color:inherit;background:transparent;border:1px solid #8a7a3a;border-radius:8px;padding:8px;resize:vertical;min-height:8em}#fbd .row{display:flex;gap:8px;justify-content:flex-end;align-items:center}#fbd .row button{padding:6px 12px}#fbc{margin-inline-end:auto;opacity:.75}#fbd .hp{position:absolute;left:-9999px;width:1px;height:1px;overflow:hidden}#fbs:empty{display:none}@media(max-width:599px){#fbd{inset-inline:0;bottom:0;width:100%;border-radius:14px 14px 0 0}}
@media(prefers-color-scheme:light){#fbd{background:#fffdf7}:host{color:#242424}button,#dialog,iframe{background:#fffdf7}#fbd textarea{border-color:#a08a3a}svg{color:#705600}}

`;
if('adoptedStyleSheets' in root&&'replaceSync' in CSSStyleSheet.prototype){const k=new CSSStyleSheet();k.replaceSync(css);root.adoptedStyleSheets=[k];}
root.innerHTML=(root.adoptedStyleSheets?.length?'':'<style>'+css+'</style>')+`<button id="share" hidden></button><button id="fb" hidden>Leave feedback</button><button id="open" aria-expanded="false" aria-haspopup="dialog" aria-controls="dialog"><svg aria-hidden="true" viewBox="0 0 40 40" fill="none" stroke="currentColor" stroke-width="1.7" ><path d="M20 28c-5-4-11-4-16-3v10c6-1 11 0 16 3 5-3 10-4 16-3V25c-5-1-11-1-16 3v10M8 29l7 2m17-2-7 2M14 11h12l-1 12H15zM13 11l4-5h6l4 5M18 6V4a2 2 0 0 1 4 0v2"/><path d="M20 13c-4 5-3 7 0 8 3-1 4-3 0-8Z"/></svg></button>`;
D.body.append(host);
const open=root.getElementById('open'), share=root.getElementById('share'), fb=root.getElementById('fb');
let frame, dialog, lang, selection=null;
const noFrames=()=>[...D.querySelectorAll('meta[http-equiv="Content-Security-Policy" i]')].some(m=>/(^|;)\s*(frame|child|default)-src\s+'none'/i.test(m.content)&&!/(^|;)\s*frame-src[^;]*'self'/i.test(m.content));
const tab=()=>window.open('/keeper/panel.html?'+new URLSearchParams({from:location.pathname,lang}),'_blank','noopener,noreferrer');
D.addEventListener('securitypolicyviolation',e=>{if(frame&&/\/keeper\/panel/.test(e.blockedURI)){const b=D.createElement('button');b.textContent='↗ '+names[lang];b.onclick=tab;frame.replaceWith(b);frame=null;}});
const context=() => ({type:'keeper:context',url:location.origin + location.pathname,doc_id:D.querySelector('meta[name="dkp-doc-id"]')?.content||null,lang,dir:host.dir,selection});
const send=() => frame?.contentWindow.postMessage(context(), '*');
function language(){
lang=H.lang.toLowerCase().split('-')[0];
if(!names[lang]) lang='en';
host.dir=/^(he|ar)$/.test(lang) ? 'rtl' : (H.dir==='rtl' ? 'rtl' : 'ltr');
open.title=names[lang];open.setAttribute('aria-label', names[lang]);share.textContent=asks[lang];
if(frame){ frame.title=names[lang];root.getElementById('title').textContent=names[lang];root.getElementById('close').setAttribute('aria-label', closes[lang]);send();}
}
function close(){ if(!dialog) return;dialog.hidden=true;open.setAttribute('aria-expanded','false');open.focus();}
function show(){
if(!dialog){
dialog=D.createElement('section');dialog.id='dialog';dialog.setAttribute('role','dialog');dialog.setAttribute('aria-modal','false');dialog.setAttribute('aria-labelledby','title');
dialog.innerHTML='<header><strong id="title"></strong><button id="close">×</button></header>';
frame=D.createElement('iframe');frame.setAttribute('sandbox','allow-scripts allow-forms allow-popups allow-popups-to-escape-sandbox allow-downloads');frame.referrerPolicy='no-referrer';frame.src='/keeper/panel.html';
frame.addEventListener('load', send);dialog.append(frame);root.append(dialog);root.getElementById('close').onclick=close;language();
}
dialog.hidden=false;open.setAttribute('aria-expanded','true');send();frame?.focus();
}
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
if(!/^\/(shadoo|AA)\//i.test(location.pathname)&&!D.querySelector('meta[name="dkp-keeper-private"]')) D.addEventListener('selectionchange',()=>{const r=range();share.hidden=!r;fb.hidden=!(r&&PROTO);});
share.addEventListener('pointerdown', e => e.preventDefault());fb.addEventListener('pointerdown', e => e.preventDefault());
// Protocol feedback (2026-11-17): selected passage + message -> /api/feedback/v1/submit. English interface; the
// browser's own translation may translate it. User text is only ever assigned with textContent.
const PROTO=(location.pathname.match(/^\/pages\/protocols\/([a-z0-9-]+)\.html$/)||[])[1]||null;
let fbd=null, fbOpened=0, fbCtx=null;
function sectionOf(r){const hs=[...D.querySelectorAll('article h2[id],article h3[id],article h4[id]')];let best=null;for(const h of hs){if(h.contains(r.startContainer)||(h.compareDocumentPosition(r.startContainer)&Node.DOCUMENT_POSITION_FOLLOWING))best=h;}return best?{id:best.id,title:best.textContent.trim().slice(0,300)}:{id:'',title:''};}
function fbClose(){if(fbd){fbd.hidden=true;fb.focus();}}
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
if(res.ok){const ref=(d.id||'').slice(0,8);st.textContent=d.delivery==='queued'?'Thank you. Your feedback was recorded (reference '+ref+') and will be e-mailed to the author.':'Thank you. Your feedback was recorded (reference '+ref+'). E-mail delivery is not configured yet; it is kept for the author.';$f('fbmsg').value='';$f('fbc').textContent='0 / 5000';}
else{const c=d.error&&d.error.code;st.textContent=c==='rate_limited'?'Too many submissions. Please try again later.':c==='too_fast'?'Please take a moment to write your feedback, then send it again.':c==='too_long'?'The text is too long (at most 5000 characters).':(d.error&&d.error.message)||('Feedback could not be sent (HTTP '+res.status+').');}
}catch(_){st.textContent='The feedback service is unavailable. Please try again later.';}finally{btn.disabled=false;}};}
const t=r.toString().slice(0,2000);fbCtx={text:t,section:sectionOf(r)};fbOpened=Date.now();
root.getElementById('fbm').textContent=PROTO.toUpperCase()+(fbCtx.section.title?' — '+fbCtx.section.title:'');
root.getElementById('fbq').textContent=t;root.getElementById('fbs').textContent='';fbd.hidden=false;root.getElementById('fbmsg').focus();}
fb.onclick=()=>{const r=range();if(r&&PROTO) fbOpen(r);};
share.onclick=() => { const r=range();if(r&&!noFrames()){ selection=r.toString().slice(0,2000);show();} };
open.onclick=() => { if(noFrames()) tab();else if(dialog&&!dialog.hidden) close();else { selection=null;show();} };
D.addEventListener('keydown', e => { if(e.key==='Escape'&&fbd&&!fbd.hidden){ e.preventDefault();fbClose();return;} if(e.key==='Escape'&&dialog&&!dialog.hidden){ e.preventDefault();close();} });
window.addEventListener('message', e => { if(e.source!==frame?.contentWindow) return;if(e.data?.type==='keeper:close') close();if(e.data?.type==='keeper:ready') send();});
new MutationObserver(language).observe(H,{attributes:true,attributeFilter:['lang','dir']});language();
})();
