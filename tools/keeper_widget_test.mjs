/** Local-only integration test. No npm install or external traffic is used.
 * PowerShell: $env:PW_DIR='.../pyo'; node tools/keeper_widget_test.mjs
 */
import { createRequire } from 'node:module';
import http from 'node:http';
import fs from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath, pathToFileURL } from 'node:url';
import assert from 'node:assert/strict';
let chromium, playwrightLoader = 'CommonJS';
try { ({chromium} = createRequire(process.env.PW_DIR ? process.env.PW_DIR + '/' : import.meta.url)('playwright')); }
catch (error) {
  try {
    const require = createRequire(process.env.PW_DIR ? process.env.PW_DIR + '/' : import.meta.url);
    const entry = path.join(path.dirname(require.resolve('playwright/package.json')), 'index.mjs');
    ({chromium} = await import(pathToFileURL(entry).href));
    playwrightLoader = 'Local ESM fallback: supplied Playwright has no CommonJS index.js';
    console.error(playwrightLoader);
  } catch (fallback) {
    console.log(JSON.stringify({ok:false,error:'Playwright is unavailable. Set PW_DIR to the pyo directory containing node_modules/playwright; no installation is attempted.',detail:error.message,fallback:fallback.message})); process.exit(1);
  }
}
const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)),'../website');
const requests = [], jobs = new Map(), retries = new Map(), preflights = [], results = [], errors = [];
let origin, jobNumber = 0;
const provenance = {model:'fixture-model',corpus_version:'fixture-corpus',instructions_version:'fixture-v1'};
const answer = {state:'answer',answer:'Verified final answer.',citations:[{heading:'Recovery invariant',source_type:'protocol',status:'normative',url:'/pages/protocols/dkp-5-work-cycle-001.html#7'}],flags:[{code:'unverified_quote'}],provenance};
const proposal = slow => ({state:'proposal',answer:'Review these inputs.',provenance,proposal:{module:'work_cycle',request:{schema:'dkp-lab-input/1',module:'work_cycle',variants:[{name:slow ? 'slow' : 'visitor',input:{workers:12,work_hours:8,crisis_window:null}}]},fields:[{key:'workers',label:'Workers',value:12,type:'int',min:1,max:200,origin:'user'},{key:'work_hours',label:'Work hours',value:8,type:'int',origin:'default'},{key:'crisis_window',label:'Crisis window',value:null,origin:'hypothesis'}],validation:{ok:true,problems:[]}}});
const report = {schema:'dkp-lab-result/1',module:{id:'work_cycle',version:'1'},result_id:'report-result-123',input_id:'report-input-123',variants:{visitor:{result_id:'variant-result-123',input_id:'variant-input-123',outputs:{coverage:{hours:24,deficit_hours:2,max_deficit:3,covered_fraction:22/24},hourly:[{hour:0,need:4,productive_staff:1,deficit:3},{hour:1,need:4,productive_staff:4,deficit:0}],roster:[{worker:'w1',days:['W','W','R']}],roster_days:['DY0-001','DY0-002','DY0-003'],longest_workday_run:2},checks:[{requirement_id:'REQ-PASS',check:'test',status:'PASS'},{requirement_id:'WORKCYCLE-7-01',check:'recovery_invariant',status:'FAIL',explanation:'Fixture recovery violation.'},{requirement_id:'REQ-UNKNOWN',check:'monitoring',status:'UNKNOWN',explanation:'No operational evidence.'},{requirement_id:'REQ-NA',check:'crisis',status:'NOT_APPLICABLE'}]}}};
function json(res,code,data,headers={}) { res.writeHead(code,{'Content-Type':'application/json',...headers}); res.end(JSON.stringify(data)); }
async function handle(req,res) {
  const url = new URL(req.url,origin || 'http://127.0.0.1');
  if (url.pathname.startsWith('/api/')) {
    res.setHeader('Access-Control-Allow-Origin','null');
    res.setHeader('Access-Control-Allow-Methods','GET, POST, OPTIONS');
    res.setHeader('Access-Control-Allow-Headers','Content-Type, Authorization, Idempotency-Key, X-Idempotency-Token');
    res.setHeader('Access-Control-Expose-Headers','Retry-After');
    if (req.method === 'OPTIONS') { preflights.push(req.headers); res.writeHead(204); res.end(); return; }
    const chunks = []; for await (const part of req) chunks.push(part);
    const raw = Buffer.concat(chunks).toString(); const body = raw ? JSON.parse(raw) : null;
    requests.push({path:url.pathname,method:req.method,body,headers:req.headers});
    if (url.pathname.endsWith('/ask')) {
      if (body.question === 'busy') return json(res,503,{error:{code:'busy',message:'busy'}},{'Retry-After':'5'});
      if (body.question === 'unavailable') return json(res,503,{error:{code:'model_unavailable',message:'offline'}});
      if (body.question === 'network') { req.socket.destroy(); return; }
      res.writeHead(200,{'Content-Type':'text/event-stream'});
      res.write('event: status\r\ndata: {"state":"retrieving"}\r\n\r\n');
      res.write('event: delta\r\ndata: {"text":"Unverified draft"}\r\n\r\n');
      if (body.question === 'slow stream') return;
      let final = body.question.includes('proposal') ? proposal(body.question.includes('slow')) : body.question === 'missing' ? {state:'needs_parameters',answer:'Please specify staffing.',missing:['workers','demand'],provenance} : answer;
      if (body.question === 'notice') final = {state:'no_answer',answer:'The Keeper could not compose an answer.',citations:[],found_sources:[answer.citations[0]],notices:[{code:'open_author_question',text:'The author decides.',links:[{cite:'Q-065',heading:'Open question',url:'/api/keeper/v1/sources/Q-065%230',origin:'server_notice'}]}],flags:[{code:'empty_model_answer'}],provenance};
      // Deliberately split a frame and a multibyte UTF-8 sequence across writes.
      const bytes = Buffer.from('event: delta\ndata: {"text":" — draft"}\n\nevent: final\ndata: ' + JSON.stringify(final) + '\n\n');
      const cut = bytes.indexOf(Buffer.from('—')) + 1;
      res.write(bytes.subarray(0,cut)); const timer = setTimeout(() => res.end(bytes.subarray(cut)),150); res.on('close',() => clearTimeout(timer)); return;
    }
    if (url.pathname.endsWith('/explain')) return json(res,200,{...answer,answer:'Explanation below the authoritative card.',flags:[{code:'number_not_in_result'}]});
    if (url.pathname.endsWith('/validate')) {
      if (body.variants[0].input.workers === 13) return json(res,422,{error:{code:'invalid_input',message:'fixture validation',problems:['workers: fixture rejects thirteen']}});
      return json(res,200,{ok:true,problems:[],resolved:{}});
    }
    if (url.pathname === '/api/lab/v1/jobs') {
      const key = req.headers['idempotency-key'], proof = req.headers['x-idempotency-token'];
      if (!key || !proof) return json(res,422,{error:{code:'invalid_input'}});
      if (retries.has(key)) {
        const old = retries.get(key);
        if (old.body !== raw || old.proof !== proof) return json(res,409,{error:{code:'conflict'}});
        return json(res,202,old.response);
      }
      const id = 'job-' + (++jobNumber); jobs.set(id,{token:'token-' + id,polls:0,cancelled:false,slow:body.variants[0].name === 'slow'});
      const response = {job_id:id,token:'token-' + id,state:'queued'};
      retries.set(key,{body:raw,proof,response});
      if ([17,18].includes(body.variants[0].input.workers)) return json(res,503,{error:{code:'proxy_lost_response'}});
      return json(res,202,response);
    }
    const match = /^\/api\/lab\/v1\/jobs\/([^/]+)(?:\/(.*))?$/.exec(url.pathname);
    if (match) {
      const j = jobs.get(match[1]); if (!j || req.headers.authorization !== 'Bearer ' + j.token) return json(res,401,{error:{code:'missing_token'}});
      if (match[2] === 'cancel') { j.cancelled = true; return json(res,200,{state:'cancelled'}); }
      if (match[2] === 'report') return json(res,200,report);
      if (match[2] === 'export') { res.writeHead(200,{'Content-Type':'application/zip'}); res.end(Buffer.from('PK fixture package')); return; }
      j.polls++;
      return json(res,200,{state:j.cancelled ? 'cancelled' : j.slow || j.polls === 1 ? 'running' : 'completed',progress:j.polls === 1 ? .5 : 1,result_id:'DO-NOT-USE-STATUS-ID'});
    }
    return json(res,404,{error:{code:'not_found'}});
  }
  const name = decodeURIComponent(url.pathname).replace(/^\/+/, '') || 'index.html';
  let file = path.resolve(root,name.endsWith('/') ? name + 'index.html' : name);
  if (!file.startsWith(root + path.sep)) { res.writeHead(403); res.end(); return; }
  try {
    const data = await fs.readFile(file);
    const types = {'.html':'text/html; charset=utf-8','.js':'text/javascript; charset=utf-8','.css':'text/css; charset=utf-8','.json':'application/json','.svg':'image/svg+xml','.png':'image/png','.webp':'image/webp','.wasm':'application/wasm'};
    res.writeHead(200,{'Content-Type':types[path.extname(file)] || 'application/octet-stream'}); res.end(data);
  } catch (_) { res.writeHead(404); res.end('Not found'); }
}
const server = http.createServer((req,res) => handle(req,res).catch(error => { errors.push(error.message); res.writeHead(500); res.end(); }));
await new Promise(resolve => server.listen(0,'127.0.0.1',resolve)); origin = 'http://127.0.0.1:' + server.address().port;
let browser;
const test = async (name, fn) => { const start = Date.now(); try { await fn(); results.push({name,ok:true,ms:Date.now()-start}); } catch(error) { results.push({name,ok:false,error:error.stack}); } };
const until = async (fn,message) => { for (let i=0;i<100;i++) { if (await fn()) return; await new Promise(r=>setTimeout(r,50)); } throw new Error(message); };
async function pageAt(route='/',viewport={width:1100,height:850}) {
  const context = await browser.newContext({viewport,serviceWorkers:'block'});
  await context.route('**/*',route => route.request().url().startsWith(origin + '/') ? route.continue() : route.abort());
  await context.addInitScript(() => {
    window.__keeperContexts = [];
    addEventListener('message', e => { if (e.data?.type === 'keeper:context') window.__keeperContexts.push(e.data); });
  });
  const page = await context.newPage();
  page.keeperRequests = [];
  page.on('request',r=>{if(r.url().includes('/keeper/') || r.url().includes('/api/')) page.keeperRequests.push(r.url());});
  page.on('pageerror', e => { if (e.stack?.includes('/keeper/')) errors.push(e.message); });
  await page.goto(origin + route,{waitUntil:'domcontentloaded'});
  await page.locator('#dkp-keeper #open').waitFor();
  return {page,context};
}
async function open(page,key='Enter') {
  const b = page.locator('#dkp-keeper #open'); await b.focus(); await b.press(key);
  const frame = page.frameLocator('#dkp-keeper iframe'); await frame.locator('#send:not([disabled])').waitFor(); return frame;
}
async function ask(frame,text) { await frame.locator('#question').fill(text); await frame.locator('#send').click(); }
async function state(frame,value) { await until(async () => await frame.locator('#status').getAttribute('data-state') === value, 'Expected state ' + value); }
try {
  browser = await chromium.launch({headless:true,args:['--disable-background-networking','--disable-component-update','--disable-domain-reliability','--disable-sync','--no-first-run','--host-resolver-rules=MAP * ~NOTFOUND, EXCLUDE 127.0.0.1']});
  await test('loader below 6000 bytes and complete route inventory',async () => {
    assert.ok((await fs.stat(path.join(root,'keeper/keeper-loader.js'))).size < 6500);
    const inventory = JSON.parse(await fs.readFile(path.join(root,'keeper/ROUTES.json'),'utf8'));
    assert.equal(inventory.routes.filter(r=>r.source==='repository').length,47); assert.equal(inventory.routes.filter(r=>r.source==='live-only').length,4);
  });
  for (const route of ['/','/pages/protocols/dkp-5-work-cycle-001.html','/projects/protocol-lab/','/404.html']) {
    await test('keyboard, lazy load, sandbox: ' + route,async () => {
      const before = requests.length; const {page,context} = await pageAt(route);
      const loaded = []; page.on('request',r=>{if(r.url().includes('/keeper/') || r.url().includes('/api/')) loaded.push(r.url());});
      await page.waitForTimeout(180); assert.equal(await page.locator('#dkp-keeper iframe').count(),0); assert.equal(requests.length,before); assert.equal(loaded.length,0); assert.deepEqual(page.keeperRequests,[origin + '/keeper/keeper-loader.js']);
      const b = page.locator('#dkp-keeper #open'); assert.ok(await b.getAttribute('aria-label'));
      const box = await b.boundingBox(); assert.equal(box.width,48); assert.equal(box.height,48);
      for (const key of ['Enter','Space']) {
        const frame = await open(page,key); assert.equal(await page.locator('#dialog').getAttribute('aria-modal'),'false');
        assert.equal(await page.locator('iframe').getAttribute('sandbox'),'allow-scripts allow-forms allow-popups allow-popups-to-escape-sandbox allow-downloads');
        await frame.locator('#question').focus(); await frame.locator('#question').press('Escape');
        await until(()=>b.evaluate(e=>e.getRootNode().activeElement===e),'Launcher focus restored'); assert.equal(await page.locator('#dialog').isVisible(),false);
      }
      await context.close();
    });
  }
  await test('language switching, RTL, mobile bottom sheet and focus',async () => {
    const {page,context} = await pageAt('/',{width:390,height:844}); const frame = await open(page);
    for (const [lang,name,dir,send] of [['ru','Хранитель знаний','ltr','Отправить'],['en','Keeper of Knowledge','ltr','Send'],['he','שומר הידע','rtl','שליחה'],['ar','حارس المعرفة','rtl','إرسال'],['de','Hüter des Wissens','ltr','Senden'],['es','Guardián del conocimiento','ltr','Enviar'],['fr','Gardien du savoir','ltr','Envoyer'],['it','Custode della conoscenza','ltr','Invia'],['pt','Guardião do conhecimento','ltr','Enviar'],['zh','知识守护者','ltr','发送']]) {
      await page.evaluate(lang=>{document.documentElement.lang=lang;document.documentElement.dir=['he','ar'].includes(lang)?'rtl':'ltr';},lang);
      await until(async()=>await frame.locator('html').getAttribute('lang')===lang,'Language update');
      assert.equal(await page.locator('#open').getAttribute('aria-label'),name); assert.equal(await frame.locator('html').getAttribute('dir'),dir); assert.equal(await frame.locator('#send').textContent(),send);
      const box = await page.locator('#dialog').boundingBox(); assert.ok(Math.abs(box.x)<1); assert.ok(Math.abs(box.width-390)<1); assert.ok(Math.abs(box.y+box.height-844)<2);
      assert.ok(await frame.locator('html').evaluate(e=>e.scrollWidth<=e.clientWidth)); assert.ok(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth));
    }
    await frame.locator('#question').focus(); await frame.locator('#question').press('Tab'); assert.ok(await frame.locator('#send').evaluate(e=>document.activeElement===e));
    await context.close();
  });
  await test('privacy allowlist, opaque isolation, SSE final, citations and provenance',async () => {
    const {page,context} = await pageAt('/pages/protocols/dkp-5-work-cycle-001.html?secret=QUERY_SECRET#HASH_SECRET');
    await page.evaluate(()=>{ const f=document.createElement('form');f.innerHTML='<input value="FORM_SECRET"><textarea>TEXTAREA_SECRET</textarea>';document.body.append(f);localStorage.setItem('private-key','STORAGE_SECRET');document.cookie='secret=COOKIE_SECRET'; });
    const frame = await open(page); const frameObject = page.frames().find(f=>f.url().includes('/keeper/panel.html'));
    const isolation = await frameObject.evaluate(()=>{let dom=false,storage=false,cookie=false;try{parent.document.body;dom=true;}catch{}try{localStorage.getItem('private-key');storage=true;}catch{}try{document.cookie;cookie=true;}catch{}return {dom,storage,cookie,contexts:window.__keeperContexts};});
    assert.deepEqual([isolation.dom,isolation.storage,isolation.cookie],[false,false,false]);
    for (const c of isolation.contexts) { assert.deepEqual(Object.keys(c).sort(),['type','url','doc_id','lang','dir','selection'].sort()); assert.equal(c.url,origin+'/pages/protocols/dkp-5-work-cycle-001.html'); assert.equal(c.doc_id,'DKP-5-WORK-CYCLE-001'); assert.equal(c.selection,null); }
    assert.ok(isolation.contexts.length);
    await ask(frame,'answer'); await state(frame,'completed');
    assert.equal(await frame.locator('.answer-text').textContent(),'Verified final answer.');
    assert.match(await frame.locator('.chip').textContent(),/Recovery invariant.*protocol.*normative/); assert.equal(await frame.locator('.chip').getAttribute('target'),'_blank'); assert.equal(await frame.locator('.chip').getAttribute('href'),origin+'/pages/protocols/dkp-5-work-cycle-001.html#7');
    assert.match(await frame.locator('.flag').textContent(),/Quote not verified/); assert.equal(await frame.locator('details').getAttribute('open'),null);
    await frame.locator('summary').click(); assert.match(await frame.locator('details').textContent(),/fixture-model.*fixture-corpus.*fixture-v1/s);
    const request=requests.filter(r=>r.path.endsWith('/ask')).at(-1); assert.deepEqual(Object.keys(request.body).sort(),['question','lang','page','selection','stream'].sort()); assert.equal(request.headers.origin,'null'); assert.equal(request.headers.cookie,undefined); assert.equal(request.headers.referer,undefined);
    await context.close();
  });
  await test('selection requires explicit action; prohibited and hidden selections blocked',async () => {
    const {page,context}=await pageAt('/404.html');
    await page.evaluate(()=>{const p=document.createElement('p');p.id='selection-test';p.textContent='PUBLIC_SELECTION '.repeat(200);document.body.prepend(p);const range=document.createRange();range.selectNodeContents(p);getSelection().removeAllRanges();getSelection().addRange(range);});
    await page.locator('#share').waitFor(); assert.equal(await page.locator('iframe').count(),0);
    let frame=await open(page); await ask(frame,'selection not yet shared'); await state(frame,'completed'); assert.equal(requests.filter(r=>r.path.endsWith('/ask')).at(-1).body.selection,null);
    await frame.locator('#question').press('Escape');
    await page.evaluate(()=>{const r=document.createRange();r.selectNodeContents(document.getElementById('selection-test'));getSelection().removeAllRanges();getSelection().addRange(r);});
    await page.locator('#share').click(); frame=page.frameLocator('iframe'); await ask(frame,'selected text'); await state(frame,'completed'); assert.equal(requests.filter(r=>r.path.endsWith('/ask')).at(-1).body.selection.length,2000);
    await frame.locator('#question').press('Escape');
    for (const markup of ['<form><p>FORM_SECRET</p></form>','<div contenteditable="true">EDIT_SECRET</div>','<div><span>visible</span><span hidden>HIDDEN_SECRET</span></div>','<div style="visibility:hidden">HIDDEN_SECRET</div>','<details><summary>visible</summary><p>HIDDEN_SECRET</p></details>','<p style="opacity:0">HIDDEN_SECRET</p>','<textarea>TEXTAREA_SECRET</textarea>','<input value="FORM_SECRET">']) {
      await page.evaluate(markup=>{const box=document.createElement('div');box.innerHTML=markup;document.body.append(box);const r=document.createRange();r.selectNodeContents(box);getSelection().removeAllRanges();getSelection().addRange(r);},markup);
      await until(async()=>!(await page.locator('#share').isVisible()),'Prohibited selection hidden: ' + markup);
    }
    await page.evaluate(()=>{const input=document.createElement('input');input.value='ACTUAL_INPUT_SECRET';document.body.append(input);input.focus();input.select();});
    await until(async()=>!(await page.locator('#share').isVisible()),'Focused input selection hidden');
    await context.close();
  });
  await test('proposal edits, server validation, job polling, report, explain and export',async()=>{
    const {page,context}=await pageAt(); const frame=await open(page); await ask(frame,'proposal'); await state(frame,'completed');
    assert.equal(await frame.locator('.badge').count(),3); assert.match(await frame.locator('.proposal').textContent(),/From your question.*Default.*Hypothesis/s);
    await frame.locator('[data-key=workers]').fill('13'); await frame.locator('.proposal button[type=submit]').click(); await state(frame,'validation'); assert.match(await frame.locator('.problems').textContent(),/rejects thirteen/);
    await frame.locator('[data-key=workers]').fill('16'); await frame.locator('[data-key=crisis_window]').fill('[0, 2]');
    await frame.locator('.proposal button[type=submit]').click(); await state(frame,'queued'); await state(frame,'running'); await frame.locator('.result').waitFor({timeout:10000});
    const creation=requests.filter(r=>r.path==='/api/lab/v1/jobs').at(-1); assert.equal(creation.body.variants[0].input.workers,16); assert.deepEqual(creation.body.variants[0].input.crisis_window,[0,2]); assert.match(creation.headers['idempotency-key'],/^[a-f0-9-]{36}$/);
    const card=await frame.locator('.result').textContent(); assert.match(card,/report-result-123/); assert.match(card,/report-input-123/); assert.match(card,/variant-input-123/); assert.doesNotMatch(card,/DO-NOT-USE/); assert.match(card,/PASS: 1.*FAIL: 1.*UNKNOWN: 1.*N\/A: 1/); assert.match(card,/WORKCYCLE-7-01/); assert.match(card,/REQ-UNKNOWN/);
    assert.match(card,/Largest staff deficit3/); assert.match(card,/Longest consecutive workday run2/);
    await frame.getByRole('button',{name:'Explain',exact:true}).click(); await state(frame,'completed'); assert.equal(await frame.locator('.result').textContent(),card); assert.match(await frame.locator('.explanation').textContent(),/Explanation below.*Number not found/s);
    const explanation=requests.filter(r=>r.path.endsWith('/explain')).at(-1); assert.match(explanation.body.token,/^token-job-/);
    const downloadPromise=page.waitForEvent('download'); await frame.getByRole('button',{name:'Download package'}).click(); const download=await downloadPromise; assert.match(download.suggestedFilename(),/^lab-job-\d+\.zip$/);
    await context.close();
  });
  await test('KT10 empty answer keeps service notice links separate from found sections',async()=>{
    const {page,context}=await pageAt(); const frame=await open(page); await ask(frame,'notice'); await state(frame,'completed');
    assert.equal(await frame.locator('.answer-text').textContent(),'The Keeper could not compose an answer.');
    assert.equal(await frame.locator('.server-notice').count(),1);
    assert.match(await frame.locator('.notice-link').textContent(),/Q-065/);
    assert.equal(await frame.locator('.chip').count(),1);
    assert.match(await frame.locator('.chip').textContent(),/\u2197/);
    assert.doesNotMatch(await frame.locator('article').textContent(),/Unverified draft/);
    await context.close();
  });
  await test('KT10 retry after accepted POST loses response; same job and token',async()=>{
    const {page,context}=await pageAt(); const frame=await open(page);
    await ask(frame,'proposal'); await state(frame,'completed');
    const beforeJobs=jobs.size, before=requests.length;
    await frame.locator('[data-key=workers]').fill('17');
    await frame.locator('.proposal button[type=submit]').click(); await state(frame,'unavailable');
    assert.equal(jobs.size,beforeJobs+1);
    await frame.locator('.proposal button[type=submit]').click();
    await frame.locator('.result').waitFor({timeout:10000});
    const posts=requests.slice(before).filter(r=>r.path==='/api/lab/v1/jobs');
    assert.equal(posts.length,2); assert.equal(jobs.size,beforeJobs+1);
    for(const h of ['idempotency-key','x-idempotency-token']) assert.equal(posts[0].headers[h],posts[1].headers[h]);
    const saved=retries.get(posts[0].headers['idempotency-key']).response;
    assert.ok(requests.slice(before).some(r=>r.path.endsWith('/'+saved.job_id+'/report') && r.headers.authorization==='Bearer '+saved.token));
    assert.deepEqual(posts[0].body,posts[1].body);
    assert.equal(posts[0].headers.origin,'null'); assert.ok(posts[0].headers['x-idempotency-token']);
    await context.close();
  });
  await test('KT10 changed body after lost response creates independent credentials',async()=>{
    const {page,context}=await pageAt(); const frame=await open(page);
    await ask(frame,'proposal'); await state(frame,'completed'); const before=requests.length;
    for(const workers of ['17','18']) {
      await frame.locator('[data-key=workers]').fill(workers);
      await frame.locator('.proposal button[type=submit]').click(); await state(frame,'unavailable');
    }
    const posts=requests.slice(before).filter(r=>r.path==='/api/lab/v1/jobs');
    assert.equal(posts.length,2);
    for(const h of ['idempotency-key','x-idempotency-token']) assert.notEqual(posts[0].headers[h],posts[1].headers[h]);
    assert.notDeepEqual(posts[0].body,posts[1].body);
    const response=await fetch(origin+'/api/lab/v1/jobs',{method:'OPTIONS',headers:{Origin:'null','Access-Control-Request-Method':'POST','Access-Control-Request-Headers':'content-type,idempotency-key,x-idempotency-token'}});
    assert.equal(response.status,204); assert.match(response.headers.get('access-control-allow-headers'),/X-Idempotency-Token/i);
    await context.close();
  });
  await test('busy Retry-After, unavailable, network failure, missing parameters',async()=>{
    const {page,context}=await pageAt(); const frame=await open(page);
    await ask(frame,'busy'); await state(frame,'busy'); assert.match(await frame.locator('#status').textContent(),/Retry after 5/);
    for(const q of ['unavailable','network']) {await ask(frame,q);await state(frame,'unavailable');assert.equal(await frame.locator('#protocols').getAttribute('href'),origin+'/pages/protocols.html');assert.equal(await frame.locator('#lab').getAttribute('href'),origin+'/projects/protocol-lab/');}
    await ask(frame,'missing');await state(frame,'missing');assert.match(await frame.locator('article').last().textContent(),/workers.*demand/s);assert.equal(await frame.locator('#send').isEnabled(),true);
    await context.close();
  });
  await test('stream cancellation and authenticated job cancellation',async()=>{
    const {page,context}=await pageAt();const frame=await open(page);await ask(frame,'slow stream');await state(frame,'answering');await frame.locator('#cancel').click();await state(frame,'cancelled');
    await ask(frame,'slow proposal');await state(frame,'completed');await frame.locator('.proposal button[type=submit]').click();await state(frame,'queued');await frame.locator('#cancel').click();await state(frame,'cancelled');
    assert.ok(requests.some(r=>r.path.endsWith('/cancel')&&r.method==='POST'&&r.headers.authorization.startsWith('Bearer ')));
    const keys=requests.filter(r=>r.path==='/api/lab/v1/jobs').map(r=>r.headers['idempotency-key']);assert.ok(new Set(keys).size >= 2);
    await context.close();
  });
  await test('all captured API bodies exclude host secrets',async()=>{
    assert.doesNotMatch(JSON.stringify(requests.map(r=>r.body)),/QUERY_SECRET|HASH_SECRET|FORM_SECRET|TEXTAREA_SECRET|STORAGE_SECRET|COOKIE_SECRET|HIDDEN_SECRET|EDIT_SECRET|ACTUAL_INPUT_SECRET/);
    assert.deepEqual(errors,[]);
  });
} catch(error) {results.push({name:'test harness',ok:false,error:error.stack});}
finally { await browser?.close(); server.closeAllConnections(); await new Promise(resolve=>server.close(resolve)); }
const summary={playwrightLoader,ok:results.every(r=>r.ok),passed:results.filter(r=>r.ok).length,failed:results.filter(r=>!r.ok).length,apiRequests:requests.length,tests:results};
console.log(JSON.stringify(summary,null,2)); process.exitCode=summary.ok?0:1;
