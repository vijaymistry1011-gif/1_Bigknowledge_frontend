let DB = {
  knowledge: [],
  problems: [],
  solutions: [],
  innovations: [],
  startups: [],
  tasks: [],
  roadmaps: [],
  journals: [],
  goals_habits: [],
  org_crm: []
};

let dashboardChartInstance = null;
let analyticsChartInstance = null;
const KANBAN_STAGES = ["Ideas", "Researching", "Planning", "Building", "Testing", "Completed"];

function openModulePage(pageId, buttonEl) {
  document.querySelectorAll(".module-page").forEach(sec => sec.classList.remove("active"));
  const target = document.getElementById("page-" + pageId);
  if (target) target.classList.add("active");

  if (buttonEl) {
    document.querySelectorAll(".nav-btn").forEach(btn => btn.classList.remove("active"));
    buttonEl.classList.add("active");
  }

  if (pageId === "knowledge-graph") setTimeout(renderKnowledgeGraphCanvas, 60);
  if (pageId === "mind-map") setTimeout(renderMindMapCanvas, 60);
  document.getElementById("sidebarMenu")?.classList.remove("open");
}

function toggleColorMode() {
  const root = document.documentElement;
  const next = root.getAttribute("data-theme") === "dark" ? "light" : "dark";
  root.setAttribute("data-theme", next);
  const iconBtn = document.getElementById("themeSwitchBtn");
  if (iconBtn) {
    iconBtn.innerHTML = next === "dark" ? '<i class="fa-solid fa-sun"></i>' : '<i class="fa-solid fa-moon"></i>';
  }
}

async function syncDatabase() {
  try {
    const response = await fetch("/api/bootstrap");
    DB = await response.json();
    renderAllPages();
    updateRealTimeCharts(); // Database se real chart update karega
  } catch (err) {
    console.error("Database sync failed:", err);
  }
}

function renderAllPages() {
  renderExecutiveDashboard();
  renderKnowledgeVault();
  renderMediaVaults();
  renderProblemsAndEngine();
  renderSolutionsAndInnovations();
  renderStartupsAndWorkspace();
  renderTasksAndKanban();
  renderJournals();
  executeMemorySearch();
  renderKnowledgeGraphCanvas();
}

// 1. REAL EXECUTIVE DASHBOARD & INTERACTIVE STARTUP SCOREBOARD
function renderExecutiveDashboard() {
  const videosCount = DB.knowledge.filter(k => k.category === "Video").length;
  const imagesCount = DB.knowledge.filter(k => k.category === "Image").length;
  const docsCount = DB.knowledge.filter(k => ["Document", "PDF"].includes(k.category)).length;

  const metrics = [
    { title: "Total Knowledge", val: DB.knowledge.length, icon: "fa-brain", badge: "pill-violet" },
    { title: "Startup Ideas", val: DB.startups.length, icon: "fa-rocket", badge: "pill-cyan" },
    { title: "Problems Logged", val: DB.problems.length, icon: "fa-triangle-exclamation", badge: "pill-amber" },
    { title: "Solutions Built", val: DB.solutions.length, icon: "fa-lightbulb", badge: "pill-emerald" },
    { title: "Documents/PDFs", val: docsCount, icon: "fa-file-pdf", badge: "pill-crimson" },
    { title: "Videos Saved", val: videosCount, icon: "fa-video", badge: "pill-cyan" },
    { title: "Images Saved", val: imagesCount, icon: "fa-image", badge: "pill-amber" },
    { title: "Active Startups", val: DB.startups.filter(s => s.stage !== "Idea").length, icon: "fa-fire", badge: "pill-emerald" },
    { title: "Completed Tasks", val: DB.tasks.filter(t => t.kanban_stage === "Completed").length, icon: "fa-check-double", badge: "pill-emerald" },
    { title: "Total Tasks", val: DB.tasks.length, icon: "fa-diagram-project", badge: "pill-cyan" }
  ];

  const kpiGrid = document.getElementById("dashboardKpiContainer");
  if (kpiGrid) {
    kpiGrid.innerHTML = metrics.map(m => `
      <div class="col-6 col-md-4 col-xl-2">
        <div class="glass-card kpi-box h-100">
          <div>
            <div class="text-secondary" style="font-size:0.75rem;">${m.title}</div>
            <div class="fs-4 fw-bold mt-1">${m.val}</div>
          </div>
          <div class="kpi-icon-badge ${m.badge}">
            <i class="fa-solid ${m.icon}"></i>
          </div>
        </div>
      </div>
    `).join("");
  }

  // Real Interactive Startup Scoreboard
  const scoreboard = document.getElementById("startupScoreboardContainer");
  if (scoreboard) {
    if (DB.startups.length === 0) {
      scoreboard.innerHTML = `<div class="text-secondary small p-3 text-center border border-secondary border-opacity-25 rounded-3">Abhi koi startup add nahi hai. Niche "+ Add Real Startup" button se apna startup jodein.</div>`;
    } else {
      scoreboard.innerHTML = DB.startups.map(st => `
        <div class="p-3 rounded-3 border border-secondary border-opacity-25">
          <div class="d-flex justify-content-between align-items-center mb-1">
            <span class="fw-bold text-info">${st.name}</span>
            <div class="d-flex align-items-center gap-2">
              <span class="pill-badge pill-emerald">Score: ${st.feasibility_score}/100</span>
              <button class="btn btn-sm btn-outline-danger py-0 px-1" onclick="deleteStartup(${st.id})" title="Delete"><i class="fa-solid fa-trash"></i></button>
            </div>
          </div>
          <div class="small text-secondary mb-2">${st.stage} • ${st.revenue_model} (${st.market_size})</div>
          <div class="d-flex align-items-center gap-2">
            <input type="range" class="form-range" min="0" max="100" value="${st.progress}" onchange="updateStartupProgress(${st.id}, this.value)">
            <span class="small fw-bold" style="min-width:42px;">${st.progress}%</span>
          </div>
        </div>
      `).join("");
    }
  }
}

async function updateStartupProgress(id, newProgress) {
  await fetch("/api/startups", {
    method: "PUT",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ id: id, progress: Number(newProgress) })
  });
  syncDatabase();
}

async function deleteStartup(id) {
  await fetch(`/api/startups?id=${id}`, { method: "DELETE" });
  syncDatabase();
}

// 2. REAL-TIME CHARTS (Connected to Actual Database Counts)
function updateRealTimeCharts() {
  const realCounts = [
    DB.knowledge.length,
    DB.problems.length,
    DB.solutions.length,
    DB.startups.length,
    DB.tasks.length,
    DB.tasks.filter(t => t.kanban_stage === "Completed").length
  ];

  const ctx1 = document.getElementById("dashboardVelocityChart");
  if (ctx1) {
    if (dashboardChartInstance) dashboardChartInstance.destroy();
    dashboardChartInstance = new Chart(ctx1, {
      type: "bar",
      data: {
        labels: ["Knowledge Items", "Problems Logged", "Solutions", "Startups", "Total Tasks", "Completed Tasks"],
        datasets: [{
          label: "Live Database Count",
          data: realCounts,
          backgroundColor: ["#7C3AED", "#F59E0B", "#0EA5E9", "#10B981", "#6366F1", "#22C55E"],
          borderRadius: 8
        }]
      },
      options: {
        plugins: { legend: { labels: { color: "#94A3B8" } } },
        scales: {
          x: { ticks: { color: "#94A3B8" } },
          y: { beginAtZero: true, ticks: { stepSize: 1, color: "#94A3B8" } }
        }
      }
    });
  }

  const ctx2 = document.getElementById("analyticsCenterChart");
  if (ctx2) {
    if (analyticsChartInstance) analyticsChartInstance.destroy();
    const startupLabels = DB.startups.length ? DB.startups.map(s => s.name) : ["No Startup Yet"];
    const startupProgress = DB.startups.length ? DB.startups.map(s => s.progress) : [0];
    const startupScores = DB.startups.length ? DB.startups.map(s => s.feasibility_score) : [0];

    analyticsChartInstance = new Chart(ctx2, {
      type: "bar",
      data: {
        labels: startupLabels,
        datasets: [
          { label: "Startup Progress (%)", data: startupProgress, backgroundColor: "#0EA5E9" },
          { label: "Feasibility Score (/100)", data: startupScores, backgroundColor: "#10B981" }
        ]
      },
      options: {
        scales: {
          x: { ticks: { color: "#94A3B8" } },
          y: { beginAtZero: true, max: 100, ticks: { color: "#94A3B8" } }
        }
      }
    });
  }
}

// 3. REAL DYNAMIC KNOWLEDGE GRAPH (Draws actual DB Problems, Solutions, and Startups)
function renderKnowledgeGraphCanvas() {
  const canvas = document.getElementById("knowledgeGraphCanvas");
  if (!canvas) return;
  const ctx = canvas.getContext("2d");
  ctx.clearRect(0, 0, canvas.width, canvas.height);

  if (DB.problems.length === 0 && DB.startups.length === 0 && DB.knowledge.length === 0) {
    ctx.fillStyle = "#94A3B8";
    ctx.font = "600 16px Inter";
    ctx.textAlign = "center";
    ctx.fillText("Database khali hai! Jab aap Problems, Startups ya Notes add karenge, to unka Real Graph yahan banega.", canvas.width / 2, canvas.height / 2);
    return;
  }

  const nodes = [];
  const links = [];

  // Central Brain Node
  nodes.push({ x: 130, y: 240, label: "BIGKNOWLEDGE\nCORE BRAIN", color: "#7C3AED" });

  // Add Real Problems from DB
  DB.problems.slice(0, 4).forEach((p, idx) => {
    const yPos = 90 + idx * 100;
    nodes.push({ x: 420, y: yPos, label: "PROBLEM:\n" + p.title.slice(0, 16), color: "#F59E0B" });
    links.push([0, nodes.length - 1]);
  });

  // Add Real Solutions from DB
  DB.solutions.slice(0, 4).forEach((s, idx) => {
    const yPos = 90 + idx * 100;
    nodes.push({ x: 720, y: yPos, label: "SOLUTION:\n" + s.solution_title.slice(0, 16), color: "#0EA5E9" });
    links.push([Math.min(idx + 1, nodes.length - 2), nodes.length - 1]);
  });

  // Add Real Startups from DB
  DB.startups.slice(0, 4).forEach((st, idx) => {
    const yPos = 90 + idx * 100;
    nodes.push({ x: 1000, y: yPos, label: `STARTUP (${st.progress}%):\n` + st.name.slice(0, 16), color: "#10B981" });
    links.push([Math.max(0, nodes.length - 2), nodes.length - 1]);
  });

  ctx.strokeStyle = "rgba(148, 163, 184, 0.45)";
  ctx.lineWidth = 2;
  links.forEach(([a, b]) => {
    if (nodes[a] && nodes[b]) {
      ctx.beginPath();
      ctx.moveTo(nodes[a].x, nodes[a].y);
      ctx.lineTo(nodes[b].x, nodes[b].y);
      ctx.stroke();
    }
  });

  nodes.forEach(n => {
    ctx.beginPath();
    ctx.arc(n.x, n.y, 44, 0, Math.PI * 2);
    ctx.fillStyle = n.color;
    ctx.shadowColor = n.color;
    ctx.shadowBlur = 14;
    ctx.fill();
    ctx.shadowBlur = 0;

    ctx.fillStyle = "#fff";
    ctx.font = "600 11px Inter";
    ctx.textAlign = "center";
    n.label.split("\n").forEach((line, i) => {
      ctx.fillText(line, n.x, n.y - 3 + i * 14);
    });
  });
}

function renderMindMapCanvas() {
  const canvas = document.getElementById("mindMapCanvas");
  if (!canvas) return;
  const ctx = canvas.getContext("2d");
  ctx.clearRect(0, 0, canvas.width, canvas.height);

  const center = { x: 560, y: 240, label: `SECOND BRAIN\n(${DB.knowledge.length + DB.startups.length} Items)`, color: "#7C3AED" };
  const branches = [
    { x: 220, y: 100, label: `Problems (${DB.problems.length})`, color: "#F59E0B" },
    { x: 220, y: 380, label: `Knowledge (${DB.knowledge.length})`, color: "#0EA5E9" },
    { x: 900, y: 100, label: `Startups (${DB.startups.length})`, color: "#10B981" },
    { x: 900, y: 380, label: `Tasks (${DB.tasks.length})`, color: "#EF4444" }
  ];

  ctx.strokeStyle = "rgba(124, 58, 237, 0.5)";
  ctx.lineWidth = 3;
  branches.forEach(b => {
    ctx.beginPath();
    ctx.moveTo(center.x, center.y);
    ctx.lineTo(b.x, b.y);
    ctx.stroke();
  });

  [center, ...branches].forEach((n, idx) => {
    ctx.beginPath();
    ctx.arc(n.x, n.y, idx === 0 ? 58 : 46, 0, Math.PI * 2);
    ctx.fillStyle = n.color;
    ctx.fill();
    ctx.fillStyle = "#fff";
    ctx.font = "600 12px Inter";
    ctx.textAlign = "center";
    n.label.split("\n").forEach((l, i) => ctx.fillText(l, n.x, n.y + i * 15));
  });
}

// 4. Knowledge Vault & Media Renderers
function renderKnowledgeVault() {
  const filter = document.getElementById("vaultFilterSelect")?.value || "ALL";
  const items = filter === "ALL" ? DB.knowledge : DB.knowledge.filter(k => k.category === filter);
  const grid = document.getElementById("knowledgeVaultContainer");
  if (!grid) return;

  if (items.length === 0) {
    grid.innerHTML = `<div class="col-12"><div class="glass-card text-center text-secondary">Vault khali hai. Upar "+ Capture" button dabakar apna pehla Real Note, Video ya PDF save karein.</div></div>`;
    return;
  }

  grid.innerHTML = items.map(k => `
    <div class="col-md-6 col-lg-4">
      <div class="glass-card h-100 d-flex flex-column justify-content-between">
        <div>
          <div class="d-flex justify-content-between align-items-center mb-2">
            <span class="pill-badge pill-violet">${k.category}</span>
            <button class="btn btn-sm btn-outline-danger py-0 px-2" onclick="deleteKnowledge(${k.id})"><i class="fa-solid fa-trash"></i></button>
          </div>
          <h5 class="fw-bold">${k.title}</h5>
          <p class="small text-secondary">${k.content}</p>
        </div>
        <div class="d-flex flex-wrap gap-1 mt-2">
          ${k.tags.split(",").map(t => `<span class="badge bg-dark border border-secondary">#${t.trim()}</span>`).join("")}
        </div>
      </div>
    </div>
  `).join("");
}

async function deleteKnowledge(id) {
  await fetch(`/api/knowledge?id=${id}`, { method: "DELETE" });
  syncDatabase();
}

function renderMediaVaults() {
  const videoBox = document.getElementById("videoVaultList");
  const imageBox = document.getElementById("imageVaultList");
  const docBox = document.getElementById("documentVaultList");

  if (videoBox) {
    const videos = DB.knowledge.filter(k => k.category === "Video");
    videoBox.innerHTML = videos.length ? videos.map(v => `
      <div class="col-md-6">
        <div class="glass-card h-100">
          <div class="ratio ratio-16x9 rounded overflow-hidden mb-3 border border-secondary">
            <iframe src="${v.media_url}" allowfullscreen></iframe>
          </div>
          <h6 class="fw-bold mb-1">${v.title}</h6>
          <p class="small text-secondary mb-0">${v.content}</p>
        </div>
      </div>
    `).join("") : `<div class="col-12 text-secondary">Koi video save nahi hai.</div>`;
  }

  if (imageBox) {
    const images = DB.knowledge.filter(k => k.category === "Image");
    imageBox.innerHTML = images.length ? images.map(img => `
      <div class="col-md-6">
        <div class="glass-card h-100">
          <img src="${img.media_url}" class="img-fluid rounded-3 mb-3 border border-secondary" alt="${img.title}">
          <h6 class="fw-bold mb-1">${img.title}</h6>
          <p class="small text-secondary mb-0">${img.content}</p>
        </div>
      </div>
    `).join("") : `<div class="col-12 text-secondary">Koi image save nahi hai.</div>`;
  }

  if (docBox) {
    const docs = DB.knowledge.filter(k => ["Document", "PDF"].includes(k.category));
    docBox.innerHTML = docs.length ? docs.map(d => `
      <div class="col-md-6">
        <div class="glass-card d-flex justify-content-between align-items-center">
          <div>
            <span class="pill-badge pill-crimson mb-1">DOCUMENT</span>
            <h6 class="fw-bold mb-1">${d.title}</h6>
            <p class="small text-secondary mb-0">${d.content}</p>
          </div>
          <a href="${d.media_url || '#'}" target="_blank" class="btn btn-sm btn-outline-info">Open</a>
        </div>
      </div>
    `).join("") : `<div class="col-12 text-secondary">Koi document save nahi hai.</div>`;
  }
}

function renderProblemsAndEngine() {
  const probList = document.getElementById("problemCollectionList");
  if (probList) {
    probList.innerHTML = DB.problems.length ? DB.problems.map(p => `
      <div class="p-3 rounded-3 border border-secondary border-opacity-25">
        <div class="d-flex justify-content-between align-items-center mb-1">
          <span class="pill-badge pill-amber">${p.source}</span>
          <span class="pill-badge pill-emerald">Score: ${p.opportunity_score}/100</span>
        </div>
        <h6 class="fw-bold mt-1 mb-1">${p.title}</h6>
        <div class="small text-secondary"><b>Root Cause:</b> ${p.root_cause}</div>
        <div class="small text-info mt-1"><b>Solution:</b> ${p.solution}</div>
      </div>
    `).join("") : `<div class="text-secondary small">Abhi koi problem log nahi ki gayi hai. Left form se add karein.</div>`;
  }

  const engineList = document.getElementById("problemToStartupContainer");
  if (engineList) {
    engineList.innerHTML = DB.problems.map(p => `
      <div class="glass-card">
        <div class="row align-items-center g-3">
          <div class="col-md-4"><small class="text-warning fw-bold">PROBLEM</small><div class="fw-bold">${p.title}</div></div>
          <div class="col-md-4"><small class="text-info fw-bold">SOLUTION</small><div class="small text-secondary">${p.solution}</div></div>
          <div class="col-md-4 text-md-end"><div class="fs-4 fw-bold text-success">${p.opportunity_score}/100</div><span class="pill-badge pill-violet">TAM: ${p.revenue_potential}</span></div>
        </div>
      </div>
    `).join("");
  }
}

function renderSolutionsAndInnovations() {
  const solGrid = document.getElementById("solutionDbContainer");
  if (solGrid) {
    solGrid.innerHTML = DB.solutions.map(s => `
      <div class="col-md-6">
        <div class="glass-card h-100">
          <h5 class="fw-bold text-info">${s.solution_title}</h5>
          <p class="small text-secondary mb-1"><b>Problem:</b> ${s.problem_title}</p>
          <p class="small mb-0"><b>Revenue Potential:</b> ${s.revenue_potential}</p>
        </div>
      </div>
    `).join("");
  }
}

function renderStartupsAndWorkspace() {
  const stGrid = document.getElementById("startupIdeasContainer");
  if (stGrid) {
    stGrid.innerHTML = DB.startups.map(s => `
      <div class="col-md-6 col-lg-4">
        <div class="glass-card h-100">
          <div class="d-flex justify-content-between mb-2">
            <span class="pill-badge pill-violet">${s.stage}</span>
            <span class="pill-badge pill-emerald">Score: ${s.feasibility_score}/100</span>
          </div>
          <h5 class="fw-bold mb-1">${s.name}</h5>
          <p class="small text-secondary mb-2">${s.description}</p>
          <div class="small mb-1"><b>Model:</b> ${s.revenue_model}</div>
          <div class="small text-info mb-2"><b>Market:</b> ${s.market_size}</div>
          <label class="small text-secondary">Progress: ${s.progress}%</label>
          <input type="range" class="form-range" min="0" max="100" value="${s.progress}" onchange="updateStartupProgress(${s.id}, this.value)">
        </div>
      </div>
    `).join("");
  }
}

function renderTasksAndKanban() {
  const projTable = document.getElementById("projectTasksTableBody");
  if (projTable) {
    projTable.innerHTML = DB.tasks.map(t => `
      <tr>
        <td class="fw-semibold">${t.title}</td>
        <td><span class="pill-badge pill-violet">${t.project_name}</span></td>
        <td><span class="pill-badge pill-cyan">${t.kanban_stage}</span></td>
        <td>${t.priority}</td>
        <td>${t.deadline}</td>
        <td><button class="btn btn-sm btn-outline-danger py-0" onclick="deleteTask(${t.id})">Delete</button></td>
      </tr>
    `).join("");
  }

  const kanbanWrap = document.getElementById("kanbanBoardGrid");
  if (kanbanWrap) {
    kanbanWrap.innerHTML = KANBAN_STAGES.map(stage => {
      const cards = DB.tasks.filter(t => t.kanban_stage === stage);
      return `
        <div class="kanban-column" ondragover="event.preventDefault()" ondrop="handleKanbanDrop(event, '${stage}')">
          <div class="d-flex justify-content-between align-items-center mb-3">
            <span class="fw-bold small text-uppercase">${stage}</span>
            <span class="badge bg-secondary">${cards.length}</span>
          </div>
          ${cards.map(c => `
            <div class="kanban-item" draggable="true" ondragstart="event.dataTransfer.setData('text/plain', '${c.id}')">
              <div class="d-flex justify-content-between mb-1">
                <span class="pill-badge pill-violet">${c.project_name}</span>
                <small class="text-warning">${c.priority}</small>
              </div>
              <div class="fw-semibold small mb-2">${c.title}</div>
              <div class="small text-secondary">${c.deadline}</div>
            </div>
          `).join("")}
        </div>
      `;
    }).join("");
  }
}

async function deleteTask(id) {
  await fetch(`/api/tasks?id=${id}`, { method: "DELETE" });
  syncDatabase();
}

async function handleKanbanDrop(e, targetStage) {
  const id = Number(e.dataTransfer.getData("text/plain"));
  await fetch("/api/tasks", {
    method: "PUT",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ id, kanban_stage: targetStage })
  });
  syncDatabase();
}

function renderJournals() {
  const jBox = document.getElementById("journalsListContainer");
  if (!jBox) return;
  jBox.innerHTML = DB.journals.map(j => `
    <div class="glass-card">
      <span class="pill-badge pill-violet mb-2">${j.entry_type}</span>
      <h5 class="fw-bold">${j.title}</h5>
      <p class="small text-secondary mb-0">${j.details}</p>
    </div>
  `).join("");
}

function executeMemorySearch() {
  const query = (document.getElementById("memorySearchInput")?.value || "").toLowerCase();
  const out = [];
  DB.knowledge.forEach(k => {
    if (!query || k.title.toLowerCase().includes(query) || k.content.toLowerCase().includes(query))
      out.push({ badge: `Knowledge • ${k.category}`, title: k.title, desc: k.content });
  });
  DB.problems.forEach(p => {
    if (!query || p.title.toLowerCase().includes(query))
      out.push({ badge: `Problem (${p.opportunity_score}%)`, title: p.title, desc: p.solution });
  });
  DB.startups.forEach(s => {
    if (!query || s.name.toLowerCase().includes(query))
      out.push({ badge: `Startup • ${s.stage}`, title: s.name, desc: s.description });
  });

  const container = document.getElementById("memoryResultsContainer");
  if (container) {
    container.innerHTML = out.map(item => `
      <div class="col-md-6">
        <div class="glass-card">
          <span class="pill-badge pill-cyan mb-1">${item.badge}</span>
          <h6 class="fw-bold mb-1">${item.title}</h6>
          <p class="small text-secondary mb-0">${item.desc}</p>
        </div>
      </div>
    `).join("");
  }
}

// Form Handlers
async function handleAddKnowledge(e) {
  e.preventDefault();
  await fetch("/api/knowledge", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      title: document.getElementById("qkTitle").value,
      category: document.getElementById("qkCategory").value,
      content: document.getElementById("qkContent").value,
      media_url: document.getElementById("qkMediaUrl").value,
      tags: document.getElementById("qkTags").value
    })
  });
  bootstrap.Modal.getInstance(document.getElementById("quickAddModal"))?.hide();
  e.target.reset();
  syncDatabase();
}

async function handleAddProblem(e) {
  e.preventDefault();
  await fetch("/api/problems", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      title: document.getElementById("pTitle").value,
      source: document.getElementById("pSource").value,
      root_cause: document.getElementById("pRoot").value,
      solution: document.getElementById("pSol").value,
      market_demand: document.getElementById("pDemand").value,
      revenue_potential: document.getElementById("pRev").value,
      auto_convert_startup: document.getElementById("pAutoStartup").checked
    })
  });
  e.target.reset();
  syncDatabase();
}

async function handleAddStartupDirect(e) {
  e.preventDefault();
  await fetch("/api/startups", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      name: document.getElementById("stName").value,
      description: document.getElementById("stDesc").value,
      revenue_model: document.getElementById("stRevModel").value,
      market_size: document.getElementById("stMarketSize").value,
      stage: document.getElementById("stStage").value,
      feasibility_score: document.getElementById("stScore").value,
      progress: document.getElementById("stProgress").value
    })
  });
  e.target.reset();
  syncDatabase();
}

async function handleAddTaskDirect(e) {
  e.preventDefault();
  await fetch("/api/tasks", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      title: document.getElementById("tkTitle").value,
      project_name: document.getElementById("tkProject").value,
      kanban_stage: document.getElementById("tkStage").value,
      priority: document.getElementById("tkPriority").value,
      deadline: document.getElementById("tkDeadline").value
    })
  });
  e.target.reset();
  syncDatabase();
}

async function handleAddJournal(e) {
  e.preventDefault();
  await fetch("/api/journals", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      entry_type: document.getElementById("jEntryType").value,
      category_tag: document.getElementById("jCatTag").value,
      title: document.getElementById("jTitleInput").value,
      details: document.getElementById("jDetailsInput").value
    })
  });
  e.target.reset();
  syncDatabase();
}

window.addEventListener("DOMContentLoaded", () => {
  syncDatabase();
});