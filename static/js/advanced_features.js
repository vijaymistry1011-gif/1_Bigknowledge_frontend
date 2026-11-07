// 🔴 YAHAN APNA ACTUAL RENDER URL DAALEIN (e.g., "https://bigknowledge-backend.onrender.com")
var API_BASE_URL = "https://bigknowledge-backend-2.onrender.com";
/* ==========================================================================
   BIGKNOWLEDGE — ADVANCED INTERACTIVE UPGRADE PACK (advanced_features.js)
   Plug & Play Engine: Adds Upload, Create, Delete, Hide-Delete Toggle,
   Zoom Lightbox, Reader Modal, Interactive Graph/MindMap & Editable BMC
   ========================================================================== */

let ADV_STORE = {
  graph_nodes: [],
  graph_links: [],
  mindmap_nodes: [],
  bmc: {},
  active_workspace: {},
  references: []
};

let HIDE_DELETE_BUTTONS = false;
let currentZoomLevel = 1;
let draggingGraphNode = null;
let draggingMindNode = null;

// CSS Inject for Delete Button Hide/Show, Image Zoom & Interactive Controls
const advStyle = document.createElement("style");
advStyle.innerHTML = `
  body.hide-delete-mode .adv-del-btn { display: none !important; }
  .adv-del-btn {
    padding: 2px 8px;
    font-size: 0.75rem;
    border-radius: 6px;
  }
  .zoomable-img-card img {
    height: 210px;
    width: 100%;
    object-fit: cover;
    cursor: zoom-in;
    transition: transform 0.2s ease;
  }
  .zoomable-img-card img:hover {
    transform: scale(1.02);
  }
  #lightboxImg {
    transition: transform 0.2s ease;
    max-height: 80vh;
    max-width: 90vw;
    border-radius: 12px;
  }
  .adv-toolbar {
    background: rgba(15, 23, 42, 0.75);
    border: 1px solid rgba(255,255,255,0.12);
    border-radius: 14px;
    padding: 0.9rem 1.2rem;
    margin-bottom: 1.2rem;
  }
`;
document.head.appendChild(advStyle);

// 1. Toggle Hide / Show All Delete Buttons Across Website
function toggleDeleteButtonsVisibility() {
  HIDE_DELETE_BUTTONS = !HIDE_DELETE_BUTTONS;
  document.body.classList.toggle("hide-delete-mode", HIDE_DELETE_BUTTONS);
  const btn = document.getElementById("toggleDelBtn");
  if (btn) {
    btn.innerHTML = HIDE_DELETE_BUTTONS
      ? '<i class="fa-solid fa-eye me-1"></i> Show Delete'
      : '<i class="fa-solid fa-eye-slash me-1"></i> Hide Delete';
    btn.className = HIDE_DELETE_BUTTONS
      ? "btn btn-sm btn-warning rounded-3 px-3 py-2"
      : "btn btn-sm btn-outline-danger rounded-3 px-3 py-2";
  }
}

// 2. Universal File Upload Helper
async function uploadFileToServer(fileInputEl) {
  if (!fileInputEl || !fileInputEl.files || !fileInputEl.files[0]) return "";
  const formData = new FormData();
  formData.append("file", fileInputEl.files[0]);
  const res = await fetch(`${API_BASE_URL}/api/adv/upload_file`, { method: "POST", body: formData });
  const data = await res.json();
  return data.url || "";
}

// 3. Universal Delete Function
async function advDelete(moduleName, id) {
  await fetch(`${API_BASE_URL}/api/adv/delete`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ module: moduleName, id: id })
  });
  await loadAdvStore();
  await syncDatabase();
}

// 4. Load Custom Store (Graph, MindMap, BMC, Active Workspace, References)
async function loadAdvStore() {
  const res = await fetch(`${API_BASE_URL}/api/adv/store`);
  ADV_STORE = await res.json();
  renderInteractiveBMC();
  renderActiveStartupWorkspaceAdv();
  renderSavedReferencesAdv();
  drawInteractiveGraph();
  drawInteractiveMindMap();
}

async function saveAdvStore(partialData) {
  await fetch(`${API_BASE_URL}/api/adv/store`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(partialData)
  });
  await loadAdvStore();
}

// =========================================================================
// INJECT TOOLBARS, MODALS & ADVANCED CONTROLS INTO ALL PAGES AUTOMATICALLY
// =========================================================================
function injectAllAdvancedToolbars() {
  // Add Global "Hide/Show Delete" Button in Top Bar
  const topBtnGroup = document.querySelector(".top-header .d-flex:last-child");
  if (topBtnGroup && !document.getElementById("toggleDelBtn")) {
    const delToggle = document.createElement("button");
    delToggle.id = "toggleDelBtn";
    delToggle.className = "btn btn-sm btn-outline-danger rounded-3 px-3 py-2";
    delToggle.innerHTML = '<i class="fa-solid fa-eye-slash me-1"></i> Hide Delete';
    delToggle.onclick = toggleDeleteButtonsVisibility;
    topBtnGroup.prepend(delToggle);
  }

  // A. Knowledge Graph Interactive Toolbar
  const kgPage = document.getElementById("page-knowledge-graph");
  if (kgPage && !document.getElementById("kgAdvToolbar")) {
    kgPage.insertAdjacentHTML("afterbegin", `
      <div id="kgAdvToolbar" class="adv-toolbar">
        <div class="row g-2 align-items-center">
          <div class="col-md-3"><input type="text" id="kgNodeLabel" class="form-control form-control-sm" placeholder="Node Name (e.g. Problem: Logistics)"></div>
          <div class="col-md-2">
            <select id="kgNodeColor" class="form-select form-select-sm">
              <option value="#F59E0B">Problem (Amber)</option>
              <option value="#0EA5E9">Solution (Cyan)</option>
              <option value="#7C3AED">Startup (Violet)</option>
              <option value="#10B981">Revenue (Green)</option>
            </select>
          </div>
          <div class="col-md-2"><button class="btn-brand btn-sm w-100" onclick="addCustomGraphNode()">+ Add Node</button></div>
          <div class="col-md-2"><button class="btn btn-outline-danger btn-sm w-100 adv-del-btn" onclick="deleteLastGraphNode()">Delete Last Node</button></div>
          <div class="col-md-3 d-flex gap-1">
            <button class="btn btn-outline-info btn-sm w-50" onclick="exportGraphJSON()">Export Graph</button>
            <label class="btn btn-outline-success btn-sm w-50 mb-0">Upload Graph <input type="file" hidden accept=".json,image/*" onchange="importGraphFile(event)"></label>
          </div>
        </div>
        <small class="text-secondary d-block mt-2"><i class="fa-solid fa-hand-pointer text-info me-1"></i>Tip: Aap kisi bhi Node ko mouse se pakad kar (Drag & Drop) kahin bhi hila sakte hain!</small>
      </div>
    `);
  }

  // B. Mind Map Interactive Toolbar
  const mmPage = document.getElementById("page-mind-map");
  if (mmPage && !document.getElementById("mmAdvToolbar")) {
    mmPage.insertAdjacentHTML("afterbegin", `
      <div id="mmAdvToolbar" class="adv-toolbar">
        <div class="row g-2 align-items-center">
          <div class="col-md-3"><input type="text" id="mmNodeLabel" class="form-control form-control-sm" placeholder="Mind Map Idea / Branch Name"></div>
          <div class="col-md-2">
            <select id="mmNodeColor" class="form-select form-select-sm">
              <option value="#7C3AED">Core Idea (Violet)</option>
              <option value="#0EA5E9">Research (Cyan)</option>
              <option value="#10B981">Solution (Emerald)</option>
              <option value="#F59E0B">Action (Amber)</option>
            </select>
          </div>
          <div class="col-md-2"><button class="btn-brand btn-sm w-100" onclick="addCustomMindNode()">+ Add Branch</button></div>
          <div class="col-md-2"><button class="btn btn-outline-danger btn-sm w-100 adv-del-btn" onclick="deleteLastMindNode()">Delete Branch</button></div>
          <div class="col-md-3">
            <label class="btn btn-outline-info btn-sm w-100 mb-0"><i class="fa-solid fa-upload me-1"></i>Upload MindMap Image <input type="file" hidden accept="image/*" onchange="uploadMindMapDiagram(event)"></label>
          </div>
        </div>
        <div id="uploadedMindMapPreview" class="mt-2"></div>
      </div>
    `);
  }

  // C. Knowledge Vault Search & Reader Bar
  const kvPage = document.getElementById("page-knowledge-vault");
  if (kvPage && !document.getElementById("kvSearchInput")) {
    kvPage.insertAdjacentHTML("afterbegin", `
      <div class="adv-toolbar d-flex flex-wrap gap-2 justify-content-between align-items-center">
        <input type="text" id="kvSearchInput" class="form-control w-50" placeholder="Search notes, articles, research inside Knowledge Vault..." oninput="renderKnowledgeVault()">
        <button class="btn-brand" data-bs-toggle="modal" data-bs-target="#quickAddModal">+ Create New Note / Article</button>
      </div>
    `);
  }

  // D. Video Vault Upload Bar
  const vvPage = document.getElementById("page-video-vault");
  if (vvPage && !document.getElementById("vvUploadToolbar")) {
    vvPage.insertAdjacentHTML("afterbegin", `
      <div id="vvUploadToolbar" class="adv-toolbar">
        <h6 class="fw-bold text-info mb-2"><i class="fa-solid fa-video me-2"></i>Add YouTube Video URL or Upload MP4 Video File</h6>
        <form onsubmit="submitAdvancedVideo(event)" class="row g-2">
          <div class="col-md-3"><input type="text" id="vvTitle" class="form-control" placeholder="Video Title" required></div>
          <div class="col-md-3"><input type="text" id="vvUrl" class="form-control" placeholder="YouTube URL (optional if uploading)"></div>
          <div class="col-md-3"><input type="file" id="vvFile" class="form-control" accept="video/*"></div>
          <div class="col-md-2"><input type="text" id="vvNotes" class="form-control" placeholder="Key Notes / Category"></div>
          <div class="col-md-1"><button class="btn-brand w-100">Save</button></div>
        </form>
      </div>
    `);
  }

  // E. Image Vault HD Library Upload Bar
  const ivPage = document.getElementById("page-image-vault");
  if (ivPage && !document.getElementById("ivUploadToolbar")) {
    ivPage.insertAdjacentHTML("afterbegin", `
      <div id="ivUploadToolbar" class="adv-toolbar">
        <h6 class="fw-bold text-warning mb-2"><i class="fa-solid fa-camera-retro me-2"></i>Upload HD Image to Library (Click any image to Zoom In / Out)</h6>
        <form onsubmit="submitAdvancedImage(event)" class="row g-2">
          <div class="col-md-3"><input type="text" id="ivTitle" class="form-control" placeholder="Photo / Diagram Title" required></div>
          <div class="col-md-4"><input type="file" id="ivFile" class="form-control" accept="image/*" required></div>
          <div class="col-md-3"><input type="text" id="ivDesc" class="form-control" placeholder="Category / Description"></div>
          <div class="col-md-2"><button class="btn-brand w-100">Upload HD Photo</button></div>
        </form>
      </div>
    `);
  }

  // F. Document Vault Upload Bar
  const dvPage = document.getElementById("page-document-vault");
  if (dvPage && !document.getElementById("dvUploadToolbar")) {
    dvPage.insertAdjacentHTML("afterbegin", `
      <div id="dvUploadToolbar" class="adv-toolbar">
        <h6 class="fw-bold text-primary mb-2"><i class="fa-solid fa-file-powerpoint me-2"></i>Upload PDF, PPTX Presentation, or DOCX Document</h6>
        <form onsubmit="submitAdvancedDocument(event)" class="row g-2">
          <div class="col-md-3"><input type="text" id="dvTitle" class="form-control" placeholder="Save Document As (Name)" required></div>
          <div class="col-md-4"><input type="file" id="dvFile" class="form-control" accept=".pdf,.ppt,.pptx,.doc,.docx,.xls,.xlsx,.txt" required></div>
          <div class="col-md-3"><input type="text" id="dvDesc" class="form-control" placeholder="Summary / Notes"></div>
          <div class="col-md-2"><button class="btn-brand w-100">Save Document</button></div>
        </form>
      </div>
    `);
  }

  // G. Reference Image Gallery Form
  const refPage = document.getElementById("page-reference-system");
  if (refPage && !document.getElementById("refSavedGallery")) {
    refPage.insertAdjacentHTML("beforeend", `
      <div class="glass-card mt-4">
        <h5 class="fw-bold mb-3">Save Reference Inspiration to Permanent Library</h5>
        <form onsubmit="submitReferenceInspiration(event)" class="row g-2 mb-4">
          <div class="col-md-3"><input type="text" id="rfTitle" class="form-control" placeholder="Reference Name" required></div>
          <div class="col-md-2">
            <select id="rfType" class="form-select">
              <option>Dashboard Reference</option><option>UI Reference</option><option>Wireframe</option><option>App Screenshot</option><option>Website Inspiration</option>
            </select>
          </div>
          <div class="col-md-3"><input type="file" id="rfFile" class="form-control" accept="image/*" required></div>
          <div class="col-md-2"><input type="text" id="rfNotes" class="form-control" placeholder="Design Notes"></div>
          <div class="col-md-2"><button class="btn-brand w-100">Save Reference</button></div>
        </form>
        <div class="row g-3" id="refSavedGallery"></div>
      </div>
    `);
  }

  // H. Solution Database Add Form
  const solPage = document.getElementById("page-solution-db");
  if (solPage && !document.getElementById("solAddBar")) {
    solPage.insertAdjacentHTML("afterbegin", `
      <div id="solAddBar" class="adv-toolbar">
        <h6 class="fw-bold text-info mb-2">+ Engineer New Solution</h6>
        <form onsubmit="submitAdvModule(event, 'solution')" class="row g-2">
          <div class="col-md-3"><input type="text" name="solution_title" class="form-control" placeholder="Solution Title" required></div>
          <div class="col-md-3"><input type="text" name="problem_title" class="form-control" placeholder="Related Problem" required></div>
          <div class="col-md-2"><input type="text" name="cost_estimate" class="form-control" placeholder="Cost (e.g. ₹15,000)"></div>
          <div class="col-md-2"><input type="text" name="benefits" class="form-control" placeholder="Key Benefits"></div>
          <div class="col-md-2"><button class="btn-brand w-100">Save Solution</button></div>
        </form>
      </div>
    `);
  }

  // I. Innovation Hub Add Form
  const innoPage = document.getElementById("page-innovation-hub");
  if (innoPage && !document.getElementById("innoAddBar")) {
    innoPage.insertAdjacentHTML("afterbegin", `
      <div id="innoAddBar" class="adv-toolbar">
        <h6 class="fw-bold text-primary mb-2">+ Log New Innovation, Research Paper or Future Trend</h6>
        <form onsubmit="submitAdvModule(event, 'innovation')" class="row g-2">
          <div class="col-md-3"><input type="text" name="title" class="form-control" placeholder="Innovation / Paper Title" required></div>
          <div class="col-md-2">
            <select name="category" class="form-select">
              <option>Technology</option><option>Research Paper</option><option>Future Trend</option><option>Discovery</option><option>Opportunity</option>
            </select>
          </div>
          <div class="col-md-3"><input type="text" name="summary" class="form-control" placeholder="Core Summary" required></div>
          <div class="col-md-2"><input type="text" name="opportunity_note" class="form-control" placeholder="Startup Impact"></div>
          <div class="col-md-2"><button class="btn-brand w-100">Add Innovation</button></div>
        </form>
      </div>
    `);
  }

  // J. Roadmap Builder Add Form
  const rmPage = document.getElementById("page-roadmap-builder");
  if (rmPage && !document.getElementById("rmAddBar")) {
    rmPage.insertAdjacentHTML("afterbegin", `
      <div id="rmAddBar" class="adv-toolbar">
        <h6 class="fw-bold text-warning mb-2">+ Create Startup, Product or Learning Roadmap Milestone</h6>
        <form onsubmit="submitAdvModule(event, 'roadmap')" class="row g-2">
          <div class="col-md-2">
            <select name="roadmap_type" class="form-select">
              <option>Startup Roadmap</option><option>Product Roadmap</option><option>Learning Roadmap</option>
            </select>
          </div>
          <div class="col-md-3"><input type="text" name="title" class="form-control" placeholder="Milestone Title" required></div>
          <div class="col-md-3"><input type="text" name="dependencies" class="form-control" placeholder="Dependencies"></div>
          <div class="col-md-2"><input type="date" name="deadline" class="form-control" required></div>
          <div class="col-md-2"><button class="btn-brand w-100">Add Milestone</button></div>
        </form>
      </div>
    `);
  }

  // K. Goals & Habit Tracker Add Form
  const ghPage = document.getElementById("page-goals-habits");
  if (ghPage && !document.getElementById("ghAddBar")) {
    ghPage.insertAdjacentHTML("afterbegin", `
      <div id="ghAddBar" class="adv-toolbar">
        <h6 class="fw-bold text-success mb-2">+ Add Goal (Life/Yearly/Monthly/Daily) or Daily Habit</h6>
        <form onsubmit="submitAdvModule(event, 'goal')" class="row g-2">
          <div class="col-md-3">
            <select name="item_type" class="form-select">
              <option>Life Goal</option><option>Yearly Goal</option><option>Monthly Goal</option><option>Weekly Goal</option><option>Daily Goal</option><option>Habit</option>
            </select>
          </div>
          <div class="col-md-5"><input type="text" name="title" class="form-control" placeholder="Goal or Habit Description" required></div>
          <div class="col-md-2"><input type="number" name="streak_or_progress" class="form-control" placeholder="Streak / %" value="10"></div>
          <div class="col-md-2"><button class="btn-brand w-100">Save Goal/Habit</button></div>
        </form>
      </div>
    `);
  }

  // L. Team Management Form
  const tmPage = document.getElementById("page-team-mgmt");
  if (tmPage && !document.getElementById("tmAddBar")) {
    tmPage.insertAdjacentHTML("afterbegin", `
      <div id="tmAddBar" class="adv-toolbar">
        <h6 class="fw-bold text-info mb-2">+ Onboard Team Member & Monitor Performance</h6>
        <form onsubmit="submitAdvModule(event, 'crm')" class="row g-2">
          <input type="hidden" name="entity_type" value="Team Member">
          <div class="col-md-2"><input type="text" name="name" class="form-control" placeholder="Member Name" required></div>
          <div class="col-md-2">
            <select name="role_or_segment" class="form-select">
              <option>Founder</option><option>Co-Founder</option><option>Admin</option><option>Manager</option><option>Team Lead</option><option>Developer</option><option>Designer</option><option>Researcher</option><option>Marketer</option><option>Sales Executive</option>
            </select>
          </div>
          <div class="col-md-2"><input type="text" name="department_or_company" class="form-control" placeholder="Department / Startup" required></div>
          <div class="col-md-2"><input type="text" name="details_or_strengths" class="form-control" placeholder="Skills (Python, UI, etc.)"></div>
          <div class="col-md-2"><input type="number" name="productivity_score" class="form-control" placeholder="Productivity %" value="95"></div>
          <div class="col-md-2"><button class="btn-brand w-100">Add Member</button></div>
        </form>
      </div>
    `);
  }

  // M. Personal CRM, Competitor & Hiring Form
  const crmPage = document.getElementById("page-crm-hiring");
  if (crmPage && !document.getElementById("crmAddBar")) {
    crmPage.insertAdjacentHTML("afterbegin", `
      <div id="crmAddBar" class="adv-toolbar">
        <h6 class="fw-bold text-warning mb-2">+ Add Investor, Mentor, Partner, Competitor, Candidate or Meeting</h6>
        <form onsubmit="submitAdvModule(event, 'crm')" class="row g-2">
          <div class="col-md-2">
            <select name="entity_type" class="form-select">
              <option>Investor</option><option>Mentor</option><option>Partner</option><option>Competitor</option><option>Candidate</option><option>Meeting</option>
            </select>
          </div>
          <div class="col-md-2"><input type="text" name="name" class="form-control" placeholder="Name / Firm" required></div>
          <div class="col-md-2"><input type="text" name="role_or_segment" class="form-control" placeholder="Tier / Pricing / Role"></div>
          <div class="col-md-2"><input type="text" name="details_or_strengths" class="form-control" placeholder="Strengths / Notes"></div>
          <div class="col-md-2"><input type="text" name="weaknesses_or_actions" class="form-control" placeholder="Weakness / Action Item"></div>
          <div class="col-md-2"><button class="btn-brand w-100">Save Record</button></div>
        </form>
      </div>
    `);
  }

  // Inject Full Reader Modal & Image Zoom Lightbox Modal at bottom of body
  if (!document.getElementById("noteReaderModal")) {
    document.body.insertAdjacentHTML("beforeend", `
      <!-- Full Note Reader Modal -->
      <div class="modal fade" id="noteReaderModal" tabindex="-1">
        <div class="modal-dialog modal-lg modal-dialog-centered">
          <div class="modal-content glass-card">
            <div class="modal-header border-secondary">
              <span class="pill-badge pill-violet me-2" id="readerCategory">Note</span>
              <h5 class="modal-title fw-bold" id="readerTitle"></h5>
              <button type="button" class="btn-close btn-close-white" data-bs-dismiss="modal"></button>
            </div>
            <div class="modal-body">
              <div id="readerContent" class="text-light" style="white-space: pre-wrap; line-height: 1.7; font-size: 1rem;"></div>
              <div id="readerMediaBox" class="mt-3"></div>
            </div>
          </div>
        </div>
      </div>

      <!-- HD Image Zoom In / Out Lightbox Modal -->
      <div class="modal fade" id="imageZoomModal" tabindex="-1">
        <div class="modal-dialog modal-xl modal-dialog-centered">
          <div class="modal-content glass-card text-center">
            <div class="d-flex justify-content-between align-items-center mb-3">
              <h6 class="fw-bold mb-0" id="zoomImgTitle">HD Preview</h6>
              <div class="d-flex gap-2">
                <button class="btn btn-sm btn-outline-info" onclick="adjustLightboxZoom(0.25)"><i class="fa-solid fa-magnifying-glass-plus"></i> Zoom In</button>
                <button class="btn btn-sm btn-outline-warning" onclick="adjustLightboxZoom(-0.25)"><i class="fa-solid fa-magnifying-glass-minus"></i> Zoom Out</button>
                <button class="btn btn-sm btn-outline-light" onclick="resetLightboxZoom()">Reset</button>
                <button type="button" class="btn-close btn-close-white ms-2" data-bs-dismiss="modal"></button>
              </div>
            </div>
            <div class="overflow-auto p-3" style="max-height: 82vh;">
              <img id="lightboxImg" src="" alt="Zoomable Preview">
            </div>
          </div>
        </div>
      </div>
    `);
  }
}

// =========================================================================
// OVERRIDE RENDER FUNCTIONS FOR FULL READER, ZOOM, UPLOAD & DELETE SUPPORT
// =========================================================================

// Knowledge Vault with Open/Read Modal & Delete
renderKnowledgeVault = function() {
  const filter = document.getElementById("vaultFilterSelect")?.value || "ALL";
  const searchQ = (document.getElementById("kvSearchInput")?.value || "").toLowerCase();
  const items = DB.knowledge.filter(k => {
    const matchCat = filter === "ALL" || k.category === filter;
    const matchQ = !searchQ || k.title.toLowerCase().includes(searchQ) || k.content.toLowerCase().includes(searchQ) || k.tags.toLowerCase().includes(searchQ);
    return matchCat && matchQ;
  });

  const grid = document.getElementById("knowledgeVaultContainer");
  if (!grid) return;

  grid.innerHTML = items.map(k => `
    <div class="col-md-6 col-lg-4">
      <div class="glass-card h-100 d-flex flex-column justify-content-between">
        <div>
          <div class="d-flex justify-content-between align-items-center mb-2">
            <span class="pill-badge pill-violet">${k.category}</span>
            <div class="d-flex gap-1">
              <button class="btn btn-sm btn-outline-info py-0 px-2" onclick="openNoteReader(${k.id})"><i class="fa-solid fa-book-open me-1"></i>Read</button>
              <button class="btn btn-sm btn-outline-danger adv-del-btn" onclick="advDelete('knowledge', ${k.id})"><i class="fa-solid fa-trash"></i></button>
            </div>
          </div>
          <h5 class="fw-bold" style="cursor:pointer;" onclick="openNoteReader(${k.id})">${k.title}</h5>
          <p class="small text-secondary">${k.content.slice(0, 140)}${k.content.length > 140 ? '...' : ''}</p>
        </div>
        <div class="d-flex flex-wrap gap-1 mt-2">
          ${k.tags.split(",").map(t => `<span class="badge bg-dark border border-secondary">#${t.trim()}</span>`).join("")}
        </div>
      </div>
    </div>
  `).join("");
};

function openNoteReader(id) {
  const item = DB.knowledge.find(k => k.id === id);
  if (!item) return;
  document.getElementById("readerCategory").innerText = item.category;
  document.getElementById("readerTitle").innerText = item.title;
  document.getElementById("readerContent").innerText = item.content;
  const mediaBox = document.getElementById("readerMediaBox");
  mediaBox.innerHTML = item.media_url ? `<a href="${item.media_url}" target="_blank" class="btn-brand btn-sm text-decoration-none">Open Attached Media / Link</a>` : "";
  new bootstrap.Modal(document.getElementById("noteReaderModal")).show();
}

// Media Vaults: Video (YouTube + MP4), Image (Zoom Lightbox), Document (PDF/PPTX Download + Delete)
renderMediaVaults = function() {
  const videoBox = document.getElementById("videoVaultList");
  const imageBox = document.getElementById("imageVaultList");
  const docBox = document.getElementById("documentVaultList");

  if (videoBox) {
    const videos = DB.knowledge.filter(k => k.category === "Video");
    videoBox.innerHTML = videos.map(v => {
      const isMp4 = v.media_url && (v.media_url.endsWith(".mp4") || v.media_url.startsWith("/static/uploads/"));
      const playerHtml = isMp4
        ? `<video controls class="w-100 rounded border border-secondary mb-3" style="max-height:260px;"><source src="${v.media_url}"></video>`
        : `<div class="ratio ratio-16x9 rounded overflow-hidden mb-3 border border-secondary"><iframe src="${v.media_url}" allowfullscreen></iframe></div>`;
      return `
        <div class="col-md-6">
          <div class="glass-card h-100">
            ${playerHtml}
            <div class="d-flex justify-content-between align-items-start">
              <div>
                <h6 class="fw-bold mb-1">${v.title}</h6>
                <p class="small text-secondary mb-0">${v.content}</p>
              </div>
              <button class="btn btn-outline-danger adv-del-btn" onclick="advDelete('knowledge', ${v.id})"><i class="fa-solid fa-trash"></i></button>
            </div>
          </div>
        </div>
      `;
    }).join("");
  }

  if (imageBox) {
    const images = DB.knowledge.filter(k => k.category === "Image");
    imageBox.innerHTML = images.map(img => `
      <div class="col-md-4">
        <div class="glass-card zoomable-img-card h-100">
          <img src="${img.media_url}" class="rounded-3 mb-3 border border-secondary" alt="${img.title}" onclick="openImageZoomLightbox('${img.media_url}', '${img.title.replace(/'/g, "")}')">
          <div class="d-flex justify-content-between align-items-center">
            <div>
              <h6 class="fw-bold mb-1">${img.title}</h6>
              <p class="small text-secondary mb-0">${img.content}</p>
            </div>
            <div class="d-flex gap-1">
              <button class="btn btn-sm btn-outline-info" onclick="openImageZoomLightbox('${img.media_url}', '${img.title.replace(/'/g, "")}')"><i class="fa-solid fa-magnifying-glass-plus"></i></button>
              <button class="btn btn-outline-danger adv-del-btn" onclick="advDelete('knowledge', ${img.id})"><i class="fa-solid fa-trash"></i></button>
            </div>
          </div>
        </div>
      </div>
    `).join("");
  }

  if (docBox) {
    const docs = DB.knowledge.filter(k => ["Document", "PDF"].includes(k.category));
    docBox.innerHTML = docs.map(d => `
      <div class="col-md-6">
        <div class="glass-card d-flex justify-content-between align-items-center">
          <div>
            <span class="pill-badge pill-crimson mb-1">DOCUMENT / PPTX / PDF</span>
            <h6 class="fw-bold mb-1">${d.title}</h6>
            <p class="small text-secondary mb-0">${d.content}</p>
          </div>
          <div class="d-flex gap-2">
            <a href="${d.media_url || '#'}" target="_blank" download class="btn btn-sm btn-outline-info"><i class="fa-solid fa-download me-1"></i>Open/Download</a>
            <button class="btn btn-outline-danger adv-del-btn" onclick="advDelete('knowledge', ${d.id})"><i class="fa-solid fa-trash"></i></button>
          </div>
        </div>
      </div>
    `).join("");
  }
};

function openImageZoomLightbox(url, title) {
  currentZoomLevel = 1;
  const img = document.getElementById("lightboxImg");
  img.src = url;
  img.style.transform = "scale(1)";
  document.getElementById("zoomImgTitle").innerText = title;
  new bootstrap.Modal(document.getElementById("imageZoomModal")).show();
}

function adjustLightboxZoom(delta) {
  currentZoomLevel = Math.max(0.5, Math.min(3.5, currentZoomLevel + delta));
  document.getElementById("lightboxImg").style.transform = `scale(${currentZoomLevel})`;
}

function resetLightboxZoom() {
  currentZoomLevel = 1;
  document.getElementById("lightboxImg").style.transform = "scale(1)";
}

// Video, Image, Document & Reference Upload Submitters
async function submitAdvancedVideo(e) {
  e.preventDefault();
  let mediaUrl = document.getElementById("vvUrl").value.trim();
  const fileEl = document.getElementById("vvFile");
  if (fileEl.files.length > 0) {
    mediaUrl = await uploadFileToServer(fileEl);
  } else if (mediaUrl.includes("watch?v=")) {
    mediaUrl = mediaUrl.replace("watch?v=", "embed/");
  }
  await fetch(`${API_BASE_URL}/api/knowledge`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      title: document.getElementById("vvTitle").value,
      category: "Video",
      content: document.getElementById("vvNotes").value || "Saved Video",
      media_url: mediaUrl,
      tags: "video,vault"
    })
  });
  e.target.reset();
  syncDatabase();
}

async function submitAdvancedImage(e) {
  e.preventDefault();
  const url = await uploadFileToServer(document.getElementById("ivFile"));
  await fetch(`${API_BASE_URL}/api/knowledge`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      title: document.getElementById("ivTitle").value,
      category: "Image",
      content: document.getElementById("ivDesc").value || "HD Image",
      media_url: url,
      tags: "image,hd"
    })
  });
  e.target.reset();
  syncDatabase();
}

async function submitAdvancedDocument(e) {
  e.preventDefault();
  const url = await uploadFileToServer(document.getElementById("dvFile"));
  await fetch(`${API_BASE_URL}/api/knowledge`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      title: document.getElementById("dvTitle").value,
      category: "Document",
      content: document.getElementById("dvDesc").value || "Uploaded Document / PPTX / PDF",
      media_url: url,
      tags: "document,ppt,pdf"
    })
  });
  e.target.reset();
  syncDatabase();
}

async function submitReferenceInspiration(e) {
  e.preventDefault();
  const url = await uploadFileToServer(document.getElementById("rfFile"));
  await fetch(`${API_BASE_URL}/api/adv/create`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      module: "reference",
      title: document.getElementById("rfTitle").value,
      ref_type: document.getElementById("rfType").value,
      image_url: url,
      notes: document.getElementById("rfNotes").value
    })
  });
  e.target.reset();
  loadAdvStore();
}

function renderSavedReferencesAdv() {
  const box = document.getElementById("refSavedGallery");
  if (!box || !ADV_STORE.references) return;
  box.innerHTML = ADV_STORE.references.map(r => `
    <div class="col-md-4">
      <div class="glass-card zoomable-img-card h-100">
        <img src="${r.image_url}" class="rounded-3 mb-2 border border-info" onclick="openImageZoomLightbox('${r.image_url}', '${r.title}')">
        <div class="d-flex justify-content-between align-items-center">
          <div>
            <span class="pill-badge pill-cyan">${r.ref_type}</span>
            <h6 class="fw-bold mt-1 mb-0">${r.title}</h6>
            <small class="text-secondary">${r.notes}</small>
          </div>
          <button class="btn btn-outline-danger adv-del-btn" onclick="advDelete('reference', ${r.id})"><i class="fa-solid fa-trash"></i></button>
        </div>
      </div>
    </div>
  `).join("");
}

// Generic Submitter for Solutions, Innovations, Roadmaps, Goals, Team & CRM
async function submitAdvModule(e, moduleName) {
  e.preventDefault();
  const formData = new FormData(e.target);
  const payload = { module: moduleName };
  formData.forEach((v, k) => payload[k] = v);
  await fetch(`${API_BASE_URL}/api/adv/create`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload)
  });
  e.target.reset();
  syncDatabase();
}

//Editable Business Model Canvas
function renderInteractiveBMC() {
  const bmcSec = document.getElementById("page-bmc-canvas");
  if (!bmcSec || !ADV_STORE.bmc) return;
  const b = ADV_STORE.bmc;
  bmcSec.innerHTML = `
    <div class="d-flex justify-content-between align-items-center mb-3">
      <div>
        <span class="pill-badge pill-emerald">LIVE EDITABLE CANVAS</span>
        <h3 class="fw-bold mb-0">Interactive Business Model Canvas</h3>
      </div>
      <button class="btn-brand" onclick="saveEditableBMC()"><i class="fa-solid fa-floppy-disk me-1"></i> Save Canvas Changes</button>
    </div>
    <div class="bmc-container">
      <div class="bmc-block"><h6 class="text-info fw-bold">1. Key Partners</h6><textarea id="bmc_partners" class="form-control form-control-sm" rows="4">${b.partners || ""}</textarea></div>
      <div class="bmc-block"><h6 class="text-info fw-bold">2. Key Activities</h6><textarea id="bmc_activities" class="form-control form-control-sm" rows="4">${b.activities || ""}</textarea></div>
      <div class="bmc-block"><h6 class="text-warning fw-bold">3. Value Proposition</h6><textarea id="bmc_value" class="form-control form-control-sm" rows="4">${b.value || ""}</textarea></div>
      <div class="bmc-block"><h6 class="text-info fw-bold">4. Customer Relationships</h6><textarea id="bmc_relationships" class="form-control form-control-sm" rows="4">${b.relationships || ""}</textarea></div>
      <div class="bmc-block"><h6 class="text-success fw-bold">5. Customer Segments</h6><textarea id="bmc_segments" class="form-control form-control-sm" rows="4">${b.segments || ""}</textarea></div>
      <div class="bmc-block"><h6 class="text-primary fw-bold">6. Key Resources</h6><textarea id="bmc_resources" class="form-control form-control-sm" rows="4">${b.resources || ""}</textarea></div>
      <div class="bmc-block"><h6 class="text-primary fw-bold">7. Channels</h6><textarea id="bmc_channels" class="form-control form-control-sm" rows="4">${b.channels || ""}</textarea></div>
      <div class="bmc-block"><h6 class="text-danger fw-bold">8. Cost Structure</h6><textarea id="bmc_costs" class="form-control form-control-sm" rows="4">${b.costs || ""}</textarea></div>
      <div class="bmc-block" style="grid-column: span 2;"><h6 class="text-success fw-bold">9. Revenue Streams</h6><textarea id="bmc_revenue" class="form-control form-control-sm" rows="4">${b.revenue || ""}</textarea></div>
    </div>
  `;
}

async function saveEditableBMC() {
  const bmc = {
    partners: document.getElementById("bmc_partners").value,
    activities: document.getElementById("bmc_activities").value,
    value: document.getElementById("bmc_value").value,
    relationships: document.getElementById("bmc_relationships").value,
    segments: document.getElementById("bmc_segments").value,
    resources: document.getElementById("bmc_resources").value,
    channels: document.getElementById("bmc_channels").value,
    costs: document.getElementById("bmc_costs").value,
    revenue: document.getElementById("bmc_revenue").value
  };
  await saveAdvStore({ bmc });
}

// Editable Active Startup Workspace
function renderActiveStartupWorkspaceAdv() {
  const sec = document.getElementById("page-active-startup");
  if (!sec || !ADV_STORE.active_workspace) return;
  const w = ADV_STORE.active_workspace;
  sec.innerHTML = `
    <div class="glass-card border-primary mb-4">
      <div class="d-flex justify-content-between align-items-center mb-3">
        <span class="pill-badge pill-emerald">ACTIVE STARTUP EXECUTION ROOM</span>
        <button class="btn-brand btn-sm" onclick="saveActiveWorkspaceAdv()"><i class="fa-solid fa-floppy-disk me-1"></i> Update Workspace</button>
      </div>
      <div class="row g-3">
        <div class="col-md-6"><label class="small text-secondary">Current Active Startup</label><input type="text" id="aw_name" class="form-control fw-bold" value="${w.startup_name || ""}"></div>
        <div class="col-md-6"><label class="small text-secondary">Current Sprint Goal</label><input type="text" id="aw_goal" class="form-control" value="${w.goal || ""}"></div>
        <div class="col-md-4"><label class="small text-secondary">Current Problem</label><textarea id="aw_prob" class="form-control" rows="2">${w.problem || ""}</textarea></div>
        <div class="col-md-4"><label class="small text-secondary">Current Solution</label><textarea id="aw_sol" class="form-control" rows="2">${w.solution || ""}</textarea></div>
        <div class="col-md-4"><label class="small text-secondary">Key Milestones</label><textarea id="aw_mile" class="form-control" rows="2">${w.milestones || ""}</textarea></div>
        <div class="col-md-6">
          <label class="small text-secondary">Overall Progress (${w.progress}%)</label>
          <input type="range" id="aw_prog" class="form-range" min="0" max="100" value="${w.progress || 50}" onchange="saveActiveWorkspaceAdv()">
        </div>
        <div class="col-md-6">
          <label class="small text-secondary">Total Founder Hours Spent</label>
          <input type="number" id="aw_hours" class="form-control" value="${w.hours || 100}">
        </div>
      </div>
    </div>
  `;
}

async function saveActiveWorkspaceAdv() {
  const active_workspace = {
    startup_name: document.getElementById("aw_name").value,
    goal: document.getElementById("aw_goal").value,
    problem: document.getElementById("aw_prob").value,
    solution: document.getElementById("aw_sol").value,
    milestones: document.getElementById("aw_mile").value,
    progress: Number(document.getElementById("aw_prog").value),
    hours: Number(document.getElementById("aw_hours").value)
  };
  await saveAdvStore({ active_workspace });
}

// =========================================================================
// INTERACTIVE DRAG & DROP KNOWLEDGE GRAPH & MIND MAP
// =========================================================================
function drawInteractiveGraph() {
  const canvas = document.getElementById("knowledgeGraphCanvas");
  if (!canvas || !ADV_STORE.graph_nodes) return;
  const ctx = canvas.getContext("2d");
  ctx.clearRect(0, 0, canvas.width, canvas.height);

  const nodes = ADV_STORE.graph_nodes;
  const links = ADV_STORE.graph_links || [];

  ctx.strokeStyle = "rgba(148, 163, 184, 0.45)";
  ctx.lineWidth = 2.5;
  links.forEach(([id1, id2]) => {
    const n1 = nodes.find(n => n.id === id1);
    const n2 = nodes.find(n => n.id === id2);
    if (n1 && n2) {
      ctx.beginPath();
      ctx.moveTo(n1.x, n1.y);
      ctx.lineTo(n2.x, n2.y);
      ctx.stroke();
    }
  });

  nodes.forEach(n => {
    ctx.beginPath();
    ctx.arc(n.x, n.y, 45, 0, Math.PI * 2);
    ctx.fillStyle = n.color || "#7C3AED";
    ctx.shadowColor = n.color || "#7C3AED";
    ctx.shadowBlur = 14;
    ctx.fill();
    ctx.shadowBlur = 0;

    ctx.fillStyle = "#fff";
    ctx.font = "600 11px Inter";
    ctx.textAlign = "center";
    const parts = n.label.split(":");
    parts.forEach((p, idx) => ctx.fillText(p.trim(), n.x, n.y - 3 + idx * 14));
  });
}

async function addCustomGraphNode() {
  const lbl = document.getElementById("kgNodeLabel").value.trim();
  const col = document.getElementById("kgNodeColor").value;
  if (!lbl) return;
  const nodes = ADV_STORE.graph_nodes || [];
  const links = ADV_STORE.graph_links || [];
  const newId = Date.now();
  const prevId = nodes.length > 0 ? nodes[nodes.length - 1].id : null;
  nodes.push({ id: newId, label: lbl, x: 200 + Math.random() * 700, y: 120 + Math.random() * 260, color: col });
  if (prevId) links.push([prevId, newId]);
  document.getElementById("kgNodeLabel").value = "";
  await saveAdvStore({ graph_nodes: nodes, graph_links: links });
}

async function deleteLastGraphNode() {
  const nodes = ADV_STORE.graph_nodes || [];
  if (nodes.length === 0) return;
  const removed = nodes.pop();
  const links = (ADV_STORE.graph_links || []).filter(([a, b]) => a !== removed.id && b !== removed.id);
  await saveAdvStore({ graph_nodes: nodes, graph_links: links });
}

function exportGraphJSON() {
  const blob = new Blob([JSON.stringify({ graph_nodes: ADV_STORE.graph_nodes, graph_links: ADV_STORE.graph_links }, null, 2)], { type: "application/json" });
  const a = document.createElement("a");
  a.href = URL.createObjectURL(blob);
  a.download = "knowledge_graph.json";
  a.click();
}

async function importGraphFile(e) {
  const file = e.target.files[0];
  if (!file) return;
  if (file.name.endsWith(".json")) {
    const text = await file.text();
    const parsed = JSON.parse(text);
    if (parsed.graph_nodes) await saveAdvStore(parsed);
  } else {
    const url = await uploadFileToServer(e.target);
    openImageZoomLightbox(url, "Uploaded Graph Diagram");
  }
}

// Mind Map Renderer & Controls
function drawInteractiveMindMap() {
  const canvas = document.getElementById("mindMapCanvas");
  if (!canvas || !ADV_STORE.mindmap_nodes) return;
  const ctx = canvas.getContext("2d");
  ctx.clearRect(0, 0, canvas.width, canvas.height);

  const nodes = ADV_STORE.mindmap_nodes;
  const root = nodes[0];

  ctx.strokeStyle = "rgba(124, 58, 237, 0.5)";
  ctx.lineWidth = 3;
  nodes.slice(1).forEach(n => {
    if (root) {
      ctx.beginPath();
      ctx.moveTo(root.x, root.y);
      ctx.lineTo(n.x, n.y);
      ctx.stroke();
    }
  });

  nodes.forEach((n, idx) => {
    ctx.beginPath();
    ctx.arc(n.x, n.y, idx === 0 ? 55 : 44, 0, Math.PI * 2);
    ctx.fillStyle = n.color || "#0EA5E9";
    ctx.fill();
    ctx.fillStyle = "#fff";
    ctx.font = "600 12px Inter";
    ctx.textAlign = "center";
    ctx.fillText(n.label, n.x, n.y + 4);
  });
}

async function addCustomMindNode() {
  const lbl = document.getElementById("mmNodeLabel").value.trim();
  const col = document.getElementById("mmNodeColor").value;
  if (!lbl) return;
  const nodes = ADV_STORE.mindmap_nodes || [];
  nodes.push({ id: Date.now(), label: lbl, parent: 101, x: 200 + Math.random() * 740, y: 100 + Math.random() * 280, color: col });
  document.getElementById("mmNodeLabel").value = "";
  await saveAdvStore({ mindmap_nodes: nodes });
}

async function deleteLastMindNode() {
  const nodes = ADV_STORE.mindmap_nodes || [];
  if (nodes.length <= 1) return;
  nodes.pop();
  await saveAdvStore({ mindmap_nodes: nodes });
}

async function uploadMindMapDiagram(e) {
  const url = await uploadFileToServer(e.target);
  const box = document.getElementById("uploadedMindMapPreview");
  if (box && url) {
    box.innerHTML = `<img src="${url}" class="img-fluid rounded-3 border border-info mt-2" style="max-height:240px; cursor:zoom-in;" onclick="openImageZoomLightbox('${url}', 'Uploaded Mind Map')">`;
  }
}

// Enable Mouse Drag-and-Drop on Knowledge Graph & Mind Map Canvases
function enableCanvasDragging() {
  const kgCanvas = document.getElementById("knowledgeGraphCanvas");
  if (kgCanvas) {
    kgCanvas.onmousedown = (e) => {
      const rect = kgCanvas.getBoundingClientRect();
      const mx = (e.clientX - rect.left) * (kgCanvas.width / rect.width);
      const my = (e.clientY - rect.top) * (kgCanvas.height / rect.height);
      draggingGraphNode = (ADV_STORE.graph_nodes || []).find(n => Math.hypot(n.x - mx, n.y - my) < 45);
    };
    kgCanvas.onmousemove = (e) => {
      if (!draggingGraphNode) return;
      const rect = kgCanvas.getBoundingClientRect();
      draggingGraphNode.x = (e.clientX - rect.left) * (kgCanvas.width / rect.width);
      draggingGraphNode.y = (e.clientY - rect.top) * (kgCanvas.height / rect.height);
      drawInteractiveGraph();
    };
    kgCanvas.onmouseup = () => {
      if (draggingGraphNode) {
        draggingGraphNode = null;
        saveAdvStore({ graph_nodes: ADV_STORE.graph_nodes });
      }
    };
  }

  const mmCanvas = document.getElementById("mindMapCanvas");
  if (mmCanvas) {
    mmCanvas.onmousedown = (e) => {
      const rect = mmCanvas.getBoundingClientRect();
      const mx = (e.clientX - rect.left) * (mmCanvas.width / rect.width);
      const my = (e.clientY - rect.top) * (mmCanvas.height / rect.height);
      draggingMindNode = (ADV_STORE.mindmap_nodes || []).find(n => Math.hypot(n.x - mx, n.y - my) < 50);
    };
    mmCanvas.onmousemove = (e) => {
      if (!draggingMindNode) return;
      const rect = mmCanvas.getBoundingClientRect();
      draggingMindNode.x = (e.clientX - rect.left) * (mmCanvas.width / rect.width);
      draggingMindNode.y = (e.clientY - rect.top) * (mmCanvas.height / rect.height);
      drawInteractiveMindMap();
    };
    mmCanvas.onmouseup = () => {
      if (draggingMindNode) {
        draggingMindNode = null;
        saveAdvStore({ mindmap_nodes: ADV_STORE.mindmap_nodes });
      }
    };
  }
}

window.addEventListener("DOMContentLoaded", () => {
  injectAllAdvancedToolbars();
  loadAdvStore();
  enableCanvasDragging();
});
/* ==========================================================================
   KANBAN BOARD & PROJECT MANAGEMENT — DELETE BUTTON + ADD TASK UPGRADE
   ========================================================================== */

// 1. Kanban Board aur Project Management me Delete Button lagana
renderTasksAndKanban = function() {
  // Project Management Table me Delete Button
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
            <span>${t.assignee}</span>
            <button class="btn btn-sm btn-outline-danger adv-del-btn py-0 px-2" onclick="advDelete('task', ${t.id})" title="Delete Task">
              <i class="fa-solid fa-trash"></i>
            </button>
          </div>
        </td>
      </tr>
    `).join("");
  }

  // Kanban Board ke har Card par Delete Button + Stage Change Dropdown
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
                  <small class="text-warning fw-bold me-1">${c.priority}</small>
                  <button class="btn btn-sm btn-outline-danger adv-del-btn py-0 px-1" onclick="advDelete('task', ${c.id})" title="Delete Task">
                    <i class="fa-solid fa-trash"></i>
                  </button>
                </div>
              </div>
              <div class="fw-semibold small mb-2">${c.title}</div>
              <div class="d-flex justify-content-between align-items-center text-secondary" style="font-size:0.72rem;">
                <span><i class="fa-regular fa-calendar me-1"></i>${c.deadline}</span>
                <span>${c.assignee}</span>
              </div>
            </div>
          `).join("")}
        </div>
      `;
    }).join("");
  }
};

// 2. Kanban Board ke upar Naya Task Add karne aur Clear All ka Toolbar lagana
function injectKanbanToolbar() {
  const kbPage = document.getElementById("page-kanban-board");
  if (kbPage && !document.getElementById("kbAddTaskBar")) {
    kbPage.insertAdjacentHTML("afterbegin", `
      <div id="kbAddTaskBar" class="adv-toolbar">
        <h6 class="fw-bold text-info mb-2"><i class="fa-solid fa-table-columns me-2"></i>+ Add New Task to Kanban Board</h6>
        <form onsubmit="createNewKanbanTask(event)" class="row g-2">
          <div class="col-md-3">
            <input type="text" id="kbTitle" class="form-control form-control-sm" placeholder="Task Name..." required>
          </div>
          <div class="col-md-2">
            <input type="text" id="kbProject" class="form-control form-control-sm" placeholder="Project / Startup" value="BIGKNOWLEDGE OS" required>
          </div>
          <div class="col-md-2">
            <select id="kbStage" class="form-select form-select-sm">
              <option value="Ideas">Ideas</option>
              <option value="Researching">Researching</option>
              <option value="Planning">Planning</option>
              <option value="Building" selected>Building</option>
              <option value="Testing">Testing</option>
              <option value="Completed">Completed</option>
            </select>
          </div>
          <div class="col-md-2">
            <select id="kbPriority" class="form-select form-select-sm">
              <option value="Critical">Critical</option>
              <option value="High" selected>High</option>
              <option value="Medium">Medium</option>
              <option value="Low">Low</option>
            </select>
          </div>
          <div class="col-md-2">
            <input type="date" id="kbDeadline" class="form-control form-control-sm" value="2026-11-15" required>
          </div>
          <div class="col-md-1">
            <button type="submit" class="btn-brand btn-sm w-100">Add</button>
          </div>
        </form>
      </div>
    `);
  }
}

async function createNewKanbanTask(e) {
  e.preventDefault();
  await fetch(`${API_BASE_URL}/api/tasks`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      title: document.getElementById("kbTitle").value,
      project_name: document.getElementById("kbProject").value,
      kanban_stage: document.getElementById("kbStage").value,
      priority: document.getElementById("kbPriority").value,
      deadline: document.getElementById("kbDeadline").value,
      assignee: "Founder"
    })
  });
  e.target.reset();
  syncDatabase();
}

// Page load hote hi Kanban Toolbar aur Delete buttons chalu karein
setTimeout(() => {
  injectKanbanToolbar();
  renderTasksAndKanban();
}, 200);