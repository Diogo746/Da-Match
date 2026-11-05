# Descoberta real — interface e validação

Entrega de 05/11/2026 em `codex/discovery-ui`, baseada na main `5b2207e`, após integração do [PR #33](https://github.com/Diogo746/Da-Match/pull/33). [CI pós-merge #113](https://github.com/Diogo746/Da-Match/actions/runs/42079760834) concluída com sucesso. O [contrato 33](33-discovery-contract.md) e a API do [guia 34](34-discovery-api-validation.md) são preservados. **Interface implementada e validada localmente; conferir CI/Quality Gate e revisão antes da integração.**

## Comportamento entregue

- A página principal no modo API restaura a sessão e consulta somente a API de descoberta: STARTUP vê mentores; MENTOR vê startups. Visitantes recebem entrada/cadastro, ADMIN recebe orientação para a conta. Não é necessário publicar ou completar o próprio quiz para pesquisar.
- Listas e detalhes usam exclusivamente a projeção de oito campos aprovada. Cliente valida tipo, UUID, limites, códigos, listas, contagens e contexto da página; rejeita payloads incompatíveis. Não consulta DTOs de gestão, dados demonstrativos, cálculo local de match ou armazenamento persistente de terceiros.
- Busca literal por nome/apresentação, setor, tema, modalidade e cidade para encontros presenciais; filtros/página/tamanho são restaurados e validados pela URL. Enviar pesquisa volta à página zero; recarga e histórico preservam a consulta. Endereço inválido permite limpar a pesquisa. Total, ordem e paginação vêm do servidor.
- O detalhe faz um novo GET. Carregamento, falha, falta de acesso e perfil indisponível não exibem a apresentação anterior. Falha do detalhe remove os cards anteriores e permite atualizar a pesquisa. Dialog nativo com foco no botão Fechar, Escape e retorno ao acionador; se o card desapareceu, foco retorna ao botão Atualizar pesquisa.
- Respostas de lista, detalhe e restauração de sessão são conferidas por revisão/contexto. Troca de conta, logout/login da mesma pessoa, filtro/página, fechamento e destruição invalidam respostas antigas. `AuthService.me` passou a rejeitar uma restauração cujo estado de sessão mudou antes da resposta.
- Modo DEMO preserva catálogo, recomendações e salvos temporários em componentes próprios. A rota carrega somente o componente do modo selecionado, sob demanda. No modo API, catálogo e layout não instanciam os stores demonstrativos; salvos saem da navegação e a URL direta informa a entrega futura. Não há selo, nota, contatos, salvar, interesse ou conexão fictícios no catálogo real.
- Layout global, cadastro, Como funciona e perfis próprios têm textos coerentes com a descoberta disponível. Perfis próprios informam os requisitos e os campos exibidos a outros participantes. Paleta/CSS global da equipe preservados. Sessão, cookies HttpOnly, CSRF, proxy e backend não foram alterados por esta entrega.

## Verificações locais

| Fronteira | Evidência |
| --- | --- |
| Frontend | **606 testes**, mais **oito testes de configuração**, aprovados; **99,09% de linhas (2625/2649)**; lint e builds de produção DEMO/API aprovados, sem avisos de tamanho (**441,07 kB** iniciais). Log `frontend/.angular/cache/discovery-ui-tests.log`. Concorrência limitada apenas no runner local já utilizado pelo projeto; sem mudar timeouts, exclusões, metas ou CI. |
| Contrato/HTTP Angular | Validação de DTO/página/URL, credenciais pelo interceptor e GET sem CSRF extra; erros, timeout e DEMO sem chamadas reais. Teste integrado com rotas/layout/serviços reais: restauração → consulta → filtro → detalhe → expiração, impedindo construção dos stores DEMO. |
| Revisões e falhas | Respostas fora de ordem, mudança de página/conta, logout/login da mesma conta, restauração antiga, detalhe fechado/substituído, destruição, URL inválida, rede e 400/401/403/404/503. Erro não vira lista vazia nem fallback fictício. |
| Navegador → proxy → Spring → PostgreSQL 18 | Cópia fictícia `discovery_ui_20261105` derivada de `team_ui_20261105`; API em loopback com `ddl-auto=validate`. Conta STARTUP sem quiz pesquisou **21 mentores**, com 20 na primeira página e um na segunda; recarga/Voltar, acentos/caixa, cidade/modalidade e detalhe completo conferidos. |
| Privacidade e estado | Mentor pausado após a listagem retornou indisponível ao abrir o card antigo; apresentação anterior e cards removidos. Conta MENTOR consultou startup e seu resumo, sem os demais textos privados. Rota Salvos não exibiu dados fictícios. Logout de mentor confirmado. |
| Recuperação real | API local interrompida após a listagem: mensagem de falha sem cards/fallback; ao restaurar a API, a sessão em memória havia terminado e a interface pediu nova entrada. Login de outro papel e nova pesquisa funcionaram. |
| Interface | Desktop e 360 px, temas claro/escuro, nome longo sem espaços e biografia permitida de quase 1.000 caracteres; sem rolagem horizontal nos estados inspecionados. Dialog focou Fechar, Escape fechou e devolveu foco ao card. Retorno ao botão de recarga quando o card desaparece também validado em teste de componente. |
| Preservação | Schema inalterado; os cinco usuários, quatro startups, seis vínculos e um mentor anteriores preservados integralmente. Novos fixtures: 24 contas, duas startups/dois vínculos e 22 mentores. Dump fictício e evidências fora de `target`, em `backend/database/discovery-ui-20261105/` ignorado. API, frontend e contêiner exclusivos encerrados. |

Capturas locais ignoradas em `frontend/.angular/cache/`: `discovery-desktop-full.png`, `discovery-detail-360-light.png`, `discovery-360-dark.png` e `discovery-startup-detail-dark.png`. Os nomes e textos dessas capturas são fixtures de homologação persistidos na cópia local, não registros reais de participantes nem dados embutidos no frontend. A captura desktop antecedeu um pequeno ajuste de carregamento/CSS; a captura do detalhe da startup já reflete esse ajuste.

## Ocorrências e limites

O primeiro build compilou, mas excedeu os avisos de tamanho do bundle inicial e do CSS novo. A descoberta foi separada por carregamento de rota e o CSS reduzido; builds finais sem avisos, mantendo os limites existentes. A primeira execução sem elevação também encontrou `EPERM` na cópia de assets; a execução com acesso ao diretório de saída concluiu sem mudança no código de assets.

O preparador HTTP inicialmente tentou enviar acento sem codificar a URL, depois de criar os 24 fixtures. Corrigida a codificação, as mesmas contas foram recuperadas apenas na cópia fictícia, com senhas de teste renovadas em memória, sem duplicar perfis nem modificar os registros legados. Senhas/cookies/tokens não foram gravados nos relatórios. A sessão perdida pelo preparador terminou com o reinício isolado da API; as sessões posteriores de ensaio foram encerradas por logout. A última leitura do console mostrou uma ocorrência de `removeChild` originada no content script da extensão Chrome, sem stack da aplicação; falhas HTTP induzidas foram intencionais. Captura completa móvel excedeu o tempo do navegador e foi refeita pela captura disponível, restaurando o viewport original e o tema escuro inicial.

Sem alteração de backend/schema, banco remoto, merge ou deploy manual. A estratégia de consulta em memória da API mantém o limite documentado no guia 34. Não foram realizados zoom real de 200%, leitor de tela ou homologação funcional publicada; continuam na etapa 10. Aprovação da CI não equivale à inspeção do banco ou do ambiente de produção.

## Próxima ação

Conferir CI e Quality Gate do head, revisar e integrar esta interface. Depois, atualizar a main e iniciar a etapa 6, matching `damatch-mentoria-v1`, conforme as decisões já fechadas no [guia 29](29-matching-rule-decisions.md), sem novo questionário sobre os mesmos pontos. Salvos persistidos, interesses/conexões e reuniões continuam nas etapas seguintes. JWT mantendo CSRF e avaliação da Vercel permanecem para a preparação de hospedagem, sem antecipação nesta entrega.
