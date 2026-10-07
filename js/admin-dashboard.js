(function (global) {
  const H = () => WeLinkHelpers;
  let session = null;
  let currentSection = "dashboard";
  let searchQuery = "";
  let lineChart = null;
  let donutChart = null;
  let clockTimer = null;
  let pendingRejectId = null;
  let selectedConversationId = null;
  let presenceState = {};
  let liveMessages = [];
  let realtimeSearchQuery = "";
  let monitorableIds = new Set();
  let sidebarUnread = 0;
  let memberFilterRole = "all";
  let memberFilterStatus = "all";
  let selectedMemberId = null;
  let selectedMemberRole = null;
  let selectedSupportConversationId = null;
  let supportLiveMessages = [];
  let commHubTabs = { adminGuest: "active", adminPro: "active", guestPro: "active" };
  let selectedCommHubDetail = null;

  function openRejectModal(id) {
    pendingRejectId = id;
    const modal = document.getElementById("reject-modal");
    const input = document.getElementById("reject-reason-input");
    if (input) input.value = "";
    modal?.removeAttribute("hidden");
    modal?.classList.add("open");
    input?.focus();
  }

  function closeRejectModal() {
    pendingRejectId = null;
    const modal = document.getElementById("reject-modal");
    modal?.classList.remove("open");
    modal?.setAttribute("hidden", "");
  }

  const NAV = [
    { id: "dashboard", label: "Dashboard", icon: "grid" },
    { id: "professionals", label: "Professionals", icon: "briefcase", chevron: true },
    { id: "guests", label: "Guests", icon: "users", chevron: true },
    { id: "events", label: "Events", icon: "clock", chevron: true },
    { id: "communication", label: "Communication", icon: "message", chevron: true },
    { id: "realtime", label: "Real-Time Conversations", icon: "radio", badge: "live" },
    { id: "whatsapp", label: "WhatsApp Management", icon: "phone", chevron: true },
    { id: "notifications", label: "Notifications", icon: "bell", badge: "count" },
    { id: "members", label: "Members", icon: "members" },
    { id: "settings", label: "Settings", icon: "settings" }
  ];

  const ICONS = {
    grid: '<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><rect x="3" y="3" width="7" height="7" rx="1"/><rect x="14" y="3" width="7" height="7" rx="1"/><rect x="3" y="14" width="7" height="7" rx="1"/><rect x="14" y="14" width="7" height="7" rx="1"/></svg>',
    briefcase: '<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><rect x="2" y="7" width="20" height="14" rx="2"/><path d="M16 7V5a2 2 0 0 0-2-2h-4a2 2 0 0 0-2 2v2"/></svg>',
    users: '<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M23 21v-2a4 4 0 0 0-3-3.87"/><path d="M16 3.13a4 4 0 0 1 0 7.75"/></svg>',
    message: '<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"/></svg>',
    radio: '<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="12" cy="12" r="2"/><path d="M16.24 7.76a6 6 0 0 1 0 8.49"/><path d="M7.76 7.76a6 6 0 0 0 0 8.49"/><path d="M19.07 4.93a10 10 0 0 1 0 14.14"/><path d="M4.93 4.93a10 10 0 0 0 0 14.14"/></svg>',
    phone: '<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07 19.5 19.5 0 0 1-6-6 19.79 19.79 0 0 1-3.07-8.67A2 2 0 0 1 4.11 2h3a2 2 0 0 1 2 1.72c.127.96.361 1.903.7 2.81a2 2 0 0 1-.45 2.11L8.09 9.91a16 16 0 0 0 6 6l1.27-1.27a2 2 0 0 1 2.11-.45c.907.339 1.85.573 2.81.7A2 2 0 0 1 22 16.92z"/></svg>',
    bell: '<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9"/><path d="M13.73 21a2 2 0 0 1-3.46 0"/></svg>',
    members: '<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/></svg>',
    settings: '<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="12" cy="12" r="3"/><path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1-2.83 2.83l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-4 0v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83-2.83l.06-.06A1.65 1.65 0 0 0 4.68 15a1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1 0-4h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 2.83-2.83l.06.06A1.65 1.65 0 0 0 9 4.68a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 4 0v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 2.83l-.06.06A1.65 1.65 0 0 0 19.4 9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 0 4h-.09a1.65 1.65 0 0 0-1.51 1z"/></svg>',
    search: '<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="11" cy="11" r="8"/><path d="m21 21-4.35-4.35"/></svg>',
    usersKpi: '<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/></svg>',
    link: '<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M10 13a5 5 0 0 0 7.54.54l3-3a5 5 0 0 0-7.07-7.07l-1.72 1.71"/><path d="M14 11a5 5 0 0 0-7.54-.54l-3 3a5 5 0 0 0 7.07 7.07l1.71-1.71"/></svg>',
    clock: '<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/></svg>'
  };

  function relativeTime(ts) {
    if (!ts) return "—";
    const diff = Date.now() - ts;
    const sec = Math.floor(diff / 1000);
    if (sec < 60) return sec + "s ago";
    const min = Math.floor(sec / 60);
    if (min < 60) return min + "m ago";
    const hr = Math.floor(min / 60);
    if (hr < 24) return hr + "h ago";
    const day = Math.floor(hr / 24);
    return day + "d ago";
  }

  function fmtDateClock(d) {
    const days = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];
    const months = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
    const date = days[d.getDay()] + ", " + months[d.getMonth()] + " " + d.getDate() + ", " + d.getFullYear();
    const time = d.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
    return date + " | " + time;
  }

  function pillClass(status) {
    const s = (status || "").toLowerCase();
    if (s === "pending") return "pending";
    if (s === "approved" || s === "accepted" || s === "active" || s === "communication_active") return "approved";
    if (s === "rejected" || s === "declined" || s === "cancelled") return "rejected";
    if (s === "suspended") return "pending";
    if (s === "ended" || s === "closed") return "rejected";
    if (s === "deactivated") return "rejected";
    return "pending";
  }

  function communicationAdminActions(row) {
    const st = row.displayStatus?.key || "";
    const reqId = row.request?.id;
    const convId = row.conversation?.id;
    if (st === "pending") {
      return `<button type="button" class="button-primary btn-sm" data-comm-approve="${reqId}">Accept</button>
        <button type="button" class="button-destructive btn-sm" data-comm-reject="${reqId}">Reject</button>`;
    }
    if (st === "active" && convId) {
      return `<button type="button" class="button-outline btn-sm" data-conv-suspend="${convId}">Suspend Communication</button>
        <button type="button" class="button-destructive btn-sm" data-conv-end="${convId}">End Communication</button>`;
    }
    if (st === "suspended" && convId) {
      return `<button type="button" class="button-primary btn-sm" data-conv-resume="${convId}">Resume Communication</button>
        <button type="button" class="button-destructive btn-sm" data-conv-end="${convId}">End Communication</button>`;
    }
    if (st === "ended") {
      return `<span class="muted" style="font-size:12px;margin-right:8px">New request required</span>
        <button type="button" class="button-destructive btn-sm" data-comm-delete="${reqId}">Delete</button>`;
    }
    if (st === "rejected" || st === "cancelled") {
      return `<span class="muted" style="font-size:12px">New request required</span>`;
    }
    return "—";
  }

  function activityIcon(msg) {
    const m = (msg || "").toLowerCase();
    if (m.includes("whatsapp")) return { cls: "purple", icon: "📱" };
    if (m.includes("message") || m.includes("communication")) return { cls: "blue", icon: "💬" };
    if (m.includes("approved") || m.includes("registration")) return { cls: "green", icon: "✓" };
    return { cls: "orange", icon: "•" };
  }

  function computeTrend(notifications, keyword, days = 7) {
    const now = Date.now();
    const weekMs = days * 86400000;
    const thisWeek = notifications.filter((n) => now - n.createdAt < weekMs && (n.message || "").toLowerCase().includes(keyword)).length;
    const prevWeek = notifications.filter((n) => {
      const age = now - n.createdAt;
      return age >= weekMs && age < weekMs * 2 && (n.message || "").toLowerCase().includes(keyword);
    }).length;
    if (thisWeek === 0 && prevWeek === 0) return { pct: null, dir: "neutral" };
    if (prevWeek === 0) return { pct: thisWeek > 0 ? 100 : 0, dir: "up" };
    const pct = Math.round(((thisWeek - prevWeek) / prevWeek) * 100);
    return { pct: Math.abs(pct), dir: pct >= 0 ? "up" : "down" };
  }

  function trendHtml(trend) {
    if (trend.pct === null) return '<div class="kpi-trend neutral">— vs. last 7 days</div>';
    const arrow = trend.dir === "up" ? "↑" : "↓";
    return `<div class="kpi-trend ${trend.dir}">${arrow} ${trend.pct}% vs. last 7 days</div>`;
  }

  function chartSeries(db) {
    const days = 7;
    const labels = [];
    const proSeries = [];
    const guestSeries = [];
    for (let i = days - 1; i >= 0; i--) {
      const d = new Date();
      d.setDate(d.getDate() - i);
      d.setHours(0, 0, 0, 0);
      const next = new Date(d);
      next.setDate(next.getDate() + 1);
      labels.push(d.toLocaleDateString([], { month: "short", day: "numeric" }));
      const inDay = (n) => n.createdAt >= d.getTime() && n.createdAt < next.getTime();
      const dayNotes = db.notifications.filter(inDay);
      proSeries.push(dayNotes.filter((n) => /professional|pro|approved/i.test(n.message)).length || (i === 0 ? db.professionals.filter((p) => p.status === "approved").length : 0));
      guestSeries.push(dayNotes.filter((n) => /guest|registration/i.test(n.message)).length || (i === 0 ? db.guests.length : 0));
    }
    if (proSeries.every((v, i) => i > 0 && v === proSeries[0])) {
      const base = db.professionals.filter((p) => p.status === "approved").length;
      for (let i = 0; i < days; i++) proSeries[i] = Math.max(0, base - (days - 1 - i));
    }
    if (guestSeries.every((v, i) => i > 0 && v === guestSeries[0])) {
      const base = db.guests.length;
      for (let i = 0; i < days; i++) guestSeries[i] = Math.max(0, base - (days - 1 - i));
    }
    return { labels, proSeries, guestSeries };
  }

  function matchesSearch(text) {
    if (!searchQuery) return true;
    return (text || "").toLowerCase().includes(searchQuery.toLowerCase());
  }

  function navigate(section, opts = {}) {
    const prev = currentSection;
    if (prev === "realtime" && section !== "realtime" && global.WeLinkRealtime) {
      WeLinkRealtime.unsubscribeMessages();
      selectedConversationId = null;
      liveMessages = [];
    }
    currentSection = section;
    document.querySelectorAll(".nav-link").forEach((el) => {
      el.classList.toggle("active", el.dataset.section === section);
    });
    document.querySelectorAll(".section-panel").forEach((el) => {
      el.classList.toggle("active", el.dataset.sectionPanel === section);
    });
    closeSidebar();
    if (opts.selectConversation) {
      selectedConversationId = opts.selectConversation;
    }
    if (section === "realtime") {
      renderRealtime();
    }
    if (section === "events") {
      WeLink.load().then(renderEvents);
    }
    if (opts.scrollPending) {
      setTimeout(() => {
        document.querySelector("#professionals-pending-table")?.scrollIntoView({ behavior: "smooth" });
      }, 100);
    }
  }

  function closeSidebar() {
    document.querySelector(".admin-sidebar")?.classList.remove("open");
    document.querySelector(".sidebar-backdrop")?.classList.remove("open");
  }

  function updateClock() {
    const el = document.getElementById("admin-clock");
    if (el) el.textContent = fmtDateClock(new Date());
  }

  async function unreadCount() {
    if (!session?.id) return 0;
    const notes = await WeLink.unread(session.id);
    return notes.length;
  }

  function renderSidebar(unread) {
    const nav = document.getElementById("sidebar-nav");
    if (!nav) return;
    nav.innerHTML = NAV.map((item) => {
      let badge = "";
      if (item.badge === "live") badge = '<span class="nav-badge live badge-pill">Live</span>';
      if (item.badge === "count" && unread > 0) badge = `<span class="nav-badge count badge-pill">${unread}</span>`;
      const chevron = item.chevron
        ? '<svg class="nav-chevron" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polyline points="9 18 15 12 9 6"/></svg>'
        : "";
      return `<li class="nav-item"><button type="button" class="nav-link${item.chevron ? " expandable" : ""}${currentSection === item.id ? " active" : ""}" data-section="${item.id}">${ICONS[item.icon] || ""}<span>${item.label}</span>${badge}${chevron}</button></li>`;
    }).join("");
  }

  function renderTopBar(ap, unread) {
    const profile = document.getElementById("topbar-profile");
    if (profile) {
      profile.innerHTML = `
        <img src="${H().avatarUrl(ap)}" alt="" />
        <div class="topbar-profile-info">
          <strong>${H().esc(ap.name)}</strong>
          <span>Super Administrator</span>
        </div>`;
    }
    const bellBadge = document.getElementById("bell-count");
    if (bellBadge) {
      bellBadge.textContent = unread > 0 ? unread : "";
      bellBadge.style.display = unread > 0 ? "grid" : "none";
    }
  }

  function kpiCards(st, db) {
    const notes = db.notifications;
    return [
      { key: "totalRegisteredMembers", label: "Registered Members", value: st.totalRegisteredMembers, orb: "orb-sky", icon: "usersKpi", trend: computeTrend(notes, "registration") },
      { key: "activeMembers", label: "Active Members", value: st.activeMembers, orb: "orb-teal", icon: "usersKpi", trend: null },
      { key: "totalProfessionals", label: "Professionals", value: st.totalProfessionals, orb: "orb-mint", icon: "briefcase", trend: computeTrend(notes, "professional") },
      { key: "totalGuests", label: "Guests", value: st.totalGuests, orb: "orb-rose", icon: "users", trend: computeTrend(notes, "guest") },
      { key: "pendingApplications", label: "Pending Applications", value: st.pendingApplications, orb: "orb-peach", icon: "clock", trend: computeTrend(notes, "pending") },
      { key: "approvedProfessionals", label: "Approved Professionals", value: st.approvedProfessionals, orb: "orb-emerald", icon: "briefcase", trend: null },
      { key: "rejectedApplications", label: "Rejected Applications", value: st.rejectedApplications, orb: "orb-coral", icon: "clock", trend: null },
      { key: "activeCommunicationConnections", label: "Active Connections", value: st.activeCommunicationConnections, orb: "orb-lavender", icon: "link", trend: computeTrend(notes, "connection") }
    ];
  }

  async function renderKpis(st, db) {
    const row = document.getElementById("kpi-row");
    if (!row) return;
    row.innerHTML = kpiCards(st, db).map((c) => `
      <div class="kpi-card gradient-orb-card ${c.orb}" data-kpi="${c.key}">
        <div class="kpi-top">
          <div class="kpi-icon">${ICONS[c.icon] || ""}</div>
        </div>
        <div class="kpi-value">${c.value.toLocaleString()}</div>
        <div class="kpi-label">${c.label}</div>
        ${c.trend ? trendHtml(c.trend) : '<div class="kpi-trend neutral">Live count</div>'}
      </div>`).join("");
  }

  async function patchKpis() {
    const db = await WeLink.load();
    const st = await WeLink.getAdminStats();
    kpiCards(st, db).forEach((c) => {
      const card = document.querySelector(`[data-kpi="${c.key}"]`);
      if (!card) return;
      const val = card.querySelector(".kpi-value");
      if (val) val.textContent = c.value.toLocaleString();
    });
    renderCharts(st, db);
    renderApplications(db);
  }

  function renderCharts(st, db) {
    if (typeof Chart === "undefined") return;
    const { labels, proSeries, guestSeries } = chartSeries(db);
    const lineCtx = document.getElementById("line-chart");
    const donutCtx = document.getElementById("donut-chart");
    if (lineChart) lineChart.destroy();
    if (donutChart) donutChart.destroy();
    const chartInk = document.body.classList.contains("welink-cinematic") ? "#c8d4dc" : "#777169";
    const chartTick = document.body.classList.contains("welink-cinematic") ? "#aebcc8" : "#a8a29e";
    const chartGrid = document.body.classList.contains("welink-cinematic") ? "rgba(140, 160, 175, 0.22)" : "#f0efed";
    if (lineCtx) {
      lineChart = new Chart(lineCtx, {
        type: "line",
        data: {
          labels,
          datasets: [
            { label: "Professionals", data: proSeries, borderColor: "#7eb8a0", backgroundColor: "rgba(167,229,211,0.35)", tension: 0.4, fill: true, borderWidth: 2 },
            { label: "Guests", data: guestSeries, borderColor: "#a898c8", backgroundColor: "rgba(200,184,224,0.35)", tension: 0.4, fill: true, borderWidth: 2 }
          ]
        },
        options: {
          responsive: true,
          maintainAspectRatio: false,
          plugins: { legend: { labels: { color: chartInk, font: { family: "Inter" } } } },
          scales: {
            x: { ticks: { color: chartTick }, grid: { color: chartGrid } },
            y: { ticks: { color: chartTick }, grid: { color: chartGrid } }
          }
        }
      });
    }
    if (donutCtx) {
      const pros = st.totalProfessionals;
      const guests = st.totalGuests;
      const total = st.totalRegisteredMembers || 1;
      donutChart = new Chart(donutCtx, {
        type: "doughnut",
        data: {
          labels: ["Professionals", "Guests"],
          datasets: [{ data: [pros, guests], backgroundColor: ["#a7e5d3", "#c8b8e0"], borderWidth: 0 }]
        },
        options: {
          responsive: true,
          maintainAspectRatio: false,
          cutout: "70%",
          plugins: { legend: { position: "bottom", labels: { color: chartInk, boxWidth: 12, font: { family: "Inter" } } } }
        }
      });
      const center = document.getElementById("donut-center");
      if (center) {
        const proPct = Math.round((pros / total) * 100);
        const guestPct = 100 - proPct;
        center.innerHTML = `<div><b>${total.toLocaleString()}</b><span>Total Members</span><br><span style="font-size:10px;color:${chartTick}">Pro ${proPct}% · Guest ${guestPct}%</span></div>`;
      }
    }
  }

  function renderApplications(db) {
    const el = document.getElementById("applications-table");
    if (!el) return;
    const list = db.professionals.filter((p) => p.status === "pending");
    if (!list.length) {
      el.innerHTML = '<p class="empty-state">No pending applications.</p>';
      return;
    }
    el.innerHTML = `<div class="admin-table-wrap"><table class="admin-table"><thead><tr>
      <th>Professional</th><th>Specialization</th><th>Phone</th><th>Submitted</th><th>Status</th></tr></thead><tbody>
      ${list.slice(0, 5).map((p) => `<tr>
        <td><div class="table-user"><img src="${H().avatarUrl(p)}" alt="" /><span>${H().esc(p.name)}</span></div></td>
        <td>${H().esc(p.skill)}</td>
        <td>${H().esc(p.phone || "—")}</td>
        <td>${H().fmtTime(p.createdAt)}</td>
        <td><span class="status-pill badge-pill pending">Pending</span></td></tr>`).join("")}
      </tbody></table></div>`;
  }

  function renderActivities(db) {
    const el = document.getElementById("activity-feed");
    if (!el) return;
    const items = db.notifications.slice(0, 8);
    if (!items.length) {
      el.innerHTML = '<p class="empty-state">No recent activity.</p>';
      return;
    }
    el.innerHTML = items.map((n) => {
      const ic = activityIcon(n.message);
      return `<div class="activity-item">
        <div class="activity-icon ${ic.cls}">${ic.icon}</div>
        <div class="activity-text">${H().esc(n.message)}</div>
        <div class="activity-time">${relativeTime(n.createdAt)}</div></div>`;
    }).join("");
  }

  function isOnline(profileId) {
    return global.WeLinkRealtime?.isOnline(presenceState, profileId) || false;
  }

  function updateConnectionBadge(status) {
    const el = document.getElementById("realtime-connection-status");
    if (!el) return;
    const labels = {
      connected: "Live",
      reconnecting: "Reconnecting…",
      error: "Connection error",
      disconnected: "Disconnected",
      idle: "Offline"
    };
    el.textContent = labels[status] || status;
    el.className = "realtime-status " + (status || "idle");
  }

  function filterRealtimeConversations(conversations) {
    const q = realtimeSearchQuery.trim().toLowerCase();
    if (!q) return conversations;
    return conversations.filter((c) => {
      const hay = [
        c.guestName,
        c.proName,
        c.guestSpecialization,
        c.proSkill
      ].join(" ").toLowerCase();
      return hay.includes(q);
    });
  }

  function patchConversationPreview(conversationId, body, createdAt) {
    const item = document.querySelector(`.realtime-list-item[data-conv-id="${conversationId}"]`);
    if (!item) return;
    const snippet = item.querySelector(".live-conv-snippet");
    const time = item.querySelector(".activity-time");
    if (snippet) snippet.textContent = body || "No messages yet";
    if (time) time.textContent = relativeTime(createdAt);
    const list = item.parentElement;
    if (list && item !== list.querySelector(".realtime-list-item")) {
      list.insertBefore(item, list.querySelector(".realtime-list-item"));
    }
  }

  function patchLiveConvWidget(conversationId, body, createdAt) {
    const btn = document.querySelector(`.live-conv-item[data-open-realtime="${conversationId}"]`);
    if (!btn) return;
    const snippet = btn.querySelector(".live-conv-snippet");
    const time = btn.querySelector(".activity-time");
    if (snippet) snippet.textContent = body || "No messages yet";
    if (time) time.textContent = relativeTime(createdAt);
    const list = document.getElementById("live-conversations");
    if (list && btn !== list.firstElementChild) {
      list.insertBefore(btn, list.firstElementChild);
    }
  }

  async function refreshMonitorableIds() {
    const list = await WeLink.getAdminMonitorableConversations();
    monitorableIds = new Set(list.map((c) => c.id));
    return list;
  }

  async function refreshCommSurfaces() {
    WeLink.flushCache();
    const db = await WeLink.load();
    renderBottomTables(db);
    renderCommunication(db);
    await patchKpis();
  }

  async function refreshStatsSurfaces() {
    WeLink.flushCache();
    await patchKpis();
    const db = await WeLink.load();
    if (currentSection === "members") renderMembers(db);
    if (currentSection === "professionals") renderProfessionals(db);
    if (currentSection === "guests") renderGuests(db);
  }

  async function refreshNotificationSurfaces() {
    WeLink.flushCache();
    const db = await WeLink.load();
    sidebarUnread = await unreadCount();
    renderSidebar(sidebarUnread);
    renderTopBar(WeLink.getAdminProfile(), sidebarUnread);
    renderNotesDropdown(db);
    if (currentSection === "notifications") renderNotifications(db);
  }

  async function onConversationEligible() {
    WeLink.flushCache();
    const db = await WeLink.load();
    await refreshMonitorableIds();
    renderLiveConversations(db);
    if (currentSection === "realtime") await renderRealtime();
  }

  function setupAdminRealtimeFeeds() {
    if (!global.WeLinkRealtime?.subscribeAdminFeeds || !session?.id) return;
    WeLinkRealtime.subscribeAdminFeeds({
      onMessageInsert(row) {
        if (!row?.conversation_id) return;
        const ts = row.created_at ? new Date(row.created_at).getTime() : Date.now();
        patchConversationPreview(row.conversation_id, row.body, ts);
        patchLiveConvWidget(row.conversation_id, row.body, ts);
      },
      onConversationUpdate(newRow, oldRow) {
        const nowActive = newRow?.status === "active";
        const wasActive = oldRow?.status === "active";
        if (nowActive && !wasActive) onConversationEligible();
        if (nowActive) patchKpis();
      },
      onCommRequest() {
        refreshCommSurfaces();
      },
      onMemberChange() {
        refreshStatsSurfaces();
      },
      onAdminNotification(row) {
        if (!row || row.owner_id !== session.id) return;
        refreshStatsSurfaces();
        const dropdown = document.getElementById("notes-dropdown");
        if (dropdown) {
          dropdown.insertAdjacentHTML("afterbegin",
            `<div class="note-item unread">${H().esc(row.message)}</div>`);
        }
        sidebarUnread += 1;
        renderSidebar(sidebarUnread);
        const bellBadge = document.getElementById("bell-count");
        if (bellBadge) {
          bellBadge.textContent = sidebarUnread > 0 ? sidebarUnread : "";
          bellBadge.style.display = sidebarUnread > 0 ? "grid" : "none";
        }
        const notesSection = document.getElementById("section-notifications");
        if (notesSection && currentSection === "notifications") {
          refreshNotificationSurfaces();
        }
      }
    });
    WeLinkRealtime.onConnectionStatusChange(updateConnectionBadge);
  }

  function renderLiveConversations(db) {
    const el = document.getElementById("live-conversations");
    if (!el) return;
    const monitorable = db.conversations.filter((c) => c.status === "active")
      .slice().sort((a, b) => b.createdAt - a.createdAt).slice(0, 5);
    if (!monitorable.length) {
      el.innerHTML = '<p class="empty-state">No active guest–professional conversations yet.</p>';
      return;
    }
    el.innerHTML = monitorable.map((c) => {
      const msgs = db.messages.filter((m) => m.conversationId === c.id).sort((a, b) => b.createdAt - a.createdAt);
      const last = msgs[0];
      const snippet = last ? last.body : "No messages yet";
      const guest = db.guests.find((g) => g.id === c.guestId);
      const pro = db.professionals.find((p) => p.id === c.proId);
      const guestOnline = isOnline(c.guestId);
      const proOnline = isOnline(c.proId);
      return `<button type="button" class="live-conv-item" data-open-realtime="${c.id}">
        <img src="${H().avatarUrl(guest || { name: c.guestName })}" alt="" />
        <div class="live-conv-meta">
          <strong>${H().esc(c.guestName)} ↔ ${H().esc(c.proName)}</strong>
          <span class="presence-dots">
            <span class="presence-dot ${guestOnline ? "online" : "offline"}" title="Guest"></span>
            <span class="presence-dot ${proOnline ? "online" : "offline"}" title="Pro"></span>
          </span>
          <div class="live-conv-snippet">${H().esc(snippet)}</div>
          <span class="status-pill badge-pill active">Monitored</span>
          <span class="activity-time">${last ? relativeTime(last.createdAt) : relativeTime(c.createdAt)}</span>
        </div></button>`;
    }).join("");
    el.querySelectorAll("[data-open-realtime]").forEach((btn) => {
      btn.addEventListener("click", () => navigate("realtime", { selectConversation: btn.dataset.openRealtime }));
    });
  }

  function renderBottomTables(db) {
    const commEl = document.getElementById("comm-requests-table");
    const waEl = document.getElementById("wa-requests-table");
    if (commEl) {
      const reqs = (db.communicationRequests || []).slice().sort((a, b) => b.createdAt - a.createdAt).slice(0, 6);
      commEl.innerHTML = reqs.length ? `<div class="admin-table-wrap"><table class="admin-table"><thead><tr>
        <th>Guest</th><th>Professional</th><th>Status</th><th>Time</th></tr></thead><tbody>
        ${reqs.map((r) => `<tr>
            <td>${H().esc(r.guestName || "?")}</td>
            <td>${H().esc(r.proName || "?")}</td>
            <td><span class="status-pill ${pillClass(r.status)}">${H().statusBadge(r.status)}</span></td>
            <td>${relativeTime(r.createdAt)}</td></tr>`).join("")}
        </tbody></table></div>` : '<p class="empty-state">No communication requests.</p>';
    }
    if (waEl) {
      const reqs = db.whatsappRequests.slice().sort((a, b) => b.createdAt - a.createdAt).slice(0, 6);
      waEl.innerHTML = reqs.length ? `<div class="admin-table-wrap"><table class="admin-table"><thead><tr>
        <th>Professional</th><th>Guest</th><th>Status</th><th>Time</th></tr></thead><tbody>
        ${reqs.map((r) => {
          const guest = db.guests.find((g) => g.id === r.guestId);
          const pro = db.professionals.find((p) => p.id === r.proId);
          return `<tr>
            <td>${H().esc(pro?.name || "?")}</td><td>${H().esc(guest?.name || "?")}</td>
            <td><span class="status-pill ${pillClass(r.status)}">${H().statusBadge(r.status)}</span></td>
            <td>${relativeTime(r.createdAt)}</td></tr>`;
        }).join("")}</tbody></table></div>` : '<p class="empty-state">No WhatsApp exchange requests.</p>';
    }
  }

  function renderProfessionals(db) {
    const el = document.getElementById("section-professionals");
    if (!el) return;
    let list = db.professionals.filter((p) => p.status === "pending");
    if (searchQuery) list = list.filter((p) => matchesSearch(p.name + " " + p.email + " " + p.skill));
    el.innerHTML = `
      <h2>Professionals</h2>
      <div class="glass-card" id="professionals-pending-table">
        <div class="glass-card-header"><h3>Pending Applications</h3></div>
        <div class="glass-card-body">${list.length ? `<div class="admin-table-wrap"><table class="admin-table"><thead><tr>
          <th>Profile</th><th>Details</th><th>Phone</th><th>Account</th><th>Submitted</th><th>Status</th><th>Actions</th></tr></thead><tbody>
          ${list.map((p) => `<tr>
            <td><div class="table-user"><img src="${H().avatarUrl(p)}" alt="" /><span>${H().esc(p.name)}</span></div></td>
            <td>${H().esc(p.skill)} · ${H().esc(p.location)}<br><span style="color:var(--color-muted);font-size:12px">${H().esc(p.email)}</span></td>
            <td>${H().esc(p.phone || "—")}</td>
            <td><span class="status-pill ${pillClass(p.accountStatus)}">${H().statusBadge(p.accountStatus)}</span></td>
            <td>${H().fmtTime(p.createdAt)}</td>
            <td><span class="status-pill badge-pill pending">Pending</span></td>
            <td class="table-actions">
              <button type="button" class="button-outline btn-sm" data-view-member="${p.id}" data-role="professional">View</button>
              <button type="button" class="button-primary btn-sm" data-act="accept" data-id="${p.id}">Approve</button>
              <button type="button" class="button-destructive btn-sm" data-act="reject" data-id="${p.id}">Reject</button>
            </td></tr>`).join("")}
          </tbody></table></div>` : '<p class="empty-state">No pending requests.</p>'}
        </div></div>`;
  }

  function renderGuests(db) {
    const el = document.getElementById("section-guests");
    if (!el) return;
    let guests = db.guests;
    if (searchQuery) guests = guests.filter((g) => matchesSearch(g.name + " " + g.email + " " + g.specialization));
    el.innerHTML = `
      <h2>Guests</h2>
      <p class="section-lede">All registered guest accounts. Use Members for full management actions.</p>
      <div class="glass-card"><div class="glass-card-body">${guests.length ? `<div class="admin-table-wrap"><table class="admin-table"><thead><tr>
        <th>Profile</th><th>Specialisation</th><th>Account</th><th>Email</th><th>Joined</th><th></th></tr></thead><tbody>
        ${guests.map((g) => `<tr>
          <td><div class="table-user"><img src="${H().avatarUrl(g)}" alt="" /><span>${H().esc(g.name)}</span></div></td>
          <td>${H().esc(g.specialization || "—")}</td>
          <td><span class="status-pill ${pillClass(g.accountStatus)}">${H().statusBadge(g.accountStatus)}</span></td>
          <td>${H().esc(g.email)}</td>
          <td>${H().fmtTime(g.createdAt)}</td>
          <td><button type="button" class="button-outline btn-sm" data-view-member="${g.id}" data-role="guest">View</button></td></tr>`).join("")}
        </tbody></table></div>` : '<p class="empty-state">No guests registered.</p>'}
      </div></div>`;
  }

  function supportAdminActions(req, conv) {
    const parts = [];
    if (req?.status === "pending") {
      parts.push(`<button type="button" class="button-primary btn-sm" data-support-approve="${req.id}">Approve</button>`);
      parts.push(`<button type="button" class="button-destructive btn-sm" data-support-reject="${req.id}">Reject</button>`);
    }
    if (conv?.status === "active") {
      parts.push(`<button type="button" class="button-outline btn-sm" data-support-open="${conv.id}">Open chat</button>`);
      parts.push(`<button type="button" class="button-outline btn-sm" data-support-suspend="${conv.id}">Suspend</button>`);
      parts.push(`<button type="button" class="button-destructive btn-sm" data-support-end="${conv.id}">End</button>`);
    } else if (conv?.status === "suspended") {
      parts.push(`<button type="button" class="button-primary btn-sm" data-support-resume="${conv.id}">Resume</button>`);
      parts.push(`<button type="button" class="button-destructive btn-sm" data-support-end="${conv.id}">End</button>`);
    }
    if (!parts.length && req?.requesterId) {
      parts.push(`<button type="button" class="button-primary btn-sm" data-admin-support-start="${req.requesterId}" data-role="${req.requesterRole}">Start chat</button>`);
    }
    return parts.join(" ");
  }

  function renderSupportMessageThread(messages) {
    if (!messages.length) {
      return '<p class="empty-state">No messages yet. Send the first message below.</p>';
    }
    return `<div class="realtime-thread" id="support-thread">${messages.map((m) => {
      const label = m.fromRole === "admin" ? "Admin" : (m.fromRole === "guest" ? "Guest" : "Professional");
      const img = m.imageUrl
        ? `<a class="realtime-msg-img" href="${H().esc(m.imageUrl)}" target="_blank" rel="noopener"><img src="${H().esc(m.imageUrl)}" alt="Shared image" loading="lazy" /></a>`
        : "";
      const body = m.body ? `<p>${H().esc(m.body)}</p>` : "";
      return `<article class="realtime-msg ${m.fromRole}">
        <div class="realtime-msg-meta">${H().esc(label)} · ${relativeTime(m.createdAt)}</div>
        ${img}${body}</article>`;
    }).join("")}</div>`;
  }

  const CHEVRON_SVG = '<svg class="comm-hub-chevron" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" aria-hidden="true"><path d="M9 18l6-6-6-6"/></svg>';

  function lastMessagePreview(db, matchFn) {
    const msgs = (db.messages || []).filter(matchFn).sort((a, b) => b.createdAt - a.createdAt);
    const m = msgs[0];
    if (!m) return "No messages yet";
    if (m.imageUrl && !m.body) return "Sent an image";
    return (m.body || "").slice(0, 72) + ((m.body || "").length > 72 ? "…" : "");
  }

  function supportStatusBucket(req, conv) {
    if (conv?.status === "active" || conv?.status === "suspended") return "active";
    if (req?.status === "pending" && !conv) return "pending";
    if (conv?.status === "closed" || req?.status === "ended") return "ended";
    if (["rejected", "cancelled"].includes(req?.status)) return "ended";
    return "pending";
  }

  function guestProStatusBucket(row) {
    const key = row.displayStatus?.key || "";
    if (key === "active" || key === "suspended") return "active";
    if (key === "pending") return "pending";
    return "ended";
  }

  function buildSupportHubEntries(db, participantRole) {
    const supportReqs = db.adminSupportRequests || [];
    const supportConvs = db.adminSupportConversations || [];
    const byParticipant = new Map();
    supportReqs.forEach((req) => {
      if (req.requesterRole !== participantRole) return;
      byParticipant.set(req.requesterId, { req, conv: null });
    });
    supportConvs.forEach((conv) => {
      if (conv.participantRole !== participantRole) return;
      const prev = byParticipant.get(conv.participantId) || { req: null, conv: null };
      byParticipant.set(conv.participantId, {
        req: prev.req || supportReqs.find((r) => r.id === conv.requestId) || null,
        conv
      });
    });
    return Array.from(byParticipant.values()).map(({ req, conv }) => {
      const memberId = req?.requesterId || conv?.participantId;
      const guest = db.guests.find((g) => g.id === memberId);
      const pro = db.professionals.find((p) => p.id === memberId);
      const entity = guest || pro || { name: req?.requesterName || conv?.participantName, photo: "" };
      const bucket = supportStatusBucket(req, conv);
      const updated = Math.max(req?.createdAt || 0, conv?.createdAt || 0, req?.respondedAt || 0);
      const preview = conv
        ? lastMessagePreview(db, (m) => m.adminSupportConversationId === conv.id)
        : (req?.status === "pending" ? "Requested communication with admin" : "—");
      return {
        id: memberId,
        bucket,
        name: entity.name || req?.requesterName || "?",
        photo: entity.photo,
        preview,
        updated,
        req,
        conv,
        roleLabel: participantRole
      };
    }).sort((a, b) => b.updated - a.updated);
  }

  function buildGuestProHubEntries(db) {
    return WeLink.buildCommunicationPermissionRows(db).map((row) => {
      const r = row.request;
      const conv = row.conversation;
      const bucket = guestProStatusBucket(row);
      const updated = Math.max(r.createdAt, conv?.createdAt || 0, r.respondedAt || 0);
      const preview = conv
        ? lastMessagePreview(db, (m) => m.conversationId === conv.id)
        : (r.status === "pending" ? "Guest requested communication" : "—");
      const lastMsg = conv
        ? (db.messages || []).filter((m) => m.conversationId === conv.id).sort((a, b) => b.createdAt - a.createdAt)[0]
        : null;
      const badgeRole = lastMsg?.fromRole === "professional" ? "Professional" : "Guest";
      return {
        id: r.guestId + ":" + r.proId,
        bucket,
        name: r.guestName || "?",
        sub: r.proName || "?",
        guestPhoto: r.guestPhoto,
        preview,
        updated,
        row,
        badgeRole: conv ? badgeRole : "Guest"
      };
    }).sort((a, b) => b.updated - a.updated);
  }

  function countBuckets(items) {
    return {
      active: items.filter((i) => i.bucket === "active").length,
      pending: items.filter((i) => i.bucket === "pending").length,
      ended: items.filter((i) => i.bucket === "ended").length,
      all: items.length
    };
  }

  function filterHubItems(items, tab) {
    if (tab === "all") return items;
    return items.filter((i) => i.bucket === tab);
  }

  function statusLabel(bucket) {
    if (bucket === "active") return "Active";
    if (bucket === "pending") return "Pending";
    return "Ended";
  }

  function renderCommHubItem(item, opts) {
    const statusCls = item.bucket === "active" ? "active" : item.bucket === "pending" ? "pending" : "ended";
    const time = relativeTime(item.updated);
    const avatar = H().avatarUrl({ photo: item.photo || item.guestPhoto, name: item.name });
    const roleBadge = item.roleLabel
      ? `<span class="comm-hub-role-badge">${H().esc(item.roleLabel)}</span>`
      : `<span class="comm-hub-role-badge">${H().esc(item.badgeRole || "Guest")}</span>`;
    const sub = item.sub ? `<span class="comm-hub-subname">with ${H().esc(item.sub)}</span>` : "";
    const selected = selectedCommHubDetail === opts.detailKey ? " is-selected" : "";
    return `<button type="button" class="comm-hub-item${selected}" ${opts.dataAttrs}>
      <img class="comm-hub-avatar" src="${avatar}" alt="" />
      <div class="comm-hub-item-main">
        <div class="comm-hub-item-row1">
          <span class="comm-hub-name">${H().esc(item.name)}</span>
          ${roleBadge}
          <span class="comm-hub-time">${H().esc(time)}</span>
          ${sub}
        </div>
        <div class="comm-hub-item-row2">
          <span class="comm-hub-preview">${H().esc(item.preview)}</span>
          <span class="comm-hub-status comm-hub-status--${statusCls}">${statusLabel(item.bucket)}</span>
          ${CHEVRON_SVG}
        </div>
      </div>
    </button>`;
  }

  function renderCommHubColumn(config) {
    const { columnKey, themeClass, icon, title, subtitle, items, tab } = config;
    const counts = countBuckets(items);
    const filtered = filterHubItems(items, tab);
    const listHtml = filtered.length
      ? filtered.map((item) => config.renderItem(item)).join("")
      : '<p class="comm-hub-empty">No conversations in this filter.</p>';
    const tabs = ["active", "pending", "ended"].map((t) => {
      const active = tab === t ? " is-active" : "";
      const n = counts[t];
      return `<button type="button" class="comm-hub-tab${active}" data-comm-hub-tab="${columnKey}:${t}">
        ${t.charAt(0).toUpperCase() + t.slice(1)} <span class="comm-hub-tab-count">(${n})</span>
      </button>`;
    }).join("");
    return `<article class="comm-hub-column ${themeClass}">
      <header class="comm-hub-col-header">
        <div class="comm-hub-col-title-row">
          <div class="comm-hub-col-title-block">
            <div class="comm-hub-col-icon" aria-hidden="true">${icon}</div>
            <div>
              <h3>${H().esc(title)}</h3>
              <p>${H().esc(subtitle)}</p>
            </div>
          </div>
          <div class="comm-hub-total"><strong>${counts.all}</strong><span>Total Chats</span></div>
        </div>
      </header>
      <div class="comm-hub-tabs" role="tablist">${tabs}</div>
      <div class="comm-hub-list">${listHtml}</div>
      <footer class="comm-hub-footer">
        <button type="button" class="comm-hub-view-all" data-comm-hub-view-all="${columnKey}">
          <span aria-hidden="true">👤</span> View All ${H().esc(title)} Chats
        </button>
      </footer>
    </article>`;
  }

  function renderCommHubDetail(db) {
    if (!selectedCommHubDetail) return "";
    if (selectedCommHubDetail.startsWith("support:")) {
      const memberId = selectedCommHubDetail.slice(8);
      const entries = [
        ...buildSupportHubEntries(db, "guest"),
        ...buildSupportHubEntries(db, "professional")
      ];
      const item = entries.find((e) => e.id === memberId);
      if (!item) return "";
      return `<div class="comm-hub-detail">
        <div class="comm-hub-detail-head">
          <h3>${H().esc(item.name)} · Admin support</h3>
          <button type="button" class="button-ghost btn-sm" data-comm-hub-detail-close>Close</button>
        </div>
        <div class="comm-hub-detail-body">
          <p class="muted" style="margin:0 0 12px;font-size:13px">Status: ${H().esc(statusLabel(item.bucket))}</p>
          <div class="comm-hub-detail-actions">${supportAdminActions(item.req, item.conv)}</div>
        </div>
      </div>`;
    }
    if (selectedCommHubDetail.startsWith("guestpro:")) {
      const id = selectedCommHubDetail.slice(9);
      const item = buildGuestProHubEntries(db).find((e) => e.id === id);
      if (!item) return "";
      return `<div class="comm-hub-detail">
        <div class="comm-hub-detail-head">
          <h3>${H().esc(item.name)} ↔ ${H().esc(item.sub)}</h3>
          <button type="button" class="button-ghost btn-sm" data-comm-hub-detail-close>Close</button>
        </div>
        <div class="comm-hub-detail-body">
          <p class="muted" style="margin:0 0 12px;font-size:13px">${H().esc(item.preview)}</p>
          <div class="comm-hub-detail-actions">${communicationAdminActions(item.row)}</div>
        </div>
      </div>`;
    }
    return "";
  }

  function bindCommunicationHub(el) {
    const refresh = () => WeLink.load().then((fresh) => renderCommunication(fresh));
    el.querySelectorAll("[data-comm-hub-tab]").forEach((btn) => {
      btn.addEventListener("click", () => {
        const [col, tab] = btn.dataset.commHubTab.split(":");
        if (commHubTabs[col] !== undefined) commHubTabs[col] = tab;
        refresh();
      });
    });
    el.querySelectorAll("[data-comm-hub-view-all]").forEach((btn) => {
      btn.addEventListener("click", () => {
        const col = btn.dataset.commHubViewAll;
        if (commHubTabs[col] !== undefined) commHubTabs[col] = "all";
        refresh();
      });
    });
    el.querySelectorAll("[data-comm-hub-support]").forEach((btn) => {
      btn.addEventListener("click", () => {
        selectedCommHubDetail = "support:" + btn.dataset.commHubSupport;
        if (btn.dataset.supportOpen) {
          selectedSupportConversationId = btn.dataset.supportOpen;
        }
        refresh();
      });
    });
    el.querySelectorAll("[data-comm-hub-guestpro]").forEach((btn) => {
      btn.addEventListener("click", () => {
        selectedCommHubDetail = "guestpro:" + btn.dataset.commHubGuestpro;
        refresh();
      });
    });
    el.querySelector("[data-comm-hub-detail-close]")?.addEventListener("click", () => {
      selectedCommHubDetail = null;
      refresh();
    });
  }

  async function selectAdminSupportConversation(conversationId) {
    selectedSupportConversationId = conversationId;
    supportLiveMessages = await WeLink.getAdminSupportMessages(conversationId);
    if (global.WeLinkRealtime) {
      await WeLinkRealtime.subscribeAdminSupportMessages(conversationId, (row) => {
        if (!row?.id || supportLiveMessages.some((m) => m.id === row.id)) return;
        supportLiveMessages.push({
          id: row.id,
          fromId: row.from_id,
          fromRole: row.from_role,
          body: row.body,
          imageUrl: row.image_url || "",
          createdAt: new Date(row.created_at).getTime()
        });
        const thread = document.getElementById("support-thread");
        if (thread) {
          const label = row.from_role === "admin" ? "Admin" : row.from_role;
          const img = row.image_url
            ? `<a class="realtime-msg-img" href="${H().esc(row.image_url)}" target="_blank" rel="noopener"><img src="${H().esc(row.image_url)}" alt="Shared image" loading="lazy" /></a>`
            : "";
          const body = row.body ? `<p>${H().esc(row.body)}</p>` : "";
          thread.insertAdjacentHTML("beforeend", `<article class="realtime-msg ${row.from_role}">
            <div class="realtime-msg-meta">${H().esc(label)} · just now</div>
            ${img}${body}</article>`);
          thread.scrollTop = thread.scrollHeight;
        }
      });
    }
    const wrap = document.getElementById("support-thread-wrap");
    if (wrap) {
      wrap.innerHTML = renderSupportMessageThread(supportLiveMessages);
      const thread = document.getElementById("support-thread");
      if (thread) thread.scrollTop = thread.scrollHeight;
    }
  }

  function renderCommunication(db) {
    const el = document.getElementById("section-communication");
    if (!el) return;

    const adminGuestItems = buildSupportHubEntries(db, "guest");
    const adminProItems = buildSupportHubEntries(db, "professional");
    const guestProItems = buildGuestProHubEntries(db);

    const colGuest = renderCommHubColumn({
      columnKey: "adminGuest",
      themeClass: "comm-hub-column--blue",
      icon: "👤",
      title: "Admin → Guest",
      subtitle: "Support chats between admin and guest members",
      items: adminGuestItems,
      tab: commHubTabs.adminGuest,
      renderItem: (item) => renderCommHubItem(item, {
        detailKey: "support:" + item.id,
        dataAttrs: `data-comm-hub-support="${item.id}"${item.conv?.status === "active" ? ` data-support-open="${item.conv.id}"` : ""}`
      })
    });

    const colPro = renderCommHubColumn({
      columnKey: "adminPro",
      themeClass: "comm-hub-column--purple",
      icon: "💼",
      title: "Admin → Professional",
      subtitle: "Support chats between admin and professionals",
      items: adminProItems,
      tab: commHubTabs.adminPro,
      renderItem: (item) => renderCommHubItem(item, {
        detailKey: "support:" + item.id,
        dataAttrs: `data-comm-hub-support="${item.id}"${item.conv?.status === "active" ? ` data-support-open="${item.conv.id}"` : ""}`
      })
    });

    const colGuestPro = renderCommHubColumn({
      columnKey: "guestPro",
      themeClass: "comm-hub-column--teal",
      icon: "👥",
      title: "Guest → Professional",
      subtitle: "Private chats approved by admin",
      items: guestProItems,
      tab: commHubTabs.guestPro,
      renderItem: (item) => renderCommHubItem(item, {
        detailKey: "guestpro:" + item.id,
        dataAttrs: `data-comm-hub-guestpro="${item.id}"`
      })
    });

    const supportChatPanel = selectedSupportConversationId ? `
      <div class="comm-hub-chat-panel glass-card"><div class="glass-card-header"><h3>Admin support chat</h3>
        <button type="button" class="button-ghost btn-sm" data-support-close-chat>Close</button></div>
        <div class="glass-card-body">
          <div id="support-thread-wrap">${renderSupportMessageThread(supportLiveMessages)}</div>
          <form class="chat-form-inline" id="support-admin-send" style="margin-top:12px">
            <input name="text" type="text" placeholder="Message member…" aria-label="Message" autocomplete="off" style="flex:1" />
            <button type="submit" class="button-primary btn-sm">Send</button>
          </form>
        </div></div>` : "";

    el.innerHTML = `<div class="comm-hub-page">
      <header class="comm-hub-head">
        <div class="comm-hub-head-icon" aria-hidden="true">
          <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"/></svg>
        </div>
        <div>
          <h2>Communication</h2>
          <p>Manage guest–professional chat, or handle admin support. Admins can start member chats anytime without a request.</p>
        </div>
      </header>
      <div class="comm-hub-grid">${colGuest}${colPro}${colGuestPro}</div>
      ${renderCommHubDetail(db)}
      ${supportChatPanel}
    </div>`;

    bindCommunicationHub(el);

    if (selectedSupportConversationId) {
      selectAdminSupportConversation(selectedSupportConversationId);
      document.getElementById("support-admin-send")?.addEventListener("submit", async (e) => {
        e.preventDefault();
        const input = e.target.querySelector('input[name="text"]');
        const text = input?.value || "";
        const res = await WeLink.sendAdminSupportMessage(selectedSupportConversationId, text);
        if (!res.ok) return alert(res.error);
        if (input) input.value = "";
        await selectAdminSupportConversation(selectedSupportConversationId);
      });
      el.querySelector("[data-support-close-chat]")?.addEventListener("click", () => {
        selectedSupportConversationId = null;
        supportLiveMessages = [];
        WeLinkRealtime?.unsubscribeAdminSupportMessages();
        renderCommunication(db);
      });
    }
  }

  function renderWhatsApp(db) {
    const el = document.getElementById("section-whatsapp");
    if (!el) return;
    const reqs = db.whatsappRequests.slice().sort((a, b) => b.createdAt - a.createdAt);
    el.innerHTML = `
      <h2>WhatsApp Management</h2>
      <div class="glass-card"><div class="glass-card-body">${reqs.length ? reqs.map((r) => {
        const guest = db.guests.find((g) => g.id === r.guestId);
        const pro = db.professionals.find((p) => p.id === r.proId);
        return `<div class="wa-card">
          <div class="wa-card-header">
            <strong>${H().esc(guest?.name || "?")}</strong> → <strong>${H().esc(pro?.name || "?")}</strong>
            <span class="status-pill ${pillClass(r.status)}">${H().statusBadge(r.status)}</span>
          </div>
          <p style="color:var(--color-muted);font-size:12px;margin:0 0 10px">${H().fmtTime(r.createdAt)}</p>
          ${r.status === "pending" ? `<div class="table-actions">
            <button type="button" class="button-primary" data-wa-approve="${r.id}">Approve</button>
            <button type="button" class="button-destructive" data-wa-reject="${r.id}">Reject</button>
          </div>` : ""}
        </div>`;
      }).join("") : '<p class="empty-state">No WhatsApp requests.</p>'}
      </div></div>`;
  }

  function allMembers(db) {
    return [
      ...db.professionals.map((p) => ({ ...p, role: "professional" })),
      ...db.guests.map((g) => ({ ...g, role: "guest" }))
    ].sort((a, b) => b.createdAt - a.createdAt);
  }

  function filterMembers(list) {
    let filtered = list;
    if (memberFilterRole !== "all") {
      filtered = filtered.filter((m) => m.role === memberFilterRole);
    }
    if (memberFilterStatus !== "all") {
      if (memberFilterStatus === "active") {
        filtered = filtered.filter((m) => m.accountStatus === "active");
      } else if (["suspended", "deactivated"].includes(memberFilterStatus)) {
        filtered = filtered.filter((m) =>
          m.accountStatus === memberFilterStatus
          || (m.role === "professional" && m.status === memberFilterStatus)
        );
      } else {
        filtered = filtered.filter((m) => m.role === "professional" && m.status === memberFilterStatus);
      }
    }
    if (searchQuery) {
      filtered = filtered.filter((m) => matchesSearch(
        [m.name, m.email, m.skill, m.specialization, m.location, m.town].filter(Boolean).join(" ")
      ));
    }
    return filtered;
  }

  function memberStatusHtml(m) {
    const pills = [`<span class="status-pill ${pillClass(m.accountStatus)}">${H().statusBadge(m.accountStatus)}</span>`];
    if (m.role === "professional") {
      pills.push(`<span class="status-pill ${pillClass(m.status)}">${H().statusBadge(m.status)}</span>`);
    }
    return `<div class="status-pill-group">${pills.join("")}</div>`;
  }

  function memberActionsHtml(m) {
    const actions = [
      `<button type="button" class="button-primary btn-sm" data-admin-support-start="${m.id}" data-role="${m.role}">Message member</button>`,
      `<button type="button" class="button-outline btn-sm" data-view-member="${m.id}" data-role="${m.role}">View</button>`
    ];
    if (m.role === "professional") {
      if (m.status === "pending") {
        actions.push(`<button type="button" class="button-primary btn-sm" data-act="accept" data-id="${m.id}">Approve</button>`);
        actions.push(`<button type="button" class="button-destructive btn-sm" data-act="reject" data-id="${m.id}">Reject</button>`);
      }
      if (["approved", "pending"].includes(m.status) && m.accountStatus === "active") {
        actions.push(`<button type="button" class="button-outline btn-sm" data-suspend="${m.id}" data-role="${m.role}">Suspend</button>`);
        actions.push(`<button type="button" class="button-outline btn-sm" data-deactivate="${m.id}" data-role="${m.role}">Deactivate</button>`);
      }
    } else if (m.accountStatus === "active") {
      actions.push(`<button type="button" class="button-outline btn-sm" data-suspend="${m.id}" data-role="guest">Suspend</button>`);
      actions.push(`<button type="button" class="button-outline btn-sm" data-deactivate="${m.id}" data-role="guest">Deactivate</button>`);
    }
    if (m.accountStatus !== "active" || (m.role === "professional" && ["suspended", "deactivated", "rejected"].includes(m.status))) {
      actions.push(`<button type="button" class="button-primary btn-sm" data-reactivate="${m.id}" data-role="${m.role}">Reactivate</button>`);
    }
    actions.push(`<button type="button" class="button-destructive btn-sm" data-del="${m.role}" data-id="${m.id}">Delete</button>`);
    return actions.join("");
  }

  function memberDetailHtml(m) {
    const rows = [
      ["Name", m.name],
      ["Email", m.email],
      ["Phone", m.phone || "—"],
      ["Role", m.role === "professional" ? "Professional" : "Guest"],
      ["Account status", H().statusBadge(m.accountStatus)],
      ["Joined", H().fmtTime(m.createdAt)]
    ];
    if (m.role === "professional") {
      rows.push(["Application status", H().statusBadge(m.status)]);
      rows.push(["Skill", m.skill || "—"]);
      rows.push(["Location", m.location || "—"]);
      rows.push(["Bio", m.bio || "—"]);
      rows.push(["Achievements", m.achievements || "—"]);
      if (m.approvedAt) rows.push(["Approved", H().fmtTime(m.approvedAt)]);
      if (m.rejectionReason) rows.push(["Rejection reason", m.rejectionReason]);
    } else {
      rows.push(["Age", m.age ?? "—"]);
      rows.push(["Town / Area", [m.town, m.area].filter(Boolean).join(", ") || "—"]);
      rows.push(["Specialisation", m.specialization || "—"]);
      rows.push(["Skills", m.skills || "—"]);
    }
    return rows.map(([label, val]) => `
      <div class="member-detail-row">
        <span class="member-detail-label">${H().esc(label)}</span>
        <span class="member-detail-value">${typeof val === "string" && val.includes("<") ? val : H().esc(String(val))}</span>
      </div>`).join("");
  }

  function openMemberModal(id, role, db) {
    selectedMemberId = id;
    selectedMemberRole = role;
    const m = role === "professional"
      ? db.professionals.find((p) => p.id === id)
      : db.guests.find((g) => g.id === id);
    if (!m) return;
    const modal = document.getElementById("member-modal");
    const body = document.getElementById("member-modal-body");
    const title = document.getElementById("member-modal-title");
    if (title) title.textContent = m.name;
    if (body) {
      body.innerHTML = `
        <div class="member-modal-header">
          <img src="${H().avatarUrl(m)}" alt="" class="member-modal-avatar" />
          <div>${memberStatusHtml({ ...m, role })}</div>
        </div>
        <div class="member-detail-grid">${memberDetailHtml({ ...m, role })}</div>
        <div class="member-modal-actions table-actions">${memberActionsHtml({ ...m, role })}</div>`;
    }
    modal?.removeAttribute("hidden");
    modal?.classList.add("open");
  }

  function closeMemberModal() {
    selectedMemberId = null;
    selectedMemberRole = null;
    const modal = document.getElementById("member-modal");
    modal?.classList.remove("open");
    modal?.setAttribute("hidden", "");
  }

  function renderMembers(db) {
    const el = document.getElementById("section-members");
    if (!el) return;
    const members = filterMembers(allMembers(db));
    el.innerHTML = `
      <h2>Member Management</h2>
      <p class="section-lede">View, search, filter, and manage all registered members.</p>
      <div class="member-filters glass-card">
        <div class="glass-card-body member-filters-inner">
          <div class="filter-group">
            <span class="filter-label">Role</span>
            <div class="filter-tabs" id="member-role-tabs">
              ${["all", "professional", "guest"].map((r) => `
                <button type="button" class="filter-tab${memberFilterRole === r ? " active" : ""}" data-member-role="${r}">
                  ${r === "all" ? "All" : r === "professional" ? "Professionals" : "Guests"}
                </button>`).join("")}
            </div>
          </div>
          <div class="filter-group">
            <label class="filter-label" for="member-status-filter">Status</label>
            <select id="member-status-filter" class="text-input filter-select">
              <option value="all"${memberFilterStatus === "all" ? " selected" : ""}>All statuses</option>
              <option value="active"${memberFilterStatus === "active" ? " selected" : ""}>Active accounts</option>
              <option value="pending"${memberFilterStatus === "pending" ? " selected" : ""}>Pending applications</option>
              <option value="approved"${memberFilterStatus === "approved" ? " selected" : ""}>Approved professionals</option>
              <option value="rejected"${memberFilterStatus === "rejected" ? " selected" : ""}>Rejected applications</option>
              <option value="suspended"${memberFilterStatus === "suspended" ? " selected" : ""}>Suspended</option>
              <option value="deactivated"${memberFilterStatus === "deactivated" ? " selected" : ""}>Deactivated</option>
            </select>
          </div>
          <div class="filter-count muted">${members.length} member${members.length === 1 ? "" : "s"}</div>
        </div>
      </div>
      <div class="glass-card"><div class="glass-card-body">
        ${members.length ? `<div class="admin-table-wrap"><table class="admin-table member-table"><thead><tr>
          <th>Member</th><th>Role</th><th>Details</th><th>Account / Status</th><th>Joined</th><th>Actions</th>
        </tr></thead><tbody>
        ${members.map((m) => `<tr>
          <td><div class="table-user"><img src="${H().avatarUrl(m)}" alt="" /><div>
            <span>${H().esc(m.name)}</span><br>
            <span style="color:var(--color-muted);font-size:12px">${H().esc(m.email)}</span>
          </div></div></td>
          <td><span class="role-badge ${m.role}">${m.role === "professional" ? "Professional" : "Guest"}</span></td>
          <td style="font-size:13px;color:var(--color-muted)">${H().esc(m.role === "professional" ? (m.skill + " · " + m.location) : (m.specialization || "—"))}</td>
          <td>${memberStatusHtml(m)}</td>
          <td>${H().fmtTime(m.createdAt)}</td>
          <td class="table-actions">${memberActionsHtml(m)}</td>
        </tr>`).join("")}
        </tbody></table></div>` : '<p class="empty-state">No members match your filters.</p>'}
      </div></div>`;

    el.querySelector("#member-role-tabs")?.addEventListener("click", (e) => {
      const btn = e.target.closest("[data-member-role]");
      if (!btn) return;
      memberFilterRole = btn.dataset.memberRole;
      renderMembers(db);
    });
    el.querySelector("#member-status-filter")?.addEventListener("change", (e) => {
      memberFilterStatus = e.target.value;
      renderMembers(db);
    });
  }

  function renderNotifications(db) {
    const el = document.getElementById("section-notifications");
    if (!el) return;
    const notes = session?.id
      ? db.notifications.filter((n) => n.ownerId === session.id).slice(0, 50)
      : db.notifications.slice(0, 50);
    el.innerHTML = `
      <h2>Notifications</h2>
      <div class="glass-card"><div class="glass-card-header">
        <h3>All notifications</h3>
        <button type="button" class="button-outline" id="mark-all-read">Mark all read</button>
      </div><div class="glass-card-body">${notes.length ? notes.map((n) => `
        <div class="note-item${n.read ? "" : " unread"}">
          <div>${H().esc(n.message)}</div>
          <div class="activity-time">${relativeTime(n.createdAt)}</div>
        </div>`).join("") : '<p class="empty-state">No notifications.</p>'}
      </div></div>`;
    document.getElementById("mark-all-read")?.addEventListener("click", async () => {
      if (session?.id) await WeLink.markRead(session.id);
      renderAll();
    });
  }

  function renderSettings(ap) {
    const el = document.getElementById("section-settings");
    if (!el) return;
    el.innerHTML = `
      <h2>Settings</h2>
      <div class="glass-card settings-card"><div class="glass-card-body">
        <div class="table-user" style="margin-bottom:20px">
          <img src="${H().avatarUrl(ap)}" alt="" style="width:48px;height:48px;border-radius:50%" />
          <div><strong>${H().esc(ap.name)}</strong><br><span style="color:var(--color-muted);font-size:13px">${H().esc(session?.email || "")} · Super Administrator</span></div>
        </div>
        <h3 style="font-size:14px;margin:0 0 8px">Danger zone</h3>
        <p style="color:var(--color-muted);font-size:13px;margin:0 0 12px">Remove all data for a user by email address.</p>
        <div class="purge-form">
          <input type="email" class="text-input" id="purge-email" placeholder="user@example.com" />
          <button type="button" class="button-destructive" id="purge-email-btn">Delete account data</button>
        </div>
      </div></div>`;
    document.getElementById("purge-email-btn")?.addEventListener("click", async () => {
      const email = document.getElementById("purge-email").value.trim();
      if (!email) return alert("Enter an email address.");
      if (!confirm("Permanently delete all data for " + email + "?")) return;
      const res = await WeLink.purgeAccountByEmail(email);
      alert(res.removed ? "Account data removed." : "No account found for that email.");
      renderAll();
    });
  }

  function renderMessageThread(messages, db) {
    if (!messages.length) {
      return '<p class="empty-state">No messages in this conversation yet.</p>';
    }
    return `<div class="realtime-thread">${messages.map((m) => {
      const from = m.fromRole === "guest"
        ? db.guests.find((g) => g.id === m.fromId)?.name
        : db.professionals.find((p) => p.id === m.fromId)?.name;
      const img = m.imageUrl
        ? `<a class="realtime-msg-img" href="${H().esc(m.imageUrl)}" target="_blank" rel="noopener"><img src="${H().esc(m.imageUrl)}" alt="Shared image" loading="lazy" /></a>`
        : "";
      const body = m.body ? `<p>${H().esc(m.body)}</p>` : "";
      return `<article class="realtime-msg ${m.fromRole}">
        <div class="realtime-msg-meta">${H().esc(from || m.fromRole)} · ${relativeTime(m.createdAt)}</div>
        ${img}${body}</article>`;
    }).join("")}</div>`;
  }

  async function selectRealtimeConversation(conversationId, db) {
    selectedConversationId = conversationId;
    liveMessages = await WeLink.getConversationMessages(conversationId);
    if (global.WeLinkRealtime) {
      await WeLinkRealtime.subscribeMessages(conversationId, (row) => {
        if (!row?.id || liveMessages.some((m) => m.id === row.id)) return;
        liveMessages.push({
          id: row.id,
          conversationId: row.conversation_id,
          fromId: row.from_id,
          fromRole: row.from_role,
          toId: row.to_id,
          toRole: row.to_role,
          body: row.body,
          imageUrl: row.image_url || "",
          createdAt: new Date(row.created_at).getTime()
        });
        const thread = document.getElementById("realtime-thread");
        if (thread) {
          const img = row.image_url
            ? `<a class="realtime-msg-img" href="${H().esc(row.image_url)}" target="_blank" rel="noopener"><img src="${H().esc(row.image_url)}" alt="Shared image" loading="lazy" /></a>`
            : "";
          const body = row.body ? `<p>${H().esc(row.body)}</p>` : "";
          thread.insertAdjacentHTML("beforeend", `<article class="realtime-msg ${row.from_role}">
            <div class="realtime-msg-meta">${H().esc(row.from_role)} · just now</div>
            ${img}${body}</article>`);
          thread.scrollTop = thread.scrollHeight;
        }
      });
    }
    const wrap = document.getElementById("realtime-thread-wrap");
    if (wrap) {
      wrap.innerHTML = renderMessageThread(liveMessages, db);
      const thread = document.getElementById("realtime-thread");
      if (thread) thread.scrollTop = thread.scrollHeight;
    }
    document.querySelectorAll("[data-conv-id]").forEach((btn) => {
      btn.classList.toggle("active", btn.dataset.convId === conversationId);
    });
  }

  async function renderRealtime() {
    const el = document.getElementById("section-realtime");
    if (!el) return;
    const conversations = await refreshMonitorableIds();
    const filtered = filterRealtimeConversations(conversations);
    const db = await WeLink.load();
    if (!selectedConversationId && filtered.length) {
      selectedConversationId = filtered[0].id;
    }
    if (selectedConversationId && !filtered.some((c) => c.id === selectedConversationId)) {
      selectedConversationId = filtered[0]?.id || null;
    }
    const selected = filtered.find((c) => c.id === selectedConversationId);
    el.innerHTML = `
      <h2>Real-Time Conversations <span id="realtime-connection-status" class="realtime-status idle">…</span></h2>
      <div class="realtime-chat-room split">
        <aside class="realtime-list">
          <h3>Active conversations</h3>
          <input type="search" class="text-input" id="realtime-search" placeholder="Search guest, pro, specialization…" value="${H().esc(realtimeSearchQuery)}" style="margin-bottom:12px;width:100%" />
          ${filtered.length ? filtered.map((c) => `
            <button type="button" class="realtime-list-item${c.id === selectedConversationId ? " active" : ""}" data-conv-id="${c.id}">
              <img src="${H().avatarUrl({ photo: c.guestPhoto, name: c.guestName })}" alt="" />
              <div>
                <strong>${H().esc(c.guestName)} ↔ ${H().esc(c.proName)}</strong>
                <span class="presence-dots">
                  <span class="presence-dot ${isOnline(c.guestId) ? "online" : "offline"}"></span>
                  <span class="presence-dot ${isOnline(c.proId) ? "online" : "offline"}"></span>
                </span>
                <div class="live-conv-snippet">${H().esc(c.lastMessage || "No messages yet")}</div>
                <span class="status-pill ${pillClass(c.status || "active")}" style="margin-top:4px">${H().statusBadge(c.status || "active")}</span>
                <span class="activity-time">${relativeTime(c.lastMessageAt)}</span>
                ${c.whatsappStatus !== "none" ? `<span class="status-pill badge-pill pending">WA: ${H().esc(c.whatsappStatus)}</span>` : ""}
              </div>
            </button>`).join("") : (conversations.length
            ? '<p class="empty-state">No conversations match your search.</p>'
            : '<p class="empty-state">No active conversations to monitor right now.</p>')}
        </aside>
        <div class="realtime-viewer" id="realtime-viewer">
          ${selected ? `<header class="realtime-viewer-header">
            <div><strong>${H().esc(selected.guestName)}</strong> · ${H().esc(selected.guestSpecialization || "Guest")}
            ↔ <strong>${H().esc(selected.proName)}</strong> · ${H().esc(selected.proSkill || "Pro")}
            <span class="status-pill ${pillClass(selected.status || "active")}" style="margin-left:8px">${H().statusBadge(selected.status || "active")}</span></div>
            <div class="table-actions">${selected.status === "suspended"
              ? `<button type="button" class="button-primary btn-sm" data-conv-resume="${selected.id}">Resume Communication</button>`
              : selected.status === "active"
                ? `<button type="button" class="button-outline btn-sm" data-conv-suspend="${selected.id}">Suspend Communication</button>`
                : ""}
              ${selected.status === "active" || selected.status === "suspended"
                ? `<button type="button" class="button-destructive btn-sm" data-conv-end="${selected.id}">End Communication</button>`
                : ""}
            </div>
          </header><div id="realtime-thread-wrap">Loading…</div>` : '<p class="empty-state">Select a conversation from the list.</p>'}
        </div>
      </div>`;

    el.querySelector("#realtime-search")?.addEventListener("input", (e) => {
      realtimeSearchQuery = e.target.value;
      renderRealtime();
    });

    el.querySelectorAll("[data-conv-id]").forEach((btn) => {
      btn.addEventListener("click", async () => {
        if (global.WeLinkRealtime) WeLinkRealtime.unsubscribeMessages();
        await selectRealtimeConversation(btn.dataset.convId, db);
      });
    });

    if (selectedConversationId && selected) {
      await selectRealtimeConversation(selectedConversationId, db);
    }

    updateConnectionBadge(global.WeLinkRealtime?.getConnectionStatus?.() || "idle");
  }

  function renderNotesDropdown(db) {
    const el = document.getElementById("notes-dropdown");
    if (!el || !session?.id) return;
    const notes = db.notifications.filter((n) => n.ownerId === session.id).slice(0, 12);
    el.innerHTML = notes.length
      ? notes.map((n) => `<div class="note-item${n.read ? "" : " unread"}">${H().esc(n.message)}</div>`).join("")
      : '<div class="note-item" style="color:var(--color-muted)">No notifications yet.</div>';
  }

  function renderEvents(db) {
    const el = document.getElementById("section-events");
    if (!el) return;
    const events = (db.events || []).slice().sort((a, b) => a.eventAt - b.eventAt);
    el.innerHTML = `<header class="section-header"><h2>Events</h2><p class="muted">Pause or cancel events scheduled by professionals.</p></header>
      ${WeLinkEventsUI.adminEventsTable(events)}`;
    WeLinkEventsUI.tickCountdowns(el);
    el.querySelectorAll("[data-admin-event-pause]").forEach((btn) => {
      btn.addEventListener("click", async () => {
        const id = btn.getAttribute("data-admin-event-pause");
        const ev = events.find((x) => x.id === id);
        const next = ev?.status === "paused" ? "scheduled" : "paused";
        const res = await WeLink.setEventStatus(null, id, next, { admin: true });
        if (!res.ok) alert(res.error);
        else renderAll();
      });
    });
    el.querySelectorAll("[data-admin-event-cancel]").forEach((btn) => {
      btn.addEventListener("click", async () => {
        if (!confirm("Cancel this event for all users?")) return;
        const id = btn.getAttribute("data-admin-event-cancel");
        const res = await WeLink.setEventStatus(null, id, "cancelled", { admin: true });
        if (!res.ok) alert(res.error);
        else renderAll();
      });
    });
  }

  async function renderAll() {
    const db = await WeLink.load();
    const st = await WeLink.getAdminStats();
    const ap = WeLink.getAdminProfile();
    sidebarUnread = await unreadCount();

    renderSidebar(sidebarUnread);
    renderTopBar(ap, sidebarUnread);
    renderNotesDropdown(db);
    await renderKpis(st, db);
    renderCharts(st, db);
    renderApplications(db);
    renderActivities(db);
    renderLiveConversations(db);
    renderBottomTables(db);
    renderProfessionals(db);
    renderGuests(db);
    renderCommunication(db);
    renderWhatsApp(db);
    renderMembers(db);
    renderEvents(db);
    renderNotifications(db);
    renderSettings(ap);
    if (currentSection === "realtime") {
      await renderRealtime();
    }
  }

  function bindEvents() {
    document.getElementById("sidebar-nav")?.addEventListener("click", (e) => {
      const btn = e.target.closest("[data-section]");
      if (!btn) return;
      navigate(btn.dataset.section);
    });

    document.querySelectorAll("[data-quick]").forEach((btn) => {
      btn.addEventListener("click", () => {
        const target = btn.dataset.quick;
        if (target === "approve-pro") navigate("professionals", { scrollPending: true });
        else if (target === "pending") navigate("professionals");
        else if (target === "members") navigate("members");
        else if (target === "realtime") navigate("realtime");
      });
    });

    document.getElementById("admin-search")?.addEventListener("input", (e) => {
      searchQuery = e.target.value.trim();
      if (["professionals", "members", "guests"].includes(currentSection)) {
        WeLink.load().then((db) => {
          if (currentSection === "members") renderMembers(db);
          else renderAll();
        });
      }
    });

    document.getElementById("menu-toggle")?.addEventListener("click", () => {
      document.querySelector(".admin-sidebar")?.classList.toggle("open");
      document.querySelector(".sidebar-backdrop")?.classList.toggle("open");
    });

    document.querySelector(".sidebar-backdrop")?.addEventListener("click", closeSidebar);

    document.getElementById("reject-modal-cancel")?.addEventListener("click", closeRejectModal);
    document.getElementById("reject-modal-confirm")?.addEventListener("click", async () => {
      if (!pendingRejectId) return;
      const reason = document.getElementById("reject-reason-input")?.value || "";
      await WeLink.adminReject(pendingRejectId, reason);
      closeRejectModal();
      renderAll();
    });
    document.getElementById("reject-modal")?.addEventListener("click", (e) => {
      if (e.target.id === "reject-modal") closeRejectModal();
    });

    document.getElementById("member-modal-cancel")?.addEventListener("click", closeMemberModal);
    document.getElementById("member-modal")?.addEventListener("click", (e) => {
      if (e.target.id === "member-modal") closeMemberModal();
    });

    document.getElementById("topbar-logout")?.addEventListener("click", async () => {
      if (global.WeLinkRealtime) await WeLinkRealtime.disposeAll();
      await WeLink.logout();
      location.href = "index.html";
    });

    document.getElementById("topbar-bell")?.addEventListener("click", async () => {
      document.getElementById("notes-dropdown")?.classList.toggle("open");
      if (session?.id) {
        await WeLink.markRead(session.id);
        renderAll();
      }
    });

    document.addEventListener("keydown", (e) => {
      if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === "k") {
        e.preventDefault();
        document.getElementById("admin-search")?.focus();
      }
      if (e.key === "Escape") {
        document.getElementById("notes-dropdown")?.classList.remove("open");
        closeRejectModal();
        closeMemberModal();
        closeSidebar();
      }
    });

    document.addEventListener("click", async (e) => {
      const b = e.target.closest("button");
      if (!b) return;
      if (!b.closest(".admin-canvas") && !b.closest("#member-modal")) return;
      if (b.dataset.viewMember) {
        const db = await WeLink.load();
        openMemberModal(b.dataset.viewMember, b.dataset.role, db);
        return;
      }
      if (b.dataset.act === "accept") {
        await WeLink.adminAccept(b.dataset.id);
        closeMemberModal();
        return renderAll();
      }
      if (b.dataset.act === "reject") {
        openRejectModal(b.dataset.id);
        return;
      }
      if (b.dataset.suspend) {
        if (!confirm("Suspend this member?")) return;
        await WeLink.adminSuspendMember(b.dataset.suspend, b.dataset.role);
        closeMemberModal();
        return renderAll();
      }
      if (b.dataset.deactivate) {
        if (!confirm("Deactivate this member? They will lose access.")) return;
        await WeLink.adminDeactivateMember(b.dataset.deactivate, b.dataset.role);
        closeMemberModal();
        return renderAll();
      }
      if (b.dataset.reactivate) {
        await WeLink.adminReactivateMember(b.dataset.reactivate, b.dataset.role);
        closeMemberModal();
        return renderAll();
      }
      if (b.dataset.del) {
        if (confirm("Delete this member permanently?")) {
          await WeLink.adminDeleteMember(b.dataset.id, b.dataset.del);
          closeMemberModal();
          return renderAll();
        }
      }
      if (b.dataset.waApprove) {
        await WeLink.adminApproveWhatsApp(b.dataset.waApprove);
        return renderAll();
      }
      if (b.dataset.waReject) {
        await WeLink.adminRejectWhatsApp(b.dataset.waReject);
        return renderAll();
      }
      if (b.dataset.commApprove) {
        const res = await WeLink.adminApproveCommunication(b.dataset.commApprove);
        if (!res.ok) alert(res.error);
        return renderAll();
      }
      if (b.dataset.commReject) {
        const res = await WeLink.adminRejectCommunication(b.dataset.commReject);
        if (!res.ok) alert(res.error);
        return renderAll();
      }
      if (b.dataset.convSuspend) {
        if (!confirm("Suspend communication? Guest and professional cannot chat until you resume.")) return;
        const res = await WeLink.adminSetConversationStatus(b.dataset.convSuspend, "suspended");
        if (!res.ok) alert(res.error);
        return renderAll();
      }
      if (b.dataset.convResume) {
        const res = await WeLink.adminSetConversationStatus(b.dataset.convResume, "active");
        if (!res.ok) alert(res.error);
        return renderAll();
      }
      if (b.dataset.convEnd) {
        if (!confirm("End communication permanently? Guest and professional must submit a new request before they can chat again.")) return;
        const res = await WeLink.adminEndCommunication(b.dataset.convEnd);
        if (!res.ok) alert(res.error);
        return renderAll();
      }
      if (b.dataset.commDelete) {
        if (!confirm("Delete this ended communication record from the admin list? This does not grant chat access — users still need a new approved request.")) return;
        const res = await WeLink.adminDeleteEndedCommunication(b.dataset.commDelete);
        if (!res.ok) alert(res.error);
        return renderAll();
      }
      if (b.dataset.adminSupportStart) {
        const res = await WeLink.adminStartSupportConversation(b.dataset.adminSupportStart, b.dataset.role);
        if (!res.ok) return alert(res.error);
        selectedSupportConversationId = res.conversationId;
        currentSection = "communication";
        navigate("communication");
        return renderAll();
      }
      if (b.dataset.supportApprove) {
        const res = await WeLink.adminApproveAdminSupport(b.dataset.supportApprove);
        if (!res.ok) return alert(res.error);
        if (res.conversationId) selectedSupportConversationId = res.conversationId;
        return renderAll();
      }
      if (b.dataset.supportReject) {
        const res = await WeLink.adminRejectAdminSupport(b.dataset.supportReject);
        if (!res.ok) return alert(res.error);
        return renderAll();
      }
      if (b.dataset.supportOpen) {
        selectedSupportConversationId = b.dataset.supportOpen;
        return renderAll();
      }
      if (b.dataset.supportSuspend) {
        const res = await WeLink.adminSetSupportConversationStatus(b.dataset.supportSuspend, "suspended");
        if (!res.ok) return alert(res.error);
        return renderAll();
      }
      if (b.dataset.supportResume) {
        const res = await WeLink.adminSetSupportConversationStatus(b.dataset.supportResume, "active");
        if (!res.ok) return alert(res.error);
        return renderAll();
      }
      if (b.dataset.supportEnd) {
        if (!confirm("End this admin support conversation?")) return;
        const res = await WeLink.adminSetSupportConversationStatus(b.dataset.supportEnd, "closed");
        if (!res.ok) return alert(res.error);
        if (selectedSupportConversationId === b.dataset.supportEnd) {
          selectedSupportConversationId = null;
          WeLinkRealtime?.unsubscribeAdminSupportMessages();
        }
        return renderAll();
      }
    });

    document.addEventListener("click", (e) => {
      if (!e.target.closest(".bell-wrap")) {
        document.getElementById("notes-dropdown")?.classList.remove("open");
      }
    });
  }

  async function init() {
    session = await WeLinkUI.requireRole("admin");
    if (!session) return;
    const appHeader = document.querySelector("[data-header]");
    if (appHeader) {
      appHeader.className = "app-logo-bar";
      appHeader.innerHTML = `<div class="wrap"><a class="ix" href="index.html">${WeLinkUI.logo}</a></div>`;
    }
    document.body.classList.add("admin-shell");
    bindEvents();
    updateClock();
    clockTimer = setInterval(updateClock, 1000);
    await renderAll();
    WeLink.onChange(renderAll);
    if (global.WeLinkRealtime) {
      WeLinkRealtime.trackPresence(session.id, session.role).catch(() => {});
      WeLinkRealtime.subscribePresence((state) => {
        presenceState = state;
      });
      setupAdminRealtimeFeeds();
    }
  }

  global.WeLinkAdminDashboard = { init, navigate, renderAll };
})(window);
