(function (global) {
  function messageBubbleHtml(m, viewerId, H) {
    const mine = m.fromId === viewerId;
    const idAttr = m.id ? ` data-msg-id="${H.esc(m.id)}"` : "";
    const img = m.imageUrl
      ? `<a class="chat-img-link" href="${H.esc(m.imageUrl)}" target="_blank" rel="noopener noreferrer"><img class="chat-img" src="${H.esc(m.imageUrl)}" alt="Shared image" loading="lazy" /></a>`
      : "";
    const text = m.body ? `<span class="chat-text">${H.esc(m.body)}</span>` : "";
    return `<div class="chat-bubble ${mine ? "mine" : "theirs"}"${idAttr}><span class="msg-time">${H.fmtTime(m.createdAt)}</span>${img}${text}</div>`;
  }

  function chatComposerHtml() {
    return `<form class="chat-form-inline" data-private-send>
      <input name="text" type="text" placeholder="Type a message or paste an image…" aria-label="Message" autocomplete="off" />
      <label class="chat-attach" title="Attach image">
        <span class="chat-attach-icon" aria-hidden="true">📷</span>
        <span class="chat-attach-label">Photo</span>
        <input type="file" name="image" accept="image/jpeg,image/png,image/webp,image/gif" hidden />
      </label>
      <div class="chat-preview" data-chat-preview hidden></div>
      <button class="btn btn-primary ix" type="submit">Send</button>
    </form>`;
  }

  function bindParticipantChatForm(form, options) {
    const H = global.WeLinkHelpers;
    if (!form || !H || form.dataset.chatBound === "1") return;
    form.dataset.chatBound = "1";

    const textInput = form.querySelector('input[name="text"]');
    const fileInput = form.querySelector('input[name="image"]');
    const preview = form.querySelector("[data-chat-preview]");
    const attachLabel = form.querySelector(".chat-attach-label");

    function clearPreview() {
      if (preview) {
        preview.hidden = true;
        preview.innerHTML = "";
      }
      if (attachLabel) attachLabel.textContent = "Photo";
    }

    function showPreviewFromFile(file) {
      if (!file || !preview) return;
      const url = URL.createObjectURL(file);
      preview.hidden = false;
      preview.innerHTML = `<img src="${url}" alt="Attachment preview" /><button type="button" class="chat-preview-clear" data-clear-attach aria-label="Remove image">×</button>`;
      if (attachLabel) attachLabel.textContent = file.name.length > 12 ? file.name.slice(0, 10) + "…" : file.name;
      preview.querySelector("[data-clear-attach]")?.addEventListener("click", () => {
        if (fileInput) fileInput.value = "";
        URL.revokeObjectURL(url);
        clearPreview();
      });
    }

    fileInput?.addEventListener("change", () => {
      const file = fileInput.files?.[0];
      if (file) showPreviewFromFile(file);
      else clearPreview();
    });

    textInput?.addEventListener("paste", (e) => {
      const items = e.clipboardData?.items;
      if (!items || !fileInput) return;
      for (let i = 0; i < items.length; i++) {
        const item = items[i];
        if (item.kind === "file" && item.type.startsWith("image/")) {
          e.preventDefault();
          const file = item.getAsFile();
          if (!file) return;
          const dt = new DataTransfer();
          dt.items.add(file);
          fileInput.files = dt.files;
          showPreviewFromFile(file);
          break;
        }
      }
    });

    form.addEventListener("submit", async (e) => {
      e.preventDefault();
      const text = textInput?.value || "";
      let image = "";
      try {
        if (fileInput?.files?.[0]) {
          image = await (H.fileToChatData ? H.fileToChatData(fileInput.files[0]) : H.fileToData(fileInput.files[0]));
        }
      } catch (err) {
        return alert(err.message);
      }
      if (!text.trim() && !image) return alert("Enter a message or attach an image.");
      const ok = await options.onSend({ text, image });
      if (!ok) return;
      if (textInput) textInput.value = "";
      if (fileInput) fileInput.value = "";
      clearPreview();
    });
  }

  global.WeLinkChatUI = {
    messageBubbleHtml,
    chatComposerHtml,
    bindParticipantChatForm
  };
})(window);
