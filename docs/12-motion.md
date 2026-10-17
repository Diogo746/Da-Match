# Movimento no DaMatch

> Referência histórica das versões anteriores. O comportamento atual está em [18-frontend-v0.5.0.md](18-frontend-v0.5.0.md) e a identidade visual em [19-visual-identity.md](19-visual-identity.md).

As animações acompanham o percurso do usuário sem atrasar ações. Não existem telas de espera artificiais, mudanças automáticas de respostas, contagem animada de porcentagens ou efeitos de competição.

## Comportamentos

| Elemento | Movimento | Duração |
| --- | --- | --- |
| Lanterna do Lumen | Núcleo e halo aumentam e reduzem o brilho suavemente; intensidade maior no escuro | Ciclo contínuo de 6,8 s |
| Fala do Lumen | Aparição suave da mensagem ao mudar de etapa; sem efeito de digitação | 180 ms |
| Nova página | Aparição com deslocamento vertical de 5 px; o menu permanece estável | 240 ms |
| Escolhas da etapa | Aparição com deslocamento de 4 px ao inserir a nova pergunta | 200 ms |
| Conclusão do perfil | Aparição suave da confirmação e do cartão | 200 ms |
| Botões e opções | Transição de cores, bordas e estado pressionado | 160 ms |
| Cartão de perfil | Elevação de 2 px e sombra discreta ao passar o mouse em dispositivos com ponteiro preciso | 180 ms |
| Detalhes do perfil | Aparição e deslocamento vertical de 7 px | 200 ms |
| Fundo dos detalhes | Aparição suave do escurecimento | 180 ms |
| Progresso das etapas | Transição da largura preenchida em navegadores que oferecem esse suporte ao controle nativo | 350 ms |

A luz possui duas camadas CSS alinhadas ao abdômen: um núcleo sobre a lanterna e um halo externo atrás da pintura. Somente a opacidade varia; as cores escuras e o restante do personagem ficam fixos. O modo escuro aumenta a intensidade e a difusão da luz. O PNG aprovado permanece intacto. Caso se troque a ilustração, é necessário conferir o alinhamento das duas camadas.

## Controle de movimento

- O botão **Pausar animações**, no rodapé, desativa animações e transições de toda a interface, incluindo a pulsação da lanterna e o fundo do diálogo. O brilho estático permanece visível.
- O botão muda para **Retomar animações** e expõe seu estado por `aria-pressed`.
- A escolha permanece ao navegar entre páginas durante a sessão. Recarregar a página restaura o padrão.
- A preferência `prefers-reduced-motion: reduce` do dispositivo sempre tem prioridade. O botão não força a reprodução quando o sistema solicita redução.
- O Lumen é decorativo. As instruções, os resultados, o progresso e as confirmações são apresentados em texto e controles nativos; nenhum efeito é necessário para compreender o fluxo.

## Implementação

`frontend/src/app/shared/motion.css` reúne durações e transições. `lumen.component.ts` apresenta a imagem; `lumen.component.css` define as duas camadas da luz lenta. `lumen-guide.component.ts` contém os balões de fala. O estado manual fica no componente raiz e aplica a classe `motion-paused`, preservada nas trocas de rota. Não foram adicionadas bibliotecas de animação, temporizadores JavaScript ou novas dependências.

O foco continua visível. A abertura do perfil e as validações mantêm o comportamento acessível existente. A animação não bloqueia cliques nem adia a atualização das respostas.

## Conferência

O teste renderizado verifica que o botão pausa, preserva a escolha durante a navegação e permite retomar. Testes de DOM não avaliam a aparência do halo, a suavidade percebida nem o desempenho em dispositivos reais. A revisão visual em navegador não foi executada nesta entrega.

Roteiro manual:

1. Abra a home e observe um ciclo completo da luz por cerca de sete segundos. Alterne o tema no topo e compare a intensidade do halo no escuro.
2. Entre no cadastro e avance pelas quatro etapas. As falas devem acompanhar as perguntas e as respostas devem permanecer ao voltar.
3. Confira os cartões com mouse e teclado e abra um perfil. Feche com Escape.
4. Clique em **Pausar animações**, navegue para outra página e confira que o movimento continua desativado.
5. Clique em **Retomar animações**.
6. Ative **reduzir movimento** no dispositivo e repita o fluxo; o Lumen deve permanecer estático e as transições devem desaparecer.
7. Confira o comportamento em celular, incluindo o botão no rodapé e a legibilidade dos textos.
