# Matching de mentoria — contrato e validação

Implementação em `codex/mentorship-matching`, baseada na main `d14423e`, em 17/11/2026. Regra normativa: [guia 29](29-matching-rule-decisions.md), `damatch-mentoria-v1`. [PR #40](https://github.com/Diogo746/Da-Match/pull/40). A entrega depende de revisão, CI e merge pelo usuário; não representa publicação em produção. Paleta/Lumen existentes preservados. A atualização formal dos requisitos está no [adendo 1.1](38-srs-matching-v1.1.md).

## Consultas HTTP

| GET | Autorização e resultado |
| --- | --- |
| `/api/v1/startups/{startupId}/recomendacoes` | STARTUP com vínculo atual, inclusive MEMBRO; recomenda mentores para esse projeto |
| `/api/v1/mentores/me/recomendacoes` | MENTOR; origem obtida da conta autenticada, recomenda startups |
| `/api/v1/admin/matching/startups/{startupId}/mentores/{mentorId}` | Somente ADMIN; relatório interno de um par |

Não há parâmetros de consulta: parâmetros desconhecidos, inclusive nota, versão ou ator, retornam 400. Sem autenticação: 401; papel/vínculo incorreto: 403; origem inexistente: 404. Escritas não existem. Cookies JWT/SESSION e CSRF das operações existentes são preservados. Todas as respostas destas rotas, inclusive erros, usam `Cache-Control: private, no-store`. ADMIN não ganha acesso às consultas próprias dos participantes.

Resposta de participante: `perfilOrigemId`, `tipoOrigem`, `versaoRegra`, `calculadoEm` (Instant UTC), `perfilElegivel`, `pendencias` (`campo`, `mensagem`) e `itens`. Cada item contém somente `perfil` com a projeção pública da descoberta (`id`, `tipo`, `nome`, `apresentacao`, `setores`, `topicos`, `formato`, `cidadeId`), `superDamatch` e `agendaEmComum`. Nunca envia nota, contribuições, experiência por assunto, conta, contato, integrantes, textos privados do projeto ou horários exatos. A lista é ordenada pelo backend; o cliente não pontua.

Origem própria incompleta, não publicada ou mentor não recebendo: 200, `perfilElegivel=false`, pendências do próprio perfil e lista vazia. Origem apta sem par acima do corte: 200, `perfilElegivel=true`, sem pendências e lista vazia. Não preencher com DEMO, flexibilizar o corte ou elevar notas desconhecidas.

## Cálculo e rastreabilidade

O domínio puro usa `BigDecimal` para os seis critérios e os limites inclusivos 60/95. Aplica as 13 decisões e os 14 casos do guia 29, inclusive 35/15 para duas necessidades, fator 0,7 para conhecimento, setor geral 7,5 e desconhecidos zero sem redistribuição. Precisa de ao menos uma necessidade atendida, modalidade/cidade compatíveis e frequência igual/flexível. Sem agenda comum continua elegível e perde os dez pontos. Capacidade permanece informativa.

Publicação, cadastro e questionário válidos são reavaliados em ambos os lados; mentor precisa aceitar novas startups. Agenda do mentor vem de `disponibilidade_mentor`, inclusive alterações pelo PATCH antigo, sem alterar/gravar o quiz. Cada consulta lê um snapshot PostgreSQL `REPEATABLE_READ`, calcula todos os candidatos aptos, ordena por nota, necessidades atendidas, prática, agenda comum e UUID textual crescente; só depois limita a 20. Consultas de coleções são carregadas em lotes de 128, sem paginação arbitrária antes da pontuação. Não há entidade/tabela de match, alteração de schema, cache de cálculo ou gravação pela consulta.

O relatório ADMIN exige que os dois perfis individualmente estejam publicados e aptos; caso contrário retorna o mesmo 404. Um par incompatível entre perfis aptos pode ser inspecionado: impedimentos, nota/contribuições nulas, `elegivel=false`, `indicado=false`. Par elegível abaixo de 60 tem nota, mas `indicado=false`. O relatório traz versão, instante, fontes com ID, data do quiz, revisão SHA-256 e snapshot imutável dos dados normativos, além do cálculo e indicadores. A revisão inclui projeção pública, dados efetivos (inclusive agenda) e data do quiz; não depende do instante da consulta. Não inclui credenciais/contatos/textos privados. É rastreabilidade da leitura atual, sem armazenamento de relatórios históricos ou interface administrativa nesta entrega.

## Interface e recuperação

`/recomendacoes`, protegida por autenticação, tem links na conta e no catálogo API. STARTUP com vários projetos deve selecionar explicitamente um; o contexto autorizado permanece em `?startupId=...`. Um único projeto é escolhido automaticamente. Mentor usa somente o próprio perfil. Publicação e questionário têm orientações; seleção inválida/revogada, carregamento, sessão expirada, falha e lista vazia são estados explícitos.

A interface descarta respostas antigas ao trocar conta/projeto, sair ou destruir a tela. Abrir detalhe recalcula a lista, atualiza selo/agenda e retira indicação que deixou de ser válida. Em falha, não mantém uma indicação antiga como atual. O detalhe tem foco inicial, fechamento e retorno ao acionador. Sem agenda comum, lista e detalhe explicam que os horários precisam ser combinados, sem revelar a agenda semanal.

O catálogo continua acessível sem exigir publicação do leitor; recomendações exigem origem apta. DEMO mantém `damatch-rules-v2` isolado e não usa estas consultas nem apresenta sua pontuação como regra aprovada. A indicação não salva perfil, envia interesse, cria conexão, reserva vaga ou marca reunião.

## Evidências locais — 17/11

| Fronteira | Resultado |
| --- | --- |
| Domínio/HTTP/arquitetura/Checkstyle | 333 testes backend na suíte completa; 33 testes direcionados repetidos após ajuste final da consulta |
| Frontend | 661 testes + 8 de configuração; 98,96% de linhas; lint e builds DEMO/API aprovados |
| Proxy Angular → JWT/CSRF → PostgreSQL 18 | 12 cenários, 31 requisições: ordem/selo, dois projetos, direção mentor, privacidade, relatório ADMIN, recusas por papel/vínculo, parâmetros e CSRF |
| Navegador local | Conta → recomendações → seleção de dois projetos → lista/detalhe → recarga → logout; selo e explicação de agenda confirmados, console sem erros/avisos |
| Responsividade | 360 px, seleção, lista e diálogo; sem transbordamento horizontal do corpo. Navegação global mantém sua rolagem existente |

Banco novo e exclusivo em loopback, com dois projetos, quatro mentores e um ADMIN fictícios; nenhum dado/configuração/banco remoto acessado. JWT e chaves exclusivos da QA. Evidências privadas/ignoradas em `backend/database/matching-20261117`; não publicar credenciais, logs ou fixtures. Encerramento: zero sessões JWT vigentes confirmado no banco fictício; API, frontend e contêiner exclusivos parados, dados/evidências preservados. Não é uma homologação geral de acessibilidade, leitores de tela, todos os temas ou ambiente publicado. O ensaio com 130 candidatos em integração cobre classificação antes do limite, lotes, estabilidade e ausência de gravações; não é teste de carga nem SLA.

Próximo passo após CI/revisão/merge: confirmar salvos persistidos e seu escopo; depois interesses/conexões, conversas reais e reuniões conforme [roteiro](27-startup-next-sessions.md). A migração Vercel foi concluída na CI136; não repetir o corte.
