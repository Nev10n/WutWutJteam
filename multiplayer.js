/* ==========================================================================
   BRAIN BATTLE — MULTIPLAYER ONLINE (Casual & Ranked)
   --------------------------------------------------------------------------
   Semua mode lain di script.js (Classic/Rank/Chaos/Team/Class) bermain
   melawan BOT lokal, semuanya di dalam satu browser. File ini menambahkan
   mode ONLINE tempat pemain sungguhan dari perangkat berbeda benar-benar
   dipertemukan dan bermain real-time bersama (sisa slot tetap diisi bot
   kalau lawan manusia belum cukup).

   Backend yang dipakai: Firebase Realtime Database. Ini dipilih karena:
   - 100% dijalankan dari sisi klien (cocok untuk hosting statis di Netlify,
     tidak perlu server Node.js/Socket.IO sendiri).
   - Gratis untuk skala prototype (Spark plan).
   - Sinkronisasi realtime + "transaction" bawaan cukup untuk mencegah dua
     pemain merebut soal yang sama di saat bersamaan.

   WAJIB: isi FIREBASE_CONFIG di bawah dengan kredensial proyek Firebase-mu
   sendiri. Selama masih diisi "PASTE_..." tombol ONLINE akan memberi tahu
   pemain bahwa server belum disetel, dan mode lain tetap berjalan normal.
   Lihat README.md bagian "Setup Multiplayer (Firebase)" untuk langkah²nya.
   ========================================================================== */

const FIREBASE_CONFIG = {
  apiKey: "AIzaSyAyXsNIxauPG6hQgkqz3-r1uEFJpcb4_tE",
  authDomain: "brainbattleid.firebaseapp.com",
  databaseURL: "https://brainbattleid-default-rtdb.asia-southeast1.firebasedatabase.app",
  projectId: "brainbattleid",
  appId: "1:296144052367:web:0348cf321e84ebc56a90fa",
};

const MP_ENABLED = !!(
  FIREBASE_CONFIG.apiKey &&
  !FIREBASE_CONFIG.apiKey.startsWith("PASTE_") &&
  FIREBASE_CONFIG.databaseURL &&
  !FIREBASE_CONFIG.databaseURL.startsWith("PASTE_")
);

let mpDb = null;
if (MP_ENABLED) {
  try {
    firebase.initializeApp(FIREBASE_CONFIG);
    mpDb = firebase.database();
  } catch (e) {
    console.log("Gagal menghubungkan ke Firebase:", e);
  }
}

/* ---------------------------- IDENTITAS PEMAIN ---------------------------- */
const MP_UID_KEY = "bb_mp_uid_v1";
function getMyUid() {
  let uid = localStorage.getItem(MP_UID_KEY);
  if (!uid) {
    uid = "p" + Date.now().toString(36) + Math.random().toString(36).slice(2, 8);
    localStorage.setItem(MP_UID_KEY, uid);
  }
  return uid;
}
function getMyName() {
  return (state.account && state.account.username) || "Player" + Math.floor(Math.random() * 999);
}

const BOTS_FOR_ONLINE = ["Tasya", "Faris", "Aisyah", "Daffa", "Nadia", "Raka", "Sinta", "Bima", "Luna", "Kirana", "Yuda", "Wulan"];
const MATCH_WAIT_TIMEOUT_MS = 15000; // kalau 15 detik belum dapat 5 pemain, sisanya diisi bot
const CLAIM_PHASE_MS = 15000;
const REVEAL_PHASE_MS = 3000;
const ANSWER_PHASE_MS = 15000;
const RESULT_PHASE_MS = 1500;

/* ---------------------------- STATE MULTIPLAYER ---------------------------- */
const MP = {
  active: false, // true selama sedang di dalam match online (mengambil alih tombol REBUT SOAL)
  mode: "casual", // "casual" | "ranked"
  jurusan: "ips",
  subject: "PUM",
  uid: null,
  queueKey: null,
  queueRef: null,
  assignmentRef: null,
  queueTimerId: null,
  matchId: null,
  matchRef: null,
  data: null, // salinan lokal state match terakhir dari Firebase
  lastProcessedKey: null, // guard supaya efek fase (mis. peluang bot merebut) tidak dijalankan berulang
  finishedHandled: null,
};

/* ---------------------------- UI: MENU ONLINE ---------------------------- */
function onlineSubjectButtons() {
  renderJurusanGrid("online-jurusan-grid", MP.jurusan, (code) => {
    MP.jurusan = code;
    const list = subjectsByJurusan(code);
    if (!list.some((s) => s.code === MP.subject)) MP.subject = list[0].code;
    onlineSubjectButtons();
  });
  renderSubjectGrid("online-subject-grid", MP.jurusan, MP.subject, (code) => {
    MP.subject = code;
    onlineSubjectButtons();
  });
}

function openOnlineMenu() {
  document.getElementById("online-status-note").classList.toggle("hidden", MP_ENABLED);
  document.getElementById("online-find-btn").classList.toggle("hidden", !MP_ENABLED);
  document.querySelectorAll("[data-online-mode]").forEach((b) => b.classList.toggle("selected-panel", b.dataset.onlineMode === MP.mode));
  onlineSubjectButtons();
  show("online-menu");
  if (!MP_ENABLED) toast("Server multiplayer belum disetel — lihat README.");
}

document.querySelectorAll("[data-online-mode]").forEach(
  (b) =>
    (b.onclick = () => {
      MP.mode = b.dataset.onlineMode;
      document.querySelectorAll("[data-online-mode]").forEach((x) => x.classList.remove("selected-panel"));
      b.classList.add("selected-panel");
    }),
);

document.addEventListener("click", (e) => {
  const a = e.target.closest("[data-action]");
  if (!a) return;
  const act = a.dataset.action;
  if (act === "online") openOnlineMenu();
  if (act === "online-find") startOnlineSearch();
  if (act === "online-cancel") cancelOnlineSearch();
});

/* ---------------------------- ANTREAN / MATCHMAKING ---------------------------- */
function startOnlineSearch() {
  if (!MP_ENABLED) {
    toast("Server multiplayer belum disetel — lihat README.");
    return;
  }
  MP.uid = getMyUid();
  MP.queueKey = `${MP.mode}_${MP.subject}`;

  document.getElementById("online-queue-subtitle").textContent = `${MP.mode === "ranked" ? "Ranked" : "Casual"} • ${MP.subject}`;
  document.getElementById("online-queue-players").innerHTML = "";
  show("online-queue");

  const myEntryRef = mpDb.ref(`queue/${MP.queueKey}`).push();
  MP.queueRef = myEntryRef;
  const joinedAt = Date.now();
  myEntryRef.set({ name: getMyName(), uid: MP.uid, joinedAt });
  myEntryRef.onDisconnect().remove();

  // Begitu matchmaking menemukan lawan, ID match akan muncul di sini.
  MP.assignmentRef = mpDb.ref(`queueAssignment/${MP.uid}`);
  MP.assignmentRef.on("value", (snap) => {
    const matchId = snap.val();
    if (matchId) {
      MP.assignmentRef.off();
      MP.assignmentRef.remove();
      joinOnlineMatch(matchId);
    }
  });

  // Render daftar pemain yang sedang menunggu.
  mpDb.ref(`queue/${MP.queueKey}`).on("value", (snap) => {
    const q = snap.val() || {};
    const list = Object.values(q).sort((a, b) => a.joinedAt - b.joinedAt);
    document.getElementById("online-queue-players").innerHTML = list
      .map((p) => `<div class="queue-player-chip ${p.uid === MP.uid ? "you" : ""}"><span>👤</span><b>${p.name}</b></div>`)
      .join("");
  });

  clearInterval(MP.queueTimerId);
  MP.queueTimerId = setInterval(() => {
    const secs = Math.floor((Date.now() - joinedAt) / 1000);
    const el = document.getElementById("online-queue-timer");
    if (el) el.textContent = `Menunggu ${secs} detik • lawan kurang? sisa slot otomatis diisi bot`;
    attemptMatchmaking(MP.queueKey);
  }, 2000);
  attemptMatchmaking(MP.queueKey);
}

function cancelOnlineSearch() {
  clearInterval(MP.queueTimerId);
  if (MP.queueRef) {
    MP.queueRef.onDisconnect().cancel();
    MP.queueRef.remove();
    MP.queueRef = null;
  }
  if (MP.assignmentRef) {
    MP.assignmentRef.off();
    MP.assignmentRef = null;
  }
  if (MP.queueKey) mpDb.ref(`queue/${MP.queueKey}`).off();
  show("online-menu");
}

// Dijalankan berkala oleh SETIAP klien yang sedang antre. Aman dipanggil
// bersamaan oleh banyak klien karena memakai Firebase transaction: hanya
// satu klien yang benar-benar berhasil "mengambil" sekelompok pemain dari
// antrean, sehingga tidak ada pemain yang masuk ke dua match sekaligus.
function attemptMatchmaking(queueKey) {
  let chosen = null;
  mpDb.ref(`queue/${queueKey}`).transaction(
    (current) => {
      chosen = null;
      if (!current) return current;
      const entries = Object.entries(current).sort((a, b) => a[1].joinedAt - b[1].joinedAt);
      if (!entries.length) return current;
      const oldestWait = Date.now() - entries[0][1].joinedAt;
      const enough = entries.length >= 5;
      const timedOut = oldestWait >= MATCH_WAIT_TIMEOUT_MS;
      if (!enough && !timedOut) return current; // belum saatnya — tidak ada perubahan
      const take = entries.slice(0, 5);
      take.forEach(([pushId]) => delete current[pushId]);
      chosen = take.map(([, v]) => v);
      return current;
    },
    (error, committed) => {
      if (error || !committed || !chosen) return;
      const [mode, ...subjParts] = queueKey.split("_");
      createOnlineMatch(mode, subjParts.join("_"), chosen);
    },
  );
}

function createOnlineMatch(mode, subject, realPlayers) {
  const matchRef = mpDb.ref("matches").push();
  const players = {};
  const scores = {};
  realPlayers.forEach((p) => {
    players[p.uid] = { name: p.name, isBot: false };
    scores[p.uid] = 0;
  });
  const need = Math.max(0, 5 - realPlayers.length);
  shuffle(BOTS_FOR_ONLINE)
    .slice(0, need)
    .forEach((name, i) => {
      const botUid = "bot_" + matchRef.key + "_" + i;
      players[botUid] = { name, isBot: true };
      scores[botUid] = 0;
    });
  // Soal digenerate sekali oleh klien yang membuat match, lalu disimpan di
  // Firebase supaya SEMUA pemain (klien lain) melihat soal yang sama persis.
  const totalQuestions = 20;
  const questionPool = generateMatchQuestions(subject, "SCHOLAR III", totalQuestions);
  matchRef.set({
    mode,
    subject,
    createdAt: Date.now(),
    status: "playing",
    players,
    scores,
    qIndex: 0,
    totalQuestions,
    questionPool,
    phase: "claim",
    phaseEndsAt: Date.now() + CLAIM_PHASE_MS,
    claimantUid: null,
    lastResult: null,
  });
  const updates = {};
  realPlayers.forEach((p) => (updates[`queueAssignment/${p.uid}`] = matchRef.key));
  mpDb.ref().update(updates);
}

/* ---------------------------- BERMAIN DI MATCH ONLINE ---------------------------- */
function joinOnlineMatch(matchId) {
  clearInterval(MP.queueTimerId);
  if (MP.queueRef) {
    MP.queueRef.onDisconnect().cancel();
    MP.queueRef = null;
  }
  if (MP.queueKey) mpDb.ref(`queue/${MP.queueKey}`).off();

  MP.active = true;
  MP.matchId = matchId;
  MP.lastProcessedKey = null;
  MP.finishedHandled = null;
  MP.matchRef = mpDb.ref(`matches/${matchId}`);

  const myConnRef = MP.matchRef.child(`players/${MP.uid}/connected`);
  myConnRef.onDisconnect().set(false);
  myConnRef.set(true);

  document.getElementById("review-btn").classList.add("hidden");
  show("game");
  toast("Lawan ditemukan! Match dimulai.");

  MP.matchRef.on("value", (snap) => {
    const data = snap.val();
    if (!data) return;
    MP.data = data;
    renderOnlineMatch(data);
  });
}

function nameOf(data, uid) {
  const p = data.players[uid];
  return p ? p.name : uid;
}
function isBotUid(uid) {
  return typeof uid === "string" && uid.indexOf("bot_") === 0;
}
function getOnlineQuestion(data) {
  const pool = data.questionPool || questions[data.subject] || questions.PUM;
  return pool[data.qIndex % pool.length];
}

function renderOnlineMatch(data) {
  if (data.status === "finished") {
    finishOnlineMatch(data);
    return;
  }

  document.getElementById("game-mode-label").textContent = data.mode === "ranked" ? "RANKED" : "CASUAL";
  document.getElementById("game-subject-label").textContent = data.subject;
  document.getElementById("question-count").textContent = `SOAL ${data.qIndex + 1} / ${data.totalQuestions}`;
  document.getElementById("question-category").textContent = data.subject;

  document.getElementById("players").innerHTML = Object.entries(data.scores)
    .map(([uid, score]) => {
      const isMe = uid === MP.uid;
      const p = data.players[uid] || {};
      const tag = (isMe ? "KAMU" : p.isBot ? "BOT" : "PLAYER") + (data.claimantUid === uid ? " • MEREBUT" : "");
      return `<div class="player-row ${isMe ? "me" : ""}"><span class="score">${score}</span><b>${p.name || uid}</b><small>${tag}</small></div>`;
    })
    .join("");

  const q = getOnlineQuestion(data);
  document.getElementById("question-text").textContent = q[0];
  const claimBox = document.getElementById("claim-box");
  const answersBox = document.getElementById("question-answers");
  const claimBtn = document.querySelector(".claim-btn");
  const timerVal = document.getElementById("timer-value");

  const processKey = `${data.qIndex}:${data.phase}`;
  const isNewPhase = MP.lastProcessedKey !== processKey;
  MP.lastProcessedKey = processKey;

  if (data.phase === "claim") {
    claimBox.classList.remove("hidden");
    answersBox.innerHTML = "";
    claimBtn.disabled = false;
    document.getElementById("claim-status").textContent = "SIAPA YANG PALING CEPAT?";
    claimBox.querySelector("p").textContent = "Tekan REBUT SOAL untuk mendapatkan kesempatan menjawab.";
    if (isNewPhase) scheduleBotClaimAttempt(data);
  } else {
    claimBtn.disabled = true;
    document.getElementById("claim-status").textContent = `${nameOf(data, data.claimantUid)} MEREBUT SOAL`;
  }

  if (data.phase === "reveal") {
    claimBox.classList.remove("hidden");
    answersBox.innerHTML = "";
    claimBox.querySelector("p").textContent = "Tunggu 3 detik sebelum jawaban dibuka.";
  }

  if (data.phase === "answer") {
    claimBox.classList.add("hidden");
    if (data.claimantUid === MP.uid) {
      answersBox.innerHTML = shuffle(q[2])
        .map((a) => `<button class="answer-btn" data-answer="${a.replaceAll('"', "&quot;")}">${a}</button>`)
        .join("");
      document.querySelectorAll(".answer-btn").forEach((b) => (b.onclick = () => submitOnlineAnswer(b.dataset.answer, data.qIndex)));
    } else {
      answersBox.innerHTML = `<div class="muted">Menunggu ${nameOf(data, data.claimantUid)} menjawab...</div>`;
    }
  }

  if (data.phase === "resolved") {
    claimBox.classList.add("hidden");
    const last = data.lastResult || {};
    answersBox.innerHTML = `<div style="color:${last.correct ? "#64f5bd" : "#ff718b"};font-weight:800">${last.text || ""}</div>`;
  }

  clearGameTimer();
  const tick = () => {
    const remain = Math.max(0, Math.ceil((data.phaseEndsAt - Date.now()) / 1000));
    timerVal.textContent = data.phase === "resolved" ? "-" : remain;
    if (remain <= 0) {
      clearGameTimer();
      handleOnlinePhaseExpire(data);
    }
  };
  tick();
  state.timerId = setInterval(tick, 1000);
}

// Meniru mode solo: ada peluang bot "lebih cepat" merebut soal duluan.
function scheduleBotClaimAttempt(data) {
  setTimeout(() => {
    if (!MP.data || MP.data.phase !== "claim" || MP.data.qIndex !== data.qIndex) return;
    if (Math.random() >= 0.3) return;
    const botUids = Object.keys(data.players).filter((u) => data.players[u].isBot);
    if (!botUids.length) return;
    const bot = botUids[Math.floor(Math.random() * botUids.length)];
    tryOnlineTransition(data.qIndex, "claim", (m) => {
      if (m.claimantUid) return; // sudah direbut duluan
      m.claimantUid = bot;
      m.phase = "reveal";
      m.phaseEndsAt = Date.now() + REVEAL_PHASE_MS;
      return m;
    });
  }, 2600);
}

// Semua transisi fase memakai transaction Firebase: transisi hanya berhasil
// jika qIndex & phase di server masih sama seperti yang diharapkan klien,
// jadi kalau dua klien mencoba mengubah fase yang sama secara bersamaan,
// yang kedua otomatis dibatalkan alih-alih menimpa data yang pertama.
function tryOnlineTransition(expectedQIndex, expectedPhase, updateFn) {
  if (!MP.matchRef) return;
  MP.matchRef.transaction((m) => {
    if (!m) return m;
    if (m.qIndex !== expectedQIndex || m.phase !== expectedPhase) return; // sudah diproses klien lain
    return updateFn(m);
  });
}

function claimOnline() {
  if (!MP.data || MP.data.phase !== "claim") return;
  sfx.claim();
  tryOnlineTransition(MP.data.qIndex, "claim", (m) => {
    if (m.claimantUid) return;
    m.claimantUid = MP.uid;
    m.phase = "reveal";
    m.phaseEndsAt = Date.now() + REVEAL_PHASE_MS;
    return m;
  });
}

function submitOnlineAnswer(ans, qIndex) {
  const data = MP.data;
  if (!data || data.phase !== "answer" || data.claimantUid !== MP.uid) return;
  const q = getOnlineQuestion(data);
  const ok = ans === q[1];
  document.querySelectorAll(".answer-btn").forEach((b) => {
    b.disabled = true;
    if (b.dataset.answer === q[1]) b.classList.add("correct");
    if (b.dataset.answer === ans && !ok) b.classList.add("wrong");
  });
  ok ? sfx.correct() : sfx.wrong();
  tryOnlineTransition(qIndex, "answer", (m) => {
    if (m.claimantUid !== MP.uid) return;
    if (ok) m.scores[MP.uid] = (m.scores[MP.uid] || 0) + 100;
    m.phase = "resolved";
    m.phaseEndsAt = Date.now() + RESULT_PHASE_MS;
    m.lastResult = { correct: ok, text: ok ? "JAWABAN BENAR! +100 POIN" : "JAWABAN SALAH" };
    return m;
  });
}

// Dipanggil di SEMUA klien saat timer lokal mereka mencapai nol. Berkat
// tryOnlineTransition di atas, hanya percobaan pertama yang benar² dieksekusi.
function handleOnlinePhaseExpire(data) {
  if (data.phase === "claim") {
    tryOnlineTransition(data.qIndex, "claim", (m) => {
      m.phase = "resolved";
      m.phaseEndsAt = Date.now() + RESULT_PHASE_MS;
      m.lastResult = { correct: false, text: "TIDAK ADA YANG MEREBUT SOAL INI" };
      return m;
    });
  } else if (data.phase === "reveal") {
    const claimant = data.claimantUid;
    const bot = isBotUid(claimant);
    tryOnlineTransition(data.qIndex, "reveal", (m) => {
      if (bot) {
        const ok = Math.random() < 0.72;
        if (ok) m.scores[claimant] = (m.scores[claimant] || 0) + 100;
        m.phase = "resolved";
        m.phaseEndsAt = Date.now() + RESULT_PHASE_MS;
        m.lastResult = { correct: ok, text: `${nameOf(data, claimant)}: ${ok ? "JAWABAN BENAR" : "SALAH — DILEMPAR"}` };
        return m;
      }
      m.phase = "answer";
      m.phaseEndsAt = Date.now() + ANSWER_PHASE_MS;
      return m;
    });
  } else if (data.phase === "answer") {
    tryOnlineTransition(data.qIndex, "answer", (m) => {
      m.phase = "resolved";
      m.phaseEndsAt = Date.now() + RESULT_PHASE_MS;
      m.lastResult = { correct: false, text: "WAKTU JAWAB HABIS!" };
      return m;
    });
  } else if (data.phase === "resolved") {
    tryOnlineTransition(data.qIndex, "resolved", (m) => advanceOnlineQuestion(m));
  }
}

function advanceOnlineQuestion(m) {
  const next = m.qIndex + 1;
  if (next >= m.totalQuestions) {
    m.status = "finished";
    m.phase = "finished";
  } else {
    m.qIndex = next;
    m.phase = "claim";
    m.phaseEndsAt = Date.now() + CLAIM_PHASE_MS;
    m.claimantUid = null;
    m.lastResult = null;
  }
  return m;
}

/* ---------------------------- HASIL & XP ---------------------------- */
function finishOnlineMatch(data) {
  const guard = MP.matchId + ":finished";
  if (MP.finishedHandled === guard) return;
  MP.finishedHandled = guard;
  clearGameTimer();

  const ranking = Object.entries(data.scores).sort((a, b) => b[1] - a[1]);
  const pos = ranking.findIndex(([uid]) => uid === MP.uid) + 1;
  let earned = pos === 1 ? 10 : pos === 2 ? 7 : pos === 3 ? 5 : 0;
  if (data.mode === "casual") earned = 0;

  let oldRank = null,
    newRank = null;
  if (state.account) {
    oldRank = computeRank(state.account.xp);
    state.account.xp = Math.min(MAX_XP - 1, state.account.xp + earned);
    state.account.stats.matches++;
    if (pos === 1) state.account.stats.first++;
    newRank = computeRank(state.account.xp);
    persistAccount();
    applyAccountToUI();
  }

  document.getElementById("result-xp").textContent = `+${earned} XP`;
  document.getElementById("result-message").textContent =
    data.mode === "casual"
      ? "Mode Casual tidak menambah XP Rank."
      : earned
        ? `Kamu finis #${pos}. XP Rank bertambah!`
        : `Kamu finis #${pos}. Belum mendapat XP Rank.`;
  document.getElementById("result-board").innerHTML = ranking
    .map(([uid, score], i) => {
      const p = data.players[uid] || {};
      const you = uid === MP.uid ? " (kamu)" : "";
      return `<div class="result-row"><b>#${i + 1}</b><span>${(p.name || uid) + you}</span><span>${score} pts</span><small>${i === 0 ? "+10 XP" : i === 1 ? "+7 XP" : i === 2 ? "+5 XP" : "+0 XP"}</small></div>`;
    })
    .join("");
  if (newRank) {
    document.getElementById("result-rank").textContent = newRank.label;
    document.getElementById("result-xp-bar").style.width = newRank.progressPct + "%";
  }
  document.getElementById("review-btn").classList.add("hidden");
  show("results");
  if (oldRank && newRank && oldRank.label !== newRank.label) setTimeout(() => showRankUp(newRank), 500);

  leaveOnlineMatch();
}

function leaveOnlineMatch() {
  MP.active = false;
  if (MP.matchRef) {
    MP.matchRef.child(`players/${MP.uid}/connected`).onDisconnect().cancel();
    MP.matchRef.off();
    MP.matchRef = null;
  }
  clearGameTimer();
}
