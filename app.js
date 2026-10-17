import {initializeApp} from 'https://www.gstatic.com/firebasejs/10.14.1/firebase-app.js';
import {getAuth,onAuthStateChanged,signInWithEmailAndPassword,signOut} from 'https://www.gstatic.com/firebasejs/10.14.1/firebase-auth.js';
import {getFirestore,increment,collection,addDoc,updateDoc,deleteDoc,doc,onSnapshot,query,where} from 'https://www.gstatic.com/firebasejs/10.14.1/firebase-firestore.js';
const firebaseConfig={apiKey:'AIzaSyDIFZyWck2xo3ZZARbVgmPq9-ppuLzdt5M',authDomain:'futebol-manager-online.firebaseapp.com',projectId:'futebol-manager-online',storageBucket:'futebol-manager-online.firebasestorage.app',messagingSenderId:'779731462015',appId:'1:779731462015:web:11b328964939d05f729c4a'};
const app=initializeApp(firebaseConfig),auth=getAuth(app),db=getFirestore(app);const $=id=>document.getElementById(id);let champs=[],teams=[],players=[],matches=[],selected='',unsubs=[],isAdmin=false;const esc=s=>String(s??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));const msg=s=>$('status').textContent=s;
function listen(col,cb,filter=null){return onSnapshot(filter?query(collection(db,col),where('championshipId','==',filter)):collection(db,col),snap=>cb(snap.docs.map(d=>({id:d.id,...d.data()}))),err=>msg('Erro ao carregar '+col+': '+err.message))}
listen('championships',items=>{champs=items;const prev=selected;selected=champs.some(c=>c.id===prev)?prev:(champs[0]?.id||'');$('champSelect').innerHTML=champs.map(c=>`<option value="${esc(c.id)}">${esc(c.name)}</option>`).join('');$('champSelect').value=selected;renderChampControls();loadChamp()});$('champSelect').onchange=e=>{selected=e.target.value;loadChamp()};
function renderChampControls(){const el=$('champActions');if(el)el.innerHTML=selected?manageButtons('championships',selected):''}
function loadChamp(){unsubs.forEach(f=>f());unsubs=[];teams=[];players=[];matches=[];render();if(!selected)return;unsubs.push(listen('teams',x=>{teams=x;render()},selected),listen('players',x=>{players=x;render()},selected),listen('matches',x=>{matches=x;render()},selected))}
function render(){for(const id of ['playerTeam','home','away']){$(id).innerHTML=teams.map(t=>`<option value="${esc(t.id)}">${esc(t.name)}</option>`).join('')}const rows=teams.map(t=>({id:t.id,name:t.name,crest:t.crest||'',p:0,j:0,v:0,e:0,d:0,gp:0,gc:0}));const byId=Object.fromEntries(rows.map(r=>[r.id,r]));for(const m of matches){if(!Number.isInteger(m.homeScore)||!Number.isInteger(m.awayScore))continue;const a=byId[m.homeId],b=byId[m.awayId];if(!a||!b)continue;a.j++;b.j++;a.gp+=m.homeScore;a.gc+=m.awayScore;b.gp+=m.awayScore;b.gc+=m.homeScore;if(m.homeScore>m.awayScore){a.v++;a.p+=3;b.d++}else if(m.homeScore<m.awayScore){b.v++;b.p+=3;a.d++}else{a.e++;b.e++;a.p++;b.p++}}rows.sort((a,b)=>b.p-a.p||(b.gp-b.gc)-(a.gp-a.gc)||b.gp-a.gp||a.name.localeCompare(b.name));$('standings').innerHTML=rows.map((r,i)=>`<tr><td>${i+1}</td><td>${r.crest?`<img class="crest" src="${esc(safeUrl(r.crest))}" alt="">`:''}${esc(r.name)}</td><td>${r.p}</td><td>${r.j}</td><td>${r.v}</td><td>${r.e}</td><td>${r.d}</td><td>${r.gp}</td><td>${r.gc}</td><td>${r.gp-r.gc}</td></tr>`).join('');renderStats();$('summary').innerHTML=`<div class="stat"><strong>${teams.length}</strong>Times</div><div class="stat"><strong>${players.length}</strong>Jogadores</div><div class="stat"><strong>${matches.length}</strong>Jogos</div><div class="stat"><strong>${matches.reduce((s,m)=>s+(Number.isInteger(m.homeScore)&&Number.isInteger(m.awayScore)?m.homeScore+m.awayScore:0),0)}</strong>Gols</div>`;$('matches').innerHTML=matches.slice().sort((a,b)=>(a.date||'').localeCompare(b.date||'')).map(m=>`<div class="match-card"><div class="match-score"><span>${esc(byId[m.homeId]?.name||'?')}</span><span class="score-pill">${Number.isInteger(m.homeScore)?m.homeScore:'-'} × ${Number.isInteger(m.awayScore)?m.awayScore:'-'}</span><span>${esc(byId[m.awayId]?.name||'?')}</span></div><p class="muted">${esc(m.date?new Date(m.date).toLocaleString('pt-BR'):'Data a definir')} · ${esc(m.venue||'Local a definir')}</p>${manageButtons('matches',m.id)}</div>`).join('')||'Nenhum jogo cadastrado.';$('teams').innerHTML=teams.map(t=>`<div><h3>${t.crest?`<img class="crest" src="${esc(safeUrl(t.crest))}" alt="">`:''}${esc(t.name)} ${manageButtons('teams',t.id)}</h3>${players.filter(p=>p.teamId===t.id).map(p=>`<div class="player-card">${p.photo?`<img class="player-photo" src="${esc(safeUrl(p.photo))}" alt="">`:''}<div class="player-main"><b>${esc(p.number||'-')} · ${esc(p.name)}</b><small>${esc(t.name)}</small><div class="quick-actions">${statCounter(p,'goals','⚽','goal')}${statCounter(p,'yellow','🟨','yellow')}${statCounter(p,'red','🟥','red')}</div></div>${manageButtons('players',p.id)}</div>`).join('')||'<p class="muted">Sem jogadores cadastrados.</p>'}</div>`).join('')||'Nenhum time cadastrado.'}
$('loginToggle').onclick=()=>$('loginBox').classList.toggle('hidden');$('login').onclick=async()=>{try{await signInWithEmailAndPassword(auth,$('email').value,$('password').value);$('password').value='';msg('Login realizado.')}catch(e){msg('Falha no login: '+e.message)}};$('logout').onclick=()=>signOut(auth);onAuthStateChanged(auth,u=>{$('admin').classList.toggle('hidden',!u);$('logout').classList.toggle('hidden',!u);$('login').classList.toggle('hidden',!!u);isAdmin=!!u;renderChampControls();render();msg(u?'Conectado: '+u.email:'Acesso público. Entre para administrar.')});
async function save(col,data){if(!auth.currentUser)throw Error('Faça login como administrador.');await addDoc(collection(db,col),data);msg('Cadastro salvo com sucesso.')}async function action(fn){try{await fn()}catch(e){msg('Não foi possível salvar: '+e.message)}}$('addChamp').onclick=()=>action(async()=>{const name=$('champName').value.trim();if(!name)throw Error('Informe o campeonato.');await save('championships',{name});$('champName').value=''});$('addTeam').onclick=()=>action(async()=>{if(!selected)throw Error('Cadastre um campeonato primeiro.');const name=$('teamName').value.trim();if(!name)throw Error('Informe o time.');await save('teams',{championshipId:selected,name,crest:await imageValue('teamCrestFile',$('teamCrest').value.trim())});$('teamName').value='';$('teamCrest').value='';$('teamCrestFile').value=''});$('addPlayer').onclick=()=>action(async()=>{if(!selected||!$('playerTeam').value)throw Error('Selecione campeonato e time.');const name=$('playerName').value.trim();if(!name)throw Error('Informe o jogador.');await save('players',{championshipId:selected,teamId:$('playerTeam').value,name,number:$('playerNumber').value,goals:0,yellow:0,red:0,photo:await imageValue('playerPhotoFile','')});$('playerName').value='';$('playerNumber').value='';$('playerPhotoFile').value=''});$('addMatch').onclick=()=>action(async()=>{const homeId=$('home').value,awayId=$('away').value;if(!selected||!homeId||!awayId||homeId===awayId)throw Error('Escolha dois times diferentes.');const hs=$('homeScore').value,as=$('awayScore').value;if((hs==='')!==(as===''))throw Error('Preencha ambos os placares ou deixe ambos vazios.');await save('matches',{championshipId:selected,homeId,awayId,homeScore:hs===''?null:Number(hs),awayScore:as===''?null:Number(as),date:$('matchDate').value?new Date($('matchDate').value).toISOString():'',venue:$('matchVenue').value.trim()})});

function safeUrl(value){try{const u=new URL(value);return ['https:','http:'].includes(u.protocol)||(/^data:image\/(jpeg|png|webp);base64,/i.test(value)&&value.length<700000)?value:''}catch{return ''}}
function manageButtons(col,id){return isAdmin?`<span class="actions"><button type="button" data-edit="${col}" data-id="${esc(id)}">Editar</button><button type="button" class="danger" data-delete="${col}" data-id="${esc(id)}">Excluir</button></span>`:''}
function getRecord(col,id){return ({championships:champs,teams,players,matches})[col]?.find(x=>x.id===id)}
function renderStats(){
 const sorted=players.slice().sort((a,b)=>(Number(b.goals)||0)-(Number(a.goals)||0));
 $('scorers').innerHTML=sorted.filter(p=>Number(p.goals)>0).map((p,i)=>`<div class="ranking"><b>${i+1}º</b> ${p.photo?`<img class="player-photo" src="${esc(safeUrl(p.photo))}" alt="">`:''}<span>${esc(p.name)} <small>${esc(teams.find(t=>t.id===p.teamId)?.name||'')}</small></span><strong>⚽ ${Number(p.goals)||0}</strong></div>`).join('')||'<p class="muted">Os gols individuais ainda não foram cadastrados.</p>';
 $('discipline').innerHTML=players.filter(p=>(Number(p.yellow)||0)+(Number(p.red)||0)>0).sort((a,b)=>(Number(b.red)||0)-(Number(a.red)||0)||(Number(b.yellow)||0)-(Number(a.yellow)||0)).map(p=>`<div class="ranking"><span>${esc(p.name)} <small>${esc(teams.find(t=>t.id===p.teamId)?.name||'')}</small></span><b>🟨 ${Number(p.yellow)||0} &nbsp; 🟥 ${Number(p.red)||0}</b></div>`).join('')||'<p class="muted">Nenhum cartão registrado.</p>';
}
function field(label,key,value,type='text'){return `<label class="edit-field">${label}<input data-field="${key}" type="${type}" ${type==='number'?'min="0"':''} value="${esc(value??'')}"></label>`}
function editForm(col,item){
 let body='';
 if(col==='championships')body=field('Nome do campeonato','name',item.name);
 if(col==='teams')body=field('Nome do time','name',item.name)+`<label class="edit-field">Novo escudo (galeria)<input type="file" id="editImage" accept="image/*"></label>`+field('Ou URL de escudo','crestUrl',item.crest?.startsWith('data:')?'':item.crest||'');
 if(col==='players')body=field('Nome do jogador','name',item.name)+field('Número da camisa','number',item.number)+field('Gols marcados','goals',item.goals||0,'number')+field('Cartões amarelos','yellow',item.yellow||0,'number')+field('Cartões vermelhos','red',item.red||0,'number')+`<label class="edit-field">Nova foto (galeria)<input type="file" id="editImage" accept="image/*"></label>`;
 if(col==='matches')body=field('Gols mandante (vazio: não realizado)','homeScore',item.homeScore??'')+field('Gols visitante (vazio: não realizado)','awayScore',item.awayScore??'')+field('Local da partida','venue',item.venue||'')+field('Data e hora','dateLocal',item.date?localDate(item.date):'','datetime-local');
 $('editTitle').textContent='Editar '+({championships:'campeonato',teams:'time',players:'jogador',matches:'jogo'}[col]);
 $('editFields').innerHTML=body;$('editDialog').dataset.col=col;$('editDialog').dataset.id=item.id;$('editDialog').showModal();
}
function localDate(iso){const d=new Date(iso);if(Number.isNaN(d.getTime()))return '';return new Date(d.getTime()-d.getTimezoneOffset()*60000).toISOString().slice(0,16)}
$('editCancel').onclick=()=>$('editDialog').close();
$('editSave').onclick=async()=>{
 const dlg=$('editDialog'),col=dlg.dataset.col,id=dlg.dataset.id,item=getRecord(col,id);if(!isAdmin||!item)return;
 const val=k=>dlg.querySelector(`[data-field="${k}"]`)?.value.trim()??'';
 let changes={};
 try{
 if(col==='championships'||col==='teams'||col==='players'){if(!val('name'))throw Error('Informe o nome.');changes.name=val('name')}
 if(col==='teams'){const file=$('editImage').files?.[0];if(file)changes.crest=await imageValue('editImage','');else if(val('crestUrl')){if(!safeUrl(val('crestUrl')))throw Error('URL de escudo inválida.');changes.crest=val('crestUrl')}}
 if(col==='players'){
 changes.number=val('number');for(const k of ['goals','yellow','red']){if(!/^\d+$/.test(val(k)))throw Error('Gols e cartões devem ser números inteiros positivos.');changes[k]=Number(val(k))}
 if($('editImage').files?.[0])changes.photo=await imageValue('editImage','');
 }
 if(col==='matches'){
 const hs=val('homeScore'),as=val('awayScore');if((hs==='')!==(as==='')||(hs!==''&&(!/^\d+$/.test(hs)||!/^\d+$/.test(as))))throw Error('Informe os dois placares válidos ou deixe ambos vazios.');
 changes={homeScore:hs===''?null:Number(hs),awayScore:as===''?null:Number(as),venue:val('venue'),date:val('dateLocal')?new Date(val('dateLocal')).toISOString():''};
 }
 await updateDoc(doc(db,col,id),changes);dlg.close();msg('Alterações salvas com sucesso.');
 }catch(e){msg('Erro ao editar: '+e.message);alert(e.message)}
};
document.addEventListener('click',async event=>{
 const button=event.target.closest('[data-edit],[data-delete]');if(!button)return;
 const col=button.dataset.edit||button.dataset.delete,id=button.dataset.id,item=getRecord(col,id);if(!isAdmin||!item)return;
 if(button.dataset.edit){editForm(col,item);return}
 const label={championships:'campeonato',teams:'time',players:'jogador',matches:'jogo'}[col];
 if(!confirm(`Excluir ${label} "${item.name||item.venue||id}" definitivamente?`))return;
 if(col==='championships'&&(teams.length||players.length||matches.length)){msg('Para excluir este campeonato, exclua primeiro os jogos, jogadores e times vinculados.');return}
 if(col==='teams'&&(players.some(p=>p.teamId===id)||matches.some(m=>m.homeId===id||m.awayId===id))){msg('Para excluir o time, exclua primeiro os jogos e jogadores vinculados.');return}
 try{await deleteDoc(doc(db,col,id));msg('Registro excluído.')}catch(e){msg('Erro ao excluir: '+e.message)}
});

// Imagens pequenas são armazenadas no Firestore para evitar configuração adicional de Storage.
// Limite de documento do Firestore: 1 MiB. Imagens são reduzidas no navegador.
async function imageValue(inputId,fallback){
 const file=$(inputId).files?.[0];if(!file)return fallback;
 if(!file.type.startsWith('image/'))throw Error('Selecione uma imagem.');
 const bitmap=await createImageBitmap(file),scale=Math.min(1,360/Math.max(bitmap.width,bitmap.height));
 const canvas=document.createElement('canvas');canvas.width=Math.max(1,Math.round(bitmap.width*scale));canvas.height=Math.max(1,Math.round(bitmap.height*scale));
 canvas.getContext('2d').drawImage(bitmap,0,0,canvas.width,canvas.height);bitmap.close();
 const result=canvas.toDataURL('image/jpeg',.66);
 if(result.length>650000)throw Error('Imagem muito grande. Escolha outra foto.');
 return result;
}

function statCounter(p,key,icon,klass){
 const n=Math.max(0,Number(p[key])||0);
 if(!isAdmin)return `<span>${icon} ${n}</span>`;
 return `<span class="counter ${klass}"><button type="button" data-stat="${key}" data-delta="-1" data-id="${esc(p.id)}">−</button><strong>${icon} ${n}</strong><button type="button" data-stat="${key}" data-delta="1" data-id="${esc(p.id)}">+</button></span>`;
}
document.addEventListener('click',async e=>{
 const b=e.target.closest('[data-stat]');if(!b)return;
 if(!isAdmin){msg('Entre como administrador para alterar estatísticas.');return}
 const p=players.find(x=>x.id===b.dataset.id);if(!p)return;
 const key=b.dataset.stat,delta=Number(b.dataset.delta),next=Math.max(0,(Number(p[key])||0)+delta);
 try{await updateDoc(doc(db,'players',p.id),{[key]:next});msg(`${p.name}: ${key==='goals'?'gols':key==='yellow'?'amarelos':'vermelhos'} atualizado.`)}
 catch(err){msg('Erro ao atualizar: '+err.message)}
});
document.addEventListener('click',e=>{
 const b=e.target.closest('[data-go]');if(!b)return;
 document.querySelectorAll('.app-tabs button').forEach(x=>x.classList.toggle('active',x===b));
 document.getElementById(b.dataset.go)?.scrollIntoView({behavior:'smooth',block:'start'});
});
const originalRenderStats=renderStats;
renderStats=function(){
 originalRenderStats();
 const top=players.slice().sort((a,b)=>(Number(b.goals)||0)-(Number(a.goals)||0))[0];
 const cards=players.slice().sort((a,b)=>((Number(b.yellow)||0)+(Number(b.red)||0)*2)-((Number(a.yellow)||0)+(Number(a.red)||0)*2))[0];
 const played=matches.filter(m=>Number.isInteger(m.homeScore)&&Number.isInteger(m.awayScore));
 const goalTotal=played.reduce((s,m)=>s+m.homeScore+m.awayScore,0);
 const leaders=document.getElementById('leaders');
 if(leaders)leaders.innerHTML=`<div class="leader"><b>🥇 Artilheiro</b><strong>${esc(top?.name||'A definir')} · ⚽ ${Number(top?.goals)||0}</strong></div><div class="leader"><b>🟨 Disciplina</b><strong>${esc(cards?.name||'Sem cartões')}</strong></div><div class="leader"><b>⚡ Média de gols</b><strong>${played.length?(goalTotal/played.length).toFixed(1):'0.0'} por jogo</strong></div>`;
};

// V6: cada informação abre em uma tela individual.
function openScreen(name, push=true){
  const target=document.querySelector(`.app-screen[data-screen="${name}"]`) || document.querySelector('.app-screen[data-screen="home"]');
  document.querySelectorAll('.app-screen').forEach(s=>s.classList.toggle('active',s===target));
  document.querySelectorAll('.app-tabs [data-screen-go]').forEach(b=>b.classList.toggle('active',b.dataset.screenGo===name));
  window.scrollTo({top:0,behavior:'smooth'});
  if(push){
    const u=new URL(location.href); u.searchParams.set('tela',name);
    history.pushState({screen:name},'',u);
  }
  const mirror=document.getElementById('statsMirror'), summary=document.getElementById('summary');
  if(name==='stats' && mirror && summary) mirror.innerHTML=summary.innerHTML;
}
document.addEventListener('click',e=>{
  const b=e.target.closest('[data-screen-go]'); if(!b)return;
  e.preventDefault(); openScreen(b.dataset.screenGo);
});
window.addEventListener('popstate',()=>{
  const name=new URL(location.href).searchParams.get('tela')||'home'; openScreen(name,false);
});
setTimeout(()=>openScreen(new URL(location.href).searchParams.get('tela')||'home',false),0);

// Mantém o aviso da área administrativa sincronizado com o login.
const adminObserver=new MutationObserver(()=>{
 const admin=document.getElementById('admin'), lock=document.getElementById('adminLocked');
 if(admin&&lock) lock.classList.toggle('hidden',!admin.classList.contains('hidden'));
});
const adminNode=document.getElementById('admin');
if(adminNode) adminObserver.observe(adminNode,{attributes:true,attributeFilter:['class']});

// V8: painel administrativo sempre visível; edição liberada após login.
function syncAdminAccess(){
 const section=document.getElementById('admin');
 const lock=document.getElementById('adminLocked');
 if(!section)return;
 section.classList.remove('hidden');
 section.classList.toggle('admin-locked-controls',!isAdmin);
 section.querySelectorAll('input,select,button').forEach(el=>el.disabled=!isAdmin);
 if(lock) lock.classList.toggle('hidden',isAdmin);
}
const accessObserver=new MutationObserver(()=>setTimeout(syncAdminAccess,0));
const loginBoxV8=document.getElementById('loginBox');
if(loginBoxV8) accessObserver.observe(loginBoxV8,{attributes:true,subtree:true,attributeFilter:['class']});
document.addEventListener('click',e=>{
 if(e.target.closest('[data-screen-go="admin"]')) setTimeout(syncAdminAccess,0);
});
setInterval(syncAdminAccess,1200);
setTimeout(syncAdminAccess,100);

 // V9 - Jogadores separados por equipe
let v9SelectedTeam = '';

function renderTeamsV9() {
  const area = document.getElementById('teams');
  if (!area) return;

  if (!teams.length) {
    area.innerHTML = '<p class="muted">Nenhum time cadastrado.</p>';
    return;
  }

  if (!teams.some(t => t.id === v9SelectedTeam)) {
    v9SelectedTeam = teams[0].id;
  }

  area.innerHTML = `
    <h3>Selecione uma equipe</h3>
    <div class="grid">
      ${teams.map(t => `
        <button type="button" data-v9-team="${esc(t.id)}">
          ${esc(t.name)}
        </button>
      `).join('')}
    </div>
    ${teams.filter(t => t.id === v9SelectedTeam).map(t => `
      <h3>${esc(t.name)} (${players.filter(p => p.teamId === t.id).length} jogadores)</h3>
      ${manageButtons('teams', t.id)}
      ${players.filter(p => p.teamId === t.id)
        .sort((a,b) => a.name.localeCompare(b.name))
        .map(p => `
          <div class="player-card">
            ${p.photo ? `<img class="player-photo" src="${esc(safeUrl(p.photo))}" alt="">` : ''}
            <div class="player-main">
              <b>${esc(p.number || '-')} · ${esc(p.name)}</b>
              <div class="quick-actions">
                ${statCounter(p,'goals','⚽','goal')}
                ${statCounter(p,'yellow','🟨','yellow')}
                ${statCounter(p,'red','🟥','red')}
              </div>
            </div>
            ${manageButtons('players',p.id)}
          </div>
        `).join('') || '<p class="muted">Sem jogadores cadastrados.</p>'}
    `).join('')}
  `;
}

document.addEventListener('click', e => {
  const button = e.target.closest('[data-v9-team]');
  if (!button) return;
  v9SelectedTeam = button.dataset.v9Team;
  renderTeamsV9();
});

const renderOriginalV9 = render;
render = function() {
  renderOriginalV9();
  renderTeamsV9();
};

// V10 — Placar ao vivo (não altera a classificação antes de encerrar)
function renderLiveV10(){
  const root=document.getElementById('matches');
  if(!root)return;
  const byTeam=Object.fromEntries(teams.map(t=>[t.id,t]));
  root.innerHTML=matches.slice().sort((a,b)=>(a.date||'').localeCompare(b.date||'')).map(m=>{
    const live=m.status==='live';
    const finished=m.status==='finished'||(Number.isInteger(m.homeScore)&&Number.isInteger(m.awayScore));
    const h=live?Number(m.liveHomeScore||0):finished?m.homeScore:'-';
    const a=live?Number(m.liveAwayScore||0):finished?m.awayScore:'-';
    const controls=isAdmin?`<div class="actions" style="margin-top:10px">${live?
      `<button data-live-action="homePlus" data-live-id="${esc(m.id)}">+1 ${esc(byTeam[m.homeId]?.name||'Casa')}</button><button data-live-action="homeMinus" data-live-id="${esc(m.id)}">−1 Casa</button><button data-live-action="awayPlus" data-live-id="${esc(m.id)}">+1 ${esc(byTeam[m.awayId]?.name||'Visitante')}</button><button data-live-action="awayMinus" data-live-id="${esc(m.id)}">−1 Visitante</button><button data-live-action="finish" data-live-id="${esc(m.id)}">Encerrar partida</button>`:
      !finished?`<button data-live-action="start" data-live-id="${esc(m.id)}">▶ Iniciar ao vivo</button>`:''}</div>`:'';
    return `<div class="match-card"><div class="match-score"><span>${esc(byTeam[m.homeId]?.name||'?')}</span><span class="score-pill">${h} × ${a}</span><span>${esc(byTeam[m.awayId]?.name||'?')}</span></div><p class="muted">${live?'🔴 AO VIVO · ':finished?'🏁 ENCERRADO · ':'📅 AGENDADO · '}${esc(m.date?new Date(m.date).toLocaleString('pt-BR'):'Data a definir')} · ${esc(m.venue||'Local a definir')}</p>${controls}${manageButtons('matches',m.id)}</div>`;
  }).join('')||'Nenhum jogo cadastrado.';
}
const renderBeforeLiveV10=render;
render=function(){renderBeforeLiveV10();renderLiveV10()};
// Re-renderiza a tela quando o administrador entra ou sai.
const renderStatsBeforeLiveV10=renderStats;
renderStats=function(){renderStatsBeforeLiveV10();queueMicrotask(renderLiveV10)};
let liveBusyV10=false;
document.addEventListener('click',async e=>{
  const b=e.target.closest('[data-live-action]');if(!b)return;
  if(liveBusyV10)return;
  if(!auth.currentUser){msg('Entre como administrador.');return}
  const m=matches.find(x=>x.id===b.dataset.liveId);if(!m)return;
  const op=b.dataset.liveAction;
  if(op==='start'&&(m.status==='live'||Number.isInteger(m.homeScore)||Number.isInteger(m.awayScore)))return;
  if(op!=='start'&&m.status!=='live')return;
  if(op==='finish'&&!confirm('Encerrar esta partida e registrar o placar na classificação?'))return;
  liveBusyV10=true;
  try{
    const ref=doc(db,'matches',m.id);
    if(op==='start')await updateDoc(ref,{status:'live',liveHomeScore:0,liveAwayScore:0});
    else if(op==='finish')await updateDoc(ref,{status:'finished',homeScore:Number(m.liveHomeScore||0),awayScore:Number(m.liveAwayScore||0)});
    else {
      const field=op.startsWith('home')?'liveHomeScore':'liveAwayScore';
      const delta=op.endsWith('Plus')?1:-1;
      if(delta<0&&Number(m[field]||0)<=0)return;
      await updateDoc(ref,{[field]:increment(delta)});
    }
    msg('Placar atualizado.');
  }catch(err){msg('Erro no placar ao vivo: '+err.message)}
  finally{liveBusyV10=false}
});

// V11 - Classificação avançada
function renderStandingsV11() {
  const area = document.getElementById('standings');
  if (!area) return;

  const teamRows = teams.map(t => ({
    ...t, pts: 0, j: 0, v: 0, e: 0, d: 0,
    gp: 0, gc: 0, sg: 0, recent: []
  }));

  const byId = new Map(teamRows.map(t => [t.id, t]));

  const completed = matches
    .filter(m =>
      m.status !== 'live' &&
      Number.isInteger(m.homeScore) &&
      Number.isInteger(m.awayScore)
    )
    .sort((a,b) =>
      (a.date || '').localeCompare(b.date || '')
    );

  for (const m of completed) {
    const h = byId.get(m.homeId);
    const a = byId.get(m.awayId);
    if (!h || !a) continue;

    h.j++; a.j++;
    h.gp += m.homeScore;
    h.gc += m.awayScore;
    a.gp += m.awayScore;
    a.gc += m.homeScore;

    if (m.homeScore > m.awayScore) {
      h.v++; h.pts += 3; a.d++;
      h.recent.push('V'); a.recent.push('D');
    } else if (m.homeScore < m.awayScore) {
      a.v++; a.pts += 3; h.d++;
      h.recent.push('D'); a.recent.push('V');
    } else {
      h.e++; a.e++;
      h.pts++; a.pts++;
      h.recent.push('E'); a.recent.push('E');
    }
  }

  teamRows.forEach(t => t.sg = t.gp - t.gc);

  teamRows.sort((a,b) =>
    b.pts-a.pts ||
    b.sg-a.sg ||
    b.gp-a.gp ||
    a.name.localeCompare(b.name)
  );

  const form = t => t.recent.slice(-5).map(r => {
    const color = r === 'V' ? '#16803c' :
                  r === 'E' ? '#b7791f' : '#c53030';
    return `<span style="display:inline-block;background:${color};color:white;border-radius:5px;padding:3px 6px;margin:1px;font-weight:bold">${r}</span>`;
  }).join('') || '—';

  const html = teamRows.map((t,i) => {
    const ap = t.j ? (t.pts/(t.j*3)*100).toFixed(1) : '0,0';
    const crest = t.crest && safeUrl(t.crest)
      ? `<img src="${esc(safeUrl(t.crest))}" alt="" style="width:28px;height:28px;object-fit:contain;vertical-align:middle">`
      : '';

    return `<tr>
      <td>${i+1}</td>
      <td>${crest} ${esc(t.name)}</td>
      <td><b>${t.pts}</b></td>
      <td>${t.j}</td><td>${t.v}</td>
      <td>${t.e}</td><td>${t.d}</td>
      <td>${t.gp}</td><td>${t.gc}</td>
      <td>${t.sg}</td>
      <td>${ap.replace('.',',')}%</td>
      <td style="white-space:nowrap">${form(t)}</td>
    </tr>`;
  }).join('');

  const table = area.closest('table');
  if (!table) return;

  const head = table.querySelector('thead tr');
  if (head) head.innerHTML =
    '<th>#</th><th>Time</th><th>Pts</th><th>J</th><th>V</th><th>E</th><th>D</th><th>GP</th><th>GC</th><th>SG</th><th>AP%</th><th>Últimos 5</th>';

  area.innerHTML = html;
  table.style.display = 'block';
  table.style.overflowX = 'auto';
}

const renderBeforeV11 = render;
render = function() {
  renderBeforeV11();
  renderStandingsV11();
};

// V21 - Central de Resultados e Proximas Rodadas
(function () {
  function montarCentralV21() {
    const tela = document.getElementById('homeScreen');
    if (!tela || !Array.isArray(matches) || !Array.isArray(teams)) return;

    let central = document.getElementById('centralV21');

    if (!central) {
      central = document.createElement('section');
      central.id = 'centralV21';
      central.style.cssText =
        'margin:16px 0;padding:16px;border-radius:18px;' +
        'background:#07172d;color:#fff;';

      tela.prepend(central);
    }

    const nomeTime = id =>
      teams.find(t => t.id === id)?.name || 'Equipe';

    const dataJogo = jogo => {
      if (!jogo.date) return 'Data a definir';
      const d = new Date(jogo.date);
      return Number.isNaN(d.getTime())
        ? 'Data a definir'
        : d.toLocaleString('pt-BR');
    };

    const encerrado = jogo =>
      jogo.status !== 'live' &&
      Number.isInteger(jogo.homeScore) &&
      Number.isInteger(jogo.awayScore);

    const aoVivo = matches.filter(j => j.status === 'live');

    const proximos = matches
      .filter(j => j.status !== 'live' && !encerrado(j))
      .sort((a,b) => (a.date || '').localeCompare(b.date || ''))
      .slice(0, 5);

    const resultados = matches
      .filter(encerrado)
      .sort((a,b) => (b.date || '').localeCompare(a.date || ''))
      .slice(0, 5);

    const cartao = (j, tipo) => {
      const casa = nomeTime(j.homeId);
      const fora = nomeTime(j.awayId);

      let placar = '×';

      if (tipo === 'live') {
        placar = `${Number(j.liveHomeScore || 0)} × ${Number(j.liveAwayScore || 0)}`;
      }

      if (tipo === 'finished') {
        placar = `${j.homeScore} × ${j.awayScore}`;
      }

      const titulo = tipo === 'live'
        ? '🔴 AO VIVO'
        : tipo === 'finished'
          ? '🏁 ENCERRADO'
          : '📅 AGENDADO';

      return `
        <div style="background:#fff;color:#10243d;
          padding:12px;margin:10px 0;border-radius:12px">
          <small>${titulo} · ${esc(dataJogo(j))}</small>
          <div style="display:flex;align-items:center;
            justify-content:space-between;gap:8px;margin-top:8px">
            <strong>${esc(casa)}</strong>
            <b style="white-space:nowrap">${placar}</b>
            <strong>${esc(fora)}</strong>
          </div>
          <small>${esc(j.venue || 'Local a definir')}</small>
        </div>`;
    };

    central.innerHTML = `
      <h2 style="color:#fff;margin:0 0 12px">
        ⚽ Central do Campeonato
      </h2>

      <h3 style="color:#fff">🔴 Jogos ao vivo</h3>
      ${aoVivo.map(j => cartao(j, 'live')).join('') ||
        '<p>Nenhuma partida ao vivo.</p>'}

      <h3 style="color:#fff">📅 Próximos jogos</h3>
      ${proximos.map(j => cartao(j, 'scheduled')).join('') ||
        '<p>Nenhum jogo agendado.</p>'}

      <h3 style="color:#fff">🏆 Últimos resultados</h3>
      ${resultados.map(j => cartao(j, 'finished')).join('') ||
        '<p>Nenhum resultado registrado.</p>'}
    `;
  }

  const renderAnteriorV21 = render;

  render = function () {
    renderAnteriorV21();
    montarCentralV21();
  };

  montarCentralV21();
})();

// V22 - Visual profissional dos jogos
(function () {
  const estilo = document.createElement('style');
  estilo.textContent = `
    .v22-card {
      background: linear-gradient(145deg,#071a35,#103e72);
      color: white;
      border: 1px solid #3266a0;
      border-radius: 20px;
      padding: 18px 14px;
      margin: 14px 0;
      box-shadow: 0 10px 25px #071a3525;
    }
    .v22-status {
      text-align: center;
      font-size: 12px;
      font-weight: 800;
      color: #ffd76a;
      margin-bottom: 15px;
    }
    .v22-confronto {
      display: grid;
      grid-template-columns: minmax(0,1fr) auto minmax(0,1fr);
      align-items: center;
      gap: 10px;
    }
    .v22-equipe {
      text-align: center;
      min-width: 0;
      overflow-wrap: anywhere;
      font-weight: 800;
      font-size: 14px;
    }
    .v22-escudo {
      display: block;
      width: 65px;
      height: 65px;
      object-fit: contain;
      margin: 0 auto 10px;
    }
    .v22-placar {
      font-size: 29px;
      font-weight: 900;
      white-space: nowrap;
      color: #fff;
    }
    .v22-info {
      text-align: center;
      margin-top: 16px;
      padding-top: 12px;
      border-top: 1px solid #ffffff30;
      color: #dce8fa;
      font-size: 13px;
    }
    @media(max-width:380px) {
      .v22-escudo {width:48px;height:48px}
      .v22-placar {font-size:23px}
      .v22-equipe {font-size:12px}
    }
  `;
  document.head.appendChild(estilo);

  function montarJogosV22() {
    const area = document.getElementById('games');
    if (!area || !Array.isArray(matches) ||
        !Array.isArray(teams)) return;

    const nome = id =>
      teams.find(t => t.id === id)?.name || 'Equipe';

    const escudo = id => {
      const time = teams.find(t => t.id === id);
      const url = safeUrl(time?.crest || '');
      return url
        ? `<img class="v22-escudo" src="${esc(url)}" alt="Escudo">`
        : '<div style="font-size:40px">🛡️</div>';
    };

    const jogos = matches.slice().sort((a,b) =>
      (a.date || '').localeCompare(b.date || '')
    );

    area.innerHTML = jogos.map(j => {
      const encerrado =
        Number.isInteger(j.homeScore) &&
        Number.isInteger(j.awayScore);

      const aoVivo = j.status === 'live';

      const status = aoVivo
        ? '🔴 AO VIVO'
        : encerrado
          ? '🏁 ENCERRADO'
          : '📅 AGENDADO';

      const placar = aoVivo
        ? `${Number(j.liveHomeScore || 0)} × ${Number(j.liveAwayScore || 0)}`
        : encerrado
          ? `${j.homeScore} × ${j.awayScore}`
          : 'X';

      const data = j.date &&
        !Number.isNaN(new Date(j.date).getTime())
          ? new Date(j.date).toLocaleString('pt-BR')
          : 'Data a definir';

      return `
        <article class="v22-card">
          <div class="v22-status">${status}</div>
          <div class="v22-confronto">
            <div class="v22-equipe">
              ${escudo(j.homeId)}
              ${esc(nome(j.homeId))}
            </div>
            <div class="v22-placar">${placar}</div>
            <div class="v22-equipe">
              ${escudo(j.awayId)}
              ${esc(nome(j.awayId))}
            </div>
          </div>
          <div class="v22-info">
            📅 ${esc(data)}
            <div>📍 ${esc(j.venue || 'Local a definir')}</div>
          </div>
        </article>
      `;
    }).join('') ||
      '<p class="muted">Nenhum jogo cadastrado.</p>';
  }

  const renderAnteriorV22 = render;
  render = function () {
    renderAnteriorV22();
    montarJogosV22();
  };

  montarJogosV22();
})();

// V23 - Placar profissional com escudos
(function () {
  function montarJogosV23() {
    const area = document.getElementById('games');
    if (!area || !Array.isArray(matches) || !Array.isArray(teams)) return;

    const estiloId = 'estiloJogosV23';
    if (!document.getElementById(estiloId)) {
      const estilo = document.createElement('style');
      estilo.id = estiloId;
      estilo.textContent = `
        .v23-card {
          background: linear-gradient(145deg,#07132f,#142b50);
          border: 1px solid #36517b;
          border-radius: 18px;
          padding: 20px 14px;
          margin: 14px 0;
          color: white;
          box-shadow: 0 8px 22px #0003;
        }
        .v23-status {
          text-align: center;
          font-size: 12px;
          font-weight: 800;
          color: #f2c35b;
          margin-bottom: 16px;
        }
        .v23-confronto {
          display: grid;
          grid-template-columns: minmax(0,1fr) auto minmax(0,1fr);
          align-items: center;
          gap: 8px;
        }
        .v23-equipe {
          display: flex;
          flex-direction: column;
          align-items: center;
          gap: 9px;
          min-width: 0;
          text-align: center;
          font-weight: 800;
          font-size: 13px;
          overflow-wrap: anywhere;
        }
        .v23-escudo {
          width: 85px;
          height: 85px;
          object-fit: contain;
        }
        .v23-sem-escudo {
          font-size: 48px;
          line-height: 70px;
        }
        .v23-centro {
          font-size: 23px;
          font-weight: 900;
          color: #f5c452;
          white-space: nowrap;
        }
        .v23-info {
          margin-top: 17px;
          padding-top: 13px;
          border-top: 1px solid #ffffff30;
          text-align: center;
          font-size: 13px;
          color: #dce8ff;
          line-height: 1.8;
        }
        @media(min-width:700px) {
          .v23-escudo {width:90px;height:90px}
          .v23-equipe {font-size:17px}
          .v23-centro {font-size:30px}
        }
      `;
      document.head.appendChild(estilo);
    }

    const nome = id => teams.find(t => t.id === id)?.name || 'Equipe';
    const escudo = id => {
      const time = teams.find(t => t.id === id);
      const url = safeUrl(time?.crest || '');
      return url
        ? `<img class="v23-escudo" src="${esc(url)}" alt="Escudo">`
        : '<span class="v23-sem-escudo">🛡️</span>';
    };

    const jogos = matches.slice().sort((a,b) =>
      (a.date || '').localeCompare(b.date || '')
    );

    area.innerHTML = jogos.map(j => {
      const finalizado =
        Number.isInteger(j.homeScore) &&
        Number.isInteger(j.awayScore);

      const aoVivo = j.status === 'live';

      const status = aoVivo
        ? '🔴 AO VIVO'
        : finalizado
          ? '🏁 ENCERRADO'
          : '📅 JOGO AGENDADO';

      const centro = aoVivo
        ? `${Number(j.liveHomeScore || 0)} × ${Number(j.liveAwayScore || 0)}`
        : finalizado
          ? `${j.homeScore} × ${j.awayScore}`
          : 'VS';

      const dataValida = j.date &&
        !Number.isNaN(new Date(j.date).getTime());

      const data = dataValida
        ? new Date(j.date).toLocaleDateString('pt-BR')
        : 'Data a definir';

      const hora = dataValida
        ? new Date(j.date).toLocaleTimeString('pt-BR', {
            hour: '2-digit',
            minute: '2-digit'
          })
        : 'Horário a definir';

      return `
        <article class="v23-card">
          <div class="v23-status">${status}</div>
          <div class="v23-confronto">
            <div class="v23-equipe">
              ${escudo(j.homeId)}
              <span>${esc(nome(j.homeId))}</span>
            </div>
            <div class="v23-centro">${centro}</div>
            <div class="v23-equipe">
              ${escudo(j.awayId)}
              <span>${esc(nome(j.awayId))}</span>
            </div>
          </div>
          <div class="v23-info">
            📅 ${esc(data)} · 🕒 ${esc(hora)}
            <div>📍 ${esc(j.venue || 'Local a definir')}</div>
          </div>
        </article>
      `;
    }).join('') || '<p class="muted">Nenhum jogo cadastrado.</p>';
  }

  const renderAnteriorV23 = render;
  render = function () {
    renderAnteriorV23();
    montarJogosV23();
  };

  montarJogosV23();
})();

// V25 - Corrigir placares com escudos e preservar botoes
(function () {
  function corrigirJogosV25() {
    const area = document.getElementById('matches');
    if (!area) return;

    const nome = id => teams.find(t => t.id === id)?.name || 'Equipe';
    const escudo = id => {
      const time = teams.find(t => t.id === id);
      const url = safeUrl(time?.crest || '');
      return url
        ? `<img class="v23-escudo" src="${esc(url)}" alt="Escudo">`
        : '<span class="v23-sem-escudo">🛡️</span>';
    };

    area.innerHTML = matches.slice()
      .sort((a, b) => (a.date || '').localeCompare(b.date || ''))
      .map(j => {
        const finalizado = Number.isInteger(j.homeScore) &&
          Number.isInteger(j.awayScore);
        const aoVivo = j.status === 'live';

        const placar = aoVivo
          ? `${Number(j.liveHomeScore || 0)} × ${Number(j.liveAwayScore || 0)}`
          : finalizado
            ? `${j.homeScore} × ${j.awayScore}`
            : 'VS';

        const data = j.date && !Number.isNaN(new Date(j.date).getTime())
          ? new Date(j.date).toLocaleString('pt-BR')
          : 'Data a definir';

        return `
          <article class="v23-card">
            <div class="v23-status">
              ${aoVivo ? '🔴 AO VIVO' : finalizado ? '🏁 ENCERRADO' : '📅 AGENDADO'}
            </div>
            <div class="v23-confronto">
              <div class="v23-equipe">
                ${escudo(j.homeId)}
                <span>${esc(nome(j.homeId))}</span>
              </div>
              <div class="v23-centro">${placar}</div>
              <div class="v23-equipe">
                ${escudo(j.awayId)}
                <span>${esc(nome(j.awayId))}</span>
              </div>
            </div>
            <div class="v23-info">
              📅 ${esc(data)}
              <div>📍 ${esc(j.venue || 'Local a definir')}</div>
            </div>
            ${manageButtons('matches', j.id)}
             <button type="button" class="compartilhar-resultado" data-match-id="${esc(j.id)}">
  📤 Compartilhar resultado
</button>
          </article>
        `;
      }).join('') || '<p class="muted">Nenhum jogo cadastrado.</p>';
  }

  const renderAnteriorV25 = render;
  render = function () {
    renderAnteriorV25();
    corrigirJogosV25();
  };

  corrigirJogosV25();
})();

/* Compartilhar resultado - etapa 1 */
document.addEventListener('click', async (evento) => {
  const botao = evento.target.closest('.compartilhar-resultado');
  if (!botao) return;

  const cartao = botao.closest('.v23-card');
  if (!cartao) {
    alert('Não foi possível encontrar a partida.');
    return;
  }

  const equipes = [...cartao.querySelectorAll('.v23-equipe span')];
  const placar = cartao.querySelector('.v23-centro')?.textContent?.trim() || 'VS';

  const mensagem = [
    '🏆 5º CAMPEONATO AMIGOS DA BOLA 2026',
    '',
    `${equipes[0]?.textContent?.trim() || 'Equipe'} ${placar} ${equipes[1]?.textContent?.trim() || 'Equipe'}`,
    '',
    '⚽ AL Amigos Da Bola'
  ].join('\n');

  if (navigator.share) {
    try {
      await navigator.share({ text: mensagem });
    } catch (erro) {
      if (erro.name !== 'AbortError') {
        await navigator.clipboard.writeText(mensagem);
        alert('Resultado copiado!');
      }
    }
  } else {
    await navigator.clipboard.writeText(mensagem);
    alert('Resultado copiado para compartilhar!');
  }
});
/* V26 - Exibir botão Compartilhar nos jogos */

function adicionarBotoesCompartilharV26() {
  const area = document.getElementById('matches');
  if (!area) return;

  area.querySelectorAll('.match-card, .v23-card').forEach(cartao => {
    if (cartao.querySelector('.compartilhar-resultado')) return;

    const botao = document.createElement('button');
    botao.type = 'button';
    botao.className = 'compartilhar-resultado';
    botao.textContent = '📤 Compartilhar resultado';
    botao.style.cssText =
      'display:block;width:100%;margin-top:12px;padding:12px;' +
      'border-radius:10px;background:#071a31;color:white;' +
      'font-weight:bold;cursor:pointer;';

    cartao.appendChild(botao);
  });
}

const renderAnteriorV26 = render;

render = function () {
  renderAnteriorV26();
  adicionarBotoesCompartilharV26();
};

adicionarBotoesCompartilharV26();
/* V27 - Compartilhar jogos no modelo atual */

function compartilharJogosV27() {
  const area = document.getElementById('matches');
  if (!area) return;

  area.querySelectorAll('.match-card').forEach(cartao => {
    if (cartao.querySelector('.compartilhar-v27')) return;

    const botao = document.createElement('button');
    botao.type = 'button';
    botao.className = 'compartilhar-v27';
    botao.textContent = '📤 Compartilhar resultado';
    botao.style.cssText =
      'display:block;margin-top:12px;padding:12px;' +
      'width:100%;border-radius:10px;background:#071a31;' +
      'color:white;font-weight:bold;cursor:pointer;';

    botao.addEventListener('click', async () => {
      const texto = [
        '🏆 5º CAMPEONATO AMIGOS DA BOLA 2026',
        '',
        cartao.querySelector('.match-score')?.innerText ||
          cartao.innerText.split('\n')[0],
        '',
        '⚽ AL Amigos Da Bola'
      ].join('\n');

      try {
        if (navigator.share) {
          await navigator.share({ text: texto });
        } else {
          await navigator.clipboard.writeText(texto);
          alert('Resultado copiado!');
        }
      } catch (erro) {
        if (erro.name !== 'AbortError') {
          alert('Não foi possível compartilhar.');
        }
      }
    });

    cartao.appendChild(botao);
  });
}

const renderAnteriorV27 = render;

render = function () {
  renderAnteriorV27();
  compartilharJogosV27();
};

compartilharJogosV27();
