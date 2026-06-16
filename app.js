/* ============================================================
   FACULDADE BHARIÁTRICA — Aplicativo (lógica da interface)
   Conteúdo/usuários = courseData.js | Firebase = firebase-config.js
   Dados/sync = store.js. Você normalmente não mexe aqui.
   ============================================================ */
(function () {
  const COURSE = window.COURSE;
  const TRACKS = COURSE.tracks;
  const QUIZZES = COURSE.quizzes || {};
  const root = document.getElementById("app");

  const App = { user: null, view: "login", trackId: null, lessonId: null };
  let ytReady = null, player = null, pollTimer = null;

  /* ---------------- utilidades ---------------- */
  function esc(s) {
    return String(s == null ? "" : s).replace(/[&<>"']/g, c =>
      ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c]));
  }
  function trackById(id) { return TRACKS.find(t => t.id === id); }
  function isVideo(l) { return l.type === "youtube" || l.type === "playlist"; }

  function contentBadge(l) {
    if (isVideo(l)) return { txt: "Vídeo", cls: "badge-video" };
    if (l.type === "pdf") return { txt: "PDF / Doc", cls: "badge-pdf" };
    return { txt: "Curso externo", cls: "badge-link" };
  }
  function lessonStatus(lessonId) {
    const l = window.Store.getLesson(App.user.username, lessonId);
    return l ? l.status : "nao_iniciada";
  }
  function trackStats(track, username) {
    username = username || App.user.username;
    const total = track.lessons.length;
    let done = 0;
    track.lessons.forEach(a => { const l = window.Store.getLesson(username, a.id); if (l && l.status === "concluida") done++; });
    return { total, done, pct: total ? Math.round((done / total) * 100) : 0 };
  }
  function overallStats(username) {
    username = username || App.user.username;
    let total = 0, done = 0;
    TRACKS.filter(t => !t.locked).forEach(t => { const s = trackStats(t, username); total += s.total; done += s.done; });
    return { total, done, pct: total ? Math.round((done / total) * 100) : 0 };
  }
  function quizFor(trackId) {
    const q = QUIZZES[trackId];
    return (q && q.questions && q.questions.length) ? q : null;
  }
  function progressBar(pct) { return `<div class="progress-bar"><div class="progress-fill" style="width:${pct}%"></div></div>`; }

  /* ---------------- YouTube ---------------- */
  function loadYT() {
    if (ytReady) return ytReady;
    ytReady = new Promise(res => {
      if (window.YT && window.YT.Player) return res();
      window.onYouTubeIframeAPIReady = () => res();
      const t = document.createElement("script"); t.src = "https://www.youtube.com/iframe_api"; document.head.appendChild(t);
    });
    return ytReady;
  }
  function stopPlayer() {
    if (pollTimer) { clearInterval(pollTimer); pollTimer = null; }
    if (player && player.destroy) { try { player.destroy(); } catch (e) {} }
    player = null;
  }

  /* ---------------- navegação ---------------- */
  function go(view, params) {
    stopPlayer();
    App.view = view;
    if (params) { if (params.trackId !== undefined) App.trackId = params.trackId; if (params.lessonId !== undefined) App.lessonId = params.lessonId; }
    render(); window.scrollTo(0, 0);
  }
  function logout() { App.user = null; go("login"); }

  /* ---------------- render principal ---------------- */
  function render() {
    if (!App.user) return renderLogin();
    if (App.view === "change-required") return renderChangePassword(true);
    let body = "";
    switch (App.view) {
      case "trilhas": body = viewTrilhas(); break;
      case "trilha": body = viewTrilha(); break;
      case "aula": body = viewAula(); break;
      case "progresso": body = viewProgresso(); break;
      case "senha": body = renderChangePasswordInner(false); break;
      case "admin": body = viewAdmin(); break;
      case "prova": body = viewProva(); break;
      default: body = viewTrilhas();
    }
    root.innerHTML = shell(body);
    wireHeader(); afterRender();
  }

  /* ---------------- LOGIN ---------------- */
  function renderLogin() {
    root.innerHTML = `
      <div class="auth-wrap"><div class="auth-card">
        ${brandBlock()}
        <h1 class="auth-title">Entrar</h1>
        <p class="auth-sub">Plataforma de treinamento da equipe de secretaria</p>
        <div class="field"><label>Usuário</label><input id="lg-user" type="text" autocomplete="username" placeholder="ex.: lucila" /></div>
        <div class="field"><label>Senha</label><input id="lg-pass" type="password" autocomplete="current-password" placeholder="Sua senha" /></div>
        <div id="lg-err" class="form-err" hidden></div>
        <button id="lg-btn" class="btn btn-primary btn-block">Entrar</button>
        <p class="auth-hint">Primeiro acesso? Use a senha padrão informada pelo Lucas. O sistema vai pedir para você criar a sua própria.</p>
      </div></div>`;
    const submit = async () => {
      const u = document.getElementById("lg-user").value;
      const p = document.getElementById("lg-pass").value;
      const user = window.Store.login(u, p);
      const err = document.getElementById("lg-err");
      if (!user) { err.hidden = false; err.textContent = "Usuário ou senha incorretos."; return; }
      App.user = user;
      if (user.mustChange) { App.view = "change-required"; render(); return; }
      if (window.Store.mode === "firebase") { try { await window.Store.pullUser(user.username); } catch (e) {} }
      go(user.role === "admin" ? "admin" : "trilhas");
    };
    document.getElementById("lg-btn").onclick = submit;
    document.getElementById("lg-pass").addEventListener("keydown", e => { if (e.key === "Enter") submit(); });
    document.getElementById("lg-user").focus();
  }

  /* ---------------- TROCAR SENHA ---------------- */
  function renderChangePassword(required) {
    root.innerHTML = `<div class="auth-wrap"><div class="auth-card">${brandBlock()}${renderChangePasswordInner(required)}</div></div>`;
    wireChangePassword(required);
  }
  function renderChangePasswordInner(required) {
    return `
      <h1 class="auth-title">${required ? "Crie sua senha" : "Trocar senha"}</h1>
      <p class="auth-sub">${required ? "Por segurança, defina uma senha só sua para o primeiro acesso." : "Defina uma nova senha de acesso."}</p>
      ${required ? "" : `<div class="field"><label>Senha atual</label><input id="cp-old" type="password" autocomplete="current-password"></div>`}
      <div class="field"><label>Nova senha</label><input id="cp-new" type="password" autocomplete="new-password" placeholder="Mínimo 4 caracteres"></div>
      <div class="field"><label>Confirmar nova senha</label><input id="cp-new2" type="password" autocomplete="new-password"></div>
      <div id="cp-err" class="form-err" hidden></div>
      <div id="cp-ok" class="form-ok" hidden></div>
      <button id="cp-btn" class="btn btn-primary btn-block">Salvar nova senha</button>`;
  }
  function wireChangePassword(required) {
    document.getElementById("cp-btn").onclick = async () => {
      const err = document.getElementById("cp-err"), ok = document.getElementById("cp-ok");
      err.hidden = true; ok.hidden = true;
      const n1 = document.getElementById("cp-new").value, n2 = document.getElementById("cp-new2").value;
      if (!required) {
        const old = document.getElementById("cp-old").value;
        if (!window.Store.login(App.user.username, old)) { err.hidden = false; err.textContent = "Senha atual incorreta."; return; }
      }
      if (n1.length < 4) { err.hidden = false; err.textContent = "A nova senha precisa ter pelo menos 4 caracteres."; return; }
      if (n1 !== n2) { err.hidden = false; err.textContent = "As senhas não conferem."; return; }
      window.Store.changePassword(App.user.username, n1);
      App.user.mustChange = false;
      if (required) {
        if (window.Store.mode === "firebase") { try { await window.Store.pullUser(App.user.username); } catch (e) {} }
        go(App.user.role === "admin" ? "admin" : "trilhas");
      } else { ok.hidden = false; ok.textContent = "Senha alterada com sucesso!"; }
    };
  }

  /* ---------------- SHELL ---------------- */
  function shell(body) {
    const isAdmin = App.user.role === "admin";
    const nav = isAdmin
      ? `<button class="nav-btn" data-go="admin">Painel</button><button class="nav-btn" data-go="trilhas">Trilhas</button><button class="nav-btn" data-go="senha">Trocar senha</button>`
      : `<button class="nav-btn" data-go="trilhas">Trilhas</button><button class="nav-btn" data-go="progresso">Meu progresso</button><button class="nav-btn" data-go="senha">Trocar senha</button>`;
    return `
      <header class="header"><div class="header-inner">
        <div class="brand-row" data-go="${isAdmin ? "admin" : "trilhas"}">${logoSVG()}<span class="brand-name">Faculdade <strong>Bhariátrica</strong></span></div>
        <nav class="nav">${nav}</nav>
        <div class="user-box"><span class="user-name">${esc(App.user.nome)}</span><button class="btn btn-ghost btn-sm" id="logout">Sair</button></div>
      </div></header>
      <main class="container">${body}</main>
      <footer class="foot">Faculdade Bhariátrica · plataforma interna de treinamento</footer>`;
  }
  function wireHeader() {
    const lo = document.getElementById("logout"); if (lo) lo.onclick = logout;
    document.querySelectorAll("[data-go]").forEach(el => el.onclick = () => go(el.getAttribute("data-go")));
  }

  /* ---------------- LISTA DE TRILHAS ---------------- */
  function viewTrilhas() {
    const ov = overallStats();
    const cards = TRACKS.map(t => {
      const s = trackStats(t), locked = t.locked;
      return `
        <div class="trilha-card ${locked ? "locked" : ""}" ${locked ? "" : `data-track="${t.id}"`}>
          <div class="trilha-top"><span class="trilha-ico">${t.icon || "📚"}</span>${locked ? `<span class="badge badge-soon">Em breve</span>` : `<span class="trilha-pct">${s.pct}%</span>`}</div>
          <h3 class="trilha-name">${esc(t.title)}</h3>
          <p class="trilha-desc">${esc(t.description || "")}</p>
          ${locked ? "" : progressBar(s.pct)}
          <div class="trilha-meta">${locked ? `${t.lessons.length} conteúdos` : `${s.done}/${s.total} concluídos`}</div>
        </div>`;
    }).join("");
    return `
      <div class="page-head">
        <div><h1 class="page-title">Olá, ${esc(App.user.nome.split(" ")[0])} 👋</h1>
        <p class="page-sub">Sua evolução geral está em <strong>${ov.pct}%</strong>. Bora avançar nas trilhas!</p></div>
        <div class="big-pct"><div class="big-pct-num">${ov.pct}%</div><div class="big-pct-lbl">evolução</div></div>
      </div>
      ${progressBar(ov.pct)}
      <div class="trilha-grid">${cards}</div>`;
  }

  /* ---------------- DETALHE DA TRILHA ---------------- */
  function viewTrilha() {
    const t = trackById(App.trackId); if (!t) return viewTrilhas();
    const s = trackStats(t);
    const rows = t.lessons.map((a, i) => {
      const done = lessonStatus(a.id) === "concluida", b = contentBadge(a);
      return `
        <div class="aula-row" data-lesson="${a.id}">
          <div class="aula-check ${done ? "on" : ""}">${done ? "✓" : i + 1}</div>
          <div class="aula-info"><div class="aula-title">${esc(a.title)}</div>
            <div class="aula-sub"><span class="badge ${b.cls}">${b.txt}</span>${a.platform ? `<span class="aula-time">${esc(a.platform)}</span>` : ""}${a.obs ? `<span class="aula-obs-flag">★ orientação</span>` : ""}</div>
          </div>
          <div class="aula-go">${done ? "Revisar" : "Abrir"} ›</div>
        </div>`;
    }).join("");

    const quiz = quizFor(t.id), exam = window.Store.getExam(App.user.username, t.id);
    const complete = s.total > 0 && s.done === s.total;
    let examBox;
    if (t.locked) { examBox = ""; }
    else if (!quiz) {
      examBox = `<div class="exam-box soon"><div><strong>Prova ${esc(t.title)}</strong><p>Em preparação — as questões serão adicionadas em breve.</p></div><button class="btn btn-ghost" disabled>Indisponível</button></div>`;
    } else if (!complete) {
      examBox = `<div class="exam-box soon"><div><strong>Prova ${esc(t.title)}</strong><p>🔒 Conclua todas as aulas da trilha para liberar a prova. <strong>(${s.done}/${s.total})</strong></p></div><button class="btn btn-ghost" disabled>🔒 Bloqueada</button></div>`;
    } else {
      const pass = quiz.passScore || 70;
      examBox = `<div class="exam-box"><div><strong>Prova ${esc(t.title)}</strong><p>${exam ? `Você fez: <strong>${exam.score}%</strong> — ${exam.passed ? "✅ Aprovada" : "❌ Refazer"}` : `${quiz.questions.length} questões · nota mínima ${pass}%`}</p></div><button class="btn btn-primary" data-prova="${t.id}">${exam ? "Refazer prova" : "Fazer prova"}</button></div>`;
    }
    return `
      <button class="back" data-go="trilhas">‹ Trilhas</button>
      <div class="page-head"><div><h1 class="page-title">${t.icon} ${esc(t.title)}</h1><p class="page-sub">${esc(t.description || "")}</p></div>
      <div class="big-pct"><div class="big-pct-num">${s.pct}%</div><div class="big-pct-lbl">${s.done}/${s.total}</div></div></div>
      ${progressBar(s.pct)}
      <div class="aula-list">${rows}</div>
      ${examBox}`;
  }

  /* ---------------- AULA (player / conteúdo) ---------------- */
  function viewAula() {
    const t = trackById(App.trackId);
    const a = t && t.lessons.find(x => x.id === App.lessonId);
    if (!a) return viewTrilha();
    const done = lessonStatus(a.id) === "concluida";
    let media;
    if (isVideo(a)) {
      const watchUrl = "https://www.youtube.com/watch?v=" + (a.videoId || "") + (a.type === "playlist" && a.listId ? "&list=" + a.listId : "");
      if (location.protocol === "file:") {
        media = `<div class="file-warn">⚠️ Você abriu o site por <strong>arquivo (duplo-clique)</strong>. Os vídeos do YouTube só tocam embutidos quando o site está <strong>publicado online</strong> (veja o README). Por enquanto, assista pelo botão abaixo.</div>
          <div class="ext-box"><p class="ext-desc">Vídeo: <strong>${esc(a.title)}</strong></p><a class="btn btn-primary" href="${watchUrl}" target="_blank" rel="noopener">▶ Assistir no YouTube ↗</a></div>`;
      } else {
        media = `<div class="player-wrap"><div id="yt-player"></div>
            <div id="yt-fallback" class="yt-fallback" hidden><div class="yt-fallback-inner">
              <p>Não deu para tocar o vídeo aqui dentro.<br><span class="muted">Isso pode acontecer quando o dono do vídeo bloqueia a incorporação.</span></p>
              <a class="btn btn-primary" href="${watchUrl}" target="_blank" rel="noopener">▶ Assistir no YouTube ↗</a>
            </div></div>
          </div>
          <div class="watch-row"><div class="watch-label">Assistido: <strong id="watch-pct">0%</strong></div>${progressBar(0).replace("progress-bar", "progress-bar watch-bar")}</div>
          <div class="speed-row"><span class="speed-lbl">Velocidade:</span><button class="speed-btn active" data-rate="1">1x</button><button class="speed-btn" data-rate="1.25">1.25x</button><button class="speed-btn" data-rate="1.5">1.5x</button><button class="speed-btn" data-rate="2">2x</button></div>`;
      }
    } else {
      const label = a.type === "pdf" ? "Abrir documento" : "Abrir conteúdo";
      media = `<div class="ext-box"><p class="ext-desc">Este conteúdo abre em uma nova aba${a.platform ? ` (<strong>${esc(a.platform)}</strong>)` : ""}. Assista/leia tudo e depois volte aqui para marcar como concluído.</p>
        <a class="btn btn-primary" href="${esc(a.url)}" target="_blank" rel="noopener">${label} ↗</a></div>`;
    }
    return `
      <button class="back" data-back-track="${t.id}">‹ ${esc(t.title)}</button>
      <h1 class="page-title aula-h1">${esc(a.title)}</h1>
      ${a.obs ? `<div class="obs-card"><strong>Orientação:</strong> ${esc(a.obs)}</div>` : ""}
      ${media}
      <div id="post-done"></div>
      <div class="aula-actions">
        <button class="btn ${done ? "btn-done" : "btn-primary"}" id="mark-done">${done ? "✓ Concluída" : "Marcar como concluída"}</button>
        <button class="btn btn-ghost" data-back-track="${t.id}">Voltar à trilha</button>
      </div>`;
  }
  function mountAula() {
    const t = trackById(App.trackId);
    const a = t && t.lessons.find(x => x.id === App.lessonId);
    if (!a) return;
    const markBtn = document.getElementById("mark-done");
    const offerProva = () => {
      const s = trackStats(t);
      if (s.total > 0 && s.done === s.total && quizFor(t.id)) {
        const pd = document.getElementById("post-done");
        if (pd && !pd.innerHTML) {
          pd.innerHTML = `<div class="prova-unlocked">✅ Trilha concluída! A prova foi liberada.</div><button class="btn btn-primary" id="goprova">Fazer a prova agora →</button>`;
          const gp = document.getElementById("goprova"); if (gp) gp.onclick = () => go("prova", { trackId: t.id });
        }
      }
    };
    const setDone = () => {
      window.Store.setLesson(App.user.username, a.id, { status: "concluida", completedAt: new Date().toISOString() });
      if (markBtn) { markBtn.textContent = "✓ Concluída"; markBtn.classList.remove("btn-primary"); markBtn.classList.add("btn-done"); }
      offerProva();
    };
    if (markBtn) markBtn.onclick = setDone;

    if (!isVideo(a)) return;
    if (location.protocol === "file:") return;   // sem player embutido no modo arquivo (file://)
    loadYT().then(() => {
      const existing = window.Store.getLesson(App.user.username, a.id);
      let maxPct = existing ? (existing.watchedPct || 0) : 0;
      const vars = { rel: 0, modestbranding: 1, playsinline: 1, enablejsapi: 1, origin: location.origin };
      if (a.type === "playlist" && a.listId) { vars.list = a.listId; vars.listType = "playlist"; }
      player = new YT.Player("yt-player", {
        videoId: a.videoId, playerVars: vars,
        events: {
          onReady: () => {
            try { const f = player.getIframe(); if (f) f.setAttribute("referrerpolicy", "strict-origin-when-cross-origin"); } catch (e) {}
            document.querySelectorAll(".speed-btn").forEach(b => b.onclick = () => {
              try { player.setPlaybackRate(Number(b.getAttribute("data-rate"))); } catch (e) {}
              document.querySelectorAll(".speed-btn").forEach(x => x.classList.remove("active"));
              b.classList.add("active");
            });
            const cur0 = window.Store.getLesson(App.user.username, a.id);
            if (!cur0 || cur0.status !== "concluida") window.Store.setLesson(App.user.username, a.id, { status: "em_andamento" });
            pollTimer = setInterval(() => {
              if (!player || !player.getDuration) return;
              const d = player.getDuration(), cur = player.getCurrentTime();
              if (!d) return;
              const pct = Math.min(100, Math.round((cur / d) * 100));
              if (pct > maxPct) maxPct = pct;
              const el = document.getElementById("watch-pct"), bar = document.querySelector(".watch-bar .progress-fill");
              if (el) el.textContent = maxPct + "%"; if (bar) bar.style.width = maxPct + "%";
              const c2 = window.Store.getLesson(App.user.username, a.id) || {};
              if (c2.status !== "concluida") window.Store.setLesson(App.user.username, a.id, { watchedPct: maxPct });
              if (maxPct >= 90 && c2.status !== "concluida") setDone();
            }, 1000);
          },
          onError: () => { const fb = document.getElementById("yt-fallback"); if (fb) fb.hidden = false; }
        }
      });
    });
  }

  /* ---------------- MEU PROGRESSO ---------------- */
  function viewProgresso() {
    const ov = overallStats();
    const rows = TRACKS.filter(t => !t.locked).map(t => {
      const s = trackStats(t), exam = window.Store.getExam(App.user.username, t.id);
      return `<tr><td>${t.icon} ${esc(t.title)}</td><td style="min-width:160px">${progressBar(s.pct)}</td>
        <td class="ta-c">${s.done}/${s.total}</td><td class="ta-c">${exam ? `${exam.score}% ${exam.passed ? "✅" : "❌"}` : "—"}</td></tr>`;
    }).join("");
    return `
      <div class="page-head"><div><h1 class="page-title">Meu progresso</h1><p class="page-sub">Acompanhe sua evolução em cada trilha.</p></div>
      <div class="big-pct"><div class="big-pct-num">${ov.pct}%</div><div class="big-pct-lbl">geral</div></div></div>
      ${progressBar(ov.pct)}
      <table class="grid-table"><thead><tr><th>Trilha</th><th>Progresso</th><th class="ta-c">Aulas</th><th class="ta-c">Prova</th></tr></thead><tbody>${rows}</tbody></table>
      ${window.Store.mode === "local" ? `<div class="export-row"><p>Quer mandar seu progresso para o Lucas? Exporte um arquivo e envie para ele.</p><button class="btn btn-ghost" id="export-me">⬇ Exportar meu progresso</button></div>` : ""}`;
  }

  /* ---------------- PROVA ---------------- */
  function viewProva() {
    const t = trackById(App.trackId), quiz = quizFor(t.id);
    if (!quiz) return `<button class="back" data-back-track="${t.id}">‹ ${esc(t.title)}</button><div class="empty"><h2>Prova em preparação</h2><p>As questões desta trilha ainda serão adicionadas.</p></div>`;
    const s = trackStats(t);
    if (!(s.total > 0 && s.done === s.total)) return `<button class="back" data-back-track="${t.id}">‹ ${esc(t.title)}</button><div class="empty"><h2>🔒 Prova bloqueada</h2><p>Conclua todas as aulas da trilha para liberar a prova. (${s.done}/${s.total})</p></div>`;
    const pass = quiz.passScore || 70;
    const items = quiz.questions.map((q, i) => `
      <div class="quiz-q" data-q="${i}"><div class="quiz-enun"><span>${i + 1}.</span> ${esc(q.q)}</div>
        <div class="quiz-opts">${q.options.map((o, j) => `<label class="quiz-opt"><input type="radio" name="q${i}" value="${j}"><span>${esc(o)}</span></label>`).join("")}</div></div>`).join("");
    return `
      <button class="back" data-back-track="${t.id}">‹ ${esc(t.title)}</button>
      <h1 class="page-title">Prova — ${esc(t.title)}</h1>
      <p class="page-sub">Responda todas as questões. Nota mínima para aprovar: <strong>${pass}%</strong>.</p>
      <div class="draft-flag">✎ Questões em rascunho — serão revisadas com o Lucas.</div>
      <div class="quiz">${items}</div>
      <div id="quiz-result" class="quiz-result" hidden></div>
      <button class="btn btn-primary btn-block" id="quiz-submit">Enviar respostas</button>`;
  }
  function wireProva() {
    const t = trackById(App.trackId), quiz = quizFor(t.id);
    if (!quiz) return;
    const btn = document.getElementById("quiz-submit"); if (!btn) return;
    const pass = quiz.passScore || 70;
    btn.onclick = () => {
      let answered = 0, correct = 0;
      quiz.questions.forEach((q, i) => {
        const sel = document.querySelector(`input[name="q${i}"]:checked`), box = document.querySelector(`.quiz-q[data-q="${i}"]`);
        box.classList.remove("right", "wrong");
        if (sel) { answered++; if (Number(sel.value) === q.answer) { correct++; box.classList.add("right"); } else box.classList.add("wrong"); }
      });
      const res = document.getElementById("quiz-result");
      if (answered < quiz.questions.length) { res.hidden = false; res.className = "quiz-result warn"; res.textContent = "Responda todas as questões antes de enviar."; return; }
      const score = Math.round((correct / quiz.questions.length) * 100), passed = score >= pass;
      window.Store.setExam(App.user.username, t.id, { score, passed, at: new Date().toISOString() });
      res.hidden = false; res.className = "quiz-result " + (passed ? "pass" : "fail");
      res.innerHTML = `Você acertou <strong>${correct}/${quiz.questions.length}</strong> = <strong>${score}%</strong> — ${passed ? "✅ Aprovada!" : "❌ Não atingiu a nota. Reveja o conteúdo e tente novamente."}`;
    };
  }

  /* ---------------- PAINEL ADMIN ---------------- */
  function viewAdmin() {
    const banner = window.Store.mode === "firebase"
      ? `<div class="banner ok"><strong>Painel central ativo.</strong> Mostrando o progresso de todas as secretárias, sincronizado pela nuvem.</div>`
      : `<div class="banner"><strong>Modo local.</strong> Aqui aparece o progresso registrado <em>neste dispositivo</em> + arquivos importados. Para ver todas em tempo real de qualquer lugar, ative o <strong>painel central (Firebase)</strong> — passo a passo no README.<div class="banner-actions"><button class="btn btn-ghost btn-sm" id="import-btn">⬆ Importar progresso (.json)</button><input type="file" id="import-file" accept="application/json" hidden></div></div>`;
    return `
      <div class="page-head"><div><h1 class="page-title">Painel de evolução</h1><p class="page-sub">Percentual de cada secretária nas trilhas.</p></div></div>
      ${banner}
      <table class="grid-table admin"><thead><tr><th>Secretária</th><th>Progresso</th><th class="ta-c">% Geral</th><th class="ta-c">Provas</th></tr></thead>
      <tbody id="admin-rows"><tr><td colspan="4" class="ta-c muted" style="padding:24px">Carregando…</td></tr></tbody></table>`;
  }
  async function fillAdmin() {
    let list = [];
    try { list = await window.Store.fetchAllForAdmin(); } catch (e) { list = []; }
    const totalLessons = TRACKS.filter(t => !t.locked).reduce((n, t) => n + t.lessons.length, 0);
    const rows = list.map(u => {
      let done = 0;
      TRACKS.filter(t => !t.locked).forEach(t => t.lessons.forEach(a => { const l = u.progress[a.id]; if (l && l.status === "concluida") done++; }));
      const pct = totalLessons ? Math.round((done / totalLessons) * 100) : 0;
      const exams = u.exams || {}, feitas = Object.keys(exams).length, aprov = Object.values(exams).filter(e => e.passed).length;
      return `<tr><td><strong>${esc(u.nome)}</strong><div class="muted">${esc(u.username)}</div></td>
        <td style="min-width:200px">${progressBar(pct)}<div class="muted">${done}/${totalLessons} aulas</div></td>
        <td class="ta-c big">${pct}%</td><td class="ta-c">${feitas ? `${aprov}/${feitas} ✅` : "—"}</td></tr>`;
    }).join("");
    const tb = document.getElementById("admin-rows");
    if (tb) tb.innerHTML = rows || `<tr><td colspan="4" class="ta-c muted" style="padding:24px">Sem dados ainda.</td></tr>`;
  }
  function wireAdmin() {
    const ib = document.getElementById("import-btn"), inp = document.getElementById("import-file");
    if (ib && inp) {
      ib.onclick = () => inp.click();
      inp.onchange = () => { const f = inp.files[0]; if (!f) return; const r = new FileReader();
        r.onload = () => { try { window.Store.importSnapshot(JSON.parse(r.result)); render(); } catch (e) { alert("Arquivo inválido."); } };
        r.readAsText(f); };
    }
  }

  /* ---------------- pós-render ---------------- */
  function afterRender() {
    document.querySelectorAll("[data-track]").forEach(el => el.onclick = () => go("trilha", { trackId: el.getAttribute("data-track") }));
    document.querySelectorAll("[data-lesson]").forEach(el => el.onclick = () => go("aula", { lessonId: el.getAttribute("data-lesson") }));
    document.querySelectorAll("[data-back-track]").forEach(el => el.onclick = () => go("trilha", { trackId: el.getAttribute("data-back-track") }));
    document.querySelectorAll("[data-prova]").forEach(el => el.onclick = () => go("prova", { trackId: el.getAttribute("data-prova") }));
    if (App.view === "aula") mountAula();
    if (App.view === "prova") wireProva();
    if (App.view === "admin") { wireAdmin(); fillAdmin(); }
    if (App.view === "senha") wireChangePassword(false);
    if (App.view === "progresso") {
      const ex = document.getElementById("export-me");
      if (ex) ex.onclick = () => {
        const snap = window.Store.snapshot(App.user.username);
        const blob = new Blob([JSON.stringify(snap, null, 2)], { type: "application/json" });
        const a = document.createElement("a"); a.href = URL.createObjectURL(blob); a.download = `progresso-${App.user.username}.json`; a.click();
      };
    }
  }

  /* ---------------- marca ---------------- */
  function logoSVG() {
    return `<svg class="logo" viewBox="0 0 48 48" width="34" height="34" aria-hidden="true">
      <circle cx="24" cy="24" r="22" fill="#0e7c66"/><path d="M24 11l13 6-13 6-13-6 13-6z" fill="#fff"/>
      <path d="M16 22v7c0 2.5 3.6 4.5 8 4.5s8-2 8-4.5v-7l-8 3.7-8-3.7z" fill="#fff" opacity=".85"/>
      <rect x="36" y="17" width="2" height="9" rx="1" fill="#fff"/></svg>`;
  }
  function brandBlock() {
    return `<div class="auth-brand">${logoSVG()}<div><div class="auth-brand-name">Faculdade <strong>Bhariátrica</strong></div><div class="auth-brand-sub">Treinamento & Qualificação</div></div></div>`;
  }

  /* ---------------- start ---------------- */
  window.Store.init().then(render).catch(render);
})();
