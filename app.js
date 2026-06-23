/* ============================================================
   FACULDADE BHARIÁTRICA — App (v2): Trilha → Agrupamento → vídeos+prova
   ============================================================ */
(function () {
  const COURSE = window.COURSE;
  let TRACKS = COURSE.tracks;          // estrutura ativa (pode vir do Firebase via Store)
  const QUIZZES = COURSE.quizzes || {};
  const root = document.getElementById("app");
  const App = { user: null, view: "login", trackId: null, groupId: null, lessonId: null, personId: null };
  let ytReady = null, player = null, pollTimer = null;

  /* ---------- índice plano de aulas (reconstruído quando a estrutura muda) ---------- */
  let ALL = [];
  function rebuild() { ALL = []; TRACKS.forEach(t => (t.groups || []).forEach(g => (g.lessons || []).forEach(l => ALL.push({ lesson: l, groupId: g.id, trackId: t.id })))); }
  rebuild();
  function lessonInfo(id) { return ALL.find(x => x.lesson.id === id); }
  function effGroup(id) { const i = lessonInfo(id); return i ? i.groupId : null; }
  function groupLessons(gid) { return ALL.filter(x => x.groupId === gid).map(x => x.lesson); }
  function dname(_id, fb) { return fb == null ? "" : fb; }   // títulos ficam na própria estrutura
  function trackOf(gid) { return TRACKS.find(t => (t.groups || []).some(g => g.id === gid)); }
  function groupById(gid) { for (const t of TRACKS) for (const g of (t.groups || [])) if (g.id === gid) return g; return null; }
  /* salva a estrutura editada e re-renderiza */
  function saveCourse() { window.Store.saveTracks(TRACKS); rebuild(); render(); }
  function uid(p) { return p + Math.random().toString(36).slice(2, 8); }

  /* ---------- utilidades ---------- */
  function esc(s) { return String(s == null ? "" : s).replace(/[&<>"']/g, c => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c])); }
  function isVideo(l) { return l.type === "youtube" || l.type === "playlist"; }
  function fmt(iso) { if (!iso) return ""; const d = new Date(iso); if (isNaN(d)) return iso; return String(d.getDate()).padStart(2, "0") + "/" + String(d.getMonth() + 1).padStart(2, "0"); }
  function parseDM(s) { const m = String(s).match(/(\d{1,2})[\/\-](\d{1,2})/); return m ? Number(m[2]) * 100 + Number(m[1]) : null; }
  function lateCheck(dateStr, prazoStr) { const a = parseDM(dateStr), b = parseDM(prazoStr); return a != null && b != null && a > b; }
  function contentBadge(l) { if (isVideo(l)) return { t: "Vídeo", c: "badge-video" }; if (l.type === "pdf") return { t: "PDF / Doc", c: "badge-pdf" }; return { t: "Curso externo", c: "badge-link" }; }
  function ytId(s) { const m = String(s).match(/(?:youtube\.com\/watch\?[^#]*\bv=|youtu\.be\/|youtube\.com\/embed\/)([A-Za-z0-9_-]{11})/); if (m) return m[1]; const m2 = String(s).trim().match(/^[A-Za-z0-9_-]{11}$/); return m2 ? m2[0] : null; }

  function assignedTo(id, u) { const i = lessonInfo(id); if (!i) return false; const a = i.lesson.assign; if (a && Object.prototype.hasOwnProperty.call(a, u)) return !!a[u]; return !!(i.lesson.seed && (u in i.lesson.seed)); }
  function lessonState(u, l) {
    const live = window.Store.getLesson(u, l.id);
    if (live && live.status === "concluida") return { st: "concluida", date: fmt(live.completedAt), approved: window.Store.isApproved(u, l.id), live: true };
    const sv = l.seed && l.seed[u];
    if (sv && /^\d/.test(sv)) return { st: "concluida", date: sv, approved: window.Store.isApproved(u, l.id), live: false };
    if (assignedTo(l.id, u)) return { st: "pendente" };
    return { st: "na" };
  }
  function userGroupLessons(u, gid) { return groupLessons(gid).filter(l => lessonState(u, l).st !== "na"); }
  function groupStats(u, gid) { const ls = userGroupLessons(u, gid); const done = ls.filter(l => lessonState(u, l).st === "concluida").length; return { total: ls.length, done, pct: ls.length ? Math.round(done / ls.length * 100) : 0 }; }
  function trackAssigned(u, t) { return t.groups.some(g => userGroupLessons(u, g.id).length > 0); }
  function trackStats(u, t) { let tot = 0, dn = 0; t.groups.forEach(g => { const s = groupStats(u, g.id); tot += s.total; dn += s.done; }); return { total: tot, done: dn, pct: tot ? Math.round(dn / tot * 100) : 0 }; }
  function overall(u) { let tot = 0, dn = 0; TRACKS.filter(t => !t.locked).forEach(t => { const s = trackStats(u, t); tot += s.total; dn += s.done; }); return { total: tot, done: dn, pct: tot ? Math.round(dn / tot * 100) : 0 }; }
  function quizFor(gid) { const q = QUIZZES[gid]; return q || null; }
  function quizReady(gid) { const q = QUIZZES[gid]; return !!(q && q.mode === "auto" && q.questions && q.questions.length); }
  function bar(p) { return `<div class="progress-bar"><div class="progress-fill" style="width:${p}%"></div></div>`; }

  /* ---------- YouTube ---------- */
  function loadYT() { if (ytReady) return ytReady; ytReady = new Promise(res => { if (window.YT && window.YT.Player) return res(); window.onYouTubeIframeAPIReady = () => res(); const t = document.createElement("script"); t.src = "https://www.youtube.com/iframe_api"; document.head.appendChild(t); }); return ytReady; }
  function stopPlayer() { if (pollTimer) { clearInterval(pollTimer); pollTimer = null; } if (player && player.destroy) { try { player.destroy(); } catch (e) {} } player = null; }

  /* ---------- navegação ---------- */
  function go(v, p) { stopPlayer(); App.view = v; if (p) { ["trackId", "groupId", "lessonId", "personId"].forEach(k => { if (p[k] !== undefined) App[k] = p[k]; }); } render(); window.scrollTo(0, 0); }
  function logout() { App.user = null; go("login"); }

  function render() {
    if (!App.user) return renderLogin();
    if (App.view === "change-required") return renderChangePassword(true);
    let b = "";
    switch (App.view) {
      case "trilhas": b = viewTrilhas(); break;
      case "trilha": b = viewTrilha(); break;
      case "aula": b = viewAula(); break;
      case "prova": b = viewProva(); break;
      case "progresso": b = viewProgresso(); break;
      case "senha": b = changePwInner(false); break;
      case "admin": b = viewAdmin(); break;
      case "ficha": b = viewFicha(); break;
      case "gerenciar": b = viewGerenciar(); break;
      default: b = App.user.role === "admin" ? viewAdmin() : viewTrilhas();
    }
    root.innerHTML = shell(b); wireHeader(); afterRender();
  }

  /* ---------- LOGIN ---------- */
  function renderLogin() {
    root.innerHTML = `<div class="auth-wrap"><div class="auth-card">${brandBlock()}
      <h1 class="auth-title">Entrar</h1><p class="auth-sub">Plataforma de treinamento da equipe de secretaria</p>
      <div class="field"><label>Usuário</label><input id="lg-user" type="text" autocomplete="username" placeholder="ex.: lucila" /></div>
      <div class="field"><label>Senha</label><input id="lg-pass" type="password" autocomplete="current-password" placeholder="Sua senha" /></div>
      <div id="lg-err" class="form-err" hidden></div>
      <button id="lg-btn" class="btn btn-primary btn-block">Entrar</button>
      <button id="forgot-link" class="link-btn">Esqueci minha senha</button>
      <div id="forgot-box" hidden>
        <div class="field"><label>Seu usuário</label><input id="fg-user" type="text" placeholder="ex.: lucila"></div>
        <div id="fg-msg" class="form-ok" hidden></div>
        <button id="fg-btn" class="btn btn-ghost btn-block">Redefinir minha senha</button>
      </div>
      <p class="auth-hint">Primeiro acesso? Use a senha padrão informada pelo Lucas. O sistema vai pedir para você criar a sua própria.</p></div></div>`;
    const submit = async () => {
      const user = window.Store.login(document.getElementById("lg-user").value, document.getElementById("lg-pass").value);
      const err = document.getElementById("lg-err");
      if (!user) { err.hidden = false; err.textContent = "Usuário ou senha incorretos."; return; }
      App.user = user;
      if (user.mustChange) { App.view = "change-required"; render(); return; }
      if (window.Store.mode === "firebase") { try { await window.Store.pullUser(user.username); } catch (e) {} }
      go(user.role === "admin" ? "admin" : "trilhas");
    };
    document.getElementById("lg-btn").onclick = submit;
    document.getElementById("lg-pass").addEventListener("keydown", e => { if (e.key === "Enter") submit(); });
    document.getElementById("forgot-link").onclick = () => { const b = document.getElementById("forgot-box"); b.hidden = !b.hidden; };
    document.getElementById("fg-btn").onclick = () => {
      const u = (document.getElementById("fg-user").value || "").trim().toLowerCase();
      const msg = document.getElementById("fg-msg"); msg.hidden = false;
      if (window.Store.resetToDefault(u)) { msg.className = "form-ok"; msg.innerHTML = "Pronto! Sua senha voltou para a <strong>padrão</strong>. Entre com ela e crie uma nova."; }
      else { msg.className = "form-err"; msg.textContent = "Usuário não encontrado. Confira com o Lucas."; }
    };
    document.getElementById("lg-user").focus();
  }

  /* ---------- TROCAR SENHA ---------- */
  function renderChangePassword(req) { root.innerHTML = `<div class="auth-wrap"><div class="auth-card">${brandBlock()}${changePwInner(req)}</div></div>`; wireChangePw(req); }
  function changePwInner(req) {
    return `<h1 class="auth-title">${req ? "Crie sua senha" : "Trocar senha"}</h1>
      <p class="auth-sub">${req ? "Por segurança, defina uma senha só sua para o primeiro acesso." : "Defina uma nova senha de acesso."}</p>
      ${req ? "" : `<div class="field"><label>Senha atual</label><input id="cp-old" type="password" autocomplete="current-password"></div>`}
      <div class="field"><label>Nova senha</label><input id="cp-new" type="password" autocomplete="new-password" placeholder="Mínimo 4 caracteres"></div>
      <div class="field"><label>Confirmar nova senha</label><input id="cp-new2" type="password" autocomplete="new-password"></div>
      <div id="cp-err" class="form-err" hidden></div><div id="cp-ok" class="form-ok" hidden></div>
      <button id="cp-btn" class="btn btn-primary btn-block">Salvar nova senha</button>`;
  }
  function wireChangePw(req) {
    document.getElementById("cp-btn").onclick = async () => {
      const err = document.getElementById("cp-err"), ok = document.getElementById("cp-ok"); err.hidden = true; ok.hidden = true;
      const n1 = document.getElementById("cp-new").value, n2 = document.getElementById("cp-new2").value;
      if (!req) { const old = document.getElementById("cp-old").value; if (!window.Store.login(App.user.username, old)) { err.hidden = false; err.textContent = "Senha atual incorreta."; return; } }
      if (n1.length < 4) { err.hidden = false; err.textContent = "A nova senha precisa ter pelo menos 4 caracteres."; return; }
      if (n1 !== n2) { err.hidden = false; err.textContent = "As senhas não conferem."; return; }
      window.Store.changePassword(App.user.username, n1); App.user.mustChange = false;
      if (req) { go(App.user.role === "admin" ? "admin" : "trilhas"); } else { ok.hidden = false; ok.textContent = "Senha alterada com sucesso!"; }
    };
  }

  /* ---------- SHELL ---------- */
  function shell(body) {
    const isAdmin = App.user.role === "admin";
    const nav = isAdmin
      ? `<button class="nav-btn" data-go="admin">Painel</button><button class="nav-btn" data-go="gerenciar">Gerenciar</button><button class="nav-btn" data-go="trilhas">Trilhas</button><button class="nav-btn" data-go="senha">Trocar senha</button>`
      : `<button class="nav-btn" data-go="trilhas">Trilhas</button><button class="nav-btn" data-go="progresso">Meu progresso</button><button class="nav-btn" data-go="senha">Trocar senha</button>`;
    return `<header class="header"><div class="header-inner">
        <div class="brand-row" data-go="${isAdmin ? "admin" : "trilhas"}">${logoSVG()}<span class="brand-name">Faculdade <strong>Bhariátrica</strong></span></div>
        <nav class="nav">${nav}</nav>
        <div class="user-box"><span class="user-name">${esc(App.user.nome)}${isAdmin ? " · gestor" : ""}</span><button class="btn btn-ghost btn-sm" id="logout">Sair</button></div>
      </div></header><main class="container">${body}</main>
      <footer class="foot">Faculdade Bhariátrica · plataforma interna de treinamento</footer>`;
  }
  function wireHeader() { const lo = document.getElementById("logout"); if (lo) lo.onclick = logout; document.querySelectorAll("[data-go]").forEach(el => el.onclick = () => go(el.getAttribute("data-go"))); }

  /* ---------- SECRETÁRIA: lista de trilhas ---------- */
  function viewTrilhas() {
    const admin = App.user.role === "admin";
    const u = App.user.username;
    const list = TRACKS.filter(t => admin ? true : (!t.locked && trackAssigned(u, t)));
    if (!list.length) return `<div class="empty"><h2>Nenhuma trilha atribuída ainda</h2><p>O Lucas vai liberar seus conteúdos em breve.</p></div>`;
    const ov = admin ? null : overall(u);
    const cards = list.map(t => {
      const locked = t.locked;
      const s = admin ? null : trackStats(u, t);
      const nGroups = t.groups.length;
      return `<div class="trilha-card ${locked ? "locked" : ""}" ${locked && !admin ? "" : `data-track="${t.id}"`}>
        <div class="trilha-top"><span class="trilha-ico">${t.icon || "📚"}</span>${locked ? `<span class="badge badge-soon">Em breve</span>` : (admin ? `<span class="trilha-pct">${nGroups} grupos</span>` : `<span class="trilha-pct">${s.pct}%</span>`)}</div>
        <h3 class="trilha-name">${esc(dname(t.id, t.title))}</h3>
        <p class="trilha-desc">${esc(t.description || "")}</p>
        ${locked || admin ? "" : bar(s.pct)}
        <div class="trilha-meta">${admin ? `${nGroups} agrupamentos` : (locked ? "Em breve" : `${s.done}/${s.total} concluídos`)}</div></div>`;
    }).join("");
    const head = admin
      ? `<div class="page-head"><div><h1 class="page-title">Conteúdo (visão gestor)</h1><p class="page-sub">Navegue pelas trilhas e agrupamentos. Para editar, use <strong>Gerenciar</strong>.</p></div></div>`
      : `<div class="page-head"><div><h1 class="page-title">Olá, ${esc(App.user.nome.split(" ")[0])} 👋</h1><p class="page-sub">Sua evolução geral está em <strong>${ov.pct}%</strong>. Bora avançar!</p></div><div class="big-pct"><div class="big-pct-num">${ov.pct}%</div><div class="big-pct-lbl">evolução</div></div></div>${bar(ov.pct)}`;
    return head + `<div class="trilha-grid">${cards}</div>`;
  }

  /* ---------- detalhe da trilha (agrupamentos) ---------- */
  function viewTrilha() {
    const t = TRACKS.find(x => x.id === App.trackId); if (!t) return viewTrilhas();
    const admin = App.user.role === "admin", u = App.user.username;
    const s = admin ? null : trackStats(u, t);
    const groupsHtml = t.groups.map(g => {
      const lessons = admin ? groupLessons(g.id) : userGroupLessons(u, g.id);
      if (!admin && !lessons.length) return "";
      const gs = admin ? null : groupStats(u, g.id);
      const rows = lessons.map((a, i) => {
        const stt = admin ? null : lessonState(u, a);
        const done = stt && stt.st === "concluida";
        const b = contentBadge(a);
        return `<div class="aula-row" data-lesson="${a.id}">
          <div class="aula-check ${done ? "on" : ""}">${done ? "✓" : i + 1}</div>
          <div class="aula-info"><div class="aula-title">${esc(dname(a.id, a.title))}</div>
          <div class="aula-sub"><span class="badge ${b.c}">${b.t}</span>${a.platform ? `<span class="aula-time">${esc(a.platform)}</span>` : ""}${a.tempoMin ? `<span class="aula-time">⏱ ${a.tempoMin} min</span>` : ""}${a.prazo ? `<span class="aula-time">prazo ${esc(a.prazo)}</span>` : ""}</div></div>
          <div class="aula-go">${done ? "Revisar" : "Abrir"} ›</div></div>`;
      }).join("");
      const examBox = groupExamBox(g, admin, u);
      return `<div class="group-block"><div class="group-head"><h3>${esc(dname(g.id, g.title))}</h3>${admin ? `<span class="muted">${lessons.length} vídeos</span>` : `<span class="trilha-pct">${gs.pct}%</span>`}</div>
        <div class="aula-list">${rows || '<p class="muted" style="padding:8px">Nenhum vídeo neste agrupamento.</p>'}</div>${examBox}</div>`;
    }).join("");
    return `<button class="back" data-go="trilhas">‹ Trilhas</button>
      <div class="page-head"><div><h1 class="page-title">${t.icon} ${esc(dname(t.id, t.title))}</h1><p class="page-sub">${esc(t.description || "")}</p></div>${admin ? "" : `<div class="big-pct"><div class="big-pct-num">${s.pct}%</div><div class="big-pct-lbl">${s.done}/${s.total}</div></div>`}</div>
      ${admin ? "" : bar(s.pct)}${groupsHtml}`;
  }

  function groupExamBox(g, admin, u) {
    const q = QUIZZES[g.id];
    const ready = quizReady(g.id);
    const complete = admin ? false : (function () { const ls = userGroupLessons(u, g.id); return ls.length > 0 && ls.every(l => lessonState(u, l).st === "concluida"); })();
    if (admin) {
      const info = ready ? `${q.questions.length} questões · auto` : "a anexar pelo gestor";
      return `<div class="exam-box soon"><div><strong>Prova do agrupamento</strong><p>${info}</p></div></div>`;
    }
    if (!q || q.mode === "attach" || !ready) return `<div class="exam-box soon"><div><strong>Prova do agrupamento</strong><p>Será disponibilizada pelo gestor.</p></div><button class="btn btn-ghost" disabled>Em breve</button></div>`;
    if (!complete) return `<div class="exam-box soon"><div><strong>Prova do agrupamento</strong><p>🔒 Conclua todos os vídeos do agrupamento para liberar a prova.</p></div><button class="btn btn-ghost" disabled>🔒 Bloqueada</button></div>`;
    const exam = window.Store.getLesson(u, "exam-" + g.id);
    return `<div class="exam-box"><div><strong>Prova do agrupamento</strong><p>${exam ? `Você fez: <strong>${exam.score}%</strong> — ${exam.passed ? "✅ Aprovada" : "❌ Refazer"}` : `${q.questions.length} questões · nota mínima ${q.passScore || 70}%`}</p></div><button class="btn btn-primary" data-prova="${g.id}">${exam ? "Refazer prova" : "Fazer prova"}</button></div>`;
  }

  /* ---------- AULA (player) ---------- */
  function viewAula() {
    const a = (lessonInfo(App.lessonId) || {}).lesson; if (!a) return viewTrilha();
    const u = App.user.username, admin = App.user.role === "admin";
    const done = !admin && lessonState(u, a).st === "concluida";
    let media;
    if (isVideo(a)) {
      const watch = "https://www.youtube.com/watch?v=" + (a.videoId || "") + (a.type === "playlist" && a.listId ? "&list=" + a.listId : "");
      if (location.protocol === "file:") media = `<div class="file-warn">⚠️ Site aberto por arquivo: vídeos do YouTube só tocam embutidos quando publicado. Use o botão abaixo.</div><div class="ext-box"><a class="btn btn-primary" href="${watch}" target="_blank" rel="noopener">▶ Assistir no YouTube ↗</a></div>`;
      else media = `<div class="player-wrap"><div id="yt-player"></div><div id="yt-fallback" class="yt-fallback" hidden><div class="yt-fallback-inner"><p>Não deu para tocar aqui.<br><span class="muted">O dono do vídeo pode ter bloqueado a incorporação.</span></p><a class="btn btn-primary" href="${watch}" target="_blank" rel="noopener">▶ Assistir no YouTube ↗</a></div></div></div>
        <div class="watch-row"><div class="watch-label">Assistido: <strong id="watch-pct">0%</strong></div>${bar(0).replace("progress-bar", "progress-bar watch-bar")}</div>
        <div class="speed-row"><span class="speed-lbl">Velocidade:</span><button class="speed-btn active" data-rate="1">1x</button><button class="speed-btn" data-rate="1.25">1.25x</button><button class="speed-btn" data-rate="1.5">1.5x</button><button class="speed-btn" data-rate="2">2x</button></div>`;
    } else {
      media = `<div class="ext-box"><p class="ext-desc">Este conteúdo abre em uma nova aba${a.platform ? ` (<strong>${esc(a.platform)}</strong>)` : ""}. Veja tudo e volte para marcar como concluído.</p><a class="btn btn-primary" href="${esc(a.url)}" target="_blank" rel="noopener">${a.type === "pdf" ? "Abrir documento" : "Abrir conteúdo"} ↗</a></div>`;
    }
    const gid = effGroup(a.id);
    return `<button class="back" data-back-group="${gid}">‹ Voltar</button>
      <h1 class="page-title aula-h1">${esc(dname(a.id, a.title))}</h1>
      ${a.obs ? `<div class="obs-card"><strong>Orientação:</strong> ${esc(a.obs)}</div>` : ""}${media}
      <div id="post-done"></div>
      ${admin ? `<div class="aula-actions"><button class="btn btn-ghost" data-back-group="${gid}">Voltar</button></div>` : `<div class="aula-actions"><button class="btn ${done ? "btn-done" : "btn-primary"}" id="mark-done">${done ? "✓ Concluída" : "Marcar como concluída"}</button><button class="btn btn-ghost" data-back-group="${gid}">Voltar</button></div>`}`;
  }
  function mountAula() {
    const a = (lessonInfo(App.lessonId) || {}).lesson; if (!a) return;
    const admin = App.user.role === "admin", u = App.user.username;
    const markBtn = document.getElementById("mark-done");
    const t = trackOf(effGroup(a.id));
    const offer = () => { const g = groupById(effGroup(a.id)); const ls = userGroupLessons(u, g.id); if (ls.length && ls.every(l => lessonState(u, l).st === "concluida") && quizReady(g.id)) { const pd = document.getElementById("post-done"); if (pd && !pd.innerHTML) { pd.innerHTML = `<div class="prova-unlocked">✅ Agrupamento concluído! A prova foi liberada.</div><button class="btn btn-primary" id="goprova">Fazer a prova agora →</button>`; const gp = document.getElementById("goprova"); if (gp) gp.onclick = () => go("prova", { groupId: g.id }); } } };
    const setDone = () => { window.Store.setLesson(u, a.id, { status: "concluida", completedAt: new Date().toISOString() }); if (markBtn) { markBtn.textContent = "✓ Concluída"; markBtn.classList.remove("btn-primary"); markBtn.classList.add("btn-done"); } offer(); };
    if (markBtn) markBtn.onclick = setDone;
    if (!isVideo(a) || location.protocol === "file:") return;
    loadYT().then(() => {
      const ex = window.Store.getLesson(u, a.id); let maxPct = ex ? (ex.watchedPct || 0) : 0;
      const vars = { rel: 0, modestbranding: 1, playsinline: 1, enablejsapi: 1, origin: location.origin };
      if (a.type === "playlist" && a.listId) { vars.list = a.listId; vars.listType = "playlist"; }
      player = new YT.Player("yt-player", { videoId: a.videoId, playerVars: vars, events: {
        onReady: () => {
          try { const f = player.getIframe(); if (f) f.setAttribute("referrerpolicy", "strict-origin-when-cross-origin"); } catch (e) {}
          document.querySelectorAll(".speed-btn").forEach(b => b.onclick = () => { try { player.setPlaybackRate(Number(b.getAttribute("data-rate"))); } catch (e) {} document.querySelectorAll(".speed-btn").forEach(x => x.classList.remove("active")); b.classList.add("active"); });
          if (!admin) { const c0 = window.Store.getLesson(u, a.id); if (!c0 || c0.status !== "concluida") window.Store.setLesson(u, a.id, { status: "em_andamento" }); }
          pollTimer = setInterval(() => {
            if (!player || !player.getDuration) return; const d = player.getDuration(), cur = player.getCurrentTime(); if (!d) return;
            const pct = Math.min(100, Math.round(cur / d * 100)); if (pct > maxPct) maxPct = pct;
            const el = document.getElementById("watch-pct"), bb = document.querySelector(".watch-bar .progress-fill"); if (el) el.textContent = maxPct + "%"; if (bb) bb.style.width = maxPct + "%";
            if (!admin) { const c2 = window.Store.getLesson(u, a.id) || {}; if (c2.status !== "concluida") window.Store.setLesson(u, a.id, { watchedPct: maxPct }); if (maxPct >= 90 && c2.status !== "concluida") setDone(); }
          }, 1000);
        },
        onError: () => { const fb = document.getElementById("yt-fallback"); if (fb) fb.hidden = false; }
      } });
    });
  }

  /* ---------- PROVA (por agrupamento) ---------- */
  function viewProva() {
    const g = groupById(App.groupId); if (!g) return viewTrilhas();
    const q = QUIZZES[g.id], u = App.user.username;
    if (!quizReady(g.id)) return `<button class="back" data-back-group="${g.id}">‹ Voltar</button><div class="empty"><h2>Prova em preparação</h2><p>A prova deste agrupamento será disponibilizada pelo gestor.</p></div>`;
    const ls = userGroupLessons(u, g.id);
    if (!(ls.length && ls.every(l => lessonState(u, l).st === "concluida"))) return `<button class="back" data-back-group="${g.id}">‹ Voltar</button><div class="empty"><h2>🔒 Prova bloqueada</h2><p>Conclua todos os vídeos do agrupamento para liberar a prova.</p></div>`;
    const pass = q.passScore || 70;
    const items = q.questions.map((qq, i) => `<div class="quiz-q" data-q="${i}"><div class="quiz-enun"><span>${i + 1}.</span> ${esc(qq.q)}</div><div class="quiz-opts">${qq.options.map((o, j) => `<label class="quiz-opt"><input type="radio" name="q${i}" value="${j}"><span>${esc(o)}</span></label>`).join("")}</div></div>`).join("");
    return `<button class="back" data-back-group="${g.id}">‹ Voltar</button><h1 class="page-title">Prova — ${esc(dname(g.id, g.title))}</h1>
      <p class="page-sub">Responda todas. Nota mínima: <strong>${pass}%</strong>.</p><div class="draft-flag">✎ Prova em rascunho — pode ser revisada pelo gestor.</div>
      <div class="quiz">${items}</div><div id="quiz-result" class="quiz-result" hidden></div><button class="btn btn-primary btn-block" id="quiz-submit">Enviar respostas</button>`;
  }
  function wireProva() {
    const g = groupById(App.groupId); if (!g || !quizReady(g.id)) return;
    const q = QUIZZES[g.id], u = App.user.username, pass = q.passScore || 70;
    const btn = document.getElementById("quiz-submit"); if (!btn) return;
    btn.onclick = () => {
      let answered = 0, correct = 0;
      q.questions.forEach((qq, i) => { const sel = document.querySelector(`input[name="q${i}"]:checked`), box = document.querySelector(`.quiz-q[data-q="${i}"]`); box.classList.remove("right", "wrong"); if (sel) { answered++; if (Number(sel.value) === qq.answer) { correct++; box.classList.add("right"); } else box.classList.add("wrong"); } });
      const res = document.getElementById("quiz-result");
      if (answered < q.questions.length) { res.hidden = false; res.className = "quiz-result warn"; res.textContent = "Responda todas as questões antes de enviar."; return; }
      const score = Math.round(correct / q.questions.length * 100), passed = score >= pass;
      window.Store.setLesson(u, "exam-" + g.id, { status: "exam", score, passed, at: new Date().toISOString() });
      res.hidden = false; res.className = "quiz-result " + (passed ? "pass" : "fail");
      res.innerHTML = `Você acertou <strong>${correct}/${q.questions.length}</strong> = <strong>${score}%</strong> — ${passed ? "✅ Aprovada!" : "❌ Não atingiu a nota. Reveja o conteúdo."}`;
    };
  }

  /* ---------- MEU PROGRESSO (secretária) ---------- */
  function viewProgresso() {
    const u = App.user.username, ov = overall(u);
    const rows = TRACKS.filter(t => !t.locked && trackAssigned(u, t)).map(t => { const s = trackStats(u, t); return `<tr><td>${t.icon} ${esc(dname(t.id, t.title))}</td><td style="min-width:160px">${bar(s.pct)}</td><td class="ta-c">${s.done}/${s.total}</td></tr>`; }).join("");
    return `<div class="page-head"><div><h1 class="page-title">Meu progresso</h1><p class="page-sub">Sua evolução nas trilhas atribuídas a você.</p></div><div class="big-pct"><div class="big-pct-num">${ov.pct}%</div><div class="big-pct-lbl">geral</div></div></div>${bar(ov.pct)}
      <table class="grid-table"><thead><tr><th>Trilha</th><th>Progresso</th><th class="ta-c">Vídeos</th></tr></thead><tbody>${rows || '<tr><td colspan="3" class="muted" style="padding:18px">Nenhuma trilha atribuída ainda.</td></tr>'}</tbody></table>`;
  }

  /* ---------- ADMIN: painel ---------- */
  function viewAdmin() {
    const rows = window.Store.secretarias().map(sec => {
      const u = sec.username, ov = overall(u);
      let pend = 0, aprovar = 0;
      TRACKS.filter(t => !t.locked).forEach(t => t.groups.forEach(g => userGroupLessons(u, g.id).forEach(l => { const s = lessonState(u, l); if (s.st === "pendente") pend++; if (s.st === "concluida" && !s.approved) aprovar++; })));
      return `<tr data-person="${u}"><td><strong>${esc(sec.name)}</strong><div class="muted">${esc(u)}</div></td>
        <td style="min-width:180px">${bar(ov.pct)}<div class="muted">${ov.done}/${ov.total} vídeos</div></td>
        <td class="ta-c big">${ov.pct}%</td><td class="ta-c">${pend}</td><td class="ta-c">${aprovar ? `<span class="tag-warn">${aprovar}</span>` : "0"}</td>
        <td class="ta-c"><button class="btn btn-ghost btn-sm" data-person="${u}">Ver ficha ›</button></td></tr>`;
    }).join("");
    return `<div class="page-head"><div><h1 class="page-title">Painel de evolução</h1><p class="page-sub">Clique numa secretária para ver a ficha, aprovar conclusões e ver prazos.</p></div></div>
      ${window.Store.mode === "firebase" ? `<div class="banner ok"><strong>Painel central ativo.</strong> Sincronizado pela nuvem.</div>` : `<div class="banner"><strong>Modo local.</strong> Mostrando o que foi importado da planilha + o que rolou neste dispositivo. Para sincronizar entre PCs e aprovar de qualquer lugar, ligue o Firebase (README).</div>`}
      <table class="grid-table admin"><thead><tr><th>Secretária</th><th>Progresso</th><th class="ta-c">% Geral</th><th class="ta-c">Pendentes</th><th class="ta-c">A aprovar</th><th></th></tr></thead><tbody>${rows}</tbody></table>`;
  }

  /* ---------- ADMIN: ficha individual ---------- */
  function viewFicha() {
    const u = App.personId; if (!u) return viewAdmin();
    const nome = window.Store.nameOf(u);
    let tempoTot = 0, tempoFeito = 0;
    const blocks = TRACKS.filter(t => !t.locked).map(t => {
      const groups = t.groups.map(g => {
        const ls = userGroupLessons(u, g.id); if (!ls.length) return "";
        const rows = ls.map(l => {
          const s = lessonState(u, l);
          if (l.tempoMin) { tempoTot += l.tempoMin; if (s.st === "concluida") tempoFeito += l.tempoMin; }
          let stHtml, act = "";
          if (s.st === "concluida") {
            const lateTag = (s.date && l.prazo && lateCheck(s.date, l.prazo)) ? ` <span class="tag-late">⏰ atrasado</span>` : "";
            if (s.approved) { stHtml = `<span class="tag-ok">✓ Aprovado</span>${lateTag}`; act = `<button class="mini-btn" data-unapprove="${l.id}">desfazer</button>`; }
            else { stHtml = `<span class="tag-wait">Concluído ${s.date ? "em " + esc(s.date) : ""} · aguardando</span>${lateTag}`; act = `<button class="btn btn-primary btn-sm" data-approve="${l.id}">Aprovar</button>`; }
          } else stHtml = `<span class="tag-pend">Pendente</span>`;
          return `<tr><td>${esc(dname(l.id, l.title))}<div class="muted">${esc(dname(g.id, g.title))}</div></td><td>${stHtml}</td><td class="ta-c muted">${l.prazo ? "prazo " + esc(l.prazo) : "—"}</td><td class="ta-c muted">${l.tempoMin ? l.tempoMin + " min" : "—"}</td><td class="ta-c">${act}</td></tr>`;
        }).join("");
        return rows;
      }).join("");
      if (!groups) return "";
      return `<h3 class="ficha-track">${t.icon} ${esc(dname(t.id, t.title))}</h3><table class="grid-table"><thead><tr><th>Conteúdo</th><th>Status</th><th class="ta-c">Prazo</th><th class="ta-c">Tempo</th><th></th></tr></thead><tbody>${groups}</tbody></table>`;
    }).join("");
    const ov = overall(u);
    return `<button class="back" data-go="admin">‹ Painel</button>
      <div class="page-head"><div><h1 class="page-title">Ficha — ${esc(nome)}</h1><p class="page-sub">Evolução, prazos e aprovação dos conteúdos atribuídos.</p></div><div class="big-pct"><div class="big-pct-num">${ov.pct}%</div><div class="big-pct-lbl">${ov.done}/${ov.total}</div></div></div>
      <div class="tally"><div><span class="muted">Carga de tempo (conteúdos com duração informada)</span><div class="tally-num">${tempoFeito} / ${tempoTot} min</div></div><div class="muted" style="max-width:280px">As durações que faltam você me passa depois — aí a soma mensal fica completa.</div></div>
      ${blocks || '<p class="muted">Nenhum conteúdo atribuído.</p>'}`;
  }

  /* ---------- ADMIN: gerenciar (criar / renomear / mover / atribuir / excluir) ---------- */
  function viewGerenciar() {
    const secs = window.Store.secretarias();
    const blocks = TRACKS.map(t => {
      const groupsHtml = (t.groups || []).map(g => {
        const lessonsHtml = (g.lessons || []).map(l => {
          const chips = secs.map(s => `<button class="chip ${assignedTo(l.id, s.username) ? "on" : ""}" data-assign="${l.id}" data-user="${s.username}" title="${esc(s.name)}">${esc(s.short || s.name[0])}</button>`).join("");
          const moveSel = `<select class="mini-sel" data-move="${l.id}">${(t.groups || []).map(gg => `<option value="${gg.id}" ${g.id === gg.id ? "selected" : ""}>${esc(gg.title)}</option>`).join("")}</select>`;
          return `<div class="man-lesson"><div class="man-l-main"><span class="man-l-title">${esc(l.title)}</span> <button class="mini-btn" data-rename="lesson:${l.id}" title="renomear">✎</button> <button class="mini-btn del" data-del="lesson:${l.id}" title="excluir">🗑</button></div>
            <div class="man-l-ctl"><span class="muted">mover p/:</span> ${moveSel} <span class="muted">quem vê:</span> <span class="chips">${chips}</span></div></div>`;
        }).join("");
        return `<div class="man-group"><div class="man-g-head"><strong>${esc(g.title)}</strong> <button class="mini-btn" data-rename="group:${g.id}" title="renomear">✎</button> <button class="mini-btn del" data-del="group:${g.id}" title="excluir">🗑</button> <button class="mini-btn add" data-addvideo="${g.id}">+ vídeo</button></div>
          ${lessonsHtml || '<p class="muted" style="padding:6px">sem vídeos ainda</p>'}
          <div class="add-lesson-form" data-addform="${g.id}" hidden>
            <input class="af" data-f="title" placeholder="Título do vídeo/conteúdo">
            <select class="af" data-f="type"><option value="youtube">Vídeo (YouTube)</option><option value="external">Curso externo (link)</option><option value="pdf">PDF / Documento</option></select>
            <input class="af" data-f="url" placeholder="Cole o link do YouTube ou do conteúdo">
            <input class="af afp" data-f="prazo" placeholder="Prazo ex: 20/07">
            <input class="af afp" data-f="tempo" type="number" placeholder="Min">
            <button class="btn btn-primary btn-sm" data-addsave="${g.id}">Adicionar</button>
          </div></div>`;
      }).join("");
      return `<div class="man-track"><div class="man-t-head"><h3>${t.icon || "📚"} ${esc(t.title)}${t.locked ? ' <span class="badge badge-soon">Em breve</span>' : ""}</h3>
        <span><button class="mini-btn" data-rename="track:${t.id}">✎ renomear</button> <button class="mini-btn del" data-del="track:${t.id}">🗑 excluir</button></span></div>
        ${groupsHtml || ""}
        <button class="mini-btn add" data-addgroup="${t.id}">+ agrupamento</button></div>`;
    }).join("");
    return `<div class="page-head"><div><h1 class="page-title">Gerenciar conteúdo</h1><p class="page-sub">Crie e organize trilhas, agrupamentos e vídeos. As mudanças aparecem para as secretárias.</p></div></div>
      ${window.Store.mode === "firebase" ? `<div class="banner ok">✅ As mudanças aqui <strong>salvam na nuvem</strong> e chegam a todas as secretárias. As iniciais coloridas = quem vê o conteúdo.</div>` : `<div class="banner">⚠️ Modo local: as mudanças ficam só neste computador até o Firebase estar conectado.</div>`}
      <button class="btn btn-primary" data-addtrack="1">+ Nova trilha</button>
      <div style="margin-top:14px">${blocks}</div>`;
  }

  /* ---------- pós-render ---------- */
  function afterRender() {
    document.querySelectorAll("[data-track]").forEach(el => el.onclick = () => go("trilha", { trackId: el.getAttribute("data-track") }));
    document.querySelectorAll("[data-lesson]").forEach(el => el.onclick = () => go("aula", { lessonId: el.getAttribute("data-lesson") }));
    document.querySelectorAll("[data-back-group]").forEach(el => el.onclick = () => { const g = groupById(el.getAttribute("data-back-group")); go("trilha", { trackId: g ? trackOf(g.id).id : App.trackId }); });
    document.querySelectorAll("[data-prova]").forEach(el => el.onclick = () => go("prova", { groupId: el.getAttribute("data-prova") }));
    document.querySelectorAll("[data-person]").forEach(el => el.onclick = () => go("ficha", { personId: el.getAttribute("data-person") }));
    if (App.view === "aula") mountAula();
    if (App.view === "prova") wireProva();
    if (App.view === "senha") wireChangePw(false);
    if (App.view === "ficha") {
      document.querySelectorAll("[data-approve]").forEach(el => el.onclick = () => { window.Store.setApproved(App.personId, el.getAttribute("data-approve"), true); render(); });
      document.querySelectorAll("[data-unapprove]").forEach(el => el.onclick = () => { window.Store.setApproved(App.personId, el.getAttribute("data-unapprove"), false); render(); });
    }
    if (App.view === "gerenciar") wireGerenciar();
  }
  function wireGerenciar() {
    const findTrack = id => TRACKS.find(t => t.id === id);
    const findGroup = gid => { for (const t of TRACKS) { const g = (t.groups || []).find(x => x.id === gid); if (g) return { t, g }; } return null; };
    const findLesson = lid => { for (const t of TRACKS) for (const g of (t.groups || [])) { const i = (g.lessons || []).findIndex(x => x.id === lid); if (i >= 0) return { t, g, i, l: g.lessons[i] }; } return null; };

    document.querySelectorAll("[data-rename]").forEach(el => el.onclick = () => {
      const [kind, id] = el.getAttribute("data-rename").split(":");
      let cur = "", apply = null;
      if (kind === "track") { const t = findTrack(id); if (t) { cur = t.title; apply = v => t.title = v; } }
      else if (kind === "group") { const o = findGroup(id); if (o) { cur = o.g.title; apply = v => o.g.title = v; } }
      else { const o = findLesson(id); if (o) { cur = o.l.title; apply = v => o.l.title = v; } }
      if (!apply) return;
      const nv = window.prompt("Novo nome:", cur);
      if (nv !== null && nv.trim()) { apply(nv.trim()); saveCourse(); }
    });
    document.querySelectorAll("[data-del]").forEach(el => el.onclick = () => {
      const [kind, id] = el.getAttribute("data-del").split(":");
      if (!window.confirm("Excluir este item? Não dá para desfazer.")) return;
      if (kind === "track") TRACKS = TRACKS.filter(t => t.id !== id);
      else if (kind === "group") { const o = findGroup(id); if (o) o.t.groups = o.t.groups.filter(g => g.id !== id); }
      else { const o = findLesson(id); if (o) o.g.lessons.splice(o.i, 1); }
      saveCourse();
    });
    document.querySelectorAll("[data-move]").forEach(el => el.onchange = () => {
      const o = findLesson(el.getAttribute("data-move")), target = el.value;
      if (!o || o.g.id === target) return;
      const tgt = findGroup(target); if (!tgt) return;
      o.g.lessons.splice(o.i, 1); if (!tgt.g.lessons) tgt.g.lessons = []; tgt.g.lessons.push(o.l); saveCourse();
    });
    document.querySelectorAll("[data-assign]").forEach(el => el.onclick = () => {
      const id = el.getAttribute("data-assign"), us = el.getAttribute("data-user");
      const o = findLesson(id); if (!o) return;
      if (!o.l.assign) o.l.assign = {};
      o.l.assign[us] = !assignedTo(id, us); saveCourse();
    });
    const at = document.querySelector("[data-addtrack]");
    if (at) at.onclick = () => {
      const name = window.prompt("Nome da nova trilha:", ""); if (!name || !name.trim()) return;
      TRACKS.push({ id: uid("t"), title: name.trim(), icon: "📚", description: "", groups: [{ id: uid("g"), title: "Agrupamento 1", lessons: [] }] }); saveCourse();
    };
    document.querySelectorAll("[data-addgroup]").forEach(el => el.onclick = () => {
      const t = findTrack(el.getAttribute("data-addgroup")); if (!t) return;
      const name = window.prompt("Nome do agrupamento:", ""); if (!name || !name.trim()) return;
      if (!t.groups) t.groups = []; t.groups.push({ id: uid("g"), title: name.trim(), lessons: [] }); saveCourse();
    });
    document.querySelectorAll("[data-addvideo]").forEach(el => el.onclick = () => {
      const f = document.querySelector('[data-addform="' + el.getAttribute("data-addvideo") + '"]'); if (f) f.hidden = !f.hidden;
    });
    document.querySelectorAll("[data-addsave]").forEach(el => el.onclick = () => {
      const gid = el.getAttribute("data-addsave"), form = document.querySelector('[data-addform="' + gid + '"]'); if (!form) return;
      const val = f => { const i = form.querySelector('[data-f="' + f + '"]'); return i ? String(i.value).trim() : ""; };
      const title = val("title"); if (!title) { alert("Dê um título ao conteúdo."); return; }
      const o = findGroup(gid); if (!o) return;
      const type = val("type"), url = val("url"), prazo = val("prazo"), tempo = val("tempo");
      const lesson = { id: uid("l"), title: title, assign: {} };
      if (type === "youtube") { lesson.type = "youtube"; lesson.videoId = ytId(url) || url; }
      else { lesson.type = type; lesson.url = url; }
      if (prazo) lesson.prazo = prazo;
      if (tempo && !isNaN(Number(tempo))) lesson.tempoMin = Number(tempo);
      if (!o.g.lessons) o.g.lessons = []; o.g.lessons.push(lesson); saveCourse();
    });
  }

  /* ---------- marca ---------- */
  function logoSVG() { return `<svg class="logo" viewBox="0 0 48 48" width="34" height="34" aria-hidden="true"><circle cx="24" cy="24" r="22" fill="#0e7c66"/><path d="M24 11l13 6-13 6-13-6 13-6z" fill="#fff"/><path d="M16 22v7c0 2.5 3.6 4.5 8 4.5s8-2 8-4.5v-7l-8 3.7-8-3.7z" fill="#fff" opacity=".85"/><rect x="36" y="17" width="2" height="9" rx="1" fill="#fff"/></svg>`; }
  function brandBlock() { return `<div class="auth-brand">${logoSVG()}<div><div class="auth-brand-name">Faculdade <strong>Bhariátrica</strong></div><div class="auth-brand-sub">Treinamento & Qualificação</div></div></div>`; }

  window.Store.init().then(() => { try { TRACKS = window.Store.getTracks(); } catch (e) {} rebuild(); render(); }).catch(() => { rebuild(); render(); });
})();
