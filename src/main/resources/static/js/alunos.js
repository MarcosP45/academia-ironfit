const Alunos = {
    filtro: { busca: '', ativo: '' },

    async render(app) {
        cabecalho('Alunos', 'Cadastro e consulta de alunos',
            '<button class="btn btn-primario" id="btn-novo-aluno">+ Novo aluno</button>');
        document.getElementById('btn-novo-aluno').onclick = () => this.abrirFormulario(null, () => this.carregar());

        app.innerHTML = `
        <div class="filtros">
            <input type="search" class="busca" id="busca-aluno" placeholder="Buscar por nome ou CPF…" value="${esc(this.filtro.busca)}">
            <select id="filtro-ativo" style="width:auto">
                <option value="">Todos</option>
                <option value="true">Somente ativos</option>
                <option value="false">Somente inativos</option>
            </select>
        </div>
        <div class="card"><div class="tabela-wrap"><table>
            <thead><tr>
                <th>Aluno</th><th>CPF</th><th>Plano</th><th>Telefone</th><th>Matrícula</th><th>Situação</th><th></th>
            </tr></thead>
            <tbody id="lista-alunos"><tr><td colspan="7" class="carregando">Carregando…</td></tr></tbody>
        </table></div></div>`;

        document.getElementById('filtro-ativo').value = this.filtro.ativo;
        document.getElementById('busca-aluno').addEventListener('input', debounce(e => {
            this.filtro.busca = e.target.value;
            this.carregar();
        }));
        document.getElementById('filtro-ativo').addEventListener('change', e => {
            this.filtro.ativo = e.target.value;
            this.carregar();
        });
        await this.carregar();
    },

    async carregar() {
        const tbody = document.getElementById('lista-alunos');
        if (!tbody) return;
        const alunos = await api.get('/alunos' + qs(this.filtro));
        tbody.innerHTML = alunos.length ? alunos.map(a => `
            <tr>
                <td class="nome-cel"><strong>${esc(a.nome)}</strong><span>${esc(a.email || '')}</span></td>
                <td>${esc(a.cpf)}</td>
                <td>${a.planoNome ? esc(a.planoNome) : '<span class="dica">Sem plano</span>'}</td>
                <td>${esc(a.telefone || '—')}</td>
                <td>${fmt.data(a.dataMatricula)}</td>
                <td>${badgeAtivo(a.ativo)} ${a.inadimplente ? '<span class="badge b-vermelho">Inadimplente</span>' : ''}</td>
                <td><div class="acoes">
                    <button class="btn btn-sm" data-ver="${a.id}">Ver</button>
                    <button class="btn btn-sm" data-editar="${a.id}">Editar</button>
                    <button class="btn btn-sm" data-status="${a.id}" data-ativo="${a.ativo}">${a.ativo ? 'Inativar' : 'Ativar'}</button>
                    <button class="btn btn-sm btn-perigo" data-excluir="${a.id}">Excluir</button>
                </div></td>
            </tr>`).join('') : tabelaVazia(7, 'Nenhum aluno encontrado.');

        const porId = id => alunos.find(a => a.id == id);
        tbody.querySelectorAll('[data-ver]').forEach(b => b.onclick = () => this.detalhar(porId(b.dataset.ver)));
        tbody.querySelectorAll('[data-editar]').forEach(b => b.onclick = () => this.abrirFormulario(porId(b.dataset.editar), () => this.carregar()));
        tbody.querySelectorAll('[data-status]').forEach(b => b.onclick = async () => {
            try {
                const ativo = b.dataset.ativo !== 'true';
                await api.patch(`/alunos/${b.dataset.status}/status` + qs({ ativo }));
                toast(ativo ? 'Aluno reativado.' : 'Aluno inativado.');
                this.carregar();
            } catch (e) { erroToast(e); }
        });
        tbody.querySelectorAll('[data-excluir]').forEach(b => b.onclick = async () => {
            const a = porId(b.dataset.excluir);
            const ok = await confirmar(`Excluir <strong>${esc(a.nome)}</strong>? Todas as mensalidades, fichas de treino e avaliações deste aluno também serão apagadas.`,
                { titulo: 'Excluir aluno', botao: 'Excluir', perigo: true });
            if (!ok) return;
            try {
                await api.del('/alunos/' + a.id);
                toast('Aluno excluído.');
                this.carregar();
            } catch (e) { erroToast(e); }
        });
    },

    async abrirFormulario(aluno, aoSalvar) {
        const planos = await api.get('/planos?ativos=true');
        if (aluno && aluno.planoId && !planos.some(p => p.id === aluno.planoId)) {
            planos.push({ id: aluno.planoId, nome: aluno.planoNome + ' (inativo)', valorMensal: null });
        }
        const a = aluno || {};
        const corpo = modal.abrir(aluno ? 'Editar aluno' : 'Novo aluno', `
        <form id="form-aluno" novalidate>
            <div class="form-grade">
                <div class="campo c8"><label>Nome completo</label><input type="text" name="nome" value="${esc(a.nome)}" required></div>
                <div class="campo c4"><label>CPF</label><input type="text" name="cpf" data-mascara="cpf" placeholder="000.000.000-00" value="${esc(a.cpf)}" required></div>
                <div class="campo"><label>E-mail <span class="opc">(opcional)</span></label><input type="email" name="email" value="${esc(a.email)}"></div>
                <div class="campo c3"><label>Telefone</label><input type="tel" name="telefone" data-mascara="tel" placeholder="(24) 99999-9999" value="${esc(a.telefone)}"></div>
                <div class="campo c3"><label>Nascimento</label><input type="date" name="dataNascimento" value="${esc(a.dataNascimento)}"></div>
                <div class="campo"><label>Plano</label>
                    <select name="planoId" data-tipo="numero">${opcoes(planos, a.planoId, p => p.valorMensal ? `${p.nome} — ${fmt.moeda(p.valorMensal)}/mês` : p.nome, 'Sem plano')}</select>
                </div>
                <div class="campo c3"><label>Data de matrícula</label><input type="date" name="dataMatricula" value="${esc(a.dataMatricula || hojeISO())}"></div>
                <div class="campo c3" style="justify-content:flex-end"><label class="check"><input type="checkbox" name="ativo" ${a.ativo !== false ? 'checked' : ''}> Aluno ativo</label></div>
                ${aluno ? '' : '<div class="campo c12"><div class="aviso">Ao cadastrar com um plano, as mensalidades do período do plano são geradas automaticamente a partir da data de matrícula.</div></div>'}
            </div>
            <div class="form-rodape">
                <button type="button" class="btn" data-fechar>Cancelar</button>
                <button type="submit" class="btn btn-primario">${aluno ? 'Salvar alterações' : 'Cadastrar aluno'}</button>
            </div>
        </form>`, 'lg');
        aplicarMascaras(corpo);
        corpo.querySelector('form').addEventListener('submit', async ev => {
            ev.preventDefault();
            const r = await enviarFormulario(ev.target,
                dados => aluno ? api.put('/alunos/' + aluno.id, dados) : api.post('/alunos', dados),
                aluno ? 'Aluno atualizado.' : 'Aluno cadastrado.');
            if (r && aoSalvar) aoSalvar(r);
        });
    },

    async detalhar(a) {
        const corpo = modal.abrir('Ficha do aluno', '<div class="carregando">Carregando…</div>', 'lg');
        const [mens, fichas, avals] = await Promise.all([
            api.get('/mensalidades' + qs({ alunoId: a.id })),
            api.get('/fichas' + qs({ alunoId: a.id })),
            api.get('/avaliacoes' + qs({ alunoId: a.id }))
        ]);
        corpo.innerHTML = `
        <div class="detalhe-cab">
            <div class="avatar">${esc(fmt.iniciais(a.nome))}</div>
            <div>
                <h3 style="margin:0">${esc(a.nome)}</h3>
                <div>${badgeAtivo(a.ativo)} ${a.inadimplente ? '<span class="badge b-vermelho">Inadimplente</span>' : '<span class="badge b-verde">Em dia</span>'}</div>
            </div>
        </div>
        <div class="dados">
            <div><span>CPF</span>${esc(a.cpf)}</div>
            <div><span>Idade</span>${a.idade != null ? a.idade + ' anos' : '—'}</div>
            <div><span>Plano</span>${esc(a.planoNome || 'Sem plano')}</div>
            <div><span>E-mail</span>${esc(a.email || '—')}</div>
            <div><span>Telefone</span>${esc(a.telefone || '—')}</div>
            <div><span>Matrícula</span>${fmt.data(a.dataMatricula)}</div>
        </div>
        <div class="abas">
            <button class="aba ativa" data-aba="m">Mensalidades (${mens.length})</button>
            <button class="aba" data-aba="f">Treinos (${fichas.length})</button>
            <button class="aba" data-aba="a">Avaliações (${avals.length})</button>
        </div>
        <div data-painel="m" class="tabela-wrap"><table>
            <thead><tr><th>Descrição</th><th>Vencimento</th><th class="num">Valor</th><th>Pagamento</th><th>Situação</th></tr></thead>
            <tbody>${mens.length ? mens.map(m => `<tr>
                <td>${esc(m.descricao)}</td><td>${fmt.data(m.dataVencimento)}</td>
                <td class="num">${fmt.moeda(m.situacao === 'PAGA' ? m.valorPago : m.valorAtualizado)}</td>
                <td>${m.dataPagamento ? fmt.data(m.dataPagamento) + ' · ' + fmt.forma(m.formaPagamento) : '—'}</td>
                <td>${badgeSituacao(m.situacao)}</td></tr>`).join('') : tabelaVazia(5, 'Sem mensalidades.')}</tbody>
        </table></div>
        <div data-painel="f" class="tabela-wrap" hidden><table>
            <thead><tr><th>Ficha</th><th>Professor</th><th>Período</th><th class="num">Exercícios</th><th>Status</th></tr></thead>
            <tbody>${fichas.length ? fichas.map(f => `<tr>
                <td class="nome-cel"><strong>${esc(f.nome)}</strong><span>${esc(f.objetivo || '')}</span></td>
                <td>${esc(f.professorNome || '—')}</td>
                <td>${fmt.data(f.dataInicio)} a ${fmt.data(f.dataFim)}</td>
                <td class="num">${f.totalExercicios}</td>
                <td>${Treinos.badge(f)}</td></tr>`).join('') : tabelaVazia(5, 'Sem fichas de treino.')}</tbody>
        </table></div>
        <div data-painel="a" class="tabela-wrap" hidden><table>
            <thead><tr><th>Data</th><th class="num">Peso</th><th class="num">IMC</th><th class="num">% Gordura</th><th>Avaliador</th></tr></thead>
            <tbody>${avals.length ? avals.map(v => `<tr>
                <td>${fmt.data(v.dataAvaliacao)}</td><td class="num">${fmt.num(v.peso, 1, ' kg')}</td>
                <td class="num">${fmt.num(v.imc, 1)}</td><td class="num">${fmt.num(v.percentualGordura, 1, '%')}</td>
                <td>${esc(v.professorNome || '—')}</td></tr>`).join('') : tabelaVazia(5, 'Sem avaliações.')}</tbody>
        </table></div>
        <div class="form-rodape">
            <a class="btn" href="#/avaliacoes/${a.id}" data-fechar>Ver evolução</a>
            <a class="btn" href="#/mensalidades" data-fechar>Ir para mensalidades</a>
            <button class="btn btn-primario" data-fechar>Fechar</button>
        </div>`;
        corpo.querySelectorAll('.aba').forEach(b => b.onclick = () => {
            corpo.querySelectorAll('.aba').forEach(x => x.classList.toggle('ativa', x === b));
            corpo.querySelectorAll('[data-painel]').forEach(p => p.hidden = p.dataset.painel !== b.dataset.aba);
        });
    }
};
