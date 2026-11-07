/* ==========================================================================
   BIGKNOWLEDGE — ENTERPRISE TEAM CHAT & MEETING COMMAND SUITE
   File: static/js/chat_meeting_pro.js
   Features:
   - Multi-Channel Sidebar (#core-architecture, #b2conecter-dev, etc.) + Create/Delete
   - Rich Chat: Text, Code Blocks, Image/Document Upload, Website Preview, Polls
   - Real Browser Voice Note Recorder (Web MediaRecorder API -> Audio Player)
   - Emoji Reactions, Message Pinning, Search Filter, Convert Message to Kanban Task
   - Built-in WebRTC Live Video & Screen-Share Huddle Room
   - Meeting Scheduler, Live Speech-to-Text Dictation, Action Checklist & AI Summary
   ========================================================================== */

// 🔴 YAHAN APNA ACTUAL RENDER URL DAALEIN (e.g., "https://bigknowledge-backend.onrender.com")
 var API_BASE_URL = "https://bigknowledge-backend-2.onrender.com"; 

let CHAT_STATE = {
  channels: [],
  messages: [],
  meetings: []
};

let ACTIVE_CHANNEL = "core-architecture";
let ACTIVE_MEETING_ID = null;
let SHOW_PINNED_ONLY = false;
let mediaRecorder = null;
let audioChunks = [];
let localVideoStream = null;

// Inject Custom Styles for Slack/Discord-Grade Chat & Meeting UI
const chatProStyles = document.createElement("style");
chatProStyles.innerHTML = `
  .chat-pro-shell {
    display: grid;
    grid-template-columns: 250px 1fr;
    gap: 1rem;
    min-height: 640px;
  }
  .channel-sidebar {
    background: rgba(9, 13, 22, 0.78);
    border: 1px solid var(--border-glass);
    border-radius: 16px;
    padding: 1rem;
    display: flex;
    flex-direction: column;
    justify-content: space-between;
  }
  .channel-pill {
    display: flex;
    align-items: center;
    justify-content: space-between;
    padding: 0.5rem 0.75rem;
    border-radius: 10px;
    color: var(--text-muted);
    cursor: pointer;
    font-size: 0.86rem;
    font-weight: 500;
    margin-bottom: 4px;
    transition: all 0.15s ease;
  }
  .channel-pill:hover, .channel-pill.active {
    background: linear-gradient(90deg, rgba(124, 58, 237, 0.25), rgba(14, 165, 233, 0.1));
    color: #fff;
    font-weight: 600;
  }
  .chat-stream-box {
    height: 430px;
    overflow-y: auto;
    padding: 1rem;
    background: rgba(9, 13, 22, 0.55);
    border: 1px solid var(--border-glass);
    border-radius: 14px;
  }
  .msg-bubble {
    background: rgba(30, 41, 59, 0.68);
    border: 1px solid rgba(255, 255, 255, 0.07);
    border-radius: 14px;
    padding: 0.85rem 1rem;
    margin-bottom: 0.75rem;
    transition: border-color 0.15s ease;
  }
  .msg-bubble:hover {
    border-color: rgba(124, 58, 237, 0.45);
  }
  .msg-bubble.pinned-msg {
    border-left: 4px solid #F59E0B;
    background: rgba(245, 158, 11, 0.08);
  }
  .avatar-circle {
    width: 38px;
    height: 38px;
    border-radius: 10px;
    background: linear-gradient(135deg, #7C3AED, #0EA5E9);
    display: flex;
    align-items: center;
    justify-content: center;
    font-weight: 700;
    font-size: 0.82rem;
    color: #fff;
    flex-shrink: 0;
  }
  .reaction-chip {
    background: rgba(15, 23, 42, 0.85);
    border: 1px solid rgba(255,255,255,0.12);
    border-radius: 999px;
    padding: 2px 9px;
    font-size: 0.74rem;
    cursor: pointer;
    color: #E2E8F0;
  }
  .reaction-chip:hover {
    border-color: #0EA5E9;
  }
  .code-block-pre {
    background: #050811;
    border: 1px solid rgba(14, 165, 233, 0.3);
    border-radius: 10px;
    padding: 0.75rem;
    font-family: 'JetBrains Mono', monospace;
    font-size: 0.8rem;
    color: #38BDF8;
    overflow-x: auto;
    margin-top: 0.5rem;
  }
  .huddle-video-frame {
    width: 100%;
    max-height: 260px;
    background: #000;
    border-radius: 12px;
    border: 1px solid #0EA5E9;
    object-fit: cover;
  }
  @media (max-width: 991px) {
    .chat-pro-shell { grid-template-columns: 1fr; }
  }
`;
document.head.appendChild(chatProStyles);

// 1. Initialize & Replace Basic Chat Page with Full Enterprise Hub
async function initChatMeetingPro() {
  const page = document.getElementById("page-chat-meetings");
  if (!page) return;

  page.innerHTML = `
    <!-- Top Header & Mode Switcher -->
    <div class="d-flex flex-wrap justify-content-between align-items-center mb-3">
      <div>
        <span class="pill-badge pill-violet">REAL-TIME COLLABORATION & MEETING OS</span>
        <h3 class="fw-bold mb-0">Team Chat Channels, Live Video Huddle & Meeting Command Center</h3>
      </div>
      <div class="d-flex flex-wrap gap-2 mt-2 mt-md-0">
        <button class="btn-brand btn-sm" onclick="switchCollabSubTab('chat')"><i class="fa-solid fa-comments me-1"></i> Team Chat & Channels</button>
        <button class="btn btn-outline-info btn-sm rounded-3 px-3" onclick="switchCollabSubTab('meetings')"><i class="fa-solid fa-calendar-check me-1"></i> Meetings & Action Items</button>
        <button class="btn btn-outline-warning btn-sm rounded-3 px-3" onclick="switchCollabSubTab('huddle')"><i class="fa-solid fa-video me-1"></i> Live Video / Screen Huddle</button>
      </div>
    </div>

    <!-- SUB-TAB 1: SLACK/DISCORD STYLE MULTI-CHANNEL TEAM CHAT -->
    <div id="collab-tab-chat">
      <div class="chat-pro-shell">
        <!-- Left Channel List & Sender Identity -->
        <div class="channel-sidebar">
          <div>
            <div class="d-flex justify-content-between align-items-center mb-2">
              <span class="small fw-bold text-uppercase text-secondary">Workspace Channels</span>
              <button class="btn btn-sm btn-outline-info py-0 px-2" onclick="promptNewChannel()" title="Create Channel">+</button>
            </div>
            <div id="proChannelList"></div>

            <hr class="border-secondary my-3">
            <div class="small fw-bold text-uppercase text-secondary mb-2">Your Sender Profile</div>
            <input type="text" id="chatSenderName" class="form-control form-control-sm mb-2" value="Vijay Dakeni" placeholder="Your Name">
            <select id="chatSenderRole" class="form-select form-select-sm mb-2">
              <option>Founder & CTO</option>
              <option>Co-Founder</option>
              <option>Core Developer</option>
              <option>UI/UX Designer</option>
              <option>Researcher</option>
              <option>Project Manager</option>
            </select>
          </div>

          <div class="p-2 rounded-3 bg-dark border border-secondary small">
            <div class="fw-bold text-info"><i class="fa-solid fa-robot me-1"></i>JARVIS Bot Active</div>
            <div class="text-secondary" style="font-size:0.74rem;">Type <code>@ai</code> in any message for instant AI Co-Founder help.</div>
          </div>
        </div>

        <!-- Right Active Channel Stream & Rich Composer -->
        <div class="glass-card d-flex flex-column justify-content-between p-3">
          <!-- Channel Header Bar -->
          <div class="d-flex flex-wrap justify-content-between align-items-center pb-2 mb-2 border-bottom border-secondary">
            <div>
              <h5 class="fw-bold mb-0 text-info" id="activeChannelTitle">#core-architecture</h5>
              <small class="text-secondary" id="activeChannelTopic">System Design, Flask APIs & Database Scaling</small>
            </div>
            <div class="d-flex gap-2 align-items-center mt-2 mt-md-0">
              <input type="text" id="chatSearchFilter" class="form-control form-control-sm" placeholder="Search messages..." oninput="renderMessagesStream()">
              <button class="btn btn-sm btn-outline-warning text-nowrap" id="btnFilterPinned" onclick="togglePinnedFilter()">
                <i class="fa-solid fa-thumbtack me-1"></i>Pinned
              </button>
            </div>
          </div>

          <!-- Messages Scroll Stream -->
          <div class="chat-stream-box mb-3" id="proMessagesStream"></div>

          <!-- Extra Composer Panels (Hidden by default: Code, Poll, Link) -->
          <div id="extraComposerCode" class="mb-2 d-none">
            <textarea id="chatCodeInput" class="form-control form-control-sm font-monospace" rows="3" placeholder="Paste Python, JS, SQL or HTML code snippet here..."></textarea>
          </div>

          <div id="extraComposerLink" class="mb-2 d-none">
            <input type="url" id="chatLinkInput" class="form-control form-control-sm" placeholder="https://example.com (Website URL to attach with preview)">
          </div>

          <div id="extraComposerPoll" class="p-2 rounded bg-dark border border-info mb-2 d-none">
            <div class="small fw-bold text-info mb-1">Create Interactive Team Poll</div>
            <input type="text" id="pollQuestionInput" class="form-control form-control-sm mb-1" placeholder="Poll Question (e.g. Which feature should we ship first?)">
            <input type="text" id="pollOptionsInput" class="form-control form-control-sm mb-1" placeholder="Comma separated options (e.g. Payment Webhook, Mobile UI, AI Pitch)">
            <button class="btn btn-sm btn-info" onclick="sendPollMessage()">Launch Poll in Channel</button>
          </div>

          <!-- Rich Message Composer Bar -->
          <div>
            <div class="d-flex flex-wrap gap-1 mb-2">
              <label class="btn btn-sm btn-outline-info mb-0" title="Upload Photo or Document">
                <i class="fa-solid fa-paperclip me-1"></i>File / Photo
                <input type="file" id="chatFileUpload" hidden onchange="sendFileAttachmentMessage(event)">
              </label>
              <button class="btn btn-sm btn-outline-warning" onclick="toggleComposerBox('extraComposerCode')">
                <i class="fa-solid fa-code me-1"></i>Code Block
              </button>
              <button class="btn btn-sm btn-outline-success" onclick="toggleComposerBox('extraComposerLink')">
                <i class="fa-solid fa-globe me-1"></i>Website Link
              </button>
              <button class="btn btn-sm btn-outline-primary" onclick="toggleComposerBox('extraComposerPoll')">
                <i class="fa-solid fa-square-poll-vertical me-1"></i>Create Poll
              </button>
              <button class="btn btn-sm btn-outline-danger" id="voiceRecordBtn" onclick="toggleVoiceNoteRecording()">
                <i class="fa-solid fa-microphone me-1"></i>Record Voice Note
              </button>
            </div>

            <form onsubmit="sendRichChatMessage(event)" class="input-group">
              <input type="text" id="proChatTextInput" class="form-control" placeholder="Message #channel, @mention team, or type @ai for assistant...">
              <button type="submit" class="btn-brand px-4"><i class="fa-solid fa-paper-plane me-1"></i> Send</button>
            </form>
          </div>
        </div>
      </div>
    </div>

    <!-- SUB-TAB 2: FULL MEETING MANAGEMENT, AGENDA, LIVE TRANSCRIPT & ACTION ITEMS -->
    <div id="collab-tab-meetings" class="d-none">
      <div class="row g-4">
        <!-- Left: Schedule New Meeting + Meeting List -->
        <div class="col-lg-4">
          <div class="glass-card mb-3">
            <h5 class="fw-bold text-info mb-3"><i class="fa-solid fa-calendar-plus me-2"></i>Schedule New Meeting</h5>
            <form onsubmit="createNewMeetingPro(event)">
              <input type="text" id="mtTitle" class="form-control form-control-sm mb-2" placeholder="Meeting Title (e.g. SIH Final Architecture Review)" required>
              <div class="row g-2 mb-2">
                <div class="col-6"><input type="date" id="mtDate" class="form-control form-control-sm" required></div>
                <div class="col-6"><input type="text" id="mtTime" class="form-control form-control-sm" value="11:00 AM" required></div>
              </div>
              <input type="text" id="mtAttendees" class="form-control form-control-sm mb-2" placeholder="Attendees (e.g. Vijay, Srajal, Core Team)" value="Vijay Dakeni, Core Team">
              <input type="url" id="mtLink" class="form-control form-control-sm mb-2" value="https://meet.google.com/new" placeholder="Google Meet / Zoom Link">
              <textarea id="mtAgenda" class="form-control form-control-sm mb-2" rows="2" placeholder="Meeting Agenda & Key Topics..."></textarea>
              <button type="submit" class="btn-brand btn-sm w-100">Schedule & Create Workspace</button>
            </form>
          </div>

          <div class="glass-card">
            <h6 class="fw-bold mb-2">All Scheduled & Past Meetings</h6>
            <div id="proMeetingsList" class="d-flex flex-column gap-2"></div>
          </div>
        </div>

        <!-- Right: Active Meeting Workspace (Minutes, Speech Dictation, Decisions, Action Items) -->
        <div class="col-lg-8">
          <div class="glass-card h-100" id="activeMeetingWorkspaceBox"></div>
        </div>
      </div>
    </div>

    <!-- SUB-TAB 3: BUILT-IN WEBRTC VIDEO & SCREEN-SHARE HUDDLE ROOM -->
    <div id="collab-tab-huddle" class="d-none">
      <div class="glass-card">
        <div class="d-flex flex-wrap justify-content-between align-items-center mb-3">
          <div>
            <span class="pill-badge pill-emerald">INSTANT WEBRTC STUDIO</span>
            <h4 class="fw-bold mb-0">Live Founder Video & Screen-Share Huddle Room</h4>
          </div>
          <div class="d-flex gap-2">
            <button class="btn-brand btn-sm" onclick="startLocalCameraHuddle()"><i class="fa-solid fa-camera me-1"></i> Start Camera & Mic</button>
            <button class="btn btn-outline-info btn-sm" onclick="startScreenShareHuddle()"><i class="fa-solid fa-desktop me-1"></i> Share Screen</button>
            <button class="btn btn-outline-danger btn-sm" onclick="stopHuddleStreams()"><i class="fa-solid fa-phone-slash me-1"></i> End Huddle</button>
          </div>
        </div>
        <div class="row g-3">
          <div class="col-md-6">
            <div class="p-2 rounded bg-dark border border-secondary text-center">
              <div class="small text-info fw-bold mb-2">Founder Camera Feed</div>
              <video id="localCameraVideo" class="huddle-video-frame" autoplay muted playsinline></video>
            </div>
          </div>
          <div class="col-md-6">
            <div class="p-2 rounded bg-dark border border-secondary text-center">
              <div class="small text-warning fw-bold mb-2">Live Screen Share / Presentation Feed</div>
              <video id="localScreenVideo" class="huddle-video-frame" autoplay muted playsinline></video>
            </div>
          </div>
        </div>
      </div>
    </div>
  `;

  await refreshChatMeetingState();
}

function switchCollabSubTab(tabName) {
  ["chat", "meetings", "huddle"].forEach(t => {
    document.getElementById(`collab-tab-${t}`)?.classList.toggle("d-none", t !== tabName);
  });
}

async function refreshChatMeetingState() {
  const res = await fetch(`${API_BASE_URL}/api/chat/bootstrap`);
  CHAT_STATE = await res.json();
  if (!ACTIVE_MEETING_ID && CHAT_STATE.meetings.length > 0) {
    ACTIVE_MEETING_ID = CHAT_STATE.meetings[0].id;
  }
  renderChannelsSidebar();
  renderMessagesStream();
  renderMeetingsSection();
}

// =========================================================================
// CHANNELS & RICH MESSAGING ENGINE
// =========================================================================
function renderChannelsSidebar() {
  const box = document.getElementById("proChannelList");
  if (!box) return;
  box.innerHTML = CHAT_STATE.channels.map(c => {
    const unreadCount = CHAT_STATE.messages.filter(m => m.channel === c.id).length;
    return `
      <div class="channel-pill ${c.id === ACTIVE_CHANNEL ? 'active' : ''}" onclick="selectChannel('${c.id}')">
        <span><i class="fa-solid fa-hashtag text-info me-1"></i>${c.name}</span>
        <div class="d-flex align-items-center gap-1">
          <span class="badge bg-dark border border-secondary" style="font-size:0.68rem;">${unreadCount}</span>
          ${c.id !== 'core-architecture' ? `<button class="btn btn-sm text-danger p-0 ms-1 adv-del-btn" onclick="event.stopPropagation(); deleteChannelPro('${c.id}')">×</button>` : ''}
        </div>
      </div>
    `;
  }).join("");

  const cur = CHAT_STATE.channels.find(c => c.id === ACTIVE_CHANNEL) || CHAT_STATE.channels[0];
  if (cur) {
    document.getElementById("activeChannelTitle").innerText = `#${cur.name}`;
    document.getElementById("activeChannelTopic").innerText = cur.topic;
  }
}

function selectChannel(channelId) {
  ACTIVE_CHANNEL = channelId;
  renderChannelsSidebar();
  renderMessagesStream();
}

async function promptNewChannel() {
  const name = prompt("Enter new channel name (e.g. marketing-growth, sih-hackathon):");
  if (!name) return;
  const topic = prompt("Enter channel topic / purpose:", "Team Execution & Updates");
  await fetch(`${API_BASE_URL}/api/chat/channels`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ name, topic })
  });
  await refreshChatMeetingState();
}

async function deleteChannelPro(cid) {
  await fetch(`${API_BASE_URL}/api/chat/channels?id=${cid}`, { method: "DELETE" });
  ACTIVE_CHANNEL = "core-architecture";
  await refreshChatMeetingState();
}

function togglePinnedFilter() {
  SHOW_PINNED_ONLY = !SHOW_PINNED_ONLY;
  const btn = document.getElementById("btnFilterPinned");
  btn.className = SHOW_PINNED_ONLY ? "btn btn-sm btn-warning text-dark text-nowrap" : "btn btn-sm btn-outline-warning text-nowrap";
  renderMessagesStream();
}

function toggleComposerBox(boxId) {
  document.getElementById(boxId)?.classList.toggle("d-none");
}

function renderMessagesStream() {
  const stream = document.getElementById("proMessagesStream");
  if (!stream) return;

  const query = (document.getElementById("chatSearchFilter")?.value || "").toLowerCase();
  const msgs = CHAT_STATE.messages.filter(m => {
    if (m.channel !== ACTIVE_CHANNEL) return false;
    if (SHOW_PINNED_ONLY && !m.pinned) return false;
    if (query && !m.text.toLowerCase().includes(query) && !m.sender.toLowerCase().includes(query)) return false;
    return true;
  });

  if (msgs.length === 0) {
    stream.innerHTML = `<div class="text-center text-secondary py-5">Is channel me abhi koi message nahi hai. Niche se pehla message, code ya voice note bhejein!</div>`;
    return;
  }

  stream.innerHTML = msgs.map(m => {
    const formattedText = (m.text || "").replace(/(@\w+)/g, '<b class="text-info">$1</b>');

    let attachmentHtml = "";
    if (m.media_url) {
      if (m.msg_type === "voice" || m.media_url.endsWith(".webm") || m.media_url.endsWith(".mp3") || m.media_url.endsWith(".wav")) {
        attachmentHtml = `<audio controls src="${m.media_url}" class="mt-2 w-100" style="height:36px;"></audio>`;
      } else if (m.media_url.match(/\.(jpeg|jpg|gif|png|webp)$/i)) {
        attachmentHtml = `<img src="${m.media_url}" class="img-fluid rounded-3 border border-secondary mt-2" style="max-height:220px; cursor:zoom-in;" onclick="openImageZoomLightbox('${m.media_url}', 'Chat Image')">`;
      } else {
        attachmentHtml = `<div class="mt-2"><a href="${m.media_url}" target="_blank" download class="btn btn-sm btn-outline-info"><i class="fa-solid fa-file-arrow-down me-1"></i>Download Attached File</a></div>`;
      }
    }

    const codeHtml = m.code_snippet
      ? `<pre class="code-block-pre"><code>${m.code_snippet.replace(/</g, "&lt;")}</code></pre>`
      : "";

    const linkHtml = m.link_url
      ? `<div class="p-2 rounded bg-dark border border-info mt-2 d-flex justify-content-between align-items-center">
           <div>
             <div class="small text-info fw-bold"><i class="fa-solid fa-Up-right-from-square me-1"></i>Website Link Preview</div>
             <a href="${m.link_url}" target="_blank" class="small text-light text-decoration-underline">${m.link_url}</a>
           </div>
           <a href="${m.link_url}" target="_blank" class="btn btn-sm btn-outline-info">Open Website</a>
         </div>`
      : "";

    let pollHtml = "";
    if (m.poll_data && m.poll_data.options) {
      const totalVotes = m.poll_data.options.reduce((acc, o) => acc + o.votes, 0) || 1;
      pollHtml = `
        <div class="p-3 rounded-3 bg-dark border border-primary mt-2">
          <div class="fw-bold text-warning mb-2"><i class="fa-solid fa-square-poll-vertical me-1"></i>Poll: ${m.poll_data.question}</div>
          ${m.poll_data.options.map((opt, idx) => {
            const pct = Math.round((opt.votes / totalVotes) * 100);
            return `
              <div class="mb-2">
                <div class="d-flex justify-content-between small mb-1">
                  <span>${opt.text}</span>
                  <span class="text-info fw-bold">${opt.votes} votes (${pct}%)</span>
                </div>
                <div class="d-flex align-items-center gap-2">
                  <div class="progress flex-grow-1" style="height:8px; background:rgba(255,255,255,0.1);">
                    <div class="progress-bar bg-info" style="width:${pct}%"></div>
                  </div>
                  <button class="btn btn-sm btn-outline-info py-0 px-2" onclick="interactChatMsg(${m.id}, 'vote', ${idx})">Vote</button>
                </div>
              </div>
            `;
          }).join("")}
        </div>
      `;
    }

    const existingReacts = Object.entries(m.reactions || {}).map(([emo, cnt]) =>
      `<span class="reaction-chip" onclick="interactChatMsg(${m.id}, 'react', '${emo}')">${emo} ${cnt}</span>`
    ).join("");

    return `
      <div class="msg-bubble ${m.pinned ? 'pinned-msg' : ''}">
        <div class="d-flex justify-content-between align-items-start">
          <div class="d-flex gap-2">
            <div class="avatar-circle">${m.avatar || "FD"}</div>
            <div>
              <div class="d-flex align-items-center gap-2">
                <span class="fw-bold">${m.sender}</span>
                <span class="pill-badge pill-violet" style="font-size:0.65rem; padding:1px 7px;">${m.role}</span>
                ${m.pinned ? '<span class="badge bg-warning text-dark" style="font-size:0.65rem;"><i class="fa-solid fa-thumbtack me-1"></i>Pinned</span>' : ''}
                <small class="text-secondary" style="font-size:0.72rem;">${m.timestamp}</small>
              </div>
              <div class="mt-1 text-light" style="font-size:0.9rem;">${formattedText}</div>
            </div>
          </div>

          <div class="d-flex gap-1">
            <button class="btn btn-sm btn-outline-warning py-0 px-1" onclick="interactChatMsg(${m.id}, 'pin')" title="Pin Message"><i class="fa-solid fa-thumbtack"></i></button>
            <button class="btn btn-sm btn-outline-info py-0 px-1" onclick="pushMessageToKanban('${(m.text || 'Team Task').replace(/'/g, "")}', '${m.sender}')" title="Convert to Kanban Task"><i class="fa-solid fa-list-check"></i></button>
            <button class="btn btn-sm btn-outline-danger py-0 px-1 adv-del-btn" onclick="deleteChatMsg(${m.id})" title="Delete"><i class="fa-solid fa-trash"></i></button>
          </div>
        </div>

        ${codeHtml}
        ${linkHtml}
        ${attachmentHtml}
        ${pollHtml}

        <div class="d-flex flex-wrap align-items-center gap-1 mt-2 pt-1">
          ${existingReacts}
          <span class="reaction-chip" onclick="interactChatMsg(${m.id}, 'react', '🔥')">+🔥</span>
          <span class="reaction-chip" onclick="interactChatMsg(${m.id}, 'react', '🚀')">+🚀</span>
          <span class="reaction-chip" onclick="interactChatMsg(${m.id}, 'react', '👍')">+👍</span>
          <span class="reaction-chip" onclick="interactChatMsg(${m.id}, 'react', '✅')">+✅</span>
        </div>
      </div>
    `;
  }).join("");

  stream.scrollTop = stream.scrollHeight;
}

// Send Rich Message
async function sendRichChatMessage(e) {
  e.preventDefault();
  const textInp = document.getElementById("proChatTextInput");
  const codeInp = document.getElementById("chatCodeInput");
  const linkInp = document.getElementById("chatLinkInput");

  if (!textInp.value.trim() && !codeInp.value.trim() && !linkInp.value.trim()) return;

  await fetch(`${API_BASE_URL}/api/chat/messages`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      channel: ACTIVE_CHANNEL,
      sender: document.getElementById("chatSenderName").value || "Vijay Dakeni",
      role: document.getElementById("chatSenderRole").value || "Founder",
      text: textInp.value,
      msg_type: codeInp.value.trim() ? "code" : "text",
      code_snippet: codeInp.value,
      link_url: linkInp.value
    })
  });

  textInp.value = "";
  codeInp.value = "";
  linkInp.value = "";
  document.getElementById("extraComposerCode")?.classList.add("d-none");
  document.getElementById("extraComposerLink")?.classList.add("d-none");
  await refreshChatMeetingState();
}

// Upload File / Image in Chat
async function sendFileAttachmentMessage(e) {
  const url = await uploadFileToServer(e.target);
  if (!url) return;
  const fname = e.target.files[0]?.name || "Shared Attachment";
  await fetch(`${API_BASE_URL}/api/chat/messages`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      channel: ACTIVE_CHANNEL,
      sender: document.getElementById("chatSenderName").value || "Vijay Dakeni",
      role: document.getElementById("chatSenderRole").value || "Founder",
      text: `📎 Shared Attachment: ${fname}`,
      msg_type: "file",
      media_url: url
    })
  });
  await refreshChatMeetingState();
}

// Record & Send Real Voice Note in Chat
async function toggleVoiceNoteRecording() {
  const btn = document.getElementById("voiceRecordBtn");
  if (mediaRecorder && mediaRecorder.state === "recording") {
    mediaRecorder.stop();
    btn.innerHTML = '<i class="fa-solid fa-microphone me-1"></i>Record Voice Note';
    btn.classList.replace("btn-danger", "btn-outline-danger");
    return;
  }

  try {
    const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
    mediaRecorder = new MediaRecorder(stream);
    audioChunks = [];
    mediaRecorder.ondataavailable = (ev) => audioChunks.push(ev.data);
    mediaRecorder.onstop = async () => {
      const blob = new Blob(audioChunks, { type: "audio/webm" });
      const file = new File([blob], `voicenote_${Date.now()}.webm`, { type: "audio/webm" });
      const formData = new FormData();
      formData.append("file", file);
      const upRes = await fetch(`${API_BASE_URL}/api/adv/upload_file`, { method: "POST", body: formData });
      const upData = await upRes.json();

      await fetch(`${API_BASE_URL}/api/chat/messages`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          channel: ACTIVE_CHANNEL,
          sender: document.getElementById("chatSenderName").value || "Vijay Dakeni",
          role: document.getElementById("chatSenderRole").value || "Founder",
          text: "🎙️ Sent a Voice Note",
          msg_type: "voice",
          media_url: upData.url
        })
      });
      stream.getTracks().forEach(t => t.stop());
      await refreshChatMeetingState();
    };
    mediaRecorder.start();
    btn.innerHTML = '<i class="fa-solid fa-stop me-1"></i>Stop & Send Voice Note';
    btn.classList.replace("btn-outline-danger", "btn-danger");
  } catch (err) {
    alert("Microphone access required for voice notes.");
  }
}

// Launch Interactive Poll
async function sendPollMessage() {
  const q = document.getElementById("pollQuestionInput").value.trim();
  const rawOpts = document.getElementById("pollOptionsInput").value.trim();
  if (!q || !rawOpts) return;

  const options = rawOpts.split(",").map(o => ({ text: o.trim(), votes: 0 })).filter(o => o.text);
  await fetch(`${API_BASE_URL}/api/chat/messages`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      channel: ACTIVE_CHANNEL,
      sender: document.getElementById("chatSenderName").value || "Vijay Dakeni",
      role: document.getElementById("chatSenderRole").value || "Founder",
      text: "📊 Started a Team Decision Poll",
      msg_type: "poll",
      poll_data: { question: q, options }
    })
  });
  document.getElementById("pollQuestionInput").value = "";
  document.getElementById("pollOptionsInput").value = "";
  document.getElementById("extraComposerPoll")?.classList.add("d-none");
  await refreshChatMeetingState();
}

async function interactChatMsg(id, action, extraVal) {
  const payload = { id, action };
  if (action === "react") payload.emoji = extraVal;
  if (action === "vote") payload.option_index = extraVal;
  await fetch(`${API_BASE_URL}/api/chat/interact`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload)
  });
  await refreshChatMeetingState();
}

async function deleteChatMsg(id) {
  await fetch(`${API_BASE_URL}/api/chat/messages?id=${id}`, { method: "DELETE" });
  await refreshChatMeetingState();
}

async function pushMessageToKanban(titleText, assigneeName) {
  await fetch(`${API_BASE_URL}/api/chat/convert_to_task`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ title: titleText, assignee: assigneeName })
  });
  alert("Converted into Kanban Task!");
  syncDatabase();
}

// =========================================================================
// MEETINGS COMMAND CENTER (AGENDA, SPEECH TRANSCRIPT, DECISIONS, ACTIONS)
// =========================================================================
function renderMeetingsSection() {
  const listEl = document.getElementById("proMeetingsList");
  const workEl = document.getElementById("activeMeetingWorkspaceBox");
  if (!listEl || !workEl) return;

  listEl.innerHTML = CHAT_STATE.meetings.map(m => `
    <div class="p-2 rounded-3 border ${m.id === ACTIVE_MEETING_ID ? 'border-info bg-dark' : 'border-secondary'} d-flex justify-content-between align-items-center" style="cursor:pointer;" onclick="selectMeeting(${m.id})">
      <div>
        <div class="fw-bold small">${m.title}</div>
        <small class="text-secondary" style="font-size:0.72rem;">${m.date}
${m.time}</small>
      </div>
      <div class="d-flex align-items-center gap-1">
        <span class="pill-badge pill-emerald" style="font-size:0.65rem;">${m.status}</span>
        <button class="btn btn-sm text-danger p-0 ms-1 adv-del-btn" onclick="event.stopPropagation(); deleteMeetingPro(${m.id})"><i class="fa-solid fa-trash"></i></button>
      </div>
    </div>
  `).join("");

  const cur = CHAT_STATE.meetings.find(m => m.id === ACTIVE_MEETING_ID);
  if (!cur) {
    workEl.innerHTML = `<div class="text-secondary text-center py-5">Left side se koi meeting select karein ya nayi meeting schedule karein.</div>`;
    return;
  }

  workEl.innerHTML = `
    <div class="d-flex flex-wrap justify-content-between align-items-start pb-3 mb-3 border-bottom border-secondary">
      <div>
        <span class="pill-badge pill-cyan mb-1">${cur.date} at ${cur.time}Host: 
${cur.host}</span>
        <h4 class="fw-bold mb-1">${cur.title}</h4>
        <div class="small text-secondary"><i class="fa-solid fa-users me-1"></i>Attendees: ${cur.attendees}</div>
      </div>
      <div class="d-flex flex-wrap gap-2 mt-2 mt-md-0">
        <a href="${cur.meet_link}" target="_blank" class="btn btn-sm btn-outline-info"><i class="fa-solid fa-video me-1"></i>External Meet Link</a>
        <button class="btn btn-sm btn-outline-warning" onclick="dictateMeetingNotes()"><i class="fa-solid fa-microphone-lines me-1"></i>Voice-to-Text Note</button>
        <button class="btn-brand btn-sm" onclick="saveMeetingWorkspace(${cur.id}, true)"><i class="fa-solid fa-vault me-1"></i>Save & Archive to Vault</button>
      </div>
    </div>

    <div class="row g-3">
      <div class="col-md-6">
        <label class="small text-info fw-bold mb-1">1. Meeting Agenda</label>
        <textarea id="editMtAgenda" class="form-control form-control-sm mb-3" rows="3">${cur.agenda || ""}</textarea>

        <label class="small text-warning fw-bold mb-1">2. Live Meeting Notes & Transcript</label>
        <textarea id="editMtNotes" class="form-control form-control-sm" rows="5">${cur.notes || ""}</textarea>
      </div>

      <div class="col-md-6">
        <label class="small text-success fw-bold mb-1">3. Key Decisions Locked</label>
        <textarea id="editMtDecisions" class="form-control form-control-sm mb-3" rows="3">${cur.decisions || ""}</textarea>

        <label class="small text-primary fw-bold mb-1">4. Action Items (1-Click Push to Kanban)</label>
        <div class="input-group input-group-sm mb-2">
          <input type="text" id="newActionItemText" class="form-control" placeholder="New Action Item...">
          <input type="text" id="newActionItemOwner" class="form-control" style="max-width:110px;" value="Founder">
          <button class="btn btn-outline-info" onclick="addMeetingActionItem(${cur.id})">+ Add</button>
        </div>

        <div class="d-flex flex-column gap-1" style="max-height:160px; overflow-y:auto;">
          ${(cur.action_items || []).map((ai, idx) => `
            <div class="p-2 rounded bg-dark border border-secondary d-flex justify-content-between align-items-center small">
              <div>
                <input type="checkbox" class="form-check-input me-2" ${ai.done ? 'checked' : ''} onchange="toggleMeetingAction(${cur.id}, ${idx})">
                <span class="${ai.done ? 'text-decoration-line-through text-secondary' : ''}">${ai.task}</span>
                <span class="badge bg-secondary ms-1">${ai.owner}</span>
              </div>
              <button class="btn btn-sm btn-outline-info py-0 px-2" onclick="pushMessageToKanban('${ai.task.replace(/'/g, "")}', '${ai.owner}')" title="Push to Kanban">To Kanban</button>
            </div>
          `).join("")}
        </div>
      </div>
    </div>

    <div class="mt-3 pt-2 border-top border-secondary d-flex justify-content-between">
      <button class="btn btn-sm btn-outline-info" onclick="generateAIMeetingSummary(${cur.id})"><i class="fa-solid fa-wand-magic-sparkles me-1"></i>Auto-Summarize Meeting with AI</button>
      <button class="btn-brand btn-sm" onclick="saveMeetingWorkspace(${cur.id}, false)">Save Meeting Updates</button>
    </div>
  `;
}

function selectMeeting(id) {
  ACTIVE_MEETING_ID = id;
  renderMeetingsSection();
}

async function createNewMeetingPro(e) {
  e.preventDefault();
  const res = await fetch(`${API_BASE_URL}/api/chat/meetings`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      title: document.getElementById("mtTitle").value,
      date: document.getElementById("mtDate").value,
      time: document.getElementById("mtTime").value,
      attendees: document.getElementById("mtAttendees").value,
      meet_link: document.getElementById("mtLink").value,
      agenda: document.getElementById("mtAgenda").value
    })
  });
  const data = await res.json();
  ACTIVE_MEETING_ID = data.meeting.id;
  e.target.reset();
  await refreshChatMeetingState();
}

async function saveMeetingWorkspace(id, saveToVault) {
  const cur = CHAT_STATE.meetings.find(m => m.id === id);
  if (!cur) return;
  await fetch(`${API_BASE_URL}/api/chat/meetings`, {
    method: "PUT",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      id,
      agenda: document.getElementById("editMtAgenda").value,
      notes: document.getElementById("editMtNotes").value,
      decisions: document.getElementById("editMtDecisions").value,
      action_items: cur.action_items,
      save_to_vault: saveToVault
    })
  });
  if (saveToVault) {
    alert("Meeting Minutes saved & archived to Knowledge Vault!");
    syncDatabase();
  }
  await refreshChatMeetingState();
}

async function addMeetingActionItem(id) {
  const cur = CHAT_STATE.meetings.find(m => m.id === id);
  const taskTxt = document.getElementById("newActionItemText").value.trim();
  const ownerTxt = document.getElementById("newActionItemOwner").value.trim() || "Founder";
  if (!cur || !taskTxt) return;
  cur.action_items = cur.action_items || [];
  cur.action_items.push({ id: Date.now(), task: taskTxt, owner: ownerTxt, done: false });
  await saveMeetingWorkspace(id, false);
}

async function toggleMeetingAction(id, idx) {
  const cur = CHAT_STATE.meetings.find(m => m.id === id);
  if (!cur || !cur.action_items[idx]) return;
  cur.action_items[idx].done = !cur.action_items[idx].done;
  await saveMeetingWorkspace(id, false);
}

async function deleteMeetingPro(id) {
  await fetch(`${API_BASE_URL}/api/chat/meetings?id=${id}`, { method: "DELETE" });
  ACTIVE_MEETING_ID = null;
  await refreshChatMeetingState();
}

function dictateMeetingNotes() {
  const SpeechRec = window.SpeechRecognition || window.webkitSpeechRecognition;
  if (!SpeechRec) return alert("Speech dictation works in Chrome/Edge.");
  const rec = new SpeechRec();
  rec.lang = "en-IN";
  rec.onresult = (e) => {
    const notesBox = document.getElementById("editMtNotes");
    notesBox.value += (notesBox.value ? "\n" : "• ") + e.results[0][0].transcript;
  };
  rec.start();
}

async function generateAIMeetingSummary(id) {
  const notes = document.getElementById("editMtNotes").value;
  const decisions = document.getElementById("editMtDecisions");
  decisions.value = `⚡ AI EXECUTIVE SUMMARY:\nCore Focus: ${notes.slice(0, 120) || "Architecture & Product Velocity"}...\nDecision Locked: Prioritize high-feasibility MVP features & weekly customer validation.`;
  await saveMeetingWorkspace(id, false);
}

// =========================================================================
// WEBRTC LIVE CAMERA & SCREEN SHARE HUDDLE
// =========================================================================
async function startLocalCameraHuddle() {
  try {
    localVideoStream = await navigator.mediaDevices.getUserMedia({ video: true, audio: true });
    document.getElementById("localCameraVideo").srcObject = localVideoStream;
  } catch (err) {
    alert("Camera permission needed to start video huddle.");
  }
}

async function startScreenShareHuddle() {
  try {
    const screenStream = await navigator.mediaDevices.getDisplayMedia({ video: true });
    document.getElementById("localScreenVideo").srcObject = screenStream;
  } catch (err) {
    console.warn("Screen share cancelled.");
  }
}

function stopHuddleStreams() {
  ["localCameraVideo", "localScreenVideo"].forEach(vidId => {
    const vid = document.getElementById(vidId);
    if (vid && vid.srcObject) {
      vid.srcObject.getTracks().forEach(t => t.stop());
      vid.srcObject = null;
    }
  });
}

window.addEventListener("DOMContentLoaded", () => {
  setTimeout(initChatMeetingPro, 220);
});