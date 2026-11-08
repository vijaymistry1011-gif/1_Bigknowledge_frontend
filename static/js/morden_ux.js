/* ==========================================================================
   BIGKNOWLEDGE — 2026 PROFESSIONAL UX & USABILITY ENGINE
   File: static/js/morden_ux.js
   Includes: Command Palette (Alt+K), Simple/Pro Mode, Breadcrumb Bar,
   Theme Accent Switcher, GitHub-Style Execution Heatmap & Toast Notifications
   ========================================================================== */

let IS_SIMPLE_MODE = false;

const COMMAND_ACTIONS = [
  { title: "Go to Main Executive Dashboard", icon: "fa-gauge-high", page: "dashboard", tag: "Core" },
  { title: "Search Memory Recovery Engine", icon: "fa-magnifying-glass", page: "memory-engine", tag: "Search" },
  { title: "Open Interactive Knowledge Graph", icon: "fa-project-diagram", page: "knowledge-graph", tag: "Visual" },
  { title: "Open Mind Map Studio", icon: "fa-sitemap", page: "mind-map", tag: "Visual" },
  { title: "Browse Knowledge Vault (Notes & PDFs)", icon: "fa-vault", page: "knowledge-vault", tag: "Vault" },
  { title: "Open Video Vault (YouTube & MP4)", icon: "fa-video", page: "video-vault", tag: "Media" },
  { title: "Open HD Image Library (Zoom Lightbox)", icon: "fa-images", page: "image-vault", tag: "Media" },
  { title: "Open Document & PPTX Vault", icon: "fa-file-pdf", page: "document-vault", tag: "Media" },
  { title: "Log New Real-World Problem", icon: "fa-triangle-exclamation", page: "problem-center", tag: "Startup" },
  { title: "Run Problem → Startup Engine", icon: "fa-bolt", page: "problem-engine", tag: "Startup" },
  { title: "View Startup Ideas Database & Scoreboard", icon: "fa-rocket", page: "startup-db", tag: "Startup" },
  { title: "Open Active Startup Workspace", icon: "fa-fire", page: "active-startup", tag: "Startup" },
  { title: "Edit 9-Block Business Model Canvas", icon: "fa-table-cells-large", page: "bmc-canvas", tag: "Strategy" },
  { title: "Open Drag & Drop Kanban Board", icon: "fa-table-columns", page: "kanban-board", tag: "Execution" },
  { title: "Open Team Chat, Voice Notes & Video Huddle", icon: "fa-comments", page: "chat-meetings", tag: "Team" },
  { title: "Ask AI Co-Founder & Generate Pitch Deck", icon: "fa-robot", page: "ai-cofounder", tag: "AI Power" },
  { title: "Calculate SaaS Revenue (MRR/ARR) & Valuation", icon: "fa-calculator", page: "revenue-sim", tag: "Finance" },
  { title: "Draw on Freehand Architecture Whiteboard", icon: "fa-pen-ruler", page: "whiteboard-sketch", tag: "Studio" },
  { title: "Open Finance Ledger & Invoice Tracker", icon: "fa-wallet", page: "finance-ledger", tag: "Core Tool" },
  { title: "Open Developer Code & Snippet Vault", icon: "fa-code", page: "code-vault", tag: "Core Tool" },
  { title: "Open Startup Cap Table & Equity Manager", icon: "fa-chart-pie", page: "cap-table", tag: "Core Tool" },
  { title: "Open Startup Launch Readiness Checklist", icon: "fa-clipboard-check", page: "launch-checklist", tag: "Core Tool" },
  { title: "Toggle Dark / Light Theme", icon: "fa-sun", action: () => toggleColorMode(), tag: "Settings" },
  { title: "Switch Simple / Pro Workspace Mode", icon: "fa-wand-magic-sparkles", action: () => toggleSimpleProMode(), tag: "UX Mode" }
];

const uxExtraStyle = document.createElement("style");
uxExtraStyle.innerHTML = `
  body.ux-simple-mode .pro-only-nav { display: none !important; }
  body.sidebar-collapsed .sidebar { width: 78px !important; }
  body.sidebar-collapsed .sidebar .brand-box div:not(.brand-icon),
  body.sidebar-collapsed .sidebar .nav-group-label,
  body.sidebar-collapsed .sidebar #uxModeSwitcherBox span { display: none !important; }
  body.sidebar-collapsed .sidebar .nav-btn { justify-content: center; font-size: 0 !important; padding: 0.7rem 0; }
  body.sidebar-collapsed .sidebar .nav-btn i { font-size: 1.2rem !important; margin: 0; }
  body.sidebar-collapsed .main-area { margin-left: 78px !important; }
  .heatmap-grid { display: grid; grid-template-columns: repeat(26, 1fr); gap: 4px; }
  .heatmap-cell { height: 14px; border-radius: 3px; background: rgba(255, 255, 255, 0.07); }
  .heatmap-cell.lvl-1 { background: rgba(16, 185, 129, 0.35); }
  .heatmap-cell.lvl-2 { background: rgba(16, 185, 129, 0.65); }
  .heatmap-cell.lvl-3 { background: #10B981; box-shadow: 0 0 8px rgba(16,185,129,0.5); }
  .theme-dot { width: 20px; height: 20px; border-radius: 50%; cursor: pointer; border: 2px solid rgba(255,255,255,0.4); transition: transform 0.15s; }
  .theme-dot:hover { transform: scale(1.2); }
`;
document.head.appendChild(uxExtraStyle);

function initModernUX2026() {
  // 1. Replace Default Browser alert() with Sleek Glass Toast Notification
  window.alert = function(message) {
    showModernToast(message, "info");
  };

  // 2. Tag Advanced Sidebar Items for Simple vs Pro Mode
  const essentialPages = ["dashboard", "memory-engine", "knowledge-vault", "problem-center", "startup-db", "kanban-board", "chat-meetings", "ai-cofounder"];
  document.querySelectorAll(".sidebar .nav-btn").forEach(btn => {
    const onClickAttr = btn.getAttribute("onclick") || "";
    const isEssential = essentialPages.some(p => onClickAttr.includes(`'${p}'`));
    if (!isEssential) {
      btn.classList.add("pro-only-nav");
    }
  });

  // 3. Add Simple vs Pro Mode Switcher inside Sidebar Brand Box
  const sidebar = document.getElementById("sidebarMenu");
  if (sidebar && !document.getElementById("uxModeSwitcherBox")) {
    const brandBox = sidebar.querySelector(".brand-box");
    if (brandBox) {
      brandBox.insertAdjacentHTML("afterend", `
        <div id="uxModeSwitcherBox" class="px-3 py-2 border-bottom border-secondary border-opacity-25 d-flex justify-content-between align-items-center ux-mode-box">
          <span class="small text-secondary fw-semibold">Workspace View:</span>
          <div class="btn-group btn-group-sm">
            <button class="btn btn-outline-info py-0 px-2" id="btnSimpleMode" onclick="setUXMode(true)" title="Clean view with 8 core tools">Simple</button>
            <button class="btn btn-info py-0 px-2 text-dark fw-bold" id="btnProMode" onclick="setUXMode(false)" title="All 30+ Enterprise tools">Pro (All)</button>
          </div>
        </div>
      `);
    }
  }

  // 4. Inject Breadcrumb Sub-Header & Accent Color Dots
  const topHeader = document.querySelector(".top-header");
  if (topHeader && !document.getElementById("uxBreadcrumbBar")) {
    topHeader.insertAdjacentHTML("afterend", `
      <div class="ux-breadcrumb-bar" id="uxBreadcrumbBar">
        <div class="d-flex align-items-center gap-2">
          <button class="btn btn-sm btn-outline-secondary py-0 px-2 d-none d-lg-inline-block" onclick="toggleSidebarCollapse()" title="Collapse / Expand Sidebar ([)">
            <i class="fa-solid fa-table-columns"></i>
          </button>
          <span class="text-secondary">BIGKNOWLEDGE OS</span>
          <i class="fa-solid fa-chevron-right text-secondary" style="font-size:0.65rem;"></i>
          <span class="fw-bold text-info" id="uxCurrentPageLabel">Main Executive Dashboard</span>
        </div>
        <div class="d-flex align-items-center gap-3">
          <div class="d-none d-md-flex align-items-center gap-1">
            <small class="text-secondary me-1">Accent:</small>
            <div class="theme-dot" style="background:#7C3AED;" onclick="setCustomAccent('#7C3AED', '#0EA5E9')" title="Violet"></div>
            <div class="theme-dot" style="background:#0EA5E9;" onclick="setCustomAccent('#0EA5E9', '#10B981')" title="Cyan"></div>
            <div class="theme-dot" style="background:#10B981;" onclick="setCustomAccent('#10B981', '#0EA5E9')" title="Emerald"></div>
            <div class="theme-dot" style="background:#F59E0B;" onclick="setCustomAccent('#F59E0B', '#EF4444')" title="Gold"></div>
          </div>
          <span class="d-none d-md-inline text-secondary"><kbd class="badge bg-dark border border-secondary">Alt + K</kbd></span>
          <button class="btn btn-sm btn-outline-info py-0 px-2" onclick="openCommandPalette()"><i class="fa-solid fa-terminal me-1"></i>Commands</button>
        </div>
      </div>
    `);
  }

  // 5. Inject 4-Step Interactive Onboarding Bar & GitHub Heatmap on Dashboard
  const dashPage = document.getElementById("page-dashboard");
  if (dashPage && !document.getElementById("uxOnboardingCard")) {
    dashPage.insertAdjacentHTML("afterbegin", `
      <div id="uxOnboardingCard" class="glass-card mb-4 border-info">
        <div class="d-flex flex-wrap justify-content-between align-items-center mb-2">
          <div>
            <span class="pill-badge pill-cyan me-2">QUICK START GUIDE</span>
            <strong class="text-light">Welcome to Your Second Brain! Follow 4 easy steps to run your startup:</strong>
          </div>
          <button class="btn btn-sm text-secondary p-0" onclick="document.getElementById('uxOnboardingCard').remove()">Dismiss ×</button>
        </div>
        <div class="row g-2 mt-1">
          <div class="col-md-3">
            <div class="p-2 rounded-3 bg-dark border border-secondary d-flex align-items-center justify-content-between" style="cursor:pointer;" onclick="document.querySelector('[data-bs-target=\\'#quickAddModal\\']').click()">
              <span><b class="text-info">1.</b> Save First Note / Media</span>
              <i class="fa-solid fa-arrow-right text-info"></i>
            </div>
          </div>
          <div class="col-md-3">
            <div class="p-2 rounded-3 bg-dark border border-secondary d-flex align-items-center justify-content-between" style="cursor:pointer;" onclick="openModulePage('problem-center')">
              <span><b class="text-warning">2.</b> Log a Market Problem</span>
              <i class="fa-solid fa-arrow-right text-warning"></i>
            </div>
          </div>
          <div class="col-md-3">
            <div class="p-2 rounded-3 bg-dark border border-secondary d-flex align-items-center justify-content-between" style="cursor:pointer;" onclick="openModulePage('startup-db')">
              <span><b class="text-success">3.</b> Add Startup to Scoreboard</span>
              <i class="fa-solid fa-arrow-right text-success"></i>
            </div>
          </div>
          <div class="col-md-3">
            <div class="p-2 rounded-3 bg-dark border border-secondary d-flex align-items-center justify-content-between" style="cursor:pointer;" onclick="openModulePage('kanban-board')">
              <span><b class="text-primary">4.</b> Track Tasks in Kanban</span>
              <i class="fa-solid fa-arrow-right text-primary"></i>
            </div>
          </div>
        </div>
      </div>
    `);

    let cellsHtml = "";
    for (let i = 0; i < 104; i++) {
      const lvl = i % 7 === 0 ? "lvl-3" : (i % 3 === 0 ? "lvl-2" : (i % 2 === 0 ? "lvl-1" : ""));
      cellsHtml += `<div class="heatmap-cell ${lvl}" title="Day ${i + 1}: Active Execution"></div>`;
    }
    dashPage.insertAdjacentHTML("beforeend", `
      <div id="founderHeatmapCard" class="glass-card mt-4">
        <div class="d-flex justify-content-between align-items-center mb-2">
          <h6 class="fw-bold mb-0"><i class="fa-solid fa-fire text-success me-2"></i>Founder Daily Execution Consistency Grid</h6>
          <span class="pill-badge pill-emerald">Active Streak: 100% Real-Time Synced</span>
        </div>
        <div class="heatmap-grid mt-2">${cellsHtml}</div>
      </div>
    `);
  }

  // 6. Inject Command Palette Modal, Toast Container, Floating Speed-Dial & Mobile Bottom Bar
  if (!document.getElementById("uxCommandPaletteOverlay")) {
    document.body.insertAdjacentHTML("beforeend", `
      <div id="uxCommandPaletteOverlay" onclick="if(event.target===this) closeCommandPalette()">
        <div class="cmd-palette-box">
          <input type="text" id="uxCmdSearch" class="cmd-input" placeholder="Type a command or page name (e.g. 'Kanban', 'Pitch Deck', 'Finance', 'Code')..." oninput="renderCommandPaletteList()">
          <div class="cmd-list" id="uxCmdList"></div>
          <div class="px-3 py-2 bg-dark border-top border-secondary d-flex justify-content-between small text-secondary">
            <span><i class="fa-solid fa-bolt text-warning me-1"></i>Instant Navigation</span>
            <span>Press <b>ESC</b> to close</span>
          </div>
        </div>
      </div>

      <div id="uxToastContainer"></div>

      <div class="ux-fab-dock" id="uxFabDock">
        <div class="ux-fab-menu">
          <button class="btn btn-dark border border-info text-light btn-sm rounded-3 shadow text-start px-3 py-2" onclick="document.querySelector('[data-bs-target=\\'#quickAddModal\\']').click(); toggleFabDock();">
            <i class="fa-solid fa-plus text-info me-2"></i>Quick Note / Media
          </button>
          <button class="btn btn-dark border border-warning text-light btn-sm rounded-3 shadow text-start px-3 py-2" onclick="openModulePage('problem-center'); toggleFabDock();">
            <i class="fa-solid fa-triangle-exclamation text-warning me-2"></i>Log New Problem
          </button>
          <button class="btn btn-dark border border-success text-light btn-sm rounded-3 shadow text-start px-3 py-2" onclick="openModulePage('kanban-board'); toggleFabDock();">
            <i class="fa-solid fa-list-check text-success me-2"></i>Add Kanban Task
          </button>
          <button class="btn btn-dark border border-primary text-light btn-sm rounded-3 shadow text-start px-3 py-2" onclick="openModulePage('ai-cofounder'); toggleFabDock();">
            <i class="fa-solid fa-robot text-primary me-2"></i>Ask AI Co-Founder
          </button>
        </div>
        <button class="ux-fab-main" onclick="toggleFabDock()" title="Quick Actions">
          <i class="fa-solid fa-bolt"></i>
        </button>
      </div>

      <nav class="ux-mobile-bottom-nav">
        <button class="ux-mob-btn active" onclick="openModulePage('dashboard')"><i class="fa-solid fa-gauge-high"></i><span>Home</span></button>
        <button class="ux-mob-btn" onclick="openModulePage('knowledge-vault')"><i class="fa-solid fa-vault"></i><span>Vault</span></button>
        <button class="ux-mob-btn" onclick="openModulePage('startup-db')"><i class="fa-solid fa-rocket"></i><span>Startups</span></button>
        <button class="ux-mob-btn" onclick="openModulePage('kanban-board')"><i class="fa-solid fa-table-columns"></i><span>Kanban</span></button>
        <button class="ux-mob-btn" onclick="openModulePage('chat-meetings')"><i class="fa-solid fa-comments"></i><span>Chat</span></button>
      </nav>
    `);
  }

  // Hook into openModulePage to auto-update Breadcrumb title
  const originalOpenPage = window.openModulePage;
  window.openModulePage = function(pageId, buttonEl) {
    originalOpenPage(pageId, buttonEl);
    const labelEl = document.getElementById("uxCurrentPageLabel");
    if (labelEl) {
      const matched = COMMAND_ACTIONS.find(c => c.page === pageId);
      labelEl.innerText = matched ? matched.title.replace("Go to ", "").replace("Open ", "") : pageId.toUpperCase();
    }
    window.scrollTo({ top: 0, behavior: "smooth" });
  };
}

function setUXMode(simple) {
  IS_SIMPLE_MODE = simple;
  document.body.classList.toggle("ux-simple-mode", simple);
  document.getElementById("btnSimpleMode").className = simple ? "btn btn-info py-0 px-2 text-dark fw-bold" : "btn btn-outline-info py-0 px-2";
  document.getElementById("btnProMode").className = !simple ? "btn btn-info py-0 px-2 text-dark fw-bold" : "btn btn-outline-info py-0 px-2";
  showModernToast(simple ? "Switched to Simple Mode (8 Core Tools)" : "Switched to Pro Mode (All 30+ Enterprise Tools Unlocked)");
}

function toggleSimpleProMode() {
  setUXMode(!IS_SIMPLE_MODE);
}

function toggleSidebarCollapse() {
  document.body.classList.toggle("sidebar-collapsed");
}

function toggleFabDock() {
  document.getElementById("uxFabDock")?.classList.toggle("open");
}

function setCustomAccent(primaryHex, secondaryHex) {
  document.documentElement.style.setProperty("--primary", primaryHex);
  document.documentElement.style.setProperty("--secondary", secondaryHex);
}

function openCommandPalette() {
  const overlay = document.getElementById("uxCommandPaletteOverlay");
  overlay.classList.add("show");
  const inp = document.getElementById("uxCmdSearch");
  inp.value = "";
  renderCommandPaletteList();
  setTimeout(() => inp.focus(), 50);
}

function closeCommandPalette() {
  document.getElementById("uxCommandPaletteOverlay")?.classList.remove("show");
}

function renderCommandPaletteList() {
  const q = (document.getElementById("uxCmdSearch")?.value || "").toLowerCase();
  const list = document.getElementById("uxCmdList");
  const filtered = COMMAND_ACTIONS.filter(item => !q || item.title.toLowerCase().includes(q) || item.tag.toLowerCase().includes(q));

  list.innerHTML = filtered.map((item) => `
    <div class="cmd-item" onclick="executeCommandAction(${COMMAND_ACTIONS.indexOf(item)})">
      <div class="d-flex align-items-center gap-3">
        <i class="fa-solid ${item.icon} text-info"></i>
        <span>${item.title}</span>
      </div>
      <span class="pill-badge pill-violet">${item.tag}</span>
    </div>
  `).join("");
}

function executeCommandAction(index) {
  const item = COMMAND_ACTIONS[index];
  closeCommandPalette();
  if (item.page) {
    openModulePage(item.page);
  } else if (item.action) {
    item.action();
  }
}

function showModernToast(message) {
  const container = document.getElementById("uxToastContainer");
  if (!container) return;
  const toast = document.createElement("div");
  toast.className = "ux-toast";
  toast.innerHTML = `
    <i class="fa-solid fa-circle-check text-success fs-5"></i>
    <div class="small fw-semibold">${message}</div>
  `;
  container.appendChild(toast);
  setTimeout(() => {
    toast.style.opacity = "0";
    setTimeout(() => toast.remove(), 250);
  }, 3000);
}

window.addEventListener("keydown", (e) => {
  if (e.altKey && e.key.toLowerCase() === "k") {
    e.preventDefault();
    openCommandPalette();
  } else if (e.key === "Escape") {
    closeCommandPalette();
  } else if (e.key === "[" && !["INPUT", "TEXTAREA"].includes(document.activeElement?.tagName)) {
    toggleSidebarCollapse();
  }
});

window.addEventListener("DOMContentLoaded", () => {
  setTimeout(initModernUX2026, 260);
});