(function (global) {
  async function init(session) {
    await WeLinkUI.renderHeader(document.querySelector("[data-header]"));
    await WeLink.load();

    const app = document.getElementById("app");
    const H = WeLinkHelpers;
    const D = WeLinkDiscovery;
    const s = session;
    let proView = "home";
    let selectedProId = null;
    let selectedGuestId = null;
    let browseSearch = "";
    let browseSkill = "";
    let activeChatConversationId = null;

    function leaveChat() {
      activeChatConversationId = null;
      if (window.WeLinkRealtime) WeLinkRealtime.unsubscribeParticipantMessages();
    }

    function messageBubble(m) {
      const mine = m.fromId === s.id;
      const idAttr = m.id ? ` data-msg-id="${H.esc(m.id)}"` : "";
      return `<div class="chat-bubble ${mine ? "mine" : "theirs"}"${idAttr}><span class="msg-time">${H.fmtTime(m.createdAt)}</span>${H.esc(m.body)}</div>`;
    }

    function appendChatMessage(m) {
      const box = app.querySelector(".chat-msgs-room");
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
      const box = app.querySelector(".chat-msgs-room");
      if (!box) return;
      const msgs = await WeLink.getConversationMessages(conversationId);
      box.innerHTML = msgs.length ? msgs.map(messageBubble).join("") : `<p class="muted empty-chat">No messages yet. Say hello.</p>`;
      box.scrollTop = box.scrollHeight;
    }

    function bindChatRoom(guestId, proId, conversation) {
      activeChatConversationId = conversation.id;
      const form = app.querySelector("[data-private-send]");
      form?.addEventListener("submit", async (e) => {
        e.preventDefault();
        const input = form.querySelector("input");
        const text = input.value;
        const toId = selectedGuestId || guestId;
        const res = await WeLink.sendPrivateMessage(s.id, s.role, toId, "guest", text);
        if (!res.ok) return alert(res.error);
        input.value = "";
        if (res.message) appendChatMessage(res.message);
        else await refreshChatMessages(conversation.id);
      });
      if (global.WeLinkRealtime && activeChatConversationId === conversation.id) {
        WeLinkRealtime.subscribeParticipantMessages(conversation.id, (row) => {
          if (activeChatConversationId !== conversation.id) return;
          appendChatMessage(rowToMessage(row));
        });
      }
      const box = app.querySelector(".chat-msgs-room");
      if (box) box.scrollTop = box.scrollHeight;
    }

    async function renderChatRoom(peer, guestId, proId) {
      const conversation = WeLink.getActiveConversation(guestId, proId);
      if (!conversation) {
        return `<p class="muted">Chat opens after admin approves the communication request.</p>`;
      }
      const msgs = await WeLink.getConversationMessages(conversation.id);
      return `<div class="chat-room">
        <div class="chat-room-head">
          <img class="avatar-sm" src="${H.avatarUrl(peer)}" alt="" />
          <strong>${H.esc(peer?.name || "Chat")}</strong>
        </div>
        <div class="chat-msgs chat-msgs-room">${msgs.length ? msgs.map(messageBubble).join("") : `<p class="muted empty-chat">No messages yet. Say hello.</p>`}</div>
        <form class="chat-form-inline" data-private-send>
          <input placeholder="Type a message…" required aria-label="Message" autocomplete="off" />
          <button class="btn btn-primary ix" type="submit">Send</button>
        </form>
      </div>`;
    }

    function renderProInbox(db) {
      const reqs = db.communicationRequests.filter((r) => r.proId === s.id)
        .sort((a, b) => b.createdAt - a.createdAt);
      if (!reqs.length) return `<p class="muted">No guest communication requests yet.</p>`;
      return reqs.map((r) => {
        const canChat = WeLink.canPrivateChat(r.guestId, s.id);
        return `<div class="card comm-item">
          <img src="${H.avatarUrl({ photo: r.guestPhoto, name: r.guestName })}" alt="" />
          <div>
            <strong>${H.esc(r.guestName)}</strong>
            <span class="status-pill status-${r.status}">${H.statusBadge(r.status === "pending" ? "pending" : r.status)}</span>
            <p class="muted" style="margin:4px 0 0;font-size:13px">${r.status === "pending" ? "Waiting for admin approval." : r.status === "accepted" ? "Admin approved this conversation." : ""}</p>
            ${canChat ? `<div class="comm-actions"><button class="btn btn-primary ix btn-sm" type="button" data-open-guest-chat="${r.guestId}">Open chat</button></div>` : ""}
          </div>
        </div>`;
      }).join("");
    }

    async function renderPro() {
      await WeLink.load();
      const p = await WeLink.getPro(s.id);
      let body = "";

      if (p.status === "pending") {
        leaveChat();
        proView = "home";
        selectedProId = null;
        app.innerHTML = `<h1>${H.esc(p.name)}</h1>
          <p class="lede">${H.esc(p.skill)} · ${H.esc(p.location)} · status: <span class="gold">${H.statusBadge(p.status)}</span></p>
          <div class="card"><p class="muted">Your request is saved and pending admin approval. You will be able to browse and connect once approved.</p></div>`;
        return;
      } else if (p.status === "rejected") {
        leaveChat();
        proView = "home";
        selectedProId = null;
        body = `<p class="err">Your request was rejected.${p.rejectionReason ? " Reason: " + H.esc(p.rejectionReason) : ""} Please re-upload your information.</p>
          <form id="reup" class="card" style="margin-top:16px">
            <label>Full name <input name="name" value="${H.esc(p.name)}" required /></label>
            <label>Skill <select name="skill">${WeLink.SKILLS.map((sk) => `<option ${sk === p.skill ? "selected" : ""}>${sk}</option>`).join("")}</select></label>
            <label>Location <input name="location" value="${H.esc(p.location)}" required /></label>
            <label>Phone (WhatsApp) <input name="phone" value="${H.esc(p.phone)}" placeholder="+237..." /></label>
            <label>Bio <textarea name="bio" required>${H.esc(p.bio)}</textarea></label>
            <label>Achievements <textarea name="achievements">${H.esc(p.achievements)}</textarea></label>
            <label>Photo <input type="file" name="photo" accept="image/*" /></label>
            <button class="btn btn-primary ix" type="submit">Re-upload request</button>
          </form>`;
      } else if (p.status === "approved") {
        const allPros = await WeLink.publicProProfiles(s.id);
        const filtered = D.filterPros(allPros, { search: browseSearch, skill: browseSkill });
        const db = await WeLink.load();

        if (proView === "chat" && selectedGuestId) {
          const guest = db.guests.find((g) => g.id === selectedGuestId) || (await WeLink.getGuest(selectedGuestId));
          app.innerHTML = `<h1>Chat with ${H.esc(guest?.name || "Guest")}</h1>
            <p class="lede"><button class="link-btn" type="button" data-pro-view="home">← Dashboard</button></p>
            ${await renderChatRoom(guest, selectedGuestId, s.id)}`;
          bindProEvents();
          const conv = WeLink.getActiveConversation(selectedGuestId, s.id);
          if (conv) bindChatRoom(selectedGuestId, s.id, conv);
          return;
        }

        if (proView === "detail" && selectedProId) {
          const peer = allPros.find((x) => x.id === selectedProId) || (await WeLink.getPro(selectedProId));
          app.innerHTML = `<h1>Professional profile</h1>
            <p class="lede"><button class="link-btn" type="button" data-pro-view="browse">← Back to directory</button></p>
            ${peer ? D.renderProDetail(peer, "Discovery only — no communication between professionals") : `<p class="err">Profile not found.</p>`}`;
          bindProEvents();
          return;
        }

        if (proView === "browse") {
          app.innerHTML = `<h1>Browse professionals</h1>
            <p class="lede"><button class="link-btn" type="button" data-pro-view="home">← Dashboard</button> · read-only discovery</p>
            ${D.renderBrowseToolbar({ search: browseSearch, skill: browseSkill, skills: WeLink.SKILLS })}
            <div class="pro-grid">${filtered.length
              ? filtered.map((x) => D.renderProCard(x, { detailBtn: true, compact: true })).join("")
              : `<p class="muted empty-state">No other approved professionals match your filters.</p>`}</div>`;
          bindProEvents();
          return;
        }

        body = `<p class="ok">You are registered on WE-LINK. Your profile is live.</p>
          <article class="pro-card" style="margin-top:16px">
            <img class="avatar-md" src="${H.avatarUrl(p)}" alt="" />
            <span class="badge">${H.esc(p.skill)}</span>
            <h3>${H.esc(p.name)}</h3>
            <p class="muted">${H.esc(p.location)}</p>
            <p>${H.esc(p.bio)}</p>
            ${p.achievements ? `<p class="muted"><strong>Achievements:</strong> ${H.esc(p.achievements)}</p>` : ""}
          </article>
          <div style="margin-top:20px;display:flex;gap:12px;flex-wrap:wrap">
            <button class="btn btn-primary ix" type="button" data-pro-view="browse">Browse other professionals (${allPros.length})</button>
          </div>
          <h2 style="margin:28px 0 12px">Communication requests</h2>
          ${renderProInbox(db)}`;
      } else if (p.status === "suspended" || p.status === "deactivated") {
        body = `<p class="err">Your account is ${p.status}. Contact admin for assistance.</p>`;
      }

      app.innerHTML = `<h1>${H.esc(p.name)}</h1><p class="lede">${H.esc(p.skill)} · ${H.esc(p.location)} · status: <span class="gold">${H.statusBadge(p.status)}</span></p>${body}`;
      bindProEvents();
    }

    function bindProEvents() {
      app.querySelectorAll("[data-pro-view]").forEach((btn) => {
        btn.addEventListener("click", () => {
          leaveChat();
          proView = btn.dataset.proView;
          if (proView !== "detail") selectedProId = null;
          if (proView !== "chat") selectedGuestId = null;
          renderPro();
        });
      });
      app.querySelectorAll("[data-pro-detail]").forEach((btn) => {
        btn.addEventListener("click", () => {
          selectedProId = btn.dataset.proDetail;
          proView = "detail";
          renderPro();
        });
      });
      app.querySelectorAll("[data-open-guest-chat]").forEach((btn) => {
        btn.addEventListener("click", () => {
          selectedGuestId = btn.dataset.openGuestChat;
          proView = "chat";
          renderPro();
        });
      });
      const searchEl = app.querySelector("#browse-search");
      const skillEl = app.querySelector("#browse-skill");
      searchEl?.addEventListener("input", () => {
        browseSearch = searchEl.value;
        renderPro();
      });
      skillEl?.addEventListener("change", () => {
        browseSkill = skillEl.value;
        renderPro();
      });
      document.getElementById("reup")?.addEventListener("submit", async (e) => {
        e.preventDefault();
        const f = e.target;
        let photo;
        if (f.photo.files[0]) photo = await H.fileToData(f.photo.files[0]);
        const res = await WeLink.resubmitPro(s.id, {
          name: f.name.value,
          skill: f.skill.value,
          location: f.location.value,
          bio: f.bio.value,
          achievements: f.achievements.value,
          phone: f.phone.value,
          photo
        });
        if (res.ok) {
          await WeLink.emailAdmin(res.account);
          WeLink.notifyAdminWhatsApp(res.account);
        }
        location.reload();
      });
    }

    await renderPro();

    WeLink.onChange(() => {
      if (proView === "chat" && selectedGuestId) {
        const conv = WeLink.getActiveConversation(selectedGuestId, s.id);
        if (conv && conv.id === activeChatConversationId) return;
      }
      renderPro();
    });
  }

  global.WeLinkProDashboard = { init };
})(window);
