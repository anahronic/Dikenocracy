/* Sandboxed client: no storage, cookies, host DOM access, or external dependencies. */
(() => {
'use strict';
const keys = 'question|send|cancel|protocols|lab|waiting|answering|checking|queued|running|completed|cancelled|failed|busy|unavailable|retry|confirm|proposal|user|default|hypothesis|validation|missing|about|model|corpus|instructions|download|explain|result|module|input|variant|coverage|hours|deficitHours|maxDeficit|roster|workers|days|longest|recovery|hourly|hour|need|staff|deficit|checks|selected|invalid|unverified_quote|unknown_citation|number_not_in_result|tool_rejected|truncated|no_sources|refused|cancelRequested|outputs|notReported'.split('|');
const rows = {
en:'Your question|Send|Cancel|Protocols|Protocol lab|Waiting…|Answering…|Checking sources…|Calculation queued|Calculation running|Complete|Cancelled|Calculation failed|The queue is busy.|The assistant is unavailable. You can still read the protocols or use the lab.|Retry after|Confirm calculation|Calculation proposal|From your question|Default|Hypothesis|Validation problems|Missing parameters|About this answer|Model|Corpus version|Instructions version|Download package|Explain|Lab result|Module|Input ID|Variant|Hourly coverage summary|Total hours|Hours with staff deficit|Largest staff deficit|Roster summary|Workers|Days|Longest consecutive workday run|Recovery violations and uncertainties|Reported hourly coverage|Hour|Required staff|Productive staff|Staff deficit|Check counts|Selected text shared|Check the value or JSON format.|Quote not verified, shown as paraphrase.|Unknown citation removed.|Number not found in the lab result.|Unsupported tool request rejected.|Answer truncated.|No sources found.|Outside the assistant’s role.|Cancellation requested…|Outputs|Not reported',
ru:'Ваш вопрос|Отправить|Отменить|Протоколы|Лаборатория протоколов|Ожидание…|Подготовка ответа…|Проверка источников…|Расчёт в очереди|Выполняется расчёт|Готово|Отменено|Ошибка расчёта|Очередь занята.|Помощник недоступен. Вы можете читать протоколы или пользоваться лабораторией.|Повторить через|Подтвердить расчёт|Предложение расчёта|Из вашего вопроса|По умолчанию|Гипотеза|Ошибки проверки|Недостающие параметры|Об этом ответе|Модель|Версия корпуса|Версия инструкций|Скачать пакет|Объяснить|Результат лаборатории|Модуль|ID входных данных|Вариант|Сводка покрытия по часам|Всего часов|Часы с нехваткой персонала|Максимальная нехватка персонала|Сводка расписания|Работники|Дни|Максимум рабочих дней подряд|Нарушения и неопределённости восстановления|Почасовое покрытие в отчёте|Час|Требуется работников|Работающий персонал|Нехватка персонала|Количество проверок|Выделенный текст передан|Проверьте значение или формат JSON.|Цитата не проверена, показана как пересказ.|Неизвестная ссылка удалена.|Число отсутствует в результате лаборатории.|Неподдерживаемый вызов инструмента отклонён.|Ответ сокращён.|Источники не найдены.|Вне роли помощника.|Запрошена отмена…|Выходные данные|Нет данных',
he:'השאלה שלך|שליחה|ביטול|פרוטוקולים|מעבדת הפרוטוקולים|בהמתנה…|מכין תשובה…|בודק מקורות…|החישוב בתור|החישוב מתבצע|הושלם|בוטל|החישוב נכשל|התור עמוס.|העוזר אינו זמין. אפשר לקרוא את הפרוטוקולים או להשתמש במעבדה.|ניסיון חוזר לאחר|אישור החישוב|הצעת חישוב|מהשאלה שלך|ברירת מחדל|השערה|בעיות אימות|פרמטרים חסרים|על התשובה|מודל|גרסת המאגר|גרסת ההוראות|הורדת החבילה|הסבר|תוצאת המעבדה|מודול|מזהה קלט|חלופה|סיכום כיסוי לפי שעה|סך השעות|שעות עם מחסור בצוות|מחסור מרבי בצוות|סיכום סידור העבודה|עובדים|ימים|רצף ימי העבודה הארוך ביותר|הפרות ואי ודאות בהתאוששות|כיסוי שעתי מדווח|שעה|צוות נדרש|צוות פעיל|מחסור בצוות|ספירת בדיקות|הטקסט הנבחר שותף|יש לבדוק את הערך או את פורמט JSON.|הציטוט לא אומת ומוצג כניסוח מחדש.|הפניה לא ידועה הוסרה.|המספר לא נמצא בתוצאת המעבדה.|בקשת כלי לא נתמכת נדחתה.|התשובה קוצרה.|לא נמצאו מקורות.|מחוץ לתפקיד העוזר.|נשלחה בקשת ביטול…|פלטים|לא דווח',
ar:'سؤالك|إرسال|إلغاء|البروتوكولات|مختبر البروتوكولات|في الانتظار…|جارٍ إعداد الإجابة…|جارٍ التحقق من المصادر…|الحساب في الطابور|الحساب قيد التنفيذ|اكتمل|أُلغي|فشل الحساب|الطابور مشغول.|المساعد غير متاح. يمكنك قراءة البروتوكولات أو استخدام المختبر.|أعد المحاولة بعد|تأكيد الحساب|مقترح حساب|من سؤالك|افتراضي|فرضية|مشكلات التحقق|معلمات ناقصة|حول هذه الإجابة|النموذج|إصدار مجموعة المصادر|إصدار التعليمات|تنزيل الحزمة|شرح|نتيجة المختبر|الوحدة|معرّف المدخلات|البديل|ملخص التغطية بالساعة|إجمالي الساعات|ساعات نقص الموظفين|أكبر نقص في الموظفين|ملخص جدول العمل|العاملون|الأيام|أطول تتابع لأيام العمل|انتهاكات التعافي وحالات عدم اليقين|التغطية الساعية المسجلة|الساعة|الموظفون المطلوبون|الموظفون المنتجون|نقص الموظفين|عدد الفحوص|تمت مشاركة النص المحدد|تحقق من القيمة أو تنسيق JSON.|الاقتباس غير موثّق ويُعرض بإعادة صياغة.|أُزيل مرجع غير معروف.|الرقم غير موجود في نتيجة المختبر.|رُفض طلب أداة غير مدعوم.|الإجابة مختصرة.|لم تُعثر على مصادر.|خارج دور المساعد.|طُلب الإلغاء…|المخرجات|غير مُبلّغ',
de:'Ihre Frage|Senden|Abbrechen|Protokolle|Protokolllabor|Warten…|Antwort wird erstellt…|Quellen werden geprüft…|Berechnung in Warteschlange|Berechnung läuft|Abgeschlossen|Abgebrochen|Berechnung fehlgeschlagen|Die Warteschlange ist voll.|Der Assistent ist nicht verfügbar. Protokolle und Labor bleiben zugänglich.|Erneut versuchen nach|Berechnung bestätigen|Berechnungsvorschlag|Aus Ihrer Frage|Standard|Hypothese|Validierungsprobleme|Fehlende Parameter|Über diese Antwort|Modell|Korpusversion|Anweisungsversion|Paket herunterladen|Erklären|Laborergebnis|Modul|Eingabe-ID|Variante|Stündliche Abdeckung|Stunden insgesamt|Stunden mit Personalmangel|Größter Personalmangel|Dienstplanübersicht|Beschäftigte|Tage|Längste Folge von Arbeitstagen|Erholungsverstöße und Unsicherheiten|Gemeldete stündliche Abdeckung|Stunde|Benötigtes Personal|Produktives Personal|Personalmangel|Prüfungsanzahl|Ausgewählter Text geteilt|Wert oder JSON-Format prüfen.|Zitat nicht bestätigt, als Paraphrase angezeigt.|Unbekannte Quellenangabe entfernt.|Zahl nicht im Laborergebnis gefunden.|Nicht unterstützte Werkzeuganfrage abgelehnt.|Antwort gekürzt.|Keine Quellen gefunden.|Außerhalb der Rolle des Assistenten.|Abbruch angefordert…|Ausgaben|Nicht gemeldet',
es:'Tu pregunta|Enviar|Cancelar|Protocolos|Laboratorio de protocolos|Esperando…|Preparando respuesta…|Verificando fuentes…|Cálculo en cola|Cálculo en curso|Completado|Cancelado|Error de cálculo|La cola está ocupada.|El asistente no está disponible. Puedes consultar los protocolos o usar el laboratorio.|Reintentar después de|Confirmar cálculo|Propuesta de cálculo|De tu pregunta|Predeterminado|Hipótesis|Problemas de validación|Parámetros faltantes|Acerca de esta respuesta|Modelo|Versión del corpus|Versión de instrucciones|Descargar paquete|Explicar|Resultado del laboratorio|Módulo|ID de entrada|Variante|Resumen de cobertura por hora|Horas totales|Horas con déficit de personal|Déficit máximo de personal|Resumen de turnos|Trabajadores|Días|Máximo de días de trabajo consecutivos|Incumplimientos e incertidumbres de recuperación|Cobertura horaria informada|Hora|Personal requerido|Personal productivo|Déficit de personal|Recuento de comprobaciones|Texto seleccionado compartido|Revisa el valor o el formato JSON.|Cita no verificada, mostrada como paráfrasis.|Referencia desconocida eliminada.|Número no encontrado en el resultado del laboratorio.|Solicitud de herramienta no admitida rechazada.|Respuesta truncada.|No se encontraron fuentes.|Fuera del papel del asistente.|Cancelación solicitada…|Salidas|No informado',
fr:'Votre question|Envoyer|Annuler|Protocoles|Laboratoire des protocoles|En attente…|Réponse en cours…|Vérification des sources…|Calcul en attente|Calcul en cours|Terminé|Annulé|Échec du calcul|La file est occupée.|L’assistant est indisponible. Vous pouvez consulter les protocoles ou utiliser le laboratoire.|Réessayer après|Confirmer le calcul|Proposition de calcul|De votre question|Par défaut|Hypothèse|Problèmes de validation|Paramètres manquants|À propos de cette réponse|Modèle|Version du corpus|Version des instructions|Télécharger le paquet|Expliquer|Résultat du laboratoire|Module|ID des données d’entrée|Variante|Résumé de couverture horaire|Total des heures|Heures de manque de personnel|Manque maximal de personnel|Résumé du planning|Travailleurs|Jours|Plus longue série de jours travaillés|Infractions et incertitudes de récupération|Couverture horaire rapportée|Heure|Personnel nécessaire|Personnel productif|Manque de personnel|Nombre de vérifications|Texte sélectionné partagé|Vérifiez la valeur ou le format JSON.|Citation non vérifiée, affichée comme paraphrase.|Référence inconnue supprimée.|Nombre absent du résultat du laboratoire.|Demande d’outil non prise en charge refusée.|Réponse tronquée.|Aucune source trouvée.|Hors du rôle de l’assistant.|Annulation demandée…|Sorties|Non rapporté',
it:'La tua domanda|Invia|Annulla|Protocolli|Laboratorio dei protocolli|In attesa…|Risposta in corso…|Verifica delle fonti…|Calcolo in coda|Calcolo in corso|Completato|Annullato|Calcolo fallito|La coda è occupata.|L’assistente non è disponibile. Puoi leggere i protocolli o usare il laboratorio.|Riprova dopo|Conferma calcolo|Proposta di calcolo|Dalla tua domanda|Predefinito|Ipotesi|Problemi di validazione|Parametri mancanti|Informazioni sulla risposta|Modello|Versione del corpus|Versione delle istruzioni|Scarica pacchetto|Spiega|Risultato del laboratorio|Modulo|ID input|Variante|Riepilogo copertura oraria|Ore totali|Ore con carenza di personale|Carenza massima di personale|Riepilogo turni|Lavoratori|Giorni|Massimo di giorni lavorativi consecutivi|Violazioni e incertezze sul recupero|Copertura oraria riportata|Ora|Personale richiesto|Personale produttivo|Carenza di personale|Conteggio verifiche|Testo selezionato condiviso|Controlla il valore o il formato JSON.|Citazione non verificata, mostrata come parafrasi.|Riferimento sconosciuto rimosso.|Numero assente nel risultato del laboratorio.|Richiesta di strumento non supportata rifiutata.|Risposta troncata.|Nessuna fonte trovata.|Fuori dal ruolo dell’assistente.|Annullamento richiesto…|Output|Non riportato',
pt:'Sua pergunta|Enviar|Cancelar|Protocolos|Laboratório de protocolos|Aguardando…|Preparando resposta…|Verificando fontes…|Cálculo na fila|Cálculo em andamento|Concluído|Cancelado|Falha no cálculo|A fila está ocupada.|O assistente está indisponível. Você pode ler os protocolos ou usar o laboratório.|Tentar novamente após|Confirmar cálculo|Proposta de cálculo|Da sua pergunta|Padrão|Hipótese|Problemas de validação|Parâmetros ausentes|Sobre esta resposta|Modelo|Versão do corpus|Versão das instruções|Baixar pacote|Explicar|Resultado do laboratório|Módulo|ID de entrada|Variante|Resumo da cobertura por hora|Total de horas|Horas com falta de pessoal|Maior falta de pessoal|Resumo da escala|Trabalhadores|Dias|Maior sequência de dias de trabalho|Violações e incertezas de recuperação|Cobertura horária informada|Hora|Pessoal necessário|Pessoal produtivo|Falta de pessoal|Contagem de verificações|Texto selecionado compartilhado|Verifique o valor ou o formato JSON.|Citação não verificada, exibida como paráfrase.|Referência desconhecida removida.|Número ausente no resultado do laboratório.|Pedido de ferramenta não suportado rejeitado.|Resposta truncada.|Nenhuma fonte encontrada.|Fora do papel do assistente.|Cancelamento solicitado…|Saídas|Não informado',
zh:'你的问题|发送|取消|协议|协议实验室|等待中…|正在回答…|正在核查来源…|计算已排队|正在计算|已完成|已取消|计算失败|队列繁忙。|助手暂不可用。你仍可阅读协议或使用实验室。|请在此时间后重试|确认计算|计算提案|来自你的问题|默认值|假设|验证问题|缺少的参数|关于此回答|模型|语料库版本|指令版本|下载数据包|解释|实验室结果|模块|输入标识|方案|逐小时覆盖摘要|总小时数|人员不足的小时数|最大人员缺口|排班摘要|工作人员|天数|最长连续工作天数|恢复违规及不确定性|报告的逐小时覆盖|小时|所需人员|生产人员|人员缺口|检查计数|已分享所选文本|请检查值或 JSON 格式。|引文未经核实，已改为转述。|已删除未知引用。|实验室结果中未找到此数字。|已拒绝不支持的工具请求。|回答已截断。|未找到来源。|超出助手职责。|已请求取消…|输出|未报告'
};
const purposes = {
en:'Ask about Dikenocracy with links to sources, or run research calculations in the lab. Research alpha; not for real enforcement.',
ru:'Вопросы о Дикенократии со ссылками на источники и исследовательские расчёты лаборатории. Исследовательская альфа, не для реального правоприменения.',
he:'שאלות על דיקנוקרטיה עם קישורים למקורות וחישובי מחקר במעבדה. גרסת אלפא למחקר, לא לאכיפה בפועל.',
ar:'أسئلة عن ديكنوقراطية مع روابط للمصادر وحسابات بحثية في المختبر. نسخة ألفا بحثية، وليست للإنفاذ الفعلي.',
de:'Fragen zu Dikenocracy mit Quellenlinks und Forschungsberechnungen im Labor. Forschungsalpha, nicht für reale Durchsetzung.',
es:'Preguntas sobre Dikenocracy con fuentes y cálculos de investigación en el laboratorio. Alfa de investigación, no para aplicación real.',
fr:'Questions sur Dikenocracy avec sources et calculs de recherche au laboratoire. Version alpha de recherche, sans application coercitive réelle.',
it:'Domande su Dikenocracy con fonti e calcoli di ricerca nel laboratorio. Alfa di ricerca, non per applicazione coercitiva reale.',
pt:'Perguntas sobre Dikenocracy com fontes e cálculos de pesquisa no laboratório. Alfa de pesquisa, não para aplicação coercitiva real.',
zh:'了解 Dikenocracy，获取来源链接，或运行实验室研究计算。研究测试版，不用于实际执法。'
};
const examples = {
en:['What is Dikenocracy?','What protects recovery time?','Can 12 workers cover a service around the clock?'],
ru:['Что такое Дикенократия?','Что защищает время восстановления?','Могут ли 12 работников обеспечить круглосуточную работу?'],
he:['מהי דיקנוקרטיה?','מה מגן על זמן ההתאוששות?','האם 12 עובדים יכולים לתת שירות מסביב לשעון?'],
ar:['ما هي ديكنوقراطية؟','ما الذي يحمي وقت التعافي؟','هل يستطيع 12 عاملاً توفير خدمة على مدار الساعة؟'],
de:['Was ist Dikenocracy?','Was schützt die Erholungszeit?','Können 12 Beschäftigte einen Dienst rund um die Uhr abdecken?'],
es:['¿Qué es Dikenocracy?','¿Qué protege el tiempo de recuperación?','¿Pueden 12 trabajadores cubrir un servicio las 24 horas?'],
fr:['Qu’est-ce que Dikenocracy ?','Qu’est-ce qui protège le temps de récupération ?','12 travailleurs peuvent-ils assurer un service permanent ?'],
it:['Che cos’è Dikenocracy?','Cosa protegge il tempo di recupero?','12 lavoratori possono coprire un servizio 24 ore su 24?'],
pt:['O que é Dikenocracy?','O que protege o tempo de recuperação?','12 trabalhadores podem cobrir um serviço 24 horas por dia?'],
zh:['什么是 Dikenocracy？','什么保障恢复时间？','12 名工作人员能提供全天候服务吗？']
};
const dictionary = Object.fromEntries(Object.entries(rows).map(([lang, row]) => {
  const values = row.split('|');
  if (values.length !== keys.length) throw new Error('Incomplete locale: ' + lang);
  return [lang, {...Object.fromEntries(keys.map((key,i) => [key,values[i]])), purpose:purposes[lang]}];
}));
let lang = 'en', context = null, base = null, active = null, job = null, statusKey = '', statusExtra = '';
const $ = id => document.getElementById(id);
const t = key => dictionary[lang][key] || key;
const node = (tag, text, cls) => { const e = document.createElement(tag); if (text != null) e.textContent = text; if (cls) e.className = cls; return e; };
const label = (tag,key,cls) => { const e = node(tag,t(key),cls); e.dataset.t = key; return e; };
const button = (key,fn) => { const b = label('button',key); b.type = 'button'; b.onclick = fn; return b; };
const printable = v => v == null ? t('notReported') : typeof v === 'object' ? JSON.stringify(v,null,2) : String(v);
function status(key, extra = '') { statusKey = key; statusExtra = extra; $('status').textContent = key ? t(key) + (extra ? ' · ' + extra : '') : ''; $('status').dataset.state = key; }
function lock(value, cancellable = true) {
  $('send').disabled = value || !context;
  $('cancel').hidden = !value || !cancellable;
  document.querySelectorAll('.proposal button[type=submit]').forEach(b => { b.disabled = value; });
}
function localize() {
  document.documentElement.lang = lang; document.documentElement.dir = /^(he|ar)$/.test(lang) ? 'rtl' : context?.dir || 'ltr';
  document.querySelectorAll('[data-t]').forEach(e => { e.textContent = t(e.dataset.t); });
  $('examples').replaceChildren(...examples[lang].map(text => { const b = node('button',text); b.type = 'button'; b.onclick = () => { $('question').value = text; $('question').focus(); }; return b; }));
  $('selection').hidden = !context?.selection; $('selection').textContent = t('selected') + ': ' + (context?.selection || '');
  status(statusKey,statusExtra);
}
window.addEventListener('message', e => {
  if (e.source !== window.parent || e.data?.type !== 'keeper:context') return;
  const d = e.data;
  try {
    const url = new URL(d.url);
    if (!/^https?:$/.test(url.protocol) || (location.origin !== 'null' && url.origin !== location.origin)) return;
    base = location.origin !== 'null' ? location.origin : url.origin;
    context = {url:url.origin + url.pathname,doc_id:typeof d.doc_id === 'string' ? d.doc_id : null,dir:d.dir === 'rtl' ? 'rtl' : 'ltr',selection:typeof d.selection === 'string' ? d.selection.slice(0,2000) : null};
    lang = dictionary[d.lang] ? d.lang : 'en';
    $('protocols').href = base + '/pages/protocols.html'; $('lab').href = base + '/projects/protocol-lab/';
    localize(); lock(!!active); if (!active && !document.querySelector('article')) $('question').focus();
  } catch (_) { /* Ignore malformed messages. */ }
});
document.addEventListener('keydown', e => { if (e.key === 'Escape') { e.preventDefault(); window.parent.postMessage({type:'keeper:close'},'*'); } });
async function api(path, {body, token, signal, headers = {}, method} = {}) {
  const response = await fetch(base + path,{method:method || (body === undefined ? 'GET' : 'POST'),credentials:'omit',referrerPolicy:'no-referrer',cache:'no-store',signal,headers:{...(body !== undefined ? {'Content-Type':'application/json'} : {}),...(token ? {Authorization:'Bearer ' + token} : {}),...headers},...(body !== undefined ? {body:JSON.stringify(body)} : {})});
  if (!response.ok) {
    const data = await response.json().catch(() => ({}));
    const error = new Error(data.error?.message || 'HTTP ' + response.status);
    Object.assign(error,{code:data.error?.code,status:response.status,problems:data.error?.problems || data.problems,retry:response.headers.get('Retry-After')}); throw error;
  }
  return response;
}
function problemList(parent, problems) {
  const list = node('ul',null,'problems'); for (const p of problems || []) list.append(node('li',printable(p))); parent.append(list); return list;
}
function failure(error, parent) {
  if (error.name === 'AbortError') { status('cancelled'); return; }
  if (['busy','queue_full','rate_limited'].includes(error.code)) status('busy',error.retry ? t('retry') + ' ' + error.retry : '');
  else if (error.status === 422) { status('validation'); problemList(parent,error.problems || [error.message]); }
  else status('unavailable');
}
function answer(data, parent) {
  parent.replaceChildren(node('p',data.answer || '', 'answer-text'));
  if (['no_sources','refused'].includes(data.state)) parent.append(label('p',data.state,'note'));
  for (const notice of data.notices || []) {
    const section = node('section', null, 'server-notice');
    section.append(node('p', notice.text, 'note'));
    for (const c of notice.links || []) {
      try {
        const url = new URL(c.url, base); if (!/^https?:$/.test(url.protocol)) continue;
        const a = node('a', c.cite + ' \u00b7 ' + (c.heading || ''), 'notice-link');
        a.href = url.href; a.target = '_blank'; a.rel = 'noopener noreferrer'; section.append(a);
      } catch (_) { /* Invalid notice link. */ }
    }
    parent.append(section);
  }
  // found_sources: sections found for the question but not cited by the answer (marked ↗, never shown as support)
  for (const c of [...(data.citations || []), ...(data.found_sources || []).map(x => ({...x, heading: '↗ ' + (x.heading || x.cite)}))]) {
    if (!c.url) { parent.append(node('span',`${c.heading || c.cite} · ${c.source_type || ''} · ${c.status || ''}`,'chip')); continue; }
    try {
      const url = new URL(c.url,base); if (!/^https?:$/.test(url.protocol)) continue;
      const a = node('a',`${c.heading || c.cite} · ${c.source_type || ''} · ${c.status || ''}`,'chip');
      a.href = url.href; a.target = '_blank'; a.rel = 'noopener noreferrer'; parent.append(a);
    } catch (_) { /* Invalid citation URLs are never navigable. */ }
  }
  for (const f of data.flags || []) {
    const p = label('p',f.code,'note flag'); parent.append(p);
    if (f.detail) parent.append(node('p',f.detail,'note'));
  }
  if (data.provenance) {
    const details = node('details'); details.append(label('summary','about')); const dl = node('dl');
    for (const [key,value] of [['model',data.provenance.model],['corpus',data.provenance.corpus_version],['instructions',data.provenance.instructions_version]]) dl.append(label('dt',key),node('dd',printable(value)));
    details.append(dl); parent.append(details);
  }
  if (data.state === 'needs_parameters') { parent.append(label('h3','missing')); problemList(parent,data.missing || []); }
}
// SSE frames can span UTF-8 chunks, contain multiple data lines, and use CRLF.
async function stream(response, parent, signal) {
  if (!response.headers.get('content-type')?.includes('text/event-stream')) throw new Error('Expected SSE');
  const reader = response.body.getReader(), decoder = new TextDecoder();
  let buffer = '', final = null; const output = node('p','','answer-text'); parent.append(output);
  function event(raw) {
    let kind = 'message'; const lines = [];
    for (const line of raw.split(/\r?\n/)) { if (line.startsWith('event:')) kind = line.slice(6).trim(); if (line.startsWith('data:')) lines.push(line.slice(5).replace(/^ /,'')); }
    if (!lines.length) return;
    const data = JSON.parse(lines.join('\n'));
    if (kind === 'delta') status('answering'); // Only checked final text is displayed.
    if (kind === 'status') status(data.state === 'checking' ? 'checking' : data.state === 'retrieving' ? 'waiting' : 'answering');
    if (kind === 'final') { final = data; answer(data,parent); }
  }
  try {
    while (true) {
      const {value,done} = await reader.read(); if (signal.aborted) throw new DOMException('Aborted','AbortError');
      buffer += decoder.decode(value,{stream:!done}); let match;
      while ((match = /\r?\n\r?\n/.exec(buffer))) { event(buffer.slice(0,match.index)); buffer = buffer.slice(match.index + match[0].length); }
      if (done) { if (buffer.trim()) event(buffer); break; }
    }
    if (!final) throw new Error('Incomplete stream'); return final;
  } finally { await reader.cancel().catch(() => {}); reader.releaseLock(); }
}
$('ask-form').onsubmit = async e => {
  e.preventDefault(); if (active || !context || !$('question').value.trim()) return;
  const question = $('question').value.trim();
  const article = node('article'); article.append(node('p',question,'question-text')); const body = node('div'); article.append(body); $('conversation').append(article);
  const controller = new AbortController(); active = controller; lock(true); status('waiting');
  try {
    const response = await api('/api/keeper/v1/ask',{body:{question,lang,page:{url:context.url,doc_id:context.doc_id},selection:context.selection,stream:true},signal:controller.signal});
    const final = await stream(response,body,controller.signal);
    if (final.state === 'proposal' && final.proposal) proposal(final.proposal,article);
    status(final.state === 'needs_parameters' ? 'missing' : 'completed');
  } catch (error) { failure(error,body); }
  finally { active = null; lock(false); }
};
function proposal(p, parent) {
  let pending = null; // Private retry credentials, scoped to this open panel and exact body.
  const form = node('form',null,'proposal'); form.append(label('h3','proposal')); if (p.note) form.append(node('p',p.note,'note'));
  const controls = [];
  for (const field of p.fields || []) {
    const wrap = node('label',field.label || field.key); wrap.append(label('span',['user','default','hypothesis'].includes(field.origin) ? field.origin : 'hypothesis','badge'));
    let input;
    const complex = field.value === null || typeof field.value === 'object' || ['array','object','json','list'].includes(field.type);
    if (field.type === 'bool' || field.type === 'boolean' || typeof field.value === 'boolean') { input = node('input'); input.type = 'checkbox'; input.checked = !!field.value; }
    else if (field.enum || field.options) { input = node('select'); for (const value of field.enum || field.options) { const opt = node('option',printable(value)); opt.value = JSON.stringify(value); input.append(opt); } input.value = JSON.stringify(field.value); }
    else if (complex) { input = node('textarea'); input.rows = 2; input.value = JSON.stringify(field.value); }
    else { input = node('input'); input.type = ['int','integer','float','number'].includes(field.type) || typeof field.value === 'number' ? 'number' : 'text'; input.value = field.value ?? ''; if (input.type === 'number') { input.step = ['int','integer'].includes(field.type) ? '1' : 'any'; input.required = true; if (field.min != null) input.min = field.min; if (field.max != null) input.max = field.max; } }
    input.dataset.key = field.key; wrap.append(input); if (field.note) wrap.append(node('span',field.note,'note')); form.append(wrap); controls.push({field,input,complex});
  }
  const problems = node('div'); form.append(label('h4','validation'),problems);
  problemList(problems,p.validation?.problems || []);
  const confirm = label('button','confirm'); confirm.type = 'submit'; form.append(confirm); parent.append(form);
  form.onsubmit = async e => {
    e.preventDefault(); if (active) return; problems.replaceChildren();
    let request;
    try {
      request = structuredClone(p.request);
      for (const {field,input,complex} of controls) {
        input.setCustomValidity(''); let value;
        try { value = input.type === 'checkbox' ? input.checked : input.tagName === 'SELECT' || complex ? JSON.parse(input.value) : input.type === 'number' ? Number(input.value) : input.value; }
        catch (_) { input.setCustomValidity(t('invalid')); input.reportValidity(); throw new Error(t('invalid')); }
        if (!input.reportValidity()) return;
        // Contract field keys refer to module inputs; apply shared edits to each variant.
        if (!/^[A-Za-z][A-Za-z0-9_]*$/.test(field.key) || ['constructor','prototype','__proto__'].includes(field.key)) throw new Error(t('invalid'));
        for (const v of request.variants) v.input[field.key] = value;
      }
    } catch (error) { problemList(problems,[error.message]); return; }
    const controller = new AbortController(); active = controller; lock(true,false); status('checking');
    try {
      const validation = await (await api('/api/lab/v1/validate',{body:request,signal:controller.signal})).json();
      if (!validation.ok) { status('validation'); problemList(problems,validation.problems); return; }
      // Do not abort job creation: its response is needed to retain cancellation credentials.
      const serialized = JSON.stringify(request);
      if (!pending || pending.serialized !== serialized) {
        const proof = btoa(String.fromCharCode(...crypto.getRandomValues(new Uint8Array(32)))).replace(/\+/g,'-').replace(/\//g,'_').replace(/=+$/,'');
        pending = {serialized, body:structuredClone(request), key:crypto.randomUUID(), proof};
      }
      const created = await (await api('/api/lab/v1/jobs',{body:pending.body,headers:{'Idempotency-Key':pending.key,'X-Idempotency-Token':pending.proof}})).json();
      job = {id:created.job_id,token:created.token}; confirm.disabled = true; lock(true); status('queued');
      await poll(job,controller.signal,parent); form.remove();
    } catch (error) { failure(error,problems); }
    finally { job = null; active = null; $('progress').hidden = true; lock(false); }
  };
}
function delay(ms, signal) { return new Promise((resolve,reject) => { const abort = () => { clearTimeout(timer); reject(new DOMException('Aborted','AbortError')); }; const timer = setTimeout(() => { signal.removeEventListener('abort',abort); resolve(); },ms); signal.addEventListener('abort',abort,{once:true}); }); }
const jobPath = j => '/api/lab/v1/jobs/' + encodeURIComponent(j.id);
async function poll(j,signal,parent) {
  let first = true;
  while (true) {
    await delay(first ? 1000 : 2000,signal); first = false;
    const s = await (await api(jobPath(j),{token:j.token,signal})).json();
    status(['queued','running','completed','cancelled','failed'].includes(s.state) ? s.state : 'running', s.state === 'queued' && s.queue_position ? '#' + s.queue_position : s.state === 'running' ? Math.round((s.progress || 0) * 100) + '%' : s.error || '');
    $('progress').hidden = false; $('progress').value = Math.max(0,Math.min(1,s.progress || 0)); $('progress').setAttribute('aria-label',t('running'));
    if (s.state === 'completed') { const report = await (await api(jobPath(j) + '/report',{token:j.token,signal})).json(); renderReport(report,j,parent); return; }
    if (s.state === 'failed' || s.state === 'cancelled') return;
  }
}
$('cancel').onclick = async () => {
  if (!active) return;
  if (!job) { active.abort(); return; }
  $('cancel').disabled = true;
  try { await api(jobPath(job) + '/cancel',{method:'POST',token:job.token}); status('cancelRequested'); }
  catch (error) { if (error.status !== 409) failure(error,$('conversation')); }
  finally { $('cancel').disabled = false; }
};
function metrics(parent, pairs) { const dl = node('dl'); for (const [key,value] of pairs) dl.append(label('dt',key),node('dd',printable(value))); parent.append(dl); }
function renderReport(report,j,parent) {
  // All values in this card originate in the authenticated report, never the model.
  const card = node('section',null,'result'); card.append(label('h2','result')); metrics(card,[['module',report.module?.id]]);
  card.append(node('p','result_id: ' + printable(report.result_id)),node('p','input_id: ' + printable(report.input_id)));
  for (const [name,v] of Object.entries(report.variants || {})) {
    card.append(node('h3',t('variant') + ': ' + name),node('p','input_id: ' + printable(v.input_id)),node('p','result_id: ' + printable(v.result_id)));
    const o = v.outputs || {}, checks = v.checks || [];
    if (report.module?.id === 'work_cycle') {
      card.append(label('h4','coverage')); metrics(card,[['hours',o.coverage?.hours],['coverage',o.coverage?.covered_fraction == null ? null : (o.coverage.covered_fraction * 100).toFixed(1) + '%'],['deficitHours',o.coverage?.deficit_hours],['maxDeficit',o.coverage?.max_deficit]]);
      card.append(label('h4','roster')); metrics(card,[['workers',o.roster?.length],['days',o.roster_days?.length],['longest',o.longest_workday_run]]);
      const recovery = checks.filter(c => ['FAIL','UNKNOWN'].includes(c.status) && /recovery|rest_|max_consecutive|no_exhaustion|adaptation_keeps_invariant/.test(c.check));
      card.append(label('h4','recovery'),node('p',String(recovery.length)));
      for (const c of recovery) card.append(node('p',`${c.status} · ${c.requirement_id} · ${c.explanation || ''}`));
      const details = node('details'); details.append(label('summary','hourly'));
      const table = node('table'), head = node('tr'); for (const key of ['hour','need','staff','deficit']) head.append(label('th',key));
      const thead = node('thead'); thead.append(head); const tbody = node('tbody');
      for (const row of o.hourly || []) { const tr = node('tr'); for (const key of ['hour','need','productive_staff','deficit']) tr.append(node('td',printable(row[key]))); tbody.append(tr); }
      table.append(thead,tbody); const scroll = node('div',null,'table-scroll'); scroll.append(table); details.append(scroll); card.append(details);
    } else { const details = node('details'); details.append(label('summary','outputs'),node('pre',JSON.stringify(o,null,2))); card.append(details); }
    card.append(label('h4','checks')); const counts = {PASS:0,FAIL:0,UNKNOWN:0,'N/A':0};
    for (const c of checks) { const key = c.status === 'NOT_APPLICABLE' ? 'N/A' : c.status; if (key in counts) counts[key]++; }
    card.append(node('p',Object.entries(counts).map(([k,v]) => `${k}: ${v}`).join(' · '),'check-counts'));
    for (const c of checks.filter(c => ['FAIL','UNKNOWN'].includes(c.status))) card.append(node('p',`${c.status} · ${c.requirement_id} · ${c.explanation || ''}`,'check-issue'));
  }
  const actions = node('div',null,'actions'), explanation = node('div',null,'explanation');
  actions.append(button('download',async () => {
    try { const blob = await (await api(jobPath(j) + '/export',{token:j.token})).blob(); const url = URL.createObjectURL(blob); const a = node('a'); a.href = url; a.download = 'lab-' + j.id + '.zip'; document.body.append(a); a.click(); a.remove(); setTimeout(() => URL.revokeObjectURL(url),10000); }
    catch (error) { failure(error,explanation); }
  }),button('explain',async () => {
    if (active) return; const controller = new AbortController(); active = controller; lock(true); status('answering');
    try { const data = await (await api('/api/keeper/v1/explain',{body:{job_id:j.id,token:j.token,lang},signal:controller.signal})).json(); answer(data,explanation); status('completed'); }
    catch (error) { failure(error,explanation); }
    finally { active = null; lock(false); }
  }));
  card.append(actions); parent.append(card,explanation);
}
// Own tab (pages whose policy forbids frames, e.g. Shadoo): the address carries only the page path and language.
if (window.parent === window) {
  const q = new URLSearchParams(location.search), from = q.get('from') || '/';
  base = location.origin;
  context = {url:base + (/^\/[\w\-./]*$/.test(from) && !from.includes('..') ? from : '/'),doc_id:null,dir:'ltr',selection:null};
  lang = dictionary[q.get('lang')] ? q.get('lang') : 'en';
  $('protocols').href = base + '/pages/protocols.html'; $('lab').href = base + '/projects/protocol-lab/';
  localize(); lock(false); $('question').focus();
}
localize(); window.parent.postMessage({type:'keeper:ready'},'*');
})();
