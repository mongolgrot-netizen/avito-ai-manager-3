const listingsData=[['Премиальные ограждения из нержавейки и мрамора',642,16,82],['Мраморные лестницы на заказ — Москва',411,7,48],['Столешницы из натурального камня',286,4,36],['Входные группы из металла и нержавейки',503,10,67]];
const screens=[...document.querySelectorAll('.screen')];
function show(name){screens.forEach(s=>s.classList.toggle('active',s.id===name));document.querySelectorAll('.nav').forEach(n=>n.classList.toggle('active',n.dataset.screen===name));scrollTo({top:0,behavior:'smooth'})}
document.querySelectorAll('[data-screen]').forEach(x=>x.onclick=()=>show(x.dataset.screen));
function renderListings(){document.getElementById('listing-list').innerHTML=listingsData.map((x,i)=>`<div class="listing"><h3>${x[0]}</h3><div class="listing-meta"><span>👁 ${x[1]}</span><span>💬 ${x[2]}</span><span>${i===1?'⚠ Проверить':'✓ Активно'}</span></div><div class="bar"><span style="width:${x[3]}%"></span></div></div>`).join('')}
function toast(t){const x=document.getElementById('toast');x.textContent=t;x.classList.add('show');setTimeout(()=>x.classList.remove('show'),2200)}
function run(){toast('AI анализирует объявления…');setTimeout(()=>{show('ai');toast('Анализ завершён: найдено 3 действия')},900)}
document.getElementById('analyze').onclick=run;document.getElementById('runAgent').onclick=run;
document.getElementById('reply').onclick=()=>{const m=document.getElementById('clientMsg').value.trim();const out=document.getElementById('replyOut');out.style.display='block';out.textContent=m?`Добрый день! Да, можем изготовить изделие по индивидуальному проекту. Пришлите, пожалуйста, фото/чертёж, размеры и город объекта. После этого сориентируем по технологии, срокам и стоимости.`:'Вставьте сообщение клиента, и AI подготовит ответ.'};
document.getElementById('connect').onclick=()=>toast('Подключение Avito добавим после размещения серверной части.');
let deferred;window.addEventListener('beforeinstallprompt',e=>{e.preventDefault();deferred=e;document.getElementById('install').hidden=false});document.getElementById('install').onclick=async()=>{if(deferred){deferred.prompt();deferred=null}};
if('serviceWorker' in navigator) navigator.serviceWorker.register('./sw.js').catch(()=>{});renderListings();
