(function (global) {
  const H = () => global.WeLinkHelpers;

  const NAV = [
    { view: "home", label: "Home", icon: "home" },
    { view: "browse", label: "Network", icon: "network" },
    { view: "home", label: "Jobs & Opportunities", icon: "briefcase", soon: true },
    { view: "messages", label: "Messages", icon: "message", badge: true },
    { view: "events", label: "Events", icon: "calendar" },
    { view: "home", label: "Learning", icon: "book", soon: true },
    { view: "home", label: "Wallet & Payments", icon: "wallet", soon: true },
    { view: "home", label: "Settings", icon: "settings", soon: true }
  ];

  function icon(name) {
    const icons = {
      home: '<path d="M4 10.5L12 4l8 6.5V20a1 1 0 0 1-1 1h-5v-6H10v6H5a1 1 0 0 1-1-1v-9.5z"/>',
      network: '<circle cx="12" cy="12" r="3"/><path d="M12 2v4M12 18v4M4.93 4.93l2.83 2.83M16.24 16.24l2.83 2.83M2 12h4M18 12h4M4.93 19.07l2.83-2.83M16.24 7.76l2.83-2.83"/>',
      briefcase: '<rect x="3" y="7" width="18" height="13" rx="2"/><path d="M8 7V5a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"/>',
      message: '<path d="M21 12a8 8 0 0 1-8 8H7l-4 3V12a8 8 0 0 1 8-8h4a8 8 0 0 1 8 8z"/>',
      users: '<path d="M17 21v-2a4 4 0 0 0-4-4H7a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/>',
      book: '<path d="M4 19.5A2.5 2.5 0 0 1 6.5 17H20"/><path d="M6.5 2H20v20H6.5A2.5 2.5 0 0 1 4 19.5v-15A2.5 2.5 0 0 1 6.5 2z"/>',
      calendar: '<rect x="4" y="5" width="16" height="16" rx="2"/><path d="M8 3v4M16 3v4M4 11h16"/>',
      wallet: '<rect x="2" y="6" width="20" height="14" rx="2"/><path d="M16 12h.01"/>',
      settings: '<circle cx="12" cy="12" r="3"/><path d="M12 1v2M12 21v2M4.22 4.22l1.42 1.42M18.36 18.36l1.42 1.42M1 12h2M21 12h2M4.22 19.78l1.42-1.42M18.36 5.64l1.42-1.42"/>'
    };
    return `<svg class="pd-nav-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8">${icons[name] || icons.home}</svg>`;
  }

  function shell({ proView, pro, msgCount, bodyHtml, pageTitle }) {
    const navHtml = NAV.map((item) => {
      const active =
        item.view === proView ||
        (proView === "detail" && item.view === "browse") ||
        (proView === "chat" && item.view === "messages");
      const badge = item.badge && msgCount > 0 ? `<span class="pd-nav-badge">${msgCount > 9 ? "9+" : msgCount}</span>` : "";
      const cls = ["pd-nav-item", active ? "is-active" : "", item.soon ? "is-muted" : ""].filter(Boolean).join(" ");
      const attrs = item.soon ? 'data-pro-soon="1"' : `data-pro-view="${item.view}"`;
      return `<button type="button" class="${cls}" ${attrs}>${icon(item.icon)}<span>${item.label}</span>${badge}</button>`;
    }).join("");

    const photo = H().avatarUrl(pro);
    return `<div class="pd-app">
      <aside class="pd-sidebar">
        <a class="pd-brand welink-brand-block" href="dashboard.html">
          <img src="img/welink-logo.png" alt="WeLink — Connect · Collaborate · Grow" class="welink-logo welink-logo-sidebar pd-brand-logo" />
          <span class="welink-profession-line">Fashion Designer · Dancer · Chef · Cook</span>
        </a>
        <nav class="pd-nav">${navHtml}</nav>
        <div class="pd-sidebar-promo">
          <span class="pd-crown" aria-hidden="true">👋</span>
          <p>Done for now? Sign out securely from your professional account.</p>
          <button type="button" class="pd-btn-logout pd-btn-sm" data-pro-logout>Log out</button>
        </div>
      </aside>
      <div class="pd-main">
        <header class="pd-topbar">
          <form class="pd-search" data-pro-search-form>
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="11" cy="11" r="7"/><path d="M20 20l-3-3"/></svg>
            <input type="search" name="q" placeholder="Search professionals, skills, communities…" />
          </form>
          <div class="pd-topbar-actions">
            <button type="button" class="pd-icon-btn" data-pro-view="messages" aria-label="Notifications">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8"><path d="M18 8a6 6 0 0 0-12 0c0 7-3 9-3 9h18s-3-2-3-9"/><path d="M13.73 21a2 2 0 0 1-3.46 0"/></svg>
              ${msgCount ? `<span class="pd-notif-dot">${msgCount > 9 ? "9+" : msgCount}</span>` : ""}
            </button>
            <div class="pd-user-chip">
              <img src="${photo}" alt="" />
              <div><strong>${H().esc(pro.name)}</strong><span>Professional Account</span></div>
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M6 9l6 6 6-6"/></svg>
            </div>
            <button type="button" class="pd-btn-logout" data-pro-logout>Log out</button>
          </div>
        </header>
        ${pageTitle ? `<div class="pd-page-head"><h1>${pageTitle}</h1></div>` : ""}
        <div class="pd-body">${bodyHtml}</div>
      </div>
    </div>`;
  }

  function heroPro(pro, verified, stats) {
    const conn = stats?.connections ?? 0;
    const title = `${H().esc(pro.skill || "Professional")} · ${pro.bio ? H().esc(String(pro.bio).slice(0, 40)) : "Creative Director"}`;
    return `<section class="pd-hero">
      <div class="pd-hero-bg"></div>
      <button type="button" class="pd-edit-profile" data-pro-view="edit">✎ Edit Profile</button>
      <div class="pd-hero-inner">
        <div class="pd-hero-portrait-wrap">
          <img class="pd-hero-portrait" src="${H().avatarUrl(pro)}" alt="${H().esc(pro.name)}" />
        </div>
        <div class="pd-hero-meta">
          ${verified ? '<span class="pd-online"><span class="pd-online-dot"></span> Online</span>' : ""}
          <h2 class="pd-hero-name">${H().esc(pro.name)} ${verified ? '<span class="pd-verified" title="Verified">✓</span>' : ""}</h2>
          <p class="pd-hero-title">${title}</p>
          <p class="pd-hero-loc">${H().esc(pro.location || "Yaoundé, Cameroon")}</p>
          <div class="pd-hero-stats">
            <span>👥 <strong>${conn}</strong> Connections</span>
            <span>📅 <strong>${stats?.events ?? 0}</strong> Upcoming Events</span>
          </div>
        </div>
        <p class="pd-impact-text">Connect • Collaborate • Grow</p>
      </div>
    </section>`;
  }

  function tabs(proView) {
    const items = [
      { id: "overview", label: "Overview", view: "home" },
      { id: "connections", label: "Connections", view: "browse" },
      { id: "messages", label: "Messages", view: "messages" },
      { id: "events", label: "Events", view: "events" },
      { id: "learning", label: "Learning", view: "home", soon: true }
    ];
    return `<div class="pd-tabs">${items
      .map((t) => {
        const on = t.view === proView || (proView === "home" && t.id === "overview");
        const attrs = t.soon ? 'data-pro-soon="1"' : `data-pro-view="${t.view}"`;
        return `<button type="button" class="pd-tab ${on ? "is-active" : ""}" ${attrs}>${t.label}</button>`;
      })
      .join("")}</div>`;
  }

  function skillTags(pro) {
    const tags = [pro.skill, "Creativity", "Art & Design", "Leadership"].filter(Boolean);
    return tags
      .slice(0, 4)
      .map((t) => `<span class="pd-skill-tag">${H().esc(String(t))}</span>`)
      .join("");
  }

  function layoutHome({ pro, proView, msgCount, db, commHtml, stats, activityHtml }) {
    const verified = pro.status === "approved";
    const center = `<div class="pd-home-grid">
      <div class="pd-home-main">
        ${heroPro(pro, verified, stats)}
        ${tabs(proView)}
        <div class="pd-cards-grid">
          <article class="pd-panel pd-profile-overview">
            <h3>Profile Overview</h3>
            <div class="pd-mini-profile">
              <img src="${H().avatarUrl(pro)}" alt="" />
              <div>
                <strong>${H().esc(pro.name)}</strong>
                <p>${H().esc(pro.skill)} · ${H().esc(pro.location)}</p>
              </div>
            </div>
            <p class="pd-bio">${H().esc(pro.bio || "Designing the future of fashion.")}</p>
            <div class="pd-skill-tags">${skillTags(pro)}</div>
          </article>
          <article class="pd-panel">
            <h3>Communication Requests</h3>
            <div class="pd-comm-list">${commHtml}</div>
          </article>
          <article class="pd-panel">
            <h3>Recent Activity</h3>
            <ul class="pd-activity">${activityHtml}</ul>
          </article>
          <article class="pd-panel pd-stats-panel">
            <h3>Your Stats</h3>
            <div class="pd-stats-grid">
              <div><span class="pd-stat-val">${stats.connections}</span><span class="pd-stat-lbl">Total Connections</span></div>
              <div><span class="pd-stat-val">${stats.events}</span><span class="pd-stat-lbl">Upcoming Events</span></div>
              <div><span class="pd-stat-val">${stats.learning}</span><span class="pd-stat-lbl">Learning Paths</span></div>
            </div>
          </article>
        </div>
      </div>
      ${rightRail(pro, verified, stats)}
    </div>`;
    return shell({ proView: proView || "home", pro, msgCount, bodyHtml: center });
  }

  function rightRail(pro, verified, stats) {
    return `<aside class="pd-rail">
      <div class="pd-panel pd-rail-profile">
        <img src="${H().avatarUrl(pro)}" alt="" class="pd-rail-avatar" />
        <h4>${H().esc(pro.name)} ${verified ? '<span class="pd-verified">✓</span>' : ""}</h4>
        <p class="pd-rail-sub">Professional Account</p>
        ${verified ? '<span class="pd-verified-badge">Verified Professional</span>' : `<span class="pd-status-badge">${H().esc(pro.status || "")}</span>`}
        <div class="pd-rail-mini-stats">
          <div><strong>—</strong><span>Connections</span></div>
          <div><strong>${stats?.events ?? 0}</strong><span>Events</span></div>
        </div>
      </div>
      <div class="pd-panel">
        <h3>Quick Actions</h3>
        <ul class="pd-quick">
          <li><button type="button" data-pro-view="browse"><span class="pd-qa-icon">🔍</span> Find Professionals <span class="pd-chev">›</span></button></li>
          <li><button type="button" data-pro-soon="1"><span class="pd-qa-icon">💼</span> Explore Jobs <span class="pd-chev">›</span></button></li>
          <li><button type="button" data-pro-view="events"><span class="pd-qa-icon">📅</span> Schedule Events <span class="pd-chev">›</span></button></li>
          <li><button type="button" data-pro-soon="1"><span class="pd-qa-icon">📚</span> Learn New Skills <span class="pd-chev">›</span></button></li>
        </ul>
      </div>
      <div class="pd-panel pd-logout-card">
        <span class="pd-rocket" aria-hidden="true">⎋</span>
        <p>Sign out when you're finished. You can log back in anytime.</p>
        <button type="button" class="pd-btn-logout pd-btn-block" data-pro-logout>Log out</button>
      </div>
    </aside>`;
  }

  function editProfileForm(pro) {
    return `<form id="pro-edit-form" class="pd-edit-form pd-panel">
      <p class="pd-muted" style="margin-bottom:16px">Update your professional profile. Approved accounts stay active after saving.</p>
      <img class="pd-edit-preview" id="pro-edit-preview" src="${H().avatarUrl(pro)}" alt="" />
      <label>Full name <input name="name" required value="${H().esc(pro.name || "")}" /></label>
      <label class="skills-picker-label">Skills
        <span class="pd-muted" style="font-weight:500;font-size:12px">Search, add custom skills, click a tag to edit.</span>
        <div id="pro-edit-skills" data-skills-picker></div>
      </label>
      <label>Location <input name="location" required value="${H().esc(pro.location || "")}" /></label>
      <label>Phone (WhatsApp) <input name="phone" value="${H().esc(pro.phone || "")}" placeholder="+237..." /></label>
      <label>Bio <textarea name="bio" required>${H().esc(pro.bio || "")}</textarea></label>
      <label>Achievements <textarea name="achievements">${H().esc(pro.achievements || "")}</textarea></label>
      <label>Profile photo <input type="file" name="photo" accept="image/*" /></label>
      <p class="err" id="pro-edit-err" hidden></p>
      <div class="gd-edit-actions" style="display:flex;gap:10px;margin-top:16px">
        <button type="button" class="pd-btn-logout" data-pro-view="home">Cancel</button>
        <button type="submit" class="pd-btn-gold">Save changes</button>
      </div>
    </form>`;
  }

  function layoutInner({ proView, pro, msgCount, title, innerHtml }) {
    return shell({
      proView,
      pro,
      msgCount,
      pageTitle: title,
      bodyHtml: `<div class="pd-inner">${innerHtml}</div>`
    });
  }

  function pendingLayout(pro) {
    return layoutInner({
      proView: "home",
      pro,
      msgCount: 0,
      title: "",
      innerHtml: `<div class="pd-panel pd-notice">
        <h2>${H().esc(pro.name)}</h2>
        <p class="pd-muted">${H().esc(pro.skill)} · ${H().esc(pro.location)}</p>
        <span class="pd-status-badge">${H().esc(pro.status)}</span>
        <p style="margin-top:16px">Your request is saved and pending admin approval. You will be able to browse and connect once approved.</p>
        <button type="button" class="pd-btn-gold" style="margin-top:16px" data-pro-view="edit">Edit profile</button>
      </div>`
    });
  }

  global.WeLinkProUI = { layoutHome, layoutInner, editProfileForm, pendingLayout, shell, heroPro, tabs };
})(window);
