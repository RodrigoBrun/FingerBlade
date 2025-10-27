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

// --- contenedores principales
const setupScreen        = document.getElementById('setupScreen');
const gameArea           = document.getElementById('gameArea');

// --- header mobile del wizard de setup
const setupHeaderMobile  = document.getElementById('setupHeaderMobile');
const backBtn            = document.getElementById('backBtn');
const setupStepLabel     = document.getElementById('setupStepLabel');

// --- cards/pasos visibles en setup (incluye reglas)
const cardMode           = document.querySelector('.card-mode');
const cardRules          = document.getElementById('card-rules');
const trickSelectCard    = document.getElementById('trickSelectCard');
const chillVsCard        = document.getElementById('chillVsCard');
const playerCountCard    = document.getElementById('playerCountCard');
const iaSelectCard       = document.getElementById('iaSelectCard');
const startMatchCard     = document.getElementById('startMatchCard');

// --- sub-wrappers dentro de algunas cards
const playersNamesWrapper   = document.getElementById('playersNamesWrapper');
const playerNamesFields     = document.getElementById('playerNamesFields');
const yourNameWrapper       = document.getElementById('yourNameWrapper');

// --- inputs / botones de setup
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

// --- elementos de UI in-game
const playersContainer      = document.getElementById('playersContainer');
const trickNameEl           = document.getElementById('trickName');
const trickStyleEl          = document.getElementById('trickStyle');
const trickDiffEl           = document.getElementById('trickDiff');

// bloque de turno grande abajo del truco actual
const turnInfoBlockEl       = document.getElementById('turnInfoBlock');
const turnInfoIconEl        = document.getElementById('turnInfoIcon');
const turnInfoTextEl        = document.getElementById('turnInfoText');

const logFeedEl             = document.getElementById('logFeed');

// --- header info arriba (arena/mode badge)
const modeBadgeEl           = document.getElementById('modeBadge');

// --- botones de resultado de cada intento
const btnClean              = document.getElementById('btnClean');
const btnSketchy            = document.getElementById('btnSketchy');
const btnFail               = document.getElementById('btnFail');


// --- estado runtime de la partida
let gameMode = null;           // "local" | "ia" | "chill"
let chillOpponentMode = null;  // para modo chill: "local" o "ia"

let players = [];              // [{name, flag, respeto, lettersGiven, ia?, skill?, diffLabel?, setupDesc?}, ...]
let currentIA = null;          // IA elegida (si aplica)
let pendingHumanName = "";     // nombre del jugador humano cuando es vs IA
let customTricks = [];         // lista de trucos seleccionados en modo chill

let currentTurnIndex = 0;      // índice del jugador que está llamando el truco
let currentTrick = null;       // truco actual
let waitingForCopy = false;    // false = caller está demostrando | true = otro está copiando
let callerIndex = null;        // quién llamó el truco
let copyTargetIndex = null;    // quién debe copiar
let gameOver = false;          // bandera de fin

// tracking de perks / ventajas por Respeto
let callerHasFreeRetry = false;           // Respeto >=100 => reintento gratis del caller
let copierNoLetterBecauseRespect = false; // Respeto >=80 => si falla copiando, NO come letra
let copierDoubleLetter = false;           // Respeto <=20 => si falla copiando, come 2 letras
let copierNearDeath = false;              // Respeto <0   => si falla copiando, queda al borde / muere

// palabra que suma letras cuando fallás copiando
const LETTERS = ["F","I","N","G","E","R"]; // 6 letras => pierde


// stack de vistas tipo "historial" del wizard de setup (para manejar Volver)
let setupViewStack = []; // ej: ["card-mode","playerCountCard","startMatchCard",...]


// pequeña constante para normalizar respeto mínimo / máximo visual
const RESPECT_MIN = -50;
const RESPECT_MAX = 100;


/* ==========================================================
  2. DATA ESTÁTICA (IA y pool de trucos)
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
    name: "Darked",
    flag: "🇨🇴 Colombia",
    respetoBase: 95,
    skill: 98,
    diffLabel: "Glitch Precision",
    setupDesc: "Deck blackout matte full black · Trucks low custom limados · Ruedas smoke translúcidas · Grip recortado a navaja"
    // Boss fight. Frío. No perdona.
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
    setupDesc: "Tabla con gráfico mármol · Bushings flojos · Ruedas flatspot"
  },
  {
    name: "Plastic Hero",
    flag: "🇧🇷 Brasil",
    respetoBase: 55,
    skill: 50,
    diffLabel: "Sketchy Warrior",
    setupDesc: "Deck plástico del chino · Trucks genéricos · Grip medio pelado pero actitud infinita"
  },
  {
    name: "Lil Socket",
    flag: "🇩🇪 Alemania",
    respetoBase: 68,
    skill: 72,
    diffLabel: "Nerd del timing",
    setupDesc: "Deck carbono crudo · Ejes titanio impresos 3D · Tape con marcas de ángulo"
  },
  {
    name: "Trash Panda",
    flag: "🇨🇦 Canadá",
    respetoBase: 77,
    skill: 82,
    diffLabel: "Calle pura",
    setupDesc: "Deck rayado con stickers rotos · Ruedas desparejas · Grip roto en la punta"
  }
];

// =========================
// POOL BASE DE TRUCOS
// =========================
// style y difficulty se mantienen igual que tu formato original
const trickPool = [
  // Básicos / foundation
  { name: "Ollie limpio",                        style: "Flip",      difficulty: 1 },
  { name: "Shuvit",                               style: "Flip",      difficulty: 1 },
  { name: "Pop Shuvit",                           style: "Flip",      difficulty: 2 },
  { name: "Kickflip",                             style: "Flip",      difficulty: 2 },
  { name: "Heelflip",                             style: "Flip",      difficulty: 2 },
  { name: "Varial Kickflip",                      style: "Flip",      difficulty: 3 },
  { name: "Hardflip",                             style: "Flip",      difficulty: 4 },
  { name: "Tre Flip (360 Flip)",                  style: "Flip",      difficulty: 5 },
  { name: "Laser Flip",                           style: "Flip",      difficulty: 7 }, // heelflip + 360 shuv
  { name: "Impossible (wrap)",                    style: "Flip",      difficulty: 7 },
  { name: "Late Flip (flip tardío en el aire)",   style: "Flip",      difficulty: 6 },
  { name: "Double Kickflip limpio",               style: "Flip",      difficulty: 7 },

  // Nollie / Switch / Fakie
  { name: "Nollie Heelflip",                      style: "Nollie",    difficulty: 3 },
  { name: "Nollie Tre Flip",                      style: "Nollie",    difficulty: 6 },
  { name: "Nollie 360 Hardflip",                  style: "Nollie",    difficulty: 10 },
  { name: "Nollie Bigspin",                       style: "Nollie",    difficulty: 4 },
  { name: "Switch Kickflip",                      style: "Switch",    difficulty: 4 },
  { name: "Switch Heelflip",                      style: "Switch",    difficulty: 4 },
  { name: "Switch 360 Shuvit",                    style: "Switch",    difficulty: 6 },
  { name: "Fakie Bigspin",                        style: "Fakie",     difficulty: 3 },
  { name: "Caballerial (Fakie 360)",              style: "Fakie",     difficulty: 4 },
  { name: "Fakie Tre Flip",                       style: "Fakie",     difficulty: 6 },
  { name: "Fakie Hardflip",                       style: "Fakie",     difficulty: 6 },

  // Manuals
  { name: "Manual limpio",                        style: "Manual",    difficulty: 2 },
  { name: "Nose Manual largo",                    style: "Manual",    difficulty: 3 },
  { name: "Manual to Shuvit",                     style: "Manual",    difficulty: 4 },
  { name: "Manual to Kickflip",                   style: "Manual",    difficulty: 5 },
  { name: "Nose Manual to Nollie Flip",           style: "Manual",    difficulty: 6 },
  { name: "Manual revert fakie",                  style: "Manual",    difficulty: 4 },

  // Grinds / Slides base
  // (sin out para poder combinar con un 'out' después)
  { name: "Crooked Grind en borde",               style: "Grind",     difficulty: 3 },
  { name: "Nosegrind en baranda",                 style: "Grind",     difficulty: 4 },
  { name: "5-0 Grind en cajón",                   style: "Grind",     difficulty: 3 },
  { name: "Smith Grind bajo presión",             style: "Grind",     difficulty: 5 },
  { name: "Feeble Grind en bajada",               style: "Grind",     difficulty: 6 },
  { name: "Overcrook tensión máxima",             style: "Grind",     difficulty: 7 },
  { name: "Bluntslide en borde corto",            style: "Grind",     difficulty: 6 },
  { name: "Noseslide switch",                     style: "Grind",     difficulty: 5 },
  { name: "Tailslide fakie out",                  style: "Grind",     difficulty: 6 }, // este ya tiene salida propia
  { name: "Darkslide controlado",                 style: "Grind",     difficulty: 9 },

  // Líneas / combos
  { name: "Línea: Kickflip + Manual",             style: "Linea",     difficulty: 4 },
  { name: "Línea: Tre Flip → Nose Manual",        style: "Linea",     difficulty: 6 },
  { name: "Línea: Nollie Flip → Crooked",         style: "Linea",     difficulty: 7 },
  { name: "Línea: Fakie Bigspin → Smith Grind",   style: "Linea",     difficulty: 8 },
  { name: "Línea: Switch Flip → 5-0",             style: "Linea",     difficulty: 8 },
  { name: "Línea: Hardflip → Manual → Shuvit",    style: "Linea",     difficulty: 9 },

  // Flex insane / boss tricks
  { name: "Bigspin Late Flip",                    style: "Flip",      difficulty: 8 },
  { name: "Fingerflip Body Varial",               style: "Flip",      difficulty: 8 }, // giras vos también
  { name: "Tre Flip revertido fakie",             style: "Fakie",     difficulty: 7 },
  { name: "Flip a Darkslide",                     style: "Grind",     difficulty: 10 },
  { name: "Nollie Flip Backside Nosegrind",       style: "Grind",     difficulty: 10 },
  { name: "Switch Bigspin Heelflip",              style: "Switch",    difficulty: 9 },
  { name: "Fakie Hardflip Late Shuvit",           style: "Fakie",     difficulty: 9 },
  { name: "Nollie Inward Heelflip",               style: "Nollie",    difficulty: 7 }
];



/* ==========================================================
  3. HELPERS UI
========================================================== */

/* ---------- 3.1 Log feed ----------
   Mete líneas en el log tipo caster / sistema */
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

  // prepend = mensaje nuevo arriba de todo
  logFeedEl.prepend(line);
}


/* ---------- 3.2 Badge "modo" en el header principal ----------
   Se actualiza cuando elegís modo / IA / etc */
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


/* ---------- 3.3 Wizard header mobile (la barrita con "Volver") ---------- */

// flag para saber si estamos en el subpaso "tu nombre" dentro de iaSelectCard
let inIASubstepName = false;

/* forceHeader():
   - Mostramos la barra superior (back + label)
   - Cambiamos el texto del paso actual
   - Se usa en SUBPASOS que no son una "card" nueva, ej: cargar nombres */
function forceHeader(labelText) {
  setupHeaderMobile.style.display = ""; // visible
  setupStepLabel.textContent = labelText || "Setup";
}

/* hideAllSetupCards():
   - Centralizado para ocultar TODAS las cards del setup, incluidas reglas.
   - Lo usamos siempre antes de mostrar una card nueva. */
function hideAllSetupCards() {
  [
    cardMode,
    cardRules,
    trickSelectCard,
    chillVsCard,
    playerCountCard,
    iaSelectCard,
    startMatchCard
  ].forEach(el => el && el.classList.add('hidden'));
}

/* showSetupView(cardEl, labelText):
   - Saca todo
   - Muestra sólo la card que pasamos
   - Ajusta header/back (si hay historial en stack)
*/
function showSetupView(cardEl, labelText = "") {
  inIASubstepName = false;

  hideAllSetupCards();

  if (cardEl) {
    cardEl.classList.remove('hidden');

    // caso especial IA:
    if (cardEl === iaSelectCard) {
      iaRosterDiv.classList.remove('hidden');
      yourNameWrapper.classList.add('hidden');
      iaRosterDiv.style.opacity = "1";
      iaRosterDiv.style.transform = "scale(1)";
    }
  }

  // si hay sólo 1 vista en stack => no mostrar header con back
  if (setupViewStack.length <= 1) {
    setupHeaderMobile.style.display = "none";
  } else {
    setupHeaderMobile.style.display = "";
  }

  setupStepLabel.textContent = labelText || "Setup";

  // subimos scroll
  window.scrollTo({ top: 0, behavior: 'instant' });
}

/* pushSetupView(cardEl, labelText):
   - Agrega la nueva card al stack de vistas
   - Llama a showSetupView */
function pushSetupView(cardEl, labelText) {
  const id = cardEl.id || cardEl.className || "view";
  setupViewStack.push(id);
  showSetupView(cardEl, labelText);
}

/* popSetupView():
   - Lógica del botón Volver
   - Incluye caso especial: estabas dentro de "Elegí IA" pero en el subpaso "Tu nombre"
*/
function popSetupView() {
  // caso especial: subpaso nombre vs IA
  if (inIASubstepName === true) {
    inIASubstepName = false;

    // volvemos a mostrar el roster IA
    iaRosterDiv.classList.remove('hidden');
    iaRosterDiv.style.opacity   = "1";
    iaRosterDiv.style.transform = "scale(1)";
    yourNameWrapper.classList.add('hidden');

    setupStepLabel.textContent = "Elegí tu rival IA";
    setupHeaderMobile.style.display = "";
    window.scrollTo({ top: 0, behavior: 'smooth' });

    return; // no tocamos el stack real todavía
  }

  // flujo normal
  if (setupViewStack.length <= 1) {
    return; // ya estamos en la raíz
  }

  // sacamos la vista actual
  setupViewStack.pop();

  // mostramos la anterior
  const prevId = setupViewStack[setupViewStack.length - 1];
  const map = {
    "card-mode": cardMode,
    "card-rules": cardRules,
    "trickSelectCard": trickSelectCard,
    "chillVsCard": chillVsCard,
    "playerCountCard": playerCountCard,
    "iaSelectCard": iaSelectCard,
    "startMatchCard": startMatchCard,
  };
  const prevEl = map[prevId] || cardMode;
  showSetupView(prevEl, "Setup");
}

// botón "Volver" mobile
backBtn.addEventListener('click', () => {
  if (gameOver) return;
  popSetupView();
});


/* ---------- 3.4 Scoreboard render ----------
   Dibuja cada tarjeta de jugador con:
   - quién tira / quién copia
   - respeto (barra verde)
   - letras FINGER acumuladas
*/
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

    // highlight dinámico del turno
    if (!waitingForCopy && idx === currentTurnIndex) {
      // el que está demostrando
      card.classList.add('active', 'blinking-active');
      card.appendChild(buildRoleLabel(false));
    } else if (waitingForCopy && idx === copyTargetIndex) {
      // el que debe copiar
      card.classList.add('copying', 'blinking-copy');
      card.appendChild(buildRoleLabel(true));
    }

    // --- avatar / inicial del nombre
    const left = document.createElement('div');
    left.classList.add('player-left');

    const avatar = document.createElement('div');
    avatar.classList.add('player-avatar');
    avatar.textContent = p.name[0]?.toUpperCase() || "?";
    left.appendChild(avatar);

    // --- centro: nombre, respeto, letras
    const mid = document.createElement('div');
    mid.classList.add('player-mid');

    // fila nombre + bandera
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

    // bloque Respeto
    const respectBlock = document.createElement('div');
    respectBlock.classList.add('respect-bar-block');

    const labelRow = document.createElement('div');
    labelRow.classList.add('respect-label-row');
    labelRow.innerHTML = `<span>Respeto</span><span>${p.respeto}</span>`;

    const bar = document.createElement('div');
    bar.classList.add('respect-bar');
    const fill = document.createElement('div');
    fill.classList.add('respect-fill');

    // ancho visual de la barra según respeto (0-100 pero clamp)
    const pct = Math.max(0, Math.min(100, p.respeto));
    fill.style.width = pct + "%";
    bar.appendChild(fill);

    respectBlock.appendChild(labelRow);
    respectBlock.appendChild(bar);

    // fila de letras FINGER marcadas
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

    // --- descripción derecha (dificultad / setup)
    const right = document.createElement('div');
    right.style.fontSize = ".7rem";
    right.style.lineHeight = "1.4";
    right.style.color = "var(--text-dim)";
    right.innerHTML = `
      <div><strong style="color:var(--accent-1); font-family:var(--font-title); font-weight:600;">${p.diffLabel || ""}</strong></div>
      <div>${p.setupDesc ? p.setupDesc : ""}</div>
    `;

    // ensamblar card final
    card.appendChild(left);
    card.appendChild(mid);
    card.appendChild(right);

    playersContainer.appendChild(card);
  });
}


/* ---------- 3.5 Bloque Truco Actual + Turno ----------
   Muestra:
   - Nombre y dificultad del truco
   - Texto grande: "X DEMUESTRA" o "Y COPIA a X"
*/
function renderCurrentTrick() {
  if (!currentTrick) return;

  // nombre y meta del truco
  trickNameEl.textContent = currentTrick.name;
  trickStyleEl.innerHTML = `<i class="ph ph-lightning"></i> Estilo: ${currentTrick.style}`;
  trickDiffEl.innerHTML  = `<i class="ph ph-star"></i> Dificultad: ${currentTrick.difficulty}/5`;

  // quién hace qué
  if (!waitingForCopy) {
    // el caller está demostrando
    const callerName = players[currentTurnIndex].name;

    turnInfoBlockEl.classList.remove('copy-mode');
    turnInfoIconEl.textContent = "▶";

    turnInfoTextEl.innerHTML = `
      <span class="highlight-name">${callerName}</span>
      tiene que
      <span class="highlight-action">DEMOSTRAR</span>
      el truco.
    `;
  } else {
    // el otro está copiando
    const copierName = players[copyTargetIndex].name;
    const ogName     = players[callerIndex].name;

    turnInfoBlockEl.classList.add('copy-mode');
    turnInfoIconEl.textContent = "↺";

    turnInfoTextEl.innerHTML = `
      <span class="highlight-name">${copierName}</span>
      tiene que
      <span class="highlight-action">COPIAR</span>
      a
      <span class="highlight-name">${ogName}</span>.
    `;
  }
}


/* ==========================================================
  4. GAMEPLAY FLOW (rondas, perks de Respeto, fin de juego)
========================================================== */

/* endGame(loserIndex):
   - Marca gameOver
   - Muestra overlay final
   - Bloquea botones */
function endGame(loserIndex) {
  gameOver = true;

  const loser = players[loserIndex];
  let winner;
  if (players.length === 2) {
    // fácil: si son 2, el que no perdió ganó
    winner = players.find((_, i) => i !== loserIndex);
  } else {
    // si son más de 2, por ahora elegimos "caller actual" o el primero
    winner = players[callerIndex] || players[0];
  }

  pushLog("🔥 GAME OVER", `${loser.name} completó "${LETTERS.join('')}". ${winner.name} gana la partida.`);

  // deshabilitamos interacción de ronda
  btnClean.disabled   = true;
  btnSketchy.disabled = true;
  btnFail.disabled    = true;

  // overlay final
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

  // click reiniciar = refrescar página
  document.getElementById('restartBtn').addEventListener('click', () => {
    location.reload();
  });
}


/* ----------------- Reglas de Respeto (perks) -----------------

   callerHasFreeRetry:
   - Respeto >=100 => caller puede fallar su truco y conseguir
     OTRO intento gratis en el mismo truco, sin comer letra por eso.

   copierNoLetterBecauseRespect:
   - copier Respeto >=80 => si falla copiando NO recibe letra.

   copierDoubleLetter:
   - copier Respeto <=20 => si falla copiando recibe 2 letras.

   copierNearDeath:
   - copier Respeto <0 => si falla copiando se queda "a 1 letra de perder".
     Y si ya estaba a 1 letra y vuelve a fallar así => pierde directo.
*/

function updatePerkFlagsForCaller(caller) {
  // reset
  callerHasFreeRetry = false;

  if (caller.respeto >= 100) {
    callerHasFreeRetry = true;
  }
}

function updatePerkFlagsForCopier(copier) {
  copierNoLetterBecauseRespect = false;
  copierDoubleLetter           = false;
  copierNearDeath              = false;

  if (copier.respeto >= 80) {
    copierNoLetterBecauseRespect = true;
  } else if (copier.respeto < 0) {
    copierNearDeath = true;
  } else if (copier.respeto <= 20) {
    copierDoubleLetter = true;
  }
}


/* ----------------- Setup inicial de jugadores -----------------

   setupLocalPlayers(count):
   Crea N jugadores humanos para modo local / chill local.
   OJO: humanos arrancan Respeto 50.

   applyLocalNames(namesArray):
   Aplica los nombres tipeados en el formulario.

   setupIAPlayersWithName(iaChar, humanName):
   Crea [humano, IA] para modo vs IA o chill vs IA.
   Humano 50 Respeto, IA usa su respetoBase.
*/

function setupLocalPlayers(count) {
  players = [];
  for (let i = 1; i <= count; i++) {
    players.push({
      name: `Jugador ${i}`,
      flag: "🏁",
      respeto: 50,          // humano arranca 50
      lettersGiven: 0,
      ia: false,
      diffLabel: "Jugador Real",
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
      respeto: 50, // humano arranca 50 Respeto
      lettersGiven: 0,
      ia: false,
      diffLabel: "PLAYER",
      setupDesc: "Tu setup IRL (foto pendiente)"
    },
    {
      name: iaChar.name,
      flag: iaChar.flag,
      respeto: iaChar.respetoBase, // IA arranca con su Respeto base
      lettersGiven: 0,
      ia: true,
      diffLabel: iaChar.diffLabel,
      setupDesc: iaChar.setupDesc,
      skill: iaChar.skill
    }
  ];
}


/* ----------------- IA Roll -----------------
   Simula si la IA mete clean / sketchy / fail en base a su skill y
   la dificultad del truco */
function iaRollResult(iaPlayer, trick) {
  let baseCleanChance   = iaPlayer.skill || 50;
  let baseSketchyChance = 30;
  let baseFailChance    = 20;

  const diffFactor = (trick.difficulty - 1); // 0..4
  baseCleanChance -= diffFactor * 10;
  baseFailChance  += diffFactor * 8;

  if (baseCleanChance < 10) baseCleanChance = 10;
  if (baseFailChance  < 5)  baseFailChance  = 5;

  const total = baseCleanChance + baseSketchyChance + baseFailChance;
  const r = Math.random() * total;

  if (r < baseCleanChance) return "clean";
  if (r < baseCleanChance + baseSketchyChance) return "sketchy";
  return "fail";
}


/* ----------------- Seleccionar Truco Random ----------------- */
function pickRandomTrick() {
  // en modo chill usamos sólo la lista seleccionada
  if (gameMode === "chill" && customTricks.length > 0) {
    const idx = Math.floor(Math.random() * customTricks.length);
    return customTricks[idx];
  }

  // sino usamos el pool global
  const idx = Math.floor(Math.random() * trickPool.length);
  return trickPool[idx];
}


/* ----------------- startNewRound() -----------------
   - arranca una ronda nueva
   - define caller (quién llama truco)
   - resetea flags tipo waitingForCopy
   - genera el truco
   - aplica perks del caller
   - si el caller es IA, ya intenta su resultado
*/
function startNewRound() {
  if (gameOver) return;

  waitingForCopy   = false;
  callerIndex      = currentTurnIndex;
  copyTargetIndex  = null;

  currentTrick = pickRandomTrick();

  // perks del caller en esta ronda (chequear Respeto 100)
  updatePerkFlagsForCaller(players[callerIndex]);

  renderCurrentTrick();
  renderPlayers();

  pushLog("Sistema", `${players[callerIndex].name} llama el truco: "${currentTrick.name}"`);

  // si el caller es IA, resolvemos su intento de una
  const caller = players[callerIndex];
  if (caller.ia === true) {
    const autoResult = iaRollResult(caller, currentTrick);
    handleCallerResult(autoResult);
  }
}


/* ----------------- handleCallerResult(resultType) -----------------
   - procesa el resultado del jugador que DEMUESTRA el truco
   - resultType: "clean" | "sketchy" | "fail"
   - usa callerHasFreeRetry (Respeto 100)
*/
function handleCallerResult(resultType) {
  if (gameOver) return;
  const caller = players[callerIndex];

  if (resultType === "clean") {
    caller.respeto = Math.min(RESPECT_MAX, caller.respeto + 10);
    pushLog("Caster", `${caller.name} lo mete LIMPIO 🔥`);
    pickCopyTarget();

  } else if (resultType === "sketchy") {
    caller.respeto = Math.min(RESPECT_MAX, caller.respeto + 5);
    pushLog("Caster", `${caller.name} lo mete medio SKETCHY 😏`);
    pickCopyTarget();

  } else {
    // falló su propio truco
    caller.respeto = Math.max(RESPECT_MIN, caller.respeto - 15);
    pushLog("Caster", `${caller.name} FALLÓ su propio truco 💀`);

    if (callerHasFreeRetry) {
      // Respeto 100 => tiene derecho a reintentar el MISMO truco sin comer letra
      pushLog("Sistema", `${caller.name} tiene Respeto 100: consigue otro intento gratis 👑`);
      callerHasFreeRetry = false; // le gastamos el perk para ESTE truco
      return; // no pasamos turno todavía, básicamente caller vuelve a intentar
    }

    // si no tiene retry gratis => pasa el turno al siguiente caller
    advanceTurnToNextCaller();
  }

  renderPlayers();
  renderCurrentTrick();
}


/* ----------------- pickCopyTarget() -----------------
   - después que el caller mete el truco (limpio o sketchy),
     otro jugador tiene que copiar.
   - setea waitingForCopy=true y marca copyTargetIndex.
   - aplica perks del copiador (Respeto>=80, <=20, <0, etc).
*/
function pickCopyTarget() {
  copyTargetIndex = (callerIndex + 1) % players.length;
  waitingForCopy = true;

  // perks del que tiene que copiar
  updatePerkFlagsForCopier(players[copyTargetIndex]);

  renderPlayers();
  renderCurrentTrick();

  // si el que copia es IA, resolvemos ya
  const copier = players[copyTargetIndex];
  if (copier.ia === true) {
    const autoResult = iaRollResult(copier, currentTrick);
    handleCopyResult(autoResult);
  }
}


/* ----------------- handleCopyResult(resultType) -----------------
   - procesa el resultado del jugador que COPIA
   - aplica TODAS las reglas locas de respeto
   - incluye fix del bug de "respeto negativo infinito"
*/
function handleCopyResult(resultType) {
  if (gameOver) return;

  const copier = players[copyTargetIndex];

  if (resultType === "clean") {
    copier.respeto = Math.min(RESPECT_MAX, copier.respeto + 10);
    pushLog("Caster", `${copier.name} iguala LIMPIO. Respeto ++`);

  } else if (resultType === "sketchy") {
    copier.respeto = Math.min(RESPECT_MAX, copier.respeto + 5);
    pushLog("Caster", `${copier.name} iguala SKETCHY. Respeto +`);

  } else {
    // FALLÓ copiando
    copier.respeto = Math.max(RESPECT_MIN, copier.respeto - 15);

    if (copierNoLetterBecauseRespect) {
      // Respeto 80+ => no letra
      pushLog(
        "Caster",
        `${copier.name} FALLÓ copiando pero tiene Respeto alto 🔥. No se come letra.`
      );

    } else if (copierNearDeath) {
      // Respeto negativo:
      //  - si NO estaba ya al borde, lo llevamos directo al borde.
      //  - si YA estaba al borde y vuelve a fallar -> pierde ahora.

      const almostDeadThreshold = LETTERS.length - 1; // ej 5 si FINGER es 6 letras

      if (copier.lettersGiven >= almostDeadThreshold) {
        // ya estaba casi muerto, ahora muere
        copier.lettersGiven = LETTERS.length; // 6 -> GAME OVER
        pushLog(
          "Caster",
          `${copier.name} FALLÓ de nuevo con Respeto negativo 😵. Se convirtió en meme oficial.`
        );
      } else {
        // lo dejamos al borde (a una letra de perder)
        copier.lettersGiven = almostDeadThreshold;
        pushLog(
          "Caster",
          `${copier.name} FALLÓ con Respeto negativo 😬. Queda a UNA letra de perder.`
        );
      }

    } else {
      // caso normal / respeto bajo
      let lettersToEat = 1;
      if (copierDoubleLetter) {
        // Respeto <=20 => pierde 2 letras
        lettersToEat = 2;
        pushLog(
          "Caster",
          `${copier.name} FALLÓ con Respeto bajo. Se come 2 letras 💀💀`
        );
      } else {
        pushLog(
          "Caster",
          `${copier.name} FALLÓ la copia. Recibe letra. 💀`
        );
      }

      copier.lettersGiven = Math.min(
        LETTERS.length,
        copier.lettersGiven + lettersToEat
      );
    }

    // chequeo derrota después de aplicar castigos
    if (copier.lettersGiven >= LETTERS.length) {
      endGame(copyTargetIndex);
      return;
    }
  }

  renderPlayers();
  renderCurrentTrick();
  advanceTurnToNextCaller();
}


/* ----------------- advanceTurnToNextCaller() -----------------
   - pasa el turno al siguiente jugador
   - resetea flags de ronda
   - arranca nueva ronda
*/
function advanceTurnToNextCaller() {
  currentTurnIndex = (currentTurnIndex + 1) % players.length;
  waitingForCopy   = false;
  callerIndex      = null;
  copyTargetIndex  = null;

  startNewRound();
}


/* ==========================================================
  5. SETUP FLOW (ELECCIÓN DE MODO, JUGADORES, IA, ETC)
========================================================== */

/* -------- 5.1 Elegir modo (card-mode) --------
   - setea gameMode
   - resetea runtime
   - mete la siguiente pantalla en el stack
   - IMPORTANTE: al elegir modo escondemos las REGLAS (card-rules)
*/
document.querySelectorAll('.mode-select').forEach(btn => {
  btn.addEventListener('click', () => {
    if (gameOver) return;

    const mode = btn.getAttribute('data-mode');
    gameMode = mode;
    chillOpponentMode = null;
    updateModeBadge();

    // reset de runtime
    players = [];
    currentIA = null;
    pendingHumanName = "";
    customTricks = [];

    // asegurar raíz del stack:
    // el primer elemento del stack siempre es "card-mode".
    if (setupViewStack.length === 0) {
      setupViewStack = ["card-mode"];
    } else if (setupViewStack[0] !== "card-mode") {
      setupViewStack.unshift("card-mode");
    }

    // limpiar dinámicos
    playersNamesWrapper.classList.add('hidden');
    yourNameWrapper.classList.add('hidden');
    startMatchCard.classList.add('hidden');
    iaRosterDiv.innerHTML = "";
    trickSelectList.innerHTML = "";
    playerNamesFields.innerHTML = "";
    yourNameInput.value = "";

    // según modo, vamos al próximo paso
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


/* -------- 5.2 Checklist Chill --------
   Render de los trucos checkboxeables para modo chill
*/
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
  // guardamos solo los trucos tildados
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

  // si no eligen nada, usamos todos
  if (customTricks.length === 0) {
    customTricks = [...trickPool];
  }

  pushLog("Sistema", `Modo Chill activado con ${customTricks.length} trucos seleccionados.`);
  pushSetupView(chillVsCard, "¿Contra quién?");
});


/* -------- 5.3 Chill: elegir vs Local o vs IA -------- */
chillVsLocalBtn.addEventListener('click', () => {
  if (gameOver) return;

  chillOpponentMode = "local";
  pushLog("Sistema", "Modo Chill vs Jugadores 🔥");
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


/* -------- 5.4 Configuración jugadores locales --------
   - Cantidad de jugadores (2..6)
   - Inputs para nombres
*/
confirmPlayerCountBtn.addEventListener('click', () => {
  if (gameOver) return;

  let count = parseInt(playerCountInput.value, 10);
  if (isNaN(count) || count < 2) count = 2;
  if (count > 6) count = 6;

  setupLocalPlayers(count);

  pushLog("Sistema", `Partida ${gameMode === "chill" ? "Chill" : "local"} con ${count} jugadores base.`);

  // generar inputs de nombre
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

  // estamos en un SUBPASO dentro de esta misma card
  forceHeader("Nombres de jugadores");
});

confirmNamesBtn.addEventListener('click', () => {
  if (gameOver) return;

  // aplicamos los nombres custom
  const inputs = playerNamesFields.querySelectorAll('input.name-input');
  const names = [];
  inputs.forEach(inp => names.push(inp.value));

  applyLocalNames(names);
  pushLog("Sistema", "Nombres cargados para jugadores locales.");

  // vamos a la card final "¿Listos?"
  pushSetupView(startMatchCard, "Listo para empezar");
});


/* -------- 5.5 Elegir IA / Tu nombre vs IA --------
   - Renderiza el roster IA
   - Animación al pasar al subpaso "Tu nombre"
*/
function renderIARoster() {
  iaRosterDiv.innerHTML = "";

  iaRosterData.forEach((iaChar) => {
    const card = document.createElement('div');
    card.classList.add('ia-card');

    // header IA
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

    // stats IA
    const stats = document.createElement('div');
    stats.classList.add('ia-stats');
    stats.innerHTML = `
      <div><span>Respeto:</span> ${iaChar.respetoBase}</div>
      <div><span>Dificultad:</span> ${iaChar.diffLabel}</div>
      <div><span>Setup:</span> ${iaChar.setupDesc}</div>
    `;

    // botón seleccionar IA
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

      // entramos al SUBPASO "Tu nombre"
      inIASubstepName = true;

      // animación de salida del roster IA
      iaRosterDiv.style.transition = "all 0.4s ease";
      iaRosterDiv.style.opacity = "0";
      iaRosterDiv.style.transform = "scale(0.97)";

      setTimeout(() => {
        // ocultamos roster
        iaRosterDiv.classList.add('hidden');

        // mostramos formulario de tu nombre
        yourNameWrapper.classList.remove('hidden');
        yourNameWrapper.style.opacity = "0";

        setTimeout(() => {
          yourNameWrapper.style.transition = "opacity 0.4s ease";
          yourNameWrapper.style.opacity = "1";

          if (yourNameInput) yourNameInput.focus();

          // header ahora dice "Tu nombre"
          forceHeader("Tu nombre");
          setupHeaderMobile.style.display = "";

          window.scrollTo({ top: 0, behavior: 'smooth' });
        }, 50);
      }, 400);

      startMatchCard.classList.add('hidden');
    });

    // armar card IA
    card.appendChild(header);
    card.appendChild(stats);
    card.appendChild(selectBtn);

    iaRosterDiv.appendChild(card);
  });

  iaRosterDiv.classList.remove('hidden');
  iaRosterDiv.style.opacity   = "1";
  iaRosterDiv.style.transform = "scale(1)";
  yourNameWrapper.classList.add('hidden');
}

// confirmás tu nombre para vs IA
confirmYourNameBtn.addEventListener('click', () => {
  if (gameOver) return;

  pendingHumanName = yourNameInput.value || "";
  setupIAPlayersWithName(currentIA, pendingHumanName);

  pushLog("Sistema", `Listo ${players[0].name}, ya estás registrado vs ${currentIA.name}.`);

  pushSetupView(startMatchCard, "Listo para empezar");
});


/* -------- 5.6 INICIAR PARTIDA --------
   - Esconde el setup y muestra el juego
   - Arranca la primera ronda
*/
startMatchBtn.addEventListener('click', () => {
  if (gameOver) return;

  // ocultamos todas las pantallas de setup
  setupScreen.classList.add('hidden');

  // mostramos el área de juego
  gameArea.classList.remove('hidden');

  // reseteamos estado inicial de la partida real
  currentTurnIndex = 0;
  waitingForCopy   = false;
  callerIndex      = null;
  copyTargetIndex  = null;
  gameOver         = false;

  // esta llama al primer truco
  startNewRound();
  renderPlayers();
  renderCurrentTrick();
  updateModeBadge();

  window.scrollTo({ top: 0, behavior: 'instant' });
});


/* ==========================================================
  6. BOTONES DURANTE LA PARTIDA
========================================================== */

/* estos 3 botones dicen cómo te salió:
   LIMPIO / MEDIO SKETCHY / FALLÉ FEO
   Dependiendo si estás demostrando o copiando
   llama a la función correspondiente
*/
btnClean.addEventListener('click', () => {
  if (gameOver) return;
  if (!waitingForCopy) {
    // caller mostrando su truco
    handleCallerResult("clean");
  } else {
    // copier intentando copiar
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

/*
Al boot queremos mostrar:
- card-mode (elegir tipo de partida)
- card-rules (cómo se juega)
- ocultar header back
- log inicial
*/

pushLog("Sistema", "Fingerblade listo. Elegí modo para empezar.");

// armamos stack inicial con la raíz "card-mode"
setupViewStack = ["card-mode"];

// mostramos card-mode y reglas visibles a la vez
hideAllSetupCards();
cardMode.classList.remove('hidden');
if (cardRules) cardRules.classList.remove('hidden');

// header mobile oculto al principio
setupHeaderMobile.style.display = "none";
setupStepLabel.textContent = "Setup";

// badge inicial
updateModeBadge();
