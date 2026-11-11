// Frases de treino rotuladas. Cada resposta descreve somente recursos disponíveis no modo atual.
export interface HelpTopic {
  key: string; prompt: string; examples: string[]; answer: string; demo?: string;
}
export const helpTopics: HelpTopic[] = [
  { key: "start", prompt: "Como faço meu cadastro?", examples: ["abrir minha conta", "quero criar uma conta", "cadastro de startup", "me cadastrar como mentor", "como me registro", "por onde começo a participar", "cadastro mentora"],
    answer: "Abra Cadastrar startup ou mentor e escolha seu papel. Preencha os dados solicitados e confirme. Depois, entre e abra Minha conta para completar o perfil.",
    demo: "Abra Criar perfil, escolha Startup ou Mentor e preencha os campos com dados fictícios. Você segue para as perguntas do perfil. Este modo de demonstração não cria uma conta real." },
  { key: "discover", prompt: "Onde encontro os perfis?", examples: ["encontrar mentores", "ver startups", "buscar por setor", "não aparecem os cards", "catálogo vazio", "como pesquisar um perfil", "descobrir pessoas disponíveis", "encontrar um mentor para minha ideia"],
    answer: "Entre e abra Descobrir. Startups veem mentores e mentores veem startups. Se a lista estiver vazia, limpe os filtros. Só aparecem perfis publicados e completos; mentores precisam estar recebendo startups.",
    demo: "Em Descobrir você pode explorar os perfis de exemplo. Depois de montar seu perfil, a home mostra indicações para o seu papel: mentores para startups e startups para mentores." },
  { key: "match", prompt: "Como funciona o match?", examples: ["compatibilidade entre perfis", "o que é super damatch", "por que esse mentor combina comigo", "o que significa o selo", "porcentagem de afinidade", "como são calculadas as indicações", "recomendações de mentoria"],
    answer: "A compatibilidade considera o que a startup precisa e o que o mentor oferece, além de setor, momento da ideia e condições para se encontrar. O questionário dá contexto à comparação. O selo indica uma combinação muito forte, não uma mentoria confirmada." },
  { key: "edit", prompt: "Posso mudar minhas respostas?", examples: ["editar meu questionário", "alterar dados do perfil", "refazer as perguntas", "atualizar meus horários", "mudar os setores", "revisar perfil", "preencher questionario de mentor"],
    answer: "Em Minha conta, abra seu perfil de mentor ou sua startup. Acesse o questionário desse perfil para revisar e salvar as respostas. Em uma startup, a permissão de edição depende do seu papel na equipe.",
    demo: "Abra Meu perfil e escolha a opção de editar as respostas. Revise a seção que mudou e salve. Você não precisa repetir o cadastro inteiro." },
  { key: "invite", prompt: "Onde vejo meus convites?", examples: ["convites recebidos", "aceitar convite para equipe", "entrar na equipe da startup", "quem me convidou", "participar do time", "convite pendente"],
    answer: "Com a conta de startup, abra Minha conta → Convites recebidos para consultar os convites da equipe. Um convite para a equipe é diferente de uma indicação de mentor.",
    demo: "A caixa de convites de equipe fica no modo conectado, em Minha conta → Convites recebidos, para contas de startup. A demonstração local não recebe convites." },
  { key: "appearance", prompt: "Como pauso as animações?", examples: ["parar movimento do mascote", "desativar animações", "lumen fica mexendo", "ativar modo escuro", "mudar tema claro", "configurar aparência"],
    answer: "Use Pausar animações no rodapé para deixar o Lumen parado. Para trocar entre claro e escuro, use o botão de tema no topo da tela." },
  { key: "role", prompt: "Para quem é o DaMatch?", examples: ["investidor pode participar", "quem pode usar", "quais fases de startup", "para que serve a plataforma", "projeto em ideação", "público do damatch"],
    answer: "O DaMatch aproxima startups na fase de ideação e mentores. A startup apresenta o problema que quer resolver e o tipo de ajuda que busca; o mentor indica em quais temas pode orientar." },
  { key: "hello", prompt: "Oi, Lumen!", examples: ["oi", "olá", "bom dia", "boa noite", "obrigado pela ajuda", "e aí lumen"],
    answer: "Olá! Posso te ajudar a montar seu perfil, entender o match ou encontrar seu caminho no DaMatch. O que você quer saber?" },
  { key: "chat", prompt: "Posso conversar com um mentor aqui?", examples: ["mandar mensagem para um mentor", "falar direto com a startup", "chat com outra pessoa", "enviar mensagem privada", "conversar com minha conexão"],
    answer: "Esta conversa é só com o Lumen para tirar dúvidas sobre a aplicação. As mensagens daqui não chegam aos mentores nem às startups." },
];
