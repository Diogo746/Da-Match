# Qualidade do backend e prevenção de regressões

Na revisão do SonarQube em 21/10/2026, o Quality Gate falhou por quatro novos apontamentos. A cobertura de código novo era 95,7% e a duplicação era 0%; ambas já atendiam ao gate. Testes e Checkstyle aprovados não substituem a análise SonarQube.

| Regra | Causa | Correção e orientação |
| --- | --- | --- |
| `java:S2160` | `UsuarioPrincipal` adicionava campos ao herdar de `User`, sem explicitar a igualdade. | Declarar `equals` e `hashCode` juntos. A identidade permanece o e-mail exato, conforme o contrato do Spring `User`; UUID, nome e papel são metadados de sessão. Não incluir senha/hash na identidade, pois as credenciais são apagadas após autenticação. Testar simetria com `User` e estabilidade em coleções após apagar credenciais. |
| `java:S1612` | Uma lambda apenas chamava `disable()` do HSTS. | Usar `HstsConfig::disable`. Preferir referências de método quando elas expressarem a mesma chamada com clareza. HSTS continua desativado somente fora de produção. |
| `java:S3330` | O cookie CSRF era criado por `withHttpOnlyFalse()`. | Usar `HttpOnly=true` nos cookies de sessão e CSRF. Como o frontend e o Postman já obtêm o token pelo JSON de `/csrf`, não há necessidade de leitura do cookie por JavaScript. Preservar a exigência de cookie **e** header e a renovação após login/logout. |
| `java:S5778` | A lambda de uma asserção de exceção construía objetos e chamava o método sob teste. | Construir configurações e argumentos antes de `assertThatThrownBy`/`assertThrows`. Deixar somente a chamada que deve lançar a exceção dentro da lambda. |

## Validação

- Executar `mvn -pl backend test`, incluindo Checkstyle, testes de arquitetura e integração de segurança.
- Verificar os atributos dos cookies em respostas HTTP reais de `/csrf`, login e logout, além da aceitação do token do JSON no header.
- Confirmar em teste que apenas o cookie, sem o header CSRF, não autoriza escritas.
- Consultar a análise SonarQube da revisão efetivamente enviada. Um teste local aprovado não confirma o Quality Gate remoto.
- Corrigir a causa dos apontamentos; não reduzir o gate, excluir arquivos ou suprimir regras para ocultá-los.

Credenciais de acesso ao SonarQube não pertencem ao repositório, ao contexto do agente nem aos relatórios de qualidade.

Validação local após as correções: `mvn -pl backend test` aprovado, com **84 testes**, sem falhas, erros ou testes ignorados. Inclui os três novos testes de identidade/credenciais do principal e verificações de cookies HttpOnly. A aprovação do Quality Gate remoto depende de uma nova análise do código corrigido.
