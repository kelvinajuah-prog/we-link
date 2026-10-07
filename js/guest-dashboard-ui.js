(function (global) {
  const H = () => global.WeLinkHelpers;

  const NAV = [
    { id: "home", view: "home", label: "Home", icon: "home" },
    { id: "discover", view: "browse", label: "Discover", icon: "compass" },
    { id: "events", view: "events", label: "Events", icon: "calendar" },
    { id: "messages", view: "inbox", label: "Messages", icon: "message", badge: true },
    { id: "help", view: "home", label: "Help", icon: "help", muted: true }
  ];

  function icon(name) {
    const icons = {
      home: '<path d="M4 10.5L12 4l8 6.5V20a1 1 0 0 1-1 1h-5v-6H10v6H5a1 1 0 0 1-1-1v-9.5z"/>',
      compass: '<circle cx="12" cy="12" r="9"/><path d="M16 8l-2.5 5.5L8 16l2.5-5.5L16 8z"/>',
      calendar: '<rect x="4" y="5" width="16" height="16" rx="2"/><path d="M8 3v4M16 3v4M4 11h16"/>',
      message: '<path d="M21 12a8 8 0 0 1-8 8H7l-4 3V12a8 8 0 0 1 8-8h4a8 8 0 0 1 8 8z"/>',
      users: '<path d="M17 21v-2a4 4 0 0 0-4-4H7a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M23 21v-2a4 4 0 0 0-3-3.87M16 3.13a4 4 0 0 1 0 7.75"/>',
      help: '<circle cx="12" cy="12" r="10"/><path d="M9.5 9.5a2.5 2.5 0 0 1 4.2 1.8c0 1.8-2.5 2-2.5 3.7M12 17h.01"/>'
    };
    return `<svg class="gd-nav-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" aria-hidden="true">${icons[name] || icons.home}</svg>`;
  }

  function shell({ activeView, guestView, user, msgCount, centerHtml, pageTitle }) {
    const navHtml = NAV.map((item) => {
      const active = item.view === guestView || (guestView === "detail" && item.view === "browse") || (guestView === "chat" && item.view === "inbox");
      const badge = item.badge && msgCount > 0 ? `<span class="gd-nav-badge">${msgCount > 9 ? "9+" : msgCount}</span>` : "";
      const cls = ["gd-nav-item", active ? "is-active" : "", item.muted ? "is-muted" : ""].filter(Boolean).join(" ");
      const attrs = item.muted ? 'data-guest-soon="1"' : `data-guest-view="${item.view}"`;
      return `<button type="button" class="${cls}" ${attrs}>
        ${icon(item.icon)}<span>${item.label}</span>${badge}
      </button>`;
    }).join("");

    const photo = H().avatarUrl(user);
    const displayName = user?.name || "Guest";

    return `<div class="gd-app">
      <aside class="gd-sidebar" aria-label="Main navigation">
        <a class="gd-brand welink-brand-block" href="dashboard.html">
          <img src="img/welink-logo.png" alt="WeLink — Connect · Collaborate · Grow" class="welink-logo welink-logo-sidebar gd-brand-logo" />
          <span class="welink-profession-line">Fashion Designer · Dancer · Chef · Cook</span>
        </a>
        <nav class="gd-nav">${navHtml}</nav>
        <div class="gd-sidebar-promo">
          <p class="gd-sidebar-promo-title">Build Your Future With WeLink</p>
          <button type="button" class="gd-sidebar-promo-btn" data-guest-view="browse">Explore Now →</button>
        </div>
      </aside>
      <div class="gd-main">
        <header class="gd-topbar">
          <form class="gd-search" role="search" data-guest-search-form>
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" aria-hidden="true"><circle cx="11" cy="11" r="7"/><path d="M20 20l-3-3"/></svg>
            <input type="search" name="q" placeholder="Search professionals, skills, communities…" aria-label="Search" />
          </form>
          <div class="gd-topbar-actions">
            <button type="button" class="gd-icon-btn" aria-label="Notifications" data-guest-view="inbox">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8"><path d="M18 8a6 6 0 0 0-12 0c0 7-3 9-3 9h18s-3-2-3-9"/><path d="M13.73 21a2 2 0 0 1-3.46 0"/></svg>
              ${msgCount > 0 ? `<span class="gd-notif-dot">${msgCount > 9 ? "9+" : msgCount}</span>` : ""}
            </button>
            <div class="gd-user-chip">
              <img src="${photo}" alt="" class="gd-user-avatar" />
              <span>Guest Account</span>
              <svg class="gd-chevron" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M6 9l6 6 6-6"/></svg>
            </div>
            <button type="button" class="gd-btn-logout" data-guest-logout>Log out</button>
          </div>
        </header>
        ${pageTitle ? `<div class="gd-page-head"><h1 class="gd-page-title">${pageTitle}</h1></div>` : ""}
        <div class="gd-body">${centerHtml}</div>
      </div>
    </div>`;
  }

  function heroBanner(user) {
    const photo = H().avatarUrl(user);
    const name = user?.name ? H().esc(user.name.split(/\s+/)[0]) : "Guest";
    return `<section class="gd-hero">
      <div class="gd-hero-copy">
        <p class="gd-hero-kicker">WELCOME, ${name.toUpperCase()}</p>
        <h2 class="gd-hero-title">Discover. Connect. Grow with WeLink.</h2>
        <p class="gd-hero-sub">Find professionals, join events, and unlock new opportunities across Yaoundé and beyond.</p>
        <div class="gd-hero-pills">
          <span><span class="gd-dot gd-dot-teal"></span> Connect</span>
          <span><span class="gd-dot gd-dot-purple"></span> Learn</span>
          <span><span class="gd-dot gd-dot-pink"></span> Grow</span>
        </div>
      </div>
      <div class="gd-hero-visual">
        <div class="gd-hero-art" aria-hidden="true">
          <div class="gd-hero-swirl gd-hero-swirl-a"></div>
          <div class="gd-hero-swirl gd-hero-swirl-b"></div>
          <div class="gd-hero-swirl gd-hero-swirl-c"></div>
          <p class="gd-impact-text">Connect • Collaborate • Grow</p>
        </div>
        <p class="gd-journey-text">Your Journey<br>Starts Here</p>
        <img src="${photo}" alt="${H().esc(user?.name || "Guest")}" class="gd-hero-portrait" width="280" height="280" />
      </div>
    </section>`;
  }

  function profileSection(user, activeTab, locationLine) {
    const tabs = [
      { id: "overview", label: "Overview", view: "home" },
      { id: "connections", label: "Connections", view: "browse" },
      { id: "messages", label: "Messages", view: "inbox" },
      { id: "events", label: "Events", view: "events" }
    ];
    const tabHtml = tabs
      .map((t) => {
        const on = t.id === activeTab;
        return `<button type="button" class="gd-tab ${on ? "is-active" : ""}" data-guest-view="${t.view}">${t.label}</button>`;
      })
      .join("");
    const spec = user.specialization ? H().esc(user.specialization) : "Member";
    const loc = locationLine || "";

    return `<section class="gd-profile-card">
      <div class="gd-profile-row">
        <div class="gd-profile-photo-wrap">
          <img class="gd-profile-photo" src="${H().avatarUrl(user)}" alt="" />
          <span class="gd-guest-badge">Guest</span>
        </div>
        <div class="gd-profile-meta">
          <h3 class="gd-profile-name">${H().esc(user.name)}${user.age ? `, ${user.age}` : ""}</h3>
          <p class="gd-profile-role">Guest · ${spec}</p>
          <p class="gd-profile-loc"><span class="gd-pin" aria-hidden="true">📍</span> ${loc}</p>
        </div>
        <div class="gd-profile-actions">
          <button type="button" class="gd-btn-outline" data-guest-view="edit">Edit Profile</button>
          <button type="button" class="gd-btn-gradient gd-btn-sm" data-guest-view="browse">Browse Professionals</button>
        </div>
      </div>
      <div class="gd-tabs" role="tablist">${tabHtml}</div>
    </section>`;
  }

  function recommendedCard(pro, commBlock) {
    const proPhoto = H().avatarUrl(pro);
    const skillTag = pro.skill ? `<span class="gd-tag gd-tag-skill">${H().esc(pro.skill)}</span>` : "";
    const bioBits = String(pro.bio || pro.achievements || "")
      .split(/[\s,]+/)
      .filter((w) => w.length > 2)
      .slice(0, 4)
      .map((t) => `<span class="gd-tag">${H().esc(t.slice(0, 20))}</span>`)
      .join("");
    return `<article class="gd-rec-card">
      <div class="gd-rec-main">
        <div class="gd-rec-head">
          <img src="${proPhoto}" alt="" class="gd-rec-avatar" />
          <div>
            <h4>${H().esc(pro.name)}</h4>
            <p class="gd-rec-loc">${H().esc(pro.location || "")}</p>
          </div>
        </div>
        <div class="gd-rec-tags">${skillTag}${bioBits}</div>
        <div class="gd-rec-actions">${commBlock}
          <button type="button" class="gd-btn-dark" data-pro-detail="${pro.id}">View profile →</button>
        </div>
      </div>
      <div class="gd-rec-visual" style="background-image:url('${proPhoto}')" role="img" aria-label="${H().esc(pro.name)} profile"></div>
    </article>`;
  }

  function rightRail(db, guestId) {
    const reqs = (db?.communicationRequests || []).filter((r) => r.guestId === guestId);
    const pending = reqs.filter((r) => r.status === "pending").length;
    const msgBadge = pending > 0 ? pending : 2;
    const activity = [
      { label: "Profile Viewed", sub: "Someone viewed your profile", time: "2h ago", dot: "teal" },
      { label: "New Message", sub: `You have ${msgBadge} new message${msgBadge === 1 ? "" : "s"}`, time: "4h ago", dot: "pink", badge: msgBadge },
      { label: "Community Invite", sub: "You've been invited to a community", time: "1d ago", dot: "purple" },
      { label: "Event Reminder", sub: "Networking Event starts tomorrow", time: "1d ago", dot: "blue" }
    ];
    return `<aside class="gd-rail">
      <div class="gd-panel">
        <h3 class="gd-panel-title">Quick Actions</h3>
        <ul class="gd-quick-list">
          <li><button type="button" class="gd-quick-featured" data-guest-view="browse"><span class="gd-quick-icon gd-qi-purple"></span><span class="gd-quick-copy"><strong>Find Professionals</strong><small>Browse verified talent near you</small></span><span class="gd-quick-arrow" aria-hidden="true">›</span></button></li>
          <li><button type="button" data-guest-view="events"><span class="gd-quick-icon gd-qi-teal"></span><span class="gd-quick-copy"><strong>Explore Events</strong><small>Countdown to professional meetups</small></span><span class="gd-quick-arrow" aria-hidden="true">›</span></button></li>
          <li><button type="button" data-guest-soon="1"><span class="gd-quick-icon gd-qi-gray"></span><span class="gd-quick-copy"><strong>Learn New Skills</strong><small>Access curated learning paths</small></span><span class="gd-quick-arrow" aria-hidden="true">›</span></button></li>
        </ul>
      </div>
      <div class="gd-panel">
        <h3 class="gd-panel-title">Your Activity</h3>
        <ul class="gd-activity-list">
          ${activity
            .map(
              (a) => `<li><span class="gd-act-dot gd-act-${a.dot}"></span><div><strong>${a.label}</strong><span class="gd-act-sub">${a.sub}</span><span class="gd-act-time">${a.time}${a.badge ? ` <em class="gd-act-badge">${a.badge}</em>` : ""}</span></div></li>`
            )
            .join("")}
        </ul>
      </div>
      <div class="gd-panel gd-panel-cta">
        <h3>Go Further with WeLink</h3>
        <p>Sign up for a free account to get full access to all features and connect with more professionals.</p>
        <a class="gd-btn-white" href="register-seeker.html">Create Account →</a>
      </div>
    </aside>`;
  }

  function layoutHome({ user, matches, commHtmlFn, db, guestId, locationLine }) {
    const cards = matches.length
      ? matches.map((p) => recommendedCard(p, commHtmlFn(p.id))).join("")
      : `<p class="gd-empty">Browse the directory to find professionals matched to your skills.</p>`;
    const center = `<div class="gd-layout-home">
      ${heroBanner(user)}
      ${profileSection(user, "overview", locationLine)}
      <section class="gd-rec-section">
        <div class="gd-rec-headrow">
          <h3><span class="gd-spark">✦</span> Recommended for you</h3>
          <button type="button" class="gd-link-btn" data-guest-view="browse">View All →</button>
        </div>
        <div class="gd-rec-grid">${cards}</div>
      </section>
    </div>`;
    const msgCount = (db?.communicationRequests || []).filter((r) => r.guestId === guestId && r.status === "pending").length;
    return shell({
      guestView: "home",
      user,
      msgCount,
      centerHtml: `<div class="gd-content-with-rail">${center}${rightRail(db, guestId)}</div>`
    });
  }

  function editProfileForm(user, skills) {
    const opts = (skills || [])
      .map((sk) => `<option value="${H().esc(sk)}" ${sk === user.specialization ? "selected" : ""}>${H().esc(sk)}</option>`)
      .join("");
    return `<form id="guest-edit-form" class="gd-edit-form gd-panel">
      <p class="gd-edit-lede">Update your guest profile. Changes apply immediately on your dashboard.</p>
      <img class="gd-edit-preview" id="guest-edit-preview" src="${H().avatarUrl(user)}" alt="" />
      <div class="gd-edit-grid two">
        <label>Full name <input name="name" required value="${H().esc(user.name || "")}" /></label>
        <label>Age <input type="number" name="age" min="16" max="99" required value="${user.age || ""}" /></label>
      </div>
      <div class="gd-edit-grid two">
        <label>Town / city <input name="town" required value="${H().esc(user.town || "")}" /></label>
        <label>Area / neighbourhood <input name="area" required value="${H().esc(user.area || "")}" /></label>
      </div>
      <label>Area of specialisation <select name="specialization" required>${opts}</select></label>
      <label>Skills <input name="skills" required value="${H().esc(user.skills || "")}" /></label>
      <label>Profile photo <input type="file" name="photo" accept="image/*" /></label>
      <p class="login-err gd-edit-err" id="guest-edit-err" hidden></p>
      <div class="gd-edit-actions">
        <button type="button" class="gd-btn-dark" data-guest-view="home">Cancel</button>
        <button type="submit" class="gd-btn-gradient">Save changes</button>
      </div>
    </form>`;
  }

  function layoutInner({ guestView, user, msgCount, title, bodyHtml }) {
    return shell({
      guestView,
      user,
      msgCount,
      pageTitle: title,
      centerHtml: `<div class="gd-inner-page">${bodyHtml}</div>`
    });
  }

  global.WeLinkGuestUI = {
    layoutHome,
    layoutInner,
    editProfileForm,
    recommendedCard,
    shell
  };
})(window);
