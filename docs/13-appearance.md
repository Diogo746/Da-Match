# Aparência — tema e Lumen

A v0.4 acrescenta tema claro/escuro, brilho mais visível e balões de fala. O questionário, as regras de compatibilidade e o contrato básico do cadastro permanecem iguais.

## Tema

O seletor **Modo escuro / Modo claro** aparece no topo também em celular. O texto indica a ação disponível, e `aria-pressed` informa quando o modo escuro está ativo.

Sem escolha salva, a primeira abertura acompanha `prefers-color-scheme`. Quando o usuário alterna, somente `damatch.theme`, com valor `light` ou `dark`, é guardado em `localStorage`. A preferência é restaurada ao recarregar. Se o armazenamento falhar, a interface continua alternando durante a sessão. Mudanças posteriores na preferência do sistema são aplicadas na próxima abertura sem escolha salva.

`ThemeStore` aplica `data-theme` ao documento e define `color-scheme`, incluindo os controles nativos. `shared/theme.css` centraliza cores semânticas para superfícies, campos, estados selecionados, alertas, cartões e diálogos. Os dois temas mantêm a identidade de azul-marinho, verde-petróleo e menta.

Essa preferência de interface não contém dados pessoais e não altera o JSON de cadastro ou o futuro contrato do backend. Conta, perfil e salvos continuam apenas em memória.

## Luz e falas

O PNG em guache aprovado foi preservado. `lumen.component.css` adiciona:

- Um núcleo sobre o abdômen para realçar a lanterna.
- Um halo maior por trás da pintura, visível ao redor da lanterna.
- Pulsação em 6,8 segundos, com intensidade maior no modo escuro.

Pausar animações ou ativar redução de movimento interrompe a pulsação; uma luminosidade fixa permanece. Nenhum efeito depende de temporizadores JavaScript ou serviço externo.

`LumenGuideComponent` combina o mascote e um balão de fala com ponta orientada para ele. As mensagens da home, do cadastro e das quatro etapas são textos locais definidos pelo produto. Não há chat, IA conversacional, áudio ou digitação automática. A fala muda ao avançar ou voltar, sem perder respostas e sem criar notificações intrusivas.

## Verificação

A suíte verifica preferência inicial, escolha salva, persistência, retorno ao tema claro e funcionamento com armazenamento bloqueado. O teste renderizado alterna o tema, navega e confere as falas. O cadastro completo de startup também é exercitado no modo escuro.

Os pares principais de texto, botão e balão foram conferidos por cálculo de contraste da paleta. Isso não equivale a uma auditoria completa de acessibilidade. Testes de DOM e build não verificam aparência, posicionamento do halo ou suavidade percebida. A revisão visual em navegador não foi executada nesta entrega.

Roteiro manual:

1. Alterne o tema no topo na home, no cadastro e nos detalhes de um perfil.
2. Confira campos, opções, botões, alertas de validação, cartões e barra de progresso nos dois temas.
3. Observe um ciclo do brilho em cada tema. O halo deve ser mais intenso no escuro e ficar no abdômen.
4. Avance e volte nas perguntas para conferir as falas e a preservação das respostas.
5. Escolha o tema, recarregue e confirme que só a aparência é restaurada.
6. Confira o botão de tema e os balões em uma janela estreita.
7. Pause as animações e confira a luz fixa. Repita com a preferência de redução de movimento do sistema.
