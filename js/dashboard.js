(function (global) {
  const H = global.WeLinkHelpers;

  function renderCountdown() {
    return "";
  }

  function profileCard(entity, type) {
    const photo = H.avatarUrl(entity);
    if (type === "pro") {
      return `<article class="pro-card">
        <img class="avatar-md" src="${photo}" alt="${H.esc(entity.name)}" />
        <span class="badge">${H.esc(entity.skill)}</span>
        <h3>${H.esc(entity.name)}</h3>
        <p class="muted">${H.esc(entity.location || "")}</p>
        <p>${H.esc(entity.bio || "")}</p>
        ${entity.achievements ? `<p class="muted"><strong>Achievements:</strong> ${H.esc(entity.achievements)}</p>` : ""}
      </article>`;
    }
    return `<article class="pro-card">
      <img class="avatar-md" src="${photo}" alt="${H.esc(entity.name)}" />
      <h3>${H.esc(entity.name)}</h3>
      <p class="muted">${H.esc(entity.town || "")}${entity.area ? " · " + H.esc(entity.area) : ""}</p>
      <p><strong>Focus:</strong> ${H.esc(entity.specialization || "")}</p>
      ${entity.skills ? `<p class="muted">${H.esc(entity.skills)}</p>` : ""}
    </article>`;
  }

  function dashButtons(role) {
    return `<div class="dash-actions">
      <button class="btn btn-primary ix dash-btn" data-view="pros">View Other Professionals</button>
      <button class="btn btn-primary ix dash-btn" data-view="guests">View Different Guest Profiles</button>
      <button class="btn btn-ghost ix dash-btn" data-view="admin-comm">Request Communication With Admin</button>
    </div>`;
  }

  function privateChatUI(session, guestId, proId, peerName, peerPhoto) {
    const canChat = WeLink.canPrivateChat(guestId, proId);
    const req = WeLink.getCommRequest(guestId, proId);
    const msgs = WeLink.getPrivateMessages(guestId, proId);
    let statusHtml = "";
    if (req) {
      statusHtml = `<p class="status-pill status-${req.status}">${H.statusBadge(req.status)}</p>`;
      if (req.status === "pending") {
        statusHtml += `<p class="muted">Waiting for admin to approve this communication request.</p>`;
      }
      if (req.status === "communication_expired") {
        statusHtml += `<p class="err">Communication access expired. Request again to renew.</p>`;
      }
    }
    const chatHtml = canChat ? `
      <div class="chat-room" data-chat-room="${guestId}:${proId}">
        <div class="chat-room-head">
          <img class="avatar-sm" src="${H.avatarUrl({ photo: peerPhoto, name: peerName })}" alt="" />
          <strong>${H.esc(peerName)}</strong>
        </div>
        <div class="chat-msgs chat-msgs-room">${msgs.map((m) => {
          const mine = m.fromId === session.id;
          return `<div class="chat-bubble ${mine ? "mine" : "theirs"}"><span class="msg-time">${H.fmtTime(m.createdAt)}</span>${H.esc(m.body)}</div>`;
        }).join("") || `<p class="muted empty-chat">No messages yet.</p>`}</div>
        <form class="chat-form-inline" data-private-send data-guest="${guestId}" data-pro="${proId}">
          <input placeholder="Type a message…" required aria-label="Message" />
          <button class="btn btn-primary ix" type="submit">Send</button>
        </form>
      </div>` : `<p class="muted">Private chat locked until admin grants communication access.</p>`;

    return statusHtml + chatHtml;
  }

  function renderGuestDashboard(session, app, section) {
    const u = WeLink.getGuest(session.id);
    if (section === "pros") {
      const pros = WeLink.publicProProfiles(session.id);
      app.innerHTML = `<h1>Professionals</h1><p class="lede"><button class="link-btn" data-back>← Dashboard</button></p>
        <div class="pro-grid">${pros.length ? pros.map((p) => profileCard(p, "pro") + commRequestBtn(session, p)).join("") : `<p class="muted empty-state">No active professionals yet.</p>`}</div>`;
      bindGuestSection(session, app);
      return;
    }
    if (section === "guests") {
      const guests = WeLink.publicGuestProfiles(session.id);
      app.innerHTML = `<h1>Guest profiles</h1><p class="lede"><button class="link-btn" data-back>← Dashboard</button></p>
        <div class="pro-grid">${guests.length ? guests.map((g) => profileCard(g, "guest")).join("") : `<p class="muted empty-state">No other guest profiles yet.</p>`}</div>`;
      bindGuestSection(session, app);
      return;
    }
    if (section === "admin-comm") {
      const reqs = WeLink.load().adminCommRequests.filter((r) => r.fromId === session.id);
      app.innerHTML = `<h1>Admin communication</h1><p class="lede"><button class="link-btn" data-back>← Dashboard</button></p>
        <button class="btn btn-primary ix" data-req-admin>Request Communication With Admin</button>
        ${reqs.length ? `<ul class="req-list">${reqs.map((r) => `<li><span class="status-pill">${H.statusBadge(r.status)}</span> ${H.fmtTime(r.createdAt)}</li>`).join("")}</ul>` : ""}`;
      bindGuestSection(session, app);
      return;
    }
    if (section && section.startsWith("chat:")) {
      const proId = section.split(":")[1];
      const pro = WeLink.getPro(proId);
      app.innerHTML = `<h1>Chat with ${H.esc(pro?.name || "Professional")}</h1>
        <p class="lede"><button class="link-btn" data-view="pros">← Back to professionals</button></p>
        ${privateChatUI(session, session.id, proId, pro?.name, pro?.photo)}`;
      bindGuestSection(session, app);
      scrollChatToBottom(app);
      return;
    }

    const matches = WeLink.matchForGuest(u);
    app.innerHTML = `
      <div class="dash-top">
        <div><h1>Welcome, ${H.esc(u.name)}</h1><p class="lede">Guest dashboard</p></div>
      </div>
      <div class="profile-strip card">
        <img class="avatar-md" src="${H.avatarUrl(u)}" alt="" />
        <div><strong>${H.esc(u.name)}</strong><br><span class="muted">${H.esc(u.specialization)} · ${H.esc(u.town || "")}</span></div>
        <button class="btn btn-ghost ix btn-sm" data-edit-photo>Change photo</button>
      </div>
      ${dashButtons("guest")}
      <h2 class="section-head">Suggested professionals</h2>
      <div class="pro-grid">${matches.filter((p) => !p.sample).slice(0, 4).map((p) =>
        profileCard(p, "pro") + commRequestBtn(session, p) + `<button class="btn btn-ghost ix btn-sm" data-view="chat:${p.id}">Open chat</button>`
      ).join("") || `<p class="muted">Browse professionals using the button above.</p>`}</div>`;
    bindGuestSection(session, app);
  }

  function commRequestBtn(session, pro) {
    if (WeLink.canPrivateChat(session.id, pro.id)) return "";
    const req = WeLink.getCommRequest(session.id, pro.id);
    if (req?.status === "pending") return `<p class="muted">Request pending admin approval</p>`;
    if (req?.status === "rejected" && !WeLink.canReRequest(req.rejectedAt)) {
      return `<p class="muted">Rejected. Try again after 24 hours.</p>`;
    }
    return `<button class="btn btn-primary ix btn-sm" data-comm-req="${pro.id}">Request Communication</button>`;
  }

  function renderProDashboard(session, app, section) {
    const p = WeLink.getPro(session.id);
    const cd = renderCountdown(p);

    if (p.status === "rejected") {
      app.innerHTML = `<h1>${H.esc(p.name)}</h1><p class="err">Request declined. Re-upload below.</p>${proResubmitForm(p)}`;
      bindProResubmit(session, app);
      return;
    }
    if (["pending", "rejected"].includes(p.status)) {
      app.innerHTML = `<h1>${H.esc(p.name)}</h1>${proOnboardingUI(p)}`;
      if (p.status === "rejected") bindProResubmit(session, app);
      return;
    }
    if (p.status !== "approved") {
      app.innerHTML = `<h1>${H.esc(p.name)}</h1><p class="err">Your account is ${H.statusBadge(p.status)}. Contact admin for assistance.</p>`;
      return;
    }

    if (section === "pros") {
      const pros = WeLink.publicProProfiles(session.id);
      app.innerHTML = `${cd}<h1>Professionals</h1><p class="lede"><button class="link-btn" data-back>← Dashboard</button></p>
        <div class="pro-grid">${pros.map((x) => profileCard(x, "pro")).join("") || `<p class="muted empty-state">No other professionals.</p>`}</div>`;
      bindProSection(session, app);
      startCountdownTimer(app);
      return;
    }
    if (section === "guests") {
      const guests = WeLink.publicGuestProfiles();
      app.innerHTML = `${cd}<h1>Guest profiles</h1><p class="lede"><button class="link-btn" data-back>← Dashboard</button></p>
        <div class="pro-grid">${guests.map((g) => profileCard(g, "guest")).join("") || `<p class="muted empty-state">No guests yet.</p>`}</div>`;
      bindProSection(session, app);
      startCountdownTimer(app);
      return;
    }
    if (section === "admin-comm") {
      app.innerHTML = `${cd}<h1>Admin communication</h1><p class="lede"><button class="link-btn" data-back>← Dashboard</button></p>
        <button class="btn btn-primary ix" data-req-admin>Request Communication With Admin</button>`;
      bindProSection(session, app);
      startCountdownTimer(app);
      return;
    }
    if (section && section.startsWith("chat:")) {
      const guestId = section.split(":")[1];
      const guest = WeLink.getGuest(guestId);
      app.innerHTML = `${cd}<h1>Chat with ${H.esc(guest?.name || "Guest")}</h1>
        ${privateChatUI(session, guestId, session.id, guest?.name, guest?.photo)}`;
      bindProSection(session, app);
      scrollChatToBottom(app);
      startCountdownTimer(app);
      return;
    }

    const comms = WeLink.load().communicationRequests.filter((r) => r.proId === session.id);
    app.innerHTML = `
      ${cd}
      <div class="dash-top"><div><h1>${H.esc(p.name)}</h1><p class="lede">Professional dashboard · ${H.esc(p.skill)}</p></div></div>
      <div class="profile-strip card">
        <img class="avatar-md" src="${H.avatarUrl(p)}" alt="" />
        <div><strong>${H.esc(p.name)}</strong><br><span class="muted">${H.esc(p.location)}</span></div>
      </div>
      ${dashButtons("pro")}
      <h2 class="section-head">Communication requests</h2>
      ${comms.length ? comms.map((r) => `<div class="card comm-item">
        <img class="avatar-sm" src="${H.avatarUrl({ photo: r.guestPhoto, name: r.guestName })}" alt="" />
        <div><strong>${H.esc(r.guestName)}</strong> · <span class="status-pill status-${r.status}">${H.statusBadge(r.status)}</span>
        ${WeLink.canPrivateChat(r.guestId, session.id) ? `<button class="btn btn-ghost ix btn-sm" data-view="chat:${r.guestId}">Open chat</button>` : `<p class="muted">Waiting for admin approval.</p>`}</div>
      </div>`).join("") : `<p class="muted empty-state">No guest communication requests yet.</p>`}`;
    bindProSection(session, app);
    startCountdownTimer(app);
  }

  function profileSetupForm(session, currentPhoto) {
    return `<form class="card profile-setup" id="photo-form">
      <img class="avatar-lg" id="photo-prev" src="${H.avatarUrl({ photo: currentPhoto, name: session.name })}" alt="" />
      <label>Profile picture (optional) <input type="file" name="photo" accept="image/*" /></label>
      <button class="btn btn-primary ix" type="submit">Save profile picture</button>
    </form>`;
  }

  function proOnboardingUI(p) {
    if (p.status === "pending") return `<p class="muted">Your request is pending admin approval.</p>`;
    if (p.status === "rejected") return `<p class="err">Request declined. Re-upload below.</p>${proResubmitForm(p)}`;
    return "";
  }

  function proResubmitForm(p) {
    return `<form id="reup" class="card"><label>Name <input name="name" value="${H.esc(p.name)}" required /></label>
      <label>Skill <select name="skill">${WeLink.SKILLS.map((s) => `<option ${s === p.skill ? "selected" : ""}>${s}</option>`).join("")}</select></label>
      <label>Location <input name="location" value="${H.esc(p.location)}" required /></label>
      <label>Bio <textarea name="bio" required>${H.esc(p.bio)}</textarea></label>
      <label>Photo <input type="file" name="photo" accept="image/*" /></label>
      <button class="btn btn-primary ix" type="submit">Re-upload</button></form>`;
  }

  function scrollChatToBottom(root) {
    const box = root.querySelector(".chat-msgs-room");
    if (box) box.scrollTop = box.scrollHeight;
  }

  function startCountdownTimer(app) {
    const el = app.querySelector("#access-timer");
    if (!el) return;
    const expires = parseInt(el.dataset.expires, 10);
    if (!expires) return;
    clearInterval(el._timer);
    el._timer = setInterval(() => {
      const parts = H.countdownParts(expires);
      if (parts.expired) {
        el.classList.add("expired");
        el.querySelector(".timer-values").textContent = "EXPIRED";
        clearInterval(el._timer);
        return;
      }
      el.querySelector(".timer-values").textContent =
        `${parts.days}d : ${parts.hours}h : ${parts.minutes}m : ${parts.seconds}s`;
    }, 1000);
  }

  function bindProfileSetup(session, app) {
    const form = app.querySelector("#photo-form");
    if (!form) return;
    form.querySelector("[name=photo]")?.addEventListener("change", async (e) => {
      try {
        const data = await H.fileToData(e.target.files[0]);
        form.querySelector("#photo-prev").src = data;
      } catch (err) { alert(err.message); }
    });
    form.addEventListener("submit", async (e) => {
      e.preventDefault();
      if (!form.photo.files[0]) {
        WeLinkDashboard.render(session, app, "");
        return;
      }
      try {
        const photo = await H.fileToData(form.photo.files[0]);
        WeLink.updateProfilePhoto(session.id, session.role, photo);
        WeLinkDashboard.render(session, app, "");
      } catch (err) { alert(err.message); }
    });
  }

  function bindGuestSection(session, app) {
    app.querySelector("[data-back]")?.addEventListener("click", () => WeLinkDashboard.render(session, app, ""));
    app.querySelectorAll("[data-view]").forEach((b) => b.addEventListener("click", () => {
      WeLinkDashboard.render(session, app, b.dataset.view);
    }));
    app.querySelector("[data-req-admin]")?.addEventListener("click", () => {
      const res = WeLink.requestAdminCommunication(session.id, "guest");
      alert(res.ok ? "Request sent to admin." : res.error);
      WeLinkDashboard.render(session, app, "admin-comm");
    });
    app.querySelectorAll("[data-comm-req]").forEach((b) => b.addEventListener("click", async () => {
      const res = await WeLink.requestGuestCommunication(session.id, b.dataset.commReq);
      alert(res.ok ? "Request sent. The professional and admin have been notified." : res.error);
      WeLinkDashboard.render(session, app, "chat:" + b.dataset.commReq);
    }));
    app.querySelectorAll("[data-comm-receipt]").forEach((input) => {
      input.addEventListener("change", async () => {
        try {
          const img = await H.fileToData(input.files[0]);
          const res = WeLink.uploadCommReceipt(input.dataset.commReceipt, session.id, img);
          if (!res.ok) return alert(res.error);
          const box = app.querySelector(`[data-preview="${input.dataset.commReceipt}"]`);
          if (box) box.innerHTML = `<img src="${img}" alt="Receipt" />`;
          alert("Receipt uploaded. Admin will review.");
          WeLinkDashboard.render(session, app, global.__welinkSection?.get() || "");
        } catch (err) { alert(err.message); }
      });
    });
    app.querySelectorAll("[data-private-send]").forEach((form) => {
      form.addEventListener("submit", async (e) => {
        e.preventDefault();
        const guestId = form.dataset.guest;
        const proId = form.dataset.pro;
        const toId = session.role === "guest" ? proId : guestId;
        const toRole = session.role === "guest" ? "professional" : "guest";
        const res = await WeLink.sendPrivateMessage(session.id, session.role, toId, toRole, form.querySelector("input").value);
        if (!res.ok) return alert(res.error);
        WeLinkDashboard.render(session, app, "chat:" + (session.role === "guest" ? proId : guestId));
      });
    });
    app.querySelectorAll(".dash-btn").forEach((b) => b.addEventListener("click", () => {
      WeLinkDashboard.render(session, app, b.dataset.view);
    }));
    app.querySelector("[data-edit-photo]")?.addEventListener("click", () => {
      const acct = session.role === "guest" ? WeLink.getGuest(session.id) : WeLink.getPro(session.id);
      app.innerHTML = `<h1>Profile picture</h1><p class="lede"><button class="link-btn" data-back>← Dashboard</button></p>${profileSetupForm(session, acct?.photo)}`;
      bindProfileSetup(session, app);
      app.querySelector("[data-back]")?.addEventListener("click", () => WeLinkDashboard.render(session, app, ""));
    });
  }

  function bindProSection(session, app) {
    bindGuestSection(session, app);
  }

  function bindProResubmit(session, app) {
    app.querySelector("#reup")?.addEventListener("submit", async (e) => {
      e.preventDefault();
      const f = e.target;
      let photo;
      if (f.photo.files[0]) photo = await H.fileToData(f.photo.files[0]);
      const res = WeLink.resubmitPro(session.id, { name: f.name.value, skill: f.skill.value, location: f.location.value, bio: f.bio.value, phone: "", photo });
      if (res.ok) { await WeLink.emailAdmin(res.account); WeLink.notifyAdminWhatsApp(res.account); }
      location.reload();
    });
  }

  global.WeLinkDashboard = {
    render(session, app, section) {
      const activeSection = section || "";
      global.__welinkSection?.set(activeSection);
      if (session.role === "guest") renderGuestDashboard(session, app, activeSection);
      else renderProDashboard(session, app, activeSection);
    },
    renderCountdown,
    startCountdownTimer
  };
})(window);
