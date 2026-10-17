# DaMatch — protótipo do frontend v0.4.1

## Entrega

Esta revisão da v0.4 mantém o foco em startups em ideação e mentores. A experiência reúne cadastro básico, quatro etapas de perfil, prévia do cartão e recomendações explicáveis. **Meu perfil** passa a abrir o resumo das informações. A edição é uma ação explícita, com respostas preenchidas, acesso direto às seções, salvamento e cancelamento. O mascote Lumen em guache, a luz reforçada, os balões de fala e os temas claro/escuro foram preservados.

O pacote contém somente frontend e documentação. O backend e o banco não foram alterados. O cálculo demonstrativo usa TypeScript e dados fictícios, com as responsabilidades da futura versão Spring Boot descritas em `10-profile-and-matching.md`.

## Organização

| Arquivo/pasta em frontend | Responsabilidade |
| --- | --- |
| `src/app/core/profile.models.ts` | Tipos, códigos das perguntas e dados mínimos do perfil |
| `src/app/core/profile-session.store.ts` | Perfil temporário da sessão, separado das credenciais |
| `src/app/core/matching.engine.ts` | Possibilidade de mentoria, pontuação, motivos e limitações |
| `src/app/core/profiles.store.ts` | Catálogo fictício e salvos |
| `src/app/core/registration.gateway.ts` | Simulação do cadastro básico |
| `src/app/features/register/` | Dados básicos e passagem para a montagem do perfil |
| `src/app/features/profile/profile.component.*` | Consulta do perfil concluído e entrada na edição opcional |
| `src/app/features/profile/profile-setup.component.*` | Quatro etapas no cadastro e seções acessíveis diretamente na edição |
| `src/app/features/profile/` | Prévia do cartão e conclusão do perfil |
| `src/app/features/explore/` | Home, busca, filtros, recomendações, cartões e detalhes |
| `src/app/shared/lumen.component.ts`, `.css` | Mascote com núcleo e halo luminoso, mais intensos no escuro |
| `src/app/shared/lumen-guide.component.ts` | Balões com falas curtas para o contexto atual |
| `src/app/core/theme.store.ts` | Tema inicial, alternância e preferência no navegador |
| `src/app/shared/theme.css` | Paletas completas de tema claro e escuro |
| `src/app/shared/motion.css` | Transições e preferência de movimento |
| `public/assets/lumen.png` | Mascote original com transparência |
| `angular.json`, alvo `test` | Vitest integrado à compilação oficial do Angular |
| `sonar-project.properties` | Localização do LCOV para o scanner do frontend |

## Rodar

Abra a pasta `frontend` no VS Code e use uma versão compatível de Node, conforme seu README.

```powershell
npm.cmd ci
npm.cmd start
```

Acesse **http://localhost:4200**. O terminal deve permanecer aberto. Ctrl+C encerra o servidor.

A porta continua 4200. Esta demonstração não precisa da API, do banco ou de LLDAP. Os dados são apagados ao recarregar.

## Roteiro de revisão manual

| Ação | Resultado esperado |
| --- | --- |
| Abrir a home sem perfil | Catálogo público e convite para montar o perfil, sem percentuais inventados |
| Preencher os dados básicos | Continuar para as quatro etapas; senha removida após a simulação |
| Tentar avançar sem resposta | Mensagem indicando o que falta, com foco acessível |
| Escolher uma única necessidade | Permitir concluir e preservar os 70 pontos possíveis desse critério |
| Escolher duas necessidades | Mostrar a ordem 1 e 2; trocar a ordem exige desmarcar e escolher novamente |
| Mentor selecionar setores/especialidades | Limitar a dois setores ou atuação geral e a três especialidades |
| Selecionar presencial | Pedir a cidade; lista reduzida explicitada |
| Selecionar exclusivamente online | Omitir a cidade e remover o valor da escolha anterior |
| Concluir o perfil | Apresentar o cartão e levar às indicações para o tipo oposto |
| Abrir os detalhes | Explicar critérios, pontos e limitações |
| Abrir Meu perfil depois de concluir o cadastro | Mostrar informações e cartão, sem abrir o questionário |
| Navegar para outra aba e voltar a Meu perfil | Continuar mostrando o resumo do perfil concluído |
| Usar Editar perfil | Abrir as respostas atuais, com seções acessíveis diretamente |
| Usar Alterar em uma seção | Abrir essa seção com as escolhas já marcadas |
| Salvar alterações válidas | Voltar ao resumo, confirmar o salvamento e recalcular as indicações |
| Salvar com uma resposta obrigatória vazia | Mostrar a seção incompleta e a mensagem; manter o perfil anterior |
| Cancelar a edição ou navegar para fora dela | Descartar o rascunho e manter as respostas salvas |
| Abrir Meu perfil sem concluir um cadastro | Mostrar convite para criar o perfil, sem inventar dados |
| Mentor pausar novas startups | Esvaziar as indicações e informar a pausa |
| Escolher setor em descoberta | Mostrar compatibilidade em construção, sem porcentagem |
| Não haver indicação | Preservar as preferências e oferecer revisão ou catálogo |
| Salvar e remover um perfil | Atualizar a página de salvos durante a sessão |
| Recarregar | Reiniciar perfil, salvos e e-mails utilizados no cadastro simulado |
| Usar Tab, Shift+Tab, Enter e Espaço | Conferir ordem e visibilidade do foco, escolhas e botões |
| Abrir detalhes e usar Escape | Conferir o comportamento nativo do dialog e retorno do foco |
| Reduzir a janela para celular | Conferir leitura, navegação, cartões e ausência de corte de conteúdo |
| Observar a lanterna do Lumen | Núcleo e halo variam lentamente, sem movimento do personagem |
| Alternar o tema pelo botão no topo | Adaptar textos, superfícies, formulários e detalhes; aumentar o brilho no escuro |
| Recarregar após escolher o tema | Restaurar apenas a aparência; reiniciar os dados de demonstração |
| Avançar as etapas com Lumen | Atualizar a fala do balão de acordo com a pergunta |
| Usar Pausar animações no rodapé | Interromper luz e transições; manter a escolha ao navegar |
| Usar Retomar animações | Reativar os movimentos, respeitando a preferência do dispositivo |
| Ativar redução de movimento no sistema | Remover animações e transições, mantendo os fluxos utilizáveis |

A meta de preenchimento é breve, mas o tempo real precisa ser medido com participantes. O progresso mostra etapas efetivamente preenchidas. Não existem pontos de competição, ranking de pessoas, diagnóstico de personalidade ou conexão automática a partir da nota.

## Verificações

Na pasta `frontend`:

```powershell
npm.cmd run lint
npm.cmd run test:coverage
npm.cmd run build
```

O comando de teste usa o builder oficial `@angular/build:unit-test` com Vitest e jsdom. Isso compila os mesmos templates usados pelo aplicativo e permite testar cliques, validações, rotas e conteúdo renderizado. O suporte nativo de abertura de `dialog` é emulado somente no ambiente de teste, porque não está implementado pelo jsdom.

O build verifica os templates e gera `dist/frontend/browser`. O relatório local fica em `coverage/frontend/index.html`; o LCOV, em `coverage/frontend/lcov.info`. Os limites globais de cobertura são de 80% nas quatro métricas configuradas.

A revisão visual em navegador, o teste com leitor de tela, a avaliação de tempo de preenchimento e o teste integrado com a API não foram executados nesta entrega. A análise no SonarQube também depende do pipeline da equipe.

## Resultado da validação local

| Verificação | Resultado |
| --- | --- |
| Dependências | Mesma base instalada e validada na entrega anterior; sem mudanças nesta revisão |
| Lint | Sem erros |
| Tipos dos testes | Sem erros |
| Vitest + Angular | 92 testes passaram em 8 arquivos |
| Cobertura de linhas nos arquivos medidos | 96,62% |
| Cobertura de declarações | 95,28% |
| Cobertura de ramificações | 94,54% |
| Cobertura de funções | 88,62% |
| Motor de compatibilidade | 100% nas quatro métricas |
| Limites globais de 80% | Atendidos |
| Build de produção | Concluído, sem avisos |
| Auditoria | A instalação anterior retornou zero avisos conhecidos; não repetida nesta revisão |

Os pacotes Angular permanecem em 22.2.3. O `package.json` e o lockfile mudaram somente o número da versão do projeto para 0.4.1. A configuração usa APIs de teste oficiais do Angular, sem adaptações privadas do compilador. O fluxo corrigido e seu roteiro de teste estão em [14-my-profile.md](14-my-profile.md).

## SonarQube e envio ao repositório

O scanner do frontend precisa encontrar `coverage/frontend/lcov.info`. Se os testes e a análise estiverem em jobs diferentes, o workflow deve publicar e baixar esse arquivo antes do scanner. Somente configurar o caminho não transfere o relatório entre jobs.

`sonar-project.properties` oferece os parâmetros para um scanner executado dentro de `frontend`. Parâmetros passados pelo workflow podem sobrescrever esse arquivo; a equipe precisa conferir a configuração do seu job. O pacote não altera `.github/workflows` nem proteção de branches.

Os arquivos a versionar pertencem a `frontend/` e `docs/`. Pastas `node_modules`, `.angular`, `coverage` e `dist` ficam fora do commit. O ZIP não contém Git. O push e a abertura do PR devem ocorrer na cópia já conectada ao repositório, seguindo a branch de integração acordada pela equipe. A aprovação do Quality Gate deve ser verificada no PR antes do merge.
