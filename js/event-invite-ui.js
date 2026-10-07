(function (global) {
  const H = () => global.WeLinkHelpers;

  function statusBadge(status) {
    const labels = {
      invite: "Invite",
      pending: "Pending",
      accepted: "Accepted",
      declined: "Declined"
    };
    const cls = status || "invite";
    return `<span class="evt-inv-badge evt-inv-badge--${cls}">${labels[cls] || cls}</span>`;
  }

  function proInvitePanel(events, proId) {
    const active = events.filter((e) => e.proId === proId && e.status !== "cancelled");
    if (!active.length) {
      return `<section class="evt-invite-panel gd-panel" id="evt-invite-panel">
        <p class="evt-invite-kicker">Guest invitations</p>
        <h3 class="evt-invite-title">Invite guests to your event</h3>
        <p class="gd-edit-lede">Schedule an event below first, then search and invite guests here.</p>
      </section>`;
    }
    const options = active
      .map((ev) => `<option value="${H().esc(ev.id)}">${H().esc(ev.title)}</option>`)
      .join("");
    return `<section class="evt-invite-panel gd-panel" id="evt-invite-panel" data-pro-id="${H().esc(proId)}">
      <p class="evt-invite-kicker">Guest invitations</p>
      <h3 class="evt-invite-title">Invite guest</h3>
      <p class="gd-edit-lede">Search by name, username, or email. Guests receive a notification and can accept or decline.</p>
      <label class="evt-invite-field">
        <span>Event</span>
        <select id="evt-invite-event" class="evt-invite-select">${options}</select>
      </label>
      <label class="evt-invite-field">
        <span>Search guests</span>
        <div class="evt-invite-search-wrap">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" aria-hidden="true"><circle cx="11" cy="11" r="7"/><path d="M20 20l-3-3"/></svg>
          <input type="search" id="evt-invite-query" placeholder="Name, username, or email…" autocomplete="off" aria-label="Search guests" />
        </div>
      </label>
      <p class="evt-invite-toast" id="evt-invite-toast" hidden role="status"></p>
      <div class="evt-invite-results" id="evt-invite-results">
        <p class="evt-invite-hint">Start typing to find guest profiles.</p>
      </div>
    </section>`;
  }

  function guestResultCard(guest, uiStatus) {
    const photo = H().avatarUrl({ photo: guest.photo, name: guest.name });
    let action = "";
    if (uiStatus === "pending") {
      action = `${statusBadge("pending")}<button type="button" class="evt-inv-btn evt-inv-btn--ghost" data-invite-withdraw="${H().esc(guest.id)}">Withdraw</button>`;
    } else if (uiStatus === "accepted") {
      action = statusBadge("accepted");
    } else if (uiStatus === "declined") {
      action = `${statusBadge("declined")}<button type="button" class="evt-inv-btn evt-inv-btn--primary" data-invite-send="${H().esc(guest.id)}">Invite again</button>`;
    } else {
      action = `<button type="button" class="evt-inv-btn evt-inv-btn--primary" data-invite-send="${H().esc(guest.id)}">Invite</button>`;
    }
    return `<article class="evt-inv-card" data-guest-id="${H().esc(guest.id)}">
      <img class="evt-inv-avatar" src="${photo}" alt="" loading="lazy" />
      <div class="evt-inv-card-body">
        <p class="evt-inv-name">${H().esc(guest.name)}</p>
        <p class="evt-inv-user">@${H().esc(guest.username || "guest")}</p>
        <p class="evt-inv-meta">${H().esc(guest.profession)} · ${H().esc(guest.location)}</p>
      </div>
      <div class="evt-inv-card-actions">${action}</div>
    </article>`;
  }

  function guestPendingInvitesSection(invites) {
    if (!invites.length) return "";
    const cards = invites
      .map(
        (inv) => `<article class="evt-guest-invite-card">
        <div class="evt-guest-invite-head">
          <p class="evt-guest-invite-kicker">Event invitation</p>
          <h4>${H().esc(inv.eventTitle)}</h4>
          <p class="evt-guest-invite-from">From <strong>${H().esc(inv.proName)}</strong></p>
        </div>
        <p class="evt-guest-invite-desc">${H().esc(inv.eventDescription || "You have been invited to join this event.")}</p>
        <p class="evt-guest-invite-when">${H().fmtTime(inv.eventAt)}</p>
        <div class="evt-guest-invite-actions">
          <button type="button" class="gd-btn-gradient" data-invite-accept="${H().esc(inv.eventId)}">Accept invitation</button>
          <button type="button" class="gd-btn-dark" data-invite-decline="${H().esc(inv.eventId)}">Decline invitation</button>
        </div>
      </article>`
      )
      .join("");
    return `<section class="evt-guest-invites-block">
      <h3 class="evt-guest-invites-title">Pending invitations</h3>
      <div class="evt-guest-invites-list">${cards}</div>
    </section>`;
  }

  function mapUiStatus(dbStatus) {
    if (dbStatus === "pending") return "pending";
    if (dbStatus === "accepted") return "accepted";
    if (dbStatus === "declined") return "declined";
    return "invite";
  }

  function bindProInvitePanel(root, proId, onRefresh) {
    const panel = root.querySelector("#evt-invite-panel");
    if (!panel || panel.dataset.bound === "1") return;
    panel.dataset.bound = "1";

    const queryEl = panel.querySelector("#evt-invite-query");
    const resultsEl = panel.querySelector("#evt-invite-results");
    const toastEl = panel.querySelector("#evt-invite-toast");
    const eventEl = panel.querySelector("#evt-invite-event");
    let searchTimer = null;
    let guests = [];

    function showToast(text) {
      if (!toastEl) return;
      toastEl.hidden = !text;
      toastEl.textContent = text || "";
      if (text) setTimeout(() => { toastEl.hidden = true; }, 3200);
    }

    function renderResults() {
      if (!resultsEl) return;
      const q = (queryEl?.value || "").trim();
      const eventId = eventEl?.value;
      if (!q) {
        resultsEl.innerHTML = `<p class="evt-invite-hint">Start typing to find guest profiles.</p>`;
        return;
      }
      if (!guests.length) {
        resultsEl.innerHTML = `<p class="evt-invite-empty">No matching guest found. Try another name, username, or email.</p>`;
        return;
      }
      resultsEl.innerHTML = guests
        .map((g) => {
          const st = mapUiStatus(global.WeLink.getEventInvitationStatus(eventId, g.id));
          return guestResultCard(g, st);
        })
        .join("");
    }

    async function runSearch(q) {
      resultsEl.innerHTML = `<p class="evt-invite-hint">Searching…</p>`;
      const res = await global.WeLink.searchGuestsForInvite(q);
      guests = res.ok ? res.guests : [];
      renderResults();
    }

    queryEl?.addEventListener("input", () => {
      clearTimeout(searchTimer);
      const q = (queryEl.value || "").trim();
      if (!q) {
        guests = [];
        renderResults();
        return;
      }
      searchTimer = setTimeout(() => runSearch(q), 280);
    });

    eventEl?.addEventListener("change", () => renderResults());

    panel.addEventListener("click", async (e) => {
      const sendBtn = e.target.closest("[data-invite-send]");
      const withdrawBtn = e.target.closest("[data-invite-withdraw]");
      const eventId = eventEl?.value;
      if (!eventId) return;

      if (sendBtn) {
        const guestId = sendBtn.getAttribute("data-invite-send");
        sendBtn.disabled = true;
        const res = await global.WeLink.sendEventInvitation(proId, eventId, guestId);
        sendBtn.disabled = false;
        if (!res.ok) {
          showToast(res.error || "Could not send invitation.");
          return;
        }
        showToast(res.message || "Invitation sent");
        await global.WeLink.load();
        renderResults();
        onRefresh?.();
        return;
      }
      if (withdrawBtn) {
        const guestId = withdrawBtn.getAttribute("data-invite-withdraw");
        withdrawBtn.disabled = true;
        const res = await global.WeLink.withdrawEventInvitation(proId, eventId, guestId);
        withdrawBtn.disabled = false;
        if (!res.ok) {
          showToast(res.error || "Could not withdraw.");
          return;
        }
        showToast("Invitation withdrawn");
        await global.WeLink.load();
        renderResults();
        onRefresh?.();
      }
    });
  }

  function bindGuestInviteActions(root, guestId, onRefresh) {
    root.querySelectorAll("[data-invite-accept]").forEach((btn) => {
      btn.addEventListener("click", async () => {
        const eventId = btn.getAttribute("data-invite-accept");
        btn.disabled = true;
        const res = await global.WeLink.respondToEventInvitation(guestId, eventId, "accept");
        if (!res.ok) {
          btn.disabled = false;
          alert(res.error);
          return;
        }
        global.WeLink.flushCache();
        await global.WeLink.load();
        onRefresh?.();
      });
    });
    root.querySelectorAll("[data-invite-decline]").forEach((btn) => {
      btn.addEventListener("click", async () => {
        const eventId = btn.getAttribute("data-invite-decline");
        if (!confirm("Decline this event invitation?")) return;
        btn.disabled = true;
        const res = await global.WeLink.respondToEventInvitation(guestId, eventId, "decline");
        if (!res.ok) {
          btn.disabled = false;
          alert(res.error);
          return;
        }
        global.WeLink.flushCache();
        await global.WeLink.load();
        onRefresh?.();
      });
    });
  }

  global.WeLinkEventInviteUI = {
    proInvitePanel,
    guestPendingInvitesSection,
    statusBadge,
    bindProInvitePanel,
    bindGuestInviteActions
  };
})(window);
