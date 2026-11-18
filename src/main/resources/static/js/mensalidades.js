const Mensalidades = {
    filtro: { alunoId: '', situacao: '' },
    alunos: [],

    async render(app, situacaoInicial) {
        if (situacaoInicial) this.filtro.situacao = situacaoInicial;
        cabecalho('Mensalidades', 'Controle de pagamentos e situação financeira', `
            <button class="btn" id="btn-avulsa">+ Lançamento avulso</button>
            <button class="btn btn-primario" id="btn-gerar">Gerar mensalidades</button>`);

        this.alunos = await api.get('/alunos');
        document.getElementById('btn-gerar').onclick = () => this.abrirGerar();
        document.getElementById('btn-avulsa').onclick = () => this.abrirAvulsa();

        app.innerHTML = `
        <div class="filtros">
            <select id="filtro-aluno" style="max-width:320px">${opcoes(this.alunos, this.filtro.alunoId, a => a.nome, 'Todos os alunos')}</select>
        </div>
        <div class="chips" id="chips"></div>
        <div class="card"><div class="tabela-wrap"><table>
            <thead><tr>
                <th>Aluno</th><th>Vencimento</th><th class="num">Valor</th><th class="num">A pagar / Pago</th>
                <th>Pagamento</th><th>Situação</th><th></th>
            </tr></thead>
            <tbody id="lista-mens"><tr><td colspan="7" class="carregando">Carregando…</td></tr></tbody>
        </table></div></div>`;

        document.getElementById('filtro-aluno').onchange = e => { this.filtro.alunoId = e.target.value; this.carregar(); };
        await this.carregar();
    },

    async carregar() {
        const tbody = document.getElementById('lista-mens');
        if (!tbody) return;
        const todas = await api.get('/mensalidades' + qs({ alunoId: this.filtro.alunoId }));
        const cont = s => todas.filter(m => m.situacao === s).length;
        const chips = [['', 'Todas', todas.length], ['PENDENTE', 'Pendentes', cont('PENDENTE')],
            ['ATRASADA', 'Atrasadas', cont('ATRASADA')], ['PAGA', 'Pagas', cont('PAGA')], ['CANCELADA', 'Canceladas', cont('CANCELADA')]];
        document.getElementById('chips').innerHTML = chips.map(([v, t, n]) =>
            `<button class="chip ${this.filtro.situacao === v ? 'ativo' : ''}" data-sit="${v}">${t}<strong>${n}</strong></button>`).join('');
        document.querySelectorAll('[data-sit]').forEach(c => c.onclick = () => { this.filtro.situacao = c.dataset.sit; this.carregar(); });

        const lista = this.filtro.situacao ? todas.filter(m => m.situacao === this.filtro.situacao) : todas;
        tbody.innerHTML = lista.length ? lista.map(m => `
            <tr>
                <td class="nome-cel"><strong>${esc(m.alunoNome)}</strong><span>${esc(m.descricao)}</span></td>
                <td>${fmt.data(m.dataVencimento)}${m.diasAtraso ? `<br><span class="dica">${m.diasAtraso} dia(s) de atraso</span>` : ''}</td>
                <td class="num">${fmt.moeda(m.valor)}</td>
                <td class="num">${m.situacao === 'CANCELADA' ? '—' : fmt.moeda(m.situacao === 'PAGA' ? m.valorPago : m.valorAtualizado)}</td>
                <td>${m.dataPagamento ? fmt.data(m.dataPagamento) + '<br><span class="dica">' + fmt.forma(m.formaPagamento) + '</span>' : '—'}</td>
                <td>${badgeSituacao(m.situacao)}</td>
                <td><div class="acoes">
                    ${['PENDENTE', 'ATRASADA'].includes(m.situacao) ? `<button class="btn btn-sm btn-sucesso" data-pagar="${m.id}">Receber</button>
                        <button class="btn btn-sm" data-cancelar="${m.id}">Cancelar</button>` : ''}
                    ${m.situacao === 'PAGA' ? `<button class="btn btn-sm" data-estornar="${m.id}">Estornar</button>` : ''}
                    ${m.situacao !== 'PAGA' ? `<button class="btn btn-sm btn-perigo" data-excluir="${m.id}" title="Excluir" aria-label="Excluir"><svg class="icone" aria-hidden="true"><use href="#i-lixeira"/></svg></button>` : ''}
                </div></td>
            </tr>`).join('') : tabelaVazia(7, 'Nenhuma mensalidade encontrada.');

        const porId = id => lista.find(m => m.id == id);
        const acao = async (fn, msg) => { try { await fn(); toast(msg); this.carregar(); } catch (e) { erroToast(e); } };

        tbody.querySelectorAll('[data-pagar]').forEach(b => b.onclick = () => this.abrirPagamento(porId(b.dataset.pagar), () => this.carregar()));
        tbody.querySelectorAll('[data-cancelar]').forEach(b => b.onclick = async () => {
            if (await confirmar('Cancelar esta mensalidade? Ela deixará de ser cobrada.', { titulo: 'Cancelar mensalidade', botao: 'Cancelar mensalidade', perigo: true }))
                acao(() => api.patch(`/mensalidades/${b.dataset.cancelar}/cancelar`), 'Mensalidade cancelada.');
        });
        tbody.querySelectorAll('[data-estornar]').forEach(b => b.onclick = async () => {
            if (await confirmar('Estornar o pagamento? A mensalidade volta a ficar em aberto.', { titulo: 'Estornar pagamento', botao: 'Estornar' }))
                acao(() => api.patch(`/mensalidades/${b.dataset.estornar}/estornar`), 'Pagamento estornado.');
        });
        tbody.querySelectorAll('[data-excluir]').forEach(b => b.onclick = async () => {
            if (await confirmar('Excluir esta mensalidade definitivamente?', { titulo: 'Excluir mensalidade', botao: 'Excluir', perigo: true }))
                acao(() => api.del('/mensalidades/' + b.dataset.excluir), 'Mensalidade excluída.');
        });
    },

    previaValor(m, dataPagamento) {
        if (!dataPagamento || dataPagamento <= m.dataVencimento) return Number(m.valor);
        const dias = Math.round((new Date(dataPagamento) - new Date(m.dataVencimento)) / 86400000);
        return Math.round(Number(m.valor) * (1 + 0.02 + 0.01 / 30 * dias) * 100) / 100;
    },

    abrirPagamento(m, aoSalvar) {
        const corpo = modal.abrir('Registrar pagamento', `
        <form novalidate>
            <div class="dados" style="grid-template-columns:1fr 1fr">
                <div><span>Aluno</span>${esc(m.alunoNome)}</div>
                <div><span>Referência</span>${esc(m.descricao)}</div>
                <div><span>Vencimento</span>${fmt.data(m.dataVencimento)}</div>
                <div><span>Valor original</span>${fmt.moeda(m.valor)}</div>
            </div>
            <div class="form-grade">
                <div class="campo"><label>Data do pagamento</label><input type="date" name="dataPagamento" value="${hojeISO()}" max="${hojeISO()}"></div>
                <div class="campo"><label>Forma de pagamento</label>
                    <select name="formaPagamento">
                        <option value="">Selecione…</option>
                        <option value="PIX">Pix</option>
                        <option value="DINHEIRO">Dinheiro</option>
                        <option value="CARTAO_DEBITO">Cartão de débito</option>
                        <option value="CARTAO_CREDITO">Cartão de crédito</option>
                        <option value="BOLETO">Boleto</option>
                    </select>
                </div>
                <div class="campo c12"><div class="aviso" id="previa-valor"></div></div>
            </div>
            <div class="form-rodape">
                <button type="button" class="btn" data-fechar>Cancelar</button>
                <button type="submit" class="btn btn-sucesso">Confirmar recebimento</button>
            </div>
        </form>`, 'sm');
        const form = corpo.querySelector('form');
        const previa = () => {
            const v = this.previaValor(m, form.dataPagamento.value);
            const juros = v - Number(m.valor);
            corpo.querySelector('#previa-valor').innerHTML = juros > 0
                ? `Valor a receber: <strong>${fmt.moeda(v)}</strong> (inclui ${fmt.moeda(juros)} de multa de 2% + juros de 1% ao mês).`
                : `Valor a receber: <strong>${fmt.moeda(v)}</strong> (sem encargos).`;
        };
        form.dataPagamento.addEventListener('input', previa);
        previa();
        form.addEventListener('submit', async ev => {
            ev.preventDefault();
            const r = await enviarFormulario(form, d => api.patch(`/mensalidades/${m.id}/pagar`, d), 'Pagamento registrado.');
            if (r && aoSalvar) aoSalvar(r);
        });
    },

    abrirGerar() {
        const ativos = this.alunos.filter(a => a.ativo && a.planoId);
        const corpo = modal.abrir('Gerar mensalidades', `
        <form novalidate>
            <div class="form-grade">
                <div class="campo c12"><label>Aluno</label>
                    <select name="alunoId" data-tipo="numero">${opcoes(ativos, this.filtro.alunoId, a => `${a.nome} — ${a.planoNome}`, 'Selecione…')}</select>
                    <span class="dica">Somente alunos ativos e com plano aparecem aqui.</span>
                </div>
                <div class="campo"><label>Quantidade de meses</label><input type="number" name="quantidade" min="1" max="12" value="1"></div>
                <div class="campo"><label>Primeiro vencimento <span class="opc">(opcional)</span></label><input type="date" name="primeiroVencimento"></div>
                <div class="campo c12"><span class="dica">Se o primeiro vencimento ficar em branco, o sistema continua a partir da última mensalidade do aluno. Vencimentos já existentes são ignorados.</span></div>
            </div>
            <div class="form-rodape">
                <button type="button" class="btn" data-fechar>Cancelar</button>
                <button type="submit" class="btn btn-primario">Gerar</button>
            </div>
        </form>`);
        corpo.querySelector('form').addEventListener('submit', async ev => {
            ev.preventDefault();
            const r = await enviarFormulario(ev.target, d => api.post('/mensalidades/gerar', d));
            if (r) { toast(`${r.length} mensalidade(s) gerada(s).`); this.carregar(); }
        });
    },

    abrirAvulsa() {
        const corpo = modal.abrir('Lançamento avulso', `
        <form novalidate>
            <div class="form-grade">
                <div class="campo c12"><label>Aluno</label>
                    <select name="alunoId" data-tipo="numero">${opcoes(this.alunos, this.filtro.alunoId, a => a.nome, 'Selecione…')}</select></div>
                <div class="campo c12"><label>Descrição <span class="opc">(opcional)</span></label><input type="text" name="descricao" placeholder="Ex.: Taxa de matrícula"></div>
                <div class="campo"><label>Valor (R$) <span class="opc">(vazio = valor do plano)</span></label><input type="number" name="valor" min="0.01" step="0.01"></div>
                <div class="campo"><label>Vencimento</label><input type="date" name="dataVencimento" value="${hojeISO()}"></div>
            </div>
            <div class="form-rodape">
                <button type="button" class="btn" data-fechar>Cancelar</button>
                <button type="submit" class="btn btn-primario">Lançar</button>
            </div>
        </form>`);
        corpo.querySelector('form').addEventListener('submit', async ev => {
            ev.preventDefault();
            const r = await enviarFormulario(ev.target, d => api.post('/mensalidades', d), 'Mensalidade lançada.');
            if (r) this.carregar();
        });
    }
};
