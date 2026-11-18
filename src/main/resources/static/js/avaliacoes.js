const Avaliacoes = {
    alunoId: '',

    async render(app, alunoParam) {
        if (alunoParam) this.alunoId = alunoParam;
        cabecalho('Avaliações físicas', 'Registro e acompanhamento da evolução dos alunos',
            '<button class="btn btn-primario" id="btn-nova-aval">+ Nova avaliação</button>');
        const alunos = await api.get('/alunos');
        document.getElementById('btn-nova-aval').onclick = () => this.abrirFormulario(null);

        app.innerHTML = `
        <div class="filtros">
            <select id="filtro-aluno-aval" style="max-width:320px">${opcoes(alunos, this.alunoId, a => a.nome, 'Todos os alunos')}</select>
            <span class="dica">Selecione um aluno para ver o comparativo e os gráficos de evolução.</span>
        </div>
        <div id="evolucao"></div>
        <div class="card mt"><div class="tabela-wrap"><table>
            <thead><tr><th>Data</th><th>Aluno</th><th class="num">Peso</th><th class="num">Altura</th><th class="num">IMC</th><th class="centro">Classificação</th>
                <th class="num">% Gordura</th><th class="num">Massa magra</th><th class="num">RCQ</th><th>Avaliador</th><th></th></tr></thead>
            <tbody id="lista-aval"><tr><td colspan="11" class="carregando">Carregando…</td></tr></tbody>
        </table></div></div>`;
        document.getElementById('filtro-aluno-aval').onchange = e => { this.alunoId = e.target.value; this.carregar(); };
        await this.carregar();
    },

    classeImc(c) {
        if (!c) return 'b-cinza';
        if (c === 'Peso normal') return 'b-verde';
        if (c === 'Sobrepeso' || c === 'Abaixo do peso') return 'b-amarelo';
        return 'b-vermelho';
    },

    async carregar() {
        const tbody = document.getElementById('lista-aval');
        if (!tbody) return;
        const [lista, evo] = await Promise.all([
            api.get('/avaliacoes' + qs({ alunoId: this.alunoId })),
            this.alunoId ? api.get('/avaliacoes/evolucao/' + this.alunoId) : Promise.resolve(null)
        ]);
        this.renderEvolucao(evo);

        tbody.innerHTML = lista.length ? lista.map(a => `
            <tr>
                <td>${fmt.data(a.dataAvaliacao)}</td>
                <td>${esc(a.alunoNome)}</td>
                <td class="num">${fmt.num(a.peso, 1, ' kg')}</td>
                <td class="num">${fmt.num(a.altura, 2, ' m')}</td>
                <td class="num"><strong>${fmt.num(a.imc, 1)}</strong></td>
                <td class="centro"><span class="badge ${this.classeImc(a.classificacaoImc)}">${esc(a.classificacaoImc)}</span></td>
                <td class="num">${fmt.num(a.percentualGordura, 1, '%')}</td>
                <td class="num">${fmt.num(a.massaMagra, 1, ' kg')}</td>
                <td class="num">${fmt.num(a.relacaoCinturaQuadril, 2)}</td>
                <td>${esc(a.professorNome || '—')}</td>
                <td><div class="acoes">
                    <button class="btn btn-sm" data-ver="${a.id}">Ver</button>
                    <button class="btn btn-sm" data-editar="${a.id}">Editar</button>
                    <button class="btn btn-sm btn-perigo" data-excluir="${a.id}" title="Excluir" aria-label="Excluir"><svg class="icone" aria-hidden="true"><use href="#i-lixeira"/></svg></button>
                </div></td>
            </tr>`).join('') : tabelaVazia(11, 'Nenhuma avaliação registrada.');

        const porId = id => lista.find(a => a.id == id);
        tbody.querySelectorAll('[data-ver]').forEach(b => b.onclick = () => this.detalhar(porId(b.dataset.ver)));
        tbody.querySelectorAll('[data-editar]').forEach(b => b.onclick = () => this.abrirFormulario(porId(b.dataset.editar)));
        tbody.querySelectorAll('[data-excluir]').forEach(b => b.onclick = async () => {
            const a = porId(b.dataset.excluir);
            if (!await confirmar(`Excluir a avaliação de ${esc(a.alunoNome)} em ${fmt.data(a.dataAvaliacao)}?`, { titulo: 'Excluir avaliação', botao: 'Excluir', perigo: true })) return;
            try {
                await api.del('/avaliacoes/' + a.id);
                toast('Avaliação excluída.');
                this.carregar();
            } catch (e) { erroToast(e); }
        });
    },

    renderEvolucao(evo) {
        const box = document.getElementById('evolucao');
        if (!evo) { box.innerHTML = ''; return; }
        if (evo.totalAvaliacoes === 0) {
            box.innerHTML = `<div class="card card-corpo vazio">${esc(evo.alunoNome)} ainda não possui avaliações.</div>`;
            return;
        }
        const comp = (rotulo, campo, delta, casas, suf, menorMelhor) => {
            const antes = evo.primeira[campo], depois = evo.ultima[campo];
            let cls = 'neutro';
            if (delta && menorMelhor !== null) cls = (delta < 0) === menorMelhor ? 'bom' : 'ruim';
            return `<div class="comp">
                <div class="rotulo">${rotulo}</div>
                <div class="vals">${fmt.num(antes, casas)} <svg class="icone" aria-hidden="true"><use href="#i-seta"/></svg> <strong>${fmt.num(depois, casas)}</strong>${suf}</div>
                <div class="delta ${cls}">${evo.totalAvaliacoes > 1 ? fmt.sinal(delta, casas, suf) : 'primeira avaliação'}</div>
            </div>`;
        };
        const pontos = campo => evo.historico.map(h => ({ rotulo: fmt.data(h.dataAvaliacao).slice(0, 5), valor: h[campo] }));

        box.innerHTML = `
        <div class="card">
            <div class="card-cab">
                <h3>Evolução de ${esc(evo.alunoNome)}</h3>
                <span class="dir dica">${evo.totalAvaliacoes} avaliação(ões) · de ${fmt.data(evo.primeira.dataAvaliacao)} a ${fmt.data(evo.ultima.dataAvaliacao)}</span>
            </div>
            <div class="card-corpo">
                <div class="comparativo">
                    ${comp('Peso', 'peso', evo.variacaoPeso, 1, ' kg', null)}
                    ${comp('IMC', 'imc', evo.variacaoImc, 1, '', null)}
                    ${comp('% Gordura', 'percentualGordura', evo.variacaoPercentualGordura, 1, '%', true)}
                    ${comp('Massa magra', 'massaMagra', evo.variacaoMassaMagra, 1, ' kg', false)}
                    ${comp('Cintura', 'cintura', evo.variacaoCintura, 1, ' cm', true)}
                </div>
                <div class="graficos mt">
                    <div class="grafico"><h4>Peso (kg)</h4>${graficoLinha(pontos('peso'), { cor: '#f97316', sufixo: ' kg' })}</div>
                    <div class="grafico"><h4>% de gordura</h4>${graficoLinha(pontos('percentualGordura'), { cor: '#2563eb', sufixo: '%' })}</div>
                </div>
            </div>
        </div>`;
    },

    detalhar(a) {
        const l = (r, v) => `<div><span>${r}</span>${v}</div>`;
        modal.abrir(`Avaliação de ${a.alunoNome}`, `
            <div class="dados">
                ${l('Data', fmt.data(a.dataAvaliacao))}${l('Avaliador', esc(a.professorNome || '—'))}${l('Classificação', `<span class="badge ${this.classeImc(a.classificacaoImc)}">${esc(a.classificacaoImc)}</span>`)}
                ${l('Peso', fmt.num(a.peso, 1, ' kg'))}${l('Altura', fmt.num(a.altura, 2, ' m'))}${l('IMC', fmt.num(a.imc, 1))}
                ${l('% Gordura', fmt.num(a.percentualGordura, 1, '%'))}${l('Massa gorda', fmt.num(a.massaGorda, 1, ' kg'))}${l('Massa magra', fmt.num(a.massaMagra, 1, ' kg'))}
            </div>
            <div class="secao-form">Circunferências (cm)</div>
            <div class="dados" style="margin-top:10px">
                ${l('Tórax', fmt.num(a.torax, 1))}${l('Cintura', fmt.num(a.cintura, 1))}${l('Abdômen', fmt.num(a.abdomen, 1))}
                ${l('Quadril', fmt.num(a.quadril, 1))}${l('Braço direito', fmt.num(a.bracoDireito, 1))}${l('Coxa direita', fmt.num(a.coxaDireita, 1))}
                ${l('Relação cintura/quadril', fmt.num(a.relacaoCinturaQuadril, 2))}${l('FC de repouso', a.frequenciaCardiacaRepouso ? a.frequenciaCardiacaRepouso + ' bpm' : '—')}${l('Pressão arterial', esc(a.pressaoArterial || '—'))}
            </div>
            ${a.observacoes ? `<p><strong>Observações:</strong> ${esc(a.observacoes)}</p>` : ''}
            <div class="form-rodape"><button class="btn btn-primario" data-fechar>Fechar</button></div>`, 'lg');
    },

    async abrirFormulario(aval) {
        const [alunos, profs] = await Promise.all([api.get('/alunos?ativo=true'), api.get('/professores')]);
        const profsAtivos = profs.filter(p => p.ativo || (aval && p.id === aval.professorId));
        const a = aval || { dataAvaliacao: hojeISO() };
        const num = (nome, rot, extra = '', classe = 'c3') =>
            `<div class="campo ${classe}"><label>${rot}</label><input type="number" name="${nome}" step="0.1" min="0" value="${a[nome] ?? ''}" ${extra}></div>`;

        const corpo = modal.abrir(aval ? 'Editar avaliação física' : 'Nova avaliação física', `
        <form novalidate>
            <div class="form-grade">
                <div class="campo c4"><label>Aluno</label><select name="alunoId" data-tipo="numero">${opcoes(alunos, a.alunoId ?? this.alunoId, x => x.nome, 'Selecione…')}</select></div>
                <div class="campo c4"><label>Avaliador</label><select name="professorId" data-tipo="numero">${opcoes(profsAtivos, a.professorId, p => p.nome, 'Sem avaliador')}</select></div>
                <div class="campo c4"><label>Data</label><input type="date" name="dataAvaliacao" value="${esc(a.dataAvaliacao)}" max="${hojeISO()}"></div>

                <div class="secao-form">Composição corporal</div>
                ${num('peso', 'Peso (kg)')}
                <div class="campo c3"><label>Altura (m)</label><input type="number" name="altura" step="0.01" min="1" max="2.5" placeholder="1.75" value="${a.altura ?? ''}"></div>
                ${num('percentualGordura', '% de gordura <span class="opc">(opc.)</span>')}
                <div class="campo c3"><label>FC repouso (bpm)</label><input type="number" name="frequenciaCardiacaRepouso" step="1" min="30" max="200" value="${a.frequenciaCardiacaRepouso ?? ''}"></div>
                <div class="imc-preview" id="imc-preview">Informe peso e altura para calcular o IMC.</div>

                <div class="secao-form">Circunferências (cm) <span class="opc" style="font-weight:400">— opcionais</span></div>
                ${num('torax', 'Tórax', '', 'c4')}${num('cintura', 'Cintura', '', 'c4')}${num('abdomen', 'Abdômen', '', 'c4')}
                ${num('quadril', 'Quadril', '', 'c4')}${num('bracoDireito', 'Braço direito', '', 'c4')}${num('coxaDireita', 'Coxa direita', '', 'c4')}

                <div class="secao-form">Outros</div>
                <div class="campo c4"><label>Pressão arterial</label><input type="text" name="pressaoArterial" placeholder="120/80" value="${esc(a.pressaoArterial)}"></div>
                <div class="campo c8"><label>Observações</label><input type="text" name="observacoes" value="${esc(a.observacoes)}"></div>
            </div>
            <div class="form-rodape">
                <button type="button" class="btn" data-fechar>Cancelar</button>
                <button type="submit" class="btn btn-primario">${aval ? 'Salvar alterações' : 'Registrar avaliação'}</button>
            </div>
        </form>`, 'lg');

        const form = corpo.querySelector('form');
        const previa = () => {
            const p = Number(form.peso.value), h = Number(form.altura.value), g = Number(form.percentualGordura.value);
            const box = corpo.querySelector('#imc-preview');
            if (!(p > 0 && h > 0)) { box.textContent = 'Informe peso e altura para calcular o IMC.'; return; }
            const imc = p / (h * h);
            const cls = imc < 18.5 ? 'Abaixo do peso' : imc < 25 ? 'Peso normal' : imc < 30 ? 'Sobrepeso'
                : imc < 35 ? 'Obesidade grau I' : imc < 40 ? 'Obesidade grau II' : 'Obesidade grau III';
            box.innerHTML = `IMC calculado: <strong>${fmt.num(imc, 1)}</strong> <span class="badge ${this.classeImc(cls)}">${cls}</span>` +
                (g > 0 ? ` · Massa gorda ${fmt.num(p * g / 100, 1, ' kg')} · Massa magra ${fmt.num(p - p * g / 100, 1, ' kg')}` : '');
        };
        form.addEventListener('input', previa);
        previa();
        form.addEventListener('submit', async ev => {
            ev.preventDefault();
            const r = await enviarFormulario(form,
                d => aval ? api.put('/avaliacoes/' + aval.id, d) : api.post('/avaliacoes', d),
                aval ? 'Avaliação atualizada.' : 'Avaliação registrada.');
            if (r) {
                if (!this.alunoId) this.alunoId = String(r.alunoId);
                const sel = document.getElementById('filtro-aluno-aval');
                if (sel) sel.value = this.alunoId;
                this.carregar();
            }
        });
    }
};
