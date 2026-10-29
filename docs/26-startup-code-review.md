# Revisão da base antes de concluir startup

Revisão de 28/10/2026 sobre a main `709bdab`. O PR #21 foi integrado e o [workflow da main](https://github.com/Diogo746/Da-Match/actions/runs/40794552881) terminou com sucesso, incluindo os dois Sonar, DAST e job de deploy. O status do job não substitui homologação funcional do ambiente publicado.

Foram revisados os fluxos de cadastro, sessão/CSRF, perfis de startup/mentor, integrantes, questionário v3, catálogo/matching demonstrativos, DTOs, persistência, testes e configuração de CI/proxy. Os achados abaixo descrevem a base revisada; as correções foram implementadas na branch `fix/startup-review-findings`, conforme o registro ao fim deste documento. Publicação de startup continua sendo a próxima funcionalidade.

## Ajustes encontrados

### 1. Questionário mantém o alvo anterior quando muda somente o parâmetro da rota — P2

O componente carrega somente em `ngOnInit`, guarda `targetId` e não acompanha alterações de `paramMap`. Ao navegar internamente de `/startup/perfil/a/questionario` para `/startup/perfil/b/questionario`, o Router reutiliza a instância, mas o salvamento continua endereçado a `a`. Isso pode modificar o projeto errado quando a pessoa tem permissão nos dois.

Reprodução com RouterTestingHarness e respostas válidas: navegar A → B, editar e salvar; o serviço recebeu `STARTUP, a`, embora a URL já apontasse para B. O caminho atual que volta à lista de perfis antes de escolher outro projeto remonta o componente; o problema é a navegação entre parâmetros sem essa remontagem.

Correção: reagir à identidade completa do contexto (conta, tipo e projeto), limpar o estado anterior e invalidar respostas assíncronas antigas. A escrita deve conferir também o projeto da rota. Cobrir mudança durante consulta, edição e salvamento, além de voltar/avançar.

Referências: [inicialização](../frontend/src/app/features/profile/questionnaire.component.ts#L66), [salvamento](../frontend/src/app/features/profile/questionnaire.component.ts#L118), [rota parametrizada](../frontend/src/app/app.routes.ts).

### 2. Limite de senha está em caracteres, mas BCrypt usa bytes — P2

Cadastro e login limitam a senha a 72 caracteres; o frontend faz a mesma validação. Na dependência efetivamente usada pelo backend, `spring-security-crypto 6.3.3`, BCrypt desconsidera o sufixo além de 72 bytes. Uma senha Unicode pode ultrapassar esse limite com menos de 72 caracteres.

Reprodução local com classes reais: duas senhas fictícias distintas, cada uma com 37 caracteres e 73 bytes UTF-8, passaram na validação do DTO; o hash de uma aceitou a outra porque diferiam somente após o limite de bytes. Nenhuma conta ou credencial real foi utilizada.

Correção: alinhar o cadastro e a mensagem do frontend ao limite em bytes UTF-8, validando antes de gerar o hash. Acrescentar testes ASCII, acentos e caracteres fora do BMP. Tratar explicitamente a compatibilidade do login com contas existentes; não trocar algoritmos ou invalidar hashes automaticamente.

Referências: [DTO de cadastro](../backend/src/main/java/br/senac/fullstack/usuario/api/dto/CadastrarUsuarioRequest.java#L18), [hash](../backend/src/main/java/br/senac/fullstack/usuario/application/service/UsuarioService.java#L42), [normalizador do frontend](../frontend/src/app/core/registration.gateway.ts).

### 3. Item nulo na agenda de mentor passa pela validação — P2

`disponibilidades: [null]` satisfaz `@NotEmpty`/`@Size(min = 1)` e não é rejeitado por `@Valid`, pois falta `@NotNull` no elemento da coleção. O mapper acessa o item e lança `NullPointerException`, que o handler geral converte em erro 500. Afeta cadastro e PATCH de mentor; o questionário v3 já declara a restrição no elemento.

Reprodução com Validator e mapper reais: os dois DTOs aceitaram a coleção e `MentorMapper.toEntities` lançou `NullPointerException`. Não foi executado HTTP adicional para esse caso; a conclusão sobre 500 vem do handler de exceções. A transação do cadastro deve continuar revertendo a conta ao falhar.

Correção: declarar a restrição de elemento nos dois contratos e cobrir HTTP 400, ausência de criação parcial e preservação da agenda no PATCH rejeitado. Não filtrar os itens inválidos silenciosamente.

Referências: [cadastro](../backend/src/main/java/br/senac/fullstack/mentor/api/dto/CadastrarMentorRequest.java#L26), [PATCH](../backend/src/main/java/br/senac/fullstack/mentor/api/dto/AtualizarPerfilMentorRequest.java#L21), [mapper](../backend/src/main/java/br/senac/fullstack/mentor/api/mapper/MentorMapper.java#L42).

### 4. Perfil de mentor permite novo envio após resultado incerto — P2

Após falha de conexão, timeout ou erro 500, a tela orienta recarregar, mas não bloqueia `save` ou `changeStatus`. O estado `busy` é liberado e não há estado de resultado incerto. Startup e questionário já têm esse bloqueio; não copiar essa lacuna ao implementar publicação de startup.

Reprodução: simular 500 e acionar salvar novamente sem GET; foram feitas duas chamadas. Não há retry automático do interceptor, mas o reenvio manual permanece disponível.

Correção: bloquear novas escritas até GET bem-sucedido e cobrir também publicação/pausa. Erros de validação e autorização precisam de tratamento próprio, sem declarar sucesso.

Referências: [salvamento/status](../frontend/src/app/features/profile/mentor-profile.component.ts#L50), [tratamento de falhas](../frontend/src/app/features/profile/mentor-profile.component.ts#L97).

### 5. Mensagens ainda descrevem o questionário como futuro ou demonstrativo — P3

O rodapé de Minha startup contradiz o link que já abre o questionário real. As confirmações de cadastro de startup e mentor também usam o texto anterior à integração. O cadastro DEMO ainda menciona cinco etapas, embora o questionário tenha seis. A confirmação de mentor menciona porcentagens, retiradas da interface por decisão do PO.

Correção: explicar o questionário persistido pelo projeto/mentor, manter descoberta/matching como demonstração e atualizar os textos de etapas. Não sugerir que as respostas ficam compartilhadas entre os projetos da mesma conta.

Referências: [Minha startup](../frontend/src/app/features/profile/startup-profile.component.html#L70), [confirmação startup](../frontend/src/app/features/register/startup-registration-complete.component.ts), [confirmação mentor](../frontend/src/app/features/register/mentor-registration-complete.component.ts), [cadastro](../frontend/src/app/features/register/register.component.html#L34).

## O que preservar e o que falta para startup

Cadastro transacional de conta + projeto + fundador, DTOs separados de entidades, sessão/CSRF, consulta própria com múltiplos projetos e autorização por vínculo continuam sendo a base adequada. O questionário pertence ao projeto; `projectName` de 60 caracteres é um rótulo opcional e não substitui `nomeProvisorio` obrigatório de 255. Os quatro momentos do questionário não substituem os dois valores de `statusValidacao`.

A próxima funcionalidade continua sendo publicação/pausa. Será necessário criar estado próprio `RASCUNHO/PUBLICADO/PAUSADO`, regras de elegibilidade e pendências, endpoint protegido por CSRF e gestão atual, DTO/cliente/tela e testes de transição. A coluna nova precisa de default seguro e teste de atualização de schema populado, preservando Hibernate `update`. Os requisitos exatos de publicação devem ser explicitados no contrato; salvar questionário não publica o projeto.

A listagem geral atual de startups é permitida a qualquer conta autenticada e usa DTO de gestão com integrantes. Isso é o contrato existente, não uma descoberta filtrada por publicação. Antes da descoberta real, definir DTO público e visibilidade de rascunhos/pausados; não conectar o catálogo diretamente a essa listagem.

A gestão de integrantes já possui rotas de inclusão/remoção, mas falta interface e contrato de localização/convite de contas. Há também uma decisão a fechar: o serviço admite associar uma conta de outro tipo, enquanto consulta própria/questionário exigem `STARTUP`. Definir a elegibilidade antes da interface; não alterar o modelo de papéis silenciosamente.

Matching definitivo continua dependente do guia 16. Salvos reais, interesses, conexões e reuniões vêm depois. A reformulação visual completa permanece uma etapa futura.

## Validação e sequência

- Base atual: `mvn -pl backend test` aprovado, 135 testes e Checkstyle; frontend com 360 testes + 8 de configuração e 98,98% de linhas. Os testes de diagnóstico expõem lacunas que a suíte existente não cobre.
- Duas reproduções de UI feitas com Router real/serviços simulados falharam nas asserções do comportamento esperado. Fontes/logs preservados localmente em `frontend/.angular/cache/startup-audit.review.spec.ts` e `startup-audit-review.log`; os testes temporários foram retirados de `src` antes de conferir a suíte oficial.
- Reproduções de senha e validação/mapper estão em `backend/target/StartupPasswordAudit.java` e `StartupBackendAudit.java`, usando as dependências reais do projeto. Artefatos de diagnóstico são locais e ignorados pelo Git.
- Não houve revisão visual/mobile, ensaio PostgreSQL, acesso a dados reais, alteração funcional, merge ou deploy nesta revisão.

## Correções implementadas

1. O questionário acompanha o parâmetro da rota, invalida contexto por revisão/conta/projeto e descarta respostas ou erros antigos. Trocar de projeto limpa formulário e permissões. Uma escrita já enviada termina antes do GET do novo contexto; não se inicia outra escrita baseada em dados anteriores. Testes usam o Router e cobrem mudança em consulta, edição e escrita, permissões diferentes, voltar/avançar e destruição do componente.
2. Cadastro valida 72 bytes UTF-8 no formulário, normalizador, DTO e serviço. Novos hashes BCrypt recebem identificador `{bcrypt-utf8}` e rejeitam no login sufixos que ultrapassem o limite. Hashes antigos sem identificador continuam compatíveis, sem reescrita; o truncamento legado permanece até existir redefinição de senha. Compatibilidade e requisito de rollback no [guia de segurança](backend-security.md#senhas-e-compatibilidade-bcrypt).
3. Os DTOs de agenda antiga exigem elementos não nulos. Testes HTTP confirmam 400 tanto para `[null]` quanto para combinação de item válido com nulo, ausência de criação parcial e preservação de biografia/agenda no PATCH rejeitado.
4. A tela de mentor bloqueia salvar/publicar/pausar após falha sem confirmação. GET inválido ou indisponível não desbloqueia; GET bem-sucedido restaura o estado confirmado. Erros de validação/autorização seguem tratamento próprio.
5. Textos de cadastro e perfis descrevem o questionário persistido por projeto/mentor, as seis etapas e a descoberta ainda demonstrativa, sem anunciar porcentagens ao participante.

Validação local das correções: **145 testes backend e Checkstyle**, **378 testes frontend + 8 de configuração**, **99,05% das linhas frontend**, lint e builds DEMO/API aprovados. Os gates remotos devem corresponder ao commit enviado. Não houve alteração remota de banco, revisão visual/mobile ou deploy manual nesta correção.

Ordem recomendada: integrar/homologar estas correções e o fluxo do questionário → implementar publicação/pausa com pendências → integrantes → descoberta → matching aprovado.
