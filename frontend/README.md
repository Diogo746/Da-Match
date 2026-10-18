# DaMatch — frontend v0.5.0

Frontend Angular para startups em ideação e mentores. A v0.5.0 reúne o questionário de cinco etapas, a compatibilidade `damatch-rules-v2`, seis poses do Lumen e a identidade visual azul/verde.

## Executar a demonstração

Requer Node.js 24.15 ou superior na linha 24, ou 22.22.3 ou superior na linha 22. Abra a pasta `frontend`, que contém `package.json`, no VS Code:

```powershell
npm.cmd ci
npm.cmd start
```

Abra **http://localhost:4200**. Mantenha o terminal aberto. **Ctrl+C** encerra o servidor. Nas próximas execuções, basta `npm.cmd start`. Em Linux/macOS, use `npm` em vez de `npm.cmd`.

A demonstração funciona sem backend. Use dados fictícios. Contas, perfis, respostas e salvos ficam em memória e reiniciam ao recarregar. Somente a preferência de tema é lembrada no navegador.

## Teste rápido como startup

1. Abra **Criar perfil**, selecione **Startup em ideação** e preencha dados fictícios.
2. Confirme a demonstração e continue.
3. Escolha **Um problema que quero entender**.
4. Escolha **Tecnologia**.
5. Selecione **Validar a ideia** como principal e **Preços e custos** como secundária. A prioridade pode ser trocada pelo botão correspondente.
6. Escolha **Online**.
7. Na agenda, escolha **Podemos combinar**, abra **Quinta-feira** e marque **Noite**.
8. Use **Revisar meu perfil**, confira o resumo e clique em **Concluir meu perfil**.
9. Abra as indicações. Marina e Rafael devem aparecer com **80%**.
10. Em **Meu perfil**, edite as necessidades e mantenha somente **Validar a ideia**. Essas indicações passam a **100%**. Cancelar uma edição preserva o perfil anterior.

O Lumen muda de pose entre perguntas e reage brevemente às escolhas. A pergunta fica no próprio balão. O progresso mostra cinco etapas efetivamente preenchidas; a revisão é feita antes da conclusão.

## Teste rápido como mentor

Escolha **Mentor**, preencha a biografia obrigatória e avance. No questionário, escolha **Descoberta do problema**, **Tecnologia**, **Validar a ideia** e **Primeiro protótipo**. Indique o tipo de experiência nas duas especialidades. Selecione **Online**, **Podemos combinar** e **Quinta-feira · Noite**. Revise e conclua. Semente Labs deve aparecer com **100%**.

Em **Meu perfil**, abra **Disponibilidade**, desmarque **Estou recebendo novas startups** e salve. As indicações ficam pausadas. A edição é por seção e não exige repetir o cadastro.

## Compatibilidade

| Critério | Pontuação |
| --- | --- |
| Necessidade principal | 50, ou 70 quando é a única |
| Necessidade secundária | 20, quando escolhida |
| Setor | 20 para experiência direta; 10 para atuação geral |
| Momento dentro da ideação | 10 |

O par precisa ter ao menos uma necessidade atendida, modalidade viável, janela de dia/período em comum, frequência compatível e mentor disponível. Frequência flexível permite combinar com outra preferência. A janela aponta uma possibilidade; o horário exato ainda deve ser combinado.

A experiência prática declarada explica o apoio e desempata notas iguais. O setor em descoberta produz uma indicação parcial, sem porcentagem. A nota representa aderência às respostas, não probabilidade de sucesso. Os pesos são hipóteses do MVP, sujeitos à validação com participantes e ao alinhamento com o SRS da equipe.

## Cadastro conectado de mentor

O backend incluído corresponde à main enviada em 17/10/2026. Os arquivos Java, o banco e as configurações do servidor foram preservados.

1. Com **Java 21 e Maven**, configure `SUPABASE_DB_URL` apenas no ambiente do backend, com o responsável pelo banco.
2. Em um terminal **na raiz do repositório**, execute:

   ```powershell
   mvn -pl backend spring-boot:run
   ```

3. Aguarde o backend em **http://localhost:8080**.
4. Em outro terminal, **dentro de frontend**, execute:

   ```powershell
   npm.cmd run start:api
   ```

5. Abra **http://localhost:4200/cadastro**. O topo identifica a integração de mentor.

O envio consulta `GET /csrf` e realiza `POST /api/v1/mentores` com `usuario: { nome, email, senha }`, biografia obrigatória e LinkedIn/Instagram opcionais. O token e o cookie de proteção são preservados pelo fluxo de mesma origem. A confirmação exige HTTP 201 e os campos previstos.

| Recurso | Demonstração | Modo API |
| --- | --- | --- |
| Cadastro de mentor | Simulado | Enviado ao backend |
| Cadastro de startup | Simulado | Ainda indisponível |
| Questionário, Meu perfil e compatibilidade | Temporários | Ainda sem persistência/API |
| Catálogo e salvos | Fictícios | Fictícios, identificados como demonstração |
| Login autenticado | Ainda indisponível | Ainda indisponível |

O cadastro conectado não cria uma sessão autenticada. As respostas novas não são acrescentadas ao JSON atual do mentor. A integração completa depende de novos endpoints de perfil, startups e recomendações.

O cliente não repete POST automaticamente. Se o resultado ficar sem confirmação depois do envio, a conta pode ter sido criada. Confira com o responsável pelo backend antes de tentar novamente. Os detalhes de contrato, tratamento de falhas, biografia e e-mail duplicado estão no [guia da integração](../docs/17-mentor-api-integration.md).

## Aparência e movimento

- Mentores usam duas variações de azul; startups usam duas de verde. A variação é estável por identificador.
- Capas, etiquetas e prévias compartilham a mesma família de cor nos modos claro e escuro.
- Lumen: boas-vindas na home; curioso, pensativo e apresentando nas perguntas; confirmação breve e conclusão.
- Halo luminoso e flutuação discreta em ciclos de oito segundos. O núcleo continua visível e o brilho é reforçado no tema escuro.
- A pausa no rodapé e a preferência de movimento reduzido do dispositivo desativam os movimentos e as reações breves.
- Páginas, escolhas, cards e detalhes usam transições curtas.

A [paleta e as poses](../docs/19-visual-identity.md) registram os códigos e os arquivos usados. As poses são imagens PNG; o CSS anima entrada, flutuação e halo.

## Verificar

```powershell
npm.cmd run lint
npm.cmd run test:coverage
npm.cmd run build
npm.cmd run build:api
```

Nesta entrega: **172 testes passaram em 15 arquivos**. Cobertura: linhas **97,61%**, declarações **96,20%**, ramificações **95,36%** e funções **92,63%**. Os tipos dos testes também passaram. Os limites globais continuam em 80% nas quatro métricas.

- Cobertura HTML: `coverage/frontend/index.html`.
- LCOV para Sonar: `coverage/frontend/lcov.info`.
- Build demonstrativo: `dist/frontend/browser`.
- Build conectado: `dist/frontend-api/browser`.

Os testes compilam os templates Angular e exercitam o DOM com Vitest/jsdom. As chamadas HTTP são simuladas. A execução com Java/Supabase, a avaliação com leitores de tela e a revisão visual em navegador real continuam no roteiro de homologação. O ambiente desta entrega não conseguiu instalar o navegador para a revisão visual.

O CI mantém lint, cobertura, ambos os builds e transferência do LCOV ao Sonar. A aprovação no SonarQube depende do novo push e do pipeline da equipe. Nenhuma dependência foi acrescentada nesta revisão.

## Hospedagem

Use um servidor HTTP; não abra o build por `file://`. As rotas precisam de fallback para `index.html`. No modo API, o servidor de hospedagem também deve encaminhar `/api/**` e `/csrf` ao backend antes desse fallback, preservando cookies e headers. O proxy de `ng serve` atende apenas ao desenvolvimento.

