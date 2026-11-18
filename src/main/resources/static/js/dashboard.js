const Dashboard = {
    async render(app) {
        cabecalho('Painel', 'Visão geral da academia hoje', '');
        const d = await api.get('/dashboard');

        app.innerHTML = `
        <div class="grade grade-4">
            <div class="card kpi destaque">
                <div class="rotulo">Alunos ativos</div>
                <div class="valor">${d.alunosAtivos}</div>
                <div class="det">${d.totalAlunos} cadastrados no total</div>
            </div>
            <div class="card kpi ok">
                <div class="rotulo">Recebido no mês</div>
                <div class="valor">${fmt.moeda(d.recebidoNoMes)}</div>
                <div class="det">A receber no mês: ${fmt.moeda(d.aReceberNoMes)}</div>
            </div>
            <div class="card kpi ${d.mensalidadesAtrasadas ? 'alerta' : 'ok'}">
                <div class="rotulo">Em atraso</div>
                <div class="valor">${fmt.moeda(d.valorEmAtraso)}</div>
                <div class="det">${d.mensalidadesAtrasadas} mensalidade(s) · ${d.alunosInadimplentes} aluno(s)</div>
            </div>
            <div class="card kpi">
                <div class="rotulo">Equipe e treinos</div>
                <div class="valor">${d.professoresAtivos} <small style="font-size:14px;color:var(--texto-3);font-weight:500">professores</small></div>
                <div class="det">${d.fichasAtivas} fichas ativas · ${d.planosAtivos} planos · ${d.avaliacoesNoMes} avaliações no mês</div>
            </div>
        </div>

        <div class="grade grade-2 mt">
            <div class="card">
                <div class="card-cab">
                    <h3>Mensalidades em atraso</h3>
                    <a class="dir btn-link" href="#/mensalidades/ATRASADA">Ver todas</a>
                </div>
                <div class="tabela-wrap"><table>
                    <thead><tr><th>Aluno</th><th>Vencimento</th><th class="num">Valor atualizado</th><th></th></tr></thead>
                    <tbody>${d.mensalidadesEmAtraso.length ? d.mensalidadesEmAtraso.map(m => `
                        <tr>
                            <td class="nome-cel"><strong>${esc(m.alunoNome)}</strong><span>${esc(m.descricao)}</span></td>
                            <td>${fmt.data(m.dataVencimento)}<br><span class="badge b-vermelho">${m.diasAtraso} dia(s)</span></td>
                            <td class="num">${fmt.moeda(m.valorAtualizado)}</td>
                            <td><button class="btn btn-sm btn-sucesso" data-receber="${m.id}">Receber</button></td>
                        </tr>`).join('') : tabelaVazia(4, 'Nenhuma mensalidade em atraso.')}
                    </tbody>
                </table></div>
            </div>
            <div class="card">
                <div class="card-cab"><h3>Vencimentos nos próximos 15 dias</h3></div>
                <div class="tabela-wrap"><table>
                    <thead><tr><th>Aluno</th><th>Vencimento</th><th class="num">Valor</th></tr></thead>
                    <tbody>${d.proximosVencimentos.length ? d.proximosVencimentos.map(m => `
                        <tr>
                            <td class="nome-cel"><strong>${esc(m.alunoNome)}</strong><span>${esc(m.descricao)}</span></td>
                            <td>${fmt.data(m.dataVencimento)}</td>
                            <td class="num">${fmt.moeda(m.valor)}</td>
                        </tr>`).join('') : tabelaVazia(3, 'Nenhum vencimento nos próximos dias.')}
                    </tbody>
                </table></div>
            </div>
        </div>`;

        app.querySelectorAll('[data-receber]').forEach(b => b.addEventListener('click', async () => {
            const m = d.mensalidadesEmAtraso.find(x => x.id == b.dataset.receber);
            Mensalidades.abrirPagamento(m, () => Dashboard.render(app));
        }));
    }
};
