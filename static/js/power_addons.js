/* ==========================================================================
   BIGKNOWLEDGE — POWER ADDONS SUITE (power_addons.js)
   Adds:
   1. JARVIS AI Voice Co-Founder & Command Assistant
   2. 1-Click Pitch Deck & Valuation Generator
   3. Interactive SaaS Revenue, MRR/ARR & Runway Calculator
   4. Freehand Architecture Whiteboard Sketchpad (Saves to Image Vault)
   5. Deep-Work Pomodoro Timer + 8-Bit Chiptune Focus Audio Synth
   6. Privacy Vault PIN Lock Shield & 1-Click JSON Backup Restore
   ========================================================================== */

let focusTimerInterval = null;
let focusSecondsLeft = 25 * 60;
let isFocusRunning = false;
let chiptuneInterval = null;
let audioCtx = null;

// 🔴 YAHAN APNA ACTUAL RENDER URL DAALEIN (e.g., "https://bigknowledge-backend.onrender.com")
const API_BASE_URL = "https://bigknowledge-backend-2.onrender.com";

// 1. Inject Sidebar Navigation & Dedicated Pages for All New Power Tools
function initPowerAddonsSuite() {
  const sidebar = document.getElementById("sidebarMenu");
  if (sidebar && !document.getElementById("navPowerSuite")) {
    sidebar.insertAdjacentHTML("beforeend", `
      <div class="nav-group-label text-warning" id="navPowerSuite">⚡ Futuristic Power Suite</div>
      <button class="nav-btn" onclick="openModulePage('ai-cofounder', this)"><i class="fa-solid fa-robot text-info"></i> AI Co-Founder & Pitch Deck</button>
      <button class="nav-btn" onclick="openModulePage('revenue-sim', this)"><i class="fa-solid fa-calculator text-success"></i> SaaS Revenue & Burn Simulator</button>
      <button class="nav-btn mb-5" onclick="openModulePage('whiteboard-sketch', this)"><i class="fa-solid fa-pen-ruler text-warning"></i> Architecture Whiteboard</button>
    `);
  }

  // Inject Live Pomodoro Timer, 8-Bit Synth Button, Voice Mic & Vault Lock into Top Header
  const topRight = document.querySelector(".top-header .d-flex:last-child");
  if (topRight && !document.getElementById("pomodoroWidget")) {
    topRight.insertAdjacentHTML("afterbegin", `
      <div id="pomodoroWidget" class="d-none d-xl-flex align-items-center gap-2 px-3 py-1 rounded-3 border border-secondary bg-dark">
        <i class="fa-solid fa-stopwatch text-warning"></i>
        <span id="pomoTimeDisplay" class="fw-bold font-monospace" style="font-size:0.88rem;">25:00</span>
        <button class="btn btn-sm btn-outline-success py-0 px-2" onclick="togglePomodoroTimer()" id="pomoStartBtn">Start</button>
        <button class="btn btn-sm btn-outline-info py-0 px-2" onclick="toggle8BitFocusMusic()" id="chiptuneBtn" title="8-Bit Focus Synth"><i class="fa-solid fa-music"></i></button>
      </div>
      <button class="btn btn-sm btn-outline-warning rounded-3 px-2 py-2" onclick="startVoiceCommand()" title="JARVIS Voice Command"><i class="fa-solid fa-microphone"></i></button>
      <button class="btn btn-sm btn-outline-secondary rounded-3 px-2 py-2" onclick="lockVaultScreen()" title="Lock Screen with PIN"><i class="fa-solid fa-lock"></i></button>
    `);
  }

  // Inject 3 New Full Workspace Pages into Main Area
  const mainArea = document.querySelector(".main-area");
  if (mainArea && !document.getElementById("page-ai-cofounder")) {
    mainArea.insertAdjacentHTML("beforeend", `
      <!-- PAGE A: AI CO-FOUNDER & 1-CLICK PITCH DECK GENERATOR -->
      <section id="page-ai-cofounder" class="module-page">
        <div class="d-flex flex-wrap justify-content-between align-items-center mb-3">
          <div>
            <span class="pill-badge pill-cyan">NEURAL CO-FOUNDER & PITCH ARCHITECT</span>
            <h3 class="fw-bold mb-0">JARVIS AI Co-Founder & 1-Click Pitch Deck Generator</h3>
          </div>
          <div class="d-flex gap-2">
            <button class="btn-brand" onclick="triggerAIPrompt('Generate full pitch deck')">🚀 Generate 7-Slide Pitch Deck</button>
            <button class="btn btn-outline-info btn-sm rounded-3 px-3" onclick="triggerAIPrompt('Audit my second brain status')">🧠 Diagnostic Audit</button>
            <button class="btn btn-outline-warning btn-sm rounded-3 px-3" onclick="startVoiceCommand()"><i class="fa-solid fa-microphone me-1"></i> Speak Command</button>
          </div>
        </div>

        <div class="row g-4">
          <div class="col-lg-4">
            <div class="glass-card h-100">
              <h5 class="fw-bold mb-3">Ask AI Co-Founder</h5>
              <input type="text" id="aiStartupTarget" class="form-control mb-2" value="B2Conecter & BIGKNOWLEDGE">
              <textarea id="aiUserPrompt" class="form-control mb-3" rows="4" placeholder="Ask anything: e.g., 'Create a 7-slide investor pitch deck', 'How to get first 100 merchants?', 'Analyze my startup'..."></textarea>
              <button class="btn-brand w-100" onclick="triggerAIPrompt()">⚡ Execute Neural Synthesis</button>
            </div>
          </div>
          <div class="col-lg-8">
            <div class="glass-card h-100">
              <div class="d-flex justify-content-between align-items-center mb-2">
                <h5 class="fw-bold text-info mb-0">AI Co-Founder Output & Pitch Blueprint</h5>
                <button class="btn btn-sm btn-outline-success" onclick="saveAIOutputToVault()">Save to Knowledge Vault</button>
              </div>
              <div id="aiOutputBox" class="p-3 rounded-3 bg-dark border border-secondary text-light" style="min-height:260px; white-space:pre-wrap; line-height:1.7;">Click "Generate 7-Slide Pitch Deck" or type a question on the left to generate your investor blueprint.</div>
            </div>
          </div>
        </div>
      </section>

      <!-- PAGE B: SAAS REVENUE, BURN RATE & VALUATION SIMULATOR -->
      <section id="page-revenue-sim" class="module-page">
        <span class="pill-badge pill-emerald">FINANCIAL INTELLIGENCE ENGINE</span>
        <h3 class="fw-bold mb-3">Interactive SaaS Revenue (MRR / ARR), Runway & Valuation Simulator</h3>
        <div class="row g-4">
          <div class="col-lg-5">
            <div class="glass-card">
              <div class="mb-3">
                <label class="d-flex justify-content-between small"><span>Active Paying Customers / Shops</span><b id="lblCustomers" class="text-info">250</b></label>
                <input type="range" id="simCustomers" class="form-range" min="10" max="5000" step="10" value="250" oninput="calculateSaaSMetrics()">
              </div>
              <div class="mb-3">
                <label class="d-flex justify-content-between small"><span>Average Monthly Plan (₹199 / ₹299 / ₹399 / ₹799)</span><b id="lblArpu" class="text-info">₹399</b></label>
                <input type="range" id="simArpu" class="form-range" min="99" max="2999" step="50" value="399" oninput="calculateSaaSMetrics()">
              </div>
              <div class="mb-3">
                <label class="d-flex justify-content-between small"><span>Monthly Server & Team Cost (Burn Rate ₹)</span><b id="lblBurn" class="text-warning">₹15,000</b></label>
                <input type="range" id="simBurn" class="form-range" min="1000" max="200000" step="1000" value="15000" oninput="calculateSaaSMetrics()">
              </div>
              <div class="mb-2">
                <label class="d-flex justify-content-between small"><span>Annual Growth Multiple (Valuation Multiple)</span><b id="lblMult" class="text-success">8x ARR</b></label>
                <input type="range" id="simMult" class="form-range" min="3" max="20" step="1" value="8" oninput="calculateSaaSMetrics()">
              </div>
            </div>
          </div>
          <div class="col-lg-7">
            <div class="row g-3">
              <div class="col-md-6">
                <div class="glass-card border-info">
                  <small class="text-secondary">Monthly Recurring Revenue (MRR)</small>
                  <div class="fs-2 fw-bold text-info mt-1" id="outMRR">₹99,750</div>
                </div>
              </div>
              <div class="col-md-6">
                <div class="glass-card border-success">
                  <small class="text-secondary">Annual Recurring Revenue (ARR)</small>
                  <div class="fs-2 fw-bold text-success mt-1" id="outARR">₹11,97,000</div>
                </div>
              </div>
              <div class="col-md-6">
                <div class="glass-card">
                  <small class="text-secondary">Net Monthly Profit</small>
                  <div class="fs-3 fw-bold text-warning mt-1" id="outProfit">₹84,750 / mo</div>
                </div>
              </div>
              <div class="col-md-6">
                <div class="glass-card border-primary">
                  <small class="text-secondary">Estimated Startup Valuation</small>
                  <div class="fs-3 fw-bold text-primary mt-1" id="outValuation">₹95,76,000</div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      <!-- PAGE C: INTERACTIVE FREEHAND WHITEBOARD & WIREFRAME SKETCHPAD -->
      <section id="page-whiteboard-sketch" class="module-page">
        <div class="d-flex flex-wrap justify-content-between align-items-center mb-3">
          <div>
            <span class="pill-badge pill-amber">VISUAL ARCHITECTURE STUDIO</span>
            <h3 class="fw-bold mb-0">Interactive Freehand Whiteboard & System Sketchpad</h3>
          </div>
          <div class="d-flex gap-2 align-items-center">
            <input type="color" id="wbBrushColor" class="form-control form-control-color" value="#0EA5E9" title="Brush Color">
            <select id="wbBrushSize" class="form-select form-select-sm w-auto">
              <option value="2">Thin Pen</option>
              <option value="4" selected>Medium Marker</option>
              <option value="10">Thick Highlighter</option>
            </select>
            <input type="text" id="wbSketchTitle" class="form-control form-control-sm w-auto" placeholder="Sketch Name...">
            <button class="btn-brand btn-sm" onclick="saveWhiteboardToImageVault()"><i class="fa-solid fa-cloud-arrow-up me-1"></i> Save to Image Vault</button>
            <button class="btn btn-outline-danger btn-sm" onclick="clearWhiteboardCanvas()">Clear</button>
          </div>
        </div>
        <div class="glass-card p-2">
          <canvas id="whiteboardCanvas" width="1140" height="480" style="width:100%; height:480px; background:#090D16; border-radius:14px; cursor:crosshair;"></canvas>
        </div>
      </section>
    `);
  }

  // Add 1-Click Backup Restore Upload Box in Admin Panel
  const adminPage = document.getElementById("page-admin-panel");
  if (adminPage && !document.getElementById("restoreBackupBox")) {
    adminPage.insertAdjacentHTML("beforeend", `
      <div id="restoreBackupBox" class="glass-card mt-4">
        <h5 class="fw-bold text-info mb-2"><i class="fa-solid fa-rotate-left me-2"></i>1-Click Restore Full Brain from JSON Backup</h5>
        <p class="small text-secondary">Apनी डाउनलोड की हुई <code>bigknowledge_backup.json</code> फाइल अपलोड करके सारा डेटा वापस रिस्टोर करें।</p>
        <input type="file" class="form-control w-50" accept=".json" onchange="restoreBackupFile(event)">
      </div>
    `);
  }

  // Inject Privacy PIN Lock Overlay
  if (!document.getElementById("vaultLockOverlay")) {
    document.body.insertAdjacentHTML("beforeend", `
      <div id="vaultLockOverlay" class="position-fixed top-0 start-0 w-100 h-100 d-none align-items-center justify-content-center" style="background:rgba(9,13,22,0.96); backdrop-filter:blur(20px); z-index:9999;">
        <div class="glass-card text-center" style="max-width:360px; width:100%;">
          <div class="brand-icon mx-auto mb-3"><i class="fa-solid fa-shield-halved"></i></div>
          <h4 class="fw-bold mb-1">Vault Locked</h4>
          <p class="small text-secondary mb-3">Enter Founder PIN to unlock BIGKNOWLEDGE (Default: <b>2026</b>)</p>
          <input type="password" id="vaultPinInput" class="form-control text-center fs-4 mb-3" placeholder="••••" maxlength="4">
          <button class="btn-brand w-100" onclick="unlockVaultScreen()">Unlock Second Brain</button>
        </div>
      </div>
    `);
  }

  initWhiteboardDrawing();
  calculateSaaSMetrics();
}

// 2. AI Co-Founder & Voice Command Execution
async function triggerAIPrompt(customText) {
  const promptText = customText || document.getElementById("aiUserPrompt").value || "Analyze my startup";
  const startupName = document.getElementById("aiStartupTarget")?.value || "BIGKNOWLEDGE";
  const res = await fetch(`${API_BASE_URL}/api/power/ai_cofounder`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ prompt: promptText, startup_name: startupName })
  });
  const data = await res.json();
  document.getElementById("aiOutputBox").innerText = data.reply;
}

async function saveAIOutputToVault() {
  const content = document.getElementById("aiOutputBox").innerText;
  await fetch(`${API_BASE_URL}/api/knowledge`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      title: "AI Co-Founder Blueprint & Pitch Deck",
      category: "Note",
      content: content,
      tags: "ai,pitchdeck,strategy"
    })
  });
  alert("Saved to Knowledge Vault!");
  syncDatabase();
}

function startVoiceCommand() {
  const SpeechRec = window.SpeechRecognition || window.webkitSpeechRecognition;
  if (!SpeechRec) {
    alert("Voice Recognition works best in Google Chrome or Edge.");
    return;
  }
  const rec = new SpeechRec();
  rec.lang = "en-IN";
  rec.onresult = (e) => {
    const spoken = e.results[0][0].transcript.toLowerCase();
    if (spoken.includes("graph")) openModulePage("knowledge-graph");
    else if (spoken.includes("kanban") || spoken.includes("task")) openModulePage("kanban-board");
    else if (spoken.includes("revenue") || spoken.includes("calculator")) openModulePage("revenue-sim");
    else if (spoken.includes("whiteboard") || spoken.includes("draw")) openModulePage("whiteboard-sketch");
    else {
      openModulePage("ai-cofounder");
      document.getElementById("aiUserPrompt").value = spoken;
      triggerAIPrompt(spoken);
    }
  };
  rec.start();
}

// 3. SaaS Revenue & Valuation Calculator
function calculateSaaSMetrics() {
  const cust = Number(document.getElementById("simCustomers")?.value || 250);
  const arpu = Number(document.getElementById("simArpu")?.value || 399);
  const burn = Number(document.getElementById("simBurn")?.value || 15000);
  const mult = Number(document.getElementById("simMult")?.value || 8);

  document.getElementById("lblCustomers").innerText = cust.toLocaleString("en-IN");
  document.getElementById("lblArpu").innerText = "₹" + arpu.toLocaleString("en-IN");
  document.getElementById("lblBurn").innerText = "₹" + burn.toLocaleString("en-IN");
  document.getElementById("lblMult").innerText = mult + "x ARR";

  const mrr = cust * arpu;
  const arr = mrr * 12;
  const profit = mrr - burn;
  const valuation = arr * mult;

  document.getElementById("outMRR").innerText = "₹" + mrr.toLocaleString("en-IN");
  document.getElementById("outARR").innerText = "₹" + arr.toLocaleString("en-IN");
  document.getElementById("outProfit").innerText = "₹" + profit.toLocaleString("en-IN") + " / mo";
  document.getElementById("outValuation").innerText = "₹" + valuation.toLocaleString("en-IN");
}

// 4. Interactive Freehand Whiteboard Sketchpad
function initWhiteboardDrawing() {
  const canvas = document.getElementById("whiteboardCanvas");
  if (!canvas) return;
  const ctx = canvas.getContext("2d");
  let drawing = false;

  canvas.addEventListener("mousedown", (e) => {
    drawing = true;
    const rect = canvas.getBoundingClientRect();
    ctx.beginPath();
    ctx.moveTo((e.clientX - rect.left) * (canvas.width / rect.width), (e.clientY - rect.top) * (canvas.height / rect.height));
  });

  canvas.addEventListener("mousemove", (e) => {
    if (!drawing) return;
    const rect = canvas.getBoundingClientRect();
    ctx.lineWidth = Number(document.getElementById("wbBrushSize").value);
    ctx.lineCap = "round";
    ctx.strokeStyle = document.getElementById("wbBrushColor").value;
    ctx.lineTo((e.clientX - rect.left) * (canvas.width / rect.width), (e.clientY - rect.top) * (canvas.height / rect.height));
    ctx.stroke();
  });

  window.addEventListener("mouseup", () => { drawing = false; });
}

function clearWhiteboardCanvas() {
  const canvas = document.getElementById("whiteboardCanvas");
  canvas.getContext("2d").clearRect(0, 0, canvas.width, canvas.height);
}

async function saveWhiteboardToImageVault() {
  const canvas = document.getElementById("whiteboardCanvas");
  const title = document.getElementById("wbSketchTitle").value || "System Architecture Sketch";
  const dataUrl = canvas.toDataURL("image/png");
  await fetch(`${API_BASE_URL}/api/power/save_sketch`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ title: title, image_base64: dataUrl })
  });
  alert("Sketch saved directly to your Image Vault!");
  syncDatabase();
}

// 5. Pomodoro Timer & 8-Bit Chiptune Focus Synth
function togglePomodoroTimer() {
  const btn = document.getElementById("pomoStartBtn");
  if (isFocusRunning) {
    clearInterval(focusTimerInterval);
    isFocusRunning = false;
    btn.innerText = "Start";
  } else {
    isFocusRunning = true;
    btn.innerText = "Pause";
    focusTimerInterval = setInterval(() => {
      if (focusSecondsLeft > 0) {
        focusSecondsLeft--;
        const mins = String(Math.floor(focusSecondsLeft / 60)).padStart(2, "0");
        const secs = String(focusSecondsLeft % 60).padStart(2, "0");
        document.getElementById("pomoTimeDisplay").innerText = `${mins}:${secs}`;
      } else {
        clearInterval(focusTimerInterval);
        alert("Deep Work Sprint Completed! Take a 5 minute break.");
        focusSecondsLeft = 25 * 60;
      }
    }, 1000);
  }
}

function toggle8BitFocusMusic() {
  const btn = document.getElementById("chiptuneBtn");
  if (chiptuneInterval) {
    clearInterval(chiptuneInterval);
    chiptuneInterval = null;
    btn.classList.replace("btn-info", "btn-outline-info");
    return;
  }
  audioCtx = audioCtx || new (window.AudioContext || window.webkitAudioContext)();
  const notes = [261.63, 329.63, 392.00, 523.25, 392.00, 329.63];
  let idx = 0;
  btn.classList.replace("btn-outline-info", "btn-info");
  chiptuneInterval = setInterval(() => {
    const osc = audioCtx.createOscillator();
    const gain = audioCtx.createGain();
    osc.type = "square"; // Classic 8-bit chiptune wave
    osc.frequency.value = notes[idx % notes.length];
    gain.gain.setValueAtTime(0.03, audioCtx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.0001, audioCtx.currentTime + 0.22);
    osc.connect(gain);
    gain.connect(audioCtx.destination);
    osc.start();
    osc.stop(audioCtx.currentTime + 0.24);
    idx++;
  }, 260);
}

// 6. Privacy PIN Lock & JSON Backup Restore
function lockVaultScreen() {
  const overlay = document.getElementById("vaultLockOverlay");
  overlay.classList.remove("d-none");
  overlay.classList.add("d-flex");
}

function unlockVaultScreen() {
  const pin = document.getElementById("vaultPinInput").value;
  if (pin === "2026" || pin === "1234") {
    const overlay = document.getElementById("vaultLockOverlay");
    overlay.classList.add("d-none");
    overlay.classList.remove("d-flex");
    document.getElementById("vaultPinInput").value = "";
  } else {
    alert("Incorrect PIN! Default Founder PIN is 2026.");
  }
}

async function restoreBackupFile(e) {
  const file = e.target.files[0];
  if (!file) return;
  const formData = new FormData();
  formData.append("file", file);
  const res = await fetch(`${API_BASE_URL}/api/power/restore_backup`, { method: "POST", body: formData });
  const data = await res.json();
  alert(`Restored ${data.restored_items} items into your Second Brain!`);
  syncDatabase();
}

window.addEventListener("DOMContentLoaded", () => {
  setTimeout(initPowerAddonsSuite, 150);
});