import fs from 'node:fs';
import path from 'node:path';
import { execSync } from 'node:child_process';
import { fileURLToPath } from 'node:url';

const raiz = path.dirname(fileURLToPath(import.meta.url));
const registros = JSON.parse(fs.readFileSync(path.join(raiz, 'resultados', 'resultados.json'), 'utf-8'));

const versao = (() => { try { return execSync('npx playwright --version', { cwd: raiz, stdio: ['ignore', 'pipe', 'ignore'] }).toString().trim(); } catch { return 'Playwright'; } })();
const agora = new Date().toLocaleString('pt-BR', { timeZone: 'America/Sao_Paulo' });
const esc = s => String(s).replace(/\|/g, '\\|').replace(/\r?\n/g, ' ').trim();

const total = registros.length;
const passou = registros.filter(r => r.status === 'PASSOU').length;
const falhou = total - passou;

const modulos = [...new Set(registros.map(r => r.modulo))];
const resumo = modulos.map(m => {
  const lista = registros.filter(r => r.modulo === m);
  const ok = lista.filter(r => r.status === 'PASSOU').length;
  return `| ${m} | ${lista.length} | ${ok} | ${lista.length - ok} |`;
}).join('\n');

const detalhes = modulos.map(m => {
  const linhas = registros.filter(r => r.modulo === m).map(r =>
    `| ${r.ordem} | ${esc(r.caso)} | ${esc(r.esperado)} | ${esc(r.real)} | ${r.status === 'PASSOU' ? '✅ Passou' : '❌ Falhou'} | [print](resultados/${r.evidencia ?? ''}) |`).join('\n');
  return `### ${m}\n\n| # | O que foi testado | Resultado esperado | Resultado real | Status | Evidência |\n|---|---|---|---|---|---|\n${linhas}\n`;
}).join('\n');

const md = `# Relatório de testes no navegador: IronFit

| | |
|---|---|
| **Data da execução** | ${agora} |
| **Ferramenta** | ${versao} (CLI: \`npx playwright test\`) |
| **Navegador** | Chromium (headless), janela 1366 × 820 |
| **Sistema testado** | http://localhost:8080 (Spring Boot + front-end HTML/CSS/JS) |
| **Resultado geral** | **${passou} de ${total} casos passaram**${falhou ? `, ${falhou} falharam` : ''} |

## Como o teste foi feito

Os testes controlam um navegador de verdade (Chromium) e usam o sistema como uma pessoa usaria: clicam no menu,
preenchem formulários, confirmam janelas, recarregam a página e usam o botão Voltar. Cada caso confere o que
aparece **na tela** (mensagens, selos, contadores, tabelas, gráficos) e guarda uma captura de tela como evidência.

Os casos formam um fluxo: criam dados próprios (identificados com um sufixo único \`E2E\`) e, no final,
excluem tudo pela própria tela, o que também testa as exclusões. Os dados de exemplo do sistema
(por exemplo a aluna "Ana Beatriz Souza") são usados apenas para leitura e busca.

Para repetir: com a aplicação rodando, na pasta \`e2e\`, execute \`npx playwright test\` e depois \`node gerar-relatorio.mjs\`.

## Resumo por módulo

| Módulo | Casos | Passaram | Falharam |
|---|---:|---:|---:|
${resumo}
| **Total** | **${total}** | **${passou}** | **${falhou}** |

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

${detalhes}
## Observações

- **Correção validada:** a busca de alunos por CPF agora aceita pontos e traço (\`996.030.824-30\`), só dígitos
  (\`99603082430\`) e trechos (\`996.030\`). Antes, só a busca pelos dígitos funcionava.
- **Fora do escopo desta execução:** impressão física da ficha (o teste verifica a janela de impressão aberta,
  não a impressora) e outros navegadores além do Chromium.
`;

fs.writeFileSync(path.join(raiz, 'RELATORIO-TESTES-NAVEGADOR.md'), md, 'utf-8');
console.log(`Relatório gerado: ${passou}/${total} casos passaram.`);
