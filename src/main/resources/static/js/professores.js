const Professores = {
    busca: '',

    async render(app) {
        cabecalho('Professores', 'Cadastro e consulta dos profissionais',
            '<button class="btn btn-primario" id="btn-novo-prof">+ Novo professor</button>');
        document.getElementById('btn-novo-prof').onclick = () => this.abrirFormulario(null, () => this.carregar());

        app.innerHTML = `
        <div class="filtros">
            <input type="search" class="busca" id="busca-prof" placeholder="Buscar por nome, especialidade ou CREF…" value="${esc(this.busca)}">
        </div>
        <div class="card"><div class="tabela-wrap"><table>
            <thead><tr><th>Professor</th><th>CREF</th><th>Especialidade</th><th>Contato</th><th>Admissão</th><th>Status</th><th></th></tr></thead>
            <tbody id="lista-prof"><tr><td colspan="7" class="carregando">Carregando…</td></tr></tbody>
        </table></div></div>`;
        document.getElementById('busca-prof').addEventListener('input', debounce(e => { this.busca = e.target.value; this.carregar(); }));
        await this.carregar();
    },

    async carregar() {
        const tbody = document.getElementById('lista-prof');
        if (!tbody) return;
        const lista = await api.get('/professores' + qs({ busca: this.busca }));
        tbody.innerHTML = lista.length ? lista.map(p => `
            <tr>
                <td class="nome-cel"><strong>${esc(p.nome)}</strong><span>CPF ${esc(p.cpf)}</span></td>
                <td><span class="badge b-laranja">${esc(p.cref)}</span></td>
                <td>${esc(p.especialidade || '—')}</td>
                <td class="nome-cel"><strong style="font-weight:400">${esc(p.email || '—')}</strong><span>${esc(p.telefone || '')}</span></td>
                <td>${fmt.data(p.dataAdmissao)}</td>
                <td>${badgeAtivo(p.ativo)}</td>
                <td><div class="acoes">
                    <button class="btn btn-sm" data-editar="${p.id}">Editar</button>
                    <button class="btn btn-sm" data-status="${p.id}">${p.ativo ? 'Inativar' : 'Ativar'}</button>
                    <button class="btn btn-sm btn-perigo" data-excluir="${p.id}">Excluir</button>
                </div></td>
            </tr>`).join('') : tabelaVazia(7, 'Nenhum professor encontrado.');

        const porId = id => lista.find(p => p.id == id);
        tbody.querySelectorAll('[data-editar]').forEach(b => b.onclick = () => this.abrirFormulario(porId(b.dataset.editar), () => this.carregar()));
        tbody.querySelectorAll('[data-status]').forEach(b => b.onclick = async () => {
            const p = porId(b.dataset.status);
            try {
                await api.patch(`/professores/${p.id}/status` + qs({ ativo: !p.ativo }));
                toast(p.ativo ? 'Professor inativado.' : 'Professor reativado.');
                this.carregar();
            } catch (e) { erroToast(e); }
        });
        tbody.querySelectorAll('[data-excluir]').forEach(b => b.onclick = async () => {
            const p = porId(b.dataset.excluir);
            if (!await confirmar(`Excluir o professor <strong>${esc(p.nome)}</strong>?`, { titulo: 'Excluir professor', botao: 'Excluir', perigo: true })) return;
            try {
                await api.del('/professores/' + p.id);
                toast('Professor excluído.');
                this.carregar();
            } catch (e) { erroToast(e); }
        });
    },

    abrirFormulario(prof, aoSalvar) {
        const p = prof || {};
        const corpo = modal.abrir(prof ? 'Editar professor' : 'Novo professor', `
        <form novalidate>
            <div class="form-grade">
                <div class="campo c8"><label>Nome completo</label><input type="text" name="nome" value="${esc(p.nome)}"></div>
                <div class="campo c4"><label>CPF</label><input type="text" name="cpf" data-mascara="cpf" placeholder="000.000.000-00" value="${esc(p.cpf)}"></div>
                <div class="campo c4"><label>CREF</label><input type="text" name="cref" placeholder="000000-G/RJ" value="${esc(p.cref)}"></div>
                <div class="campo c8"><label>Especialidade</label>
                    <input type="text" name="especialidade" list="lista-especialidades" value="${esc(p.especialidade)}" placeholder="Ex.: Musculação e hipertrofia">
                    <datalist id="lista-especialidades">
                        <option value="Musculação e hipertrofia"><option value="Treinamento funcional e emagrecimento">
                        <option value="Avaliação física e reabilitação"><option value="Pilates"><option value="Spinning"><option value="Cross training">
                    </datalist>
                </div>
                <div class="campo"><label>E-mail</label><input type="email" name="email" value="${esc(p.email)}"></div>
                <div class="campo c3"><label>Telefone</label><input type="tel" name="telefone" data-mascara="tel" value="${esc(p.telefone)}"></div>
                <div class="campo c3"><label>Admissão</label><input type="date" name="dataAdmissao" value="${esc(p.dataAdmissao || hojeISO())}"></div>
                <div class="campo c12"><label class="check"><input type="checkbox" name="ativo" ${p.ativo !== false ? 'checked' : ''}> Professor ativo</label></div>
            </div>
            <div class="form-rodape">
                <button type="button" class="btn" data-fechar>Cancelar</button>
                <button type="submit" class="btn btn-primario">${prof ? 'Salvar alterações' : 'Cadastrar professor'}</button>
            </div>
        </form>`, 'lg');
        aplicarMascaras(corpo);
        corpo.querySelector('form').addEventListener('submit', async ev => {
            ev.preventDefault();
            const r = await enviarFormulario(ev.target,
                d => prof ? api.put('/professores/' + prof.id, d) : api.post('/professores', d),
                prof ? 'Professor atualizado.' : 'Professor cadastrado.');
            if (r && aoSalvar) aoSalvar(r);
        });
    }
};
