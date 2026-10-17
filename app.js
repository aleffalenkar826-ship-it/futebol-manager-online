import {initializeApp} from 'https://www.gstatic.com/firebasejs/10.14.1/firebase-app.js';
import {getAuth,onAuthStateChanged,signInWithEmailAndPassword,signOut} from 'https://www.gstatic.com/firebasejs/10.14.1/firebase-auth.js';
import {getFirestore,collection,addDoc,updateDoc,deleteDoc,doc,onSnapshot,query,where} from 'https://www.gstatic.com/firebasejs/10.14.1/firebase-firestore.js';
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
