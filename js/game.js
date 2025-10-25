/* ==========================================================
  FINGERBLADE CORE LOGIC
  1. Estado global / DOM
  2. Data estática (IA + trucos)
  3. Helpers UI (log, scoreboard, header mobile)
  4. Flujo de ronda / gameplay
  5. Setup pre-partida (stack de vistas + pasos)
  6. Botones de acción in-game
  ========================================================== */


/* ==========================================================
  1. ESTADO GLOBAL / DOM
========================================================== */

// --- main containers
const setupScreen        = document.getElementById('setupScreen');
const gameArea           = document.getElementById('gameArea');

// --- header mobile wizard
const setupHeaderMobile  = document.getElementById('setupHeaderMobile');
const backBtn            = document.getElementById('backBtn');
const setupStepLabel     = document.getElementById('setupStepLabel');

// --- cards/pasos
const cardMode           = document.querySelector('.card-mode');
const trickSelectCard    = document.getElementById('trickSelectCard');
const chillVsCard        = document.getElementById('chillVsCard');
const playerCountCard    = document.getElementById('playerCountCard');
const iaSelectCard       = document.getElementById('iaSelectCard');
const startMatchCard     = document.getElementById('startMatchCard');

// --- sub-wrappers dentro de cards
const playersNamesWrapper   = document.getElementById('playersNamesWrapper');
const playerNamesFields     = document.getElementById('playerNamesFields');
const yourNameWrapper       = document.getElementById('yourNameWrapper');

// --- inputs / botones setup
const playerCountInput      = document.getElementById('playerCountInput');
const confirmPlayerCountBtn = document.getElementById('confirmPlayerCountBtn');
const confirmNamesBtn       = document.getElementById('confirmNamesBtn');

const iaRosterDiv           = document.getElementById('iaRoster');
const yourNameInput         = document.getElementById('yourNameInput');
const confirmYourNameBtn    = document.getElementById('confirmYourNameBtn');

const trickSelectList       = document.getElementById('trickSelectList');
const confirmTricksBtn      = document.getElementById('confirmTricksBtn');

const chillVsLocalBtn       = document.getElementById('chillVsLocalBtn');
const chillVsIABtn          = document.getElementById('chillVsIABtn');

const startMatchBtn         = document.getElementById('startMatchBtn');

// --- in-game UI
const playersContainer      = document.getElementById('playersContainer');
const trickNameEl           = document.getElementById('trickName');
const trickStyleEl          = document.getElementById('trickStyle');
const trickDiffEl           = document.getElementById('trickDiff');
const turnInfoEl            = document.getElementById('turnInfo');
const logFeedEl             = document.getElementById('logFeed');

// --- header info (arena/mode badge)
const modeBadgeEl           = document.getElementById('modeBadge');

// --- round action buttons
const btnClean              = document.getElementById('btnClean');
const btnSketchy            = document.getElementById('btnSketchy');
const btnFail               = document.getElementById('btnFail');


// --- estado runtime juego
let gameMode = null;           // "local" | "ia" | "chill"
let chillOpponentMode = null;  // para chill: "local" | "ia"

let players = [];              // [{name, flag, respeto, lettersGiven, ia?, skill?, diffLabel?, setupDesc?}, ...]
let currentIA = null;          // objeto IA elegido
let pendingHumanName = "";     // tu nombre vs IA
let customTricks = [];         // trucos elegidos en chill

let currentTurnIndex = 0;
let currentTrick = null;
let waitingForCopy = false;
let callerIndex = null;
let copyTargetIndex = null;
let gameOver = false;

const LETTERS = ["F","I","N","G","E","R"]; // 6 letras => pierde


/* wizard stack para el setup */
let setupViewStack = []; // array de IDs de card principales, ej: ["card-mode","trickSelectCard","chillVsCard",...]


/* ==========================================================
  2. DATA ESTÁTICA
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
  3. HELPERS UI
========================================================== */

// ---------- 3.1 Log feed ----------
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

  logFeedEl.prepend(line);
}

// ---------- 3.2 Badge "modo" arriba ----------
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

// ---------- 3.3 Header mobile wizard visibility ----------

// flag para saber si estamos en el subpaso "tu nombre" dentro de iaSelectCard
let inIASubstepName = false;

function forceHeader(labelText) {
  // usar en SUB-PASOS dentro de la misma card (ej: pedir nombres o pedir tu nombre vs IA)
  setupHeaderMobile.style.display = ""; // visible
  setupStepLabel.textContent = labelText || "Setup";
}

function showSetupView(cardEl, labelText = "") {
  // cuando mostramos una card grande "normal", salimos de subpasos internos
  inIASubstepName = false;

  // ocultar todas
  [
    cardMode,
    trickSelectCard,
    chillVsCard,
    playerCountCard,
    iaSelectCard,
    startMatchCard
  ].forEach(el => el && el.classList.add('hidden'));

  // mostrar la que toca
  if (cardEl) {
    cardEl.classList.remove('hidden');

    // reset sub-estado visual interno según card
    if (cardEl === playerCountCard) {
      // volvemos al subestado base: ocultar nombres hasta que confirmes cantidad
      // (no forzamos nada acá porque confirmPlayerCountBtn es quien los muestra)
    }

    if (cardEl === iaSelectCard) {
      // al entrar "normal" a iaSelectCard: roster visible, campo nombre oculto
      iaRosterDiv.classList.remove('hidden');
      yourNameWrapper.classList.add('hidden');
      iaRosterDiv.style.opacity = "1";
      iaRosterDiv.style.transform = "scale(1)";
    }
  }

  // header back visible sólo si hay más de una vista en el stack
  if (setupViewStack.length <= 1) {
    setupHeaderMobile.style.display = "none";
  } else {
    setupHeaderMobile.style.display = "";
  }

  setupStepLabel.textContent = labelText || "Setup";

  // aseguramos que estemos arriba
  window.scrollTo({ top: 0, behavior: 'instant' });
}

function pushSetupView(cardEl, labelText) {
  const id = cardEl.id || cardEl.className || "view";
  setupViewStack.push(id);
  showSetupView(cardEl, labelText);
}

function popSetupView() {
  // caso especial:
  // si estamos dentro de iaSelectCard pero en el SUBPASO "tu nombre",
  // el back NO debe sacar la card del stack. debe volver a mostrar el roster IA.
  if (inIASubstepName === true) {
    // volvemos al subestado "Elegí oponente IA"
    inIASubstepName = false;

    // restaurar roster visible
    iaRosterDiv.classList.remove('hidden');
    iaRosterDiv.style.opacity   = "1";
    iaRosterDiv.style.transform = "scale(1)";

    // ocultar subform nombre
    yourNameWrapper.classList.add('hidden');

    // header vuelve al label anterior:
    setupStepLabel.textContent = "Elegí tu rival IA";

    // seguimos mostrando el header con back porque seguimos en una vista > raíz
    setupHeaderMobile.style.display = "";

    // scrollear arriba
    window.scrollTo({ top: 0, behavior: 'smooth' });

    return; // MUY IMPORTANTE: no hacemos pop real del stack todavía
  }

  // flujo normal: si no estamos en subpaso interno
  if (setupViewStack.length <= 1) {
    // ya estamos en la raíz, nada que volver
    return;
  }

  // sacamos la vista actual
  setupViewStack.pop();

  // mostramos la anterior
  const prevId = setupViewStack[setupViewStack.length - 1];
  const map = {
    "card-mode": cardMode,
    "trickSelectCard": trickSelectCard,
    "chillVsCard": chillVsCard,
    "playerCountCard": playerCountCard,
    "iaSelectCard": iaSelectCard,
    "startMatchCard": startMatchCard,
  };
  const prevEl = map[prevId] || cardMode;
  showSetupView(prevEl, "Setup");
}

// botón Volver
backBtn.addEventListener('click', () => {
  if (gameOver) return;
  popSetupView();
});


// ---------- 3.4 Scoreboard render ----------
function buildRoleLabel(isCopying) {
  const role = document.createElement('div');
  role.classList.add('player-role-label');
  role.textContent = isCopying ? "DEBE COPIAR" : "TIRA EL TRUCO";
  return role;
}

function renderPlayers() {
  playersContainer.innerHTML = "";

  players.forEach((p, idx) => {
    const card = document.createElement('div');
    card.classList.add('player-card');

    if (!waitingForCopy && idx === currentTurnIndex) {
      card.classList.add('active');
      card.appendChild(buildRoleLabel(false));
    } else if (waitingForCopy && idx === copyTargetIndex) {
      card.classList.add('copying');
      card.appendChild(buildRoleLabel(true));
    }

    const left = document.createElement('div');
    left.classList.add('player-left');

    const avatar = document.createElement('div');
    avatar.classList.add('player-avatar');
    avatar.textContent = p.name[0]?.toUpperCase() || "?";
    left.appendChild(avatar);

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

    // respeto bar
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

    // letras
    const lettersRow = document.createElement('div');
    lettersRow.classList.add('letters-row');
    for (let i = 0; i < LETTERS.length; i++) {
      const box = document.createElement('div');
      box.classList.add('letter-box');
      if (i < p.lettersGiven) box.classList.add('given');
      box.textContent = LETTERS[i];
      lettersRow.appendChild(box);
    }

    mid.appendChild(nameRow);
    mid.appendChild(respectBlock);
    mid.appendChild(lettersRow);

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

// ---------- 3.5 Truco actual ----------
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
  4. GAMEPLAY FLOW (rondas, IA, fin de juego)
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

// crea jugadores locales base
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

function applyLocalNames(namesArray) {
  for (let i = 0; i < players.length; i++) {
    const customName = namesArray[i]?.trim();
    if (customName) {
      players[i].name = customName;
    }
  }
}

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

// IA: resultado automático
function iaRollResult(iaPlayer, trick) {
  let baseCleanChance = iaPlayer.skill || 50;
  let baseSketchyChance = 30;
  let baseFailChance = 20;

  const diffFactor = (trick.difficulty - 1); // 0..4
  baseCleanChance -= diffFactor * 10;
  baseFailChance  += diffFactor * 8;

  if (baseCleanChance < 10) baseCleanChance = 10;
  if (baseFailChance < 5) baseFailChance = 5;

  const total = baseCleanChance + baseSketchyChance + baseFailChance;
  const r = Math.random() * total;

  if (r < baseCleanChance) return "clean";
  if (r < baseCleanChance + baseSketchyChance) return "sketchy";
  return "fail";
}

// elegir truco random
function pickRandomTrick() {
  if (gameMode === "chill" && customTricks.length > 0) {
    const idx = Math.floor(Math.random() * customTricks.length);
    return customTricks[idx];
  }
  const idx = Math.floor(Math.random() * trickPool.length);
  return trickPool[idx];
}

// flujo de ronda
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

function pickCopyTarget() {
  copyTargetIndex = (callerIndex + 1) % players.length;
  waitingForCopy = true;

  renderCurrentTrick();
  renderPlayers();

  const copier = players[copyTargetIndex];
  if (copier.ia === true) {
    const autoResult = iaRollResult(copier, currentTrick);
    handleCopyResult(autoResult);
  }
}

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

    pushLog("Caster", `${copier.name} FALLÓ la copia. Recibe letra "${LETTERS[copier.lettersGiven-1]}" 💀`);

    if (copier.lettersGiven >= LETTERS.length) {
      endGame(copyTargetIndex);
      return;
    }
  }

  renderPlayers();
  advanceTurnToNextCaller();
}

function advanceTurnToNextCaller() {
  currentTurnIndex = (currentTurnIndex + 1) % players.length;
  waitingForCopy = false;
  callerIndex = null;
  copyTargetIndex = null;

  startNewRound();
}


/* ==========================================================
  5. SETUP FLOW (ELECCIÓN DE MODO, JUGADORES, IA, ETC)
========================================================== */

// ----- 5.1 elegir modo (card-mode) -----
document.querySelectorAll('.mode-select').forEach(btn => {
  btn.addEventListener('click', () => {
    if (gameOver) return;

    const mode = btn.getAttribute('data-mode');
    gameMode = mode;
    chillOpponentMode = null;
    updateModeBadge();

    // reset setup runtime
    players = [];
    currentIA = null;
    pendingHumanName = "";
    customTricks = [];

    // ⚠️ IMPORTANTE:
    // si el stack está vacío o no tiene todavía la raíz "card-mode",
    // la ponemos primero para que luego siempre haya a dónde volver.
    if (setupViewStack.length === 0) {
      setupViewStack = ["card-mode"];
    } else if (setupViewStack[0] !== "card-mode") {
      setupViewStack.unshift("card-mode");
    }

    // limpiamos contenido dinámico
    playersNamesWrapper.classList.add('hidden');
    yourNameWrapper.classList.add('hidden');
    startMatchCard.classList.add('hidden');
    iaRosterDiv.innerHTML = "";
    trickSelectList.innerHTML = "";
    playerNamesFields.innerHTML = "";
    yourNameInput.value = "";

    // según el modo vamos al siguiente paso y lo pusheamos,
    // esto hace que el stack quede con 2 items -> header visible
    if (mode === "local") {
      pushSetupView(playerCountCard, "Jugadores");

    } else if (mode === "ia") {
      renderIARoster();
      pushSetupView(iaSelectCard, "Elegí tu rival IA");

    } else if (mode === "chill") {
      renderTrickChecklist();
      pushSetupView(trickSelectCard, "Elegí tus trucos");
    }
  });
});

// ----- 5.2 checklist chill -----
function renderTrickChecklist() {
  trickSelectList.innerHTML = "";
  trickPool.forEach((trick, idx) => {
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
    customTricks = [...trickPool];
  }

  pushLog("Sistema", `Modo Chill activado con ${customTricks.length} trucos seleccionados.`);
  pushSetupView(chillVsCard, "¿Contra quién?");
});

// ----- 5.3 chill vs local / vs IA -----
chillVsLocalBtn.addEventListener('click', () => {
  if (gameOver) return;
  chillOpponentMode = "local";
  pushLog("Sistema", "Modo Chill vs humanos 🔥");
  updateModeBadge();

  pushSetupView(playerCountCard, "Jugadores");
});

chillVsIABtn.addEventListener('click', () => {
  if (gameOver) return;
  chillOpponentMode = "ia";
  pushLog("Sistema", "Modo Chill vs IA 🤖");
  updateModeBadge();

  renderIARoster();
  pushSetupView(iaSelectCard, "Elegí tu rival IA");
});

// ----- 5.4 jugadores locales -----
confirmPlayerCountBtn.addEventListener('click', () => {
  if (gameOver) return;

  let count = parseInt(playerCountInput.value, 10);
  if (isNaN(count) || count < 2) count = 2;
  if (count > 6) count = 6;

  setupLocalPlayers(count);
  pushLog("Sistema", `Partida ${gameMode === "chill" ? "Chill" : "local"} con ${count} jugadores base.`);

  // generar campos nombre
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

  // subpaso dentro de la MISMA card, así que no pusheamos vista nueva
  forceHeader("Nombres de jugadores");
});

confirmNamesBtn.addEventListener('click', () => {
  if (gameOver) return;

  const inputs = playerNamesFields.querySelectorAll('input.name-input');
  const names = [];
  inputs.forEach(inp => names.push(inp.value));

  applyLocalNames(names);
  pushLog("Sistema", "Nombres cargados para jugadores locales.");

  pushSetupView(startMatchCard, "Listo para empezar");
});

// ----- 5.5 elegir IA -----
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

  // marcamos que entramos al SUBPASO "tu nombre"
  inIASubstepName = true;

  // animación de salida del roster IA
  iaRosterDiv.style.transition = "all 0.4s ease";
  iaRosterDiv.style.opacity = "0";
  iaRosterDiv.style.transform = "scale(0.97)";

  setTimeout(() => {
    // oculto roster
    iaRosterDiv.classList.add('hidden');

    // muestro formulario de tu nombre
    yourNameWrapper.classList.remove('hidden');
    yourNameWrapper.style.opacity = "0";

    setTimeout(() => {
      yourNameWrapper.style.transition = "opacity 0.4s ease";
      yourNameWrapper.style.opacity = "1";

      if (yourNameInput) yourNameInput.focus();

      // header ahora dice "Tu nombre"
      forceHeader("Tu nombre");

      // IMPORTANTE: dejamos el header visible (porque no estamos en la raíz)
      setupHeaderMobile.style.display = "";

      // scrolleo arriba
      window.scrollTo({ top: 0, behavior: 'smooth' });
    }, 50);
  }, 400);

  startMatchCard.classList.add('hidden');
});


    card.appendChild(header);
    card.appendChild(stats);
    card.appendChild(selectBtn);

    iaRosterDiv.appendChild(card);
  });

  iaRosterDiv.classList.remove('hidden');
  iaRosterDiv.style.opacity = "1";
  iaRosterDiv.style.transform = "scale(1)";
  yourNameWrapper.classList.add('hidden');
}

confirmYourNameBtn.addEventListener('click', () => {
  if (gameOver) return;

  pendingHumanName = yourNameInput.value || "";
  setupIAPlayersWithName(currentIA, pendingHumanName);

  pushLog("Sistema", `Listo ${players[0].name}, ya estás registrado vs ${currentIA.name}.`);

  pushSetupView(startMatchCard, "Listo para empezar");
});


// ----- 5.6 INICIAR PARTIDA -----
startMatchBtn.addEventListener('click', () => {
  if (gameOver) return;

  setupScreen.classList.add('hidden');
  gameArea.classList.remove('hidden');

  currentTurnIndex = 0;
  startNewRound();
  renderPlayers();
  renderCurrentTrick();
  updateModeBadge();

  // aseguramos scroll arriba al entrar al game
  window.scrollTo({ top: 0, behavior: 'instant' });
});


/* ==========================================================
  6. BOTONES DURANTE LA PARTIDA
========================================================== */

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
  BOOT
========================================================== */
pushLog("Sistema", "Fingerblade listo. Elegí modo para empezar.");
// estado inicial del wizard stack -> pantalla raíz
setupViewStack = ["card-mode"];
showSetupView(cardMode, "Elegí modo");
updateModeBadge();
