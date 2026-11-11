# Conversas · prévia do DaMatch

Na pasta frontend deste pacote, execute `node previa.mjs` com Node 24. O pacote inclui o build DEMO. Abra http://localhost:4200. Para desenvolver com recompilação, use `npm ci` e `npm start`.

1. Na descoberta, filtre por Marina. No card de Marina Albuquerque, escolha **Conversar**.
2. Escreva como Semente Labs. Em **Testar como**, selecione Marina para ler e responder à startup fictícia. Retorne ao primeiro perfil e atualize a página: o mesmo histórico continua disponível neste navegador.
3. Abra outro contato: cada par de participantes tem sua própria conversa. A lista mostra a última mensagem e ordena as conversas pela atividade. Não há respostas automáticas, entrega pela internet nem confirmação de leitura.
4. No rodapé, **Testar animações do Lumen** abre uma prévia com sete poses: Receber, Perguntar, Apresentar, Confirmar, Acenar, Pensar e Comemorar. Os movimentos respeitam a preferência do dispositivo e o botão de pausa do site.

## Para integrar a API depois

O gateway demonstrativo em src/app/core/conversations.gateway.ts concentra a lista permitida, o histórico por par e o envio. A lista de pares é uma fixture explícita; compatibilidade alta, salvar um perfil ou ser da equipe de uma startup não autoriza mensagens. A troca de persona é exclusiva da prévia: não representa a conta autenticada. Os dados ficam no localStorage desta origem para testes com nomes e mensagens fictícios. Para reiniciar, remova apenas as chaves damatch:conversas:demo:v1 e damatch:conversas:persona:v1.

No build API, o menu mostra o estado indisponível. Não lê conversas locais nem oferece envio em cards de usuários reais. Nenhuma rota de mensagens do servidor foi presumida.

Proposta para a equipe: o servidor identifica o remetente pela sessão e valida a participação e a conexão aceita a cada leitura e envio; fornece uma conversa única por conexão, lista paginada de conversas e mensagens e grava a data e o identificador oficiais no envio. A UI poderá usar o ID retornado ao abrir o card. Adicionar estados de carregamento/erro e tentativa novamente no adaptador HTTP; entrega em tempo real pode vir depois. Revogar a conexão precisa bloquear acesso segundo a política acordada. O assistente “Pergunte ao Lumen” permanece separado.
