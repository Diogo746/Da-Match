# Consulta e edição da própria startup

Implementação de 22/10/2026 na branch `feature/startup-profile`, a partir de `origin/main` em `53b661c`, após a integração do [onboarding](21-startup-integration.md) pelo PR #17. O fluxo é login → Minha conta → Abrir minha startup → consultar → editar → salvar/cancelar → recarregar.

## Contrato HTTP

| Rota | Contrato |
| --- | --- |
| `GET /api/v1/startups/me` | Exige sessão `STARTUP`. Retorna `StartupResponse[]` somente das startups em que a conta é integrante, ordenadas por criação e ID. Sem vínculo: `200 []`. Não recebe o identificador do ator. |
| `PATCH /api/v1/startups/{startupId}` | Exige sessão `STARTUP`, CSRF e vínculo atual `FUNDADOR` ou `REPRESENTANTE`. Retorna `200 StartupResponse`; dados inválidos: `400`; sem sessão: `401`; sem papel/vínculo ou CSRF: `403`; inexistente: `404`. ADMIN não possui exceção. |

`AtualizarStartupRequest` permite somente `nomeProvisorio`, `pitchCurto`, `problemaCentral`, `solucaoProposta`, `publicoAlvo`, `modeloDeNegocio` e `statusValidacao`. Campos omitidos ou nulos são preservados; strings enviadas são aparadas e não podem ser vazias ou conter apenas espaços. Os quatro campos curtos aceitam até 255 caracteres; problema/solução, até 5.000. O estado da ideia aceita `APENAS_IDEIA` ou `PESQUISA_MERCADO`.

O PATCH não altera conta, integrantes, papéis, IDs ou data de criação. A autorização ocorre no serviço antes das alterações, dentro da transação e usando o bloqueio pessimista existente. Uma sessão antiga não mantém acesso de edição se o vínculo de gestão for removido.

O domínio permite múltiplos vínculos por pessoa. Por isso `/me` retorna lista; não se deve selecionar arbitrariamente a primeira startup encontrada numa listagem geral. A interface permite escolher o projeto quando há vários. Membros podem consultar seus projetos, mas somente fundadores/representantes recebem ações de edição.

As rotas anteriores de listagem geral, consulta por ID e integrantes mantêm seus contratos autenticados. `/me` não torna a listagem geral uma API pública de descoberta; a política de dados para descoberta continua pendente.

## Interface

- Rota `/startup/perfil`, carregada sob demanda e protegida por guarda que consulta `/api/v1/auth/me`. Papéis diferentes retornam à conta; visitante vai para entrada; DEMO retorna à home.
- Consulta apresenta dados confirmados pelo servidor. Editar abre cópia preenchida; cancelar preserva o registro anterior. Trocar o projeto fica bloqueado durante edição, carregamento ou escrita sem confirmação.
- Salvar envia somente os sete campos editáveis, com cookies e CSRF pelo interceptor existente. Sem retry automático. Após timeout, desconexão, erro do servidor ou resposta inválida, a escrita é bloqueada até uma consulta bem-sucedida confirmar o resultado.
- Recarregar durante uma edição é uma ação explícita de descarte, indicada no botão. Uma falha de consulta remove os dados anteriores da tela; respostas atrasadas ou sem vínculo com a sessão atual são rejeitadas. Nenhum dado de perfil é persistido no armazenamento do navegador.
- Contas sem vínculo recebem orientação para conferir a associação existente. Não é permitido iniciar outro onboarding estando autenticado.
- `statusValidacao` descreve a ideia; não representa publicação. Não há botão de publicar/pausar startup nesta entrega.

## Validação e operação

Executar `mvn -pl backend test`, `npm.cmd run lint`, `npm.cmd run test:coverage`, `npm.cmd run build` e `npm.cmd run build:api`. A coleção Postman inclui **Minhas startups** e **Editar startup**; conservar cookies e renovar CSRF após login/logout.

Os testes cobrem isolamento por sessão, múltiplos vínculos, ausência de vínculo, papéis de consulta/edição, remoção do vínculo de gestão com sessão ativa, CSRF real, limites de todos os textos, enum, preservação de conta/integrantes/data, edição parcial e releitura. No frontend cobrem permissão, seleção, cancelamento, formulário, falhas e resultado sem confirmação, resposta de outra conta, concorrência, guarda e o fluxo renderizado de cadastro a logout.

Resultados locais em 22/10/2026: **94 testes backend**, Checkstyle sem violações; **303 testes frontend e 8 de configuração**, **98,92% de cobertura de linhas**, lint e builds DEMO/API aprovados, sem avisos de orçamento. O teste HTTP por Angular/proxy/API/H2 em memória confirmou criação, login, consulta isolada, edição com acentos/parágrafos e nova leitura, múltiplos vínculos, acesso de representante, bloqueio de intruso/membro/CSRF ausente/dados inválidos e logout. Nenhum banco remoto foi acessado.

O fluxo renderizado é coberto em jsdom. Não houve revisão visual real nesta sessão: o inventário de navegadores estava vazio e a tentativa de abrir o navegador integrado retornou `Browser is not available: iab`. Conferência visual desktop/mobile, teclado e leitor de tela permanece na homologação.

Não há novas entidades, colunas, variáveis de deploy ou alteração remota de banco nesta entrega. Conferir Quality Gate e homologação publicada separadamente dos testes locais. Duas pessoas com permissão podem sobrescrever alterações sequenciais: não foi introduzido controle de versão otimista; o bloqueio transacional não resolve edição baseada em uma tela antiga.

Próximas entregas e preparação da reformulação visual: [roteiro de continuidade](23-continuity-and-frontend-redesign.md).
