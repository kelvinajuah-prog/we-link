(function (global) {
  const H = () => global.WeLinkHelpers;

  function filterPros(pros, { search, skill } = {}) {
    if (global.WeLink?.filterProfessionals) {
      return global.WeLink.filterProfessionals(pros, { search, skill });
    }
    const q = (search || "").toLowerCase().trim();
    return (pros || []).filter((p) => {
      if (skill && p.skill !== skill) return false;
      if (!q) return true;
      const hay = (p.name + " " + p.skill + " " + p.location + " " + p.bio + " " + (p.achievements || "")).toLowerCase();
      return hay.includes(q);
    });
  }

  function renderProCard(pro, options = {}) {
    const {
      showCommPlaceholder = false,
      commHtml = "",
      detailBtn = false,
      linkHref = "",
      compact = false
    } = options;
    const photo = H().avatarUrl(pro);
    const comm = commHtml || (showCommPlaceholder
      ? `<p class="muted" style="margin-top:10px;font-size:13px">Communication coming soon</p>`
      : "");
    const detail = detailBtn
      ? `<button class="btn btn-ghost ix btn-sm" type="button" data-pro-detail="${pro.id}">View profile</button>`
      : "";
    const linkOpen = linkHref ? `<a class="btn btn-ghost ix btn-sm" href="${linkHref}">View profile</a>` : "";
    const bio = compact
      ? H().esc((pro.bio || "").slice(0, 100)) + ((pro.bio || "").length > 100 ? "…" : "")
      : H().esc(pro.bio || "");
    const achievements = pro.achievements
      ? `<p class="muted" style="font-size:13px;margin-top:6px">${H().esc((pro.achievements || "").slice(0, 80))}${(pro.achievements || "").length > 80 ? "…" : ""}</p>`
      : "";

    return `<article class="pro-card">
      <img class="avatar-md" src="${photo}" alt="${H().esc(pro.name)}" loading="lazy" />
      <span class="badge">${H().esc(pro.skill)}</span>
      <h3>${H().esc(pro.name)}</h3>
      <p class="muted">${H().esc(pro.location || "")}</p>
      <p>${bio}</p>
      ${achievements}
      ${comm}${detail}${linkOpen}
    </article>`;
  }

  function renderProDetail(pro, footerText, extraHtml) {
    const footer = extraHtml ? "" : (footerText || "Communication coming soon");
    return `<div class="card" style="margin-top:16px">
      <div style="display:flex;gap:16px;align-items:flex-start;flex-wrap:wrap">
        <img class="avatar-lg" src="${H().avatarUrl(pro)}" alt="" />
        <div style="flex:1;min-width:200px">
          <h2>${H().esc(pro.name)}</h2>
          <p class="muted">${H().esc(pro.skill)} · ${H().esc(pro.location)}</p>
        </div>
      </div>
      <h3 style="margin:16px 0 8px">Bio</h3>
      <p>${H().esc(pro.bio || "—")}</p>
      ${pro.achievements ? `<h3 style="margin:16px 0 8px">Achievements</h3><p>${H().esc(pro.achievements)}</p>` : ""}
      ${extraHtml || ""}
      ${footer ? `<p class="muted" style="margin-top:16px">${H().esc(footer)}</p>` : ""}
    </div>`;
  }

  function renderBrowseToolbar({ search, skill, skills }) {
    const skillOptions = (skills || []).map((sk) =>
      `<option value="${H().esc(sk)}" ${skill === sk ? "selected" : ""}>${H().esc(sk)}</option>`
    ).join("");
    return `<div class="card discovery-toolbar" style="margin-bottom:16px;display:flex;gap:12px;flex-wrap:wrap;align-items:end">
      <label style="flex:1;min-width:180px">Search
        <input type="search" id="browse-search" value="${H().esc(search || "")}" placeholder="Name, skill, location…" />
      </label>
      <label>Specialization
        <select id="browse-skill">
          <option value="">All skills</option>
          ${skillOptions}
        </select>
      </label>
    </div>`;
  }

  function renderPublicGrid(pros, emptyMessage) {
    if (!pros.length) {
      return `<p class="muted empty-state">${H().esc(emptyMessage || "No approved professionals yet.")}</p>`;
    }
    return pros.map((p) => renderProCard(p, { compact: true })).join("");
  }

  global.WeLinkDiscovery = {
    filterPros,
    renderProCard,
    renderProDetail,
    renderBrowseToolbar,
    renderPublicGrid
  };
})(window);
