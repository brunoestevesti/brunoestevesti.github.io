// App Finanças - versão segura (sem erros de sintaxe) 
if (typeof window.loadUserData !== 'function') {
  window.loadUserData = async function(username){
    try{
      const res = await fetch(`${window.BACKEND_URL}/load/${encodeURIComponent(username)}`, {
        headers: { 'x-api-key': window.API_KEY }
      });
      const json = await res.json();
      return (json && json.data) ? json.data : { despesas: [] };
    }catch(e){
      console.error('Falha ao carregar dados remotos:', e);
      return { despesas: [] };
    }
  };
}
if (typeof window.saveUserData !== 'function') {
  window.saveUserData = async function(username, userData){
    try{
      const res = await fetch(`${window.BACKEND_URL}/save`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-api-key': window.API_KEY
        },
        body: JSON.stringify({ username, userData })
      });
      const json = await res.json();
      if(!json.ok){ throw new Error('Erro ao salvar'); }
    }catch(e){
      console.error('Falha ao salvar dados remotos:', e);
    }
  };
}
if (typeof window.persistNow !== 'function') {
  window.persistNow = async function(){
    try{
      const user = (window.authSystem && typeof window.authSystem.currentUser === 'function') ? window.authSystem.currentUser() : null;
      if(user && window.financasApp){
        await window.saveUserData(user, { despesas: window.financasApp.despesas || [] });
      }
    }catch(e){ console.error(e); }
  };
}

function hashPassword(password) {
  let hash = 0;
  for (let i = 0; i < password.length; i++) {
    const char = password.charCodeAt(i);
    hash = ((hash << 5) - hash) + char;
    hash = hash & hash;
  }
  return hash.toString();
}

function notify(message, type) {
  const el = document.createElement('div');
  el.textContent = message;
  el.style.position = 'fixed';
  el.style.top = '20px';
  el.style.right = '20px';
  el.style.color = '#fff';
  el.style.padding = '12px 16px';
  el.style.borderRadius = '8px';
  el.style.zIndex = 1001;
  el.style.boxShadow = '0 4px 12px rgba(0,0,0,.15)';
  el.style.background = (type === 'error') ? '#DB4545' : (type === 'success') ? '#1FB8CD' : '#5D878F';
  document.body.appendChild(el);
  setTimeout(()=>{ if(el.parentNode) el.remove(); }, 3000);
}

function initializeApp(){
  const users = new Map();
  users.set('bruno_talita', { username: 'bruno_talita', password: hashPassword('123456') });

  let currentUser = null;
  let isLoggedIn = false;

  function showLoginForm(){
    const loginForm = document.getElementById('loginForm');
    const registerForm = document.getElementById('registerForm');
    const resetForm = document.getElementById('resetForm');
    if (loginForm) loginForm.style.display = 'block';
    if (registerForm) registerForm.style.display = 'none';
    if (resetForm) resetForm.style.display = 'none';
  }
  function showRegisterForm(){
    const loginForm = document.getElementById('loginForm');
    const registerForm = document.getElementById('registerForm');
    const resetForm = document.getElementById('resetForm');
    if (loginForm) loginForm.style.display = 'none';
    if (registerForm) registerForm.style.display = 'block';
    if (resetForm) resetForm.style.display = 'none';
  }
  function showResetForm(){
    const loginForm = document.getElementById('loginForm');
    const registerForm = document.getElementById('registerForm');
    const resetForm = document.getElementById('resetForm');
    if (loginForm) loginForm.style.display = 'none';
    if (registerForm) registerForm.style.display = 'none';
    if (resetForm) resetForm.style.display = 'block';
  }
  function showMainApp(){
    const loginScreen = document.getElementById('loginScreen');
    const mainApp = document.getElementById('mainApp');
    if (loginScreen) loginScreen.style.display = 'none';
    if (mainApp) mainApp.style.display = 'block';
    const loggedUserName = document.getElementById('loggedUserName');
    if (loggedUserName && currentUser) loggedUserName.textContent = currentUser;
    if (window.financasApp) window.financasApp.updateDashboard();
  }
  function showLoginScreen(){
    const loginScreen = document.getElementById('loginScreen');
    const mainApp = document.getElementById('mainApp');
    if (loginScreen) loginScreen.style.display = 'flex';
    if (mainApp) mainApp.style.display = 'none';
    showLoginForm();
  }
  function handleLogin(e){
    if(e){ e.preventDefault(); e.stopPropagation(); }
    const u = document.getElementById('loginUser');
    const p = document.getElementById('loginPassword');
    const username = u ? u.value.trim() : '';
    const password = p ? p.value : '';
    if(!username || !password){ notify('Preencha usuário e senha', 'error'); return false; }
    const user = users.get(username);
    if(!user || user.password !== hashPassword(password)){ notify('Usuário ou senha incorretos', 'error'); return false; }
    currentUser = username;
    isLoggedIn = true;
    if(u) u.value=''; if(p) p.value='';
    showMainApp();
    window.loadUserData(currentUser).then(data => {
      if(window.financasApp){
        window.financasApp.despesas = Array.isArray(data && data.despesas) ? data.despesas : [];
        window.financasApp.updateDashboard();
      } else {
        window.__pendingDespesas = Array.isArray(data && data.despesas) ? data.despesas : [];
      }
    });
    notify(`Bem-vindo, ${username}!`,'success');
    return false;
  }
  function handleRegister(e){
    if(e){ e.preventDefault(); e.stopPropagation(); }
    const u = document.getElementById('registerUser');
    const p = document.getElementById('registerPassword');
    const c = document.getElementById('confirmPassword');
    const username = u ? u.value.trim() : '';
    const password = p ? p.value : '';
    const confirm = c ? c.value : '';
    if(!username || !password || !confirm){ notify('Preencha todos os campos', 'error'); return false; }
    if(password !== confirm){ notify('As senhas não coincidem', 'error'); return false; }
    if(password.length < 4){ notify('Senha muito curta', 'error'); return false; }
    if(users.has(username)){ notify('Usuário já existe', 'error'); return false; }
    users.set(username, { username, password: hashPassword(password) });
    if(u) u.value=''; if(p) p.value=''; if(c) c.value='';
    showLoginForm();
    notify('Conta criada! Faça login.', 'success');
    return false;
  }
  function handleResetPassword(e){
    if(e){ e.preventDefault(); e.stopPropagation(); }
    const u = document.getElementById('resetUser');
    const n = document.getElementById('newPassword');
    const c = document.getElementById('confirmNewPassword');
    const username = u ? u.value.trim() : '';
    const np = n ? n.value : '';
    const cp = c ? c.value : '';
    if(!username || !np || !cp){ notify('Preencha todos os campos', 'error'); return false; }
    if(np !== cp){ notify('As senhas não coincidem', 'error'); return false; }
    if(np.length < 4){ notify('Senha muito curta', 'error'); return false; }
    if(!users.has(username)){ notify('Usuário não encontrado', 'error'); return false; }
    users.set(username, { username, password: hashPassword(np) });
    if(u) u.value=''; if(n) n.value=''; if(c) c.value='';
    showLoginForm();
    notify('Senha redefinida!', 'success');
    return false;
  }
  function handleLogout(){
    currentUser = null; isLoggedIn = false; showLoginScreen(); notify('Logout ok', 'success');
  }
  function setupEvents(){
    const loginForm = document.getElementById('loginFormElement');
    if(loginForm){ loginForm.onsubmit = handleLogin; }
    const registerForm = document.getElementById('registerFormElement');
    if(registerForm){ registerForm.onsubmit = handleRegister; }
    const resetForm = document.getElementById('resetFormElement');
    if(resetForm){ resetForm.onsubmit = handleResetPassword; }
    const showRegisterBtn = document.getElementById('showRegisterBtn');
    if(showRegisterBtn){ showRegisterBtn.onclick = (e)=>{ e.preventDefault(); showRegisterForm(); }; }
    const showLoginBtn = document.getElementById('showLoginBtn');
    if(showLoginBtn){ showLoginBtn.onclick = (e)=>{ e.preventDefault(); showLoginForm(); }; }
    const resetPasswordBtn = document.getElementById('resetPasswordBtn');
    if(resetPasswordBtn){ resetPasswordBtn.onclick = (e)=>{ e.preventDefault(); showResetForm(); }; }
    const backToLoginBtn = document.getElementById('backToLoginBtn');
    if(backToLoginBtn){ backToLoginBtn.onclick = (e)=>{ e.preventDefault(); showLoginForm(); }; }
    const logoutBtn = document.getElementById('logoutBtn');
    if(logoutBtn){ logoutBtn.onclick = (e)=>{ e.preventDefault(); handleLogout(); }; }
  }
  setupEvents();
  showLoginScreen();
  console.log('Auth pronto. Demo: bruno_talita / 123456');

  return { 
    isLoggedIn: ()=>isLoggedIn, 
    currentUser: ()=>currentUser, 
    showMainApp, showLoginScreen 
  };
}

class FinancasApp {
  constructor(){
    this.despesas = [];
    this.categorias = ['Alimentação','Moradia','Transporte','Lazer','Saúde','Outros'];
    this.chart = null;
    this.nextId = 1;
    setTimeout(()=>this.init(), 300);
  }
  init(){
    this.setupNavigation();
    this.setupForms();
    this.updateDashboard();
    if (window.__pendingDespesas && Array.isArray(window.__pendingDespesas)) {
      this.despesas = window.__pendingDespesas; window.__pendingDespesas = null; this.updateDashboard();
    }
    console.log('Finanças pronto');
  }
  setupNavigation(){
    const navButtons = document.querySelectorAll('.nav-btn');
    const sections = document.querySelectorAll('.section');
    navButtons.forEach(btn => {
      btn.onclick = (e)=>{
        e.preventDefault();
        const target = btn.getAttribute('data-section');
        navButtons.forEach(b => b.classList.remove('nav-btn--active'));
        btn.classList.add('nav-btn--active');
        sections.forEach(s => s.classList.remove('section--active'));
        const el = document.getElementById(target); if(el){ el.classList.add('section--active'); }
        if(target==='dashboard'){ setTimeout(()=>this.updateDashboard(), 100); }
      };
    });
  }
  setupForms(){
    const form = document.getElementById('despesaForm');
    if(form){
      form.onsubmit = (e)=>{
        e.preventDefault(); this.adicionarDespesa();
      };
    }
    const recorrenteCheckbox = document.getElementById('recorrente');
    const frequenciaGroup = document.getElementById('frequenciaGroup');
    if(recorrenteCheckbox && frequenciaGroup){
      recorrenteCheckbox.onchange = ()=>{
        frequenciaGroup.style.display = recorrenteCheckbox.checked ? 'block' : 'none';
        if(!recorrenteCheckbox.checked){ const f = document.getElementById('frequencia'); if(f) f.value=''; }
      };
    }
    const acertarBtn = document.getElementById('acertarContasBtn');
    if(acertarBtn){ acertarBtn.onclick = (e)=>{ e.preventDefault(); this.acertarContas(); }; }
  }
  showMessage(msg, type){ notify(msg, type); }
  formatMoney(v){ return v.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' }); }
  formatDate(iso){ const d=new Date(iso); return d.toLocaleDateString('pt-BR'); }
  calcularSaldo(){
    let b=0,t=0; this.despesas.forEach(d=>{ if(d.quem_pagou==='Bruno') b+=d.valor; else if(d.quem_pagou==='Talita') t+=d.valor; });
    const total=b+t, porPessoa=total/2, saldo=b-porPessoa; return { gastoBruno:b, gastoTalita:t, saldo, totalGastos:total };
  }
  updateDashboard(){
    const { gastoBruno, gastoTalita, saldo } = this.calcularSaldo();
    const gb=document.getElementById('gastoBruno'), gt=document.getElementById('gastoTalita');
    if(gb) gb.textContent=this.formatMoney(gastoBruno);
    if(gt) gt.textContent=this.formatMoney(gastoTalita);
    const sv=document.getElementById('saldoValor'), ss=document.getElementById('saldoStatus');
    if(sv && ss){
      if (Math.abs(saldo) < 0.01) { sv.textContent='R$ 0,00'; ss.textContent='Contas em dia'; ss.className='saldo-status'; }
      else if (saldo > 0) { sv.textContent=this.formatMoney(Math.abs(saldo)); ss.textContent='Talita deve para Bruno'; ss.className='saldo-status saldo-status--recebendo'; }
      else { sv.textContent=this.formatMoney(Math.abs(saldo)); ss.textContent='Bruno deve para Talita'; ss.className='saldo-status saldo-status--devendo'; }
    }
    this.updateGastosRecentes();
    setTimeout(()=>this.updateCategoryChart(), 100);
  }
  updateGastosRecentes(){
    const container=document.getElementById('gastosRecentesLista');
    if(!container) return;
    const rec=[...this.despesas].sort((a,b)=> new Date(b.data)-new Date(a.data)).slice(0,5);
    if(rec.length===0){
      container.innerHTML = ''
        + '<div class="empty-state">'
        + '  <div class="empty-state-icon">📄</div>'
        + '  <p>Nenhuma despesa registrada ainda</p>'
        + '  <small>Adicione sua primeira despesa para começar</small>'
        + '</div>';
      return;
    }
    container.innerHTML = rec.map(d=>{
      return ''
        + '<div class="gasto-recente-item">'
        + '  <div class="gasto-recente-info">'
        + '    <div class="gasto-recente-descricao">'+ d.descricao +'</div>'
        + '    <div class="gasto-recente-detalhes">'
        + '      <span>📅 '+ this.formatDate(d.data) +'</span>'
        + '      <span>🏷️ '+ d.categoria +'</span>'
        + '      <span>👤 '+ d.quem_pagou +'</span>'
        + (d.recorrente ? '<span>🔄 Recorrente</span>' : '')
        + '    </div>'
        + '  </div>'
        + '  <div class="gasto-recente-valor">'+ this.formatMoney(d.valor) +'</div>'
        + '  <div class="gasto-recente-actions">'
        + '    <button class="btn-icon btn-icon--delete" onclick="financasApp.deletarDespesa('+ d.id +')" title="Excluir">🗑️</button>'
        + '  </div>'
        + '</div>';
    }).join('');
  }
  updateCategoryChart(){
    const canvas=document.getElementById('categoryChart');
    if(!canvas) return;
    const ctx=canvas.getContext('2d');
    if (typeof Chart === 'undefined' || window.__NO_CHART__) {
      ctx.clearRect(0,0,canvas.width,canvas.height);
      ctx.font='16px Arial'; ctx.fillStyle='#666'; ctx.textAlign='center';
      ctx.fillText('Gráfico indisponível (Chart.js não carregado)', canvas.width/2, canvas.height/2);
      return;
    }
    const totals={}; ['Alimentação','Moradia','Transporte','Lazer','Saúde','Outros'].forEach(c=> totals[c]=0);
    this.despesas.forEach(d=>{ if(totals.hasOwnProperty(d.categoria)) totals[d.categoria]+=d.valor; });
    const labels=[], data=[];
    Object.entries(totals).forEach(([c,t])=>{ if(t>0){ labels.push(c); data.push(t); } });
    if(this.chart){ this.chart.destroy(); this.chart=null; }
    if(data.length===0){
      ctx.clearRect(0,0,canvas.width,canvas.height);
      ctx.font='16px Arial'; ctx.fillStyle='#666'; ctx.textAlign='center';
      ctx.fillText('Nenhuma despesa por categoria', canvas.width/2, canvas.height/2);
      return;
    }
    this.chart = new Chart(ctx, {
      type: 'doughnut',
      data: { labels: labels, datasets: [{ data: data }] },
      options: { responsive: true, plugins: { legend: { position: 'bottom' } } }
    });
  }
  adicionarDespesa(){
    const descricaoEl=document.getElementById('descricao');
    const valorEl=document.getElementById('valor');
    const categoriaEl=document.getElementById('categoria');
    const quemPagouEl=document.getElementById('quemPagou');
    const recorrenteEl=document.getElementById('recorrente');
    const frequenciaEl=document.getElementById('frequencia');
    const frequenciaGroup=document.getElementById('frequenciaGroup');

    const descricao=descricaoEl?descricaoEl.value.trim():'';
    const valor=valorEl?parseFloat(valorEl.value):NaN;
    const categoria=categoriaEl?categoriaEl.value:'';
    const quem=quemPagouEl?quemPagouEl.value:'';
    const rec=recorrenteEl?recorrenteEl.checked:false;
    if (!descricao || !valor || valor<=0 || !categoria || !quem) {
      this.showMessage('Por favor, preencha todos os campos obrigatórios.', 'error');
      return;
    }
    const item={ id:this.nextId++, descricao:descricao, valor:valor, categoria:categoria, quem_pagou:quem, recorrente:rec, data:new Date().toISOString().split('T')[0] };
    if(rec){
      const f=frequenciaEl?frequenciaEl.value:'';
      if(!f){ this.showMessage('Selecione a frequência', 'error'); return; }
      item.frequencia=f;
    }
    this.despesas.push(item);
    if(descricaoEl) descricaoEl.value='';
    if(valorEl) valorEl.value='';
    if(categoriaEl) categoriaEl.value='';
    if(quemPagouEl) quemPagouEl.value='';
    if(recorrenteEl) recorrenteEl.checked=false;
    if(frequenciaGroup) frequenciaGroup.style.display='none';
    this.updateDashboard();
    this.showMessage('Despesa adicionada com sucesso!', 'success');
    if (typeof window.persistNow === 'function') { window.persistNow(); }
    const dashboardBtn=document.querySelector('[data-section="dashboard"]');
    if(dashboardBtn) dashboardBtn.click();
  }
  deletarDespesa(id){
    this.despesas = this.despesas.filter(d=> d.id !== id);
    this.updateDashboard();
    if (typeof window.persistNow === 'function') { window.persistNow(); }
  }
  acertarContas(){ this.showMessage('Funcionalidade de acerto ainda não implementada.', 'info'); }
}

window.addEventListener('DOMContentLoaded', ()=>{
  window.authSystem = initializeApp();
  window.financasApp = new FinancasApp();
});
