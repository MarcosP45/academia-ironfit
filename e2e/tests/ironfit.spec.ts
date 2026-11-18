import { test, Page, BrowserContext } from '@playwright/test';
import {
  caso, expect, ir, modal, toast, escolher, textoToast, salvarRegistros,
  SUF, cpfValido, hojeISO,
} from './helpers';

test.describe.configure({ mode: 'serial' });

let page: Page;
let ctx: BrowserContext;
const errosJs: string[] = [];
const respostas5xx: string[] = [];
const P = () => page;

const N = Number(SUF);
const PLANO = `Bimestral E2E ${SUF}`;
const ALUNO = `Aluno E2E ${SUF}`;
const PROF = `Professor E2E ${SUF}`;
const ESP = `Yoga${SUF}`;
const CREF = `E2E-${SUF}`;
const CPF_ALUNO = cpfValido(N);
const CPF_PROF = cpfValido(N + 1);
const FICHA = `Treino A E2E ${SUF}`;

test.beforeAll(async ({ browser }) => {
  ctx = await browser.newContext({ viewport: { width: 1366, height: 820 }, locale: 'pt-BR', timezoneId: 'America/Sao_Paulo' });
  page = await ctx.newPage();
  page.on('pageerror', e => errosJs.push(e.message));
  page.on('response', r => { if (r.status() >= 500) respostas5xx.push(`${r.status()} ${r.url()}`); });
  await page.goto('/');
});

test.afterAll(async () => {
  salvarRegistros();
  await ctx?.close();
});

caso(P, 'Geral', 'Carregamento e conexao com a API',
  'Página abre com o título "Painel", o menu tem 7 módulos e o rodapé mostra "API conectada".',
  async p => {
    await p.goto('/');
    await expect(p.locator('#titulo-pagina')).toHaveText('Painel');
    await expect(p.locator('#status-api')).toHaveText('API conectada');
    await expect(p.locator('#menu a')).toHaveCount(7);
    const itens = await p.locator('#menu a').allInnerTexts();
    return `Título "Painel"; status "${await p.locator('#status-api').innerText()}"; menu: ${itens.map(t => t.replace(/^\S\s*/, '').trim()).join(', ')}.`;
  });

caso(P, 'Geral', 'Painel exibe os indicadores',
  'Aparecem os cartões "Alunos ativos", "Recebido no mês", "Em atraso" e "Equipe e treinos", e as listas de atrasadas e vencimentos.',
  async p => {
    await ir(p, 'dashboard', 'Painel');
    const rotulos = await p.locator('.kpi .rotulo').allInnerTexts();
    for (const r of ['Alunos ativos', 'Recebido no mês', 'Em atraso', 'Equipe e treinos']) expect(rotulos).toContain(r);
    await expect(p.getByRole('heading', { name: 'Mensalidades em atraso' })).toBeVisible();
    await expect(p.getByRole('heading', { name: /Vencimentos nos próximos 15 dias/ })).toBeVisible();
    const valores = await p.locator('.kpi').allInnerTexts();
    return `Cartões: ${valores.map(v => v.replace(/\s+/g, ' ').trim()).join(' | ')}.`;
  });

caso(P, 'Geral', 'Navegação pelos 7 módulos do menu',
  'Cada item do menu abre a página com o título correto, sem mensagem de erro.',
  async p => {
    const rotas: [string, string][] = [['dashboard', 'Painel'], ['alunos', 'Alunos'], ['planos', 'Planos'],
      ['mensalidades', 'Mensalidades'], ['professores', 'Professores'], ['treinos', 'Fichas de treino'], ['avaliacoes', 'Avaliações físicas']];
    const vistos: string[] = [];
    for (const [r, t] of rotas) {
      await ir(p, r, t);
      await expect(p.locator(`#menu a[data-rota="${r}"]`)).toHaveClass(/ativo/);
      vistos.push(t);
    }
    return `Títulos abertos em ordem: ${vistos.join(' → ')}.`;
  });

caso(P, 'Alunos', 'Listagem com dados de exemplo',
  'A tabela lista os alunos de exemplo (mínimo 5), incluindo "Ana Beatriz Souza", com CPF formatado e situação.',
  async p => {
    await ir(p, 'alunos', 'Alunos');
    const linhas = p.locator('#lista-alunos tr');
    await expect(linhas.first()).toBeVisible();
    expect(await linhas.count()).toBeGreaterThanOrEqual(5);
    const ana = p.locator('#lista-alunos tr', { hasText: 'Ana Beatriz Souza' });
    await expect(ana).toContainText('996.030.824-30');
    return `${await linhas.count()} alunos listados. Linha da Ana: "${(await ana.innerText()).replace(/\s+/g, ' ').trim()}".`;
  });

caso(P, 'Alunos', 'Busca por nome',
  'Digitar "ana" mostra somente alunos cujo nome contém "ana" (Ana Beatriz Souza) e oculta os demais.',
  async p => {
    await p.locator('#busca-aluno').fill('ana');
    await expect(p.locator('#lista-alunos tr', { hasText: 'Ana Beatriz Souza' })).toBeVisible();
    await expect(p.locator('#lista-alunos tr', { hasText: 'Carlos Eduardo Lima' })).toHaveCount(0);
    const nomes = await p.locator('#lista-alunos tr .nome-cel strong').allInnerTexts();
    nomes.forEach(n => expect(n.toLowerCase()).toContain('ana'));
    return `Resultado para "ana": ${nomes.join(', ')}.`;
  });

caso(P, 'Alunos', 'Busca por CPF com pontos e traço (correção)',
  'Digitar o CPF completo "996.030.824-30" encontra exatamente 1 aluno: Ana Beatriz Souza.',
  async p => {
    await p.locator('#busca-aluno').fill('996.030.824-30');
    await expect(p.locator('#lista-alunos tr')).toHaveCount(1);
    await expect(p.locator('#lista-alunos tr')).toContainText('Ana Beatriz Souza');
    return `1 linha retornada: ${(await p.locator('#lista-alunos tr .nome-cel strong').innerText())}.`;
  });

caso(P, 'Alunos', 'Busca por CPF apenas com dígitos',
  'Digitar "99603082430" (sem pontuação) também encontra Ana Beatriz Souza.',
  async p => {
    await p.locator('#busca-aluno').fill('99603082430');
    await expect(p.locator('#lista-alunos tr')).toHaveCount(1);
    await expect(p.locator('#lista-alunos tr')).toContainText('Ana Beatriz Souza');
    return `1 linha retornada: ${(await p.locator('#lista-alunos tr .nome-cel strong').innerText())}.`;
  });

caso(P, 'Alunos', 'Busca por CPF parcial com pontuação',
  'Digitar "996.030" (parte do CPF com ponto) encontra Ana Beatriz Souza.',
  async p => {
    await p.locator('#busca-aluno').fill('996.030');
    await expect(p.locator('#lista-alunos tr', { hasText: 'Ana Beatriz Souza' })).toBeVisible();
    return `Linhas retornadas: ${await p.locator('#lista-alunos tr').count()} (inclui Ana Beatriz Souza).`;
  });

caso(P, 'Alunos', 'Busca sem resultado',
  'Digitar um termo inexistente exibe a mensagem "Nenhum aluno encontrado.".',
  async p => {
    await p.locator('#busca-aluno').fill('zzzNaoExiste999');
    await expect(p.locator('#lista-alunos')).toContainText('Nenhum aluno encontrado.');
    const t = (await p.locator('#lista-alunos').innerText()).trim();
    await p.locator('#busca-aluno').fill('');
    await expect(p.locator('#lista-alunos tr').nth(4)).toBeVisible();
    return `Tabela mostra: "${t}". Ao limpar a busca a lista completa volta.`;
  });

caso(P, 'Alunos', 'Filtro "Somente inativos"',
  'Ao filtrar por inativos, todas as linhas exibidas têm o selo "Inativo"; ao voltar para "Todos", a lista completa retorna.',
  async p => {
    await p.locator('#filtro-ativo').selectOption('false');
    await expect(p.locator('#lista-alunos tr').first()).toBeVisible();
    const linhas = await p.locator('#lista-alunos tr').allInnerTexts();
    linhas.forEach(l => expect(l).toContain('Inativo'));
    await p.locator('#filtro-ativo').selectOption('');
    await expect(p.locator('#lista-alunos tr').nth(4)).toBeVisible();
    return `${linhas.length} aluno(s) inativo(s) exibido(s): ${linhas.map(l => l.split('\n')[0]).join(', ')}.`;
  });

caso(P, 'Planos', 'Cadastro de plano com total do contrato calculado',
  'Ao digitar R$ 119,90 e 2 meses, o formulário mostra "Valor total do contrato: R$ 239,80". Ao salvar, aparece o toast "Plano cadastrado." e o cartão do plano na lista.',
  async p => {
    await ir(p, 'planos', 'Planos');
    await p.locator('#btn-novo-plano').click();
    const m = modal(p);
    await m.locator('input[name="nome"]').fill(PLANO);
    await m.locator('input[name="valorMensal"]').fill('119.90');
    await m.locator('input[name="duracaoMeses"]').fill('2');
    await expect(m.locator('#total-plano')).toHaveText(/Valor total do contrato: R\$\s*239,80/);
    const previa = (await m.locator('#total-plano').innerText()).trim();
    await m.getByRole('button', { name: 'Cadastrar plano' }).click();
    const msg = await textoToast(p, 'Plano cadastrado.');
    const card = p.locator('.card.plano', { hasText: PLANO });
    await expect(card).toBeVisible();
    await expect(card).toContainText(/Total R\$\s*239,80/);
    return `Prévia: "${previa}". Toast: "${msg}". Cartão: "${(await card.innerText()).replace(/\s+/g, ' ').trim()}".`;
  });

caso(P, 'Planos', 'Validação do formulário de plano',
  'Enviar o formulário vazio mantém a janela aberta e marca o nome e o valor em vermelho com mensagem.',
  async p => {
    await p.locator('#btn-novo-plano').click();
    const m = modal(p);
    await m.locator('input[name="duracaoMeses"]').fill('');
    await m.getByRole('button', { name: 'Cadastrar plano' }).click();
    await expect(m.locator('.erro-campo').first()).toBeVisible();
    await expect(m.locator('input[name="nome"]')).toHaveClass(/invalido/);
    const msgs = await m.locator('.erro-campo').allInnerTexts();
    await m.getByRole('button', { name: 'Cancelar' }).click();
    await expect(m).toBeHidden();
    return `Janela permaneceu aberta com ${msgs.length} erro(s): ${msgs.join(' | ')}.`;
  });

caso(P, 'Alunos', 'Cadastro rejeita CPF inválido',
  'Informar CPF 123.456.789-00 exibe o aviso "CPF inválido." e a janela continua aberta (nada é gravado).',
  async p => {
    await ir(p, 'alunos', 'Alunos');
    await p.locator('#btn-novo-aluno').click();
    const m = modal(p);
    await m.locator('input[name="nome"]').fill('Fulano CPF Invalido');
    await m.locator('input[name="cpf"]').fill('12345678900');
    await m.getByRole('button', { name: 'Cadastrar aluno' }).click();
    const msg = await textoToast(p, 'CPF inválido.');
    await expect(m).toBeVisible();
    await m.getByRole('button', { name: 'Cancelar' }).click();
    return `Toast de erro: "${msg}". Janela de cadastro permaneceu aberta.`;
  });

caso(P, 'Alunos', 'Validação de campos obrigatórios',
  'Enviar o formulário em branco marca nome e CPF em vermelho com a mensagem de cada campo.',
  async p => {
    await p.locator('#btn-novo-aluno').click();
    const m = modal(p);
    await m.getByRole('button', { name: 'Cadastrar aluno' }).click();
    await expect(m.locator('.erro-campo').first()).toBeVisible();
    await expect(m.locator('input[name="nome"]')).toHaveClass(/invalido/);
    const msgs = await m.locator('.erro-campo').allInnerTexts();
    await m.getByRole('button', { name: 'Cancelar' }).click();
    return `Erros exibidos: ${msgs.join(' | ')}.`;
  });

caso(P, 'Alunos', 'Cadastro válido com plano e máscaras de CPF/telefone',
  'CPF e telefone são formatados ao digitar. Ao salvar: toast "Aluno cadastrado." e o aluno aparece na lista com o plano escolhido.',
  async p => {
    await p.locator('#btn-novo-aluno').click();
    const m = modal(p);
    await m.locator('input[name="nome"]').fill(ALUNO);
    await m.locator('input[name="cpf"]').fill(CPF_ALUNO.replace(/\D/g, ''));
    await m.locator('input[name="telefone"]').fill('24988887777');
    await m.locator('input[name="email"]').fill(`e2e${SUF}@email.com`);
    await m.locator('input[name="dataNascimento"]').fill('1995-05-20');
    await escolher(m.locator('select[name="planoId"]'), PLANO);
    await expect(m.locator('input[name="cpf"]')).toHaveValue(CPF_ALUNO);
    await expect(m.locator('input[name="telefone"]')).toHaveValue('(24) 98888-7777');
    const cpfMasc = await m.locator('input[name="cpf"]').inputValue();
    const telMasc = await m.locator('input[name="telefone"]').inputValue();
    await m.getByRole('button', { name: 'Cadastrar aluno' }).click();
    const msg = await textoToast(p, 'Aluno cadastrado.');
    await p.locator('#busca-aluno').fill(SUF);
    const linha = p.locator('#lista-alunos tr', { hasText: ALUNO });
    await expect(linha).toHaveCount(1);
    await expect(linha).toContainText(PLANO);
    return `Máscaras: CPF "${cpfMasc}", telefone "${telMasc}". Toast: "${msg}". Linha: "${(await linha.innerText()).replace(/\s+/g, ' ').trim()}".`;
  });

caso(P, 'Alunos', 'Ficha do aluno (botão Ver)',
  'A janela "Ficha do aluno" mostra os dados e a aba "Mensalidades (2)" (plano bimestral gerou 2 mensalidades automaticamente).',
  async p => {
    await p.locator('#lista-alunos tr', { hasText: ALUNO }).getByRole('button', { name: 'Ver' }).click();
    const m = modal(p);
    await expect(m.locator('#modal-titulo')).toHaveText('Ficha do aluno');
    await expect(m.getByRole('button', { name: 'Mensalidades (2)' })).toBeVisible();
    await expect(m.locator('[data-painel="m"] tbody tr')).toHaveCount(2);
    const abas = await m.locator('.aba').allInnerTexts();
    const mens = await m.locator('[data-painel="m"] tbody tr').first().innerText();
    await m.getByRole('button', { name: 'Treinos (0)' }).click();
    await expect(m.locator('[data-painel="f"]')).toBeVisible();
    await m.locator('button.btn-primario', { hasText: 'Fechar' }).click();
    await expect(m).toBeHidden();
    return `Abas: ${abas.join(' | ')}. 1ª mensalidade: "${mens.replace(/\s+/g, ' ').trim()}".`;
  });

caso(P, 'Alunos', 'Edição de aluno',
  'Alterar o e-mail e salvar mostra "Aluno atualizado." e o novo e-mail na lista.',
  async p => {
    await p.locator('#lista-alunos tr', { hasText: ALUNO }).getByRole('button', { name: 'Editar' }).click();
    const m = modal(p);
    await expect(m.locator('#modal-titulo')).toHaveText('Editar aluno');
    await m.locator('input[name="email"]').fill(`novo${SUF}@email.com`);
    await m.getByRole('button', { name: 'Salvar alterações' }).click();
    const msg = await textoToast(p, 'Aluno atualizado.');
    await expect(p.locator('#lista-alunos tr', { hasText: ALUNO })).toContainText(`novo${SUF}@email.com`);
    return `Toast: "${msg}". E-mail na lista: novo${SUF}@email.com.`;
  });

caso(P, 'Alunos', 'Inativar e reativar aluno',
  'Inativar exibe o selo "Inativo" e o toast "Aluno inativado."; reativar volta para "Ativo" com "Aluno reativado.".',
  async p => {
    const linha = () => p.locator('#lista-alunos tr', { hasText: ALUNO });
    await linha().getByRole('button', { name: 'Inativar' }).click();
    const m1 = await textoToast(p, 'Aluno inativado.');
    await expect(linha()).toContainText('Inativo');
    await linha().getByRole('button', { name: 'Ativar' }).click();
    const m2 = await textoToast(p, 'Aluno reativado.');
    await expect(linha().locator('.badge', { hasText: /^Ativo$/ })).toBeVisible();
    return `Toasts: "${m1}" e "${m2}". Situação final: Ativo.`;
  });

caso(P, 'Alunos', 'Persistência após recarregar a página (F5)',
  'Depois de recarregar o navegador, o aluno cadastrado continua na lista (dados gravados no banco, não só na tela).',
  async p => {
    await p.reload();
    await ir(p, 'alunos', 'Alunos');
    await p.locator('#busca-aluno').fill(SUF);
    await expect(p.locator('#lista-alunos tr', { hasText: ALUNO })).toHaveCount(1);
    await p.locator('#busca-aluno').fill('');
    return `Após F5, "${ALUNO}" continua listado.`;
  });

caso(P, 'Planos', 'Editar plano atualiza o total',
  'Mudar o valor mensal para R$ 129,90 recalcula o total para R$ 259,80 e mostra "Plano atualizado.".',
  async p => {
    await ir(p, 'planos', 'Planos');
    const card = p.locator('.card.plano', { hasText: PLANO });
    await card.getByRole('button', { name: 'Editar' }).click();
    const m = modal(p);
    await m.locator('input[name="valorMensal"]').fill('129.90');
    await expect(m.locator('#total-plano')).toHaveText(/R\$\s*259,80/);
    await m.getByRole('button', { name: 'Salvar alterações' }).click();
    const msg = await textoToast(p, 'Plano atualizado.');
    await expect(card).toContainText(/Total R\$\s*259,80/);
    await expect(card).toContainText('1 aluno(s) no plano');
    return `Toast: "${msg}". Cartão: "${(await card.innerText()).replace(/\s+/g, ' ').trim()}".`;
  });

caso(P, 'Planos', 'Excluir plano com aluno vinculado é bloqueado',
  'O sistema recusa a exclusão com a mensagem de que há aluno(s) vinculado(s) e o plano continua na lista.',
  async p => {
    const card = p.locator('.card.plano', { hasText: PLANO });
    await card.getByRole('button', { name: 'Excluir' }).click();
    await p.locator('#btn-confirmar').click();
    const msg = await textoToast(p, /vinculado/);
    await expect(card).toBeVisible();
    return `Toast de erro: "${msg}". O plano permaneceu na lista.`;
  });

caso(P, 'Planos', 'Inativar e reativar plano',
  'Inativar mostra o selo "Inativo" e o aviso de que não aparecerá para novos alunos; reativar remove o selo.',
  async p => {
    const card = p.locator('.card.plano', { hasText: PLANO });
    await card.getByRole('button', { name: 'Inativar' }).click();
    const m1 = await textoToast(p, /Plano inativado/);
    await expect(card).toContainText('Inativo');
    await card.getByRole('button', { name: 'Ativar' }).click();
    const m2 = await textoToast(p, 'Plano reativado.');
    await expect(card.locator('.badge', { hasText: 'Inativo' })).toHaveCount(0);
    return `Toasts: "${m1}" e "${m2}".`;
  });

caso(P, 'Professores', 'Listagem com dados de exemplo',
  'A tabela lista os professores de exemplo (Lucas Ferreira, Mariana Rocha, Thiago Mendes) com CREF e especialidade.',
  async p => {
    await ir(p, 'professores', 'Professores');
    await expect(p.locator('#lista-prof tr', { hasText: 'Lucas Ferreira' })).toBeVisible();
    await expect(p.locator('#lista-prof tr', { hasText: 'Mariana Rocha' })).toBeVisible();
    const nomes = await p.locator('#lista-prof tr .nome-cel strong').allInnerTexts();
    return `${nomes.length} professor(es): ${nomes.join(', ')}.`;
  });

caso(P, 'Professores', 'Cadastro de professor',
  'Preencher e salvar mostra o toast de sucesso e o professor aparece na lista com CREF e especialidade.',
  async p => {
    await p.locator('#btn-novo-prof').click();
    const m = modal(p);
    await m.locator('input[name="nome"]').fill(PROF);
    await m.locator('input[name="cpf"]').fill(CPF_PROF.replace(/\D/g, ''));
    await m.locator('input[name="cref"]').fill(CREF);
    await m.locator('input[name="especialidade"]').fill(ESP);
    await m.locator('input[name="email"]').fill(`prof${SUF}@academia.com`);
    await m.locator('input[name="telefone"]').fill('2434710000');
    await m.getByRole('button', { name: 'Cadastrar professor' }).click();
    const msg = await textoToast(p, /cadastrado/i);
    await p.locator('#busca-prof').fill(SUF);
    const linha = p.locator('#lista-prof tr', { hasText: PROF });
    await expect(linha).toHaveCount(1);
    await expect(linha).toContainText(CREF);
    return `Toast: "${msg}". Linha: "${(await linha.innerText()).replace(/\s+/g, ' ').trim()}".`;
  });

caso(P, 'Professores', 'Busca por especialidade',
  `Buscar "${ESP}" retorna somente o professor recém-cadastrado.`,
  async p => {
    await p.locator('#busca-prof').fill(ESP);
    await expect(p.locator('#lista-prof tr')).toHaveCount(1);
    await expect(p.locator('#lista-prof tr')).toContainText(PROF);
    return `1 resultado: ${await p.locator('#lista-prof tr td:first-child strong').innerText()}.`;
  });

caso(P, 'Professores', 'Busca por CREF',
  `Buscar o CREF "${CREF}" retorna o professor recém-cadastrado.`,
  async p => {
    await p.locator('#busca-prof').fill(CREF);
    await expect(p.locator('#lista-prof tr')).toHaveCount(1);
    await expect(p.locator('#lista-prof tr')).toContainText(PROF);
    await p.locator('#busca-prof').fill('');
    return `1 resultado: ${PROF}.`;
  });

caso(P, 'Professores', 'CPF duplicado é rejeitado',
  'Cadastrar outro professor com o mesmo CPF exibe "Já existe um professor cadastrado com este CPF." e nada é gravado.',
  async p => {
    await p.locator('#btn-novo-prof').click();
    const m = modal(p);
    await m.locator('input[name="nome"]').fill('Professor Duplicado');
    await m.locator('input[name="cpf"]').fill(CPF_PROF.replace(/\D/g, ''));
    await m.locator('input[name="cref"]').fill(`DUP-${SUF}`);
    await m.getByRole('button', { name: 'Cadastrar professor' }).click();
    const msg = await textoToast(p, /Já existe um professor/);
    await expect(m).toBeVisible();
    await m.getByRole('button', { name: 'Cancelar' }).click();
    return `Toast de erro: "${msg}".`;
  });

const chip = (p: Page, sit: string) => p.locator(`[data-sit="${sit}"] strong`);
const linhasMens = (p: Page) => p.locator('#lista-mens tr');

async function filtrarMensalidadesDoAluno(p: Page) {
  await ir(p, 'mensalidades', 'Mensalidades');
  await escolher(p.locator('#filtro-aluno'), ALUNO);
  await expect(chip(p, '')).toHaveText('2');
}

caso(P, 'Mensalidades', 'Mensalidades geradas automaticamente no cadastro do aluno',
  'Filtrando pelo aluno novo, aparecem 2 mensalidades pendentes (plano bimestral) e os contadores mostram Todas=2, Pendentes=2.',
  async p => {
    await filtrarMensalidadesDoAluno(p);
    await expect(chip(p, 'PENDENTE')).toHaveText('2');
    await expect(linhasMens(p)).toHaveCount(2);
    const l = await linhasMens(p).allInnerTexts();
    return `Contadores: Todas=${await chip(p, '').innerText()}, Pendentes=${await chip(p, 'PENDENTE').innerText()}. Linhas: ${l.map(x => x.replace(/\s+/g, ' ').trim()).join(' || ')}.`;
  });

caso(P, 'Mensalidades', 'Receber pagamento (Pix) em dia',
  'A janela de pagamento mostra "sem encargos". Após confirmar, a mensalidade fica "Paga" e o contador Pagas passa para 1.',
  async p => {
    await linhasMens(p).first().getByRole('button', { name: 'Receber' }).click();
    const m = modal(p);
    await expect(m.locator('#modal-titulo')).toHaveText('Registrar pagamento');
    await expect(m.locator('#previa-valor')).toContainText('sem encargos');
    const previa = (await m.locator('#previa-valor').innerText()).trim();
    await m.locator('select[name="formaPagamento"]').selectOption('PIX');
    await m.getByRole('button', { name: 'Confirmar recebimento' }).click();
    await expect(chip(p, 'PAGA')).toHaveText('1');
    await expect(chip(p, 'PENDENTE')).toHaveText('1');
    const paga = await p.locator('#lista-mens tr', { hasText: 'Paga' }).first().innerText();
    return `Prévia: "${previa}". Linha após pagar: "${paga.replace(/\s+/g, ' ').trim()}". Contadores: Pagas=1, Pendentes=1.`;
  });

caso(P, 'Mensalidades', 'Estornar pagamento',
  'Estornar (com confirmação) devolve a mensalidade para "Pendente": Pagas=0 e Pendentes=2.',
  async p => {
    await p.locator('#lista-mens [data-estornar]').first().click();
    await p.locator('#btn-confirmar').click();
    await expect(chip(p, 'PAGA')).toHaveText('0');
    await expect(chip(p, 'PENDENTE')).toHaveText('2');
    return 'Após estorno: Pagas=0, Pendentes=2.';
  });

caso(P, 'Mensalidades', 'Cancelar mensalidade pendente',
  'Cancelar (com confirmação) move uma mensalidade para "Canceladas": Canceladas=1, Pendentes=1.',
  async p => {
    await p.locator('#lista-mens [data-cancelar]').first().click();
    await p.locator('#btn-confirmar').click();
    await expect(chip(p, 'CANCELADA')).toHaveText('1');
    await expect(chip(p, 'PENDENTE')).toHaveText('1');
    return 'Após cancelar: Canceladas=1, Pendentes=1.';
  });

caso(P, 'Mensalidades', 'Lançamento avulso vencido aparece como Atrasada',
  'Lançar R$ 100,00 com vencimento há 30 dias cria a mensalidade "Taxa E2E" com o selo "Atrasada".',
  async p => {
    await p.locator('#btn-avulsa').click();
    const m = modal(p);
    await escolher(m.locator('select[name="alunoId"]'), ALUNO);
    await m.locator('input[name="descricao"]').fill('Taxa E2E');
    await m.locator('input[name="valor"]').fill('100');
    await m.locator('input[name="dataVencimento"]').fill(hojeISO(-30));
    await m.getByRole('button', { name: 'Lançar' }).click();
    const linha = p.locator('#lista-mens tr', { hasText: 'Taxa E2E' });
    await expect(linha).toBeVisible();
    await expect(linha).toContainText('Atrasada');
    await expect(chip(p, 'ATRASADA')).toHaveText('1');
    return `Linha: "${(await linha.innerText()).replace(/\s+/g, ' ').trim()}". Contador Atrasadas=1.`;
  });

caso(P, 'Mensalidades', 'Pagamento em atraso cobra multa de 2% + juros de 1% ao mês',
  'Para 30 dias de atraso, a prévia mostra "Valor a receber: R$ 103,00 (inclui R$ 3,00 ...)" e a mensalidade é paga por R$ 103,00.',
  async p => {
    const linha = p.locator('#lista-mens tr', { hasText: 'Taxa E2E' });
    await linha.getByRole('button', { name: 'Receber' }).click();
    const m = modal(p);
    await expect(m.locator('#previa-valor')).toContainText(/R\$\s*103,00/);
    await expect(m.locator('#previa-valor')).toContainText(/R\$\s*3,00/);
    const previa = (await m.locator('#previa-valor').innerText()).trim();
    await m.locator('select[name="formaPagamento"]').selectOption('DINHEIRO');
    await m.getByRole('button', { name: 'Confirmar recebimento' }).click();
    await expect(linha).toContainText('Paga');
    await expect(linha).toContainText(/R\$\s*103,00/);
    return `Prévia: "${previa}". Linha final: "${(await linha.innerText()).replace(/\s+/g, ' ').trim()}".`;
  });

caso(P, 'Mensalidades', 'Gerar mensalidades continua a partir da última',
  'Gerar 2 mensalidades mostra o toast "2 mensalidade(s) gerada(s)." e o total do aluno sobe de 3 (2 do plano + 1 avulsa) para 5, sem duplicar vencimentos.',
  async p => {
    const antes = await chip(p, '').innerText();
    await p.locator('#btn-gerar').click();
    const m = modal(p);
    await escolher(m.locator('select[name="alunoId"]'), ALUNO);
    await m.locator('input[name="quantidade"]').fill('2');
    await m.getByRole('button', { name: 'Gerar' }).click();
    const msg = await textoToast(p, /gerada/);
    await expect(chip(p, '')).toHaveText('5');
    return `Total antes: ${antes}. Toast: "${msg}". Total depois: ${await chip(p, '').innerText()}.`;
  });

caso(P, 'Mensalidades', 'Excluir mensalidade pendente',
  'Excluir (com confirmação) remove a linha: o total do aluno cai de 5 para 4.',
  async p => {
    await p.locator('#lista-mens [data-excluir]').first().click();
    await p.locator('#btn-confirmar').click();
    await expect(chip(p, '')).toHaveText('4');
    return 'Total do aluno após exclusão: 4.';
  });

caso(P, 'Mensalidades', 'Filtro por situação "Atrasadas" (todos os alunos)',
  'Sem filtro de aluno, o chip "Atrasadas" mostra apenas mensalidades atrasadas dos dados de exemplo (mínimo 1), todas com o selo "Atrasada".',
  async p => {
    await p.locator('#filtro-aluno').selectOption('');
    await p.locator('[data-sit="ATRASADA"]').click();
    await expect(linhasMens(p).first()).toBeVisible();
    const textos = await linhasMens(p).allInnerTexts();
    textos.forEach(t => expect(t).toContain('Atrasada'));
    return `${textos.length} mensalidade(s) atrasada(s) exibida(s); contador do chip = ${await chip(p, 'ATRASADA').innerText()}.`;
  });

caso(P, 'Treinos', 'Criar ficha com exercícios, adicionar, remover e reordenar',
  'Ficha criada com 2 exercícios (um terceiro foi removido e a ordem foi invertida): toast "Ficha criada." e o cartão lista Agachamento (#1) antes de Supino (#2).',
  async p => {
    await ir(p, 'treinos', 'Fichas de treino');
    await p.locator('#btn-nova-ficha').click();
    const m = modal(p);
    await escolher(m.locator('select[name="alunoId"]'), ALUNO);
    await escolher(m.locator('select[name="professorId"]'), PROF);
    await m.locator('input[name="nome"]').fill(FICHA);
    await m.locator('input[name="objetivo"]').fill('Hipertrofia');
    const linhas = m.locator('#itens .item-linha');
    await linhas.nth(0).locator('[data-campo="exercicio"]').fill('Supino reto com barra');
    await linhas.nth(0).locator('[data-campo="series"]').fill('4');
    await linhas.nth(0).locator('[data-campo="repeticoes"]').fill('10');
    await linhas.nth(0).locator('[data-campo="carga"]').fill('30');
    await m.locator('#btn-add-item').click();
    await linhas.nth(1).locator('[data-campo="exercicio"]').fill('Agachamento livre');
    await m.locator('#btn-add-item').click();
    await linhas.nth(2).locator('[data-campo="exercicio"]').fill('Remada curvada');
    await expect(linhas).toHaveCount(3);
    await linhas.nth(2).locator('[data-remover]').click();
    await expect(linhas).toHaveCount(2);
    await linhas.nth(1).locator('[data-mover="-1"]').click();
    await expect(linhas.nth(0).locator('[data-campo="exercicio"]')).toHaveValue('Agachamento livre');
    await m.getByRole('button', { name: 'Criar ficha' }).click();
    const msg = await textoToast(p, 'Ficha criada.');
    const card = p.locator('.card.ficha', { hasText: FICHA });
    await expect(card).toBeVisible();
    const exs = await card.locator('tbody tr .nome-cel strong').allInnerTexts();
    expect(exs).toEqual(['Agachamento livre', 'Supino reto com barra']);
    await expect(card).toContainText('Ativa');
    return `Toast: "${msg}". Exercícios no cartão (em ordem): ${exs.map((e, i) => `${i + 1}. ${e}`).join('; ')}. Badge: Ativa.`;
  });

caso(P, 'Treinos', 'Validação: ficha sem exercício',
  'Tentar criar uma ficha sem nome/aluno mantém a janela aberta e mostra os erros em vermelho.',
  async p => {
    await p.locator('#btn-nova-ficha').click();
    const m = modal(p);
    await m.getByRole('button', { name: 'Criar ficha' }).click();
    await expect(m.locator('.erro-campo').first()).toBeVisible();
    const msgs = await m.locator('.erro-campo').allInnerTexts();
    await m.getByRole('button', { name: 'Cancelar' }).click();
    return `Erros exibidos: ${msgs.join(' | ')}.`;
  });

caso(P, 'Treinos', 'Duplicar ficha',
  'Duplicar cria o cartão "… (cópia)" com os mesmos 2 exercícios e o selo "Inativa" (para ajustar a próxima fase).',
  async p => {
    const card = p.locator('.card.ficha', { hasText: FICHA }).first();
    await card.getByRole('button', { name: 'Duplicar' }).click();
    const msg = await textoToast(p, /duplicada/);
    const copia = p.locator('.card.ficha', { hasText: `${FICHA} (cópia)` });
    await expect(copia).toBeVisible();
    await expect(copia).toContainText('Inativa');
    await expect(copia.locator('tbody tr')).toHaveCount(2);
    return `Toast: "${msg}". Cartão da cópia: 2 exercícios, selo Inativa.`;
  });

caso(P, 'Treinos', 'Imprimir ficha',
  'O botão Imprimir abre uma nova janela com o nome da ficha, o aluno, o professor e a tabela de exercícios.',
  async p => {
    const card = p.locator('.card.ficha', { hasText: FICHA }).first();
    const [popup] = await Promise.all([p.waitForEvent('popup'), card.getByRole('button', { name: 'Imprimir' }).click()]);
    await popup.waitForLoadState('domcontentloaded');
    const html = await popup.locator('body').innerText();
    expect(html).toContain(FICHA);
    expect(html).toContain(ALUNO);
    expect(html).toContain('Supino reto com barra');
    expect(html).toContain('Agachamento livre');
    const titulo = await popup.locator('h1').innerText();
    await popup.close();
    return `Nova janela aberta com título "${titulo}", aluno "${ALUNO}", professor "${PROF}" e os 2 exercícios.`;
  });

caso(P, 'Treinos', 'Desativar ficha e filtro "somente ativas"',
  'Desativar mostra o selo "Inativa"; com o filtro "Somente fichas ativas" ligado, a ficha some da lista.',
  async p => {
    const card = p.locator('.card.ficha', { hasText: FICHA }).filter({ hasNotText: '(cópia)' });
    await card.getByRole('button', { name: 'Desativar' }).click();
    const msg = await textoToast(p, 'Ficha desativada.');
    await expect(card).toContainText('Inativa');
    await p.locator('#filtro-ativas').check();
    await expect(p.locator('.card.ficha', { hasText: FICHA })).toHaveCount(0);
    await p.locator('#filtro-ativas').uncheck();
    await expect(p.locator('.card.ficha', { hasText: FICHA }).first()).toBeVisible();
    return `Toast: "${msg}". Com o filtro ligado a ficha não aparece; ao desligar, volta.`;
  });

caso(P, 'Treinos', 'Excluir ficha',
  'Excluir a cópia (com confirmação) mostra "Ficha excluída." e remove o cartão.',
  async p => {
    const copia = p.locator('.card.ficha', { hasText: `${FICHA} (cópia)` });
    await copia.getByRole('button', { name: 'Excluir' }).click();
    await p.locator('#btn-confirmar').click();
    const msg = await textoToast(p, 'Ficha excluída.');
    await expect(copia).toHaveCount(0);
    return `Toast: "${msg}". Cartão removido.`;
  });

caso(P, 'Avaliações', 'Cálculo do IMC ao vivo e registro da 1ª avaliação',
  'Com 85 kg, 1,75 m e 24% de gordura a prévia mostra IMC 27,8 (Sobrepeso), massa gorda 20,4 kg e magra 64,6 kg. Ao salvar: "Avaliação registrada.".',
  async p => {
    await ir(p, 'avaliacoes', 'Avaliações físicas');
    await p.locator('#btn-nova-aval').click();
    const m = modal(p);
    await escolher(m.locator('select[name="alunoId"]'), ALUNO);
    await escolher(m.locator('select[name="professorId"]'), PROF);
    await m.locator('input[name="dataAvaliacao"]').fill(hojeISO(-30));
    await m.locator('input[name="peso"]').fill('85');
    await m.locator('input[name="altura"]').fill('1.75');
    await m.locator('input[name="percentualGordura"]').fill('24');
    await expect(m.locator('#imc-preview')).toContainText('27,8');
    await expect(m.locator('#imc-preview')).toContainText('Sobrepeso');
    const previa = (await m.locator('#imc-preview').innerText()).replace(/\s+/g, ' ').trim();
    await m.getByRole('button', { name: 'Registrar avaliação' }).click();
    const msg = await textoToast(p, 'Avaliação registrada.');
    await expect(p.locator('#evolucao')).toContainText(`Evolução de ${ALUNO}`);
    await expect(p.locator('#evolucao')).toContainText('primeira avaliação');
    return `Prévia: "${previa}". Toast: "${msg}". Painel de evolução aberto com "primeira avaliação".`;
  });

caso(P, 'Avaliações', 'Reavaliação e acompanhamento da evolução',
  'Após registrar 80 kg / 20% de gordura, a evolução mostra 2 avaliações, peso 85,0 → 80,0 (-5,0 kg), % gordura -4,0% e 2 gráficos (peso e % de gordura).',
  async p => {
    await p.locator('#btn-nova-aval').click();
    const m = modal(p);
    await escolher(m.locator('select[name="professorId"]'), PROF);
    await m.locator('input[name="dataAvaliacao"]').fill(hojeISO());
    await m.locator('input[name="peso"]').fill('80');
    await m.locator('input[name="altura"]').fill('1.75');
    await m.locator('input[name="percentualGordura"]').fill('20');
    await expect(m.locator('#imc-preview')).toContainText('26,1');
    await expect(m.locator('#imc-preview')).toContainText(/16,0\s*kg/);
    await expect(m.locator('#imc-preview')).toContainText(/64,0\s*kg/);
    const previa = (await m.locator('#imc-preview').innerText()).replace(/\s+/g, ' ').trim();
    await m.getByRole('button', { name: 'Registrar avaliação' }).click();
    await textoToast(p, 'Avaliação registrada.');
    const evo = p.locator('#evolucao');
    await expect(evo).toContainText('2 avaliação(ões)');
    await expect(evo.locator('.comp', { hasText: 'Peso' }).first()).toContainText(/-5,0\s*kg/);
    await expect(evo.locator('.comp', { hasText: '% Gordura' })).toContainText(/-4,0\s*%/);
    await expect(evo.locator('.grafico svg')).toHaveCount(2);
    const comps = (await evo.locator('.comp').allInnerTexts()).map(t => t.replace(/\s+/g, ' ').trim());
    return `Prévia: "${previa}". Comparativo: ${comps.join(' | ')}. Gráficos SVG: 2.`;
  });

caso(P, 'Avaliações', 'Tabela de avaliações do aluno',
  'A tabela lista as 2 avaliações do aluno com IMC e classificação (27,8 Sobrepeso e 26,1 Sobrepeso).',
  async p => {
    const linhas = p.locator('#lista-aval tr');
    await expect(linhas).toHaveCount(2);
    const t = (await linhas.allInnerTexts()).map(x => x.replace(/\s+/g, ' ').trim());
    expect(t.join(' ')).toContain('27,8');
    expect(t.join(' ')).toContain('26,1');
    return `Linhas: ${t.join(' || ')}.`;
  });

caso(P, 'Avaliações', 'Detalhe da avaliação (botão Ver)',
  'A janela de detalhe mostra as circunferências e os indicadores calculados.',
  async p => {
    await p.locator('#lista-aval tr').first().getByRole('button', { name: 'Ver' }).click();
    const m = modal(p);
    await expect(m).toContainText('Circunferências (cm)');
    const titulo = await m.locator('#modal-titulo').innerText();
    await m.locator('button.btn-primario', { hasText: 'Fechar' }).click();
    await expect(m).toBeHidden();
    return `Janela "${titulo}" aberta com a seção "Circunferências (cm)" e fechada em seguida.`;
  });

caso(P, 'Avaliações', 'Validação: altura em centímetros é rejeitada',
  'Informar altura 175 (em vez de 1,75 m) mostra o erro "Altura máxima: 2,50 m ..." no campo e nada é gravado.',
  async p => {
    await p.locator('#btn-nova-aval').click();
    const m = modal(p);
    await escolher(m.locator('select[name="alunoId"]'), ALUNO);
    await m.locator('input[name="dataAvaliacao"]').fill(hojeISO());
    await m.locator('input[name="peso"]').fill('80');
    await m.locator('input[name="altura"]').fill('175');
    await m.getByRole('button', { name: 'Registrar avaliação' }).click();
    await expect(m.locator('.erro-campo').first()).toContainText('Altura máxima');
    const msg = (await m.locator('.erro-campo').first().innerText()).trim();
    await m.getByRole('button', { name: 'Cancelar' }).click();
    await expect(p.locator('#lista-aval tr')).toHaveCount(2);
    return `Erro no campo: "${msg}". A tabela continua com 2 avaliações.`;
  });

caso(P, 'Avaliações', 'Evolução de aluno dos dados de exemplo',
  'Selecionar "Ana Beatriz Souza" mostra o painel "Evolução de Ana Beatriz Souza" com comparativo e 2 gráficos.',
  async p => {
    await escolher(p.locator('#filtro-aluno-aval'), 'Ana Beatriz');
    const evo = p.locator('#evolucao');
    await expect(evo).toContainText('Evolução de Ana Beatriz Souza');
    await expect(evo.locator('.grafico svg')).toHaveCount(2);
    const cab = (await evo.locator('.card-cab').innerText()).replace(/\s+/g, ' ').trim();
    return `Cabeçalho: "${cab}". Gráficos SVG: 2.`;
  });

caso(P, 'Integração', 'Professor com ficha/avaliação não pode ser excluído',
  'Excluir o professor vinculado a fichas e avaliações é recusado com mensagem pedindo para inativar; ele continua na lista.',
  async p => {
    await ir(p, 'professores', 'Professores');
    await p.locator('#busca-prof').fill(SUF);
    const linha = p.locator('#lista-prof tr', { hasText: PROF });
    await linha.getByRole('button', { name: 'Excluir' }).click();
    await p.locator('#btn-confirmar').click();
    const msg = await textoToast(p, /Inative-o/);
    await expect(linha).toBeVisible();
    return `Toast de erro: "${msg}".`;
  });

caso(P, 'Integração', 'Excluir aluno apaga mensalidades, fichas e avaliações',
  'Excluir o aluno (com confirmação) mostra "Aluno excluído."; ele some da lista, do filtro de mensalidades e a ficha de treino deixa de existir.',
  async p => {
    await ir(p, 'alunos', 'Alunos');
    await p.locator('#busca-aluno').fill(SUF);
    const linha = p.locator('#lista-alunos tr', { hasText: ALUNO });
    await linha.getByRole('button', { name: 'Excluir' }).click();
    const aviso = (await modal(p).locator('p').first().innerText()).trim();
    await p.locator('#btn-confirmar').click();
    const msg = await textoToast(p, 'Aluno excluído.');
    await expect(p.locator('#lista-alunos tr', { hasText: ALUNO })).toHaveCount(0);
    await p.locator('#busca-aluno').fill('');
    await ir(p, 'mensalidades', 'Mensalidades');
    await expect(p.locator('#filtro-aluno option', { hasText: ALUNO })).toHaveCount(0);
    await ir(p, 'treinos', 'Fichas de treino');
    await expect(p.locator('#lista-fichas')).not.toContainText(FICHA);
    return `Aviso de confirmação: "${aviso}". Toast: "${msg}". Aluno ausente da lista, do filtro de mensalidades e das fichas.`;
  });

caso(P, 'Integração', 'Excluir professor e plano após liberar os vínculos',
  'Com o aluno excluído, o professor e o plano podem ser excluídos ("Professor excluído." e "Plano excluído.").',
  async p => {
    await ir(p, 'professores', 'Professores');
    await p.locator('#busca-prof').fill(SUF);
    await p.locator('#lista-prof tr', { hasText: PROF }).getByRole('button', { name: 'Excluir' }).click();
    await p.locator('#btn-confirmar').click();
    const m1 = await textoToast(p, 'Professor excluído.');
    await p.locator('#busca-prof').fill('');
    await ir(p, 'planos', 'Planos');
    await p.locator('.card.plano', { hasText: PLANO }).getByRole('button', { name: 'Excluir' }).click();
    await p.locator('#btn-confirmar').click();
    const m2 = await textoToast(p, 'Plano excluído.');
    await expect(p.locator('.card.plano', { hasText: PLANO })).toHaveCount(0);
    return `Toasts: "${m1}" e "${m2}". Dados de teste removidos.`;
  });

caso(P, 'Geral', 'Botão Voltar do navegador',
  'Ir de Alunos para Planos e usar "Voltar" retorna à página Alunos (rotas por hash).',
  async p => {
    await ir(p, 'alunos', 'Alunos');
    await ir(p, 'planos', 'Planos');
    await p.goBack();
    await expect(p.locator('#titulo-pagina')).toHaveText('Alunos');
    return `URL após voltar: ${p.url()} (título "Alunos").`;
  });

caso(P, 'Geral', 'Layout em tela de celular (390 px)',
  'Em largura de celular o menu lateral fica recolhido; o botão ☰ abre o menu e, ao escolher um item, o menu fecha e a página muda.',
  async p => {
    await p.setViewportSize({ width: 390, height: 844 });
    await p.goto('/#/dashboard');
    await expect(p.locator('#titulo-pagina')).toHaveText('Painel');
    await expect(p.locator('#btn-menu')).toBeVisible();
    await expect(p.locator('#sidebar')).not.toHaveClass(/aberta/);
    await p.locator('#btn-menu').click();
    await expect(p.locator('#sidebar')).toHaveClass(/aberta/);
    await p.locator('#menu a[data-rota="planos"]').click();
    await expect(p.locator('#titulo-pagina')).toHaveText('Planos');
    await expect(p.locator('#sidebar')).not.toHaveClass(/aberta/);
    const semRolagem = await p.evaluate(() => document.documentElement.scrollWidth <= window.innerWidth + 1);
    await p.setViewportSize({ width: 1366, height: 820 });
    return `Botão ☰ visível, menu abre/fecha, página "Planos" aberta. Sem rolagem horizontal: ${semRolagem ? 'sim' : 'NÃO'}.`;
  });

caso(P, 'Geral', 'Estabilidade: sem erros de JavaScript nem respostas 5xx',
  'Durante todo o roteiro não ocorreu nenhum erro JS não tratado nem resposta HTTP 5xx da API.',
  async () => {
    expect(errosJs, `Erros JS: ${errosJs.join(' | ')}`).toEqual([]);
    expect(respostas5xx, `Respostas 5xx: ${respostas5xx.join(' | ')}`).toEqual([]);
    return `Erros JS: ${errosJs.length}; respostas 5xx: ${respostas5xx.length}.`;
  });
