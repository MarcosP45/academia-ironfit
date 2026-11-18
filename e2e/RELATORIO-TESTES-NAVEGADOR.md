# Relatório de testes no navegador: IronFit

| | |
|---|---|
| **Data da execução** | 16/11/2026, 15:26:15 |
| **Ferramenta** | Version 1.65.1 (CLI: `npx playwright test`) |
| **Navegador** | Chromium (headless), janela 1366 × 820 |
| **Sistema testado** | http://localhost:8080 (Spring Boot + front-end HTML/CSS/JS) |
| **Resultado geral** | **54 de 54 casos passaram** |

## Como o teste foi feito

Os testes controlam um navegador de verdade (Chromium) e usam o sistema como uma pessoa usaria: clicam no menu,
preenchem formulários, confirmam janelas, recarregam a página e usam o botão Voltar. Cada caso confere o que
aparece **na tela** (mensagens, selos, contadores, tabelas, gráficos) e guarda uma captura de tela como evidência.

Os casos formam um fluxo: criam dados próprios (identificados com um sufixo único `E2E`) e, no final,
excluem tudo pela própria tela, o que também testa as exclusões. Os dados de exemplo do sistema
(por exemplo a aluna "Ana Beatriz Souza") são usados apenas para leitura e busca.

Para repetir: com a aplicação rodando, na pasta `e2e`, execute `npx playwright test` e depois `node gerar-relatorio.mjs`.

## Resumo por módulo

| Módulo | Casos | Passaram | Falharam |
|---|---:|---:|---:|
| Geral | 6 | 6 | 0 |
| Alunos | 14 | 14 | 0 |
| Planos | 5 | 5 | 0 |
| Professores | 5 | 5 | 0 |
| Mensalidades | 9 | 9 | 0 |
| Treinos | 6 | 6 | 0 |
| Avaliações | 6 | 6 | 0 |
| Integração | 3 | 3 | 0 |
| **Total** | **54** | **54** | **0** |

## Cobertura em relação ao enunciado

| Exigência do enunciado | Casos que a verificam |
|---|---|
| Gerenciamento de alunos: cadastro, consulta e exclusão | Alunos (listagem, busca por nome e CPF, cadastro, edição, inativar, exclusão) e Integração |
| Gerenciamento de planos: cadastro e controle | Planos (cadastro com total, validação, edição, inativar, exclusão bloqueada e permitida) |
| Gerenciamento de mensalidades: pagamentos e situação | Mensalidades (geração automática, receber, multa e juros, estornar, cancelar, atrasada, gerar, excluir, filtros) |
| Gerenciamento de professores: cadastro e consulta | Professores (listagem, cadastro, busca por especialidade e CREF, CPF duplicado) |
| Gerenciamento de treinos: criação e gestão de fichas | Treinos (criar, adicionar, remover e reordenar exercícios, duplicar, imprimir, desativar, excluir) |
| Avaliações físicas: registro e acompanhamento | Avaliações (IMC ao vivo, registro, reavaliação, evolução com gráficos, validação) |
| Funcionalidades reais (não telas estáticas) | Persistência após F5, exclusão em cascata e dados criados em um módulo aparecendo em outros |
| Integração entre front-end e back-end | Status "API conectada" e todos os casos acima (cada ação chama a API REST) |

## Resultados detalhados

### Geral

| # | O que foi testado | Resultado esperado | Resultado real | Status | Evidência |
|---|---|---|---|---|---|
| 1 | Carregamento e conexao com a API | Página abre com o título "Painel", o menu tem 7 módulos e o rodapé mostra "API conectada". | Título "Painel"; status "API conectada"; menu: Painel, Alunos, Planos, Mensalidades, Professores, Fichas de treino, Avaliações físicas. | ✅ Passou | [print](resultados/prints/01-geral-carregamento-e-conexao-com-a-api.png) |
| 2 | Painel exibe os indicadores | Aparecem os cartões "Alunos ativos", "Recebido no mês", "Em atraso" e "Equipe e treinos", e as listas de atrasadas e vencimentos. | Cartões: Alunos ativos 9 10 cadastrados no total \| Recebido no mês R$ 335,90 A receber no mês: R$ 914,20 \| Em atraso R$ 424,60 4 mensalidade(s) · 3 aluno(s) \| Equipe e treinos 6 professores 3 fichas ativas · 9 planos · 2 avaliações no mês. | ✅ Passou | [print](resultados/prints/02-geral-painel-exibe-os-indicadores.png) |
| 3 | Navegação pelos 7 módulos do menu | Cada item do menu abre a página com o título correto, sem mensagem de erro. | Títulos abertos em ordem: Painel → Alunos → Planos → Mensalidades → Professores → Fichas de treino → Avaliações físicas. | ✅ Passou | [print](resultados/prints/03-geral-navegacao-pelos-7-modulos-do-menu.png) |
| 52 | Botão Voltar do navegador | Ir de Alunos para Planos e usar "Voltar" retorna à página Alunos (rotas por hash). | URL após voltar: http://localhost:8080/#/alunos (título "Alunos"). | ✅ Passou | [print](resultados/prints/52-geral-botao-voltar-do-navegador.png) |
| 53 | Layout em tela de celular (390 px) | Em largura de celular o menu lateral fica recolhido; o botão ☰ abre o menu e, ao escolher um item, o menu fecha e a página muda. | Botão ☰ visível, menu abre/fecha, página "Planos" aberta. Sem rolagem horizontal: sim. | ✅ Passou | [print](resultados/prints/53-geral-layout-em-tela-de-celular-390-px.png) |
| 54 | Estabilidade: sem erros de JavaScript nem respostas 5xx | Durante todo o roteiro não ocorreu nenhum erro JS não tratado nem resposta HTTP 5xx da API. | Erros JS: 0; respostas 5xx: 0. | ✅ Passou | [print](resultados/prints/54-geral-estabilidade-sem-erros-de-javascript-nem.png) |

### Alunos

| # | O que foi testado | Resultado esperado | Resultado real | Status | Evidência |
|---|---|---|---|---|---|
| 4 | Listagem com dados de exemplo | A tabela lista os alunos de exemplo (mínimo 5), incluindo "Ana Beatriz Souza", com CPF formatado e situação. | 10 alunos listados. Linha da Ana: "Ana Beatriz Souza ana.souza@email.com 996.030.824-30 Trimestral (24) 99811-2233 02/09/2026 Ativo Inadimplente Ver Editar Inativar Excluir". | ✅ Passou | [print](resultados/prints/04-alunos-listagem-com-dados-de-exemplo.png) |
| 5 | Busca por nome | Digitar "ana" mostra somente alunos cujo nome contém "ana" (Ana Beatriz Souza) e oculta os demais. | Resultado para "ana": Ana Beatriz Souza, Juliana Martins. | ✅ Passou | [print](resultados/prints/05-alunos-busca-por-nome.png) |
| 6 | Busca por CPF com pontos e traço (correção) | Digitar o CPF completo "996.030.824-30" encontra exatamente 1 aluno: Ana Beatriz Souza. | 1 linha retornada: Ana Beatriz Souza. | ✅ Passou | [print](resultados/prints/06-alunos-busca-por-cpf-com-pontos-e-traco-correca.png) |
| 7 | Busca por CPF apenas com dígitos | Digitar "99603082430" (sem pontuação) também encontra Ana Beatriz Souza. | 1 linha retornada: Ana Beatriz Souza. | ✅ Passou | [print](resultados/prints/07-alunos-busca-por-cpf-apenas-com-digitos.png) |
| 8 | Busca por CPF parcial com pontuação | Digitar "996.030" (parte do CPF com ponto) encontra Ana Beatriz Souza. | Linhas retornadas: 1 (inclui Ana Beatriz Souza). | ✅ Passou | [print](resultados/prints/08-alunos-busca-por-cpf-parcial-com-pontuacao.png) |
| 9 | Busca sem resultado | Digitar um termo inexistente exibe a mensagem "Nenhum aluno encontrado.". | Tabela mostra: "Nenhum aluno encontrado.". Ao limpar a busca a lista completa volta. | ✅ Passou | [print](resultados/prints/09-alunos-busca-sem-resultado.png) |
| 10 | Filtro "Somente inativos" | Ao filtrar por inativos, todas as linhas exibidas têm o selo "Inativo"; ao voltar para "Todos", a lista completa retorna. | 1 aluno(s) inativo(s) exibido(s): Pedro Henrique Alves. | ✅ Passou | [print](resultados/prints/10-alunos-filtro-somente-inativos.png) |
| 13 | Cadastro rejeita CPF inválido | Informar CPF 123.456.789-00 exibe o aviso "CPF inválido." e a janela continua aberta (nada é gravado). | Toast de erro: "CPF inválido.". Janela de cadastro permaneceu aberta. | ✅ Passou | [print](resultados/prints/13-alunos-cadastro-rejeita-cpf-invalido.png) |
| 14 | Validação de campos obrigatórios | Enviar o formulário em branco marca nome e CPF em vermelho com a mensagem de cada campo. | Erros exibidos: Informe o nome do aluno. \| Informe o CPF.. | ✅ Passou | [print](resultados/prints/14-alunos-validacao-de-campos-obrigatorios.png) |
| 15 | Cadastro válido com plano e máscaras de CPF/telefone | CPF e telefone são formatados ao digitar. Ao salvar: toast "Aluno cadastrado." e o aluno aparece na lista com o plano escolhido. | Máscaras: CPF "877.832.485-86", telefone "(24) 98888-7777". Toast: "Aluno cadastrado.". Linha: "Aluno E2E 502315 e2e502315@email.com 877.832.485-86 Bimestral E2E 502315 (24) 98888-7777 16/11/2026 Ativo Ver Editar Inativar Excluir". | ✅ Passou | [print](resultados/prints/15-alunos-cadastro-valido-com-plano-e-mascaras-de-.png) |
| 16 | Ficha do aluno (botão Ver) | A janela "Ficha do aluno" mostra os dados e a aba "Mensalidades (2)" (plano bimestral gerou 2 mensalidades automaticamente). | Abas: Mensalidades (2) \| Treinos (0) \| Avaliações (0). 1ª mensalidade: "Bimestral E2E 502315 - 12/2026 16/12/2026 R$ 119,90 — Pendente". | ✅ Passou | [print](resultados/prints/16-alunos-ficha-do-aluno-botao-ver.png) |
| 17 | Edição de aluno | Alterar o e-mail e salvar mostra "Aluno atualizado." e o novo e-mail na lista. | Toast: "Aluno atualizado.". E-mail na lista: novo502315@email.com. | ✅ Passou | [print](resultados/prints/17-alunos-edicao-de-aluno.png) |
| 18 | Inativar e reativar aluno | Inativar exibe o selo "Inativo" e o toast "Aluno inativado."; reativar volta para "Ativo" com "Aluno reativado.". | Toasts: "Aluno inativado." e "Aluno reativado.". Situação final: Ativo. | ✅ Passou | [print](resultados/prints/18-alunos-inativar-e-reativar-aluno.png) |
| 19 | Persistência após recarregar a página (F5) | Depois de recarregar o navegador, o aluno cadastrado continua na lista (dados gravados no banco, não só na tela). | Após F5, "Aluno E2E 502315" continua listado. | ✅ Passou | [print](resultados/prints/19-alunos-persistencia-apos-recarregar-a-pagina-f5.png) |

### Planos

| # | O que foi testado | Resultado esperado | Resultado real | Status | Evidência |
|---|---|---|---|---|---|
| 11 | Cadastro de plano com total do contrato calculado | Ao digitar R$ 119,90 e 2 meses, o formulário mostra "Valor total do contrato: R$ 239,80". Ao salvar, aparece o toast "Plano cadastrado." e o cartão do plano na lista. | Prévia: "Valor total do contrato: R$ 239,80". Toast: "Plano cadastrado.". Cartão: "Bimestral E2E 502315 R$ 119,90/mês ⏱ 2 meses Total R$ 239,80 ☺ 0 aluno(s) no plano Editar Inativar Excluir". | ✅ Passou | [print](resultados/prints/11-planos-cadastro-de-plano-com-total-do-contrato-.png) |
| 12 | Validação do formulário de plano | Enviar o formulário vazio mantém a janela aberta e marca o nome e o valor em vermelho com mensagem. | Janela permaneceu aberta com 3 erro(s): Informe o nome do plano. \| Informe o valor mensal. \| Informe a duração em meses.. | ✅ Passou | [print](resultados/prints/12-planos-validacao-do-formulario-de-plano.png) |
| 20 | Editar plano atualiza o total | Mudar o valor mensal para R$ 129,90 recalcula o total para R$ 259,80 e mostra "Plano atualizado.". | Toast: "Plano atualizado.". Cartão: "Bimestral E2E 502315 R$ 129,90/mês ⏱ 2 meses Total R$ 259,80 ☺ 1 aluno(s) no plano Editar Inativar Excluir". | ✅ Passou | [print](resultados/prints/20-planos-editar-plano-atualiza-o-total.png) |
| 21 | Excluir plano com aluno vinculado é bloqueado | O sistema recusa a exclusão com a mensagem de que há aluno(s) vinculado(s) e o plano continua na lista. | Toast de erro: "O plano "Bimestral E2E 502315" possui 1 aluno(s) vinculado(s). Inative o plano em vez de excluí-lo.". O plano permaneceu na lista. | ✅ Passou | [print](resultados/prints/21-planos-excluir-plano-com-aluno-vinculado-e-bloq.png) |
| 22 | Inativar e reativar plano | Inativar mostra o selo "Inativo" e o aviso de que não aparecerá para novos alunos; reativar remove o selo. | Toasts: "Plano inativado: não aparecerá para novos alunos." e "Plano reativado.". | ✅ Passou | [print](resultados/prints/22-planos-inativar-e-reativar-plano.png) |

### Professores

| # | O que foi testado | Resultado esperado | Resultado real | Status | Evidência |
|---|---|---|---|---|---|
| 23 | Listagem com dados de exemplo | A tabela lista os professores de exemplo (Lucas Ferreira, Mariana Rocha, Thiago Mendes) com CREF e especialidade. | 12 professor(es): Lucas Ferreira, lucas@academia.com, Mariana Rocha, mariana@academia.com, Professor E2E 241731, prof241731@academia.com, Professor E2E 261350, prof261350@academia.com, Professor E2E 297161, prof297161@academia.com, Thiago Mendes, thiago@academia.com. | ✅ Passou | [print](resultados/prints/23-professores-listagem-com-dados-de-exemplo.png) |
| 24 | Cadastro de professor | Preencher e salvar mostra o toast de sucesso e o professor aparece na lista com CREF e especialidade. | Toast: "Professor cadastrado.". Linha: "Professor E2E 502315 CPF 877.840.404-58 E2E-502315 Yoga502315 prof502315@academia.com (24) 3471-0000 16/11/2026 Ativo Editar Inativar Excluir". | ✅ Passou | [print](resultados/prints/24-professores-cadastro-de-professor.png) |
| 25 | Busca por especialidade | Buscar "Yoga502315" retorna somente o professor recém-cadastrado. | 1 resultado: Professor E2E 502315. | ✅ Passou | [print](resultados/prints/25-professores-busca-por-especialidade.png) |
| 26 | Busca por CREF | Buscar o CREF "E2E-502315" retorna o professor recém-cadastrado. | 1 resultado: Professor E2E 502315. | ✅ Passou | [print](resultados/prints/26-professores-busca-por-cref.png) |
| 27 | CPF duplicado é rejeitado | Cadastrar outro professor com o mesmo CPF exibe "Já existe um professor cadastrado com este CPF." e nada é gravado. | Toast de erro: "Já existe um professor cadastrado com este CPF.". | ✅ Passou | [print](resultados/prints/27-professores-cpf-duplicado-e-rejeitado.png) |

### Mensalidades

| # | O que foi testado | Resultado esperado | Resultado real | Status | Evidência |
|---|---|---|---|---|---|
| 28 | Mensalidades geradas automaticamente no cadastro do aluno | Filtrando pelo aluno novo, aparecem 2 mensalidades pendentes (plano bimestral) e os contadores mostram Todas=2, Pendentes=2. | Contadores: Todas=2, Pendentes=2. Linhas: Aluno E2E 502315 Bimestral E2E 502315 - 12/2026 16/12/2026 R$ 119,90 R$ 119,90 — Pendente Receber Cancelar ✕ \|\| Aluno E2E 502315 Bimestral E2E 502315 - 11/2026 16/11/2026 R$ 119,90 R$ 119,90 — Pendente Receber Cancelar ✕. | ✅ Passou | [print](resultados/prints/28-mensalidades-mensalidades-geradas-automaticamente-no-.png) |
| 29 | Receber pagamento (Pix) em dia | A janela de pagamento mostra "sem encargos". Após confirmar, a mensalidade fica "Paga" e o contador Pagas passa para 1. | Prévia: "Valor a receber: R$ 119,90 (sem encargos).". Linha após pagar: "Aluno E2E 502315 Bimestral E2E 502315 - 12/2026 16/12/2026 R$ 119,90 R$ 119,90 16/11/2026 Pix Paga Estornar". Contadores: Pagas=1, Pendentes=1. | ✅ Passou | [print](resultados/prints/29-mensalidades-receber-pagamento-pix-em-dia.png) |
| 30 | Estornar pagamento | Estornar (com confirmação) devolve a mensalidade para "Pendente": Pagas=0 e Pendentes=2. | Após estorno: Pagas=0, Pendentes=2. | ✅ Passou | [print](resultados/prints/30-mensalidades-estornar-pagamento.png) |
| 31 | Cancelar mensalidade pendente | Cancelar (com confirmação) move uma mensalidade para "Canceladas": Canceladas=1, Pendentes=1. | Após cancelar: Canceladas=1, Pendentes=1. | ✅ Passou | [print](resultados/prints/31-mensalidades-cancelar-mensalidade-pendente.png) |
| 32 | Lançamento avulso vencido aparece como Atrasada | Lançar R$ 100,00 com vencimento há 30 dias cria a mensalidade "Taxa E2E" com o selo "Atrasada". | Linha: "Aluno E2E 502315 Taxa E2E 17/10/2026 30 dia(s) de atraso R$ 100,00 R$ 103,00 — Atrasada Receber Cancelar ✕". Contador Atrasadas=1. | ✅ Passou | [print](resultados/prints/32-mensalidades-lancamento-avulso-vencido-aparece-como-a.png) |
| 33 | Pagamento em atraso cobra multa de 2% + juros de 1% ao mês | Para 30 dias de atraso, a prévia mostra "Valor a receber: R$ 103,00 (inclui R$ 3,00 ...)" e a mensalidade é paga por R$ 103,00. | Prévia: "Valor a receber: R$ 103,00 (inclui R$ 3,00 de multa de 2% + juros de 1% ao mês).". Linha final: "Aluno E2E 502315 Taxa E2E 17/10/2026 R$ 100,00 R$ 103,00 16/11/2026 Dinheiro Paga Estornar". | ✅ Passou | [print](resultados/prints/33-mensalidades-pagamento-em-atraso-cobra-multa-de-2-jur.png) |
| 34 | Gerar mensalidades continua a partir da última | Gerar 2 mensalidades mostra o toast "2 mensalidade(s) gerada(s)." e o total do aluno sobe de 3 (2 do plano + 1 avulsa) para 5, sem duplicar vencimentos. | Total antes: 3. Toast: "2 mensalidade(s) gerada(s).". Total depois: 5. | ✅ Passou | [print](resultados/prints/34-mensalidades-gerar-mensalidades-continua-a-partir-da-.png) |
| 35 | Excluir mensalidade pendente | Excluir (com confirmação) remove a linha: o total do aluno cai de 5 para 4. | Total do aluno após exclusão: 4. | ✅ Passou | [print](resultados/prints/35-mensalidades-excluir-mensalidade-pendente.png) |
| 36 | Filtro por situação "Atrasadas" (todos os alunos) | Sem filtro de aluno, o chip "Atrasadas" mostra apenas mensalidades atrasadas dos dados de exemplo (mínimo 1), todas com o selo "Atrasada". | 4 mensalidade(s) atrasada(s) exibida(s); contador do chip = 4. | ✅ Passou | [print](resultados/prints/36-mensalidades-filtro-por-situacao-atrasadas-todos-os-a.png) |

### Treinos

| # | O que foi testado | Resultado esperado | Resultado real | Status | Evidência |
|---|---|---|---|---|---|
| 37 | Criar ficha com exercícios, adicionar, remover e reordenar | Ficha criada com 2 exercícios (um terceiro foi removido e a ordem foi invertida): toast "Ficha criada." e o cartão lista Agachamento (#1) antes de Supino (#2). | Toast: "Ficha criada.". Exercícios no cartão (em ordem): 1. Agachamento livre; 2. Supino reto com barra. Badge: Ativa. | ✅ Passou | [print](resultados/prints/37-treinos-criar-ficha-com-exercicios-adicionar-rem.png) |
| 38 | Validação: ficha sem exercício | Tentar criar uma ficha sem nome/aluno mantém a janela aberta e mostra os erros em vermelho. | Erros exibidos: Selecione o aluno. \| Informe o nome da ficha.. | ✅ Passou | [print](resultados/prints/38-treinos-validacao-ficha-sem-exercicio.png) |
| 39 | Duplicar ficha | Duplicar cria o cartão "… (cópia)" com os mesmos 2 exercícios e o selo "Inativa" (para ajustar a próxima fase). | Toast: "Ficha duplicada (criada como inativa para você ajustar).". Cartão da cópia: 2 exercícios, selo Inativa. | ✅ Passou | [print](resultados/prints/39-treinos-duplicar-ficha.png) |
| 40 | Imprimir ficha | O botão Imprimir abre uma nova janela com o nome da ficha, o aluno, o professor e a tabela de exercícios. | Nova janela aberta com título "IronFit · Treino A E2E 502315", aluno "Aluno E2E 502315", professor "Professor E2E 502315" e os 2 exercícios. | ✅ Passou | [print](resultados/prints/40-treinos-imprimir-ficha.png) |
| 41 | Desativar ficha e filtro "somente ativas" | Desativar mostra o selo "Inativa"; com o filtro "Somente fichas ativas" ligado, a ficha some da lista. | Toast: "Ficha desativada.". Com o filtro ligado a ficha não aparece; ao desligar, volta. | ✅ Passou | [print](resultados/prints/41-treinos-desativar-ficha-e-filtro-somente-ativas.png) |
| 42 | Excluir ficha | Excluir a cópia (com confirmação) mostra "Ficha excluída." e remove o cartão. | Toast: "Ficha excluída.". Cartão removido. | ✅ Passou | [print](resultados/prints/42-treinos-excluir-ficha.png) |

### Avaliações

| # | O que foi testado | Resultado esperado | Resultado real | Status | Evidência |
|---|---|---|---|---|---|
| 43 | Cálculo do IMC ao vivo e registro da 1ª avaliação | Com 85 kg, 1,75 m e 24% de gordura a prévia mostra IMC 27,8 (Sobrepeso), massa gorda 20,4 kg e magra 64,6 kg. Ao salvar: "Avaliação registrada.". | Prévia: "IMC calculado: 27,8 Sobrepeso · Massa gorda 20,4 kg · Massa magra 64,6 kg". Toast: "Avaliação registrada.". Painel de evolução aberto com "primeira avaliação". | ✅ Passou | [print](resultados/prints/43-avaliacoes-calculo-do-imc-ao-vivo-e-registro-da-1-a.png) |
| 44 | Reavaliação e acompanhamento da evolução | Após registrar 80 kg / 20% de gordura, a evolução mostra 2 avaliações, peso 85,0 → 80,0 (-5,0 kg), % gordura -4,0% e 2 gráficos (peso e % de gordura). | Prévia: "IMC calculado: 26,1 Sobrepeso · Massa gorda 16,0 kg · Massa magra 64,0 kg". Comparativo: Peso 85,0 → 80,0 kg -5,0 kg \| IMC 27,8 → 26,1 -1,7 \| % Gordura 24,0 → 20,0% -4,0% \| Massa magra 64,6 → 64,0 kg -0,6 kg \| Cintura — → — cm —. Gráficos SVG: 2. | ✅ Passou | [print](resultados/prints/44-avaliacoes-reavaliacao-e-acompanhamento-da-evolucao.png) |
| 45 | Tabela de avaliações do aluno | A tabela lista as 2 avaliações do aluno com IMC e classificação (27,8 Sobrepeso e 26,1 Sobrepeso). | Linhas: 16/11/2026 Aluno E2E 502315 80,0 kg 1,75 m 26,1 Sobrepeso 20,0% 64,0 kg — Professor E2E 502315 Ver Editar ✕ \|\| 17/10/2026 Aluno E2E 502315 85,0 kg 1,75 m 27,8 Sobrepeso 24,0% 64,6 kg — Professor E2E 502315 Ver Editar ✕. | ✅ Passou | [print](resultados/prints/45-avaliacoes-tabela-de-avaliacoes-do-aluno.png) |
| 46 | Detalhe da avaliação (botão Ver) | A janela de detalhe mostra as circunferências e os indicadores calculados. | Janela "Avaliação de Aluno E2E 502315" aberta com a seção "Circunferências (cm)" e fechada em seguida. | ✅ Passou | [print](resultados/prints/46-avaliacoes-detalhe-da-avaliacao-botao-ver.png) |
| 47 | Validação: altura em centímetros é rejeitada | Informar altura 175 (em vez de 1,75 m) mostra o erro "Altura máxima: 2,50 m ..." no campo e nada é gravado. | Erro no campo: "Altura máxima: 2,50 m (use metros, ex.: 1.75).". A tabela continua com 2 avaliações. | ✅ Passou | [print](resultados/prints/47-avaliacoes-validacao-altura-em-centimetros-e-rejeit.png) |
| 48 | Evolução de aluno dos dados de exemplo | Selecionar "Ana Beatriz Souza" mostra o painel "Evolução de Ana Beatriz Souza" com comparativo e 2 gráficos. | Cabeçalho: "Evolução de Ana Beatriz Souza 3 avaliação(ões) · de 03/09/2026 a 10/11/2026". Gráficos SVG: 2. | ✅ Passou | [print](resultados/prints/48-avaliacoes-evolucao-de-aluno-dos-dados-de-exemplo.png) |

### Integração

| # | O que foi testado | Resultado esperado | Resultado real | Status | Evidência |
|---|---|---|---|---|---|
| 49 | Professor com ficha/avaliação não pode ser excluído | Excluir o professor vinculado a fichas e avaliações é recusado com mensagem pedindo para inativar; ele continua na lista. | Toast de erro: "O professor Professor E2E 502315 possui fichas de treino ou avaliações registradas. Inative-o em vez de excluir.". | ✅ Passou | [print](resultados/prints/49-integracao-professor-com-ficha-avaliacao-nao-pode-s.png) |
| 50 | Excluir aluno apaga mensalidades, fichas e avaliações | Excluir o aluno (com confirmação) mostra "Aluno excluído."; ele some da lista, do filtro de mensalidades e a ficha de treino deixa de existir. | Aviso de confirmação: "Excluir Aluno E2E 502315? Todas as mensalidades, fichas de treino e avaliações deste aluno também serão apagadas.". Toast: "Aluno excluído.". Aluno ausente da lista, do filtro de mensalidades e das fichas. | ✅ Passou | [print](resultados/prints/50-integracao-excluir-aluno-apaga-mensalidades-fichas-.png) |
| 51 | Excluir professor e plano após liberar os vínculos | Com o aluno excluído, o professor e o plano podem ser excluídos ("Professor excluído." e "Plano excluído."). | Toasts: "Professor excluído." e "Plano excluído.". Dados de teste removidos. | ✅ Passou | [print](resultados/prints/51-integracao-excluir-professor-e-plano-apos-liberar-o.png) |

## Observações

- **Correção validada:** a busca de alunos por CPF agora aceita pontos e traço (`996.030.824-30`), só dígitos
  (`99603082430`) e trechos (`996.030`). Antes, só a busca pelos dígitos funcionava.
- **Fora do escopo desta execução:** impressão física da ficha (o teste verifica a janela de impressão aberta,
  não a impressora) e outros navegadores além do Chromium.
