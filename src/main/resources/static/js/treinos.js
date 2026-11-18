const GRUPOS_MUSCULARES = ['Peito', 'Costas', 'Ombros', 'Bíceps', 'Tríceps', 'Antebraço', 'Quadríceps', 'Posteriores',
    'Glúteos', 'Panturrilha', 'Abdômen', 'Core', 'Cardio', 'Corpo inteiro'];
const EXERCICIOS_SUGERIDOS = ['Supino reto com barra', 'Supino inclinado com halteres', 'Crucifixo', 'Crossover', 'Puxada frontal',
    'Remada curvada', 'Remada baixa', 'Barra fixa', 'Desenvolvimento com halteres', 'Elevação lateral', 'Rosca direta',
    'Rosca martelo', 'Tríceps corda', 'Tríceps francês', 'Agachamento livre', 'Leg press 45', 'Cadeira extensora',
    'Mesa flexora', 'Stiff', 'Elevação pélvica', 'Cadeira abdutora', 'Panturrilha em pé', 'Prancha abdominal',
    'Abdominal supra', 'Esteira', 'Bicicleta ergométrica', 'Burpee', 'Kettlebell swing'];

const Treinos = {
    filtro: { alunoId: '', ativas: false },

    badge(f) {
        if (!f.ativa) return '<span class="badge b-cinza">Inativa</span>';
        if (f.vencida) return '<span class="badge b-amarelo">Vencida</span>';
        return '<span class="badge b-verde">Ativa</span>';
    },

    async render(app) {
        cabecalho('Fichas de treino', 'Criação e gerenciamento das fichas dos alunos',
            '<button class="btn btn-primario" id="btn-nova-ficha">+ Nova ficha</button>');
        const alunos = await api.get('/alunos');
        document.getElementById('btn-nova-ficha').onclick = () => this.abrirFormulario(null);

        app.innerHTML = `
        <div class="filtros">
            <select id="filtro-aluno-ficha" style="max-width:320px">${opcoes(alunos, this.filtro.alunoId, a => a.nome, 'Todos os alunos')}</select>
            <label class="check"><input type="checkbox" id="filtro-ativas" ${this.filtro.ativas ? 'checked' : ''}> Somente fichas ativas</label>
        </div>
        <div id="lista-fichas" class="fichas"><div class="carregando">Carregando…</div></div>`;
        document.getElementById('filtro-aluno-ficha').onchange = e => { this.filtro.alunoId = e.target.value; this.carregar(); };
        document.getElementById('filtro-ativas').onchange = e => { this.filtro.ativas = e.target.checked; this.carregar(); };
        await this.carregar();
    },

    async carregar() {
        const box = document.getElementById('lista-fichas');
        if (!box) return;
        const fichas = await api.get('/fichas' + qs({ alunoId: this.filtro.alunoId, ativas: this.filtro.ativas || '' }));
        box.innerHTML = fichas.length ? fichas.map(f => `
            <div class="card ficha ${f.ativa ? '' : 'inativa'}">
                <div class="card-cab">
                    <div>
                        <h3>${esc(f.nome)}</h3>
                        <span class="dica">${esc(f.alunoNome)}</span>
                    </div>
                    <div class="dir">${this.badge(f)}</div>
                </div>
                <div class="meta">
                    <span>Objetivo: ${esc(f.objetivo || 'Sem objetivo definido')}</span>
                    <span>Professor: ${esc(f.professorNome || 'Sem professor')}</span>
                    <span>Período: ${fmt.data(f.dataInicio)} a ${fmt.data(f.dataFim)}</span>
                </div>
                <div class="tabela-wrap" style="margin-top:8px"><table>
                    <thead><tr><th>#</th><th>Exercício</th><th class="num">Séries</th><th class="num">Reps</th><th class="num">Carga</th><th class="num">Desc.</th></tr></thead>
                    <tbody>${f.itens.map(i => `<tr>
                        <td>${i.ordem}</td>
                        <td class="nome-cel"><strong style="font-weight:500">${esc(i.exercicio)}</strong><span>${esc(i.grupoMuscular || '')}${i.observacao ? ' · ' + esc(i.observacao) : ''}</span></td>
                        <td class="num">${i.series}</td><td class="num">${esc(i.repeticoes)}</td>
                        <td class="num">${i.carga != null ? fmt.num(i.carga, i.carga % 1 ? 1 : 0, ' kg') : '—'}</td>
                        <td class="num">${i.descansoSegundos ? i.descansoSegundos + 's' : '—'}</td></tr>`).join('')}
                    </tbody>
                </table></div>
                ${f.observacoes ? `<div class="meta" style="padding-bottom:4px">Obs.: ${esc(f.observacoes)}</div>` : ''}
                <div class="rodape acoes" style="justify-content:flex-start">
                    <button class="btn btn-sm" data-editar="${f.id}">Editar</button>
                    <button class="btn btn-sm" data-duplicar="${f.id}">Duplicar</button>
                    <button class="btn btn-sm" data-imprimir="${f.id}">Imprimir</button>
                    <button class="btn btn-sm" data-status="${f.id}">${f.ativa ? 'Desativar' : 'Ativar'}</button>
                    <button class="btn btn-sm btn-perigo" data-excluir="${f.id}">Excluir</button>
                </div>
            </div>`).join('') : '<div class="card vazio" style="grid-column:1/-1">Nenhuma ficha de treino encontrada.</div>';

        const porId = id => fichas.find(f => f.id == id);
        box.querySelectorAll('[data-editar]').forEach(b => b.onclick = () => this.abrirFormulario(porId(b.dataset.editar)));
        box.querySelectorAll('[data-imprimir]').forEach(b => b.onclick = () => this.imprimir(porId(b.dataset.imprimir)));
        box.querySelectorAll('[data-duplicar]').forEach(b => b.onclick = async () => {
            try {
                await api.post(`/fichas/${b.dataset.duplicar}/duplicar`);
                toast('Ficha duplicada (criada como inativa para você ajustar).');
                this.carregar();
            } catch (e) { erroToast(e); }
        });
        box.querySelectorAll('[data-status]').forEach(b => b.onclick = async () => {
            const f = porId(b.dataset.status);
            try {
                await api.patch(`/fichas/${f.id}/status` + qs({ ativa: !f.ativa }));
                toast(f.ativa ? 'Ficha desativada.' : 'Ficha ativada.');
                this.carregar();
            } catch (e) { erroToast(e); }
        });
        box.querySelectorAll('[data-excluir]').forEach(b => b.onclick = async () => {
            const f = porId(b.dataset.excluir);
            if (!await confirmar(`Excluir a ficha <strong>${esc(f.nome)}</strong> de ${esc(f.alunoNome)}?`, { titulo: 'Excluir ficha', botao: 'Excluir', perigo: true })) return;
            try {
                await api.del('/fichas/' + f.id);
                toast('Ficha excluída.');
                this.carregar();
            } catch (e) { erroToast(e); }
        });
    },

    linhaItem(i = {}) {
        return `
        <div class="item-linha">
            <span class="ordem"></span>
            <input type="text" data-campo="exercicio" list="lista-exercicios" placeholder="Exercício" value="${esc(i.exercicio)}">
            <select data-campo="grupoMuscular"><option value="">Grupo…</option>${(i.grupoMuscular && !GRUPOS_MUSCULARES.includes(i.grupoMuscular) ? [i.grupoMuscular, ...GRUPOS_MUSCULARES] : GRUPOS_MUSCULARES).map(g => `<option ${g === i.grupoMuscular ? 'selected' : ''}>${g}</option>`).join('')}</select>
            <input type="number" data-campo="series" min="1" max="20" placeholder="Séries" value="${i.series ?? 3}">
            <input type="text" data-campo="repeticoes" placeholder="Reps" value="${esc(i.repeticoes ?? '12')}">
            <input type="number" data-campo="carga" min="0" step="0.5" placeholder="kg" value="${i.carga ?? ''}">
            <input type="number" data-campo="descansoSegundos" min="0" step="5" placeholder="seg" value="${i.descansoSegundos ?? 60}">
            <input type="text" data-campo="observacao" placeholder="Observação" value="${esc(i.observacao)}">
            <div class="mini-acoes">
                <button type="button" data-mover="-1" title="Subir" aria-label="Subir"><svg class="icone" aria-hidden="true"><use href="#i-sobe"/></svg></button>
                <button type="button" data-mover="1" title="Descer" aria-label="Descer"><svg class="icone" aria-hidden="true"><use href="#i-desce"/></svg></button>
                <button type="button" data-remover title="Remover" aria-label="Remover"><svg class="icone" aria-hidden="true"><use href="#i-x"/></svg></button>
            </div>
        </div>`;
    },

    async abrirFormulario(ficha) {
        const [alunos, profs] = await Promise.all([api.get('/alunos?ativo=true'), api.get('/professores')]);
        const profsAtivos = profs.filter(p => p.ativo || (ficha && p.id === ficha.professorId));
        const f = ficha || { dataInicio: hojeISO(), itens: [{}] };
        const corpo = modal.abrir(ficha ? 'Editar ficha de treino' : 'Nova ficha de treino', `
        <form novalidate>
            <div class="form-grade">
                <div class="campo"><label>Aluno</label><select name="alunoId" data-tipo="numero">${opcoes(alunos, f.alunoId ?? this.filtro.alunoId, a => a.nome, 'Selecione…')}</select></div>
                <div class="campo"><label>Professor responsável</label><select name="professorId" data-tipo="numero">${opcoes(profsAtivos, f.professorId, p => p.nome, 'Sem professor')}</select></div>
                <div class="campo"><label>Nome da ficha</label><input type="text" name="nome" value="${esc(f.nome)}" placeholder="Ex.: Treino A - Peito e tríceps"></div>
                <div class="campo"><label>Objetivo</label>
                    <input type="text" name="objetivo" list="lista-objetivos" value="${esc(f.objetivo)}" placeholder="Ex.: Hipertrofia">
                    <datalist id="lista-objetivos"><option value="Hipertrofia"><option value="Emagrecimento"><option value="Condicionamento"><option value="Força"><option value="Resistência"><option value="Reabilitação"></datalist>
                </div>
                <div class="campo c3"><label>Início</label><input type="date" name="dataInicio" value="${esc(f.dataInicio)}"></div>
                <div class="campo c3"><label>Término <span class="opc">(opcional)</span></label><input type="date" name="dataFim" value="${esc(f.dataFim)}"></div>
                <div class="campo" style="justify-content:flex-end"><label class="check"><input type="checkbox" name="ativa" ${f.ativa !== false ? 'checked' : ''}> Ficha ativa</label></div>
                <div class="campo c12"><label>Observações <span class="opc">(opcional)</span></label><input type="text" name="observacoes" value="${esc(f.observacoes)}"></div>

                <div class="secao-form">Exercícios</div>
                <div class="itens-ficha" data-ignorar>
                    <div class="item-linha item-cab"><span></span><span>Exercício</span><span>Grupo</span><span>Séries</span><span>Reps</span><span>Carga</span><span>Descanso</span><span>Obs.</span><span></span></div>
                    <div id="itens">${f.itens.map(i => this.linhaItem(i)).join('')}</div>
                    <button type="button" class="btn btn-sm" id="btn-add-item">+ Adicionar exercício</button>
                    <datalist id="lista-exercicios">${EXERCICIOS_SUGERIDOS.map(e => `<option value="${e}">`).join('')}</datalist>
                </div>
            </div>
            <div class="form-rodape">
                <button type="button" class="btn" data-fechar>Cancelar</button>
                <button type="submit" class="btn btn-primario">${ficha ? 'Salvar ficha' : 'Criar ficha'}</button>
            </div>
        </form>`, 'xl');

        const lista = corpo.querySelector('#itens');
        const renumerar = () => lista.querySelectorAll('.item-linha').forEach((l, i) => l.querySelector('.ordem').textContent = i + 1);
        renumerar();
        corpo.querySelector('#btn-add-item').onclick = () => {
            lista.insertAdjacentHTML('beforeend', this.linhaItem());
            renumerar();
            lista.lastElementChild.querySelector('input').focus();
        };
        lista.addEventListener('click', e => {
            const linha = e.target.closest('.item-linha');
            if (!linha) return;
            if (e.target.matches('[data-remover]')) {
                if (lista.children.length > 1) linha.remove(); else toast('A ficha precisa de pelo menos um exercício.', 'info');
            } else if (e.target.matches('[data-mover]')) {
                const alvo = e.target.dataset.mover === '-1' ? linha.previousElementSibling : linha.nextElementSibling;
                if (alvo) e.target.dataset.mover === '-1' ? alvo.before(linha) : alvo.after(linha);
            }
            renumerar();
        });

        corpo.querySelector('form').addEventListener('submit', async ev => {
            ev.preventDefault();
            const r = await enviarFormulario(ev.target, dados => {
                dados.itens = [...lista.querySelectorAll('.item-linha')].map(l => {
                    const v = c => l.querySelector(`[data-campo=${c}]`).value.trim();
                    const n = c => v(c) === '' ? null : Number(v(c));
                    return {
                        exercicio: v('exercicio'), grupoMuscular: v('grupoMuscular') || null, series: n('series'),
                        repeticoes: v('repeticoes'), carga: n('carga'), descansoSegundos: n('descansoSegundos'),
                        observacao: v('observacao') || null
                    };
                }).filter(i => i.exercicio !== '' || i.repeticoes !== '');
                return ficha ? api.put('/fichas/' + ficha.id, dados) : api.post('/fichas', dados);
            }, ficha ? 'Ficha atualizada.' : 'Ficha criada.');
            if (r) this.carregar();
        });
    },

    imprimir(f) {
        const w = window.open('', '_blank', 'width=820,height=900');
        if (!w) { toast('Permita pop-ups para imprimir a ficha.', 'erro'); return; }
        w.document.write(`<!DOCTYPE html><html lang="pt-BR"><head><meta charset="UTF-8"><title>${esc(f.nome)}</title>
        <style>body{font-family:Arial,sans-serif;padding:28px;color:#111}h1{margin:0 0 4px;font-size:22px}
        .m{color:#555;margin-bottom:16px;font-size:13px}table{width:100%;border-collapse:collapse;font-size:13px}
        th,td{border:1px solid #ccc;padding:7px;text-align:left}th{background:#f3f3f3}.c{text-align:center}
        .ass{margin-top:50px;display:flex;justify-content:space-between;font-size:12px}.ass div{border-top:1px solid #333;width:40%;text-align:center;padding-top:4px}</style>
        </head><body>
        <h1>IronFit · ${esc(f.nome)}</h1>
        <div class="m">Aluno: <b>${esc(f.alunoNome)}</b> · Professor: ${esc(f.professorNome || '—')} · Objetivo: ${esc(f.objetivo || '—')}<br>
        Vigência: ${fmt.data(f.dataInicio)} a ${fmt.data(f.dataFim)}</div>
        <table><thead><tr><th class="c">#</th><th>Exercício</th><th>Grupo</th><th class="c">Séries</th><th class="c">Reps</th><th class="c">Carga</th><th class="c">Descanso</th><th>Obs.</th></tr></thead>
        <tbody>${f.itens.map(i => `<tr><td class="c">${i.ordem}</td><td>${esc(i.exercicio)}</td><td>${esc(i.grupoMuscular || '')}</td>
        <td class="c">${i.series}</td><td class="c">${esc(i.repeticoes)}</td><td class="c">${i.carga != null ? i.carga + ' kg' : '—'}</td>
        <td class="c">${i.descansoSegundos ? i.descansoSegundos + 's' : '—'}</td><td>${esc(i.observacao || '')}</td></tr>`).join('')}</tbody></table>
        ${f.observacoes ? `<p style="font-size:13px"><b>Observações:</b> ${esc(f.observacoes)}</p>` : ''}
        <div class="ass"><div>Professor</div><div>Aluno</div></div>
        <script>window.onload=()=>window.print()<\/script></body></html>`);
        w.document.close();
    }
};
