# Equipe e convites — interface e validação

Entrega local de 05/11/2026 na branch `codex/startup-team-ui`, baseada na main `fc600c7`. O backend do [PR #30](https://github.com/Diogo746/Da-Match/pull/30) foi integrado; [workflow #105](https://github.com/Diogo746/Da-Match/actions/runs/41937983752) pós-merge concluído com sucesso. Contrato no [guia 30](30-startup-team-invitations.md), evidências do backend no [guia 31](31-startup-team-api-validation.md).

## Comportamento entregue

- `/startup/perfil/{startupId}/equipe`: integrantes confirmados pela API, papéis, proteção do único fundador e remoção com confirmação da pessoa/projeto. FUNDADOR/REPRESENTANTE emitem e cancelam convites; MEMBRO consulta. O projeto deve constar dos vínculos atuais da sessão, sem exceção ADMIN.
- `/startup/convites`: histórico paginado da conta destinatária, incluindo pessoas sem vínculo com o projeto, com aceite/recusa e confirmação explícita do projeto/papel. Entrada disponível na conta STARTUP; equipe acessível a partir do projeto selecionado. Retorno ao perfil preserva `?projeto=ID`.
- Emissão por e-mail exato e papel MEMBRO/REPRESENTANTE, com UUID de solicitação novo por convite. A mensagem confirma convite, sem anunciar vínculo antes do aceite. Datas exibidas em `America/Sao_Paulo`, prazo sempre conferido pelo servidor.
- Toda escrita usa o interceptor de sessão/CSRF existente. DTOs são lidos como `unknown`, validados e projetados nos campos permitidos. Emissão confirma HTTP 201; remoção confirma 204; ações conferem convite/projeto/papel/estado. Não há reenvio automático.
- Após uma escrita, consultar novamente `/startups/me` e os convites antes de liberar novas ações. Um convite ACEITO histórico não devolve acesso a quem foi removido; o link ao projeto depende do vínculo atual confirmado.
- Respostas antigas de conta, sessão, rota/projeto ou página são descartadas. Guardas continuam consultando `/auth/me`; a confirmação de uma conta inalterada preserva a revisão da sessão. Login/logout, mudança de identidade/papel/metadados continuam invalidando contextos.
- DEMO não oferece essas operações; novas rotas usam guarda STARTUP/API. Paleta e navegação existentes preservadas; estilos usam variáveis do tema.

## Resultado sem confirmação

A operação fica registrada somente em memória, por sessão e contexto, antes do envio. Falha de rede, timeout, 5xx ou recibo inválido mantém o bloqueio de escrita, inclusive depois de navegar e voltar. Nenhum e-mail é salvo em localStorage/sessionStorage.

Recuperar emissão pelo GET da solicitação; aceite/recusa/cancelamento pelo GET do convite; remoção pelos vínculos atuais. Aceite também exige releitura de `/startups/me`. Uma página vazia não confirma o resultado. Falha na releitura depois de um recibo bem-sucedido mantém a operação pendente.

Somente um 404 da consulta específica de solicitação habilita reenvio explícito do mesmo UUID/conteúdo; nunca gerar outra chave nessa recuperação. Um 404 de consulta posterior de projeto/lista não habilita esse reenvio. Recarregar a lista comum não elimina a operação pendente.

O registro em memória não sobrevive a recarga completa do navegador ou novo login. Nesses casos a tela consulta o servidor novamente; a API mantém idempotência e rejeita convites pendentes duplicados. Não há promessa de recuperação offline nem armazenamento permanente no cliente.

## Evidências

Ambiente exclusivamente local: Angular `127.0.0.1:4200` → Spring `127.0.0.1:8080` → PostgreSQL 18, banco `team_ui_20261105`, nova cópia de fixtures legados fictícios. Datasources explícitos; nenhuma alteração no banco remoto. Não é dump/inspeção de produção.

- **533 testes frontend + 8 de configuração**, zero falhas; **99,11% de linhas / 96,18% de branches**. Lint e builds DEMO/API aprovados. Runner local ignorado com dois workers e arquivos sequenciais, sem alterar timeouts, exclusões ou CI. Logs em `frontend/.angular/cache/team-ui-{tests,lint,build-demo,build-api}.log`; confirmar Quality Gate do SHA enviado.
- Testes incluem permissões, validação, resposta incompatível, paginação, rotas reais, eventos do formulário, remoção própria, único fundador, aceite histórico após remoção, nova sessão da mesma conta, respostas atrasadas e operação pendente ao destruir/navegar. Cobrem recuperação por identificador, 404 específico e reenvio com chave/conteúdo preservados.
- Chrome com contas fictícias: emissão de MEMBRO → outro login → convite recebido → aceite → projeto disponível → equipe somente leitura. Gestora removeu o membro; novo login manteve histórico ACEITO sem link de acesso. Conferidos cancelamento e novo convite com outro UUID, aceite de REPRESENTANTE e emissão por esse papel; destinatário recusou o novo convite. Sessões encerradas por logout.
- Tela móvel 360 × 800, temas claro/escuro, foco por Tab e acionamento/retorno da confirmação por Enter. Largura de conteúdo 345 px e scrollWidth 345 px (área útil exclui scrollbar). A navegação horizontal existente do layout não foi redesenhada. Não equivale a ensaio com leitor de tela nem zoom real 200%.
- Console do navegador sem erros na conferência final. Capturas locais ignoradas em `frontend/.angular/cache/team-ui-{desktop,mobile,mobile-light,result}.jpg`; relatórios, scripts e backup do PostgreSQL em `backend/database/team-ui-20261105/`, fora de `target`.

Backend não foi alterado nesta etapa; referência de 187 testes/Checkstyle/arquitetura e concorrência no guia 31 e CI #105. Não alegar nova execução Maven a partir dos testes frontend.

## Integração e próxima etapa

Revisar o PR da interface e conferir testes, segurança e Quality Gate do head atual antes de integrar. Nenhum merge ou deploy manual nesta entrega. Homologação publicada, backup/compatibilidade do ambiente alvo, rate limit, leitor de tela e zoom real permanecem no [roteiro operacional](27-startup-next-sessions.md).

Depois da integração da interface, iniciar a etapa 5: definir o contrato de descoberta real (DTOs públicos, elegibilidade, filtros/paginação e privacidade de contato/equipe), sem utilizar as rotas de gestão como catálogo. Matching continua futuro na etapa 6, conforme [guia 29](29-matching-rule-decisions.md); JWT mantendo CSRF e avaliação Vercel continuam decisões futuras.
