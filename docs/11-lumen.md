# Lumen — mascote do DaMatch

> Referência histórica das versões anteriores. O comportamento atual está em [18-frontend-v0.5.0.md](18-frontend-v0.5.0.md) e a identidade visual em [19-visual-identity.md](19-visual-identity.md).

Lumen é um vaga-lume que representa uma ideia ganhando luz com o apoio de quem orienta. A versão aprovada é a **opção 3, em guache**, com azul e verde-petróleo mais escuros, detalhes em menta e luz amarelo-esverdeada. O personagem tem anatomia simplificada de inseto e olho lateral, sem rosto humano, mãos ou expressão de pessoa.

A pintura é exclusiva do mascote. A interface mantém cartões, tipografia e controles limpos. Sua presença é pequena e complementar às instruções, especialmente no cadastro.

## Arquivo e aplicação

- Asset do projeto: `frontend/public/assets/lumen.png`.
- Formato: PNG com transparência real, **1374 × 1145 pixels**.
- Componente e estilo: `frontend/src/app/shared/lumen.component.ts` e `lumen.component.css`.
- Balões de fala: `frontend/src/app/shared/lumen-guide.component.ts`, com texto contextual e sem interface de chat.
- Uso: presença secundária na home, apresentação do cadastro, orientação das quatro etapas e conclusão do perfil.
- A imagem tem `alt` vazio e é decorativa; as instruções relevantes permanecem em texto.
- O PNG aprovado foi copiado sem alterar seus pixels. O núcleo e o halo da lanterna são camadas CSS separadas.
- A luz combina núcleo e halo externo e aumenta e diminui lentamente em um ciclo de **6,8 segundos**, com intensidade maior no tema escuro. A preferência de redução de movimento e o botão para pausar desativam o ciclo, mantendo uma luz fixa.

## Registro de criação

Arte final criada com a ferramenta integrada **image_gen**, em modo de edição de estilo a partir da imagem de vaga-lume selecionada pelo usuário, com fundo transparente. O mascote 3D anterior foi substituído. A geração do asset não cria dependência de IA na aplicação: o cálculo de compatibilidade continua determinístico.

Prompt final utilizado para a opção selecionada:

```text
Use case: style-transfer.
Edit target: the attached image is the EXACT selected design of Lumen. Translate THIS SAME cute firefly into a distinct illustration style, preserving its identity, proportions and three-quarter pose facing upper left. Keep its rounded compact beetle body, small natural side head and ONE small dark side eye, two curved antennae, curved short insect legs, paired folded wing covers, mint collar and pale yellow-green luminous rear. Navy, petrol teal and muted mint are the recognizable colors.
It must remain an endearing little firefly, simple enough for an adult startup mentoring website, not a humanoid and not an abstract logo. Personality comes from its rounded silhouette, antennae and natural insect pose. No mouth, nose, cheeks, eyebrows, human expression, hands, clothes or upright human stance. No huge baby head, anatomical realism, intricate joints or wing veins. Preserve the same overall shape and composition so the alternative styles can be compared fairly.
One complete character centered and occupying about 70% of a square canvas with even margins, genuine transparent background. No text, numbers, frames, badge, scenery, watermark or extra objects. This is a flat TWO-DIMENSIONAL artwork, never 3D or glossy plastic.

STYLE 3: restrained hand-painted gouache illustration. Soft matte opaque brush shapes with a little fine paper-like grain INSIDE the character only, slightly organic edges, deep teal body, muted mint collar and gentle lemon-mint lantern. A few dark navy painted accents instead of an all-around thick black outline. Warm, tactile, cute and sophisticated editorial illustration, very simple broad shapes, absolutely no photorealism or 3D lighting. Preserve exactly the same little beetle, head size and curved insect posture.
```

As regras e o roteiro de avaliação do movimento estão em [12-motion.md](12-motion.md).

