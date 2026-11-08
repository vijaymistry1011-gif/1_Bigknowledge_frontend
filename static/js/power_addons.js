/* ==========================================================================
   BIGKNOWLEDGE — POWER ADDONS & CORE SUITE (static/js/power_addons.js)
   Includes:
   1. JARVIS AI Co-Founder (Connected to Groq /api/ai-assistant + Smart Fallback)
   2. SaaS Revenue (MRR/ARR) & Valuation Simulator
   3. Freehand Architecture Whiteboard Sketchpad
   4. Non-AI Core Suite: Finance Ledger, Code Vault, Cap Table & Launch Checklist
   5. Pomodoro Timer, 8-Bit Focus Synth & PIN Lock Shield
   ========================================================================== */

let focusTimerInterval = null;
let focusSecondsLeft = 25 * 60;
let isFocusRunning = false;
let chiptuneInterval = null;
let audioCtx = null;

var API_BASE_URL = window.API_BASE_URL || "https://bigknowledge-backend-2.onrender.com";

const CORE_SUITE_KEY = "BIGKNOWLEDGE_CORE_SUITE_V1";
let CORE_DATA = JSON.parse(localStorage.getItem(CORE_SUITE_KEY) || "null") || {
  transactions: [
    { id: 1, date: "2026-10-25", title: "B2Conecter Early Merchant Subscriptions (10 Shops)", type: "Income", category: "SaaS Revenue", amount: 3990 },
    { id: 2, date: "2026-10-27", title: "Cloud Server & Domain Setup", type: "Expense", category: "Infrastructure", amount: 850 },
    { id: 3, date: "2026-10-29", title: "Honey-Chain IoT Sensor Prototype Kit", type: "Expense", category: "R&D Hardware", amount: 1400 }
  ],
  snippets: [
    { id: 101, title: "Flask SQLAlchemy Production Connection Pool", lang: "Python", tags: "flask,db,backend", code: "app.config['SQLALCHEMY_ENGINE_OPTIONS'] = {\n    'pool_pre_ping': True,\n    'pool_recycle': 300,\n}" },
    { id: 102, title: "Git Fast Commit & Push to Production", lang: "Bash / Git", tags: "git,deploy", code: "git add .\ngit commit -m 'Enterprise module update'\ngit push origin main" },
    { id: 103, title: "C++ Fast I/O Competitive Template", lang: "C++", tags: "cpp,dsa", code: "ios_base::sync_with_stdio(false);\ncin.tie(NULL);" }
  ],
  cap_table: [
    { id: 201, holder: "Mr. Vijay Mistry (Founder & CTO)", role: "Founder", shares: 750000 },
    { id: 202, holder: "Co-Founder & Operations Lead", role: "Co-Founder", shares: 150000 },
    { id: 203, holder: "Team ESOP & Advisor Pool", role: "ESOP Pool", shares: 100000 }
  ],
  checklist: [
    { id: 1, cat: "Product & Tech", text: "Database Schema & Cloud Backup Configured", done: true },
    { id: 2, cat: "Product & Tech", text: "Mobile & Desktop Responsive UI Verified", done: true },
    { id: 3, cat: "Product & Tech", text: "Custom Domain & SSL (HTTPS) Active", done: false },
    { id: 4, cat: "Business & Legal", text: "PAN / MSME (Udyam) Registration Completed", done: true },
    { id: 5, cat: "Business & Legal", text: "Pricing Tiers (₹199 / ₹299 / ₹399 / ₹799) Locked", done: true },
    { id: 6, cat: "Growth & Launch", text: "First 10 Real Beta Customers Onboarded", done: false }
  ]
};

function saveCoreData() {
  localStorage.setItem(CORE_SUITE_KEY, JSON.stringify(CORE_DATA));
}

function initPowerAddonsSuite() {
  // 1. Add Sidebar Navigation Buttons
  const sidebar = document.getElementById("sidebarMenu");
  if (sidebar && !document.getElementById("navPowerSuite")) {
    sidebar.insertAdjacentHTML("beforeend", `
      <div class="nav-group-label text-warning mt-3" id="navPowerSuite">⚡ Futuristic Power Suite</div>
      <button class="nav-btn" onclick="openModulePage('ai-cofounder', this)"><i class="fa-solid fa-robot text-info"></i> AI Co-Founder & Pitch Deck</button>
      <button class="nav-btn" onclick="openModulePage('revenue-sim', this)"><i class="fa-solid fa-calculator text-success"></i> SaaS Revenue & Burn Simulator</button>
      <button class="nav-btn" onclick="openModulePage('whiteboard-sketch', this)"><i class="fa-solid fa-pen-ruler text-warning"></i> Architecture Whiteboard</button>

      <div class="nav-group-label text-info mt-3" id="navCoreSuiteGroup">🛠️ Core Founder Tools</div>
      <button class="nav-btn" onclick="openModulePage('finance-ledger', this)"><i class="fa-solid fa-wallet text-success"></i> Finance, Cashflow & Invoices</button>
      <button class="nav-btn" onclick="openModulePage('code-vault', this)"><i class="fa-solid fa-code text-info"></i> Developer Code & API Vault</button>
      <button class="nav-btn" onclick="openModulePage('cap-table', this)"><i class="fa-solid fa-chart-pie text-warning"></i> Equity & Cap Table Manager</button>
      <button class="nav-btn mb-5" onclick="openModulePage('launch-checklist', this)"><i class="fa-solid fa-clipboard-check text-primary"></i> Startup Launch Checklist</button>
    `);
  }

  // 2. Top Header Widgets (Pomodoro, 8-Bit Synth, Voice Mic, Lock)
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

  // 3. Inject Pages into Main Area
  const mainArea = document.querySelector(".main-area");
  if (mainArea && !document.getElementById("page-ai-cofounder")) {
    mainArea.insertAdjacentHTML("beforeend", `
      <!-- PAGE A: AI CO-FOUNDER & PITCH DECK -->
      <section id="page-ai-cofounder" class="module-page">
        <div class="d-flex flex-wrap justify-content-between align-items-center mb-3">
          <div>
            <span class="pill-badge pill-cyan">NEURAL CO-FOUNDER & PITCH ARCHITECT</span>
            <h3 class="fw-bold mb-0">JARVIS AI Co-Founder & 1-Click Pitch Deck Generator</h3>
          </div>
          <div class="d-flex gap-2">
            <button class="btn-brand" onclick="triggerAIPrompt('Generate a complete 7-slide investor pitch deck for B2Conecter and BIGKNOWLEDGE')">🚀 Generate 7-Slide Pitch Deck</button>
            <button class="btn btn-outline-info btn-sm rounded-3 px-3" onclick="triggerAIPrompt('Audit my current startup execution, tasks, and revenue strategy')">🧠 Diagnostic Audit</button>
            <button class="btn btn-outline-warning btn-sm rounded-3 px-3" onclick="startVoiceCommand()"><i class="fa-solid fa-microphone me-1"></i> Speak Command</button>
          </div>
        </div>

        <div class="row g-4">
          <div class="col-lg-4">
            <div class="glass-card h-100">
              <h5 class="fw-bold mb-3">Ask AI Co-Founder</h5>
              <input type="text" id="aiStartupTarget" class="form-control mb-2" value="B2Conecter & BIGKNOWLEDGE">
              <textarea id="aiUserPrompt" class="form-control mb-3" rows="5" placeholder="Ask anything: e.g., 'Create a 7-slide investor pitch deck', 'How to get first 100 Kirana merchants?', 'Analyze my startup'..."></textarea>
              <button class="btn-brand w-100" onclick="triggerAIPrompt()">⚡ Execute Neural Synthesis</button>
            </div>
          </div>
          <div class="col-lg-8">
            <div class="glass-card h-100">
              <div class="d-flex justify-content-between align-items-center mb-2">
                <h5 class="fw-bold text-info mb-0">AI Co-Founder Output & Pitch Blueprint</h5>
                <button class="btn btn-sm btn-outline-success" onclick="saveAIOutputToVault()">Save to Knowledge Vault</button>
              </div>
              <div id="aiOutputBox" class="p-3 rounded-3 bg-dark border border-secondary text-light" style="min-height:280px; white-space:pre-wrap; line-height:1.7;">Click "Generate 7-Slide Pitch Deck" or type a question on the left to generate your investor blueprint.</div>
            </div>
          </div>
        </div>
      </section>

      <!-- PAGE B: SAAS REVENUE SIMULATOR -->
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
                <label class="d-flex justify-content-between small"><span>Average Monthly Plan (₹199 - ₹799)</span><b id="lblArpu" class="text-info">₹399</b></label>
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
              <div class="col-md-6"><div class="glass-card border-info"><small class="text-secondary">Monthly Recurring Revenue (MRR)</small><div class="fs-2 fw-bold text-info mt-1" id="outMRR">₹99,750</div></div></div>
              <div class="col-md-6"><div class="glass-card border-success"><small class="text-secondary">Annual Recurring Revenue (ARR)</small><div class="fs-2 fw-bold text-success mt-1" id="outARR">₹11,97,000</div></div></div>
              <div class="col-md-6"><div class="glass-card"><small class="text-secondary">Net Monthly Profit</small><div class="fs-3 fw-bold text-warning mt-1" id="outProfit">₹84,750 / mo</div></div></div>
              <div class="col-md-6"><div class="glass-card border-primary"><small class="text-secondary">Estimated Startup Valuation</small><div class="fs-3 fw-bold text-primary mt-1" id="outValuation">₹95,76,000</div></div></div>
            </div>
          </div>
        </div>
      </section>

      <!-- PAGE C: WHITEBOARD SKETCHPAD -->
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

      <!-- PAGE D: FINANCE LEDGER -->
      <section id="page-finance-ledger" class="module-page">
        <div class="d-flex flex-wrap justify-content-between align-items-center mb-3">
          <div>
            <span class="pill-badge pill-emerald">STARTUP TREASURY & ACCOUNTING</span>
            <h3 class="fw-bold mb-0">Financial Ledger, Burn Tracker & Invoice Generator</h3>
          </div>
          <button class="btn-brand btn-sm" onclick="window.print()"><i class="fa-solid fa-print me-1"></i> Print Statement / Invoice</button>
        </div>
        <div class="row g-3 mb-4" id="financeSummaryCards"></div>
        <div class="row g-4">
          <div class="col-lg-4">
            <div class="glass-card">
              <h5 class="fw-bold text-info mb-3">+ Record Income or Expense</h5>
              <form onsubmit="addFinanceTransaction(event)">
                <input type="text" id="finTitle" class="form-control mb-2" placeholder="Description" required>
                <select id="finType" class="form-select mb-2">
                  <option value="Income">Income (+ ₹ Revenue / Funding)</option>
                  <option value="Expense">Expense (- ₹ Cost / Bill)</option>
                </select>
                <input type="text" id="finCat" class="form-control mb-2" value="SaaS Revenue" required>
                <input type="number" id="finAmount" class="form-control mb-2" placeholder="Amount in ₹" required>
                <input type="date" id="finDate" class="form-control mb-3" value="2026-11-08" required>
                <button type="submit" class="btn-brand w-100">Save Transaction</button>
              </form>
            </div>
          </div>
          <div class="col-lg-8">
            <div class="glass-card table-responsive">
              <h5 class="fw-bold mb-3">Transaction Ledger History</h5>
              <table class="table table-dark table-hover align-middle mb-0">
                <thead><tr><th>Date</th><th>Description</th><th>Category</th><th>Type</th><th>Amount (₹)</th><th>Action</th></tr></thead>
                <tbody id="financeLedgerBody"></tbody>
              </table>
            </div>
          </div>
        </div>
      </section>

      <!-- PAGE E: DEVELOPER CODE VAULT -->
      <section id="page-code-vault" class="module-page">
        <span class="pill-badge pill-cyan">DEVELOPER ENGINEERING VAULT</span>
        <h3 class="fw-bold mb-3">Code Snippets, Terminal Commands & Architecture Templates</h3>
        <div class="glass-card mb-4">
          <h6 class="fw-bold text-info mb-2">+ Save New Code Snippet / Command</h6>
          <form onsubmit="addCodeSnippet(event)" class="row g-2">
            <div class="col-md-4"><input type="text" id="snipTitle" class="form-control" placeholder="Snippet Title" required></div>
            <div class="col-md-3">
              <select id="snipLang" class="form-select">
                <option>Python</option><option>JavaScript</option><option>C / C++</option><option>HTML / CSS</option><option>SQL</option><option>Bash / Git</option>
              </select>
            </div>
            <div class="col-md-3"><input type="text" id="snipTags" class="form-control" value="code,dev"></div>
            <div class="col-md-2"><button type="submit" class="btn-brand w-100">Save Code</button></div>
            <div class="col-12 mt-2">
              <textarea id="snipCode" class="form-control font-monospace" rows="3" placeholder="Paste your code here..." required></textarea>
            </div>
          </form>
        </div>
        <div class="row g-3" id="codeVaultGrid"></div>
      </section>

      <!-- PAGE F: EQUITY & CAP TABLE -->
      <section id="page-cap-table" class="module-page">
        <span class="pill-badge pill-amber">OWNERSHIP & SHAREHOLDING</span>
        <h3 class="fw-bold mb-3">Interactive Startup Cap Table & Equity Calculator</h3>
        <div class="glass-card mb-4">
          <div class="row g-3 align-items-end">
            <div class="col-md-3">
              <label class="small text-secondary">Company Valuation (₹)</label>
              <input type="number" id="capValuationInput" class="form-control fw-bold text-info" value="50000000" oninput="renderCapTable()">
            </div>
            <div class="col-md-3">
              <label class="small text-secondary">Shareholder Name</label>
              <input type="text" id="capHolderName" class="form-control" placeholder="Name">
            </div>
            <div class="col-md-2">
              <label class="small text-secondary">Role</label>
              <select id="capHolderRole" class="form-select">
                <option>Founder</option><option>Co-Founder</option><option>Angel Investor</option><option>Advisor</option><option>ESOP Pool</option>
              </select>
            </div>
            <div class="col-md-2">
              <label class="small text-secondary">Shares Issued</label>
              <input type="number" id="capHolderShares" class="form-control" value="50000">
            </div>
            <div class="col-md-2">
              <button class="btn-brand w-100" onclick="addCapShareholder()">+ Add Stakeholder</button>
            </div>
          </div>
        </div>
        <div class="glass-card table-responsive">
          <table class="table table-dark table-hover align-middle mb-0">
            <thead><tr><th>Stakeholder Name</th><th>Role</th><th>Shares Owned</th><th>Ownership (%)</th><th>Equity Value (₹)</th><th>Action</th></tr></thead>
            <tbody id="capTableBody"></tbody>
          </table>
        </div>
      </section>

      <!-- PAGE G: STARTUP LAUNCH CHECKLIST -->
      <section id="page-launch-checklist" class="module-page">
        <span class="pill-badge pill-violet">PRODUCTION GO-LIVE AUDIT</span>
        <h3 class="fw-bold mb-3">Startup Launch Readiness Checklist</h3>
        <div class="glass-card mb-4">
          <div class="d-flex justify-content-between align-items-center mb-2">
            <span class="fw-bold text-info">Overall Launch Readiness Score</span>
            <span class="fs-4 fw-bold text-success" id="launchReadinessPct">0%</span>
          </div>
          <div class="progress mb-3" style="height:10px; background:rgba(255,255,255,0.08);">
            <div class="progress-bar bg-success" id="launchReadinessBar" style="width:0%"></div>
          </div>
          <form onsubmit="addLaunchCheckItem(event)" class="row g-2">
            <div class="col-md-3">
              <select id="lcCategory" class="form-select">
                <option>Product & Tech</option><option>Business & Legal</option><option>Growth & Launch</option>
              </select>
            </div>
            <div class="col-md-7"><input type="text" id="lcText" class="form-control" placeholder="Add new launch requirement..." required></div>
            <div class="col-md-2"><button type="submit" class="btn-brand w-100">+ Add Item</button></div>
          </form>
        </div>
        <div class="row g-3" id="launchChecklistGrid"></div>
      </section>
    `);
  }

  // Backup Restore Box in Admin Panel
  const adminPage = document.getElementById("page-admin-panel");
  if (adminPage && !document.getElementById("restoreBackupBox")) {
    adminPage.insertAdjacentHTML("beforeend", `
      <div id="restoreBackupBox" class="glass-card mt-4">
        <h5 class="fw-bold text-info mb-2"><i class="fa-solid fa-rotate-left me-2"></i>1-Click Restore Full Brain from JSON Backup</h5>
        <p class="small text-secondary">Apni download ki hui <code>bigknowledge_backup.json</code> file upload karke saara data wapas restore karein.</p>
        <input type="file" class="form-control w-50" accept=".json" onchange="restoreBackupFile(event)">
      </div>
    `);
  }

  // Privacy PIN Lock Overlay
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
  renderFinanceLedger();
  renderCodeVault();
  renderCapTable();
  renderLaunchChecklist();
}

// AI Co-Founder Execution (Tries /api/ai-assistant first, then /api/power/ai_cofounder, then Smart Local Synthesis)
async function triggerAIPrompt(customText) {
  const promptInput = document.getElementById("aiUserPrompt");
  const promptText = customText || (promptInput ? promptInput.value : "") || "Analyze my startup";
  const startupName = document.getElementById("aiStartupTarget")?.value || "B2Conecter & BIGKNOWLEDGE";
  const outBox = document.getElementById("aiOutputBox");

  if (outBox) {
    outBox.innerHTML = `<div class="spinner-border text-info spinner-border-sm me-2"></div> JARVIS is synthesizing strategy for <b>${startupName}</b>...`;
  }

  try {
    // 1. Try Groq AI endpoint
    const res1 = await fetch(`${API_BASE_URL}/api/ai-assistant`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ query: `${startupName}: ${promptText}` })
    });
    if (res1.ok) {
      const data1 = await res1.json();
      if (data1.reply) {
        outBox.innerText = data1.reply;
        return;
      }
    }

    // 2. Fallback to power/ai_cofounder endpoint
    const res2 = await fetch(`${API_BASE_URL}/api/power/ai_cofounder`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ prompt: promptText, startup_name: startupName })
    });
    if (res2.ok) {
      const data2 = await res2.json();
      if (data2.reply) {
        outBox.innerText = data2.reply;
        return;
      }
    }
  } catch (err) {
    console.warn("AI Server waking up, using local blueprint generator:", err);
  }

  // 3. Instant Local Strategic Blueprint if Backend is Sleeping
  outBox.innerText = `🚀 EXECUTIVE BLUEPRINT FOR: ${startupName}\nQuery: "${promptText}"\n\n1. PROBLEM & MARKET GAP:\nLocal merchants & founders struggle with fragmented tools. Your unified platform consolidates execution, storefront management, and knowledge recovery.\n\n2. 7-SLIDE PITCH STRUCTURE:\n• Slide 1 (Vision): Operating System for High-Velocity Founders & SMBs.\n• Slide 2 (Problem): 80% of ideas & local inventory records are lost in scattered apps.\n• Slide 3 (Solution): ${startupName} — Unified Cloud + AI Second Brain.\n• Slide 4 (Business Model): Tiered SaaS (₹199 / ₹399 / ₹799 per month).\n• Slide 5 (Traction): ${DB.startups.length} Startups tracked, ${DB.tasks.length} Execution tasks active.\n• Slide 6 (Go-To-Market): Direct field onboarding + busi.tech content distribution.\n• Slide 7 (Financial Ask): Scaling cloud infrastructure & merchant acquisition.`;
}

async function saveAIOutputToVault() {
  const content = document.getElementById("aiOutputBox")?.innerText || "";
  if (!content) return;
  const newItem = {
    id: Date.now(),
    title: "AI Co-Founder Blueprint & Pitch Deck",
    category: "Note",
    content: content,
    tags: "ai,pitchdeck,strategy"
  };
  DB.knowledge.unshift(newItem);
  if (window.saveLocalCache) saveLocalCache();
  if (window.renderAllPages) renderAllPages();
  alert("Saved to Knowledge Vault!");

  try {
    await fetch(`${API_BASE_URL}/api/knowledge`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(newItem)
    });
  } catch (e) {}
}

function startVoiceCommand() {
  const SpeechRec = window.SpeechRecognition || window.webkitSpeechRecognition;
  if (!SpeechRec) return alert("Voice Recognition works best in Google Chrome or Edge.");
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

// SaaS Revenue Calculator
function calculateSaaSMetrics() {
  const cust = Number(document.getElementById("simCustomers")?.value || 250);
  const arpu = Number(document.getElementById("simArpu")?.value || 399);
  const burn = Number(document.getElementById("simBurn")?.value || 15000);
  const mult = Number(document.getElementById("simMult")?.value || 8);

  if (!document.getElementById("lblCustomers")) return;
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

// Whiteboard Sketchpad
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
  canvas?.getContext("2d").clearRect(0, 0, canvas.width, canvas.height);
}

async function saveWhiteboardToImageVault() {
  const canvas = document.getElementById("whiteboardCanvas");
  const title = document.getElementById("wbSketchTitle").value || "System Architecture Sketch";
  const dataUrl = canvas.toDataURL("image/png");

  const newSketch = {
    id: Date.now(),
    title: title,
    category: "Image",
    content: "Whiteboard Architecture Sketch",
    media_url: dataUrl,
    tags: "sketch,architecture"
  };
  DB.knowledge.unshift(newSketch);
  if (window.saveLocalCache) saveLocalCache();
  if (window.renderAllPages) renderAllPages();
  alert("Sketch saved directly to your Image Vault!");

  try {
    await fetch(`${API_BASE_URL}/api/power/save_sketch`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ title: title, image_base64: dataUrl })
    });
  } catch (e) {}
}

// Non-AI Core Tools Functions (Finance, Code Vault, Cap Table, Checklist)
function renderFinanceLedger() {
  const txs = CORE_DATA.transactions;
  const totalInc = txs.filter(t => t.type === "Income").reduce((a, b) => a + Number(b.amount), 0);
  const totalExp = txs.filter(t => t.type === "Expense").reduce((a, b) => a + Number(b.amount), 0);
  const netBal = totalInc - totalExp;

  const sumBox = document.getElementById("financeSummaryCards");
  if (sumBox) {
    sumBox.innerHTML = `
      <div class="col-md-4"><div class="glass-card border-success"><small class="text-secondary">Total Revenue / Inflow</small><div class="fs-3 fw-bold text-success">+ ₹${totalInc.toLocaleString("en-IN")}</div></div></div>
      <div class="col-md-4"><div class="glass-card border-danger"><small class="text-secondary">Total Expenses / Burn</small><div class="fs-3 fw-bold text-danger">- ₹${totalExp.toLocaleString("en-IN")}</div></div></div>
      <div class="col-md-4"><div class="glass-card border-info"><small class="text-secondary">Net Treasury Balance</small><div class="fs-3 fw-bold text-info">₹${netBal.toLocaleString("en-IN")}</div></div></div>
    `;
  }

  const tbody = document.getElementById("financeLedgerBody");
  if (tbody) {
    tbody.innerHTML = txs.map(t => `
      <tr>
        <td>${t.date}</td>
        <td class="fw-semibold">${t.title}</td>
        <td><span class="pill-badge pill-violet">${t.category}</span></td>
        <td><span class="pill-badge ${t.type === 'Income' ? 'pill-emerald' : 'pill-crimson'}">${t.type}</span></td>
        <td class="fw-bold ${t.type === 'Income' ? 'text-success' : 'text-danger'}">${t.type === 'Income' ? '+' : '-'} ₹${Number(t.amount).toLocaleString("en-IN")}</td>
        <td><button class="btn btn-sm btn-outline-danger py-0 px-2 adv-del-btn" onclick="deleteFinanceTx(${t.id})"><i class="fa-solid fa-trash"></i></button></td>
      </tr>
    `).join("");
  }
}

function addFinanceTransaction(e) {
  e.preventDefault();
  CORE_DATA.transactions.unshift({
    id: Date.now(),
    title: document.getElementById("finTitle").value,
    type: document.getElementById("finType").value,
    category: document.getElementById("finCat").value,
    amount: Number(document.getElementById("finAmount").value),
    date: document.getElementById("finDate").value
  });
  saveCoreData();
  e.target.reset();
  renderFinanceLedger();
}

function deleteFinanceTx(id) {
  CORE_DATA.transactions = CORE_DATA.transactions.filter(t => t.id !== id);
  saveCoreData();
  renderFinanceLedger();
}

function renderCodeVault() {
  const grid = document.getElementById("codeVaultGrid");
  if (!grid) return;
  grid.innerHTML = CORE_DATA.snippets.map(s => `
    <div class="col-md-6">
      <div class="glass-card h-100 d-flex flex-column justify-content-between">
        <div>
          <div class="d-flex justify-content-between align-items-center mb-2">
            <div>
              <span class="pill-badge pill-cyan me-1">${s.lang}</span>
              <span class="small text-secondary">${s.tags}</span>
            </div>
            <div class="d-flex gap-1">
              <button class="btn btn-sm btn-outline-info py-0 px-2" onclick="copySnippetCode(${s.id})"><i class="fa-regular fa-copy me-1"></i>Copy</button>
              <button class="btn btn-sm btn-outline-danger py-0 px-2 adv-del-btn" onclick="deleteCodeSnippet(${s.id})"><i class="fa-solid fa-trash"></i></button>
            </div>
          </div>
          <h6 class="fw-bold mb-2">${s.title}</h6>
          <pre class="p-3 rounded bg-dark border border-info text-info small mb-0 font-monospace" style="overflow-x:auto;"><code>${s.code.replace(/</g, "&lt;")}</code></pre>
        </div>
      </div>
    </div>
  `).join("");
}

function addCodeSnippet(e) {
  e.preventDefault();
  CORE_DATA.snippets.unshift({
    id: Date.now(),
    title: document.getElementById("snipTitle").value,
    lang: document.getElementById("snipLang").value,
    tags: document.getElementById("snipTags").value,
    code: document.getElementById("snipCode").value
  });
  saveCoreData();
  e.target.reset();
  renderCodeVault();
}

function copySnippetCode(id) {
  const snip = CORE_DATA.snippets.find(s => s.id === id);
  if (snip) {
    navigator.clipboard.writeText(snip.code);
    alert("Code copied to clipboard!");
  }
}

function deleteCodeSnippet(id) {
  CORE_DATA.snippets = CORE_DATA.snippets.filter(s => s.id !== id);
  saveCoreData();
  renderCodeVault();
}

function renderCapTable() {
  const tbody = document.getElementById("capTableBody");
  if (!tbody) return;
  const valuation = Number(document.getElementById("capValuationInput")?.value || 50000000);
  const totalShares = CORE_DATA.cap_table.reduce((a, b) => a + Number(b.shares), 0) || 1;

  tbody.innerHTML = CORE_DATA.cap_table.map(c => {
    const pct = ((c.shares / totalShares) * 100).toFixed(2);
    const val = Math.round((c.shares / totalShares) * valuation);
    return `
      <tr>
        <td class="fw-bold">${c.holder}</td>
        <td><span class="pill-badge pill-violet">${c.role}</span></td>
        <td>${Number(c.shares).toLocaleString("en-IN")}</td>
        <td><span class="fw-bold text-info">${pct}%</span></td>
        <td class="fw-bold text-success">₹${val.toLocaleString("en-IN")}</td>
        <td><button class="btn btn-sm btn-outline-danger py-0 px-2 adv-del-btn" onclick="deleteCapHolder(${c.id})"><i class="fa-solid fa-trash"></i></button></td>
      </tr>
    `;
  }).join("");
}

function addCapShareholder() {
  const name = document.getElementById("capHolderName").value.trim();
  const role = document.getElementById("capHolderRole").value;
  const shares = Number(document.getElementById("capHolderShares").value);
  if (!name || !shares) return;
  CORE_DATA.cap_table.push({ id: Date.now(), holder: name, role, shares });
  saveCoreData();
  document.getElementById("capHolderName").value = "";
  renderCapTable();
}

function deleteCapHolder(id) {
  CORE_DATA.cap_table = CORE_DATA.cap_table.filter(c => c.id !== id);
  saveCoreData();
  renderCapTable();
}

function renderLaunchChecklist() {
  const grid = document.getElementById("launchChecklistGrid");
  if (!grid) return;
  const total = CORE_DATA.checklist.length || 1;
  const doneCount = CORE_DATA.checklist.filter(c => c.done).length;
  const pct = Math.round((doneCount / total) * 100);

  document.getElementById("launchReadinessPct").innerText = pct + "% Ready";
  document.getElementById("launchReadinessBar").style.width = pct + "%";

  grid.innerHTML = CORE_DATA.checklist.map(item => `
    <div class="col-md-6">
      <div class="glass-card d-flex justify-content-between align-items-center py-3">
        <div class="d-flex align-items-center gap-3">
          <input type="checkbox" class="form-check-input fs-4 mt-0" ${item.done ? 'checked' : ''} onchange="toggleLaunchItem(${item.id})">
          <div>
            <span class="pill-badge pill-cyan mb-1" style="font-size:0.65rem;">${item.cat}</span>
            <div class="fw-semibold ${item.done ? 'text-decoration-line-through text-secondary' : ''}">${item.text}</div>
          </div>
        </div>
        <button class="btn btn-sm btn-outline-danger py-0 px-2 adv-del-btn" onclick="deleteLaunchItem(${item.id})"><i class="fa-solid fa-trash"></i></button>
      </div>
    </div>
  `).join("");
}

function addLaunchCheckItem(e) {
  e.preventDefault();
  CORE_DATA.checklist.push({
    id: Date.now(),
    cat: document.getElementById("lcCategory").value,
    text: document.getElementById("lcText").value,
    done: false
  });
  saveCoreData();
  e.target.reset();
  renderLaunchChecklist();
}

function toggleLaunchItem(id) {
  const item = CORE_DATA.checklist.find(c => c.id === id);
  if (item) item.done = !item.done;
  saveCoreData();
  renderLaunchChecklist();
}

function deleteLaunchItem(id) {
  CORE_DATA.checklist = CORE_DATA.checklist.filter(c => c.id !== id);
  saveCoreData();
  renderLaunchChecklist();
}

// Pomodoro, Synth & Lock Screen
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
    osc.type = "square";
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
  try {
    const text = await file.text();
    const parsed = JSON.parse(text);
    if (parsed.knowledge || parsed.startups) {
      DB = { ...DB, ...parsed };
      if (window.saveLocalCache) saveLocalCache();
      if (window.renderAllPages) renderAllPages();
    }
  } catch (err) {}

  try {
    const formData = new FormData();
    formData.append("file", file);
    await fetch(`${API_BASE_URL}/api/power/restore_backup`, { method: "POST", body: formData });
    syncDatabase();
  } catch (err) {}
  alert("Backup Restored Successfully into your Second Brain!");
}

window.addEventListener("DOMContentLoaded", () => {
  setTimeout(initPowerAddonsSuite, 150);
});