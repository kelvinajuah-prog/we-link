(function (global) {
  const H = () => global.WeLinkHelpers;

  function countdownHtml(eventAt, status) {
    if (status === "cancelled") {
      return `<p class="evt-status evt-cancelled">Cancelled</p>`;
    }
    if (status === "paused") {
      return `<p class="evt-status evt-paused">Paused</p>`;
    }
    const p = H().countdownParts(eventAt);
    if (p.expired) {
      return `<p class="evt-status evt-ended">Event deadline passed</p>`;
    }
    return `<div class="evt-countdown" data-countdown-at="${eventAt}">
      <span><strong>${p.days}</strong><small>days</small></span>
      <span><strong>${String(p.hours).padStart(2, "0")}</strong><small>hrs</small></span>
      <span><strong>${String(p.minutes).padStart(2, "0")}</strong><small>min</small></span>
      <span><strong>${String(p.seconds).padStart(2, "0")}</strong><small>sec</small></span>
    </div>`;
  }

  function eventCardGuest(ev) {
    return `<article class="evt-card" data-event-id="${H().esc(ev.id)}">
      <div class="evt-card-head">
        <h4>${H().esc(ev.title)}</h4>
        <span class="evt-pro">by ${H().esc(ev.proName || "Professional")}</span>
      </div>
      <p class="evt-desc">${H().esc(ev.description || "No description.")}</p>
      <p class="evt-when">${H().fmtTime(ev.eventAt)}</p>
      ${countdownHtml(ev.eventAt, ev.status)}
    </article>`;
  }

  function eventCardPro(ev, { editingId } = {}) {
    const isEdit = editingId === ev.id;
    if (isEdit) {
      const dt = new Date(ev.eventAt);
      const local = new Date(dt.getTime() - dt.getTimezoneOffset() * 60000).toISOString().slice(0, 16);
      return `<article class="evt-card evt-card-edit" data-event-id="${H().esc(ev.id)}">
        <form class="evt-edit-form" data-event-edit="${H().esc(ev.id)}">
          <label>Title <input name="title" required value="${H().esc(ev.title)}" /></label>
          <label>Description <textarea name="description">${H().esc(ev.description || "")}</textarea></label>
          <label>Event date & time <input type="datetime-local" name="eventAt" required value="${local}" /></label>
          <div class="evt-actions">
            <button type="button" class="gd-btn-dark" data-event-edit-cancel>Cancel edit</button>
            <button type="submit" class="gd-btn-gradient">Save changes</button>
          </div>
        </form>
      </article>`;
    }
    const actions =
      ev.status === "cancelled"
        ? ""
        : `<div class="evt-actions">
            <button type="button" class="gd-btn-dark" data-event-edit="${H().esc(ev.id)}">Modify</button>
            ${ev.status === "paused"
              ? `<button type="button" class="gd-btn-gradient" data-event-status="${H().esc(ev.id)}" data-status="scheduled">Resume</button>`
              : `<button type="button" class="gd-btn-dark" data-event-status="${H().esc(ev.id)}" data-status="paused">Pause</button>`}
            <button type="button" class="evt-btn-danger" data-event-status="${H().esc(ev.id)}" data-status="cancelled">Cancel event</button>
          </div>`;
    return `<article class="evt-card" data-event-id="${H().esc(ev.id)}">
      <div class="evt-card-head">
        <h4>${H().esc(ev.title)}</h4>
        <span class="evt-badge evt-badge-${ev.status}">${H().esc(ev.status)}</span>
      </div>
      <p class="evt-desc">${H().esc(ev.description || "")}</p>
      <p class="evt-when">${H().fmtTime(ev.eventAt)}</p>
      ${countdownHtml(ev.eventAt, ev.status)}
      ${actions}
    </article>`;
  }

  function guestEventsPage(events) {
    const list = events.length
      ? events.map((e) => eventCardGuest(e)).join("")
      : `<p class="gd-empty">No upcoming events yet. Professionals can schedule events you will be notified about.</p>`;
    return `<div class="evt-page">${list}</div>`;
  }

  function proEventsPage(events, proId, { editingId } = {}) {
    const schedule = `<form id="evt-schedule-form" class="evt-schedule gd-panel">
      <h3>Schedule an event</h3>
      <p class="gd-edit-lede">Guests and admins are notified when you schedule a new event.</p>
      <label>Title <input name="title" required placeholder="Networking meetup" /></label>
      <label>Description <textarea name="description" placeholder="What guests should expect"></textarea></label>
      <label>Event date & time <input type="datetime-local" name="eventAt" required /></label>
      <p class="login-err gd-edit-err" id="evt-schedule-err" hidden></p>
      <button type="submit" class="gd-btn-gradient">Schedule event</button>
    </form>`;
    const mine = events.filter((e) => e.proId === proId);
    const list = mine.length
      ? mine.map((e) => eventCardPro(e, { editingId })).join("")
      : `<p class="gd-empty">You have not scheduled any events yet.</p>`;
    return `<div class="evt-page">${schedule}<h3 class="evt-list-title">Your scheduled events</h3>${list}</div>`;
  }

  function adminEventsTable(events) {
    if (!events.length) return `<p class="muted">No events scheduled.</p>`;
    return `<div class="admin-table-wrap"><table class="admin-table">
      <thead><tr><th>Event</th><th>Professional</th><th>When</th><th>Status</th><th>Countdown</th><th></th></tr></thead>
      <tbody>${events
        .map(
          (ev) => `<tr>
          <td><strong>${H().esc(ev.title)}</strong><br><span class="muted" style="font-size:12px">${H().esc((ev.description || "").slice(0, 80))}</span></td>
          <td>${H().esc(ev.proName || "—")}</td>
          <td>${H().fmtTime(ev.eventAt)}</td>
          <td><span class="badge-pill ${ev.status}">${H().esc(ev.status)}</span></td>
          <td>${countdownHtml(ev.eventAt, ev.status)}</td>
          <td class="evt-admin-actions">
            ${ev.status !== "cancelled" ? `<button type="button" class="button-outline" data-admin-event-pause="${H().esc(ev.id)}">${ev.status === "paused" ? "Resume" : "Pause"}</button>
            <button type="button" class="button-destructive" data-admin-event-cancel="${H().esc(ev.id)}">Cancel</button>` : "—"}
          </td>
        </tr>`
        )
        .join("")}</tbody></table></div>`;
  }

  function tickCountdowns(root) {
    root?.querySelectorAll("[data-countdown-at]").forEach((el) => {
      const at = Number(el.getAttribute("data-countdown-at"));
      const card = el.closest(".evt-card");
      const status = card?.querySelector(".evt-badge")?.textContent?.trim().toLowerCase() || "scheduled";
      if (status === "paused" || status === "cancelled") return;
      const p = H().countdownParts(at);
      if (p.expired) {
        el.outerHTML = `<p class="evt-status evt-ended">Event deadline passed</p>`;
        return;
      }
      el.innerHTML = `
        <span><strong>${p.days}</strong><small>days</small></span>
        <span><strong>${String(p.hours).padStart(2, "0")}</strong><small>hrs</small></span>
        <span><strong>${String(p.minutes).padStart(2, "0")}</strong><small>min</small></span>
        <span><strong>${String(p.seconds).padStart(2, "0")}</strong><small>sec</small></span>`;
    });
  }

  global.WeLinkEventsUI = {
    countdownHtml,
    guestEventsPage,
    proEventsPage,
    adminEventsTable,
    tickCountdowns
  };
})(window);
