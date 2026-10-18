# 18 — Questionário, compatibilidade e Lumen — v0.5.0

**Data:** 17/10/2026. **Base:** frontend v0.4.3 e main fornecida em `Da-Match-main-att.zip`.

## Escopo

O MVP do frontend contempla startups em ideação e mentores. Esta revisão preserva o cadastro conectado de mentor e refina a demonstração de perfil e descoberta. Os arquivos do backend permanecem iguais à base fornecida.

## Cinco etapas

| Etapa | Startup | Mentor |
| --- | --- | --- |
| Momento | Um ponto de partida dentro da ideação | Momentos da ideação em que pode orientar |
| Setor | Um setor ou setor em descoberta | Até três setores ou atuação geral exclusiva |
| Objetivos | Uma prioridade e uma necessidade secundária opcional | Até três especialidades, com experiência prática ou conhecimento para orientar |
| Encontro | Online, presencial ou flexível | Mesmas opções |
| Agenda | Frequência e pares de dia/período | Mesmas opções e recebimento de novas startups |

As quatro opções de momento são descoberta do problema, descoberta do público, primeiro desenho da solução e primeiras validações. Não representam outros estágios empresariais.

A pergunta principal aparece no balão. As respostas são cartões com rótulos claros, sem pontuação competitiva ou interpretação de personalidade. A finalidade das respostas é informada na interface.

O nome da ideia é opcional. A biografia obrigatória do mentor e os links sociais opcionais ficam no cadastro básico. Há oito categorias de setor, seis assuntos e quatro opções de frequência. A lista de cidades continua reduzida e explicitada na interface.

## Revisão e edição

O usuário confere um resumo das cinco etapas antes de concluir. Ajustar uma resposta desse resumo retorna à revisão sem exigir percorrer as etapas seguintes novamente.

Meu perfil abre as informações concluídas. Editar perfil ou Alterar abre uma cópia preenchida na seção correspondente. Salvar valida o perfil completo e atualiza as indicações. Cancelar ou sair da edição preserva o perfil anterior.

Respostas e salvos permanecem em memória. A versão do questionário `damatch-profile-v2` é registrada no perfil temporário. Não há migração silenciosa de respostas antigas nem armazenamento de credenciais na sessão de perfil.

## Regra damatch-rules-v2

1. Exigir um par startup/mentor com dados mínimos válidos.
2. Verificar mentor recebendo startups, modalidade/cidade, combinação exata de dia/período e frequência.
3. Exigir ao menos uma necessidade atendida para recomendar.
4. Calcular os critérios e explicar o apoio e as limitações.

| Critério | Máximo | Regra |
| --- | --- | --- |
| Principal | 50 | Vale 70 quando é a única necessidade |
| Secundária | 20 | Considerada quando escolhida |
| Setor | 20 | Direto: 20; atuação geral: 10; diferente: 0 |
| Momento da ideia | 10 | Mentor declara atuação no momento escolhido pela startup |

Exemplo: necessidade principal atendida, secundária não atendida, setor direto e momento atendido: **50 + 0 + 20 + 10 = 80%**.

Se somente a secundária for atendida, com setor e momento em comum, o resultado é **50%** e o card identifica apoio a uma necessidade secundária. Sem nenhuma necessidade atendida, o par não é recomendado e não recebe porcentagem.

O setor em descoberta permite indicação parcial, sem normalizar a nota para 100. A experiência prática declarada gera uma explicação e desempata notas iguais; não acrescenta pontos. A ordenação segue nota, quantidade de necessidades com experiência prática e, por fim, nome/identificador.

A mesma combinação de respostas produz o mesmo resultado pelos dois lados. O motor não modifica os dados recebidos e não usa IA. Os pesos são hipóteses do MVP e não representam chance estatística de sucesso.

## Agenda

Disponibilidades são armazenadas como objetos `{ day, period }`. Segunda à noite e quinta à tarde não criam disponibilidade na segunda à tarde nem na quinta à noite.

A frequência pode ser semanal, quinzenal, mensal ou flexível. Duas preferências fixas diferentes impedem a recomendação; uma escolha flexível permite combinar. Presencial depende de cidade em comum; quando ambos aceitam online, cidades diferentes não impedem a conversa.

As faixas usam o horário de Recife. Uma janela em comum não confirma um compromisso; os participantes precisam combinar um horário exato.

## Lumen e identidade visual

A home usa a pose revisada de boas-vindas. As perguntas alternam entre curioso, pensativo e apresentando. Uma confirmação de aproximadamente 650 ms reage às escolhas, e a pose de conclusão acompanha o resumo e o perfil pronto.

O CSS mantém o núcleo luminoso, varia o halo em oito segundos e aplica flutuação de três pixels. O tema escuro reforça o brilho. A pausa e a preferência do dispositivo desativam ciclos, transições e confirmações breves. As imagens são PNGs; asas e antenas mudam entre as poses, não possuem articulação independente.

Mentores usam azul, startups usam verde, com duas variações estáveis por identificador. Os fundos de areia foram retirados dos cards. Rótulos textuais acompanham as cores. O [documento 19](19-visual-identity.md) registra a paleta.

## Integração com a main recebida

O modo API continua limitado ao cadastro de mentor: `GET /csrf` seguido de `POST /api/v1/mentores`. O JSON mantém `usuario: { nome, email, senha }`, `biografia` e links opcionais. Perguntas, porcentagens e disponibilidades não são enviadas a essa rota.

A confirmação exige 201 e os campos esperados. Falhas não viram sucesso demonstrativo, e POST não é repetido automaticamente. O [documento 17](17-mentor-api-integration.md) continua descrevendo esse contrato e as pendências de biografia/e-mail existente.

Para integrar o perfil completo, o backend precisa oferecer autenticação, cadastro de startup, consulta/edição do próprio perfil, respostas e agenda, catálogo e recomendações. O contrato dessas APIs ainda precisa ser definido pela equipe. A regra final deve ser alinhada com o SRS e a decisão do [documento 16](16-decisao-regra-matching.md).

## Validação local

| Verificação | Resultado |
| --- | --- |
| Lint | Aprovado |
| Tipos dos testes | Aprovados |
| Angular + Vitest | 172 testes em 15 arquivos |
| Linhas | 97,61% |
| Declarações | 96,20% |
| Ramificações | 95,36% |
| Funções | 92,63% |
| Builds DEMO/API | Concluídos |
| Dependências | Preservadas, com alteração apenas da versão do frontend |

Os testes cobrem agenda cruzada, frequência, prioridades, atuação geral, momento, experiência prática, simetria, indicação parcial, revisão, edição/cancelamento, temas, pausa, salvos, cadastro e respostas/erros HTTP.

### Correção dos apontamentos do SonarQube

A revisão corrige os oito apontamentos da análise do PR #8: Unicode na escolha de cores, condições do resumo do questionário, saída semântica do contador de agenda, seletor CSS duplicado, iteração das necessidades, inserção de justificativas e proteção na conclusão do cadastro. Os testes também verificam os rótulos da revisão, o contador singular/plural, identificadores Unicode e a rejeição de um perfil com papel diferente do cadastro confirmado. A tabela acima registra a validação local após essas correções; a aprovação do Quality Gate depende de uma nova execução do pipeline.

O ambiente não conseguiu instalar o navegador de teste; a revisão visual real não foi concluída. A homologação com Java/Supabase, leitor de tela e participantes não foi executada. Esta entrega também não executou uma análise remota nova do SonarQube.

## Roteiro de homologação

- Executar os dois roteiros do README do frontend.
- Conferir home, cadastro, questionário, revisão, Meu perfil, salvos e detalhes nos temas claro e escuro.
- Conferir larguras de celular e notebook, zoom de 200%, textos longos e foco visível.
- Usar teclado nas escolhas e abrir/fechar o dialog; conferir retorno do foco.
- Conferir cada par dia/período, a frequência e a indicação parcial.
- Pausar movimentos e testar a preferência de movimento reduzido do dispositivo.
- Validar cadastro de mentor com o backend e o banco executando.
- Medir tempo de preenchimento e utilidade das recomendações com participantes.

