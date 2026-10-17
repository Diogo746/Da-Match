# DaMatch — perfil e compatibilidade v0.3

## Escopo

Startups exclusivamente em ideação e mentores. O cadastro básico da conta é seguido por quatro etapas curtas de perfil, compartilhando os mesmos códigos de setor, assunto, modalidade e disponibilidade. O frontend demonstra o comportamento em memória; o contrato abaixo é uma proposta para alinhamento, não uma API existente.

## Modelo das respostas

As definições TypeScript ficam em `frontend/src/app/core/profile.models.ts`.

| Campo | Startup | Mentor |
| --- | --- | --- |
| `kind` | `STARTUP` | `MENTOR` |
| `projectName` | Nome opcional da ideia, até 60 caracteres | Sem uso no cadastro de mentor |
| `sectors` | Um setor ou `DISCOVERING` | Até dois setores ou `GENERAL`, exclusivo |
| `topics` | Até dois assuntos, ordenados por prioridade | Até três especialidades |
| `format` | `ONLINE`, `PRESENCIAL` ou `AMBOS` | Mesmos códigos |
| `cityId` | Obrigatório para `PRESENCIAL`; opcional para `AMBOS` | Mesma regra |
| `days` | Um ou mais dias: `MON`, `TUE`, `WED`, `THU`, `FRI`, `SAT`, `SUN` | Mesmos códigos |
| `periods` | `MORNING`, `AFTERNOON`, `EVENING` | Mesmos códigos |
| `accepting` | Sem efeito no cálculo | Indica se recebe novas startups |

Setores: `TECH`, `EDUCATION`, `HEALTH`, `CREATIVE`, `SOCIAL`, `COMMERCE`.

Assuntos: `VALIDATION`, `CUSTOMERS`, `BUSINESS`, `PROTOTYPE`, `PRICING`, `PITCH`.

A lista de cidades do protótipo é reduzida. Os identificadores precisam ser alinhados ao cadastro territorial do backend antes da integração. O formulário não solicita localização quando o participante escolhe exclusivamente online.

Os dias e períodos indicam disponibilidade em todas as combinações marcadas, no horário de Recife. A interseção significa uma faixa possível; não verifica disponibilidade de calendário ou reserva horários.

Exemplo de respostas de startup, sem credenciais:

```json
{
  "kind": "STARTUP",
  "projectName": "Minha Ideia",
  "sectors": ["TECH"],
  "topics": ["VALIDATION", "PRICING"],
  "format": "ONLINE",
  "cityId": "",
  "days": ["THU"],
  "periods": ["EVENING"],
  "accepting": true
}
```

A conta continua separada, com nome, e-mail e senha na abstração `RegistrationGateway`. O exemplo de mentor com `usuario` e `biografia` discutido pela equipe precisa ser confirmado com os DTOs e endpoints atuais antes de criar uma implementação HTTP. A versão v0.3 não presume nem chama essas rotas.

## Regra inicial: damatch-rules-v1

A função pura `calculateMatch` recebe dois perfis, identifica startup e mentor e produz o mesmo resultado independentemente da ordem dos argumentos. O código não usa IA, aleatoriedade ou texto livre para atribuir uma nota.

### Possibilidade de mentoria

Antes da pontuação:

1. Os tipos precisam ser diferentes e as quatro etapas precisam estar preenchidas.
2. O mentor precisa estar recebendo novas startups.
3. Deve existir uma modalidade aceita pelos dois. Se o único caminho comum for presencial, a cidade deve coincidir.
4. Os participantes precisam compartilhar pelo menos um dia e um período.

Uma preferência não é relaxada automaticamente quando a lista fica vazia. A interface oferece edição do perfil ou exploração do catálogo.

### Pontuação

| Critério | Regra |
| --- | --- |
| Prioridade principal | 50 pontos quando há segunda prioridade; 70 quando é a única |
| Prioridade secundária | 20 pontos se escolhida e atendida |
| Setor | 30 para experiência direta, 15 para atuação geral, zero para outro setor |

Escolher apenas uma necessidade não reduz o total possível. Mais disponibilidade também não reduz a nota. Uma indicação precisa atender a pelo menos uma necessidade, ainda que a especialidade atendida seja a secundária.

Se o setor da startup for `DISCOVERING`, a resposta tem `partial: true` e `score: null`. Os motivos aparecem, mas não há porcentagem. Perfis com porcentagem completa ficam antes dos parciais; dentro de cada grupo, a ordenação usa pontuação e depois nome/identificador para desempatar.

A saída contém `version`, `eligible`, `relevant`, `score`, `partial`, `criteria`, `reasons`, `limitations` e `blockers`. Coincidência de setor sem ajuda relevante não basta para entrar em Para você. Os mesmos perfis continuam acessíveis no catálogo.

Os pesos são uma hipótese de produto. A equipe deve confrontar as indicações com a avaliação de participantes, registrar os motivos de discordância e revisar as regras com nova versão. O índice mede aderência declarada, não qualidade pessoal, experiência verificada ou probabilidade de sucesso.

## Integração futura no Spring Boot

Proposta de responsabilidades:

- Um endpoint autenticado recebe e valida o perfil do usuário da sessão.
- O backend salva os códigos em entidades/relacionamentos definidos pela equipe e mantém a versão do questionário.
- Um serviço de recomendação aplica a regra e devolve perfis, critérios, motivos e limitações.
- O Angular apresenta os resultados recebidos; a pontuação enviada pelo cliente não deve ser considerada confiável.
- Alterações de perfil e de disponibilidade invalidam resultados antigos ou provocam recálculo.
- Autorização, proteção das credenciais, transações e persistência ficam no backend.

Nomes de rotas, DTOs, paginação, tratamento de erros e política de exibição de dados precisam ser acordados com quem desenvolve a API. Este pacote não modifica Java, banco ou regras de segurança.

## Exemplos verificáveis

- Startup de tecnologia, prioridades validação e preços, online, quinta/noite: Marina e Rafael recebem 80 pontos.
- Mentor de tecnologia que orienta validação e protótipo, online, quinta/noite: Semente Labs recebe 100 pontos.
- Mentor em pausa: não entra nas indicações.
- Um perfil apenas online e outro apenas presencial: não entra nas indicações.
- Presencial na mesma cidade, com dia e período em comum: pode ser pontuado.
- Setor em descoberta: indicação parcial, sem porcentagem.
- Sem necessidade atendida: não entra nas indicações, mesmo com setor igual.

Esses cenários são cobertos por testes de domínio, testes de componentes e fluxo renderizado de cadastro até a home em jsdom. Testes reais de navegador, integração HTTP e validação com usuários são etapas adicionais.
