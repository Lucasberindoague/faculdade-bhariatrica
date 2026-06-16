/* ============================================================
   FACULDADE BHARIÁTRICA — Camada de dados (store) v2
   Guarda: senhas, progresso ao vivo, aprovações do gestor e
   edições do gestor (renomear / mover vídeo / atribuir pessoa).
   MODO LOCAL (padrão) salva no navegador. Com firebase-config.js
   preenchido, o PROGRESSO sincroniza na nuvem (painel central).
   As edições do gestor e aprovações são locais até ligarmos o
   Firebase para elas também (próximo passo).
   ============================================================ */
const Store = (function () {
  // ⚠️ NÃO MUDE esta chave nem os ids de usuário/aula: isso preserva o
  //    progresso e as senhas das secretárias quando você sobe atualizações.
  const DB_KEY = "BHAR_DB_v3";
  const { users: USERS, defaultPassword: DEFAULT_PASSWORD } = window.COURSE;
  const useFirebase = (typeof FIREBASE_READY !== "undefined") && FIREBASE_READY;
  let fdb = null;

  function hash(str) { let h = 5381; for (let i = 0; i < str.length; i++) h = ((h << 5) + h + str.charCodeAt(i)) | 0; return "h" + (h >>> 0).toString(16); }
  function blank() { return { users: {}, progress: {}, approvals: {}, names: {}, moves: {}, assigns: {} }; }
  function load() { try { return Object.assign(blank(), JSON.parse(localStorage.getItem(DB_KEY)) || {}); } catch (e) { return blank(); } }
  function save() { try { localStorage.setItem(DB_KEY, JSON.stringify(db)); } catch (e) {} }
  function ensureUsers() {
    USERS.forEach(u => {
      if (!db.users[u.username]) db.users[u.username] = { nome: u.name, role: u.role, pass: hash(u.password || DEFAULT_PASSWORD), mustChange: u.role === "secretaria" };
      else { db.users[u.username].nome = u.name; db.users[u.username].role = u.role; }
    });
    save();
  }
  let db = load(); ensureUsers();

  function loadScript(src) { return new Promise((res, rej) => { const s = document.createElement("script"); s.src = src; s.onload = res; s.onerror = rej; document.head.appendChild(s); }); }
  async function initFirebase() {
    if (!useFirebase) return;
    try {
      await loadScript("https://www.gstatic.com/firebasejs/10.12.2/firebase-app-compat.js");
      await loadScript("https://www.gstatic.com/firebasejs/10.12.2/firebase-auth-compat.js");
      await loadScript("https://www.gstatic.com/firebasejs/10.12.2/firebase-firestore-compat.js");
      firebase.initializeApp(FIREBASE_CONFIG);
      await firebase.auth().signInAnonymously();   // exige "Anônimo" ativado na Authentication
      fdb = firebase.firestore();
    } catch (e) { console.warn("Firebase indisponível — modo local.", e); fdb = null; }
  }
  function pushUser(username) {
    if (!fdb) return;
    fdb.collection("progresso").doc(username).set({ nome: (db.users[username] || {}).nome || username, progress: db.progress[username] || {}, updatedAt: Date.now() }, { merge: true }).catch(e => console.warn(e));
  }

  return {
    get mode() { return fdb ? "firebase" : "local"; },
    get configured() { return useFirebase; },
    async init() { await initFirebase(); },
    async pullUser(username) {
      if (!fdb) return;
      try { const snap = await fdb.collection("progresso").doc(username).get(); if (snap.exists) { db.progress[username] = snap.data().progress || {}; save(); } } catch (e) {}
    },

    /* auth */
    login(u, p) { u = (u || "").trim().toLowerCase(); const x = db.users[u]; if (!x || x.pass !== hash(p)) return null; return { username: u, nome: x.nome, role: x.role, mustChange: !!x.mustChange }; },
    changePassword(u, np) { const x = db.users[u]; if (!x) return false; x.pass = hash(np); x.mustChange = false; save(); return true; },
    needsPasswordChange(u) { return !!(db.users[u] && db.users[u].mustChange); },
    /* "Esqueci minha senha" (modo local): volta para a senha padrão e força criar uma nova.
       Com o Firebase Auth ligado, isto vira o envio de e-mail de redefinição. */
    resetToDefault(u) { u = (u || "").trim().toLowerCase(); const x = db.users[u]; if (!x) return false; x.pass = hash(DEFAULT_PASSWORD); x.mustChange = true; save(); return true; },
    emailOf(u) { const x = USERS.find(y => y.username === u); return x ? (x.email || "") : ""; },

    /* progresso ao vivo */
    getLesson(u, id) { return (db.progress[u] && db.progress[u][id]) || null; },
    setLesson(u, id, patch) { if (!db.progress[u]) db.progress[u] = {}; const c = db.progress[u][id] || { status: "nao_iniciada", watchedPct: 0 }; db.progress[u][id] = Object.assign(c, patch); save(); pushUser(u); return db.progress[u][id]; },
    getUserProgress(u) { return db.progress[u] || {}; },

    /* aprovações do gestor */
    isApproved(u, id) { return !!(db.approvals[u] && db.approvals[u][id]); },
    setApproved(u, id, v) { if (!db.approvals[u]) db.approvals[u] = {}; db.approvals[u][id] = !!v; save(); },

    /* edições do gestor (locais) */
    getName(id) { return db.names[id] || null; },
    setName(id, name) { if (name && name.trim()) db.names[id] = name.trim(); else delete db.names[id]; save(); },
    getMove(id) { return db.moves[id] || null; },
    setMove(id, groupId) { if (groupId) db.moves[id] = groupId; else delete db.moves[id]; save(); },
    getAssign(id, u) { return db.assigns[id] ? db.assigns[id][u] : undefined; },
    setAssign(id, u, v) { if (!db.assigns[id]) db.assigns[id] = {}; db.assigns[id][u] = !!v; save(); },

    allUsernames() { return USERS.map(u => u.username); },
    secretarias() { return USERS.filter(u => u.role === "secretaria"); },
    nameOf(u) { const x = USERS.find(y => y.username === u); return x ? x.name : u; }
  };
})();
window.Store = Store;
