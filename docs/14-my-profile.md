# Meu perfil — consulta e edição v0.4.1

## Comportamento

As quatro etapas fazem parte da criação inicial do perfil. Depois de concluídas, **Meu perfil** abre um resumo: nome do participante, nome da ideia quando aplicável, setores, necessidades ou especialidades, modalidade, cidade quando aplicável e disponibilidade. Mentores também veem se estão recebendo novas startups.

| Ação | Resultado |
| --- | --- |
| Abrir Meu perfil | Consultar as informações e a prévia do cartão |
| Editar perfil | Abrir as respostas preenchidas, começando por Setor |
| Alterar em uma seção | Abrir diretamente a seção escolhida |
| Setor, Objetivos, Modalidade ou Agenda na edição | Trocar de seção sem percorrer as demais |
| Salvar alterações | Validar o perfil completo, aplicar as mudanças, voltar ao resumo e atualizar as indicações |
| Cancelar ou navegar para outra página | Descartar somente o rascunho da edição |
| Limpar perfil de teste | Remover o perfil temporário e mostrar o convite para um novo cadastro |

Uma edição incompleta não substitui as respostas salvas. Se faltar um campo obrigatório, o editor abre a seção correspondente e apresenta a mensagem de validação. O foco vai para a pergunta ao abrir a edição, para o erro quando necessário e para o título do perfil ao salvar ou cancelar.

O cadastro inicial mantém a sequência de quatro etapas. A edição usa as mesmas opções, com navegação livre entre seções e botão **Salvar alterações** em qualquer uma delas. Não é necessário refazer o cadastro para trocar uma preferência.

## Roteiro de teste

1. Crie uma startup de Tecnologia, com as necessidades Validar a ideia e Preços e custos, modalidade Online, quinta-feira à noite.
2. Na home, confira Marina e Rafael com 80%. Abra Meu perfil: deve aparecer o resumo, sem questionário.
3. Navegue para Descobrir e volte a Meu perfil. O resumo deve continuar disponível.
4. Em O que sua ideia precisa, use Alterar. A seção de necessidades deve abrir preenchida.
5. Desmarque Preços e custos e salve. A página volta ao resumo e informa o salvamento.
6. Em Ver indicações, Marina e Rafael passam a 100%, conforme a regra de necessidade única.
7. Edite o setor, troque a opção e cancele. O setor salvo deve continuar Tecnologia. Repita saindo da edição pelo menu, sem salvar: o resultado deve ser o mesmo.
8. Edite a disponibilidade, desmarque todos os dias e tente salvar. A aplicação deve impedir a alteração e mostrar o que falta.
9. Repita como mentor: confira especialidades e disponibilidade no resumo; edite Agenda, desmarque o recebimento de startups e salve. O resumo mostra a pausa e a home interrompe as indicações.
10. Confira esses estados nos dois temas e em uma janela estreita.

Os testes automatizados compilam os templates Angular e exercitam consulta, preenchimento da edição, acesso direto por seção, salvamento, cancelamento, saída sem salvar, validação e recálculo. A suíte completa passou com 92 testes. O roteiro visual acima ainda deve ser executado em navegador; os testes em jsdom não avaliam o layout.

## Limite da demonstração

O perfil permanece em memória, em `ProfileSessionStore`. Navegar entre as abas preserva as respostas; **recarregar a página reinicia o teste**, como nas entregas anteriores. Somente a preferência de tema é lembrada no navegador.

Para preservar o perfil entre acessos na versão integrada, o backend precisará armazená-lo e devolvê-lo para a conta autenticada. A tela de consulta e o editor usam o mesmo modelo de respostas, sem alterar o contrato proposto de compatibilidade. Esta revisão não adiciona chamadas HTTP, login ou persistência de credenciais.
