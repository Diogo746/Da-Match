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

## Prevenção de reincidência: Web:S6819

Em 22/10/2026, os dois apontamentos do perfil de mentor tinham a mesma causa: mensagens de confirmação e carregamento em `p` com `role="status"`. Ambas passaram a usar `output`, com CSS para manter o comportamento de bloco, as margens e a altura de linha dos parágrafos.

- Prefira o elemento HTML nativo quando existir equivalente ao papel ARIA. Para esses avisos, use `<output>{{ message() }}</output>` e `<output>Carregando…</output>`.
- `output` já possui o papel implícito `status`; não repita `role="status"`. Alertas de erro com `role="alert"` têm outra finalidade e devem ser avaliados separadamente.
- Ao revisar templates, procure `role="status"` em `frontend/src`, inclusive em templates inline, e confira o CSS após a troca de tag.
- Execute lint, testes com cobertura e builds DEMO/API. O lint atual não detectou esses dois usos; sua aprovação não substitui a nova análise do SonarQube. Preserve as regras e o Quality Gate.

Validação local desta correção: lint aprovado; 231 testes Angular/Vitest e 8 testes da configuração Vercel aprovados; cobertura de linhas de 98,10%; builds DEMO e API aprovados. A busca em templates HTML e TypeScript não encontrou outros usos de `role="status"`. Não foi executada nova análise remota do SonarQube nem validação com leitor de tela.

Referência: [W3C — ARIA in HTML, semântica implícita de output](https://www.w3.org/TR/html-aria/#el-output).

## Prevenção de reincidência: typescript:S6582

Em 26/10/2026, o carregamento do questionário verificava `!user || user.tipoUsuario !== this.kind`. A condição foi simplificada para `user?.tipoUsuario !== this.kind`, preservando o retorno antecipado sem usuário ou com papel incorreto e os bloqueios de carregamento/salvamento em andamento.

- Prefira optional chaining ao testar a existência do objeto somente para acessar uma propriedade ou método. Preserve a semântica da comparação e de curto-circuito; não substitua automaticamente condições que exigem outro comportamento para valores ausentes.
- A validação local após as correções do questionário passou com lint, 360 testes Angular/Vitest, 8 de configuração, 98,98% de linhas e builds DEMO/API. Backend: 135 testes e Checkstyle aprovados. A aprovação remota precisa corresponder ao novo commit.
- As análises atuais de PR e main usam a mesma branch dos projetos SonarQube. Uma análise posterior da main pode substituir o painel de um PR: confira a revisão SHA no histórico de análises e os jobs do commit correto, além da lista de issues abertas. Um apontamento fechado por remoção de arquivo em outra revisão não significa que foi corrigido na branch de trabalho.

## Indisponibilidade do SonarQube após o merge do PR #20

O PR #20 foi integrado à main em `c2c018d`, em 26/10/2026. O [workflow #80](https://github.com/Diogo746/Da-Match/actions/runs/40332107491) passou em testes, lint e builds, mas os dois scanners falharam antes da análise: backend com `Fail to get bootstrap index from server: Connection reset`, frontend com `Failed to query server version` / `Read timed out`. Não foi uma reprovação por cobertura, duplicação ou novos apontamentos. O deploy ficou bloqueado.

Em 28/10/2026, o endpoint `/api/system/status` voltou a responder `UP`. Os dois jobs passam a executar `.github/scripts/wait_for_sonar.py` antes do scanner: até seis tentativas, timeout de 15 segundos por requisição e intervalo de dez segundos. Estado diferente de `UP`, falhas de conexão e HTTP temporário são repetidos; erros de configuração/autorização falham imediatamente. Esgotar tentativas falha o job sem declarar aprovação do Quality Gate. A checagem não usa token nem imprime URL, corpo ou detalhes de exceções.

O frontend passa de `SonarSource/sonarqube-scan-action@v5` para `@v6`, conforme o aviso de segurança do próprio job e a [documentação oficial da action](https://github.com/SonarSource/sonarqube-scan-action/tree/v6). Checkout e setup-node desse job ficam alinhados às versões já usadas pelo restante do pipeline. `sonar.qualitygate.wait=true`, relatórios, exclusões e regras do gate foram preservados. A checagem trata indisponibilidade antes do scanner; uma queda durante a análise ainda pode exigir nova execução.

Validação local: sete testes da checagem, incluindo recuperação após falha/reinício, timeout persistente, HTTP temporário, rejeição de autenticação, resposta inválida e ausência de vazamento nos logs; consulta real retornou `UP`. O CI também executa esses testes e seleciona os dois componentes quando `.github/scripts/**` muda. A aprovação remota deve ser conferida no SHA da nova execução.
