(function (global) {
  function esc(t) {
    return String(t || "")
      .replace(/&/g, "&amp;")
      .replace(/</g, "&lt;")
      .replace(/>/g, "&gt;")
      .replace(/"/g, "&quot;");
  }

  function parseSkillsString(raw) {
    if (!raw) return [];
    if (Array.isArray(raw)) return raw.map((s) => String(s).trim()).filter(Boolean);
    return String(raw)
      .split(/[,;|]/)
      .map((s) => s.trim())
      .filter(Boolean);
  }

  function joinSkills(list) {
    return (list || []).filter(Boolean).join(", ");
  }

  function sameSkill(a, b) {
    return String(a || "").trim().toLowerCase() === String(b || "").trim().toLowerCase();
  }

  function uniquePush(list, value) {
    const v = String(value || "").trim();
    if (!v) return false;
    if (list.some((x) => sameSkill(x, v))) return false;
    list.push(v);
    return true;
  }

  /**
   * @param {HTMLElement} root
   * @param {{ catalog?: string[], initial?: string[], inputName?: string, required?: boolean, placeholder?: string }} options
   */
  function mount(root, options = {}) {
    if (!root || root.dataset.skillsPickerMounted === "1") {
      return root?._skillsPickerApi || null;
    }
    const catalog = options.catalog || [];
    const inputName = options.inputName || "skills";
    const required = options.required !== false;
    const placeholder = options.placeholder || "Search or type a skill…";
    let selected = parseSkillsString(options.initial);

    root.dataset.skillsPickerMounted = "1";
    root.classList.add("skills-picker");
    const listId = "skills-list-" + Math.random().toString(36).slice(2, 10);
    root.innerHTML = `
      <div class="skills-picker-chips" data-skills-chips aria-live="polite"></div>
      <div class="skills-picker-combo">
        <input type="text" class="skills-picker-input" autocomplete="off" spellcheck="false"
          role="combobox" aria-expanded="false" aria-autocomplete="list" aria-controls="${listId}"
          placeholder="${esc(placeholder)}" />
        <ul class="skills-picker-list" id="${listId}" role="listbox" hidden></ul>
      </div>
      <input type="hidden" name="${esc(inputName)}" ${required ? "required" : ""} />
    `;

    const chipsEl = root.querySelector("[data-skills-chips]");
    const input = root.querySelector(".skills-picker-input");
    const list = root.querySelector(".skills-picker-list");
    const hidden = root.querySelector(`input[name="${inputName}"]`);
    let highlight = -1;

    function syncHidden() {
      hidden.value = joinSkills(selected);
      hidden.dispatchEvent(new Event("change", { bubbles: true }));
    }

    function renderChips() {
      chipsEl.innerHTML = selected
        .map(
          (sk, i) => `<span class="skills-picker-chip" data-idx="${i}">
            <button type="button" class="skills-picker-chip-edit" data-edit-idx="${i}" title="Edit skill">${esc(sk)}</button>
            <button type="button" class="skills-picker-chip-remove" data-remove-idx="${i}" aria-label="Remove ${esc(sk)}">×</button>
          </span>`
        )
        .join("");
      syncHidden();
    }

    function closeList() {
      list.hidden = true;
      input.setAttribute("aria-expanded", "false");
      highlight = -1;
    }

    function openList() {
      list.hidden = false;
      input.setAttribute("aria-expanded", "true");
    }

    function buildOptions(query) {
      const q = query.trim();
      const qLower = q.toLowerCase();
      const items = [];

      if (q) {
        catalog.forEach((sk) => {
          if (selected.some((s) => sameSkill(s, sk))) return;
          if (!sk.toLowerCase().includes(qLower)) return;
          items.push({ type: "catalog", label: sk, value: sk });
        });
        const exactCatalog = catalog.some((sk) => sameSkill(sk, q));
        const already = selected.some((s) => sameSkill(s, q));
        if (q && !exactCatalog && !already) {
          items.push({ type: "custom", label: `Add "${q}"`, value: q });
        }
      } else {
        catalog.forEach((sk) => {
          if (selected.some((s) => sameSkill(s, sk))) return;
          items.push({ type: "catalog", label: sk, value: sk });
        });
      }

      return items.slice(0, 12);
    }

    function renderList() {
      const items = buildOptions(input.value);
      highlight = items.length ? Math.min(highlight, items.length - 1) : -1;
      if (!items.length) {
        list.innerHTML = `<li class="skills-picker-empty" role="presentation">No matches — keep typing to add a custom skill</li>`;
        openList();
        return;
      }
      list.innerHTML = items
        .map(
          (it, i) =>
            `<li role="option" class="skills-picker-option ${it.type === "custom" ? "is-custom" : ""} ${i === highlight ? "is-active" : ""}"
              data-pick="${esc(it.value)}" aria-selected="${i === highlight}">${it.type === "custom" ? esc(it.label) : esc(it.label)}</li>`
        )
        .join("");
      openList();
    }

    function addSkill(value) {
      if (!uniquePush(selected, value)) return;
      input.value = "";
      renderChips();
      renderList();
    }

    function removeAt(idx) {
      selected.splice(idx, 1);
      renderChips();
      renderList();
    }

    function editAt(idx) {
      const v = selected[idx];
      if (v == null) return;
      selected.splice(idx, 1);
      input.value = v;
      renderChips();
      input.focus();
      renderList();
    }

    renderChips();

    input.addEventListener("focus", () => renderList());
    input.addEventListener("input", () => {
      highlight = 0;
      renderList();
    });

    input.addEventListener("keydown", (e) => {
      const items = list.querySelectorAll("[data-pick]");
      if (e.key === "ArrowDown") {
        e.preventDefault();
        if (list.hidden) renderList();
        highlight = Math.min(highlight + 1, items.length - 1);
        renderList();
        items[highlight]?.scrollIntoView({ block: "nearest" });
      } else if (e.key === "ArrowUp") {
        e.preventDefault();
        highlight = Math.max(highlight - 1, 0);
        renderList();
      } else if (e.key === "Enter") {
        e.preventDefault();
        const pick = items[highlight] || items[0];
        if (pick) addSkill(pick.dataset.pick);
        else if (input.value.trim()) addSkill(input.value.trim());
      } else if (e.key === "Escape") {
        closeList();
      } else if (e.key === "Backspace" && !input.value && selected.length) {
        selected.pop();
        renderChips();
        renderList();
      }
    });

    list.addEventListener("mousedown", (e) => {
      const li = e.target.closest("[data-pick]");
      if (!li) return;
      e.preventDefault();
      addSkill(li.dataset.pick);
      input.focus();
    });

    chipsEl.addEventListener("click", (e) => {
      const rm = e.target.closest("[data-remove-idx]");
      if (rm) {
        removeAt(parseInt(rm.dataset.removeIdx, 10));
        return;
      }
      const ed = e.target.closest("[data-edit-idx]");
      if (ed) editAt(parseInt(ed.dataset.editIdx, 10));
    });

    document.addEventListener("click", (e) => {
      if (!root.contains(e.target)) closeList();
    });

    const api = {
      getSkills: () => selected.slice(),
      setSkills: (arr) => {
        selected = parseSkillsString(arr);
        renderChips();
      },
      validate: () => selected.length > 0,
      destroy: () => {
        root.innerHTML = "";
        delete root.dataset.skillsPickerMounted;
        delete root._skillsPickerApi;
      }
    };
    root._skillsPickerApi = api;
    return api;
  }

  function readFromForm(form, inputName = "skills") {
    const hidden = form.querySelector(`input[name="${inputName}"]`);
    if (hidden?.value) return parseSkillsString(hidden.value);
    const host = form.querySelector("[data-skills-picker]");
    if (host?._skillsPickerApi) return host._skillsPickerApi.getSkills();
    return [];
  }

  function proSkillPayload(skillsList) {
    const list = parseSkillsString(skillsList);
    return {
      skill: list[0] || "",
      skills: joinSkills(list)
    };
  }

  global.WeLinkSkillsPicker = {
    mount,
    parseSkillsString,
    joinSkills,
    readFromForm,
    proSkillPayload
  };
})(window);
