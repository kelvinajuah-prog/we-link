(function (global) {
  const ROLE_CONFIG = {
    guest: {
      label: "Guest",
      redirect: "dashboard.html",
      register: "register-seeker.html",
      signupLinkText: "Create a guest account",
      credentialsLabel: "Guest login credentials",
      emailPlaceholder: "Guest email address",
      passwordPlaceholder: "Guest password"
    },
    professional: {
      label: "Professional",
      redirect: "dashboard.html",
      register: "register-pro.html",
      signupLinkText: "Create a professional account",
      credentialsLabel: "Professional login credentials",
      emailPlaceholder: "Professional email address",
      passwordPlaceholder: "Professional password"
    },
    admin: {
      label: "Admin",
      redirect: "admin.html",
      register: "register-admin.html",
      signupLinkText: "Create an admin account",
      credentialsLabel: "Admin login credentials",
      emailPlaceholder: "Admin email address",
      passwordPlaceholder: "Admin password"
    }
  };

  const REMEMBER_KEY = "welink_login_email";
  const MIN_PASSWORD_LENGTH = 6;

  const ROLE_ORDER = ["guest", "professional", "admin"];

  function credentialsValid(email, password) {
    const e = (email || "").trim();
    const p = password || "";
    return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(e) && p.length >= MIN_PASSWORD_LENGTH;
  }

  function updateSignInReadyState() {
    const form = document.getElementById("login-form");
    const btn = document.getElementById("login-submit-btn");
    const status = document.getElementById("login-submit-status");
    if (!form || !btn || signInBusy) return;
    const ok = credentialsValid(form.email?.value, form.password?.value);
    btn.disabled = !ok;
    btn.setAttribute("aria-disabled", ok ? "false" : "true");
    btn.classList.toggle("login-submit--ready", ok);
    if (status) {
      status.hidden = !ok;
    }
  }

  function initCredentialValidation() {
    const form = document.getElementById("login-form");
    if (!form) return;
    const refresh = () => updateSignInReadyState();
    form.email?.addEventListener("input", refresh);
    form.password?.addEventListener("input", refresh);
    updateSignInReadyState();
  }

  const ROLE_TITLES = {
    guest: "Guest sign in",
    professional: "Professional sign in",
    admin: "Admin sign in"
  };

  let signInBusy = false;

  function submitButtonLabel(role) {
    const cfg = ROLE_CONFIG[role] || ROLE_CONFIG.guest;
    return `Sign in as ${cfg.label}`;
  }

  function setSubmitLoading(loading) {
    const btn = document.getElementById("login-submit-btn");
    if (!btn) return;
    signInBusy = loading;
    if (loading) {
      btn.disabled = true;
      btn.setAttribute("aria-disabled", "true");
      btn.classList.remove("login-submit--ready");
      btn.classList.add("login-submit--loading");
      btn.dataset.defaultLabel = btn.dataset.defaultLabel || btn.textContent;
      btn.textContent = "Signing in…";
      return;
    }
    btn.classList.remove("login-submit--loading");
    btn.textContent = submitButtonLabel(getActiveRole());
    updateSignInReadyState();
  }

  function updateRoleUI(role) {
    const cfg = ROLE_CONFIG[role] || ROLE_CONFIG.guest;
    const title = document.getElementById("login-card-title");
    if (title) title.textContent = ROLE_TITLES[role] || ROLE_TITLES.guest;

    const lede = document.getElementById("login-card-lede");
    if (lede) {
      lede.textContent = `Enter your ${cfg.label.toLowerCase()} email and password to sign in.`;
    }

    const credLabel = document.getElementById("login-credentials-label");
    if (credLabel) credLabel.textContent = cfg.credentialsLabel;

    const emailLabel = document.getElementById("login-email-label");
    if (emailLabel) emailLabel.textContent = cfg.emailPlaceholder;
    const emailInput = document.getElementById("login-email");
    if (emailInput) emailInput.placeholder = cfg.emailPlaceholder;

    const passwordLabel = document.getElementById("login-password-label");
    if (passwordLabel) passwordLabel.textContent = cfg.passwordPlaceholder;
    const passwordInput = document.getElementById("login-password");
    if (passwordInput) passwordInput.placeholder = cfg.passwordPlaceholder;

    const roleField = document.getElementById("login-role-field");
    if (roleField) roleField.value = role;

    const form = document.getElementById("login-form");
    if (form) form.setAttribute("aria-label", cfg.credentialsLabel);

    const submit = document.getElementById("login-submit-btn");
    if (submit && !signInBusy) submit.textContent = submitButtonLabel(role);

    const link = document.getElementById("signup-link");
    if (link) {
      link.href = cfg.register;
      link.textContent = cfg.signupLinkText;
    }

    updateSignInReadyState();
  }

  function clearLoginError() {
    const errEl = document.getElementById("login-err");
    if (!errEl) return;
    errEl.hidden = true;
    errEl.textContent = "";
  }

  function selectRole(role, options = {}) {
    if (!ROLE_CONFIG[role]) role = "guest";
    document.querySelectorAll(".login-tab").forEach((tab) => {
      const on = tab.dataset.role === role;
      tab.classList.toggle("active", on);
      tab.setAttribute("aria-selected", on ? "true" : "false");
      tab.tabIndex = on ? 0 : -1;
    });
    setRole(role);
    updateRoleUI(role);
    clearLoginError();
    if (options.focusTab) {
      document.querySelector(`.login-tab[data-role="${role}"]`)?.focus();
    }
  }

  function parseRole() {
    const q = new URLSearchParams(location.search).get("role");
    if (q === "professional" || q === "pro") return "professional";
    if (q === "admin") return "admin";
    return "guest";
  }

  function setRole(role) {
    const url = new URL(location.href);
    url.searchParams.set("role", role);
    history.replaceState({}, "", url.pathname + url.search);
  }

  function initTabs(activeRole) {
    selectRole(activeRole);
    document.querySelectorAll(".login-tab").forEach((tab) => {
      tab.addEventListener("click", () => selectRole(tab.dataset.role, { focusTab: true }));
    });
    const tablist = document.querySelector(".login-tabs");
    tablist?.addEventListener("keydown", (e) => {
      const current = getActiveRole();
      let idx = ROLE_ORDER.indexOf(current);
      if (idx < 0) idx = 0;
      if (e.key === "ArrowRight" || e.key === "ArrowDown") {
        e.preventDefault();
        selectRole(ROLE_ORDER[(idx + 1) % ROLE_ORDER.length], { focusTab: true });
      } else if (e.key === "ArrowLeft" || e.key === "ArrowUp") {
        e.preventDefault();
        selectRole(ROLE_ORDER[(idx - 1 + ROLE_ORDER.length) % ROLE_ORDER.length], { focusTab: true });
      } else if (e.key === "Home") {
        e.preventDefault();
        selectRole(ROLE_ORDER[0], { focusTab: true });
      } else if (e.key === "End") {
        e.preventDefault();
        selectRole(ROLE_ORDER[ROLE_ORDER.length - 1], { focusTab: true });
      }
    });
  }

  function getActiveRole() {
    const active = document.querySelector(".login-tab.active");
    return active?.dataset.role || "guest";
  }

  function initPasswordToggle() {
    const input = document.getElementById("login-password");
    const btn = document.getElementById("toggle-password");
    if (!input || !btn) return;
    btn.addEventListener("click", () => {
      const show = input.type === "password";
      input.type = show ? "text" : "password";
      btn.setAttribute("aria-label", show ? "Hide password" : "Show password");
      btn.innerHTML = show
        ? '<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94"/><path d="M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19"/><line x1="1" y1="1" x2="23" y2="23"/></svg>'
        : '<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/><circle cx="12" cy="12" r="3"/></svg>';
    });
  }

  function loadRememberedEmail() {
    const email = localStorage.getItem(REMEMBER_KEY);
    const input = document.getElementById("login-email");
    const remember = document.getElementById("remember-me");
    if (email && input) {
      input.value = email;
      if (remember) remember.checked = true;
    }
  }

  function saveRememberedEmail(email, remember) {
    if (remember) localStorage.setItem(REMEMBER_KEY, email.trim());
    else localStorage.removeItem(REMEMBER_KEY);
  }

  function showCompleteForm(completion) {
    document.querySelector(".login-signin-panel")?.classList.add("hidden");
    document.querySelector(".login-marketing")?.setAttribute("hidden", "");
    document.querySelector(".login-hero")?.setAttribute("hidden", "");
    const panel = document.getElementById("complete-panel");
    if (!panel) return;
    panel.classList.add("visible");
    panel.hidden = false;
    const emailEl = panel.querySelector("[name=email]");
    if (emailEl) emailEl.value = completion.email || "";
    const nameEl = panel.querySelector("[name=name]");
    if (nameEl && completion.profile?.name) nameEl.value = completion.profile.name;
    document.querySelector(".login-card-head h2").textContent = "Complete your profile";
    document.querySelector(".login-card-head p").textContent = "One more step — add your guest details.";
  }

  function navigateAfterSignIn(res) {
    const target = res.redirect || (res.role === "admin" ? "admin.html" : "dashboard.html");
    location.assign(target);
  }

  async function initLoginForm() {
    const form = document.getElementById("login-form");
    if (!form) return;

    form.addEventListener("submit", async (e) => {
      e.preventDefault();
      if (signInBusy) return;

      const errEl = document.getElementById("login-err");
      const email = (form.email?.value || "").trim();
      const password = form.password?.value || "";
      const remember = document.getElementById("remember-me")?.checked;

      errEl.hidden = true;
      errEl.textContent = "";

      if (!email || !password) {
        errEl.hidden = false;
        errEl.textContent = "Email and password are required.";
        return;
      }
      if (!credentialsValid(email, password)) {
        errEl.hidden = false;
        errEl.textContent = "Enter a valid email and a password of at least 6 characters.";
        return;
      }

      setSubmitLoading(true);

      try {
        const res = await WeLink.login(email, password);
        if (!res.ok) {
          if (res.incompleteProfile && res.role === "guest") {
            const completion = await WeLink.getProfileCompletionState();
            if (completion) {
              showCompleteForm(completion);
              setSubmitLoading(false);
              return;
            }
          }
          errEl.hidden = false;
          errEl.textContent = res.error || "Sign in failed. Please try again.";
          setSubmitLoading(false);
          return;
        }

        if (res.role && ROLE_CONFIG[res.role]) {
          selectRole(res.role, { focusTab: false });
        }

        saveRememberedEmail(email, remember);
        navigateAfterSignIn(res);
      } catch (unexpected) {
        console.error("[WeLinkLogin] Sign in error:", unexpected);
        errEl.hidden = false;
        errEl.textContent = "Something went wrong while signing in. Please try again.";
        setSubmitLoading(false);
      }
    });
  }

  async function initCompleteForm() {
    const form = document.getElementById("complete-form");
    if (!form) return;
    const sel = form.querySelector("[name=specialization]");
    if (sel && WeLink.SKILLS) {
      WeLink.SKILLS.forEach((s) => {
        const o = document.createElement("option");
        o.value = s;
        o.textContent = s;
        sel.appendChild(o);
      });
    }

    form.addEventListener("submit", async (e) => {
      e.preventDefault();
      const err = document.getElementById("complete-err");
      const btn = form.querySelector(".login-submit");
      err.hidden = true;
      btn.disabled = true;
      const f = form;
      const res = await WeLink.completeGuestProfile({
        name: f.name.value,
        email: f.email.value,
        age: f.age.value,
        town: f.town.value,
        area: f.area.value,
        specialization: f.specialization.value,
        skills: f.skills.value,
        photo: ""
      });
      if (!res.ok) {
        err.hidden = false;
        err.textContent = res.error;
        btn.disabled = false;
        return;
      }
      location.href = "dashboard.html";
    });
  }

  function initForgotPassword() {
    document.getElementById("forgot-password")?.addEventListener("click", () => {
      alert("Password reset is managed by your administrator or Supabase Auth settings. Contact support if you need help.");
    });
  }

  async function init() {
    const role = parseRole();
    initTabs(role);
    initPasswordToggle();
    loadRememberedEmail();
    initCredentialValidation();
    initForgotPassword();
    initLoginForm();
    initCompleteForm();

    try {
      await WeLink.ready;
    } catch (readyErr) {
      console.error("[WeLinkLogin] WeLink.ready failed:", readyErr);
      const errEl = document.getElementById("login-err");
      if (errEl) {
        errEl.hidden = false;
        errEl.textContent =
          "Cannot connect to WeLink authentication. Check js/config.js (or Netlify env vars) and open the site over http(s), not file://.";
      }
    }

    const session = WeLink.session();
    if (session?.role) {
      location.replace(session.role === "admin" ? "admin.html" : "dashboard.html");
      return;
    }

    if (location.protocol === "file:") {
      const warn = document.createElement("p");
      warn.className = "login-warn";
      warn.textContent = "Open this app over http(s) (e.g. localhost or your Netlify URL), not as a local file. file:// breaks Supabase authentication.";
      document.querySelector(".login-card")?.prepend(warn);
    }

    const existing = await WeLink.getProfileCompletionState();
    if (existing) showCompleteForm(existing);
  }

  global.WeLinkLogin = { init };
})(window);
