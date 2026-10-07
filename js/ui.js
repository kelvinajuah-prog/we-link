(function (global) {
  const logo =
    '<img class="welink-logo welink-logo-nav" src="img/welink-logo.png" alt="WeLink — Connect · Collaborate · Grow" />';

  function dest() {
    const s = WeLink.session();
    if (!s) return { login: "login.html", extra: '<a class="btn btn-primary ix" href="register.html">Get Started</a>' };
    if (s.role === "admin") return { login: "admin.html", extra: '<a class="btn btn-ghost ix" href="admin.html">Admin</a><button class="btn btn-ghost ix" data-logout>Log out</button>' };
    return { login: "dashboard.html", extra: '<a class="btn btn-primary ix" href="dashboard.html">Account</a><button class="btn btn-ghost ix" data-logout>Log out</button>' };
  }

  async function renderHeader(root) {
    await WeLink.ready;
    const s = WeLink.session();
    const d = dest();
    const notes = s && s.id ? await WeLink.unread(s.id) : [];
    const db = s ? await WeLink.load() : null;
    const bell = s && s.id
      ? `<div class="bell-wrap">
          <button class="bell ix" type="button" data-bell aria-label="Notifications">🔔${notes.length ? `<span class="bell-count">${notes.length}</span>` : ""}</button>
          <div class="notes" data-notes>${
            (db && db.notifications.filter((n) => n.ownerId === s.id).slice(0, 12).map((n) =>
              `<div class="note ${n.read ? "" : "unread"}">${n.message}</div>`
            ).join("")) || "<div class='note muted'>No notifications yet.</div>"
          }</div>
        </div>`
      : "";
    root.innerHTML = `<div class="wrap top">
      <a class="brand ix" href="index.html">${logo}</a>
      <div class="nav-right">
        ${bell}
        <a class="ix" href="${d.login}">${s ? s.name : "Log In"}</a>
        ${d.extra}
      </div>
    </div>`;
    root.querySelector("[data-logout]")?.addEventListener("click", async () => {
      await WeLink.logout();
      location.href = "index.html";
    });
    const bellBtn = root.querySelector("[data-bell]");
    const box = root.querySelector("[data-notes]");
    bellBtn?.addEventListener("click", async () => {
      box.classList.toggle("open");
      if (s && s.id) await WeLink.markRead(s.id);
      const c = bellBtn.querySelector(".bell-count");
      if (c) c.remove();
    });
  }

  async function requireRole(role) {
    await WeLink.ready;
    const s = WeLink.session();
    if (!s) {
      location.href = role === "admin" ? "login.html?role=admin" : "login.html";
      return null;
    }
    if (role && s.role !== role) {
      if (role === "admin") location.href = "login.html?role=admin";
      else if (s.role === "admin") location.href = "admin.html";
      else if (s.role === "professional") location.href = "dashboard.html";
      else location.href = "login.html";
      return null;
    }
    return s;
  }

  function fileToData(file) {
    return new Promise((resolve) => {
      if (!file) return resolve("");
      const r = new FileReader();
      r.onload = () => resolve(r.result);
      r.readAsDataURL(file);
    });
  }

  global.WeLinkUI = { renderHeader, requireRole, fileToData, logo };
})(window);
