# Correção do Sonar e da cobertura — v0.4.2

## O que a análise mostrou

Na análise do PR #5 consultada em 17/10/2026, o frontend falhou no Quality Gate por três condições de código novo: 17 apontamentos, 0% de cobertura e 8,78% de duplicação. O código novo é definido pela configuração do projeto no Sonar; não corresponde necessariamente apenas ao último commit.

Os testes já existiam. O problema confirmado no workflow era a ausência da transferência do relatório: `test` gerava o LCOV, mas `sonar-frontend` começava em outro ambiente sem baixar esse arquivo. Informar o caminho do relatório não o transporta entre jobs.

## O que mudou

| Origem do apontamento | Correção |
| --- | --- |
| Expressão regular de e-mail com risco de processamento excessivo | Validador de e-mail do Angular, limite de 254 caracteres e conferência do domínio; testes com entradas malformadas e longas |
| Objetos repetidos no catálogo fictício | Dados estáticos em `demo-profiles.json` e uma função que deriva iniciais, cidade, setor, fase e campos compartilhados de compatibilidade |
| Seletores CSS repetidos | Declarações reunidas nos seletores correspondentes, mantendo as regras finais de aparência |
| Elementos com `role="group"` e `role="status"` | `fieldset` com `legend` e `output`, com estilos ajustados e teste do aviso de salvamento |
| Referências de elementos sem `readonly` | Referências `ViewChild` marcadas como somente leitura no TypeScript |
| Condições ternárias aninhadas e acesso ao recibo | Fluxos explícitos e encadeamento opcional, preservando os resultados |
| `withFetch` obsoleto no Angular instalado | `provideHttpClient()`, que já usa Fetch por padrão nesta versão |
| API obsoleta na configuração do ESLint, apontamento anterior ao período de código novo | `defineConfig` do ESLint; mantidos os presets do TypeScript e Angular |

Os dez perfis, seus identificadores, textos e respostas de compatibilidade são equivalentes aos da v0.4.1. A mudança do catálogo não adiciona exclusões no Sonar. Os limites de cobertura e as regras do Quality Gate foram preservados.

## Caminho da cobertura no GitHub Actions

1. O job `test` instala pelo lockfile com `npm ci` e executa o lint.
2. `npm run test:coverage` executa os testes e exige os limites globais de 80%.
3. `actions/upload-artifact` publica `frontend/coverage/frontend/lcov.info` com o nome `frontend-coverage-report`. A ausência do arquivo falha a etapa.
4. O build de produção também é verificado.
5. O job `sonar-frontend`, dependente dos testes, baixa esse artefato em `frontend/coverage/frontend`.
6. A etapa confere que o arquivo não está vazio. O scanner roda a partir de `frontend`, lê `sonar-project.properties` e aguarda o Quality Gate.

Os comandos de teste não têm mais um caminho alternativo que execute sem cobertura se a primeira tentativa falhar. O cache do npm usa `package-lock.json`. Os demais jobs e os gatilhos do workflow foram preservados.

## O que foi verificado localmente

| Verificação | Resultado |
| --- | --- |
| Lint | Sem erros |
| TypeScript da aplicação e dos testes | Sem erros |
| Testes Angular + Vitest | 112 testes passaram em 9 arquivos |
| Linhas nos arquivos medidos | 96,66% |
| Declarações | 95,32% |
| Ramificações | 94,57% |
| Funções | 88,82% |
| Motor de compatibilidade | 100% nas quatro métricas |
| Build de produção | Concluído sem avisos de orçamento |
| LCOV | Gerado; os 32 caminhos de arquivos resolvem dentro do frontend |
| YAML e configuração dos artefatos | Sintaxe, nomes e caminhos conferidos; demais jobs preservados |
| Catálogo e ilustração do Lumen | Perfis equivalentes; imagem inalterada |

As dependências instaladas da v0.4.1 foram reutilizadas. Não houve atualização de pacotes nem nova auditoria de vulnerabilidades. Testes com DOM simulado não substituem revisão visual, leitor de tela ou integração com a API.

## O que falta confirmar no servidor

O workflow corrigido ainda precisa ser executado pelo GitHub. Esta entrega não publica código, executa deploy, altera o Quality Gate nem comprova sua aprovação. Não foi feita uma nova análise local com o scanner do servidor.

Depois de abrir o PR da nova branch, confira a execução correspondente ao novo commit:

1. Na etapa de testes, procure os 112 testes e o upload de `frontend-coverage-report`.
2. Na etapa do Sonar do frontend, confira o download do relatório e a importação do LCOV. Não deve aparecer aviso de relatório ausente ou de caminhos não resolvidos.
3. No projeto `damatch-frontend`, confira a data e a revisão da análise, depois cobertura, duplicação e apontamentos de código novo.
4. Aguarde os checks exigidos no PR antes de integrar a alteração.

A cobertura do Sonar pode diferir do percentual local, porque a cobertura global e a de código novo têm denominadores diferentes. A redução da duplicação e o encerramento dos apontamentos precisam ser confirmados pela nova análise.

## Quando o envio dispara a validação

Neste workflow, o evento `push` cobre `main`, `development` e tags `v*`. O evento `pull_request` cobre PRs destinados a `main` ou `development`. Depois do push na branch `feature/frontend-v0.4.2`, abra um PR para `main`. Novos pushes nessa branch atualizam o PR e disparam outra validação.

Este pacote não altera a proteção de branches. Exigir um check aprovado para permitir o merge é uma configuração do repositório, separada do código do workflow.

## Referências

- [GitHub Actions: armazenar e compartilhar artefatos entre jobs](https://docs.github.com/en/actions/tutorials/store-and-share-data).
- [GitHub Actions: eventos de pull request](https://docs.github.com/en/actions/reference/workflows-and-actions/events-that-trigger-workflows#pull_request).
- [SonarQube: cobertura JavaScript/TypeScript e LCOV](https://docs.sonarsource.com/sonarqube-server/2025.5/analyzing-source-code/test-coverage/javascript-typescript-test-coverage).

## Continuidade na v0.4.3

A revisão v0.4.3 preserva as correções de cobertura e acrescenta o checkout do repositório no job de detecção, conforme a main recebida. O CI passa a compilar os modos DEMO e API. A entrega teve 153 testes em 12 arquivos, com 97,37% de linhas, 96,05% de declarações, 95,80% de ramificações e 91,19% de funções. A validação dos contratos HTTP usa respostas simuladas. O novo commit ainda precisa ser analisado pelo pipeline e pelo Sonar; a aprovação anterior não comprova o resultado desta versão.

## Frontend v0.5.0

O pipeline e os limites foram preservados. A v0.5.0 acrescenta testes do questionário e das regras v2. Os resultados locais atuais e as limitações estão no [documento 18](18-frontend-v0.5.0.md). A aprovação remota depende de novo push e execução no SonarQube.
