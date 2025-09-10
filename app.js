
// === Persistência remota via backend ===
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

window.persistNow = async function(){
  try{
    const user = (window.authSystem && typeof window.authSystem.currentUser === 'function') ? window.authSystem.currentUser() : null;
    if(user && window.financasApp){
      await window.saveUserData(user, { despesas: window.financasApp.despesas || [] });
    }
  }catch(e){ console.error(e); }
};

// Sistema de Autenticação e Finanças Pessoais - Bruno e Talita
// Versão simplificada e robusta

let authSystem;
let financasApp;

// Função principal de inicialização
function initializeApp() {
    console.log('Initializing app...');
    
    // Demo user credentials
    const demoUser = {
        username: 'bruno_talita',
        password: hashPassword('123456')
    };
    
    // Users storage
    const users = new Map();
    users.set('bruno_talita', demoUser);
    
    let currentUser = null;
    let isLoggedIn = false;

    // Hash function
    function hashPassword(password) {
        let hash = 0;
        for (let i = 0; i < password.length; i++) {
            const char = password.charCodeAt(i);
            hash = ((hash << 5) - hash) + char;
            hash = hash & hash;
        }
        return hash.toString();
    }

    // Show notification
    function showNotification(message, type = 'info') {
        const notification = document.createElement('div');
        notification.textContent = message;
        
        const bgColor = type === 'error' ? 'var(--color-error)' : 
                        type === 'success' ? 'var(--color-success)' : 'var(--color-info)';
        
        notification.style.cssText = `
            position: fixed;
            top: 20px;
            right: 20px;
            background: ${bgColor};
            color: var(--color-white);
            padding: 12px 16px;
            border-radius: 8px;
            box-shadow: 0 4px 12px rgba(0,0,0,0.15);
            z-index: 1001;
            font-weight: 500;
            max-width: 300px;
            animation: slideIn 0.3s ease;
        `;
        
        document.body.appendChild(notification);
        
        setTimeout(() => {
            if (notification.parentNode) {
                notification.remove();
            }
        }, 4000);
    }

    // Login function
    function handleLogin(event) {
        if (event) {
            event.preventDefault();
            event.stopPropagation();
        }
        
        console.log('Login attempt...');
        
        const usernameInput = document.getElementById('loginUser');
        const passwordInput = document.getElementById('loginPassword');
        
        if (!usernameInput || !passwordInput) {
            showNotification('Erro: Campos de login não encontrados', 'error');
            return false;
        }
        
        const username = usernameInput.value.trim();
        const password = passwordInput.value;
        
        console.log('Login data:', { username, passwordLength: password.length });
        
        if (!username || !password) {
            showNotification('Por favor, preencha todos os campos.', 'error');
            return false;
        }
        
        const user = users.get(username);
        const hashedPassword = hashPassword(password);
        
        if (!user || user.password !== hashedPassword) {
            showNotification('Usuário ou senha incorretos.', 'error');
            return false;
        }
        
        // Login successful
        currentUser = username;
        isLoggedIn = true;
        
        // Clear form
        usernameInput.value = '';
        passwordInput.value = '';
        
        // Show main app
        showMainApp();
        // Carregar dados remotos do usuário e atualizar o app
        if (typeof window.loadUserData === 'function') {
            window.loadUserData(currentUser).then(data => {
                if (window.financasApp) {
                    window.financasApp.despesas = Array.isArray(data?.despesas) ? data.despesas : [];
                    window.financasApp.updateDashboard();
                } else {
                    window.__pendingDespesas = Array.isArray(data?.despesas) ? data.despesas : [];
                }
            }).catch(err => console.error(err));
        }
        
        showNotification(`Bem-vindo, ${username}!`, 'success');
        
        return false;
    }

    // Registration function
    function handleRegister(event) {
        if (event) {
            event.preventDefault();
            event.stopPropagation();
        }
        
        const usernameInput = document.getElementById('registerUser');
        const passwordInput = document.getElementById('registerPassword');
        const confirmInput = document.getElementById('confirmPassword');
        
        if (!usernameInput || !passwordInput || !confirmInput) {
            showNotification('Erro: Campos de registro não encontrados', 'error');
            return false;
        }
        
        const username = usernameInput.value.trim();
        const password = passwordInput.value;
        const confirmPassword = confirmInput.value;
        
        if (!username || !password || !confirmPassword) {
            showNotification('Por favor, preencha todos os campos.', 'error');
            return false;
        }
        
        if (password !== confirmPassword) {
            showNotification('As senhas não coincidem.', 'error');
            return false;
        }
        
        if (password.length < 4) {
            showNotification('A senha deve ter pelo menos 4 caracteres.', 'error');
            return false;
        }
        
        if (users.has(username)) {
            showNotification('Este usuário já existe.', 'error');
            return false;
        }
        
        // Create user
        users.set(username, {
            username: username,
            password: hashPassword(password)
        });
        
        // Clear form
        usernameInput.value = '';
        passwordInput.value = '';
        confirmInput.value = '';
        
        showLoginForm();
        showNotification('Conta criada com sucesso! Faça login agora.', 'success');
        
        return false;
    }

    // Reset password function
    function handleResetPassword(event) {
        if (event) {
            event.preventDefault();
            event.stopPropagation();
        }
        
        const usernameInput = document.getElementById('resetUser');
        const newPasswordInput = document.getElementById('newPassword');
        const confirmNewPasswordInput = document.getElementById('confirmNewPassword');
        
        if (!usernameInput || !newPasswordInput || !confirmNewPasswordInput) {
            showNotification('Erro: Campos de redefinição não encontrados', 'error');
            return false;
        }
        
        const username = usernameInput.value.trim();
        const newPassword = newPasswordInput.value;
        const confirmNewPassword = confirmNewPasswordInput.value;
        
        if (!username || !newPassword || !confirmNewPassword) {
            showNotification('Por favor, preencha todos os campos.', 'error');
            return false;
        }
        
        if (newPassword !== confirmNewPassword) {
            showNotification('As senhas não coincidem.', 'error');
            return false;
        }
        
        if (newPassword.length < 4) {
            showNotification('A senha deve ter pelo menos 4 caracteres.', 'error');
            return false;
        }
        
        if (!users.has(username)) {
            showNotification('Usuário não encontrado.', 'error');
            return false;
        }
        
        // Update password
        users.set(username, {
            username: username,
            password: hashPassword(newPassword)
        });
        
        // Clear form
        usernameInput.value = '';
        newPasswordInput.value = '';
        confirmNewPasswordInput.value = '';
        
        showLoginForm();
        showNotification('Senha redefinida com sucesso!', 'success');
        
        return false;
    }

    // Show functions
    function showLoginForm() {
        const loginForm = document.getElementById('loginForm');
        const registerForm = document.getElementById('registerForm');
        const resetForm = document.getElementById('resetForm');
        
        if (loginForm) loginForm.style.display = 'block';
        if (registerForm) registerForm.style.display = 'none';
        if (resetForm) resetForm.style.display = 'none';
    }

    function showRegisterForm() {
        const loginForm = document.getElementById('loginForm');
        const registerForm = document.getElementById('registerForm');
        const resetForm = document.getElementById('resetForm');
        
        if (loginForm) loginForm.style.display = 'none';
        if (registerForm) registerForm.style.display = 'block';
        if (resetForm) resetForm.style.display = 'none';
    }

    function showResetForm() {
        const loginForm = document.getElementById('loginForm');
        const registerForm = document.getElementById('registerForm');
        const resetForm = document.getElementById('resetForm');
        
        if (loginForm) loginForm.style.display = 'none';
        if (registerForm) registerForm.style.display = 'none';
        if (resetForm) resetForm.style.display = 'block';
    }

    function showMainApp() {
        const loginScreen = document.getElementById('loginScreen');
        const mainApp = document.getElementById('mainApp');
        
        if (loginScreen) loginScreen.style.display = 'none';
        if (mainApp) mainApp.style.display = 'block';
        
        // Update user name
        const loggedUserName = document.getElementById('loggedUserName');
        if (loggedUserName && currentUser) {
            loggedUserName.textContent = currentUser;
        }
        
        // Initialize financial app
        if (window.financasApp) {
            window.financasApp.updateDashboard();
        }
    }

    function showLoginScreen() {
        const loginScreen = document.getElementById('loginScreen');
        const mainApp = document.getElementById('mainApp');
        
        if (loginScreen) loginScreen.style.display = 'flex';
        if (mainApp) mainApp.style.display = 'none';
        
        showLoginForm();
    }

    function handleLogout() {
        currentUser = null;
        isLoggedIn = false;
        showLoginScreen();
        showNotification('Logout realizado com sucesso.', 'success');
    }

    // Setup all event listeners
    function setupEvents() {
        // Login form
        const loginForm = document.getElementById('loginFormElement');
        if (loginForm) {
            loginForm.onsubmit = handleLogin;
        }

        // Register form
        const registerForm = document.getElementById('registerFormElement');
        if (registerForm) {
            registerForm.onsubmit = handleRegister;
        }

        // Reset form
        const resetForm = document.getElementById('resetFormElement');
        if (resetForm) {
            resetForm.onsubmit = handleResetPassword;
        }

        // Navigation buttons
        const showRegisterBtn = document.getElementById('showRegisterBtn');
        if (showRegisterBtn) {
            showRegisterBtn.onclick = function(e) {
                e.preventDefault();
                showRegisterForm();
            };
        }

        const showLoginBtn = document.getElementById('showLoginBtn');
        if (showLoginBtn) {
            showLoginBtn.onclick = function(e) {
                e.preventDefault();
                showLoginForm();
            };
        }

        const resetPasswordBtn = document.getElementById('resetPasswordBtn');
        if (resetPasswordBtn) {
            resetPasswordBtn.onclick = function(e) {
                e.preventDefault();
                showResetForm();
            };
        }

        const backToLoginBtn = document.getElementById('backToLoginBtn');
        if (backToLoginBtn) {
            backToLoginBtn.onclick = function(e) {
                e.preventDefault();
                showLoginForm();
            };
        }

        // Logout button
        const logoutBtn = document.getElementById('logoutBtn');
        if (logoutBtn) {
            logoutBtn.onclick = function(e) {
                e.preventDefault();
                handleLogout();
            };
        }

        console.log('All authentication events setup complete');
    }

    // Initialize authentication
    function initAuth() {
        setupEvents();
        showLoginScreen();
        console.log('Authentication system initialized');
        console.log('Demo credentials: bruno_talita / 123456');
    }

    // Start authentication
    initAuth();

    // Return public interface
    return {
        isLoggedIn: () => isLoggedIn,
        currentUser: () => currentUser,
        showMainApp: showMainApp,
        showLoginScreen: showLoginScreen
    };
}

// Financial App Class
class FinancasApp {
    constructor() {
        this.despesas = [];
        this.categorias = ['Alimentação', 'Moradia', 'Transporte', 'Lazer', 'Saúde', 'Outros'];
        this.meses = ['Janeiro', 'Fevereiro', 'Março', 'Abril', 'Maio', 'Junho', 'Julho', 'Agosto', 'Setembro', 'Outubro', 'Novembro', 'Dezembro'];
        this.chart = null;
        this.nextId = 1;
        this.confirmCallback = null;
        
        setTimeout(() => this.init(), 500);
    }

    init() {
        this.setupNavigation();
        this.setupForms();
        this.setupModal();
        this.updateDashboard();
        console.log('Financial app initialized');
        // Aplicar despesas carregadas antes da inicialização
        if (window.__pendingDespesas && Array.isArray(window.__pendingDespesas)) {
            this.despesas = window.__pendingDespesas;
            window.__pendingDespesas = null;
            this.updateDashboard();
        }
    
    }

    setupNavigation() {
        const navButtons = document.querySelectorAll('.nav-btn');
        const sections = document.querySelectorAll('.section');

        navButtons.forEach(btn => {
            btn.onclick = (e) => {
                e.preventDefault();
                
                const targetSection = btn.getAttribute('data-section');
                
                navButtons.forEach(b => b.classList.remove('nav-btn--active'));
                btn.classList.add('nav-btn--active');
                
                sections.forEach(s => s.classList.remove('section--active'));
                const targetElement = document.getElementById(targetSection);
                if (targetElement) {
                    targetElement.classList.add('section--active');
                }
                
                if (targetSection === 'dashboard') {
                    setTimeout(() => this.updateDashboard(), 100);
                }
            };
        });
    }

    setupForms() {
        const form = document.getElementById('despesaForm');
        if (form) {
            form.onsubmit = (e) => {
                e.preventDefault();
                this.adicionarDespesa();
            };
        }

        const recorrenteCheckbox = document.getElementById('recorrente');
        const frequenciaGroup = document.getElementById('frequenciaGroup');

        if (recorrenteCheckbox && frequenciaGroup) {
            recorrenteCheckbox.onchange = () => {
                if (recorrenteCheckbox.checked) {
                    frequenciaGroup.style.display = 'block';
                } else {
                    frequenciaGroup.style.display = 'none';
                    const frequenciaSelect = document.getElementById('frequencia');
                    if (frequenciaSelect) frequenciaSelect.value = '';
                }
            };
        }

        const acertarBtn = document.getElementById('acertarContasBtn');
        if (acertarBtn) {
            acertarBtn.onclick = (e) => {
                e.preventDefault();
                this.showConfirmModal(
                    'Tem certeza que deseja acertar as contas?',
                    () => this.acertarContas()
                );
            };
        }
    }

    setupModal() {
        const modal = document.getElementById('confirmModal');
        const cancelBtn = document.getElementById('cancelBtn');
        const confirmBtn = document.getElementById('confirmBtn');

        if (cancelBtn) {
            cancelBtn.onclick = (e) => {
                e.preventDefault();
                this.hideModal();
            };
        }

        if (confirmBtn) {
            confirmBtn.onclick = (e) => {
                e.preventDefault();
                if (this.confirmCallback) {
                    this.confirmCallback();
                }
                this.hideModal();
            };
        }
    }

    adicionarDespesa() {
        const descricao = document.getElementById('descricao').value.trim();
        const valor = parseFloat(document.getElementById('valor').value);
        const categoria = document.getElementById('categoria').value;
        const quemPagou = document.getElementById('quemPagou').value;
        const recorrente = document.getElementById('recorrente').checked;

        if (!descricao || !valor || valor <= 0 || !categoria || !quemPagou) {
            this.showMessage('Por favor, preencha todos os campos obrigatórios.', 'error');
            return;
        }

        const despesa = {
            id: this.nextId++,
            descricao: descricao,
            valor: valor,
            categoria: categoria,
            quem_pagou: quemPagou,
            recorrente: recorrente,
            data: new Date().toISOString().split('T')[0]
        };

        if (recorrente) {
            const frequencia = document.getElementById('frequencia').value;
            if (!frequencia) {
                this.showMessage('Para despesas recorrentes, selecione a frequência.', 'error');
                return;
            }
            despesa.frequencia = frequencia;
        }

        this.despesas.push(despesa);
        
        // Reset form
        document.getElementById('descricao').value = '';
        document.getElementById('valor').value = '';
        document.getElementById('categoria').value = '';
        document.getElementById('quemPagou').value = '';
        document.getElementById('recorrente').checked = false;
        document.getElementById('frequenciaGroup').style.display = 'none';
        
        this.updateDashboard();
        this.showMessage('Despesa adicionada com sucesso!', 'success');
        
        
        // Persistir alterações no backend
        if (typeof window.persistNow === 'function') { window.persistNow(); }
    // Switch to dashboard
        const dashboardBtn = document.querySelector('[data-section="dashboard"]');
        if (dashboardBtn) dashboardBtn.click();
    }

    calcularSaldo() {
        let gastoBruno = 0;
        let gastoTalita = 0;

        this.despesas.forEach(despesa => {
            if (despesa.quem_pagou === 'Bruno') {
                gastoBruno += despesa.valor;
            } else if (despesa.quem_pagou === 'Talita') {
                gastoTalita += despesa.valor;
            }
        });

        const totalGastos = gastoBruno + gastoTalita;
        const gastoPorPessoa = totalGastos / 2;
        const saldo = gastoBruno - gastoPorPessoa;

        return { gastoBruno, gastoTalita, saldo, totalGastos };
    }

    updateDashboard() {
        const { gastoBruno, gastoTalita, saldo } = this.calcularSaldo();
        
        // Update partner totals (monthly)
        const gastoBrunoEl = document.getElementById('gastoBruno');
        const gastoTalitaEl = document.getElementById('gastoTalita');
        
        if (gastoBrunoEl) gastoBrunoEl.textContent = this.formatMoney(gastoBruno);
        if (gastoTalitaEl) gastoTalitaEl.textContent = this.formatMoney(gastoTalita);
        
        // Update balance
        const saldoValor = document.getElementById('saldoValor');
        const saldoStatus = document.getElementById('saldoStatus');
        
        if (saldoValor && saldoStatus) {
            if (Math.abs(saldo) < 0.01) {
                saldoValor.textContent = 'R$ 0,00';
                saldoStatus.textContent = 'Contas em dia';
                saldoStatus.className = 'saldo-status';
            } else if (saldo > 0) {
                saldoValor.textContent = this.formatMoney(Math.abs(saldo));
                saldoStatus.textContent = 'Talita deve para Bruno';
                saldoStatus.className = 'saldo-status saldo-status--recebendo';
            } else {
                saldoValor.textContent = this.formatMoney(Math.abs(saldo));
                saldoStatus.textContent = 'Bruno deve para Talita';
                saldoStatus.className = 'saldo-status saldo-status--devendo';
            }
        }
        
        // Update recent expenses
        this.updateGastosRecentes();
        
        // Update chart
        setTimeout(() => this.updateCategoryChart(), 200);
    }

    updateGastosRecentes() {
        const container = document.getElementById('gastosRecentesLista');
        if (!container) return;

        const recentExpenses = [...this.despesas]
            .sort((a, b) => new Date(b.data) - new Date(a.data))
            .slice(0, 5);

        if (recentExpenses.length === 0) {
            container.innerHTML = `
                <div class="empty-state">
                    <div class="empty-state-icon">📄</div>
                    <p>Nenhuma despesa registrada ainda</p>
                    <small>Adicione sua primeira despesa para começar</small>
                </div>
            `;
            return;
        }

        container.innerHTML = recentExpenses.map(despesa => `
            <div class="gasto-recente-item">
                <div class="gasto-recente-info">
                    <div class="gasto-recente-descricao">${despesa.descricao}</div>
                    <div class="gasto-recente-detalhes">
                        <span>📅 ${this.formatDate(despesa.data)}</span>
                        <span>${this.getCategoryIcon(despesa.categoria)} ${despesa.categoria}</span>
                        <span>👤 ${despesa.quem_pagou}</span>
                        ${despesa.recorrente ? '<span>🔄 Recorrente</span>' : ''}
                    </div>
                </div>
                <div class="gasto-recente-valor">${this.formatMoney(despesa.valor)}</div>
                <div class="gasto-recente-actions">
                    <button class="btn-icon btn-icon--delete" onclick="financasApp.deletarDespesa(${despesa.id})" title="Excluir">
                        🗑️
                    </button>
                </div>
            </div>
        `).join('');
    }

    updateCategoryChart() {
        const canvas = document.getElementById('categoryChart');
        if (!canvas) return;
        
        const ctx = canvas.getContext('2d');
        
        const categoryTotals = {};
        this.categorias.forEach(cat => categoryTotals[cat] = 0);
        
        this.despesas.forEach(despesa => {
            if (categoryTotals.hasOwnProperty(despesa.categoria)) {
                categoryTotals[despesa.categoria] += despesa.valor;
            }
        });
        
        const labels = [];
        const data = [];
        const colors = ['#1FB8CD', '#FFC185', '#B4413C', '#ECEBD5', '#5D878F', '#DB4545'];
        
        Object.entries(categoryTotals).forEach(([categoria, total]) => {
            if (total > 0) {
                labels.push(categoria);
                data.push(total);
            }
        });
        
        if (this.chart) {
            this.chart.destroy();
            this.chart = null;
        }
        
        if (data.length === 0) {
            ctx.clearRect(0, 0, canvas.width, canvas.height);
            ctx.font = '16px Arial';
            ctx.fillStyle = '#666';
            ctx.textAlign = 'center';
            ctx.fillText('Nenhuma despesa registrada', canvas.width / 2, canvas.height / 2);
            return;
        }
        
        try {
            this.chart = new Chart(ctx, {
                type: 'doughnut',
                data: {
                    labels: labels,
                    datasets: [{
                        data: data,
                        backgroundColor: colors.slice(0, data.length),
                        borderWidth: 2,
                        borderColor: '#ffffff'
                    }]
                },
                options: {
                    responsive: true,
                    maintainAspectRatio: false,
                    plugins: {
                        legend: {
                            position: 'bottom',
                            labels: {
                                padding: 15,
                                usePointStyle: true
                            }
                        }
                    }
                }
            });
        } catch (error) {
            console.error('Chart error:', error);
        }
    }

    deletarDespesa(id) {
        // (patch) garantir persistência após deleção
    
        const despesa = this.despesas.find(d => d.id === id);
        if (!despesa) return;
        
        this.showConfirmModal(
            `Tem certeza que deseja excluir a despesa "${despesa.descricao
        if (typeof window.persistNow === 'function') { window.persistNow(); }
    }"?`,
            () => {
                this.despesas = this.despesas.filter(d => d.id !== id);
                this.updateDashboard();
                this.showMessage('Despesa excluída com sucesso!', 'success');
            }
        );
    }

    acertarContas() {
        this.showMessage('Contas acertadas! O saldo foi zerado.', 'success');
        this.updateDashboard();
    }

    showConfirmModal(message, callback) {
        const modal = document.getElementById('confirmModal');
        const messageEl = document.getElementById('confirmMessage');
        
        if (messageEl) messageEl.textContent = message;
        if (modal) modal.classList.remove('hidden');
        
        this.confirmCallback = callback;
    }

    hideModal() {
        const modal = document.getElementById('confirmModal');
        if (modal) modal.classList.add('hidden');
        this.confirmCallback = null;
    }

    showMessage(message, type = 'info') {
        const notification = document.createElement('div');
        notification.textContent = message;
        
        const bgColor = type === 'error' ? 'var(--color-error)' : 
                        type === 'success' ? 'var(--color-success)' : 'var(--color-info)';
        
        notification.style.cssText = `
            position: fixed;
            top: 20px;
            right: 20px;
            background: ${bgColor};
            color: white;
            padding: 12px 16px;
            border-radius: 8px;
            box-shadow: 0 4px 12px rgba(0,0,0,0.15);
            z-index: 1001;
            font-weight: 500;
            animation: slideIn 0.3s ease;
        `;
        
        document.body.appendChild(notification);
        
        setTimeout(() => {
            if (notification.parentNode) {
                notification.remove();
            }
        }, 3000);
    }

    getCategoryIcon(categoria) {
        const icons = {
            'Alimentação': '🍽️',
            'Moradia': '🏠',
            'Transporte': '🚗',
            'Lazer': '🎮',
            'Saúde': '🏥',
            'Outros': '📦'
        };
        return icons[categoria] || '📦';
    }

    formatMoney(value) {
        return new Intl.NumberFormat('pt-BR', {
            style: 'currency',
            currency: 'BRL'
        }).format(value);
    }

    formatDate(dateString) {
        try {
            return new Date(dateString + 'T00:00:00').toLocaleDateString('pt-BR');
        } catch (error) {
            return dateString;
        }
    }
}

// Add CSS animations
const style = document.createElement('style');
style.textContent = `
    @keyframes slideIn {
        from { transform: translateX(100%); opacity: 0; }
        to { transform: translateX(0); opacity: 1; }
    }
`;
document.head.appendChild(style);

// Initialize when DOM is ready
document.addEventListener('DOMContentLoaded', () => {
    console.log('DOM loaded, starting initialization...');
    
    // Initialize auth system
    authSystem = initializeApp();
    
    // Initialize financial app
    window.financasApp = new FinancasApp();
    
    console.log('All systems initialized');
});