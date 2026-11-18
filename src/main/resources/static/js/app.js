const rotas = {
    dashboard: Dashboard,
    alunos: Alunos,
    planos: Planos,
    mensalidades: Mensalidades,
    professores: Professores,
    treinos: Treinos,
    avaliacoes: Avaliacoes
};

async function navegar() {
    const [nome, param] = location.hash.replace(/^#\/?/, '').split('/');
    const rota = rotas[nome] ? nome : 'dashboard';
    document.querySelectorAll('#menu a').forEach(a => a.classList.toggle('ativo', a.dataset.rota === rota));
    document.getElementById('sidebar').classList.remove('aberta');
    if (!document.getElementById('modal').hidden) modal.fechar();

    const app = document.getElementById('app');
    app.innerHTML = '<div class="carregando">Carregando…</div>';
    try {
        await rotas[rota].render(app, param);
    } catch (e) {
        app.innerHTML = `<div class="card card-corpo vazio">${esc(e.message)}</div>`;
        erroToast(e);
    }
}

async function verificarApi() {
    const el = document.getElementById('status-api');
    try {
        await api.get('/planos');
        el.textContent = 'API conectada';
        el.className = 'status-api ok';
    } catch (e) {
        el.textContent = 'API indisponível';
        el.className = 'status-api erro';
    }
}

document.getElementById('btn-menu').addEventListener('click', () =>
    document.getElementById('sidebar').classList.toggle('aberta'));

window.addEventListener('hashchange', navegar);
if (!location.hash) location.hash = '#/dashboard';
navegar();
verificarApi();
