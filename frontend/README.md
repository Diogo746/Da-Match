# DaMatch — frontend v0.4.1

Protótipo Angular para **startups em ideação e mentores** do Nordeste. O cadastro recebe o apoio do **Lumen**, mascote original do projeto, e apresenta quatro pequenas etapas. As respostas geram indicações com porcentagem, motivos e pontos de atenção. Identidade visual em azul-marinho, verde-petróleo e menta.

## Executar no Windows

Requer Node.js **24.15.0 ou superior na linha 24**, ou **22.22.3 ou superior na linha 22**. O npm acompanha o Node.

Abra esta pasta `frontend`, que contém `package.json`, no VS Code. No terminal:

```powershell
npm.cmd ci
npm.cmd start
```

Abra **http://localhost:4200** e mantenha o terminal aberto. Para parar, use **Ctrl+C**. Em Linux/macOS, utilize `npm` no lugar de `npm.cmd`. Nas próximas execuções, basta `npm.cmd start`; reinstale com `npm.cmd ci` ao atualizar as dependências ou trocar de versão.

Esta demonstração funciona sem backend ou banco de dados. Não abra `index.html` por duplo clique.

## Correção da v0.4.1

**Meu perfil** agora abre uma página de consulta, com suas informações, preferências e cartão. O questionário inicial não reaparece ao navegar para essa aba depois de concluir o perfil.

Use **Editar perfil** para revisar as respostas ou **Alterar** na seção desejada para ir direto ao assunto. Tudo vem preenchido. **Salvar alterações** aplica as mudanças e recalcula as indicações; **Cancelar** ou sair da tela mantém as respostas anteriores. Na edição, as quatro seções ficam acessíveis sem repetir a sequência do cadastro.

O perfil continua temporário nesta demonstração: recarregar a página reinicia os dados. A consulta e a edição estão detalhadas em [docs/14-my-profile.md](../docs/14-my-profile.md).

## Aparência e movimento

- **Tema claro e escuro** em todas as telas, com seletor no topo e preferência lembrada no navegador.
- **Brilho do Lumen reforçado**, com núcleo na lanterna e halo externo, mais intenso no escuro.
- **Balões de fala** na home, no cadastro e nas quatro etapas, com mensagens curtas que acompanham o contexto.

## Recursos

- Lumen em guache 2D, com tons escuros, sem traços humanos e com uma luz lenta no abdômen.
- Transições discretas de navegação, etapas, escolhas e abertura de perfis, com opção de pausar as animações.
- Dados básicos da conta, seguidos por quatro etapas: setor, necessidades/especialidades, modalidade e agenda.
- Prévia do cartão atualizada durante o preenchimento e progresso calculado a partir das etapas respondidas.
- Home personalizada para startup ou mentor, com resultados ordenados por compatibilidade.
- Detalhes com motivos, limitações e decomposição da pontuação.
- Consulta em **Meu perfil**, com edição opcional e recálculo das indicações ao salvar.
- Pausa para novas mentorias, sem mudar as preferências do participante para preencher a lista.
- Descoberta pública, busca sem acentos, filtros e salvos preservados.
- Dez perfis fictícios: seis mentores e quatro startups em ideação.

O catálogo público fica acessível antes do cadastro. Porcentagens só aparecem quando há um perfil preenchido para comparar.

## Tema claro e escuro

Use o botão **Modo escuro / Modo claro**, no topo. A primeira abertura acompanha a preferência do dispositivo quando não há escolha salva. Ao alternar, a preferência fica no navegador e é restaurada ao recarregar. Somente o tema é lembrado; conta, perfil e salvos continuam temporários.

Se o navegador bloquear o armazenamento, a alternância continua funcionando durante a sessão. Nenhuma informação de cadastro é guardada junto à preferência de aparência. Os detalhes estão em [docs/13-appearance.md](../docs/13-appearance.md).

## Movimento e acessibilidade

A lanterna do Lumen combina um núcleo luminoso e um halo externo. A intensidade aumenta e reduz em um ciclo de **6,8 segundos**, com brilho mais forte no modo escuro, sem apagar a ilustração nem piscar rapidamente. A navegação, as etapas e a abertura dos perfis usam transições curtas. O menu permanece estável.

No rodapé, **Pausar animações** interrompe os movimentos e as transições durante a sessão; **Retomar animações** restaura o comportamento padrão. A preferência **reduzir movimento** do dispositivo tem prioridade. No modo reduzido, as mesmas informações e ações ficam disponíveis sem animação. O comportamento está documentado em [docs/12-motion.md](../docs/12-motion.md).

## Teste rápido como startup

1. Clique em **Montar meu perfil** ou **Criar perfil**.
2. Escolha **Startup em ideação**. Use `Maria Teste`, `maria@example.test` e uma senha inventada com pelo menos seis caracteres. Confirme o modo de demonstração.
3. Clique em **Continuar para meu perfil**.
4. Em **Setor**, selecione **Tecnologia**. O nome da ideia é opcional.
5. Escolha **Validar a ideia** primeiro e **Preços e custos** depois. A ordem define a prioridade.
6. Escolha **Online**.
7. Marque **quinta-feira** e **Noite**, conclua e clique em **Ver minhas indicações**.
8. Marina Albuquerque e Rafael Nascimento devem aparecer com **80%**: atendem à necessidade principal e ao setor, sem cobrir a secundária.
9. Abra **Ver perfil** para conferir os motivos, o ponto de atenção e os pontos de cada critério.
10. Abra **Meu perfil**. A página deve mostrar o resumo, sem questionário.
11. Em **O que sua ideia precisa**, clique em **Alterar**. As necessidades atuais já devem estar marcadas. Desmarque **Preços e custos** e clique em **Salvar alterações**.
12. Você volta ao resumo. Em **Ver indicações**, Marina e Rafael agora devem aparecer com **100%**: a única necessidade passa a valer os 70 pontos.
13. Para testar o cancelamento, edite outra resposta e clique em **Cancelar**. O resumo e as indicações devem manter os dados salvos anteriormente.

Para experimentar o estado vazio, selecione **Presencial** em **Olinda**. O catálogo de teste não tem mentor presencial nessa cidade. A aplicação mantém sua escolha e oferece revisar o perfil ou explorar o catálogo.

## Teste rápido como mentor

Use outro e-mail fictício, ou recarregue a página para reiniciar a demonstração.

1. Escolha **Mentor** no cadastro.
2. Selecione **Tecnologia** e as especialidades **Validar a ideia** e **Primeiro protótipo**.
3. Escolha **Online**, **quinta-feira** e **Noite**. Mantenha ativa a opção de receber novas startups.
4. Na home, **Semente Labs** deve aparecer com **100% nos critérios declarados**.
5. Abra **Meu perfil** e clique em **Alterar** na seção **Disponibilidade**. Desmarque **Estou recebendo novas startups** e salve. O resumo deve indicar **Novas mentorias em pausa**; as indicações ficam em pausa e o catálogo público continua disponível.

## Como a compatibilidade funciona

O cálculo está em `src/app/core/matching.engine.ts` e usa regras determinísticas, sem IA ou serviço externo.

| Critério | Pontos |
| --- | ---: |
| Necessidade principal atendida | 50 |
| Necessidade secundária atendida | 20 |
| Experiência declarada no setor | 30 |

Quando a startup escolhe apenas uma necessidade, ela vale os **70 pontos**, para não punir a ausência da resposta opcional. Um mentor de atuação geral recebe **15 dos 30 pontos de setor**; experiência direta recebe 30. Um setor diferente recebe zero nesse critério.

Antes de recomendar, verificamos se o mentor recebe novas startups, se as modalidades permitem um encontro e se existem dias e períodos em comum. Para encontros exclusivamente presenciais, a cidade precisa coincidir. Os dias e períodos marcados representam combinações disponíveis; as faixas são indicativas, no horário de Recife, e não reservam uma reunião.

Uma indicação precisa atender a pelo menos uma necessidade. Coincidência de setor, sozinha, não basta. O setor **Ainda estou descobrindo** permite apresentar pontos em comum, mas mantém a porcentagem como pendente. A página nunca inventa um percentual completo para esse caso.

A pontuação representa **aderência às respostas**, não probabilidade de sucesso. Os pesos iniciais precisam ser avaliados com participantes e com a equipe. Interesse mútuo, conexão e agendamento são funcionalidades futuras.

## Verificações automáticas

```powershell
npm.cmd run lint
npm.cmd run test:coverage
npm.cmd run build
```

Os testes usam **Vitest pelo builder oficial do Angular**, com compilação dos templates e DOM simulado em jsdom. O comando continua o mesmo; a configuração fica no alvo `test` de `angular.json`. `npm.cmd test` executa sem cobertura e `npm.cmd run test:watch` acompanha alterações.

A cobertura tem mínimo global de **80% em linhas, declarações, funções e ramificações**. O teste falha se um desses limites não for atendido.

- Relatório HTML: `coverage/frontend/index.html`.
- Relatório para o SonarQube: `coverage/frontend/lcov.info`.
- Build de produção: `dist/frontend/browser`.

### Resultado desta entrega

**92 testes passaram**, incluindo os fluxos renderizados de cadastro, consulta do perfil, edição por seção, validação, cancelamento e atualização das indicações para os dois tipos de participante. A cobertura medida apresentou **96,62% de linhas**, 95,28% de declarações, 94,54% de ramificações e 88,62% de funções. O motor de compatibilidade teve 100% nas quatro métricas. Lint, verificação de tipos dos testes e build de produção concluídos sem erros.

As dependências foram preservadas nesta revisão. Na instalação limpa da entrega anterior, os pacotes Angular foram alinhados na linha **22.2.3**, e a instalação limpa com `npm ci` foi executada. A auditoria daquela instalação retornou **zero vulnerabilidades conhecidas**, substituindo os 12 alertas presentes no pacote anterior. Esse resultado corresponde à base de avisos consultada nesta verificação.

O arquivo `sonar-project.properties` aponta para o LCOV. O pipeline precisa gerar esse relatório antes do scanner ou transferi-lo entre jobs. Este pacote não modifica o workflow do repositório nem comprova aprovação no SonarQube.

Para hospedar o build, use servidor HTTP com fallback de rotas para `index.html`.

## Dados e integração

Esta versão simula a conta com `DemoRegistrationGateway`. O objeto básico da conta continua com `nome`, `email` e `senha`. A senha é validada, não é enviada por HTTP ou gravada em armazenamento, e seu campo é limpo após a confirmação do teste. Nome e e-mail são normalizados; a senha não tem seus espaços removidos.

As respostas adicionais ficam em `ProfileSessionStore`, separadas das credenciais. Perfil, e-mails usados no teste e salvos existem apenas em memória e são apagados ao recarregar. O perfil criado personaliza a sessão; não adiciona automaticamente um cartão ao catálogo fictício.

A integração real exige combinar rotas e DTOs com o backend. O cálculo definitivo deve acontecer no Spring Boot, com validação e autorização no servidor. O contrato proposto e os casos de teste estão em [docs/10-profile-and-matching.md](../docs/10-profile-and-matching.md).

A revisão visual em navegador e a avaliação com usuários continuam necessárias. Os testes de DOM verificam interação e conteúdo; não medem layout, contraste, leitor de tela ou tempo real de preenchimento. O roteiro manual consta em [docs/09-frontend-prototype.md](../docs/09-frontend-prototype.md).
