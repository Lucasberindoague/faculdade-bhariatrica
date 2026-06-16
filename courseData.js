/* ============================================================
   FACULDADE BHARIÁTRICA — Conteúdo das trilhas (v2)
   Estrutura em 3 níveis:  TRILHA → AGRUPAMENTO → vídeos + 1 PROVA
   ------------------------------------------------------------
   • Cada AGRUPAMENTO é um "pacote" de vídeos com UMA prova no fim.
   • A prova só libera quando todos os vídeos do agrupamento
     (atribuídos à pessoa) estiverem concluídos.
   • seed = status importado da planilha Cronograma, por pessoa:
        "DD/MM"  -> concluiu nessa data (entra como "aguardando aprovação")
        "x"      -> atribuído a ela, ainda pendente
        (ausente)-> aquela trilha/vídeo NÃO é atribuída a essa pessoa
   • tempoMin = duração em minutos (você vai completar as que faltam).
   • prazo = data limite (a pessoa pode concluir depois = aparece atrasado).

   No MODO GESTOR você pode renomear, mover vídeos entre agrupamentos,
   atribuir pessoas e aprovar conclusões.
   Tipos de aula: "youtube" | "playlist" | "external" | "pdf"
   ============================================================ */

const COURSE = {
  brand: { name: "Faculdade Bhariátrica", subtitle: "Trilha de capacitação da equipe de secretaria" },
  defaultPassword: "bar@123321",

  users: [
    { username: "lucas",   name: "Lucas",   role: "admin", password: "admin@bhar25" },
    { username: "joelma",  name: "Joelma",  role: "secretaria" },
    { username: "bia",     name: "Bia",     role: "secretaria" },
    { username: "tairine", name: "Tairine", role: "secretaria" },
    { username: "taina",   name: "Tainá",   role: "secretaria" },
    { username: "mikaeli", name: "Mikaeli", role: "secretaria" },
    { username: "lucila",  name: "Lucila",  role: "secretaria" }
  ],

  tracks: [
    {
      id: "sistema", title: "Sistema", icon: "🖥️",
      description: "Ferramentas do dia a dia: agenda, recepção e Amigo Flow.",
      groups: [
        { id: "sis-g1", title: "Agenda, Recepção e AmigoFlow", lessons: [
          { id: "sis-1", title: "Trilha Agenda e Recepção", type: "external", url: "https://amigoacademy.com.br/play/curso/6654131", platform: "Amigo Academy", tempoMin: null, prazo: "20/03",
            seed: { joelma: "20/03", bia: "27/03", tairine: "04/03", taina: "13/05", mikaeli: "05/06", lucila: "x" } },
          { id: "sis-2", title: "Trilha AmigoFlow", type: "external", url: "https://amigoacademy.com.br/play/curso/6654131", platform: "Amigo Academy", tempoMin: null, prazo: "27/03",
            seed: { joelma: "02/04", bia: "27/03", tairine: "27/03", taina: "13/05", mikaeli: "05/06", lucila: "27/05" } }
        ] }
      ]
    },
    {
      id: "comercial", title: "Comercial", icon: "💼",
      description: "Vendas, social selling e técnicas de atendimento comercial.",
      groups: [
        { id: "com-g1", title: "Boas-Vindas (Amigo Academy)", lessons: [
          { id: "com-1", title: "Boas-Vindas", type: "external", url: "https://amigoacademy.com.br/play/curso/6654131", platform: "Amigo Academy", obs: "Até o vídeo 7.", tempoMin: null, prazo: "27/03",
            seed: { mikaeli: "05/06", lucila: "24/03" } }
        ] },
        { id: "com-g2", title: "Vendas EAD — Full Sales System", lessons: [
          { id: "com-2", title: "EAD – SDR / Setters", type: "external", url: "https://fullsalessystem.curseduca.pro/m/lessons/ead-de-sdrsetters1774014708711", platform: "Full Sales System", obs: "Módulos 1 e 2.", tempoMin: null, prazo: "27/03",
            seed: { tairine: "x", mikaeli: "12/06", lucila: "01/04" } },
          { id: "com-3", title: "EAD – Closer", type: "external", url: "https://fullsalessystem.curseduca.pro/m/lessons/ead-closer1772537769478", platform: "Full Sales System", obs: "Módulos 1 e 2.", tempoMin: null, prazo: "01/04",
            seed: { taina: "x", mikaeli: "12/06", lucila: "21/05" } },
          { id: "com-4", title: "Trilha de Social Selling", type: "external", url: "https://fullsalessystem.curseduca.pro/m/lessons/ead-social-selling1772537933825", platform: "Full Sales System", obs: "Ver os vídeos de 1 a 6.", tempoMin: null, prazo: "20/03",
            seed: { tairine: "26/03", mikaeli: "x", lucila: "20/03" } }
        ] },
        { id: "com-g3", title: "Técnica de SPIN Selling", lessons: [
          { id: "com-6", title: "Técnica de SPIN Selling", type: "pdf", url: "https://www.rdstation.com/blog/vendas/spin-selling/", platform: "RD Station (artigo)", tempoMin: null, prazo: "05/06",
            seed: { bia: "20/05", tairine: "29/04", taina: "x", mikaeli: "x", lucila: "x" } }
        ] },
        { id: "com-g4", title: "IA no Atendimento (Trilha Claude)", lessons: [
          { id: "com-5", title: "Trilha Claude (IA)", type: "playlist", videoId: "h7BzuuFIHIY", listId: "PLp8AftP4p8Fv4lnKoA4hiMGjY6pACpgr-", obs: "Ver toda a trilha lateral (playlist).", tempoMin: null, prazo: "05/06",
            seed: { joelma: "05/06", bia: "x", tairine: "x", taina: "x", mikaeli: "x", lucila: "x" } }
        ] }
      ]
    },
    {
      id: "receptivo", title: "Receptivo", icon: "📞",
      description: "Recepção de clínica: importância da secretária e seus desafios.",
      groups: [
        { id: "rec-g1", title: "Recepção de Clínica (iClinic)", lessons: [
          { id: "rec-1", title: "iClinic – Curso para Recepcionista", type: "external", url: "https://cursos.iclinic.com.br/courses/take/curso-para-recepcionista-de-clinica/lessons/4595759-importancia-da-secretaria-e-seus-desafios", platform: "iClinic", tempoMin: 90, prazo: "02/04",
            seed: { joelma: "08/04", bia: "10/04", tairine: "08/04", taina: "14/05", mikaeli: "x", lucila: "03/06" } }
        ] }
      ]
    },
    {
      id: "atendimento", title: "Atendimento", icon: "🤝",
      description: "Fluxograma de atendimento, impostos e comunicação com o paciente.",
      groups: [
        { id: "ate-g1", title: "Fluxograma de Atendimento", lessons: [
          { id: "ate-1", title: "Fluxograma – Parte 1", type: "youtube", videoId: "hc9VP174-2U", tempoMin: 4, prazo: "10/04",
            seed: { joelma: "10/04", bia: "10/04", tairine: "10/04", taina: "14/05", mikaeli: "x", lucila: "01/06" } },
          { id: "ate-2", title: "Fluxograma – Parte 2", type: "youtube", videoId: "GnynbfUuvco", tempoMin: 10, prazo: "10/04",
            seed: { joelma: "10/04", bia: "10/04", tairine: "10/04", taina: "14/05", mikaeli: "x", lucila: "08/06" } },
          { id: "ate-3", title: "Fluxograma – Parte 3", type: "youtube", videoId: "X3fKg3LNP5Q", tempoMin: 10, prazo: "10/04",
            seed: { joelma: "10/04", bia: "10/04", tairine: "10/04", taina: "15/05", mikaeli: "x", lucila: "11/06" } },
          { id: "ate-7", title: "Fluxograma – Vídeo complementar", type: "youtube", videoId: "MyyZJFQ-pss", tempoMin: null, prazo: "05/06",
            seed: { bia: "02/06", tairine: "12/05", mikaeli: "x", lucila: "x" } },
          { id: "ate-6", title: "Fluxograma (Mapa no Miro)", type: "external", url: "https://miro.com/app/board/uXjVGkzgEOk=/", platform: "Miro", obs: "Leitura completa do fluxo. Cada 'barra' corresponde a um conteúdo dentro do Amigo Flow — acesse o Amigo Flow, procure pelo nome de cada barra e leia individualmente.", tempoMin: 20, prazo: "30/04",
            seed: { joelma: "30/04", bia: "29/04", tairine: "29/04", taina: "15/05", mikaeli: "x", lucila: "11/06" } }
        ] },
        { id: "ate-g2", title: "Impostos no Atendimento", lessons: [
          { id: "ate-4", title: "Impostos – Parte 1", type: "youtube", videoId: "MUAs7U7-6ug", tempoMin: 20, prazo: "17/10",
            seed: { joelma: "15/04", bia: "10/04", tairine: "17/04", taina: "15/05", lucila: "11/06" } },
          { id: "ate-5", title: "Impostos – Parte 2", type: "youtube", videoId: "85WrCtQS0vg", tempoMin: 20, prazo: "17/10",
            seed: { joelma: "15/04", bia: "10/04", tairine: "17/04", taina: "15/05", lucila: "11/06" } }
        ] }
      ]
    },
    {
      id: "video-paciente", title: "Vídeo para Paciente", icon: "🎬",
      description: "Vídeos de orientação que enviamos aos pacientes.",
      groups: [
        { id: "vid-g1", title: "Orientação ao Paciente", lessons: [
          { id: "pac-1", title: "Pré 1ª consulta", type: "youtube", videoId: "R_3TGgk2MSA", tempoMin: null, prazo: "05/06",
            seed: { joelma: "x", bia: "x", tairine: "02/06", taina: "x", mikaeli: "x", lucila: "x" } },
          { id: "pac-2", title: "Pós primeira consulta", type: "youtube", videoId: "MK0yqBvx_Ag", tempoMin: null, prazo: "05/06",
            seed: { joelma: "x", bia: "x", tairine: "x", taina: "x", mikaeli: "x", lucila: "x" } },
          { id: "pac-3", title: "Noripurum", type: "youtube", videoId: "GbpzfbxyLTk", tempoMin: null, prazo: "05/06",
            seed: { joelma: "x", bia: "x", tairine: "x", taina: "x", mikaeli: "x", lucila: "x" } },
          { id: "pac-4", title: "Orientações pós vesícula", type: "youtube", videoId: "rQYdz5UyGfE", tempoMin: null, prazo: "05/06",
            seed: { joelma: "x", bia: "x", tairine: "x", taina: "x", mikaeli: "x", lucila: "x" } }
        ] }
      ]
    },
    {
      id: "teoria-meuos", title: "Teoria MeuOS / IA", icon: "🤖", locked: true,
      description: "IA, automação e n8n. (Liberado mais pra frente — ainda não precisa ver.)",
      groups: [
        { id: "teo-g1", title: "IA, Automação e n8n", lessons: [
          { id: "teo-1", title: "Você não vai ser demitido pela IA…", type: "pdf", url: "https://acrobat.adobe.com/id/urn:aaid:sc:VA6C2:5d7e5f5e-1ceb-4b39-ba95-577f43a1e27a", platform: "PDF" },
          { id: "teo-2", title: "IAG 01 – Apresentação Antonio Santos", type: "youtube", videoId: "SZt216S5Fn0" },
          { id: "teo-3", title: "IAG 02 – Contexto Atual IA", type: "youtube", videoId: "p5jMfqk987k" },
          { id: "teo-4", title: "IAG 04 – Apresentação Fernando Lucio", type: "youtube", videoId: "a5oHuJ4YR5Q" },
          { id: "teo-5", title: "IAG 05 – Aula Guia N8N", type: "youtube", videoId: "AOCSlebu9c0" },
          { id: "teo-10", title: "Como fazer RAG", type: "youtube", videoId: "lNKMmw4pTEE" }
        ] }
      ]
    }
  ],

  /* ============================================================
     PROVAS por AGRUPAMENTO (chave = id do agrupamento).
       mode "auto"   -> prova de múltipla escolha pronta (RASCUNHO p/ revisar)
       mode "attach" -> sistema fechado: VOCÊ anexa/cria a prova aqui depois
     answer = índice (0-based) da alternativa correta. passScore = % p/ aprovar.
     ⚠️ As provas "auto" são RASCUNHOS conceituais — revise antes de liberar.
     ============================================================ */
  quizzes: {
    "sis-g1": { mode: "attach", passScore: 70, questions: [] },
    "com-g1": { mode: "attach", passScore: 70, questions: [] },
    "com-g2": { mode: "attach", passScore: 70, questions: [] },
    "rec-g1": { mode: "attach", passScore: 70, questions: [] },
    "teo-g1": { mode: "attach", passScore: 70, questions: [] },

    "com-g3": { mode: "auto", passScore: 70, questions: [
      { q: "O que significa a sigla SPIN em SPIN Selling?", options: ["Situação, Problema, Implicação e Necessidade", "Solução, Preço, Indicação e Negócio", "Sistema, Processo, Insumo e Nota", "Serviço, Produto, Imagem e Nicho"], answer: 0 },
      { q: "As perguntas de SITUAÇÃO servem para:", options: ["Fechar a venda na hora", "Entender o contexto atual do cliente", "Falar do preço", "Apresentar a empresa"], answer: 1 },
      { q: "As perguntas de PROBLEMA buscam:", options: ["Identificar dificuldades e dores do cliente", "Listar produtos", "Pedir indicações", "Agendar pagamento"], answer: 0 },
      { q: "As perguntas de IMPLICAÇÃO servem para:", options: ["Mostrar as consequências de não resolver o problema", "Dar desconto", "Encerrar o atendimento", "Mudar de assunto"], answer: 0 },
      { q: "As perguntas de NECESSIDADE (Need-payoff) levam o cliente a:", options: ["Perceber o valor da solução", "Desistir da compra", "Reclamar do preço", "Procurar concorrente"], answer: 0 },
      { q: "No SPIN, o vendedor deve falar mais ou ouvir mais?", options: ["Ouvir mais, perguntando bem", "Falar o tempo todo", "Só apresentar tabela de preços", "Evitar perguntas"], answer: 0 },
      { q: "A melhor hora de apresentar a solução é:", options: ["Logo no início, antes de entender o cliente", "Depois de entender situação, problema e implicações", "Somente por e-mail", "Nunca"], answer: 1 },
      { q: "SPIN Selling é mais indicado para vendas:", options: ["Consultivas, de maior valor/complexidade", "Apenas por impulso", "Sem nenhum relacionamento", "Somente automáticas"], answer: 0 },
      { q: "Ouvir ativamente o paciente/cliente ajuda a:", options: ["Entender a real necessidade e gerar confiança", "Perder tempo", "Encerrar mais rápido sem ouvir", "Aumentar reclamações"], answer: 0 },
      { q: "Um bom atendimento comercial na clínica deve focar em:", options: ["Empatia e na necessidade do paciente", "Empurrar qualquer procedimento", "Falar só de preço", "Pressa para desligar"], answer: 0 }
    ] },

    "com-g4": { mode: "auto", passScore: 70, questions: [
      { q: "Ferramentas de IA (como o Claude) servem na clínica principalmente para:", options: ["Apoiar e agilizar tarefas, com revisão humana", "Substituir totalmente a equipe sem conferência", "Decidir sozinhas sem supervisão", "Guardar segredos dos pacientes em sites públicos"], answer: 0 },
      { q: "Ao usar IA para escrever uma mensagem ao paciente, a secretária deve:", options: ["Revisar antes de enviar", "Enviar sem ler", "Confiar 100% sem checar", "Nunca revisar"], answer: 0 },
      { q: "Dados sensíveis de pacientes em ferramentas de IA devem ser tratados com:", options: ["Cuidado e seguindo as regras da clínica", "Total descuido", "Publicação aberta", "Compartilhamento livre"], answer: 0 },
      { q: "Um bom uso da IA no atendimento é:", options: ["Rascunhar respostas e organizar informações", "Inventar dados clínicos", "Dar diagnósticos médicos", "Prometer resultados garantidos"], answer: 0 },
      { q: "Se a IA gerar uma informação que você não tem certeza, o correto é:", options: ["Conferir com a equipe antes de usar", "Repassar como verdade absoluta", "Ignorar a dúvida", "Apagar e não falar com ninguém"], answer: 0 },
      { q: "A IA deve ser vista como:", options: ["Uma ferramenta de apoio ao seu trabalho", "Sua substituta sem supervisão", "Uma fonte infalível", "Um perigo a ser evitado sempre"], answer: 0 },
      { q: "Para tirar bom proveito da IA, é importante:", options: ["Saber dar instruções claras (bom contexto)", "Não explicar nada", "Usar sempre da mesma forma", "Evitar aprender a usá-la"], answer: 0 },
      { q: "Quem se destaca no trabalho hoje é quem:", options: ["Aprende a usar as ferramentas a seu favor", "Recusa qualquer tecnologia", "Ignora treinamentos", "Faz tudo manualmente sempre"], answer: 0 }
    ] },

    "ate-g1": { mode: "auto", passScore: 70, questions: [
      { q: "Para que serve o fluxograma de atendimento?", options: ["Padronizar a comunicação e saber o que responder em cada etapa", "Decorar a recepção", "Controlar o ponto da equipe", "Lista de compras"], answer: 0 },
      { q: "Segundo a orientação do fluxograma (Miro), cada 'barra' corresponde a:", options: ["Um conteúdo dentro do Amigo Flow que deve ser lido", "Um intervalo de café", "Um botão do telefone", "Uma sala da clínica"], answer: 0 },
      { q: "O objetivo de estudar o fluxo é entender:", options: ["O texto, o contexto e a lógica da comunicação com o paciente", "Apenas a cor das setas", "Só quem desenhou", "Nada em específico"], answer: 0 },
      { q: "Seguir o fluxograma ajuda a equipe a:", options: ["Manter um atendimento alinhado e padronizado", "Cada um responder de um jeito", "Improvisar sempre", "Ignorar o paciente"], answer: 0 },
      { q: "Diante de uma dúvida não prevista no fluxo, o ideal é:", options: ["Buscar orientação com a equipe/gestor", "Inventar uma resposta", "Encerrar o atendimento", "Transferir sem explicar"], answer: 0 },
      { q: "Um bom atendimento começa por:", options: ["Acolher e identificar a necessidade do paciente", "Pedir o pagamento primeiro", "Apressar o paciente", "Transferir a ligação"], answer: 0 },
      { q: "A comunicação com o paciente deve ser:", options: ["Clara, empática e organizada", "Confusa e apressada", "Fria e impessoal", "Cheia de termos difíceis"], answer: 0 },
      { q: "Registrar corretamente o atendimento no sistema serve para:", options: ["Dar continuidade e evitar erros", "Aumentar retrabalho", "Esconder informação", "Nada"], answer: 0 },
      { q: "Quando o paciente faz uma objeção, a postura ideal é:", options: ["Ouvir, entender e mostrar valor", "Discutir", "Ignorar", "Desligar"], answer: 0 },
      { q: "O fluxograma deve ser usado:", options: ["Como guia no dia a dia do atendimento", "Apenas uma vez e nunca mais", "Só pela gerência", "Para enfeitar a parede"], answer: 0 }
    ] },

    "ate-g2": { mode: "auto", passScore: 70, questions: [
      { q: "Por que a secretária precisa entender o básico de impostos no atendimento?", options: ["Para passar informações corretas e evitar erros em cobranças/orientações", "Para sonegar impostos", "Para aumentar o preço sem critério", "Não precisa saber nada"], answer: 0 },
      { q: "Diante de uma dúvida específica sobre imposto/nota fiscal, o ideal é:", options: ["Confirmar com o setor responsável antes de informar o paciente", "Chutar a resposta", "Ignorar a pergunta", "Inventar um valor"], answer: 0 },
      { q: "Informações sobre valores e notas devem ser passadas de forma:", options: ["Correta, clara e conferida", "Apressada e sem conferir", "Aproximada e sem cuidado", "Que o paciente nunca entenda"], answer: 0 },
      { q: "Emitir e organizar corretamente as notas/recibos ajuda a clínica a:", options: ["Manter a organização e cumprir as obrigações", "Ter mais retrabalho", "Confundir o paciente", "Esconder informação"], answer: 0 },
      { q: "Se o paciente pedir um documento fiscal, a secretária deve:", options: ["Encaminhar conforme o procedimento da clínica", "Recusar sem explicar", "Mandar embora", "Prometer o que não pode"], answer: 0 },
      { q: "Transparência nas informações financeiras gera no paciente:", options: ["Confiança", "Desconfiança", "Indiferença", "Irritação"], answer: 0 },
      { q: "Erros em cobrança ou informação fiscal podem causar:", options: ["Insatisfação e retrabalho", "Mais elogios", "Nada", "Aumento automático de vendas"], answer: 0 },
      { q: "O conhecimento sobre impostos no atendimento deve ser usado para:", options: ["Orientar bem o paciente dentro das regras", "Burlar regras", "Confundir o paciente", "Evitar atender"], answer: 0 }
    ] },

    "vid-g1": { mode: "auto", passScore: 70, questions: [
      { q: "Para que servem os vídeos de orientação enviados ao paciente?", options: ["Orientar e preparar o paciente em cada etapa", "Entreter a equipe", "Preencher a agenda", "Substituir a consulta médica"], answer: 0 },
      { q: "O vídeo 'Pré 1ª consulta' deve ser enviado:", options: ["Antes da primeira consulta, para preparar o paciente", "Depois da cirurgia", "Nunca", "Só se o paciente pedir"], answer: 0 },
      { q: "Enviar o vídeo certo no momento certo demonstra:", options: ["Cuidado, padronização e profissionalismo", "Desorganização", "Falta de atenção", "Pressa"], answer: 0 },
      { q: "Ao orientar sobre pós-operatório, a secretária deve:", options: ["Usar o material oficial da clínica e encaminhar dúvidas à equipe", "Inventar orientações médicas", "Mandar qualquer vídeo da internet", "Não enviar nada"], answer: 0 },
      { q: "Se o paciente tiver uma dúvida clínica após o vídeo, a secretária deve:", options: ["Encaminhar para o profissional responsável", "Dar o diagnóstico", "Prescrever remédio", "Ignorar"], answer: 0 },
      { q: "O envio dos vídeos de orientação deve seguir:", options: ["O fluxo/etapa de cada paciente", "Ordem aleatória", "Só quando sobrar tempo", "Nunca"], answer: 0 },
      { q: "Padronizar os vídeos de orientação ajuda a clínica a:", options: ["Garantir que todo paciente receba a mesma informação de qualidade", "Confundir os pacientes", "Aumentar erros", "Perder pacientes"], answer: 0 },
      { q: "Sobre informações médicas, o papel da secretária é:", options: ["Orientar no que é do seu papel e encaminhar o resto à equipe", "Substituir o médico", "Dar diagnósticos", "Receitar medicamentos"], answer: 0 },
      { q: "Confirmar se o paciente recebeu e entendeu o vídeo é:", options: ["Uma boa prática de atendimento", "Perda de tempo", "Função do paciente", "Desnecessário"], answer: 0 },
      { q: "O tom ao orientar o paciente deve ser:", options: ["Acolhedor, claro e respeitoso", "Frio e apressado", "Técnico e confuso", "Impaciente"], answer: 0 }
    ] }
  }
};

/* Não precisa mexer: disponibiliza os dados para o site. */
window.COURSE = COURSE;
