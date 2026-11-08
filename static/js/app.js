/* ==========================================================================
   BIGKNOWLEDGE — CORE APPLICATION ENGINE (static/js/app.js)
   Fixed: All 28 Module Renderers, Offline LocalStorage Fallback, Media URLs
   ========================================================================== */

var API_BASE_URL = window.API_BASE_URL || "https://bigknowledge-backend-2.onrender.com";

let DB = JSON.parse(localStorage.getItem("BK_DB_CACHE") || "null") || {
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

function saveLocalCache() {
  localStorage.setItem("BK_DB_CACHE", JSON.stringify(DB));
}

function openModulePage(pageId, buttonEl) {
  document.querySelectorAll(".module-page").forEach(sec => sec.classList.remove("active"));
  const target = document.getElementById("page-" + pageId);
  if (target) target.classList.add("active");

  if (buttonEl) {
    document.querySelectorAll(".nav-btn").forEach(btn => btn.classList.remove("active"));
    buttonEl.classList.add("active");
  } else {
    const matchedBtn = document.querySelector(`.sidebar .nav-btn[onclick*="'${pageId}'"]`);
    if (matchedBtn) {
      document.querySelectorAll(".nav-btn").forEach(btn => btn.classList.remove("active"));
      matchedBtn.classList.add("active");
    }
  }

  if (pageId === "knowledge-graph") setTimeout(() => window.drawInteractiveGraph ? drawInteractiveGraph() : renderKnowledgeGraphCanvas(), 60);
  if (pageId === "mind-map") setTimeout(() => window.drawInteractiveMindMap ? drawInteractiveMindMap() : renderMindMapCanvas(), 60);
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
    const response = await fetch(`${API_BASE_URL}/api/bootstrap`);
    if (response.ok) {
      const serverData = await response.json();
      DB = {
        knowledge: serverData.knowledge || [],
        problems: serverData.problems || [],
        solutions: serverData.solutions || [],
        innovations: serverData.innovations || [],
        startups: serverData.startups || [],
        tasks: serverData.tasks || [],
        roadmaps: serverData.roadmaps || [],
        journals: serverData.journals || [],
        goals_habits: serverData.goals_habits || [],
        org_crm: serverData.org_crm || []
      };
      saveLocalCache();
    }
  } catch (err) {
    console.warn("Using cached local database (Backend waking up):", err);
  }
  renderAllPages();
  updateRealTimeCharts();
}

function renderAllPages() {
  renderExecutiveDashboard();
  renderKnowledgeVault();
  renderMediaVaults();
  renderProblemsAndEngine();
  renderSolutionsAndInnovations();
  renderStartupsAndWorkspace();
  renderTasksAndKanban();
  renderRoadmaps();
  renderJournals();
  renderGoalsAndHabits();
  renderTeamAndCRM();
  executeMemorySearch();
}

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

  const scoreboard = document.getElementById("startupScoreboardContainer");
  if (scoreboard) {
    if (DB.startups.length === 0) {
      scoreboard.innerHTML = `<div class="text-secondary small p-3 text-center border border-secondary border-opacity-25 rounded-3">Abhi koi startup add nahi hai. Startup Ideas Database me jakar apna startup jodein.</div>`;
    } else {
      scoreboard.innerHTML = DB.startups.map(st => `
        <div class="p-3 rounded-3 border border-secondary border-opacity-25">
          <div class="d-flex justify-content-between align-items-center mb-1">
            <span class="fw-bold text-info">${st.name}</span>
            <div class="d-flex align-items-center gap-2">
              <span class="pill-badge pill-emerald">Score: ${st.feasibility_score}/100</span>
              <button class="btn btn-sm btn-outline-danger py-0 px-1 adv-del-btn" onclick="deleteStartup(${st.id})" title="Delete"><i class="fa-solid fa-trash"></i></button>
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
  const st = DB.startups.find(s => s.id === id);
  if (st) st.progress = Number(newProgress);
  saveLocalCache();
  renderAllPages();
  try {
    await fetch(`${API_BASE_URL}/api/startups`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ id: id, progress: Number(newProgress) })
    });
  } catch (e) {}
}

async function deleteStartup(id) {
  DB.startups = DB.startups.filter(s => s.id !== id);
  saveLocalCache();
  renderAllPages();
  try {
    await fetch(`${API_BASE_URL}/api/startups?id=${id}`, { method: "DELETE" });
  } catch (e) {}
}

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
  if (ctx1 && typeof Chart !== "undefined") {
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
  if (ctx2 && typeof Chart !== "undefined") {
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

function renderKnowledgeGraphCanvas() {
  if (window.drawInteractiveGraph && window.ADV_STORE?.graph_nodes?.length) {
    return window.drawInteractiveGraph();
  }
  const canvas = document.getElementById("knowledgeGraphCanvas");
  if (!canvas) return;
  const ctx = canvas.getContext("2d");
  ctx.clearRect(0, 0, canvas.width, canvas.height);

  const nodes = [{ x: 130, y: 240, label: "BIGKNOWLEDGE\nCORE BRAIN", color: "#7C3AED" }];
  const links = [];

  DB.problems.slice(0, 4).forEach((p, idx) => {
    nodes.push({ x: 420, y: 90 + idx * 100, label: "PROBLEM:\n" + p.title.slice(0, 16), color: "#F59E0B" });
    links.push([0, nodes.length - 1]);
  });

  DB.solutions.slice(0, 4).forEach((s, idx) => {
    nodes.push({ x: 720, y: 90 + idx * 100, label: "SOLUTION:\n" + (s.solution_title || "").slice(0, 16), color: "#0EA5E9" });
    links.push([Math.min(idx + 1, nodes.length - 2), nodes.length - 1]);
  });

  DB.startups.slice(0, 4).forEach((st, idx) => {
    nodes.push({ x: 1000, y: 90 + idx * 100, label: `STARTUP (${st.progress}%):\n` + st.name.slice(0, 16), color: "#10B981" });
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
    ctx.fill();
    ctx.fillStyle = "#fff";
    ctx.font = "600 11px Inter";
    ctx.textAlign = "center";
    n.label.split("\n").forEach((line, i) => ctx.fillText(line, n.x, n.y - 3 + i * 14));
  });
}

function renderMindMapCanvas() {
  if (window.drawInteractiveMindMap && window.ADV_STORE?.mindmap_nodes?.length) {
    return window.drawInteractiveMindMap();
  }
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

function renderKnowledgeVault() {
  const filter = document.getElementById("vaultFilterSelect")?.value || "ALL";
  const searchQ = (document.getElementById("kvSearchInput")?.value || "").toLowerCase();
  const items = DB.knowledge.filter(k => {
    const matchCat = filter === "ALL" || k.category === filter;
    const matchQ = !searchQ || (k.title || "").toLowerCase().includes(searchQ) || (k.content || "").toLowerCase().includes(searchQ) || (k.tags || "").toLowerCase().includes(searchQ);
    return matchCat && matchQ;
  });

  const grid = document.getElementById("knowledgeVaultContainer");
  if (!grid) return;

  if (items.length === 0) {
    grid.innerHTML = `<div class="col-12"><div class="glass-card text-center text-secondary">Vault khali hai. Upar "+ Capture" button dabakar apna pehla Note, Video ya PDF save karein.</div></div>`;
    return;
  }

  grid.innerHTML = items.map(k => `
    <div class="col-md-6 col-lg-4">
      <div class="glass-card h-100 d-flex flex-column justify-content-between">
        <div>
          <div class="d-flex justify-content-between align-items-center mb-2">
            <span class="pill-badge pill-violet">${k.category}</span>
            <div class="d-flex gap-1">
              ${window.openNoteReader ? `<button class="btn btn-sm btn-outline-info py-0 px-2" onclick="openNoteReader(${k.id})"><i class="fa-solid fa-book-open me-1"></i>Read</button>` : ""}
              <button class="btn btn-sm btn-outline-danger py-0 px-2 adv-del-btn" onclick="deleteKnowledge(${k.id})"><i class="fa-solid fa-trash"></i></button>
            </div>
          </div>
          <h5 class="fw-bold" style="cursor:pointer;" onclick="window.openNoteReader && openNoteReader(${k.id})">${k.title}</h5>
          <p class="small text-secondary">${(k.content || "").slice(0, 150)}${(k.content || "").length > 150 ? "..." : ""}</p>
        </div>
        <div class="d-flex flex-wrap gap-1 mt-2">
          ${(k.tags || "vault").split(",").map(t => `<span class="badge bg-dark border border-secondary">#${t.trim()}</span>`).join("")}
        </div>
      </div>
    </div>
  `).join("");
}

async function deleteKnowledge(id) {
  DB.knowledge = DB.knowledge.filter(k => k.id !== id);
  saveLocalCache();
  renderAllPages();
  try {
    await fetch(`${API_BASE_URL}/api/knowledge?id=${id}`, { method: "DELETE" });
  } catch (e) {}
}

function renderMediaVaults() {
  const videoBox = document.getElementById("videoVaultList");
  const imageBox = document.getElementById("imageVaultList");
  const docBox = document.getElementById("documentVaultList");

  if (videoBox) {
    const videos = DB.knowledge.filter(k => k.category === "Video");
    videoBox.innerHTML = videos.length ? videos.map(v => {
      const rawUrl = v.media_url || "";
      const isDirectVideo = rawUrl.match(/\.(mp4|webm|ogg)$/i) || rawUrl.includes("/static/uploads/");
      const finalUrl = isDirectVideo ? window.resolveMediaUrl(rawUrl) : window.resolveMediaUrl(rawUrl, "youtube");
      const playerHtml = isDirectVideo
        ? `<video controls class="w-100 rounded border border-secondary mb-3" style="max-height:260px;"><source src="${finalUrl}"></video>`
        : `<div class="ratio ratio-16x9 rounded overflow-hidden mb-3 border border-secondary"><iframe src="${finalUrl}" allowfullscreen allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"></iframe></div>`;

      return `
        <div class="col-md-6">
          <div class="glass-card h-100">
            ${playerHtml}
            <div class="d-flex justify-content-between align-items-start">
              <div>
                <h6 class="fw-bold mb-1">${v.title}</h6>
                <p class="small text-secondary mb-0">${v.content}</p>
              </div>
              <button class="btn btn-sm btn-outline-danger adv-del-btn" onclick="deleteKnowledge(${v.id})"><i class="fa-solid fa-trash"></i></button>
            </div>
          </div>
        </div>
      `;
    }).join("") : `<div class="col-12 text-secondary">Koi video save nahi hai. Upar form se YouTube link ya MP4 video upload karein.</div>`;
  }

  if (imageBox) {
    const images = DB.knowledge.filter(k => k.category === "Image");
    imageBox.innerHTML = images.length ? images.map(img => {
      const imgUrl = window.resolveMediaUrl(img.media_url);
      const safeTitle = (img.title || "Image").replace(/'/g, "");
      return `
        <div class="col-md-4">
          <div class="glass-card zoomable-img-card h-100">
            <img src="${imgUrl}" class="img-fluid rounded-3 mb-3 border border-secondary" alt="${safeTitle}" onclick="window.openImageZoomLightbox && openImageZoomLightbox('${imgUrl}', '${safeTitle}')">
            <div class="d-flex justify-content-between align-items-center">
              <div>
                <h6 class="fw-bold mb-1">${img.title}</h6>
                <p class="small text-secondary mb-0">${img.content}</p>
              </div>
              <div class="d-flex gap-1">
                <button class="btn btn-sm btn-outline-info" onclick="window.openImageZoomLightbox && openImageZoomLightbox('${imgUrl}', '${safeTitle}')"><i class="fa-solid fa-magnifying-glass-plus"></i></button>
                <button class="btn btn-sm btn-outline-danger adv-del-btn" onclick="deleteKnowledge(${img.id})"><i class="fa-solid fa-trash"></i></button>
              </div>
            </div>
          </div>
        </div>
      `;
    }).join("") : `<div class="col-12 text-secondary">Koi image save nahi hai.</div>`;
  }

  if (docBox) {
    const docs = DB.knowledge.filter(k => ["Document", "PDF"].includes(k.category));
    docBox.innerHTML = docs.length ? docs.map(d => {
      const docUrl = window.resolveMediaUrl(d.media_url);
      return `
        <div class="col-md-6">
          <div class="glass-card d-flex justify-content-between align-items-center">
            <div>
              <span class="pill-badge pill-crimson mb-1">DOCUMENT / PDF</span>
              <h6 class="fw-bold mb-1">${d.title}</h6>
              <p class="small text-secondary mb-0">${d.content}</p>
            </div>
            <div class="d-flex gap-2">
              <a href="${docUrl || '#'}" target="_blank" download class="btn btn-sm btn-outline-info"><i class="fa-solid fa-download me-1"></i>Open</a>
              <button class="btn btn-sm btn-outline-danger adv-del-btn" onclick="deleteKnowledge(${d.id})"><i class="fa-solid fa-trash"></i></button>
            </div>
          </div>
        </div>
      `;
    }).join("") : `<div class="col-12 text-secondary">Koi document save nahi hai.</div>`;
  }
}

function renderProblemsAndEngine() {
  const probList = document.getElementById("problemCollectionList");
  if (probList) {
    probList.innerHTML = DB.problems.length ? DB.problems.map(p => `
      <div class="p-3 rounded-3 border border-secondary border-opacity-25">
        <div class="d-flex justify-content-between align-items-center mb-1">
          <span class="pill-badge pill-amber">${p.source}</span>
          <div class="d-flex gap-2 align-items-center">
            <span class="pill-badge pill-emerald">Score: ${p.opportunity_score || 90}/100</span>
            <button class="btn btn-sm btn-outline-danger py-0 px-2 adv-del-btn" onclick="window.advDelete ? advDelete('problem', ${p.id}) : null"><i class="fa-solid fa-trash"></i></button>
          </div>
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
          <div class="col-md-4 text-md-end"><div class="fs-4 fw-bold text-success">${p.opportunity_score || 90}/100</div><span class="pill-badge pill-violet">TAM: ${p.revenue_potential}</span></div>
        </div>
      </div>
    `).join("");
  }
}

function renderSolutionsAndInnovations() {
  const solGrid = document.getElementById("solutionDbContainer");
  if (solGrid) {
    solGrid.innerHTML = DB.solutions.length ? DB.solutions.map(s => `
      <div class="col-md-6">
        <div class="glass-card h-100 d-flex justify-content-between align-items-start">
          <div>
            <h5 class="fw-bold text-info">${s.solution_title}</h5>
            <p class="small text-secondary mb-1"><b>Problem:</b> ${s.problem_title}</p>
            <p class="small mb-0"><b>Cost / Revenue:</b> ${s.cost_estimate || s.revenue_potential || "N/A"} • ${s.benefits || ""}</p>
          </div>
          <button class="btn btn-sm btn-outline-danger adv-del-btn" onclick="window.advDelete && advDelete('solution', ${s.id})"><i class="fa-solid fa-trash"></i></button>
        </div>
      </div>
    `).join("") : `<div class="col-12 text-secondary">Abhi koi solution add nahi hai. Upar form se add karein.</div>`;
  }

  const innoGrid = document.getElementById("innovationHubContainer");
  if (innoGrid) {
    innoGrid.innerHTML = (DB.innovations && DB.innovations.length) ? DB.innovations.map(item => `
      <div class="col-md-6 col-lg-4">
        <div class="glass-card h-100 d-flex flex-column justify-content-between">
          <div>
            <div class="d-flex justify-content-between mb-2">
              <span class="pill-badge pill-cyan">${item.category || "Innovation"}</span>
              <button class="btn btn-sm btn-outline-danger py-0 px-2 adv-del-btn" onclick="window.advDelete && advDelete('innovation', ${item.id})"><i class="fa-solid fa-trash"></i></button>
            </div>
            <h5 class="fw-bold">${item.title}</h5>
            <p class="small text-secondary mb-2">${item.summary}</p>
          </div>
          <div class="small text-warning fw-semibold">Impact: ${item.opportunity_note || "High Future Potential"}</div>
        </div>
      </div>
    `).join("") : `<div class="col-12 text-secondary">Abhi koi innovation log nahi hai. Upar bar se naya Research Paper ya Future Trend add karein.</div>`;
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
            <div class="d-flex gap-1 align-items-center">
              <span class="pill-badge pill-emerald">Score: ${s.feasibility_score}/100</span>
              <button class="btn btn-sm btn-outline-danger py-0 px-2 adv-del-btn" onclick="deleteStartup(${s.id})"><i class="fa-solid fa-trash"></i></button>
            </div>
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
        <td>${t.dependencies || "None"}</td>
        <td>
          <div class="d-flex justify-content-between align-items-center">
            <span>${t.assignee || "Founder"}</span>
            <button class="btn btn-sm btn-outline-danger adv-del-btn py-0 px-2" onclick="deleteTask(${t.id})"><i class="fa-solid fa-trash"></i></button>
          </div>
        </td>
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
              <div class="d-flex justify-content-between align-items-center mb-2">
                <span class="pill-badge pill-violet">${c.project_name}</span>
                <div class="d-flex align-items-center gap-1">
                  <small class="text-warning fw-bold">${c.priority}</small>
                  <button class="btn btn-sm btn-outline-danger adv-del-btn py-0 px-1" onclick="deleteTask(${c.id})"><i class="fa-solid fa-trash"></i></button>
                </div>
              </div>
              <div class="fw-semibold small mb-2">${c.title}</div>
              <div class="d-flex justify-content-between text-secondary" style="font-size:0.72rem;">
                <span><i class="fa-regular fa-calendar me-1"></i>${c.deadline}</span>
                <span>${c.assignee || "Founder"}</span>
              </div>
            </div>
          `).join("")}
        </div>
      `;
    }).join("");
  }
}

async function deleteTask(id) {
  DB.tasks = DB.tasks.filter(t => t.id !== id);
  saveLocalCache();
  renderAllPages();
  try {
    await fetch(`${API_BASE_URL}/api/tasks?id=${id}`, { method: "DELETE" });
  } catch (e) {}
}

async function handleKanbanDrop(e, targetStage) {
  const id = Number(e.dataTransfer.getData("text/plain"));
  const task = DB.tasks.find(t => t.id === id);
  if (task) task.kanban_stage = targetStage;
  saveLocalCache();
  renderAllPages();
  try {
    await fetch(`${API_BASE_URL}/api/tasks`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ id, kanban_stage: targetStage })
    });
  } catch (err) {}
}

function renderRoadmaps() {
  const rmBox = document.getElementById("roadmapListContainer");
  if (!rmBox) return;
  rmBox.innerHTML = (DB.roadmaps && DB.roadmaps.length) ? DB.roadmaps.map(r => `
    <div class="col-md-6 col-lg-4">
      <div class="glass-card h-100 d-flex justify-content-between align-items-start">
        <div>
          <span class="pill-badge pill-amber mb-2">${r.roadmap_type || "Roadmap"}</span>
          <h5 class="fw-bold mb-1">${r.title}</h5>
          <div class="small text-secondary mb-1">Dependencies: ${r.dependencies || "None"}</div>
          <div class="small text-info"><i class="fa-regular fa-calendar me-1"></i>Target: ${r.deadline}</div>
        </div>
        <button class="btn btn-sm btn-outline-danger adv-del-btn" onclick="window.advDelete && advDelete('roadmap', ${r.id})"><i class="fa-solid fa-trash"></i></button>
      </div>
    </div>
  `).join("") : `<div class="col-12 text-secondary">Abhi koi roadmap milestone nahi hai. Upar form se add karein.</div>`;
}

function renderJournals() {
  const jBox = document.getElementById("journalsListContainer");
  if (!jBox) return;
  jBox.innerHTML = DB.journals.length ? DB.journals.map(j => `
    <div class="glass-card d-flex justify-content-between align-items-start">
      <div>
        <span class="pill-badge pill-violet mb-2">${j.entry_type} • ${j.category_tag || "Log"}</span>
        <h5 class="fw-bold">${j.title}</h5>
        <p class="small text-secondary mb-0">${j.details}</p>
      </div>
      <button class="btn btn-sm btn-outline-danger adv-del-btn" onclick="window.advDelete && advDelete('journal', ${j.id})"><i class="fa-solid fa-trash"></i></button>
    </div>
  `).join("") : `<div class="text-secondary">Abhi koi journal entry nahi hai.</div>`;
}

function renderGoalsAndHabits() {
  const ghBox = document.getElementById("goalsHabitsContainer");
  if (!ghBox) return;
  ghBox.innerHTML = (DB.goals_habits && DB.goals_habits.length) ? DB.goals_habits.map(g => `
    <div class="col-md-6 col-lg-4">
      <div class="glass-card h-100">
        <div class="d-flex justify-content-between align-items-center mb-2">
          <span class="pill-badge pill-emerald">${g.item_type}</span>
          <button class="btn btn-sm btn-outline-danger py-0 px-2 adv-del-btn" onclick="window.advDelete && advDelete('goal', ${g.id})"><i class="fa-solid fa-trash"></i></button>
        </div>
        <h6 class="fw-bold mb-2">${g.title}</h6>
        <div class="progress" style="height:8px;">
          <div class="progress-bar bg-success" style="width:${Math.min(100, g.streak_or_progress || 50)}%"></div>
        </div>
        <small class="text-info d-block mt-1">Progress / Streak: ${g.streak_or_progress || 50}%</small>
      </div>
    </div>
  `).join("") : `<div class="col-12 text-secondary">Abhi koi goal ya habit add nahi hai. Upar form se add karein.</div>`;
}

function renderTeamAndCRM() {
  const teamBox = document.getElementById("teamMembersContainer");
  const crmBox = document.getElementById("personalCrmContainer");
  const allEntities = DB.org_crm || [];

  if (teamBox) {
    const team = allEntities.filter(e => e.entity_type === "Team Member");
    teamBox.innerHTML = team.length ? team.map(m => `
      <div class="col-md-6 col-lg-4">
        <div class="glass-card h-100">
          <div class="d-flex justify-content-between mb-2">
            <span class="pill-badge pill-cyan">${m.role_or_segment}</span>
            <button class="btn btn-sm btn-outline-danger py-0 px-2 adv-del-btn" onclick="window.advDelete && advDelete('crm', ${m.id})"><i class="fa-solid fa-trash"></i></button>
          </div>
          <h5 class="fw-bold mb-1">${m.name}</h5>
          <div class="small text-secondary mb-1">Dept: ${m.department_or_company}</div>
          <div class="small text-info mb-2">Skills: ${m.details_or_strengths}</div>
          <span class="pill-badge pill-emerald">Productivity: ${m.productivity_score || 95}%</span>
        </div>
      </div>
    `).join("") : `<div class="col-12 text-secondary">Abhi koi team member add nahi hai. Upar form se onboard karein.</div>`;
  }

  if (crmBox) {
    const others = allEntities.filter(e => e.entity_type !== "Team Member");
    crmBox.innerHTML = others.length ? others.map(c => `
      <div class="col-md-6 col-lg-4">
        <div class="glass-card h-100">
          <div class="d-flex justify-content-between mb-2">
            <span class="pill-badge pill-amber">${c.entity_type}</span>
            <button class="btn btn-sm btn-outline-danger py-0 px-2 adv-del-btn" onclick="window.advDelete && advDelete('crm', ${c.id})"><i class="fa-solid fa-trash"></i></button>
          </div>
          <h5 class="fw-bold mb-1">${c.name}</h5>
          <div class="small text-info mb-1">${c.role_or_segment || ""}</div>
          <div class="small text-secondary mb-1"><b>Notes:</b> ${c.details_or_strengths || ""}</div>
          <div class="small text-warning"><b>Action:</b> ${c.weaknesses_or_actions || "Follow up"}</div>
        </div>
      </div>
    `).join("") : `<div class="col-12 text-secondary">Abhi koi Investor, Competitor ya Candidate record nahi hai. Upar form se jodein.</div>`;
  }
}

function executeMemorySearch() {
  const query = (document.getElementById("memorySearchInput")?.value || "").toLowerCase();
  const out = [];
  DB.knowledge.forEach(k => {
    if (!query || (k.title || "").toLowerCase().includes(query) || (k.content || "").toLowerCase().includes(query))
      out.push({ badge: `Knowledge • ${k.category}`, title: k.title, desc: k.content });
  });
  DB.problems.forEach(p => {
    if (!query || (p.title || "").toLowerCase().includes(query))
      out.push({ badge: `Problem (${p.opportunity_score || 90}%)`, title: p.title, desc: p.solution });
  });
  DB.startups.forEach(s => {
    if (!query || (s.name || "").toLowerCase().includes(query))
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

async function handleAddKnowledge(e) {
  e.preventDefault();
  const newItem = {
    id: Date.now(),
    title: document.getElementById("qkTitle").value,
    category: document.getElementById("qkCategory").value,
    content: document.getElementById("qkContent").value,
    media_url: document.getElementById("qkMediaUrl").value,
    tags: document.getElementById("qkTags").value
  };
  DB.knowledge.unshift(newItem);
  saveLocalCache();
  bootstrap.Modal.getInstance(document.getElementById("quickAddModal"))?.hide();
  e.target.reset();
  renderAllPages();

  try {
    await fetch(`${API_BASE_URL}/api/knowledge`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(newItem)
    });
    syncDatabase();
  } catch (err) {}
}

async function handleAddProblem(e) {
  e.preventDefault();
  const payload = {
    id: Date.now(),
    title: document.getElementById("pTitle").value,
    source: document.getElementById("pSource").value,
    root_cause: document.getElementById("pRoot").value,
    solution: document.getElementById("pSol").value,
    market_demand: document.getElementById("pDemand").value,
    revenue_potential: document.getElementById("pRev").value,
    opportunity_score: Number(document.getElementById("pDemand").value) * 10,
    auto_convert_startup: document.getElementById("pAutoStartup").checked
  };
  DB.problems.unshift(payload);
  saveLocalCache();
  e.target.reset();
  renderAllPages();

  try {
    await fetch(`${API_BASE_URL}/api/problems`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload)
    });
    syncDatabase();
  } catch (err) {}
}

async function handleAddStartupDirect(e) {
  e.preventDefault();
  const payload = {
    id: Date.now(),
    name: document.getElementById("stName").value,
    description: document.getElementById("stDesc").value,
    revenue_model: document.getElementById("stRevModel").value,
    market_size: document.getElementById("stMarketSize").value,
    stage: document.getElementById("stStage").value,
    feasibility_score: Number(document.getElementById("stScore").value),
    progress: Number(document.getElementById("stProgress").value)
  };
  DB.startups.unshift(payload);
  saveLocalCache();
  e.target.reset();
  renderAllPages();

  try {
    await fetch(`${API_BASE_URL}/api/startups`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload)
    });
    syncDatabase();
  } catch (err) {}
}

async function handleAddTaskDirect(e) {
  e.preventDefault();
  const payload = {
    id: Date.now(),
    title: document.getElementById("tkTitle")?.value || document.getElementById("kbTitle")?.value,
    project_name: document.getElementById("tkProject")?.value || document.getElementById("kbProject")?.value,
    kanban_stage: document.getElementById("tkStage")?.value || document.getElementById("kbStage")?.value,
    priority: document.getElementById("tkPriority")?.value || document.getElementById("kbPriority")?.value,
    deadline: document.getElementById("tkDeadline")?.value || document.getElementById("kbDeadline")?.value,
    assignee: "Founder"
  };
  DB.tasks.unshift(payload);
  saveLocalCache();
  e.target.reset();
  renderAllPages();

  try {
    await fetch(`${API_BASE_URL}/api/tasks`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload)
    });
    syncDatabase();
  } catch (err) {}
}

async function handleAddJournal(e) {
  e.preventDefault();
  const payload = {
    id: Date.now(),
    entry_type: document.getElementById("jEntryType").value,
    category_tag: document.getElementById("jCatTag").value,
    title: document.getElementById("jTitleInput").value,
    details: document.getElementById("jDetailsInput").value
  };
  DB.journals.unshift(payload);
  saveLocalCache();
  e.target.reset();
  renderAllPages();

  try {
    await fetch(`${API_BASE_URL}/api/journals`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload)
    });
    syncDatabase();
  } catch (err) {}
}

window.addEventListener("DOMContentLoaded", () => {
  syncDatabase();
});