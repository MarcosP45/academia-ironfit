# IronFit · Sistema de Gestão de Academia

O IronFit é um sistema web para cuidar do dia a dia de uma academia: alunos, planos, mensalidades, professores, fichas de treino e avaliações físicas. O back-end é uma API REST em Java com Spring Boot, e o front-end é feito só com HTML, CSS e JavaScript puro, servido pelo próprio Spring.

## Tecnologias

- Java 17
- Spring Boot 3.3 (Web, Data JPA, Validation)
- H2 em arquivo, então não precisa instalar banco (MySQL é opcional)
- HTML, CSS e JavaScript puro, com Fetch API
- JUnit 5 para os testes do back-end e Playwright para os testes no navegador

## Como rodar

Você vai precisar do JDK 17 ou superior. O projeto foi feito no IntelliJ IDEA, mas qualquer IDE com suporte a Maven serve.

**No IntelliJ**

1. Vá em File → Open e escolha a pasta do projeto (ou o `pom.xml`).
2. Espere o Maven baixar as dependências. Se o IntelliJ pedir um SDK, escolha o 17 ou superior em File → Project Structure.
3. Abra `src/main/java/br/com/academia/AcademiaApplication.java` e clique no ▶ ao lado do `main`.
4. Acesse http://localhost:8080.

**Pelo terminal**

```
mvn spring-boot:run
```

Na primeira execução o banco é criado já com dados de exemplo: planos, professores, alunos, mensalidades pagas, pendentes e atrasadas, fichas e avaliações. As datas são calculadas a partir do dia em que você roda, então sempre haverá mensalidades em atraso e vencendo nos próximos dias.

| O quê | Endereço |
|---|---|
| Sistema | http://localhost:8080 |
| API | http://localhost:8080/api/... |
| Console do H2 | http://localhost:8080/h2-console |

No console do H2, use a URL `jdbc:h2:file:./data/academia`, usuário `sa` e senha em branco.

**Começar do zero.** Pare a aplicação e apague a pasta `data/`. Na próxima execução os dados de exemplo voltam. Se preferir iniciar sem eles, coloque `academia.dados-exemplo=false` no `application.properties`.

**Usar MySQL.** No `pom.xml`, descomente a dependência `mysql-connector-j`. No `application.properties`, comente o bloco do H2, descomente o do MySQL e ajuste usuário e senha. O banco `academia` e as tabelas são criados automaticamente.

## Como o código está organizado

O fluxo é simples: o navegador chama a API, o controller recebe, o service aplica as regras e o repository fala com o banco.

```
Navegador ──JSON──► Controller ──► Service ──► Repository ──► Banco (H2/MySQL)
```

```
src/main/java/br/com/academia
├── AcademiaApplication.java   classe principal
├── model/                     entidades JPA
├── repository/                interfaces do Spring Data JPA
├── dto/                       objetos de entrada e saída da API, com validação
├── service/                   regras de negócio
├── controller/                endpoints REST
├── exception/                 erros padronizados em JSON
└── config/                    CORS e carga dos dados de exemplo

src/main/resources
├── application.properties
└── static/                    front-end (index.html, css/ e js/)
```

As entidades não são expostas direto na API. A entrada passa por validação (`@NotBlank`, `@Positive` e similares) e a saída já traz os campos calculados, como IMC, situação da mensalidade e valor com juros. Isso também evita problemas de loop na serialização entre entidades relacionadas.

Relacionamento entre as tabelas:

```
Plano 1 ──── N Aluno 1 ──── N Mensalidade
                 │
                 ├──── N FichaTreino 1 ──── N ItemTreino
                 │          └── N:1 Professor
                 └──── N AvaliacaoFisica
                            └── N:1 Professor
```

## O que o sistema faz

### Alunos
- Busca por nome ou CPF e filtro entre ativos e inativos.
- O CPF é validado pelos dígitos verificadores e não pode se repetir.
- Ao cadastrar um aluno com plano, as mensalidades do período são geradas automaticamente. Num plano trimestral, por exemplo, saem 3 mensalidades a partir da matrícula.
- Mostra se o aluno está inadimplente, ou seja, se tem mensalidade vencida e não paga.
- O botão "Ver" abre a ficha completa, com mensalidades, treinos e avaliações.
- Dá para excluir o aluno (isso leva junto as mensalidades, fichas e avaliações, e pede confirmação) ou apenas inativá-lo.

### Planos
- Cada plano tem valor mensal e duração em meses, e o valor total do contrato é calculado.
- Um plano inativo não aparece para novos alunos.
- Plano com alunos vinculados não pode ser excluído; o sistema sugere inativar.

### Mensalidades
- As situações são Pendente, Atrasada, Paga e Cancelada. A "Atrasada" é calculada na hora (pendente com vencimento anterior a hoje), então nunca fica desatualizada.
- Ao receber um pagamento, você informa a data e a forma (Pix, dinheiro, cartão ou boleto). Se o pagamento for depois do vencimento, entram multa de 2% e juros de 1% ao mês, proporcionais aos dias, e a tela mostra uma prévia do valor.
- É possível gerar de 1 a 12 mensalidades a partir da última existente, sem repetir vencimentos.
- Também dá para fazer lançamento avulso, cancelar, estornar um pagamento e excluir. Mensalidade paga só pode ser excluída depois de estornada.
- Os filtros por aluno e por situação mostram contadores.

### Professores
- Busca por nome, especialidade ou CREF. CPF e CREF não podem se repetir.
- Professor com fichas ou avaliações registradas não pode ser excluído; o sistema sugere inativar.

### Fichas de treino
- A ficha tem aluno, professor, objetivo, vigência e a lista de exercícios (séries, repetições, carga, descanso e observação), que pode ser reordenada.
- O status pode ser Ativa, Inativa ou Vencida, quando passa da data de término.
- É possível duplicar a ficha para montar a próxima fase do treino e imprimir para entregar ao aluno.

### Avaliações físicas
- Registra peso, altura, percentual de gordura, circunferências, frequência cardíaca de repouso e pressão arterial.
- Calcula o IMC com a classificação da OMS, massa gorda, massa magra e relação cintura/quadril.
- A tela de evolução compara a primeira e a última avaliação e mostra gráficos de peso e percentual de gordura.

### Painel
Mostra alunos ativos, valor recebido e a receber no mês, valor em atraso, inadimplentes, as mensalidades atrasadas (com botão para receber) e os vencimentos dos próximos 15 dias.

## Endpoints da API

| Método | Caminho | Descrição |
|---|---|---|
| GET | `/api/dashboard` | Indicadores do painel |
| GET | `/api/alunos?busca=&ativo=` | Lista e busca alunos |
| GET · POST | `/api/alunos/{id}` · `/api/alunos` | Consulta / cadastra |
| PUT · DELETE | `/api/alunos/{id}` | Atualiza / exclui |
| PATCH | `/api/alunos/{id}/status?ativo=` | Ativa ou inativa |
| GET | `/api/planos?ativos=` | Lista planos |
| POST · PUT · DELETE | `/api/planos[/{id}]` | Cadastra / atualiza / exclui |
| PATCH | `/api/planos/{id}/status?ativo=` | Ativa ou inativa |
| GET | `/api/mensalidades?alunoId=&situacao=` | Lista (PENDENTE, ATRASADA, PAGA, CANCELADA) |
| POST | `/api/mensalidades` | Lançamento avulso |
| POST | `/api/mensalidades/gerar` | Gera N mensalidades: `{alunoId, quantidade, primeiroVencimento}` |
| PATCH | `/api/mensalidades/{id}/pagar` | Registra pagamento: `{dataPagamento, formaPagamento}` |
| PATCH | `/api/mensalidades/{id}/estornar` · `/cancelar` | Estorna / cancela |
| DELETE | `/api/mensalidades/{id}` | Exclui (só não pagas) |
| GET | `/api/professores?busca=` | Lista e busca professores |
| POST · PUT · DELETE | `/api/professores[/{id}]` | Cadastra / atualiza / exclui |
| PATCH | `/api/professores/{id}/status?ativo=` | Ativa ou inativa |
| GET | `/api/fichas?alunoId=&ativas=` | Lista fichas |
| POST · PUT · DELETE | `/api/fichas[/{id}]` | Cria / atualiza / exclui |
| PATCH | `/api/fichas/{id}/status?ativa=` | Ativa ou desativa |
| POST | `/api/fichas/{id}/duplicar` | Duplica a ficha |
| GET | `/api/avaliacoes?alunoId=` | Lista avaliações |
| GET | `/api/avaliacoes/evolucao/{alunoId}` | Comparativo e histórico |
| POST · PUT · DELETE | `/api/avaliacoes[/{id}]` | Registra / atualiza / exclui |

Os erros voltam em JSON, num formato único:

```json
{ "status": 422, "erro": "Unprocessable Entity", "mensagem": "Já existe um aluno cadastrado com este CPF.", "campos": null }
```

Nos erros de validação (400), o campo `campos` traz a mensagem de cada campo, e o front-end destaca o campo com problema em vermelho.

## Roteiro para apresentação (cerca de 8 minutos)

1. **Painel:** mostrar os indicadores, a lista de atrasadas e receber uma mensalidade direto dali.
2. **Planos:** cadastrar um plano novo (por exemplo "Bimestral", R$ 119,90, 2 meses) e mostrar o total calculado. Tentar excluir o "Mensal" e ver o bloqueio por ter alunos.
3. **Alunos:** cadastrar um aluno no plano novo (CPF válido para teste: `529.982.247-25`). Tentar um CPF inválido para mostrar a validação e clicar em "Ver" para abrir a ficha completa.
4. **Mensalidades:** filtrar pelo aluno novo e mostrar as mensalidades geradas. Filtrar as atrasadas, receber uma (com a prévia de multa e juros), estornar e cancelar outra.
5. **Professores:** buscar por especialidade e cadastrar um professor.
6. **Fichas de treino:** criar uma ficha para o aluno novo com 3 ou 4 exercícios, reordenar, salvar, duplicar e imprimir.
7. **Avaliações:** registrar uma avaliação (o IMC aparece na hora) e depois abrir a evolução da "Ana Beatriz Souza" para mostrar os gráficos.
8. **Opcional:** abrir o console do H2 com as tabelas, ou chamar a API direto no navegador (`/api/alunos`) para mostrar a integração.

## Testes

**Testes do back-end (JUnit + MockMvc).** Cobrem os seis módulos, o fluxo completo entre eles, a validação de CPF e o cálculo de multa e juros.

```
mvn test
```

**Smoke test da API.** Com a aplicação rodando, ele percorre os principais fluxos, cria alguns registros e apaga tudo no final.

```
powershell -ExecutionPolicy Bypass -File scripts\smoke-test.ps1
```

**Testes no navegador (Playwright).** Com a aplicação rodando, dentro da pasta `e2e`:

```
npm install                      (só na primeira vez)
npx playwright install chromium  (só na primeira vez)
npx playwright test              (use --headed para ver o navegador)
node gerar-relatorio.mjs         (gera e2e/RELATORIO-TESTES-NAVEGADOR.md)
```

O relatório mostra, para cada caso, o que foi testado, o resultado esperado, o resultado real e uma captura de tela.
