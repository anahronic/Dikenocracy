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
@media(prefers-color-scheme:light){:host{color:#242424}button,#dialog,iframe{background:#fffdf7}svg{color:#705600}}

`;
if('adoptedStyleSheets' in root&&'replaceSync' in CSSStyleSheet.prototype){const k=new CSSStyleSheet();k.replaceSync(css);root.adoptedStyleSheets=[k];}
root.innerHTML=(root.adoptedStyleSheets?.length?'':'<style>'+css+'</style>')+`<button id="share" hidden></button><button id="open" aria-expanded="false" aria-haspopup="dialog" aria-controls="dialog"><svg aria-hidden="true" viewBox="0 0 40 40" fill="none" stroke="currentColor" stroke-width="1.7" ><path d="M20 28c-5-4-11-4-16-3v10c6-1 11 0 16 3 5-3 10-4 16-3V25c-5-1-11-1-16 3v10M8 29l7 2m17-2-7 2M14 11h12l-1 12H15zM13 11l4-5h6l4 5M18 6V4a2 2 0 0 1 4 0v2"/><path d="M20 13c-4 5-3 7 0 8 3-1 4-3 0-8Z"/></svg></button>`;
D.body.append(host);
const open=root.getElementById('open'), share=root.getElementById('share');
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
if(!/^\/(shadoo|AA)\//i.test(location.pathname)&&!D.querySelector('meta[name="dkp-keeper-private"]')) D.addEventListener('selectionchange',()=>{share.hidden=!range();});
share.addEventListener('pointerdown', e => e.preventDefault());
share.onclick=() => { const r=range();if(r&&!noFrames()){ selection=r.toString().slice(0,2000);show();} };
open.onclick=() => { if(noFrames()) tab();else if(dialog&&!dialog.hidden) close();else { selection=null;show();} };
D.addEventListener('keydown', e => { if(e.key==='Escape'&&dialog&&!dialog.hidden){ e.preventDefault();close();} });
window.addEventListener('message', e => { if(e.source!==frame?.contentWindow) return;if(e.data?.type==='keeper:close') close();if(e.data?.type==='keeper:ready') send();});
new MutationObserver(language).observe(H,{attributes:true,attributeFilter:['lang','dir']});language();
})();
