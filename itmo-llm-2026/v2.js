/* ITMO Atlas 2.0. Client-side lab and explainable seven-stage visual. No external API calls. */
(function(){
'use strict';
var data=window.ITMO_ATLAS_DATA||{}, models=data.models||[], stages=data.stages||[];
function el(id){return document.getElementById(id)}
function make(tag,cls,txt){var n=document.createElement(tag);if(cls)n.className=cls;if(txt!=null)n.textContent=txt;return n}
function emit(name,extra){try{document.dispatchEvent(new CustomEvent('itmo:interaction',{detail:Object.assign({event:name},extra||{})}))}catch(e){}}
function option(select,value,label){var o=document.createElement('option');o.value=value;o.textContent=label;select.appendChild(o);return o}
function announce(message){var output=el('atlas-feedback');if(output)output.textContent=message}
var tasks={
  ru:{label:'Русский язык',prompt:'Объясни простыми словами разницу между «в течение» и «в течении». Приведи по два правильных примера для каждого случая и объясни правило без выдуманных исключений.'},
  logic:{label:'Логика',prompt:'У Анны 4 яблока, у Бориса на 3 больше, чем у Анны, а у Веры вдвое меньше, чем у Анны. Сколько яблок у них вместе? Реши по шагам и проверь арифметику.'},
  business:{label:'Бизнес',prompt:'Небольшая компания хочет внедрить ИИ для поиска по внутренним документам. Предложи план пилота на 30 дней, 3 метрики качества и 3 риска. Не выдумывай стоимость и не запрашивай реальные документы.'},
  code:{label:'Программирование',prompt:'Напиши функцию Python count_unique(items), возвращающую количество уникальных элементов в списке строк без учёта регистра и пробелов по краям. Приведи 3 теста, включая пустой список.'}
};
var storeKey='itmo-atlas-v2-lab-records', results=[];
try{var saved=JSON.parse(localStorage.getItem(storeKey)||'[]');if(Array.isArray(saved))results=saved.slice(0,50)}catch(err){}
function persist(){try{localStorage.setItem(storeKey,JSON.stringify(results));return true}catch(err){return false}}
function ratingValue(id){var n=Number(el(id).value);return n>=1&&n<=5?n:null}
function renderResults(){
 var host=el('atlas-results-list');if(!host)return;
 host.replaceChildren();el('atlas-results-count').textContent=results.length+' сохранено в этом браузере';
 if(!results.length){host.appendChild(make('div','atlas-empty','Пока нет результатов. Выберите модель и задание, вставьте полученный ответ и оцените его по трём критериям.'));return}
 var wrap=make('div','atlas-table-scroll'),table=make('table','atlas-table'),thead=make('thead'),tr=make('tr');
 ['Модель / версия','Задание','Точность¹','Полнота¹','Проверяемость¹','Ответ (фрагмент)'].forEach(function(t){tr.appendChild(make('th','',t))});thead.appendChild(tr);table.appendChild(thead);
 var body=make('tbody');
 results.forEach(function(r){var line=make('tr');[r.model+(r.version?' · '+r.version:''),tasks[r.task]?tasks[r.task].label:r.task,r.accuracy+'/5',r.complete+'/5',r.verify+'/5',r.answer.slice(0,300)+(r.answer.length>300?'…':'')].forEach(function(t,i){line.appendChild(make('td',i===5?'atlas-answer':'',t))});body.appendChild(line)});
 table.appendChild(body);wrap.appendChild(table);host.appendChild(wrap);
}
function initLab(){
 if(!el('atlas-lab')||!models.length)return;
 var modelSelect=el('atlas-model'),taskSelect=el('atlas-task'),prompt=el('atlas-prompt'),open=el('atlas-model-link');
 models.forEach(function(m,i){option(modelSelect,String(i),m.name)});
 Object.keys(tasks).forEach(function(k){option(taskSelect,k,tasks[k].label)});
 function updatePrompt(){prompt.textContent=tasks[taskSelect.value].prompt;emit('lab_task_select',{task:taskSelect.value})}
 function updateLink(){var i=Number(modelSelect.value),m=models[i],a=m&&m.accessLinks||[];var link=a.find(function(l){return l.kind==='chat'})||a.find(function(l){return l.kind==='weights'})||a[0];if(link){open.href=link.url;open.hidden=false;open.textContent=link.kind==='chat'?'Открыть чат / демо ↗':link.kind==='weights'?'Открыть веса / код ↗':'Открыть описание ↗';el('atlas-model-access').textContent=link.kind==='chat'?'Публичный интерфейс не гарантирует ту же версию, что в отчёте ИТМО.':link.kind==='weights'?'Для тестирования весов требуется отдельная среда; это не онлайн-чат.':'Для этой позиции публичный чат не подтверждён.'}else{open.hidden=true;el('atlas-model-access').textContent='Прямой публичный доступ не подтверждён.'}}
 taskSelect.addEventListener('change',updatePrompt);
 modelSelect.addEventListener('change',function(){updateLink();emit('lab_model_select',{index:Number(modelSelect.value)})});
 el('atlas-copy').addEventListener('click',function(){
   var text=tasks[taskSelect.value].prompt;
   if(navigator.clipboard&&navigator.clipboard.writeText){navigator.clipboard.writeText(text).then(function(){announce('Текст задания скопирован.')},function(){announce('Копирование недоступно. Выделите текст задания вручную.')})}
   else{announce('Выделите текст задания вручную: браузер не поддерживает копирование.')}
   emit('lab_prompt_copy',{task:taskSelect.value});
 });
 el('atlas-save').addEventListener('click',function(){
   var answer=el('atlas-answer').value.trim(),acc=ratingValue('atlas-accuracy'),full=ratingValue('atlas-complete'),check=ratingValue('atlas-verify'),mi=Number(modelSelect.value);
   if(!answer){announce('Вставьте ответ модели перед сохранением.');el('atlas-answer').focus();return}
   if(answer.length>4000){announce('Сократите ответ до 4000 символов.');return}
   if(!acc||!full||!check){announce('Поставьте оценки по всем трём критериям от 1 до 5.');return}
   var version=el('atlas-version').value.trim().slice(0,90);
   results.unshift({model:models[mi].name,version:version,task:taskSelect.value,answer:answer,accuracy:acc,complete:full,verify:check,at:new Date().toISOString()});
   results=results.slice(0,50);var persisted=persist();renderResults();announce(persisted?'Результат сохранён локально в этом браузере.':'Результат добавлен на экран, но браузер запретил локальное сохранение.');
   emit('lab_result_saved',{task:taskSelect.value,modelIndex:mi});
 });
 el('atlas-export').addEventListener('click',function(){
   if(!results.length){announce('Пока нечего экспортировать.');return}
   var file=new Blob([JSON.stringify({source:'ITMO Atlas — читательские ручные оценки, НЕ бенчмарк',exportedAt:new Date().toISOString(),results:results},null,2)],{type:'application/json'});
   var url=URL.createObjectURL(file),a=document.createElement('a');a.href=url;a.download='itmo-llm-manual-comparison.json';document.body.appendChild(a);a.click();a.remove();setTimeout(function(){URL.revokeObjectURL(url)},1000);
   emit('lab_results_export',{count:results.length});announce('Экспортирован локальный JSON-файл результатов.')
 });
 el('atlas-clear').addEventListener('click',function(){if(!results.length)return;if(!window.confirm('Удалить все локально сохранённые результаты этой лаборатории?'))return;results=[];persist();renderResults();announce('Локальные результаты удалены.');emit('lab_results_clear')});
 updatePrompt();updateLink();renderResults();
}
function initFlow(){
 if(!el('atlas-flow')||stages.length!==7)return;
 var list=el('atlas-stage-tabs'),panel=el('atlas-flow-stage-panel'),flow=el('atlas-flow-progress'),index=0,buttons=[];
 stages.forEach(function(s,i){
  var b=make('button','atlas-stage-tab');b.type='button';b.setAttribute('role','tab');b.id='atlas-stage-tab-'+i;b.setAttribute('aria-controls',panel.id);
  b.appendChild(make('span','',String(i+1).padStart(2,'0')));b.appendChild(document.createTextNode(s.name));
  b.addEventListener('click',function(){activate(i,true)});
  b.addEventListener('keydown',function(ev){var next=null;if(ev.key==='ArrowDown'||ev.key==='ArrowRight')next=(i+1)%7;if(ev.key==='ArrowUp'||ev.key==='ArrowLeft')next=(i+6)%7;if(ev.key==='Home')next=0;if(ev.key==='End')next=6;if(next!==null){ev.preventDefault();activate(next,true);buttons[next].focus()}});
  list.appendChild(b);buttons.push(b);
 });
 function activate(i,scroll){
  index=i;buttons.forEach(function(b,n){b.setAttribute('aria-selected',n===i?'true':'false');b.tabIndex=n===i?0:-1});
  panel.setAttribute('aria-labelledby',buttons[i].id);
  el('atlas-flow-number').textContent='ЭТАП '+String(i+1).padStart(2,'0')+' / 07';
  el('atlas-flow-name').textContent=stages[i].name;
  el('atlas-flow-desc').textContent=stages[i].desc;
  el('atlas-flow-amount').textContent=stages[i].amount;
  flow.style.width=((i+1)/7*100)+'%';
  var active=i<2?0:i<3?1:i<5?2:3;
  Array.from(document.querySelectorAll('.atlas-flow-node')).forEach(function(n,j){n.dataset.active=j===active?'true':'false'});
  if(scroll){var track=el('steps'),cards=track&&track.querySelectorAll('.step');if(cards&&cards[i]&&cards[0])track.scrollTo({left:cards[i].offsetLeft-cards[0].offsetLeft,behavior:window.matchMedia('(prefers-reduced-motion: reduce)').matches?'auto':'smooth'})}
  emit('training_stage_explain',{step:i+1});
 }
 var track=el('steps'),raf=null;
 if(track)track.addEventListener('scroll',function(){if(raf)cancelAnimationFrame(raf);raf=requestAnimationFrame(function(){var cards=Array.from(track.querySelectorAll('.step')),left=track.getBoundingClientRect().left,closest=0,distance=Infinity;cards.forEach(function(c,i){var diff=Math.abs(c.getBoundingClientRect().left-left);if(diff<distance){closest=i;distance=diff}});if(closest!==index)activate(closest,false)})},{passive:true});
 activate(0,false);
}
function init(){initLab();initFlow()}
if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',init);else init();
})();