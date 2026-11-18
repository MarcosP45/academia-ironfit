const Planos = {
    async render(app) {
        cabecalho('Planos', 'Planos oferecidos pela academia',
            '<button class="btn btn-primario" id="btn-novo-plano">+ Novo plano</button>');
        document.getElementById('btn-novo-plano').onclick = () => this.abrirFormulario(null, () => this.render(app));

        const planos = await api.get('/planos');
        app.innerHTML = planos.length ? `<div class="planos">${planos.map(p => `
            <div class="card plano ${p.ativo ? '' : 'inativo'}">
                <h3>${esc(p.nome)} ${p.ativo ? '' : '<span class="badge b-cinza">Inativo</span>'}</h3>
                <div class="preco">${fmt.moeda(p.valorMensal)}<small>/mês</small></div>
                <p>${esc(p.descricao || '')}</p>
                <div class="info">
                    <span>${p.duracaoMeses} ${p.duracaoMeses > 1 ? 'meses' : 'mês'}</span>
                    <span>Total ${fmt.moeda(p.valorTotal)}</span>
                </div>
                <div class="info"><span>${p.quantidadeAlunos} aluno(s) no plano</span></div>
                <div class="acoes">
                    <button class="btn btn-sm" data-editar="${p.id}">Editar</button>
                    <button class="btn btn-sm" data-status="${p.id}">${p.ativo ? 'Inativar' : 'Ativar'}</button>
                    <button class="btn btn-sm btn-perigo" data-excluir="${p.id}">Excluir</button>
                </div>
            </div>`).join('')}</div>`
            : '<div class="card vazio">Nenhum plano cadastrado.</div>';

        const porId = id => planos.find(p => p.id == id);
        app.querySelectorAll('[data-editar]').forEach(b => b.onclick = () => this.abrirFormulario(porId(b.dataset.editar), () => this.render(app)));
        app.querySelectorAll('[data-status]').forEach(b => b.onclick = async () => {
            const p = porId(b.dataset.status);
            try {
                await api.patch(`/planos/${p.id}/status` + qs({ ativo: !p.ativo }));
                toast(p.ativo ? 'Plano inativado: não aparecerá para novos alunos.' : 'Plano reativado.');
                this.render(app);
            } catch (e) { erroToast(e); }
        });
        app.querySelectorAll('[data-excluir]').forEach(b => b.onclick = async () => {
            const p = porId(b.dataset.excluir);
            if (!await confirmar(`Excluir o plano <strong>${esc(p.nome)}</strong>?`, { titulo: 'Excluir plano', botao: 'Excluir', perigo: true })) return;
            try {
                await api.del('/planos/' + p.id);
                toast('Plano excluído.');
                this.render(app);
            } catch (e) { erroToast(e); }
        });
    },

    abrirFormulario(plano, aoSalvar) {
        const p = plano || {};
        const corpo = modal.abrir(plano ? 'Editar plano' : 'Novo plano', `
        <form novalidate>
            <div class="form-grade">
                <div class="campo c12"><label>Nome do plano</label><input type="text" name="nome" value="${esc(p.nome)}" placeholder="Ex.: Trimestral"></div>
                <div class="campo c12"><label>Descrição <span class="opc">(opcional)</span></label><textarea name="descricao" placeholder="O que está incluso">${esc(p.descricao)}</textarea></div>
                <div class="campo"><label>Valor mensal (R$)</label><input type="number" name="valorMensal" min="0.01" step="0.01" value="${p.valorMensal ?? ''}"></div>
                <div class="campo"><label>Duração / fidelidade (meses)</label><input type="number" name="duracaoMeses" min="1" max="36" step="1" value="${p.duracaoMeses ?? 1}"></div>
                <div class="campo c12"><span class="dica" id="total-plano"></span></div>
                <div class="campo c12"><label class="check"><input type="checkbox" name="ativo" ${p.ativo !== false ? 'checked' : ''}> Plano ativo (disponível para novos alunos)</label></div>
            </div>
            <div class="form-rodape">
                <button type="button" class="btn" data-fechar>Cancelar</button>
                <button type="submit" class="btn btn-primario">${plano ? 'Salvar alterações' : 'Cadastrar plano'}</button>
            </div>
        </form>`);
        const form = corpo.querySelector('form');
        const atualizarTotal = () => {
            const v = Number(form.valorMensal.value), m = Number(form.duracaoMeses.value);
            corpo.querySelector('#total-plano').textContent = v > 0 && m > 0 ? `Valor total do contrato: ${fmt.moeda(v * m)}` : '';
        };
        form.addEventListener('input', atualizarTotal);
        atualizarTotal();
        form.addEventListener('submit', async ev => {
            ev.preventDefault();
            const r = await enviarFormulario(form,
                d => plano ? api.put('/planos/' + plano.id, d) : api.post('/planos', d),
                plano ? 'Plano atualizado.' : 'Plano cadastrado.');
            if (r && aoSalvar) aoSalvar(r);
        });
    }
};
