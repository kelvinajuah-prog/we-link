(function (global) {
  const THEME_KEY = "welink-theme";
  const INSTALL_KEY = "welink-install-dismissed";
  const PREF_KEY = "welink-notification-prefs";
  const DEFAULT_PREFS = {
    communicationRequests: true,
    newMessages: true,
    requestAccepted: true,
    communicationStatus: true,
    professionalVerification: true,
    adminNotifications: true
  };

  function readThemePref() {
    try {
      const v = localStorage.getItem(THEME_KEY);
      if (v === "light" || v === "dark" || v === "system") return v;
    } catch (e) { /* ignore */ }
    return "system";
  }

  function resolveTheme(pref) {
    if (pref === "light" || pref === "dark") return pref;
    return window.matchMedia("(prefers-color-scheme: dark)").matches ? "dark" : "light";
  }

  function applyTheme(pref) {
    const theme = resolveTheme(pref);
    const root = document.documentElement;
    root.setAttribute("data-theme", theme);
    root.setAttribute("data-theme-pref", pref);
    root.style.colorScheme = theme;
    const meta = document.querySelector('meta[name="theme-color"]');
    if (meta) meta.setAttribute("content", theme === "light" ? "#f5f5f5" : "#0c2229");
    document.querySelectorAll("[data-wl-theme-option]").forEach((btn) => {
      btn.setAttribute("aria-checked", btn.getAttribute("data-wl-theme-option") === pref ? "true" : "false");
    });
    document.querySelectorAll('input[name="wl-theme"]').forEach((el) => {
      el.checked = el.value === pref;
    });
  }

  function setTheme(pref) {
    if (pref !== "light" && pref !== "dark" && pref !== "system") pref = "system";
    try { localStorage.setItem(THEME_KEY, pref); } catch (e) { /* ignore */ }
    applyTheme(pref);
  }

  function getPrefs() {
    try {
      const raw = JSON.parse(localStorage.getItem(PREF_KEY) || "{}");
      return Object.assign({}, DEFAULT_PREFS, raw);
    } catch (e) {
      return Object.assign({}, DEFAULT_PREFS);
    }
  }

  function setPref(key, on) {
    if (!(key in DEFAULT_PREFS)) return;
    const next = getPrefs();
    next[key] = !!on;
    try { localStorage.setItem(PREF_KEY, JSON.stringify(next)); } catch (e) { /* ignore */ }
  }

  function classifyNotification(message, role) {
    const t = String(message || "").toLowerCase();
    if (t.includes("verified") || (t.includes("professional") && (t.includes("approved") || t.includes("rejected")))) {
      return "professionalVerification";
    }
    if (t.includes("new message") || t.includes("sent you a message")) return "newMessages";
    if (t.includes("accepted")) return "requestAccepted";
    if (t.includes("suspend") || t.includes("resumed") || t.includes("ended") || t.includes("deleted")) {
      return "communicationStatus";
    }
    if (t.includes("request") || t.includes("wants to communicate")) return "communicationRequests";
    return role === "admin" ? "adminNotifications" : "communicationRequests";
  }

  function categoryAllowed(category) {
    if (!category || category === "security") return true;
    const prefs = getPrefs();
    return prefs[category] !== false;
  }

  function notify({ category, title, body, tag, url }) {
    if (!categoryAllowed(category)) return;
    if (typeof Notification === "undefined") return;
    if (Notification.permission !== "granted") return;
    if (document.visibilityState === "visible" && !document.hidden && category === "newMessages") return;
    const payload = {
      type: "NOTIFY",
      title: title || "WeLink",
      body: body || "",
      tag: tag || category || "welink",
      url: url || "dashboard.html"
    };
    if (navigator.serviceWorker?.controller) {
      navigator.serviceWorker.controller.postMessage(payload);
      return;
    }
    try {
      new Notification(payload.title, {
        body: payload.body,
        icon: "icons/icon-192.png",
        tag: payload.tag
      });
    } catch (e) { /* ignore */ }
  }

  async function enableBrowserNotifications() {
    if (!("Notification" in window)) return "unsupported";
    if (Notification.permission === "granted") return "granted";
    if (Notification.permission === "denied") return "denied";
    return Notification.requestPermission();
  }

  function themeMenuHtml() {
    const pref = readThemePref();
    const opts = [
      { id: "light", label: "Light", icon: "☀️" },
      { id: "dark", label: "Dark", icon: "🌙" },
      { id: "system", label: "System", icon: "⚙️" }
    ];
    return `<div class="wl-theme-wrap" data-wl-theme-wrap>
      <button type="button" class="wl-theme-btn" data-wl-theme-toggle aria-haspopup="true" aria-expanded="false" aria-label="Appearance">
        <span aria-hidden="true">${pref === "light" ? "☀️" : pref === "dark" ? "🌙" : "⚙️"}</span>
      </button>
      <div class="wl-theme-menu" role="menu" hidden>
        ${opts.map((o) => `<button type="button" role="menuitemradio" class="wl-theme-option" data-wl-theme-option="${o.id}" aria-checked="${pref === o.id ? "true" : "false"}">${o.icon} ${o.label}</button>`).join("")}
      </div>
    </div>`;
  }

  function settingsPanelHtml(role) {
    const pref = readThemePref();
    const prefs = getPrefs();
    const guest = role === "guest";
    const pro = role === "professional";
    const admin = role === "admin";
    const rows = [];
    if (guest || pro) {
      rows.push(["communicationRequests", "Communication requests"]);
      rows.push(["newMessages", "New messages"]);
      rows.push(["requestAccepted", "Request accepted"]);
      rows.push(["communicationStatus", "Communication status changes"]);
    }
    if (pro) rows.push(["professionalVerification", "Professional verification"]);
    if (admin) {
      rows.push(["adminNotifications", "Admin / platform events"]);
      rows.push(["communicationRequests", "Communication requests needing action"]);
      rows.push(["newMessages", "Monitored conversation activity"]);
    }
    const switches = rows.map(([key, label]) => `
      <label class="wl-switch-row">
        <span>${label}</span>
        <span class="wl-switch">
          <input type="checkbox" data-notif-pref="${key}" ${prefs[key] ? "checked" : ""} />
          <span></span>
        </span>
      </label>`).join("");

    return `<div class="wl-settings">
      <section class="wl-settings-card">
        <h3>Appearance</h3>
        <p>Light, Dark, or match your device. Your choice is saved on this device.</p>
        <label class="wl-radio-row"><span>☀️ Light</span><input type="radio" name="wl-theme" value="light" ${pref === "light" ? "checked" : ""} /></label>
        <label class="wl-radio-row"><span>🌙 Dark</span><input type="radio" name="wl-theme" value="dark" ${pref === "dark" ? "checked" : ""} /></label>
        <label class="wl-radio-row"><span>⚙️ System</span><input type="radio" name="wl-theme" value="system" ${pref === "system" ? "checked" : ""} /></label>
      </section>
      <section class="wl-settings-card">
        <h3>Notifications</h3>
        <p>Choose which WeLink events can alert you. Security and account alerts stay on.</p>
        ${switches}
        <label class="wl-switch-row">
          <span>Security &amp; account alerts</span>
          <span class="wl-switch">
            <input type="checkbox" checked disabled />
            <span></span>
          </span>
        </label>
        <p style="margin-top:12px">Browser alerts require permission and only appear when this device allows them.</p>
        <button type="button" class="btn btn-primary" data-enable-push>Enable browser notifications</button>
        <p class="muted" data-push-status style="margin-top:8px"></p>
      </section>
    </div>`;
  }

  function hamburgerSvg() {
    return '<svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" aria-hidden="true"><path d="M4 6h16M4 12h16M4 18h16"/></svg>';
  }

  let navReturnFocus = null;

  function mobileNavPanel() {
    return document.querySelector(".gd-sidebar, .pd-sidebar");
  }

  function focusablesIn(el) {
    if (!el) return [];
    return [...el.querySelectorAll(
      'a[href], button:not([disabled]), input:not([disabled]), select:not([disabled]), textarea:not([disabled]), [tabindex]:not([tabindex="-1"])'
    )].filter((node) => node.offsetParent !== null || node === document.activeElement);
  }

  function trapNavFocus(e) {
    if (e.key !== "Tab" || !document.body.classList.contains("wl-nav-open")) return;
    const panel = mobileNavPanel();
    const items = focusablesIn(panel);
    if (!items.length) return;
    const first = items[0];
    const last = items[items.length - 1];
    if (e.shiftKey && document.activeElement === first) {
      e.preventDefault();
      last.focus();
    } else if (!e.shiftKey && document.activeElement === last) {
      e.preventDefault();
      first.focus();
    }
  }

  function closeNav() {
    document.body.classList.remove("wl-nav-open");
    document.querySelectorAll("[data-wl-nav-toggle]").forEach((btn) => {
      btn.setAttribute("aria-expanded", "false");
      btn.setAttribute("aria-label", "Open menu");
    });
    const backdrop = document.querySelector("[data-wl-nav-close]");
    if (backdrop) backdrop.setAttribute("aria-hidden", "true");
    if (navReturnFocus && typeof navReturnFocus.focus === "function") {
      navReturnFocus.focus();
    }
    navReturnFocus = null;
  }

  function openNav() {
    navReturnFocus = document.activeElement;
    document.body.classList.add("wl-nav-open");
    document.querySelectorAll("[data-wl-nav-toggle]").forEach((btn) => {
      btn.setAttribute("aria-expanded", "true");
      btn.setAttribute("aria-label", "Close menu");
    });
    const backdrop = document.querySelector("[data-wl-nav-close]");
    if (backdrop) backdrop.setAttribute("aria-hidden", "false");
    const panel = mobileNavPanel();
    const items = focusablesIn(panel);
    (items[0] || panel)?.focus?.();
  }

  function toggleNav() {
    if (document.body.classList.contains("wl-nav-open")) closeNav();
    else openNav();
  }

  function ensureBackdrop() {
    if (document.querySelector("[data-wl-nav-close]")) return;
    const btn = document.createElement("button");
    btn.type = "button";
    btn.className = "wl-sidebar-backdrop";
    btn.setAttribute("data-wl-nav-close", "1");
    btn.setAttribute("aria-label", "Close menu");
    btn.setAttribute("aria-hidden", "true");
    document.body.appendChild(btn);
  }

  function injectThemeControls() {
    const hosts = document.querySelectorAll("[data-wl-theme-host]");
    hosts.forEach((host) => {
      if (host.querySelector("[data-wl-theme-wrap]")) return;
      host.insertAdjacentHTML("beforeend", themeMenuHtml());
    });
  }

  function bindThemeMenus() {
    document.querySelectorAll("[data-wl-theme-wrap]").forEach((wrap) => {
      if (wrap.dataset.bound === "1") return;
      wrap.dataset.bound = "1";
      const toggle = wrap.querySelector("[data-wl-theme-toggle]");
      const menu = wrap.querySelector(".wl-theme-menu");
      toggle?.addEventListener("click", (e) => {
        e.stopPropagation();
        const open = wrap.classList.toggle("open");
        toggle.setAttribute("aria-expanded", open ? "true" : "false");
        if (menu) menu.hidden = !open;
      });
      wrap.querySelectorAll("[data-wl-theme-option]").forEach((btn) => {
        btn.addEventListener("click", () => {
          setTheme(btn.getAttribute("data-wl-theme-option"));
          wrap.classList.remove("open");
          if (menu) menu.hidden = true;
          const icon = toggle?.querySelector("span");
          const pref = readThemePref();
          if (icon) icon.textContent = pref === "light" ? "☀️" : pref === "dark" ? "🌙" : "⚙️";
        });
      });
    });
  }

  function installBannerHtml() {
    return `<aside class="wl-install" id="wl-install" role="dialog" aria-labelledby="wl-install-title" aria-describedby="wl-install-desc" aria-hidden="true" hidden>
      <h2 id="wl-install-title">📱 Install WeLink</h2>
      <p id="wl-install-desc">Get a faster, app-like experience by installing WeLink on your device.</p>
      <div class="wl-install-actions">
        <button type="button" class="wl-install-go">Install</button>
        <button type="button" class="wl-install-later">Not now</button>
      </div>
    </aside>`;
  }

  function setupPwa() {
    if (!document.getElementById("wl-install")) {
      document.body.insertAdjacentHTML("beforeend", installBannerHtml());
    }
    const banner = document.getElementById("wl-install");
    let deferred = null;

    function dismissedRecently() {
      try {
        const t = Number(localStorage.getItem(INSTALL_KEY) || 0);
        return t && Date.now() - t < 14 * 24 * 60 * 60 * 1000;
      } catch (e) {
        return false;
      }
    }

    function showBanner() {
      if (!banner || dismissedRecently()) return;
      banner.hidden = false;
      banner.dataset.open = "1";
      banner.setAttribute("aria-hidden", "false");
      banner.querySelector(".wl-install-go")?.focus({ preventScroll: true });
    }

    function hideBanner() {
      if (!banner) return;
      banner.hidden = true;
      banner.dataset.open = "0";
      banner.setAttribute("aria-hidden", "true");
    }

    window.addEventListener("beforeinstallprompt", (e) => {
      e.preventDefault();
      deferred = e;
      showBanner();
    });

    banner?.querySelector(".wl-install-go")?.addEventListener("click", async () => {
      if (!deferred) return;
      deferred.prompt();
      await deferred.userChoice.catch(() => null);
      deferred = null;
      hideBanner();
    });

    banner?.querySelector(".wl-install-later")?.addEventListener("click", () => {
      try { localStorage.setItem(INSTALL_KEY, String(Date.now())); } catch (e) { /* ignore */ }
      hideBanner();
    });

    window.addEventListener("appinstalled", () => {
      deferred = null;
      hideBanner();
    });

    if ("serviceWorker" in navigator) {
      const isLocal =
        location.hostname === "localhost" ||
        location.hostname === "127.0.0.1" ||
        location.protocol === "https:";
      if (isLocal) {
        navigator.serviceWorker.register("sw.js").catch(() => undefined);
      }
    }
  }

  function bindGlobal() {
    ensureBackdrop();
    injectThemeControls();
    bindThemeMenus();

    document.addEventListener("click", (e) => {
      const toggle = e.target.closest("[data-wl-nav-toggle]");
      if (toggle) {
        e.preventDefault();
        toggleNav();
        return;
      }
      if (e.target.closest("[data-wl-nav-close]")) {
        closeNav();
        return;
      }
      if (
        e.target.closest("[data-guest-view]") ||
        e.target.closest("[data-pro-view]") ||
        e.target.closest("[data-section]")
      ) {
        if (window.matchMedia("(max-width: 1023px)").matches) closeNav();
      }
      if (!e.target.closest("[data-wl-theme-wrap]")) {
        document.querySelectorAll("[data-wl-theme-wrap].open").forEach((w) => {
          w.classList.remove("open");
          const m = w.querySelector(".wl-theme-menu");
          if (m) m.hidden = true;
        });
      }
    });

    document.addEventListener("keydown", (e) => {
      if (e.key === "Escape") {
        const install = document.getElementById("wl-install");
        if (install && install.dataset.open === "1") {
          install.querySelector(".wl-install-later")?.click();
          return;
        }
        closeNav();
        document.querySelectorAll("[data-wl-theme-wrap].open").forEach((w) => w.classList.remove("open"));
        document.querySelector("[data-modal-close], .reject-modal-cancel, [data-dismiss-modal]")?.click();
      }
      trapNavFocus(e);
    });

    document.addEventListener("change", (e) => {
      const t = e.target;
      if (t && t.name === "wl-theme") setTheme(t.value);
      if (t && t.matches("[data-notif-pref]")) setPref(t.getAttribute("data-notif-pref"), t.checked);
    });

    document.addEventListener("click", async (e) => {
      const btn = e.target.closest("[data-enable-push]");
      if (!btn) return;
      const status = await enableBrowserNotifications();
      const el = document.querySelector("[data-push-status]");
      if (el) {
        el.textContent =
          status === "granted"
            ? "Browser notifications are on."
            : status === "denied"
              ? "Permission blocked in the browser. You can still use in-app alerts."
              : "This browser does not support notifications.";
      }
    });

    window.matchMedia("(prefers-color-scheme: dark)").addEventListener("change", () => {
      if (readThemePref() === "system") applyTheme("system");
    });
  }

  function setChatOpen(open) {
    document.body.classList.toggle("wl-chat-open", !!open);
  }

  applyTheme(readThemePref());

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", () => {
      bindGlobal();
      setupPwa();
    });
  } else {
    bindGlobal();
    setupPwa();
  }

  global.WeLinkApp = {
    setTheme,
    readThemePref,
    settingsPanelHtml,
    themeMenuHtml,
    hamburgerSvg,
    closeNav,
    openNav,
    notify,
    getPrefs,
    enableBrowserNotifications,
    setChatOpen,
    injectThemeControls,
    bindThemeMenus,
    classifyNotification
  };
})(window);
