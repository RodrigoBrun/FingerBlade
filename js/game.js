/* ==========================================================
   FINGERBLADE CORE LOGIC
   - Modo local
   - Modo IA
   - Modo Chill (custom tricks)
   - Personalización de nombres
   - IA autónoma
   ========================================================== */

/* --------------------------
   DOM references
-------------------------- */
const setupScreen            = document.getElementById('setupScreen');

const playerCountCard        = document.getElementById('playerCountCard');
const playerCountInput       = document.getElementById('playerCountInput');
const confirmPlayerCountBtn  = document.getElementById('confirmPlayerCountBtn');

const playersNamesWrapper    = document.getElementById('playersNamesWrapper');
const playerNamesFields      = document.getElementById('playerNamesFields');
const confirmNamesBtn        = document.getElementById('confirmNamesBtn');

const iaSelectCard           = document.getElementById('iaSelectCard');
const iaRosterDiv            = document.getElementById('iaRoster');
const yourNameWrapper        = document.getElementById('yourNameWrapper');
const yourNameInput          = document.getElementById('yourNameInput');
const confirmYourNameBtn     = document.getElementById('confirmYourNameBtn');

const trickSelectCard        = document.getElementById('trickSelectCard');
const trickSelectList        = document.getElementById('trickSelectList');
const confirmTricksBtn       = document.getElementById('confirmTricksBtn');

const chillVsCard            = document.getElementById('chillVsCard');
const chillVsLocalBtn        = document.getElementById('chillVsLocalBtn');
const chillVsIABtn           = document.getElementById('chillVsIABtn');

const startMatchCard         = document.getElementById('startMatchCard');
const startMatchBtn          = document.getElementById('startMatchBtn');

const gameArea               = document.getElementById('gameArea');
const playersContainer       = document.getElementById('playersContainer');

const trickNameEl            = document.getElementById('trickName');
const trickStyleEl           = document.getElementById('trickStyle');
const trickDiffEl            = document.getElementById('trickDiff');
const turnInfoEl             = document.getElementById('turnInfo');
const logFeedEl              = document.getElementById('logFeed');

const modeBadgeEl            = document.getElementById('modeBadge');

/* Botones de acción ronda (solo los usan humanos) */
const btnClean               = document.getElementById('btnClean');
const btnSketchy             = document.getElementById('btnSketchy');
const btnFail                = document.getElementById('btnFail');

/* --------------------------
   Estado global del juego
-------------------------- */
let gameMode = null;           // "local" | "ia" | "chill"
let chillOpponentMode = null;  // null | "local" | "ia" (solo relevante si gameMode === "chill")

let players = [];              // [{name, flag, respeto, lettersGiven, ia?, skill?, diffLabel?, setupDesc?}, ...]
let currentIA = null;          // oponente IA elegido en modo "ia" o chill vs IA
let pendingHumanName = "";     // nombre que ingresa el humano antes de IA
let customTricks = [];         // lista de trucos elegidos en modo chill

let currentTurnIndex = 0;      // índice del jugador que está tirando el truco
let currentTrick = null;       // truco actual
let waitingForCopy = false;    // true si estamos esperando que otro copie
let callerIndex = null;        // quién llamó el truco esta ronda
let copyTargetIndex = null;    // quién tiene que copiar
let gameOver = false;          // bandera fin de juego

const LETTERS = ["F","I","N","G","E","R"]; // 6 letras => perdiste

/* ==========================================================
   DATA: IA ROSTER
========================================================== */
const iaRosterData = [
  {
    name: "Rodrigo Brun",
    flag: "🇺🇾 Uruguay",
    respetoBase: 100,
    skill: 95,
    diffLabel: "Insano",
    setupDesc: "Deck 33mm · Trucks Pro · Ruedas uretano blancas brillantes · Grip negro lija fina pro"
  },
  {
    name: "Ghost Kid",
    flag: "🇯🇵 Japón",
    respetoBase: 80,
    skill: 88,
    diffLabel: "Tech limpio",
    setupDesc: "Deck slim matte · Trucks low · Ruedas mini blancas · Grip perforado"
  },
  {
    name: "Desk Reaper",
    flag: "🇺🇸 USA",
    respetoBase: 70,
    skill: 75,
    diffLabel: "Power Tricks",
    setupDesc: "Deck 34mm ancho · Trucks raw metal · Ruedas uretano amarillas · Grip gastado"
  },
  {
    name: "MarbleLord",
    flag: "🇮🇹 Italia",
    respetoBase: 60,
    skill: 65,
    diffLabel: "Inestable pero creativo",
    setupDesc: "Tabla con gráfico mármol, bushings flojos, ruedas flatspot"
  },
  {
    name: "Plastic Hero",
    flag: "🇧🇷 Brasil",
    respetoBase: 55,
    skill: 50,
    diffLabel: "Sketchy Warrior",
    setupDesc: "Deck plástico del chino · Trucks genéricos · Grip medio pelado pero actitud infinita"
  }
];

/* ==========================================================
   DATA: TRUCOS
========================================================== */
const trickPool = [
  { name: "Ollie limpio",              style: "Flip",      difficulty: 1 },
  { name: "Shuvit",                     style: "Flip",      difficulty: 1 },
  { name: "Kickflip",                   style: "Flip",      difficulty: 2 },
  { name: "Heelflip",                   style: "Flip",      difficulty: 2 },
  { name: "Varial Kickflip",            style: "Flip",      difficulty: 3 },
  { name: "Tre Flip (360 Flip)",        style: "Flip",      difficulty: 4 },
  { name: "Nollie Heelflip",            style: "Nollie",    difficulty: 3 },
  { name: "Switch Kickflip",            style: "Switch",    difficulty: 4 },
  { name: "Nose Manual largo",          style: "Manual",    difficulty: 3 },
  { name: "Manual + Shuvit out",        style: "Manual",    difficulty: 4 },
  { name: "Crooked Grind en borde",     style: "Grind",     difficulty: 3 },
  { name: "Nosegrind to Nollie Shuvit", style: "Grind",     difficulty: 5 },
  { name: "Línea: Flip + Manual",       style: "Linea",     difficulty: 4 }
];

/* ==========================================================
   UI HELPERS
========================================================== */

/** Inyecta mensaje al log de batalla */
function pushLog(who, text) {
  const line = document.createElement('div');
  line.classList.add('log-line');

  const whoEl = document.createElement('div');
  whoEl.classList.add('who');
  whoEl.innerHTML = `<i class="ph ph-megaphone-simple"></i> ${who}`;

  const textEl = document.createElement('div');
  textEl.classList.add('text');
  textEl.textContent = text;

  line.appendChild(whoEl);
  line.appendChild(textEl);

  logFeedEl.prepend(line); // lo más nuevo arriba
}

/** Badge del modo (incluye submodo chill si aplica) */
function updateModeBadge() {
  if (gameMode === "local") {
    modeBadgeEl.innerHTML = `<i class="ph ph-users-three"></i><span>Multijugador local</span>`;
  } else if (gameMode === "ia") {
    modeBadgeEl.innerHTML = `<i class="ph ph-robot"></i><span>VS IA: ${currentIA?.name || "???"}</span>`;
  } else if (gameMode === "chill") {
    if (chillOpponentMode === "ia") {
      modeBadgeEl.innerHTML = `<i class="ph ph-coffee"></i><span>Chill vs IA: ${currentIA?.name || "???"}</span>`;
    } else if (chillOpponentMode === "local") {
      modeBadgeEl.innerHTML = `<i class="ph ph-coffee"></i><span>Chill local</span>`;
    } else {
      modeBadgeEl.innerHTML = `<i class="ph ph-coffee"></i><span>Modo Chill</span>`;
    }
  } else {
    modeBadgeEl.innerHTML = `<i class="ph ph-swords"></i><span>Sin partida</span>`;
  }
}

/** Construye etiqueta de rol que va pegada a una card */
function buildRoleLabel(isCopying = false) {
  const role = document.createElement('div');
  role.classList.add('player-role-label');
  role.textContent = isCopying ? "DEBE COPIAR" : "TIRA EL TRUCO";
  return role;
}

/** Refresca el scoreboard */
function renderPlayers() {
  playersContainer.innerHTML = "";

  players.forEach((p, idx) => {
    const card = document.createElement('div');
    card.classList.add('player-card');

    // Marcar visualmente el jugador activo / el que copia
    if (!waitingForCopy && idx === currentTurnIndex) {
      card.classList.add('active');
      card.appendChild(buildRoleLabel(false));
    } else if (waitingForCopy && idx === copyTargetIndex) {
      card.classList.add('copying');
      card.appendChild(buildRoleLabel(true));
    }

    // Lado izquierdo (avatar inicial)
    const left = document.createElement('div');
    left.classList.add('player-left');

    const avatar = document.createElement('div');
    avatar.classList.add('player-avatar');
    avatar.textContent = p.name[0]?.toUpperCase() || "?";
    left.appendChild(avatar);

    // Centro (nombre, respeto, letras)
    const mid = document.createElement('div');
    mid.classList.add('player-mid');

    const nameRow = document.createElement('div');
    nameRow.classList.add('player-name-row');

    const nm = document.createElement('div');
    nm.classList.add('player-name');
    nm.textContent = p.name;

    const fl = document.createElement('div');
    fl.classList.add('player-flag');
    fl.textContent = p.flag || "🏁";

    nameRow.appendChild(nm);
    nameRow.appendChild(fl);

    // Respeto
    const respectBlock = document.createElement('div');
    respectBlock.classList.add('respect-bar-block');

    const labelRow = document.createElement('div');
    labelRow.classList.add('respect-label-row');
    labelRow.innerHTML = `<span>Respeto</span><span>${p.respeto}</span>`;

    const bar = document.createElement('div');
    bar.classList.add('respect-bar');
    const fill = document.createElement('div');
    fill.classList.add('respect-fill');
    const pct = Math.max(0, Math.min(100, p.respeto));
    fill.style.width = pct + "%";
    bar.appendChild(fill);

    respectBlock.appendChild(labelRow);
    respectBlock.appendChild(bar);

    // Letras FINGER
    const lettersRow = document.createElement('div');
    lettersRow.classList.add('letters-row');
    for (let i = 0; i < LETTERS.length; i++) {
      const box = document.createElement('div');
      box.classList.add('letter-box');
      if (i < p.lettersGiven) {
        box.classList.add('given');
      }
      box.textContent = LETTERS[i];
      lettersRow.appendChild(box);
    }

    mid.appendChild(nameRow);
    mid.appendChild(respectBlock);
    mid.appendChild(lettersRow);

    // Info derecha (solo flavor / IA info)
    const right = document.createElement('div');
    right.style.fontSize = ".7rem";
    right.style.lineHeight = "1.4";
    right.style.color = "var(--text-dim)";
    right.innerHTML = `
      <div><strong style="color:var(--accent-1); font-family:var(--font-title); font-weight:600;">${p.diffLabel || ""}</strong></div>
      <div>${p.setupDesc ? p.setupDesc : ""}</div>
    `;

    card.appendChild(left);
    card.appendChild(mid);
    card.appendChild(right);

    playersContainer.appendChild(card);
  });
}

/** Render del truco y mensaje de turno */
function renderCurrentTrick() {
  if (!currentTrick) return;
  trickNameEl.textContent = currentTrick.name;
  trickStyleEl.innerHTML = `<i class="ph ph-lightning"></i> Estilo: ${currentTrick.style}`;
  trickDiffEl.innerHTML = `<i class="ph ph-star"></i> Dificultad: ${currentTrick.difficulty}/5`;

  if (!waitingForCopy) {
    turnInfoEl.textContent = `Turno de ${players[currentTurnIndex].name} para DEMOSTRAR el truco.`;
  } else {
    turnInfoEl.textContent = `${players[copyTargetIndex].name} tiene que COPIAR el truco de ${players[callerIndex].name}.`;
  }
}

/* ==========================================================
   END GAME
========================================================== */
function endGame(loserIndex) {
  gameOver = true;

  const loser = players[loserIndex];
  let winner;
  if (players.length === 2) {
    winner = players.find((_, i) => i !== loserIndex);
  } else {
    winner = players[callerIndex] || players[0];
  }

  pushLog("🔥 GAME OVER", `${loser.name} completó "${LETTERS.join('')}". ${winner.name} gana la partida.`);

  btnClean.disabled = true;
  btnSketchy.disabled = true;
  btnFail.disabled = true;

  const overlay = document.createElement('div');
  overlay.classList.add('endgame-overlay');
  overlay.innerHTML = `
    <div class="endgame-card">
      <h2>🏆 ${winner.name} GANA 🏆</h2>
      <p>${loser.name} completó la palabra <strong>FINGER</strong>.</p>
      <button id="restartBtn" class="btn btn-start">
        <i class="ph ph-arrow-counter-clockwise"></i> Reiniciar
      </button>
    </div>
  `;
  document.body.appendChild(overlay);

  document.getElementById('restartBtn').addEventListener('click', () => {
    location.reload();
  });
}

/* ==========================================================
   PLAYER SETUP HELPERS
========================================================== */

/** Crea jugadores base (sin nombres finales aún) para partidas locales/chill */
function setupLocalPlayers(count) {
  players = [];
  for (let i = 1; i <= count; i++) {
    players.push({
      name: `Jugador ${i}`,
      flag: "🏁",
      respeto: 70,
      lettersGiven: 0,
      ia: false,
      diffLabel: "HUMANO",
      setupDesc: "Setup real en mesa. (Foto pendiente)"
    });
  }
}

/** Asigna los nombres custom ingresados en UI */
function applyLocalNames(namesArray) {
  for (let i = 0; i < players.length; i++) {
    const customName = namesArray[i]?.trim();
    if (customName && customName.length > 0) {
      players[i].name = customName;
    }
  }
}

/** Setea jugadores para modo IA / chill vs IA */
function setupIAPlayersWithName(iaChar, humanName) {
  players = [
    {
      name: humanName && humanName.trim() ? humanName.trim() : "Vos",
      flag: "🏁",
      respeto: 70,
      lettersGiven: 0,
      ia: false,
      diffLabel: "PLAYER",
      setupDesc: "Tu setup IRL (foto pendiente)"
    },
    {
      name: iaChar.name,
      flag: iaChar.flag,
      respeto: iaChar.respetoBase,
      lettersGiven: 0,
      ia: true,
      diffLabel: iaChar.diffLabel,
      setupDesc: iaChar.setupDesc,
      skill: iaChar.skill
    }
  ];
}

/* ==========================================================
   IA SKILL / AUTO RESULT
========================================================== */

/**
 * Decide automáticamente cómo le salió a la IA un truco.
 * Devuelve "clean" | "sketchy" | "fail".
 */
function iaRollResult(iaPlayer, trick) {
  // base probabilidades
  let baseCleanChance = iaPlayer.skill || 50; // ej 95
  let baseSketchyChance = 30;
  let baseFailChance = 20;

  // penalizar dificultad alta
  const diffFactor = (trick.difficulty - 1); // 0..4
  baseCleanChance -= diffFactor * 10;  // más difícil => menos clean
  baseFailChance  += diffFactor * 8;   // más difícil => más fail

  if (baseCleanChance < 10) baseCleanChance = 10;
  if (baseFailChance < 5) baseFailChance = 5;

  const total = baseCleanChance + baseSketchyChance + baseFailChance;
  const r = Math.random() * total;

  if (r < baseCleanChance) return "clean";
  if (r < baseCleanChance + baseSketchyChance) return "sketchy";
  return "fail";
}

/* ==========================================================
   TRICK PICKING
========================================================== */

/** Devuelve un truco random según el modo.
 *  - Modo Chill: sólo de customTricks.
 *  - Otros modos: pool completo.
 */
function pickRandomTrick() {
  if (gameMode === "chill" && customTricks.length > 0) {
    const idx = Math.floor(Math.random() * customTricks.length);
    return customTricks[idx];
  }
  const idx = Math.floor(Math.random() * trickPool.length);
  return trickPool[idx];
}

/* ==========================================================
   ROUND / TURN FLOW
========================================================== */

/** Empieza una nueva ronda:
 *  - define callerIndex = currentTurnIndex
 *  - setea el truco
 *  - si el caller es IA, resuelve su resultado automáticamente
 */
function startNewRound() {
  if (gameOver) return;

  waitingForCopy = false;
  callerIndex = currentTurnIndex;
  copyTargetIndex = null;

  currentTrick = pickRandomTrick();
  renderCurrentTrick();
  renderPlayers();

  pushLog("Sistema", `${players[callerIndex].name} llama el truco: "${currentTrick.name}"`);

  const caller = players[callerIndex];
  if (caller.ia === true) {
    const autoResult = iaRollResult(caller, currentTrick);
    handleCallerResult(autoResult);
  }
}

/**
 * Resultado del caller (quien tiró el truco primero)
 * resultType: "clean" | "sketchy" | "fail"
 */
function handleCallerResult(resultType) {
  if (gameOver) return;

  const caller = players[callerIndex];

  if (resultType === "clean") {
    caller.respeto = Math.min(100, caller.respeto + 10);
    pushLog("Caster", `${caller.name} lo mete LIMPIO 🔥`);
    pickCopyTarget();
  } else if (resultType === "sketchy") {
    caller.respeto = Math.min(100, caller.respeto + 5);
    pushLog("Caster", `${caller.name} lo mete medio SKETCHY 😏`);
    pickCopyTarget();
  } else {
    caller.respeto = Math.max(0, caller.respeto - 15);
    pushLog("Caster", `${caller.name} FALLÓ su propio truco 💀`);
    advanceTurnToNextCaller();
  }

  renderPlayers();
}

/** Decide quién tiene que copiar */
function pickCopyTarget() {
  copyTargetIndex = (callerIndex + 1) % players.length;
  waitingForCopy = true;

  renderCurrentTrick();
  renderPlayers();

  const copier = players[copyTargetIndex];
  if (copier.ia === true) {
    // IA copia sola automáticamente
    const autoResult = iaRollResult(copier, currentTrick);
    handleCopyResult(autoResult);
  }
}

/**
 * Resultado del que copia
 * resultType: "clean" | "sketchy" | "fail"
 */
function handleCopyResult(resultType) {
  if (gameOver) return;

  const copier = players[copyTargetIndex];
  if (resultType === "clean") {
    copier.respeto = Math.min(100, copier.respeto + 10);
    pushLog("Caster", `${copier.name} iguala LIMPIO. Respeto ++`);
  } else if (resultType === "sketchy") {
    copier.respeto = Math.min(100, copier.respeto + 5);
    pushLog("Caster", `${copier.name} iguala SKETCHY. Respeto +`);
  } else {
    copier.respeto = Math.max(0, copier.respeto - 15);
    copier.lettersGiven = Math.min(LETTERS.length, copier.lettersGiven + 1);

    pushLog(
      "Caster",
      `${copier.name} FALLÓ la copia. Recibe letra "${LETTERS[copier.lettersGiven-1]}" 💀`
    );

    // ¿perdió?
    if (copier.lettersGiven >= LETTERS.length) {
      endGame(copyTargetIndex);
      return;
    }
  }

  renderPlayers();
  advanceTurnToNextCaller();
}

/** Pasamos el turno al siguiente caller y arrancamos ronda nueva */
function advanceTurnToNextCaller() {
  currentTurnIndex = (currentTurnIndex + 1) % players.length;
  waitingForCopy = false;
  callerIndex = null;
  copyTargetIndex = null;

  startNewRound();
}

/* ==========================================================
   CHILL MODE TRICK CHECKLIST
========================================================== */

/** Renderiza la lista de trucos con checkboxes para Modo Chill */
function renderTrickChecklist() {
  trickSelectList.innerHTML = "";
  trickPool.forEach((trick, idx) => {
    // heurística: trucos de dif <=3 vienen pre-checkeados
    const precheck = trick.difficulty <= 3 ? "checked" : "";

    const label = document.createElement('label');
    label.classList.add('trick-option');

    label.innerHTML = `
      <div style="display:flex;align-items:flex-start;gap:.5rem;">
        <input type="checkbox" class="trick-check" data-index="${idx}" ${precheck}>
        <div>
          <div class="main">${trick.name}</div>
          <div class="meta">${trick.style} · Dificultad ${trick.difficulty}/5</div>
        </div>
      </div>
    `;

    trickSelectList.appendChild(label);
  });
}

/* ==========================================================
   SETUP FLOW (PRE-PARTIDA)
========================================================== */

/** Seleccionar modo de juego (local / ia / chill) */
document.querySelectorAll('.mode-select').forEach(btn => {
  btn.addEventListener('click', () => {
    if (gameOver) return;

    const mode = btn.getAttribute('data-mode');
    gameMode = mode;
    chillOpponentMode = null; // reseteamos submodo chill
    updateModeBadge();

    // reset visibilidad de todas las cards de setup
    startMatchCard.classList.add('hidden');
    playerCountCard.classList.add('hidden');
    iaSelectCard.classList.add('hidden');
    playersNamesWrapper.classList.add('hidden');
    yourNameWrapper.classList.add('hidden');
    trickSelectCard.classList.add('hidden');
    chillVsCard.classList.add('hidden');

    if (mode === "local") {
      // flujo clásico local (cuántos jugadores -> nombres)
      playerCountCard.classList.remove('hidden');

    } else if (mode === "ia") {
      // flujo IA (elegir rival -> tu nombre -> start)
      iaSelectCard.classList.remove('hidden');
      renderIARoster();

    } else if (mode === "chill") {
      // flujo chill arranca con selección de trucos
      trickSelectCard.classList.remove('hidden');
      renderTrickChecklist();
    }
  });
});

/** Confirmás los trucos del modo chill */
if (confirmTricksBtn) {
  confirmTricksBtn.addEventListener('click', () => {
    const checks = trickSelectList.querySelectorAll('.trick-check');
    customTricks = [];
    checks.forEach(chk => {
      if (chk.checked) {
        const idx = parseInt(chk.dataset.index, 10);
        if (!isNaN(idx)) {
          customTricks.push(trickPool[idx]);
        }
      }
    });

    if (customTricks.length === 0) {
      // fallback: si sacó todo, metemos todo el pool para no crashear
      customTricks = [...trickPool];
    }

    pushLog("Sistema", `Modo Chill activado con ${customTricks.length} trucos seleccionados.`);

    // Paso siguiente en Chill: ¿contra quién jugás?
    chillVsCard.classList.remove('hidden');

    chillVsCard.scrollIntoView({
      behavior: 'smooth',
      block: 'center'
    });
  });
}

/** Chill vs LOCAL => como local */
chillVsLocalBtn.addEventListener('click', () => {
  if (gameOver) return;
  chillOpponentMode = "local";

  pushLog("Sistema", "Modo Chill vs humanos 🔥");

  updateModeBadge();

  // mostrar flujo local: cuántos jugadores -> nombres -> start
  playerCountCard.classList.remove('hidden');
  iaSelectCard.classList.add('hidden');
  yourNameWrapper.classList.add('hidden');
  startMatchCard.classList.add('hidden');

  playerCountCard.scrollIntoView({
    behavior: 'smooth',
    block: 'center'
  });
});

/** Chill vs IA => como IA */
chillVsIABtn.addEventListener('click', () => {
  if (gameOver) return;
  chillOpponentMode = "ia";

  pushLog("Sistema", "Modo Chill vs IA 🤖");

  updateModeBadge();

  // mostramos selección de IA normal
  iaSelectCard.classList.remove('hidden');
  renderIARoster();

  // ocultar lo otro para no confundir
  playerCountCard.classList.add('hidden');
  playersNamesWrapper.classList.add('hidden');
  startMatchCard.classList.add('hidden');

  iaSelectCard.scrollIntoView({
    behavior: 'smooth',
    block: 'center'
  });
});

/** Confirmar cantidad de jugadores (modo local/chill local) */
confirmPlayerCountBtn.addEventListener('click', () => {
  if (gameOver) return;

  let count = parseInt(playerCountInput.value, 10);
  if (isNaN(count) || count < 2) count = 2;
  if (count > 6) count = 6;

  setupLocalPlayers(count);
  pushLog("Sistema", `Partida ${gameMode === "chill" ? "Chill" : "local"} con ${count} jugadores base.`);

  // generar inputs de nombres
  playerNamesFields.innerHTML = "";
  for (let i = 0; i < players.length; i++) {
    const wrapper = document.createElement('div');
    const label = document.createElement('div');
    label.classList.add('name-field-label');
    label.textContent = `Nombre Jugador ${i+1}`;

    const input = document.createElement('input');
    input.classList.add('name-input');
    input.type = 'text';
    input.maxLength = 20;
    input.placeholder = players[i].name;
    input.dataset.index = i;

    wrapper.appendChild(label);
    wrapper.appendChild(input);
    playerNamesFields.appendChild(wrapper);
  }

  playersNamesWrapper.classList.remove('hidden');
  startMatchCard.classList.add('hidden');
});

/** Confirmar nombres de los jugadores locales/chill local */
confirmNamesBtn.addEventListener('click', () => {
  if (gameOver) return;

  const inputs = playerNamesFields.querySelectorAll('input.name-input');
  const names = [];
  inputs.forEach(inp => {
    names.push(inp.value);
  });

  applyLocalNames(names);
  pushLog("Sistema", "Nombres cargados para jugadores locales.");

  // mostrar Start Battle
  startMatchCard.classList.remove('hidden');
  startMatchCard.scrollIntoView({
    behavior: 'smooth',
    block: 'center'
  });
});

/** Renderiza la lista de IAs y maneja la selección */
function renderIARoster() {
  iaRosterDiv.innerHTML = "";
  iaRosterData.forEach((iaChar) => {
    const card = document.createElement('div');
    card.classList.add('ia-card');

    const header = document.createElement('div');
    header.classList.add('ia-header');

    const avatar = document.createElement('div');
    avatar.classList.add('ia-avatar');
    avatar.textContent = iaChar.name[0]?.toUpperCase() || "?";

    const headTextWrap = document.createElement('div');
    const n = document.createElement('div');
    n.classList.add('ia-name');
    n.textContent = iaChar.name;
    const f = document.createElement('div');
    f.classList.add('ia-flag');
    f.textContent = iaChar.flag;
    headTextWrap.appendChild(n);
    headTextWrap.appendChild(f);

    header.appendChild(avatar);
    header.appendChild(headTextWrap);

    const stats = document.createElement('div');
    stats.classList.add('ia-stats');
    stats.innerHTML = `
      <div><span>Respeto:</span> ${iaChar.respetoBase}</div>
      <div><span>Dificultad:</span> ${iaChar.diffLabel}</div>
      <div><span>Setup:</span> ${iaChar.setupDesc}</div>
    `;

    const selectBtn = document.createElement('button');
    selectBtn.classList.add('btn-ia-select');
    selectBtn.textContent = "Elegir oponente";

    selectBtn.addEventListener('click', () => {
      if (gameOver) return;

      currentIA = iaChar;
      updateModeBadge();

      pushLog(
        "Sistema",
        `Vas a jugar contra ${iaChar.name} (${iaChar.flag}). Respeto base ${iaChar.respetoBase}.`
      );

      // Animación UX mobile-friendly:
      iaRosterDiv.style.transition = "all 0.4s ease";
      iaRosterDiv.style.opacity = "0";
      iaRosterDiv.style.transform = "scale(0.97)";

      setTimeout(() => {
        iaRosterDiv.classList.add('hidden');

        yourNameWrapper.classList.remove('hidden');
        yourNameWrapper.style.opacity = "0";

        setTimeout(() => {
          yourNameWrapper.style.transition = "opacity 0.4s ease";
          yourNameWrapper.style.opacity = "1";

          if (yourNameInput) {
            yourNameInput.focus();
          }
          yourNameWrapper.scrollIntoView({
            behavior: 'smooth',
            block: 'center'
          });
        }, 50);
      }, 400);

      startMatchCard.classList.add('hidden');
    });

    card.appendChild(header);
    card.appendChild(stats);
    card.appendChild(selectBtn);

    iaRosterDiv.appendChild(card);
  });

  // Reset visibilidad por si ya habíamos elegido antes
  iaRosterDiv.classList.remove('hidden');
  iaRosterDiv.style.opacity = "1";
  iaRosterDiv.style.transform = "scale(1)";
  yourNameWrapper.classList.add('hidden');
}

/** Confirmar tu nombre en modo IA / chill vs IA y habilitar Start */
confirmYourNameBtn.addEventListener('click', () => {
  if (gameOver) return;

  pendingHumanName = yourNameInput.value || "";
  setupIAPlayersWithName(currentIA, pendingHumanName);

  pushLog("Sistema", `Listo ${players[0].name}, ya estás registrado vs ${currentIA.name}.`);

  startMatchCard.classList.remove('hidden');
  startMatchCard.scrollIntoView({
    behavior: 'smooth',
    block: 'center'
  });
});

/** Iniciar partida (cualquier modo) */
startMatchBtn.addEventListener('click', () => {
  if (gameOver) return;

  setupScreen.classList.add('hidden');
  gameArea.classList.remove('hidden');

  currentTurnIndex = 0;
  startNewRound();
  renderPlayers();
  renderCurrentTrick();
  updateModeBadge();
});

/* ==========================================================
   DURANTE LA PARTIDA (BOTONES MANUALES)
========================================================== */

/**
 * IMPORTANTE:
 * - Si es turno de un humano, usamos los botones.
 * - Si el jugador activo es IA, ya resolvimos solo (no necesitás tocar nada).
 */

btnClean.addEventListener('click', () => {
  if (gameOver) return;

  if (!waitingForCopy) {
    handleCallerResult("clean");
  } else {
    handleCopyResult("clean");
  }
});

btnSketchy.addEventListener('click', () => {
  if (gameOver) return;

  if (!waitingForCopy) {
    handleCallerResult("sketchy");
  } else {
    handleCopyResult("sketchy");
  }
});

btnFail.addEventListener('click', () => {
  if (gameOver) return;

  if (!waitingForCopy) {
    handleCallerResult("fail");
  } else {
    handleCopyResult("fail");
  }
});

/* ==========================================================
   READY LOG
========================================================== */
pushLog("Sistema", "Fingerblade listo. Elegí modo para empezar.");
