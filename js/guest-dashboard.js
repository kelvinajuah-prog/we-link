(function (global) {
  const H = () => global.WeLinkHelpers;
  const D = () => global.WeLinkDiscovery;

  let session = null;
  let mount = null;
  let guestView = "home";
  let selectedProId = null;
  let browseSearch = "";
  let browseSkill = "";
  let activeChatConversationId = null;
  let searchDebounce = null;
  let shellReady = false;

  function navFromView(view) {
    if (view === "browse" || view === "detail") return "browse";
    if (view === "inbox" || view === "chat") return "inbox";
    if (view === "connections") return "inbox";
    if (view === "profile") return "profile";
    if (view === "help") return "help";
    return "home";
  }

  function guestLocationDisplay(entity) {
    const town = (entity.town || entity.location || "").trim();
    const area = (entity.area || "").trim();
    if (town && area) return H().esc(town.toUpperCase()) + " · " + H().esc(area.toUpperCase());
    const single = (town || area).toUpperCase();
    return single ? H().esc(single) : "";
  }

  function profileTabActive(view) {
    if (view === "home") return guestView === "home" ? "active" : "";
    if (view === "connections") return guestView === "connections" ? "active" : "";
    if (view === "inbox") return guestView === "inbox" || guestView === "chat" ? "active" : "";
    if (view === "browse") return guestView === "browse" || guestView === "detail" ? "active" : "";
    return guestView === view ? "active" : "";
  }

  function leaveChat() {
    activeChatConversationId = null;
    if (global.WeLinkRealtime) global.WeLinkRealtime.unsubscribeParticipantMessages();
  }

  function locationLine(entity) {
    const town = entity.town || entity.location || "";
    const area = entity.area || "";
    if (town && area) return H().esc(town) + " · " + H().esc(area);
    return H().esc(town || area);
  }

  function guestCommHtml(proId) {
    const canChat = WeLink.canPrivateChat(session.id, proId);
    const req = WeLink.getCommRequest(session.id, proId);
    if (canChat) {
      return `<div class="gd-pro-actions"><button class="gd-btn gd-btn-primary" type="button" data-open-chat="${proId}">Open chat</button></div>`;
    }
    if (req?.status === "pending") {
      return `<div class="gd-pro-actions">
        <span class="gd-status-pill gd-status-pending">Pending admin approval</span>
        <button class="gd-btn gd-btn-ghost" type="button" data-cancel-comm="${req.id}">Cancel</button>
      </div>`;
    }
    if (req?.status === "rejected" && !WeLink.canReRequest(req.rejectedAt)) {
      return `<p class="gd-empty" style="margin-top:8px">Rejected. You can request again after ${H().fmtTime(WeLink.cooldownUntil(req.rejectedAt))}.</p>`;
    }
    return `<div class="gd-pro-actions"><button class="gd-btn gd-btn-primary" type="button" data-comm-req="${proId}">Request communication</button></div>`;
  }

  function messageBubble(m) {
    const mine = m.fromId === session.id;
    const idAttr = m.id ? ` data-msg-id="${H().esc(m.id)}"` : "";
    return `<div class="chat-bubble ${mine ? "mine" : "theirs"}"${idAttr}><span class="msg-time">${H().fmtTime(m.createdAt)}</span>${H().esc(m.body)}</div>`;
  }

  function appendChatMessage(m) {
    const box = mount.querySelector(".chat-msgs-room");
    if (!box || !m) return;
    if (m.id && box.querySelector(`[data-msg-id="${CSS.escape(m.id)}"]`)) return;
    box.querySelector(".empty-chat")?.remove();
    box.insertAdjacentHTML("beforeend", messageBubble(m));
    box.scrollTop = box.scrollHeight;
  }

  function rowToMessage(row) {
    if (!row) return null;
    return {
      id: row.id,
      fromId: row.from_id || row.fromId,
      fromRole: row.from_role || row.fromRole,
      body: row.body,
      createdAt: row.created_at ? new Date(row.created_at).getTime() : (row.createdAt || Date.now())
    };
  }

  async function refreshChatMessages(conversationId) {
    const box = mount.querySelector(".chat-msgs-room");
    if (!box) return;
    const msgs = await WeLink.getConversationMessages(conversationId);
    box.innerHTML = msgs.length ? msgs.map(messageBubble).join("") : `<p class="gd-empty empty-chat">No messages yet. Say hello.</p>`;
    box.scrollTop = box.scrollHeight;
  }

  function bindChatRoom(guestId, proId, conversation) {
    activeChatConversationId = conversation.id;
    const form = mount.querySelector("[data-private-send]");
    form?.addEventListener("submit", async (e) => {
      e.preventDefault();
      const input = form.querySelector("input");
      const text = input.value;
      const res = await WeLink.sendPrivateMessage(session.id, session.role, proId, "professional", text);
      if (!res.ok) return alert(res.error);
      input.value = "";
      if (res.message) appendChatMessage(res.message);
      else await refreshChatMessages(conversation.id);
    });
    if (global.WeLinkRealtime && activeChatConversationId === conversation.id) {
      global.WeLinkRealtime.subscribeParticipantMessages(conversation.id, (row) => {
        if (activeChatConversationId !== conversation.id) return;
        appendChatMessage(rowToMessage(row));
      });
    }
    const box = mount.querySelector(".chat-msgs-room");
    if (box) box.scrollTop = box.scrollHeight;
  }

  async function renderChatRoom(peer, guestId, proId) {
    const conversation = WeLink.getActiveConversation(guestId, proId);
    if (!conversation) {
      return `<p class="gd-empty">Chat opens after admin approves the communication request.</p>`;
    }
    const msgs = await WeLink.getConversationMessages(conversation.id);
    return `<div class="chat-room">
      <div class="chat-room-head">
        <img class="avatar-sm" src="${H().avatarUrl(peer)}" alt="" />
        <strong>${H().esc(peer?.name || "Chat")}</strong>
      </div>
      <div class="chat-msgs chat-msgs-room">${msgs.length ? msgs.map(messageBubble).join("") : `<p class="gd-empty empty-chat">No messages yet. Say hello.</p>`}</div>
      <form class="chat-form-inline" data-private-send>
        <input placeholder="Type a message…" required aria-label="Message" autocomplete="off" />
        <button class="gd-btn gd-btn-primary" type="submit">Send</button>
      </form>
    </div>`;
  }

  const NAV_ICONS = {
    home: `<svg class="gd-nav-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M3 10.5L12 3l9 7.5V20a1 1 0 0 1-1 1h-5v-6H9v6H4a1 1 0 0 1-1-1v-9.5z"/></svg>`,
    browse: `<svg class="gd-nav-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="11" cy="11" r="7"/><path d="M21 21l-4.3-4.3"/></svg>`,
    inbox: `<svg class="gd-nav-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M4 4h16v16H4z"/><path d="M4 8l8 5 8-5"/></svg>`,
    profile: `<svg class="gd-nav-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="12" cy="8" r="4"/><path d="M4 20a8 8 0 0 1 16 0"/></svg>`,
    help: `<svg class="gd-nav-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="12" cy="12" r="9"/><path d="M9.5 9a2.5 2.5 0 0 1 4.8 1c0 2-3 2-3 4"/><circle cx="12" cy="17" r=".5" fill="currentColor"/></svg>`
  };

  function proTagHtml(pro) {
    const tags = [pro.skill];
    if (pro.achievements) {
      pro.achievements.split(/[,;|]+/).slice(0, 2).forEach((t) => {
        const v = t.trim();
        if (v && v !== pro.skill) tags.push(v);
      });
    }
    return tags.filter(Boolean).map((t) => `<span class="gd-tag">${H().esc(t)}</span>`).join("");
  }

  function renderQuickActionsHtml() {
    return `<div class="gd-quick-actions">
      <button class="gd-quick-card featured" type="button" data-guest-view="browse">
        <span class="gd-quick-icon">🔍</span>
        <span><span class="gd-quick-title">Find professionals</span><span class="gd-quick-sub">Browse approved talent near you</span></span>
        <span class="gd-quick-chevron">›</span>
      </button>
      <button class="gd-quick-card" type="button" data-guest-view="inbox">
        <span class="gd-quick-icon">💬</span>
        <span><span class="gd-quick-title">Messages</span><span class="gd-quick-sub">Requests and conversations</span></span>
        <span class="gd-quick-chevron">›</span>
      </button>
      <button class="gd-quick-card" type="button" data-guest-view="profile">
        <span class="gd-quick-icon">✎</span>
        <span><span class="gd-quick-title">Edit profile</span><span class="gd-quick-sub">Update photo and details</span></span>
        <span class="gd-quick-chevron">›</span>
      </button>
      <button class="gd-quick-card" type="button" data-guest-view="help">
        <span class="gd-quick-icon">?</span>
        <span><span class="gd-quick-title">Help</span><span class="gd-quick-sub">How WeLink works</span></span>
        <span class="gd-quick-chevron">›</span>
      </button>
    </div>`;
  }

  function renderFeaturedPro(pro, commHtml) {
    const photo = H().avatarUrl(pro);
    return `<article class="gd-pro-feature">
      <div class="gd-pro-body">
        <span class="gd-skill-pill">${H().esc(pro.skill)}</span>
        <div class="gd-tag-row">${proTagHtml(pro)}</div>
        <h3>${H().esc(pro.name)}</h3>
        <p>${H().esc(pro.location || "")}</p>
        <p>${H().esc((pro.bio || "").slice(0, 140))}${(pro.bio || "").length > 140 ? "…" : ""}</p>
        ${commHtml}
        <button class="gd-btn gd-btn-primary gd-btn-view" type="button" data-pro-detail="${pro.id}">View profile →</button>
      </div>
      <div class="gd-pro-thumb"><img src="${photo}" alt="" loading="lazy" /></div>
    </article>`;
  }

  function activityItems(db, unreadNotes) {
    const items = [];
    unreadNotes.slice(0, 4).forEach((n) => {
      items.push({ icon: "🔔", text: n.message, time: H().fmtTime(n.createdAt || Date.now()) });
    });
    const reqs = (db.communicationRequests || [])
      .filter((r) => r.guestId === session.id)
      .sort((a, b) => b.createdAt - a.createdAt)
      .slice(0, 4);
    reqs.forEach((r) => {
      items.push({
        icon: "💬",
        text: `${r.proName}: ${r.status}`,
        time: H().fmtTime(r.createdAt)
      });
    });
    return items.slice(0, 6);
  }

  function renderRail(db, unreadNotes) {
    const activity = activityItems(db, unreadNotes);
    return `<aside class="gd-rail" aria-label="Quick actions">
      <h3>Quick actions</h3>
      ${renderQuickActionsHtml()}
      <h3>Your activity</h3>
      <div class="gd-activity-list">${activity.length
        ? activity.map((a) => `<div class="gd-activity-item"><span>${a.icon}</span><div><div>${H().esc(a.text)}</div><div class="gd-empty">${a.time}</div></div></div>`).join("")
        : `<p class="gd-empty">No recent activity yet.</p>`}</div>
      <div class="gd-rail-cta">
        <strong>Go further with WeLink</strong>
        <p>Invite friends or explore more ways to connect with local professionals.</p>
        <a href="index.html">Explore WeLink →</a>
      </div>
    </aside>`;
  }

  async function renderStage() {
    const stage = mount.querySelector("#gd-stage");
    if (!stage) return;

    await WeLink.load();
    const u = await WeLink.getGuest(session.id);
    const db = await WeLink.load();
    const unreadNotes = await WeLink.unread(session.id);
    const allPros = await WeLink.publicProProfiles();
    const filtered = D().filterPros(allPros, { search: browseSearch, skill: browseSkill });

    const rail = mount.querySelector(".gd-rail");
    if (rail) rail.outerHTML = renderRail(db, unreadNotes);

    updateNavActive();
    syncHeaderSearch();

    if (guestView === "chat" && selectedProId) {
      const p = allPros.find((x) => x.id === selectedProId) || (await WeLink.getPro(selectedProId));
      stage.innerHTML = `<div class="gd-back-row"><button class="gd-link-btn" type="button" data-guest-view="inbox">← Messages</button></div>
        <h2 style="margin:0 0 12px">Chat with ${H().esc(p?.name || "Professional")}</h2>
        ${await renderChatRoom(p, session.id, selectedProId)}`;
      bindGuestEvents();
      const conv = WeLink.getActiveConversation(session.id, selectedProId);
      if (conv) bindChatRoom(session.id, selectedProId, conv);
      return;
    }

    if (guestView === "connections") {
      const activeConvs = (db.conversations || []).filter((c) => c.guestId === session.id && c.status === "active");
      const reqs = db.communicationRequests.filter((r) => r.guestId === session.id)
        .sort((a, b) => b.createdAt - a.createdAt);
      stage.innerHTML = `<div class="gd-back-row"><button class="gd-link-btn" type="button" data-guest-view="home">← Home</button></div>
        <h2 style="margin:0 0 16px">Connections</h2>
        <p class="gd-empty" style="margin-bottom:16px">Active conversations and communication requests with professionals.</p>
        ${activeConvs.length ? `<h3 class="gd-subhead">Active chats</h3>${activeConvs.map((c) => {
          const pro = allPros.find((p) => p.id === c.proId);
          return `<div class="comm-item">
            <img src="${H().avatarUrl(pro || { name: c.proName })}" alt="" />
            <div>
              <strong>${H().esc(c.proName || pro?.name || "Professional")}</strong>
              <div class="gd-pro-actions"><button class="gd-btn gd-btn-primary" type="button" data-open-chat="${c.proId}">Open chat</button></div>
            </div>
          </div>`;
        }).join("")}` : ""}
        ${reqs.length ? `<h3 class="gd-subhead" style="margin-top:20px">Requests</h3>${reqs.map((r) => {
          const canChat = WeLink.canPrivateChat(session.id, r.proId);
          return `<div class="comm-item">
            <img src="${H().avatarUrl({ photo: r.proPhoto, name: r.proName })}" alt="" />
            <div>
              <strong>${H().esc(r.proName)}</strong>
              <span class="gd-status-pill gd-status-${r.status}">${H().statusBadge(r.status)}</span>
              <div class="gd-pro-actions">
                ${canChat ? `<button class="gd-btn gd-btn-primary" type="button" data-open-chat="${r.proId}">Open chat</button>` : ""}
                ${r.status === "pending" ? `<button class="gd-btn gd-btn-ghost" type="button" data-cancel-comm="${r.id}">Cancel</button>` : ""}
              </div>
            </div>
          </div>`;
        }).join("")}` : `<p class="gd-empty">No connections yet. Browse professionals to request communication.</p>`}`;
      bindGuestEvents();
      return;
    }

    if (guestView === "inbox") {
      const reqs = db.communicationRequests.filter((r) => r.guestId === session.id)
        .sort((a, b) => b.createdAt - a.createdAt);
      stage.innerHTML = `<div class="gd-back-row"><button class="gd-link-btn" type="button" data-guest-view="home">← Home</button></div>
        <h2 style="margin:0 0 16px">Messages</h2>
        ${reqs.length ? reqs.map((r) => {
          const canChat = WeLink.canPrivateChat(session.id, r.proId);
          return `<div class="comm-item">
            <img src="${H().avatarUrl({ photo: r.proPhoto, name: r.proName })}" alt="" />
            <div>
              <strong>${H().esc(r.proName)}</strong>
              <span class="gd-status-pill gd-status-${r.status}">${H().statusBadge(r.status)}</span>
              <div class="gd-pro-actions">
                ${canChat ? `<button class="gd-btn gd-btn-primary" type="button" data-open-chat="${r.proId}">Open chat</button>` : ""}
                ${r.status === "pending" ? `<button class="gd-btn gd-btn-ghost" type="button" data-cancel-comm="${r.id}">Cancel</button>` : ""}
              </div>
            </div>
          </div>`;
        }).join("") : `<p class="gd-empty">No communication requests yet. Browse professionals to send one.</p>`}`;
      bindGuestEvents();
      return;
    }

    if (guestView === "detail" && selectedProId) {
      const p = allPros.find((x) => x.id === selectedProId) || (await WeLink.getPro(selectedProId));
      stage.innerHTML = `<div class="gd-back-row"><button class="gd-link-btn" type="button" data-guest-view="browse">← Back to directory</button></div>
        <h2 style="margin:0 0 12px">Professional profile</h2>
        ${p ? D().renderProDetail(p, "", guestCommHtml(p.id)) : `<p class="err">Profile not found.</p>`}`;
      bindGuestEvents();
      return;
    }

    if (guestView === "browse") {
      stage.innerHTML = `<div class="gd-back-row"><button class="gd-link-btn" type="button" data-guest-view="home">← Home</button></div>
        <h2 style="margin:0 0 12px">Discover professionals</h2>
        ${D().renderBrowseToolbar({ search: browseSearch, skill: browseSkill, skills: WeLink.SKILLS })}
        <div class="pro-grid" style="margin-top:16px">${filtered.length
          ? filtered.map((p) => D().renderProCard(p, { commHtml: guestCommHtml(p.id), detailBtn: true, compact: true })).join("")
          : `<p class="gd-empty empty-state">No approved professionals match your filters.</p>`}</div>`;
      bindGuestEvents();
      return;
    }

    if (guestView === "profile") {
      const skillOpts = (WeLink.SKILLS || []).map((sk) =>
        `<option value="${H().esc(sk)}" ${sk === u.specialization ? "selected" : ""}>${H().esc(sk)}</option>`
      ).join("");
      stage.innerHTML = `<div class="gd-back-row"><button class="gd-link-btn" type="button" data-guest-view="home">← Home</button></div>
        <div class="gd-panel">
          <h2 style="margin:0 0 16px">Edit profile</h2>
          <form id="gd-profile-form" class="gd-profile-form">
            <label>Full name<input name="name" required value="${H().esc(u.name)}" /></label>
            <div class="gd-form-grid">
              <label>Age<input type="number" name="age" min="16" max="99" required value="${H().esc(String(u.age || ""))}" /></label>
              <label>Specialization<select name="specialization" required>${skillOpts}</select></label>
            </div>
            <div class="gd-form-grid">
              <label>Town / city<input name="town" required value="${H().esc(u.town || "")}" /></label>
              <label>Area<input name="area" required value="${H().esc(u.area || "")}" /></label>
            </div>
            <label>Skills<input name="skills" required value="${H().esc(u.skills || "")}" /></label>
            <label>Profile photo<input type="file" name="photo" accept="image/*" /></label>
            <button class="gd-btn gd-btn-primary" type="submit">Save changes</button>
          </form>
        </div>`;
      bindGuestEvents();
      mount.querySelector("#gd-profile-form")?.addEventListener("submit", async (e) => {
        e.preventDefault();
        const f = e.target;
        const btn = f.querySelector('[type="submit"]');
        btn.disabled = true;
        let photo = "";
        if (f.photo.files[0]) {
          photo = await global.WeLinkUI.fileToData(f.photo.files[0]);
        }
        const res = await WeLink.updateGuestProfile(session.id, {
          name: f.name.value,
          age: f.age.value,
          town: f.town.value,
          area: f.area.value,
          specialization: f.specialization.value,
          skills: f.skills.value,
          photo
        });
        btn.disabled = false;
        if (!res.ok) return alert(res.error);
        guestView = "home";
        await renderStage();
      });
      return;
    }

    if (guestView === "help") {
      stage.innerHTML = `<div class="gd-back-row"><button class="gd-link-btn" type="button" data-guest-view="home">← Home</button></div>
        <div class="gd-panel">
          <h2 style="margin:0 0 10px">Help</h2>
          <p class="gd-empty">Browse professionals, request communication, and chat once admin approves. Visit the marketing site for more about WeLink.</p>
          <p style="margin-top:16px"><a class="gd-link-btn" href="index.html#how">How WeLink works →</a></p>
        </div>`;
      bindGuestEvents();
      return;
    }

    const matches = await WeLink.matchForGuest(u, { includeSamples: false });
    const heroPhoto = u.photo ? H().avatarUrl(u) : H().avatarUrl({ name: u.name });

    const firstName = (u.name || "Guest").split(/\s+/)[0];

    stage.innerHTML = `
      <section class="gd-hero">
        <div class="gd-hero-copy">
          <p class="gd-hero-kicker">Welcome, guest</p>
          <h1>Discover. Connect.<br />Grow with WeLink.</h1>
          <p>Explore professionals, connect with people, discover opportunities and build meaningful professional relationships.</p>
          <div class="gd-hero-pillars">
            <button type="button" class="gd-hero-pillar" data-guest-view="browse"><span>↗</span> Connect</button>
            <button type="button" class="gd-hero-pillar" data-guest-view="help"><span>📖</span> Learn</button>
            <button type="button" class="gd-hero-pillar" data-guest-view="profile"><span>★</span> Grow</button>
          </div>
        </div>
        <div class="gd-hero-visual"><img src="${heroPhoto}" alt="" /></div>
      </section>
      <section class="gd-profile-card">
        <div class="gd-profile-head">
          <div class="gd-profile-avatar-wrap">
            <img src="${H().avatarUrl(u)}" alt="" />
            <span class="gd-guest-badge">Guest</span>
          </div>
          <div class="gd-profile-meta">
            <h2>${H().esc(u.name)}${u.age ? `, ${H().esc(String(u.age))}` : ""}</h2>
            <p class="gd-role-line">Guest · ${H().esc(u.specialization || "Member")}</p>
            ${guestLocationDisplay(u) ? `<p class="gd-loc-line gd-loc-upper">📍 ${guestLocationDisplay(u)}</p>` : ""}
            ${u.skills ? `<p style="margin-top:8px;font-size:13px;color:#cbd5e1">${H().esc(u.skills)}</p>` : ""}
          </div>
          <div class="gd-profile-actions">
            <button class="gd-btn gd-btn-ghost" type="button" data-guest-view="profile">Edit profile</button>
            <button class="gd-btn gd-btn-primary" type="button" data-guest-view="browse">Browse professionals</button>
          </div>
        </div>
        <div class="gd-profile-tabs" role="tablist">
          <button type="button" class="gd-profile-tab ${profileTabActive("home")}" data-guest-view="home">Overview</button>
          <button type="button" class="gd-profile-tab ${profileTabActive("connections")}" data-guest-view="connections">Connections</button>
          <button type="button" class="gd-profile-tab ${profileTabActive("inbox")}" data-guest-view="inbox">Messages</button>
          <button type="button" class="gd-profile-tab ${profileTabActive("browse")}" data-guest-view="browse">Discover</button>
        </div>
      </section>
      <section class="gd-mobile-quick" aria-label="Quick actions">${renderQuickActionsHtml()}</section>
      <section>
        <div class="gd-section-head">
          <h2>Recommended for you</h2>
          <button class="gd-link-btn" type="button" data-guest-view="browse">View all →</button>
        </div>
        <div class="gd-pro-grid">${matches.length
          ? matches.map((p) => renderFeaturedPro(p, guestCommHtml(p.id))).join("")
          : `<p class="gd-empty">Browse the directory to find professionals in your area.</p>`}</div>
      </section>`;

    bindGuestEvents();
  }

  function updateNavActive() {
    const navKey = navFromView(guestView);
    mount.querySelectorAll("[data-gd-nav]").forEach((btn) => {
      btn.classList.toggle("active", btn.dataset.gdNav === navKey);
    });
    mount.querySelectorAll(".gd-mobile-nav [data-gd-nav]").forEach((btn) => {
      btn.classList.toggle("active", btn.dataset.gdNav === navKey);
    });
  }

  function syncHeaderSearch() {
    const input = mount.querySelector("#gd-header-search");
    if (input && input !== document.activeElement) {
      input.value = browseSearch;
    }
  }

  function bindBrowseFilters() {
    const searchEl = mount.querySelector("#browse-search");
    const skillEl = mount.querySelector("#browse-skill");
    if (searchEl && !searchEl.dataset.bound) {
      searchEl.dataset.bound = "1";
      searchEl.addEventListener("input", () => {
        browseSearch = searchEl.value;
        clearTimeout(searchDebounce);
        searchDebounce = setTimeout(() => renderStage(), 280);
      });
    }
    if (skillEl && !skillEl.dataset.bound) {
      skillEl.dataset.bound = "1";
      skillEl.addEventListener("change", () => {
        browseSkill = skillEl.value;
        renderStage();
      });
    }
  }

  function bindGuestEvents() {
    bindBrowseFilters();
  }

  function bindDelegatedActions() {
    if (mount.dataset.delegateBound) return;
    mount.dataset.delegateBound = "1";
    mount.addEventListener("click", async (e) => {
      const navBtn = e.target.closest("[data-gd-nav]");
      if (navBtn) {
        const key = navBtn.dataset.gdNav;
        leaveChat();
        selectedProId = null;
        if (key === "home") guestView = "home";
        else if (key === "browse") guestView = "browse";
        else if (key === "inbox") guestView = "inbox";
        else if (key === "profile") guestView = "profile";
        else if (key === "help") guestView = "help";
        closeMobileSidebar();
        renderStage();
        return;
      }
      const viewBtn = e.target.closest("[data-guest-view]");
      if (viewBtn) {
        leaveChat();
        guestView = viewBtn.dataset.guestView || "home";
        if (guestView !== "detail" && guestView !== "chat") selectedProId = null;
        renderStage();
        return;
      }
      const detailBtn = e.target.closest("[data-pro-detail]");
      if (detailBtn) {
        selectedProId = detailBtn.dataset.proDetail;
        guestView = "detail";
        renderStage();
        return;
      }
      const commBtn = e.target.closest("[data-comm-req]");
      if (commBtn) {
        const res = await WeLink.requestGuestCommunication(session.id, commBtn.dataset.commReq);
        alert(res.ok ? "Request sent. The professional and admin have been notified." : res.error);
        await refreshTopbar();
        renderStage();
        return;
      }
      const cancelBtn = e.target.closest("[data-cancel-comm]");
      if (cancelBtn) {
        const res = await WeLink.cancelCommunication(cancelBtn.dataset.cancelComm, session.id);
        if (!res.ok) return alert(res.error);
        renderStage();
        return;
      }
      const chatBtn = e.target.closest("[data-open-chat]");
      if (chatBtn) {
        selectedProId = chatBtn.dataset.openChat;
        guestView = "chat";
        renderStage();
      }
    });
  }

  async function refreshTopbar() {
    const unread = await WeLink.unread(session.id);
    const db = await WeLink.load();
    const pendingMsgs = db.communicationRequests.filter((r) => r.guestId === session.id && r.status === "pending").length;
    const bellCount = mount.querySelector(".gd-bell-count");
    if (bellCount) {
      if (unread.length) bellCount.textContent = String(unread.length);
      else bellCount.remove();
    } else if (unread.length) {
      mount.querySelector("[data-gd-bell]")?.insertAdjacentHTML(
        "beforeend",
        `<span class="gd-bell-count">${unread.length}</span>`
      );
    }
    const notesPanel = mount.querySelector("[data-gd-notes]");
    if (notesPanel?.classList.contains("open")) {
      notesPanel.innerHTML = renderNotesHtml(db);
    }
    mount.querySelectorAll("[data-gd-nav='inbox'] .gd-nav-badge").forEach((badge) => {
      if (pendingMsgs) {
        badge.textContent = String(pendingMsgs);
        badge.hidden = false;
      } else {
        badge.hidden = true;
      }
    });
  }

  function renderNotesHtml(db) {
    const notes = db.notifications.filter((n) => n.ownerId === session.id).slice(0, 12);
    return notes.length
      ? notes.map((n) => `<div class="gd-note ${n.read ? "" : "unread"}">${H().esc(n.message)}</div>`).join("")
      : `<div class="gd-note gd-empty">No notifications yet.</div>`;
  }

  function bindShellEvents() {

    mount.querySelector("[data-gd-menu]")?.addEventListener("click", () => {
      mount.querySelector(".gd-sidebar")?.classList.toggle("open");
      mount.querySelector(".gd-sidebar-backdrop")?.classList.toggle("open");
    });
    mount.querySelector(".gd-sidebar-backdrop")?.addEventListener("click", closeMobileSidebar);

    mount.querySelector("[data-gd-user]")?.addEventListener("click", () => {
      mount.querySelector("[data-gd-user-menu]")?.classList.toggle("open");
    });

    mount.querySelector("[data-gd-bell]")?.addEventListener("click", async () => {
      const panel = mount.querySelector("[data-gd-notes]");
      panel?.classList.toggle("open");
      if (panel?.classList.contains("open")) {
        const db = await WeLink.load();
        panel.innerHTML = renderNotesHtml(db);
        await WeLink.markRead(session.id);
        await refreshTopbar();
      }
    });

    mount.querySelector("[data-gd-logout]")?.addEventListener("click", async () => {
      await WeLink.logout();
      location.href = "index.html";
    });

    mount.querySelector("[data-gd-edit-profile]")?.addEventListener("click", () => {
      guestView = "profile";
      renderStage();
    });

    const headerSearch = mount.querySelector("#gd-header-search");
    headerSearch?.addEventListener("keydown", (e) => {
      if (e.key === "Enter") {
        e.preventDefault();
        browseSearch = headerSearch.value;
        guestView = "browse";
        renderStage();
      }
    });
  }

  function closeMobileSidebar() {
    mount.querySelector(".gd-sidebar")?.classList.remove("open");
    mount.querySelector(".gd-sidebar-backdrop")?.classList.remove("open");
  }

  async function renderShell(unreadCount, pendingInbox) {
    const u = await WeLink.getGuest(session.id);
    mount.innerHTML = `
      <div class="gd-shell">
        <div class="gd-sidebar-backdrop" aria-hidden="true"></div>
        <aside class="gd-sidebar">
          <div>
            <a class="gd-brand" href="index.html"><img src="img/welink-logo.png" alt="WeLink — Connect · Collaborate · Grow" class="welink-logo welink-logo-sidebar" /></a>
            <p class="gd-brand-tagline">Connect · Collaborate · Grow</p>
          </div>
          <nav class="gd-nav" aria-label="Guest navigation">
            <button type="button" class="gd-nav-btn active" data-gd-nav="home">${NAV_ICONS.home} Home</button>
            <button type="button" class="gd-nav-btn" data-gd-nav="browse">${NAV_ICONS.browse} Discover</button>
            <button type="button" class="gd-nav-btn" data-gd-nav="inbox">${NAV_ICONS.inbox} Messages${pendingInbox ? `<span class="gd-nav-badge">${pendingInbox}</span>` : ""}</button>
            <button type="button" class="gd-nav-btn" data-gd-nav="profile">${NAV_ICONS.profile} Profile</button>
            <button type="button" class="gd-nav-btn" data-gd-nav="help">${NAV_ICONS.help} Help</button>
          </nav>
          <div class="gd-sidebar-promo">
            <strong>Build your future with WeLink</strong>
            Connect with approved professionals in your area.
            <button type="button" data-guest-view="browse">Explore now →</button>
          </div>
        </aside>
        <div class="gd-main">
          <header class="gd-topbar">
            <button type="button" class="gd-menu-toggle" data-gd-menu aria-label="Open menu">☰</button>
            <div class="gd-search">
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="11" cy="11" r="8"/><path d="M21 21l-4.3-4.3"/></svg>
              <input id="gd-header-search" type="search" placeholder="Search professionals, skills, locations…" value="${H().esc(browseSearch)}" />
            </div>
            <div class="gd-topbar-actions">
              <button type="button" class="gd-explore-cta" data-guest-view="browse">Explore WeLink</button>
              <button type="button" class="gd-icon-btn" data-gd-bell aria-label="Notifications">${unreadCount ? `<span class="gd-bell-count">${unreadCount}</span>` : ""}🔔</button>
              <button type="button" class="gd-user-menu" data-gd-user>
                <img src="${H().avatarUrl(u)}" alt="" />
                <span>Guest account · ${H().esc(u.name.split(" ")[0] || "Account")} ▾</span>
              </button>
            </div>
            <div class="gd-notes-panel" data-gd-notes></div>
            <div class="gd-dropdown" data-gd-user-menu>
              <button type="button" data-gd-edit-profile>Edit profile</button>
              <button type="button" data-gd-logout>Log out</button>
            </div>
          </header>
          <div class="gd-stage gd-content" id="gd-stage"></div>
        </div>
        ${renderRail(await WeLink.load(), await WeLink.unread(session.id))}
      </div>
      <nav class="gd-mobile-nav" aria-label="Mobile navigation">
        <button type="button" data-gd-nav="home">Home</button>
        <button type="button" data-gd-nav="browse">Discover</button>
        <button type="button" data-gd-nav="inbox">Messages</button>
        <button type="button" data-gd-nav="profile">Profile</button>
      </nav>`;
    bindShellEvents();
    bindDelegatedActions();
    shellReady = true;
  }

  async function init(opts) {
    session = opts.session;
    mount = opts.mount;
    document.body.classList.add("guest-dash-active");
    const header = document.querySelector("[data-header]");
    if (header) header.hidden = true;

    await WeLink.load();
    const db = await WeLink.load();
    const unread = await WeLink.unread(session.id);
    const pendingInbox = db.communicationRequests.filter((r) => r.guestId === session.id && r.status === "pending").length;

    await renderShell(unread.length, pendingInbox);
    await renderStage();

    if (global.WeLinkRealtime?.trackPresence) {
      global.WeLinkRealtime.trackPresence(session.id, session.role).catch(() => {});
    }

    WeLink.onChange(() => {
      if (guestView === "chat" && selectedProId) {
        const conv = WeLink.getActiveConversation(session.id, selectedProId);
        if (conv && conv.id === activeChatConversationId) return;
      }
      renderStage();
      refreshTopbar();
    });
  }

  global.WeLinkGuestDashboard = { init };
})(window);
