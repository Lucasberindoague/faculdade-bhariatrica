/* ============================================================
   FACULDADE BHARIÁTRICA — Camada de dados (store)
   ------------------------------------------------------------
   Guarda senhas, progresso das aulas e notas das provas.

   • MODO LOCAL (padrão): salva no navegador de cada pessoa.
   • MODO FIREBASE: se o firebase-config.js estiver preenchido
     (FIREBASE_READY === true), o PROGRESSO e as NOTAS passam a
     sincronizar numa nuvem central (Firestore) — aí o Lucas vê
     a % de todas, de qualquer lugar, no Painel.

   O login (senha) continua no aparelho de cada uma. A interface
   (app.js) NÃO muda entre os dois modos.
   ============================================================ */

const Store = (function () {
  const DB_KEY = "BHAR_DB_v2";
  const { users: USERS, defaultPassword: DEFAULT_PASSWORD } = window.COURSE;
  const useFirebase = (typeof FIREBASE_READY !== "undefined") && FIREBASE_READY;

  let fdb = null; // referência do Firestore (quando ativo)

  /* hash simples só para não guardar senha em texto puro no navegador */
  function hash(str) {
    let h = 5381;
    for (let i = 0; i < str.length; i++) h = ((h << 5) + h + str.charCodeAt(i)) | 0;
    return "h" + (h >>> 0).toString(16);
  }
  function blankDB() { return { users: {}, progress: {}, exams: {} }; }
  function load() { try { return JSON.parse(localStorage.getItem(DB_KEY)) || blankDB(); } catch (e) { return blankDB(); } }
  function save() { try { localStorage.setItem(DB_KEY, JSON.stringify(db)); } catch (e) {} }

  function ensureUsers() {
    USERS.forEach(u => {
      if (!db.users[u.username]) {
        db.users[u.username] = {
          nome: u.name, role: u.role,
          pass: hash(u.password || DEFAULT_PASSWORD),
          mustChange: u.role === "secretaria"   // secretária troca a senha no 1º acesso
        };
      } else {
        db.users[u.username].nome = u.name;
        db.users[u.username].role = u.role;
      }
    });
    save();
  }

  let db = load();
  ensureUsers();

  /* ---------- Firebase (carregado só quando configurado) ---------- */
  function loadScript(src) {
    return new Promise((res, rej) => {
      const s = document.createElement("script");
      s.src = src; s.onload = res; s.onerror = rej;
      document.head.appendChild(s);
    });
  }
  async function initFirebase() {
    if (!useFirebase) return;
    try {
      await loadScript("https://www.gstatic.com/firebasejs/10.12.2/firebase-app-compat.js");
      await loadScript("https://www.gstatic.com/firebasejs/10.12.2/firebase-firestore-compat.js");
      firebase.initializeApp(FIREBASE_CONFIG);
      fdb = firebase.firestore();
    } catch (e) {
      console.warn("Firebase indisponível — rodando em modo local.", e);
      fdb = null;
    }
  }
  function pushUser(username) {
    if (!fdb) return;
    fdb.collection("progresso").doc(username).set({
      nome: (db.users[username] && db.users[username].nome) || username,
      progress: db.progress[username] || {},
      exams: db.exams[username] || {},
      updatedAt: Date.now()
    }, { merge: true }).catch(e => console.warn("Falha ao sincronizar:", e));
  }

  return {
    get mode() { return fdb ? "firebase" : "local"; },
    get configured() { return useFirebase; },

    /* chamado 1x no início (e após login para puxar dados da nuvem) */
    async init() { await initFirebase(); },

    async pullUser(username) {
      if (!fdb) return;
      try {
        const snap = await fdb.collection("progresso").doc(username).get();
        if (snap.exists) {
          const d = snap.data();
          db.progress[username] = d.progress || {};
          db.exams[username] = d.exams || {};
          save();
        }
      } catch (e) { console.warn("Falha ao carregar da nuvem:", e); }
    },

    /* ---- AUTENTICAÇÃO (local, por aparelho) ---- */
    login(username, password) {
      username = (username || "").trim().toLowerCase();
      const u = db.users[username];
      if (!u || u.pass !== hash(password)) return null;
      return { username, nome: u.nome, role: u.role, mustChange: !!u.mustChange };
    },
    changePassword(username, newPassword) {
      const u = db.users[username];
      if (!u) return false;
      u.pass = hash(newPassword); u.mustChange = false; save();
      return true;
    },
    needsPasswordChange(username) { return !!(db.users[username] && db.users[username].mustChange); },

    /* ---- PROGRESSO ---- */
    getLesson(username, lessonId) { return (db.progress[username] && db.progress[username][lessonId]) || null; },
    setLesson(username, lessonId, patch) {
      if (!db.progress[username]) db.progress[username] = {};
      const cur = db.progress[username][lessonId] || { status: "nao_iniciada", watchedPct: 0 };
      db.progress[username][lessonId] = Object.assign(cur, patch);
      save(); pushUser(username);
      return db.progress[username][lessonId];
    },
    getUserProgress(username) { return db.progress[username] || {}; },

    /* ---- PROVAS ---- */
    getExam(username, trackId) { return (db.exams[username] && db.exams[username][trackId]) || null; },
    setExam(username, trackId, result) {
      if (!db.exams[username]) db.exams[username] = {};
      db.exams[username][trackId] = result; save(); pushUser(username);
    },
    getUserExams(username) { return db.exams[username] || {}; },

    /* ---- ADMIN ---- */
    allUsernames() { return USERS.map(u => u.username); },
    nameOf(username) { const u = USERS.find(x => x.username === username); return u ? u.name : username; },

    /* devolve [{username, nome, progress, exams}] de todas as secretárias */
    async fetchAllForAdmin() {
      if (fdb) {
        try {
          const qs = await fdb.collection("progresso").get();
          qs.forEach(doc => {
            const d = doc.data();
            db.progress[doc.id] = d.progress || {};
            db.exams[doc.id] = d.exams || {};
          });
          save();
        } catch (e) { console.warn("Falha ao buscar do servidor:", e); }
      }
      return USERS.filter(u => u.role === "secretaria").map(u => ({
        username: u.username, nome: u.name,
        progress: db.progress[u.username] || {}, exams: db.exams[u.username] || {}
      }));
    },

    /* export/import (fallback do painel central enquanto não há Firebase) */
    snapshot(username) {
      return { username, nome: this.nameOf(username), progress: db.progress[username] || {}, exams: db.exams[username] || {}, exportedAt: new Date().toISOString() };
    },
    importSnapshot(snap) {
      if (!snap || !snap.username) return false;
      db.progress[snap.username] = snap.progress || {};
      db.exams[snap.username] = snap.exams || {}; save();
      return true;
    }
  };
})();

window.Store = Store;
