/* ============================================================
   FACULDADE BHARIÁTRICA — Conteúdo das trilhas
   Gerado a partir da planilha "Cronograma" (aba Secretária).
   Para adicionar/editar uma aula, mexa apenas neste arquivo.
   ------------------------------------------------------------
   Tipos de aula (type):
     "youtube"  -> embuti o vídeo (precisa de videoId)
     "playlist" -> embuti playlist do YouTube (videoId + listId)
     "external" -> curso/site externo (abre em nova aba)
     "pdf"      -> documento PDF/leitura (abre em nova aba)
   ============================================================ */

const COURSE = {
  brand: {
    name: "Faculdade Bhariátrica",
    subtitle: "Trilha de capacitação da equipe de secretaria",
  },

  // Senha padrão de todos os usuários no 1º acesso
  defaultPassword: "bar@123321",

  // Usuários (secretárias + admin). username é sempre minúsculo/sem acento.
  users: [
    { username: "lucas",   name: "Lucas",   role: "admin", password: "admin@bhar25" },
    { username: "joelma",  name: "Joelma",  role: "secretaria" },
    { username: "bia",     name: "Bia",     role: "secretaria" },
    { username: "tairine", name: "Tairine", role: "secretaria" },
    { username: "taina",   name: "Tainá",   role: "secretaria" },
    { username: "mikaeli", name: "Mikaeli", role: "secretaria" },
    { username: "lucila",  name: "Lucila",  role: "secretaria" },
  ],

  // Trilhas (módulos) e suas aulas.
  tracks: [
    {
      id: "sistema",
      title: "Sistema",
      icon: "🖥️",
      description: "Domínio das ferramentas do dia a dia: agenda, recepção e Amigo Flow.",
      lessons: [
        { id: "sis-1", title: "Trilha Agenda e recepção", type: "external", url: "https://amigoacademy.com.br/play/curso/6654131", platform: "Amigo Academy" },
        { id: "sis-2", title: "Trilha AmigoFlow", type: "external", url: "https://amigoacademy.com.br/play/curso/6654131", platform: "Amigo Academy" },
      ],
    },
    {
      id: "comercial",
      title: "Comercial",
      icon: "💼",
      description: "Vendas, social selling e técnicas de atendimento comercial.",
      lessons: [
        { id: "com-1", title: "Boas Vindas", type: "external", url: "https://amigoacademy.com.br/play/curso/6654131", platform: "Amigo Academy", obs: "Até o 7" },
        { id: "com-2", title: "EAD – SDR", type: "external", url: "https://fullsalessystem.curseduca.pro/m/lessons/ead-de-sdrsetters1774014708711", platform: "Full Sales System", obs: "Módulos 1 e 2" },
        { id: "com-3", title: "EAD – Closer", type: "external", url: "https://fullsalessystem.curseduca.pro/m/lessons/ead-closer1772537769478", platform: "Full Sales System", obs: "Módulos 1 e 2" },
        { id: "com-4", title: "Trilha de Social Selling", type: "external", url: "https://fullsalessystem.curseduca.pro/m/lessons/ead-social-selling1772537933825", platform: "Full Sales System", obs: "Ver os vídeos de 1 até 6" },
        { id: "com-5", title: "Claude (IA no atendimento)", type: "playlist", videoId: "h7BzuuFIHIY", listId: "PLp8AftP4p8Fv4lnKoA4hiMGjY6pACpgr-", obs: "Ver toda a trilha lateral" },
        { id: "com-6", title: "Técnica de SPIN Selling", type: "pdf", url: "https://www.rdstation.com/blog/vendas/spin-selling/", platform: "RD Station (artigo)" },
      ],
    },
    {
      id: "receptivo",
      title: "Receptivo",
      icon: "📞",
      description: "Recepção de clínica: importância da secretária e seus desafios.",
      lessons: [
        { id: "rec-1", title: "iClinic – Curso para recepcionista de clínica", type: "external", url: "https://cursos.iclinic.com.br/courses/take/curso-para-recepcionista-de-clinica/lessons/4595759-importancia-da-secretaria-e-seus-desafios", platform: "iClinic", obs: "~90 min" },
      ],
    },
    {
      id: "atendimento",
      title: "Atendimento",
      icon: "🤝",
      description: "Fluxograma de atendimento, impostos e comunicação com o paciente.",
      lessons: [
        { id: "ate-1", title: "Fluxograma – Parte 1", type: "youtube", videoId: "hc9VP174-2U" },
        { id: "ate-2", title: "Fluxograma – Parte 2", type: "youtube", videoId: "GnynbfUuvco" },
        { id: "ate-3", title: "Fluxograma – Parte 3", type: "youtube", videoId: "X3fKg3LNP5Q" },
        { id: "ate-4", title: "Impostos – Parte 1", type: "youtube", videoId: "MUAs7U7-6ug" },
        { id: "ate-5", title: "Impostos – Parte 2", type: "youtube", videoId: "85WrCtQS0vg" },
        { id: "ate-6", title: "Fluxograma (Miro)", type: "external", url: "https://miro.com/app/board/uXjVGkzgEOk=/", platform: "Miro", obs: "Leitura completa e detalhada. Cada 'barra' do fluxo corresponde a um conteúdo dentro do Amigo Flow — acesse o Amigo Flow, procure pelo nome de cada barra e leia individualmente. Entenda o contexto e a lógica da comunicação com o paciente em cada etapa." },
        { id: "ate-7", title: "Fluxograma – Vídeo complementar", type: "youtube", videoId: "MyyZJFQ-pss" },
      ],
    },
    {
      id: "video-paciente",
      title: "Vídeo para paciente",
      icon: "🎬",
      description: "Vídeos de orientação que enviamos aos pacientes.",
      lessons: [
        { id: "pac-1", title: "Pré 1ª consulta", type: "youtube", videoId: "R_3TGgk2MSA" },
        { id: "pac-2", title: "Pós primeira consulta", type: "youtube", videoId: "MK0yqBvx_Ag" },
        { id: "pac-3", title: "Noripurum", type: "youtube", videoId: "GbpzfbxyLTk" },
        { id: "pac-4", title: "Orientações pós vesícula", type: "youtube", videoId: "rQYdz5UyGfE" },
      ],
    },
    {
      id: "teoria-meuos",
      title: "Teoria MeuOs",
      icon: "🤖",
      locked: true,
      description: "IA, automação e n8n. (Liberado mais pra frente — ainda não precisa ver.)",
      lessons: [
        { id: "teo-1", title: "Você não vai ser demitido pela IA…", type: "pdf", url: "https://acrobat.adobe.com/id/urn:aaid:sc:VA6C2:5d7e5f5e-1ceb-4b39-ba95-577f43a1e27a", platform: "PDF" },
        { id: "teo-2", title: "IAG 01 – Apresentação Antonio Santos", type: "youtube", videoId: "SZt216S5Fn0" },
        { id: "teo-3", title: "IAG 02 – Contexto Atual IA", type: "youtube", videoId: "p5jMfqk987k" },
        { id: "teo-4", title: "IAG 04 – Apresentação Fernando Lucio", type: "youtube", videoId: "a5oHuJ4YR5Q" },
        { id: "teo-5", title: "IAG 05 – Aula Guia N8N", type: "youtube", videoId: "AOCSlebu9c0" },
        { id: "teo-6", title: "VPS e n8n", type: "pdf", url: "https://acrobat.adobe.com/id/urn:aaid:sc:VA6C2:535a4f3a-8b61-4b5f-9703-6788e19f3ffd", platform: "PDF" },
        { id: "teo-7", title: "Credencial Gmail no n8n", type: "pdf", url: "https://acrobat.adobe.com/id/urn:aaid:sc:VA6C2:1091882e-d6f7-4113-9b8b-4f65f244896b", platform: "PDF" },
        { id: "teo-8", title: "Metodologia CAM 1", type: "pdf", url: "https://acrobat.adobe.com/id/urn:aaid:sc:VA6C2:093472a1-e7f8-4e91-ba66-5b885373d209", platform: "PDF" },
        { id: "teo-9", title: "Metodologia CAM 2", type: "pdf", url: "https://acrobat.adobe.com/id/urn:aaid:sc:VA6C2:6d2661df-1d66-4375-b8ad-e8fbecca5836", platform: "PDF" },
        { id: "teo-10", title: "Como fazer RAG", type: "youtube", videoId: "lNKMmw4pTEE" },
      ],
    },
  ],

  /* ============================================================
     PROVAS (rascunho para revisão do Lucas)
     - Cada trilha tem uma prova liberada quando todas as aulas
       da trilha estiverem marcadas como concluídas.
     - "answer" é o índice (0-based) da alternativa correta.
     - passScore = % mínimo para aprovar.
     ⚠️ Perguntas escritas como RASCUNHO com base no tema de cada
        trilha. Revise/edite o conteúdo conforme os vídeos reais.
     ============================================================ */
  quizzes: {
    sistema: {
      passScore: 70,
      questions: [
        { q: "Qual é o principal objetivo da trilha de Agenda e Recepção?", options: ["Aprender a usar o sistema para organizar a agenda e o fluxo da recepção", "Aprender a fazer cirurgias", "Cuidar da limpeza da clínica", "Gerenciar o financeiro da clínica"], answer: 0 },
        { q: "O Amigo Flow serve principalmente para:", options: ["Controlar o estoque de remédios", "Padronizar e organizar a comunicação/fluxo com o paciente", "Editar vídeos para redes sociais", "Emitir notas fiscais"], answer: 1 },
        { q: "Ao agendar um paciente, a postura correta da secretária é:", options: ["Registrar tudo corretamente no sistema e confirmar os dados", "Anotar em um papel avulso", "Deixar para registrar depois", "Pedir para o paciente se agendar sozinho"], answer: 0 },
        { q: "Manter o sistema sempre atualizado ajuda a:", options: ["Aumentar retrabalho", "Ter previsibilidade e evitar erros de agenda", "Esconder informações da equipe", "Diminuir a qualidade do atendimento"], answer: 1 },
      ],
    },
    comercial: {
      passScore: 70,
      questions: [
        { q: "O que significa SDR no contexto comercial?", options: ["Sales Development Representative — qualifica e prepara o lead", "Sistema de Recepção", "Setor de Recursos", "Serviço de Diagnóstico Rápido"], answer: 0 },
        { q: "O Closer é o profissional responsável por:", options: ["Fazer o primeiro contato apenas", "Conduzir a negociação e fechar a venda", "Limpar a base de dados", "Cuidar do pós-operatório"], answer: 1 },
        { q: "A técnica SPIN Selling trabalha perguntas de:", options: ["Situação, Problema, Implicação e Necessidade", "Saúde, Preço, Idade e Nome", "Sistema, Produto, Indicação e Notas", "Somente preço"], answer: 0 },
        { q: "Social Selling é, principalmente:", options: ["Vender de porta em porta", "Usar as redes sociais para criar relacionamento e gerar vendas", "Fazer ligações frias sem preparo", "Enviar spam para todos os contatos"], answer: 1 },
        { q: "No atendimento comercial, ouvir o paciente antes de oferecer a solução é:", options: ["Perda de tempo", "Essencial para entender a real necessidade", "Desnecessário", "Função apenas do médico"], answer: 1 },
      ],
    },
    receptivo: {
      passScore: 70,
      questions: [
        { q: "Por que a secretária/recepcionista é peça-chave na clínica?", options: ["É o primeiro contato e a imagem da clínica para o paciente", "Não tem importância no atendimento", "Só atende o telefone", "Apenas organiza papéis"], answer: 0 },
        { q: "Um dos maiores desafios da recepção é:", options: ["Ignorar o paciente", "Equilibrar acolhimento, organização e agilidade", "Atrasar os atendimentos", "Não usar o sistema"], answer: 1 },
        { q: "Diante de um paciente nervoso, a recepcionista deve:", options: ["Responder de forma ríspida", "Manter a calma, ouvir e acolher com empatia", "Ignorar e chamar o próximo", "Discutir com o paciente"], answer: 1 },
        { q: "Um bom atendimento receptivo impacta diretamente:", options: ["Apenas a limpeza", "A experiência, a fidelização e a reputação da clínica", "Nada", "Somente o estacionamento"], answer: 1 },
      ],
    },
    atendimento: {
      passScore: 70,
      questions: [
        { q: "Para que serve o fluxograma de atendimento?", options: ["Padronizar a comunicação e saber o que responder em cada etapa", "Decoração da recepção", "Controle de ponto da equipe", "Lista de compras"], answer: 0 },
        { q: "Segundo a orientação do fluxograma (Miro), cada 'barra' corresponde a:", options: ["Um conteúdo dentro do Amigo Flow que deve ser lido individualmente", "Um intervalo de café", "Um botão do telefone", "Uma sala da clínica"], answer: 0 },
        { q: "Entender os impostos do atendimento ajuda a secretária a:", options: ["Nada, não é função dela", "Passar informações corretas e evitar erros em cobranças/orientações", "Sonegar impostos", "Aumentar o preço sem critério"], answer: 1 },
        { q: "O objetivo de estudar o fluxo é entender:", options: ["Só o texto", "O texto, o contexto e a lógica da comunicação com o paciente", "Apenas a cor das setas", "Quem fez o desenho"], answer: 1 },
      ],
    },
    "video-paciente": {
      passScore: 70,
      questions: [
        { q: "Para que servem os vídeos enviados ao paciente?", options: ["Orientar e preparar o paciente em cada etapa (pré, pós, etc.)", "Entreter a equipe", "Preencher tempo da agenda", "Substituir a consulta médica"], answer: 0 },
        { q: "O vídeo 'Pré 1ª consulta' deve ser enviado:", options: ["Depois da cirurgia", "Antes da primeira consulta, para preparar o paciente", "Nunca", "Só se o paciente pedir"], answer: 1 },
        { q: "Enviar o vídeo certo no momento certo demonstra:", options: ["Desorganização", "Cuidado, padronização e profissionalismo no acompanhamento", "Falta de atenção", "Pressa"], answer: 1 },
        { q: "Ao orientar sobre pós-operatório (ex.: pós vesícula), é importante:", options: ["Inventar informações", "Usar o material oficial da clínica e tirar dúvidas com a equipe quando necessário", "Mandar qualquer vídeo da internet", "Não enviar nada"], answer: 1 },
      ],
    },
  },
};

/* Não precisa mexer: disponibiliza os dados para o site. */
window.COURSE = COURSE;
