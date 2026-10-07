(function (global) {
  const MAX_IMAGE_BYTES = 2 * 1024 * 1024;
  const CHAT_MAX_IMAGE_BYTES = 5 * 1024 * 1024;
  const ALLOWED_TYPES = ["image/jpeg", "image/png", "image/webp", "image/gif"];

  function esc(t) {
    return String(t || "")
      .replace(/&/g, "&amp;")
      .replace(/</g, "&lt;")
      .replace(/>/g, "&gt;")
      .replace(/"/g, "&quot;");
  }

  function fmtTime(ts) {
    return ts ? new Date(ts).toLocaleString() : "—";
  }

  function validateImageFile(file, maxBytes) {
    const limit = maxBytes || MAX_IMAGE_BYTES;
    if (!file) return { ok: false, error: "Please select an image." };
    if (!ALLOWED_TYPES.includes(file.type)) {
      return { ok: false, error: "Use JPG, PNG, WebP, or GIF." };
    }
    if (file.size > limit) {
      const mb = Math.round(limit / (1024 * 1024));
      return { ok: false, error: `Image must be under ${mb} MB.` };
    }
    return { ok: true };
  }

  function fileToData(file, maxBytes) {
    return new Promise((resolve, reject) => {
      if (!file) return resolve("");
      const check = validateImageFile(file, maxBytes);
      if (!check.ok) return reject(new Error(check.error));
      const r = new FileReader();
      r.onload = () => resolve(r.result);
      r.onerror = () => reject(new Error("Could not read file."));
      r.readAsDataURL(file);
    });
  }

  function fileToChatData(file) {
    return fileToData(file, CHAT_MAX_IMAGE_BYTES);
  }

  function defaultAvatar(name) {
    const letter = (name || "W").trim().charAt(0).toUpperCase();
    return "https://placehold.co/120x120/111/f5c518?text=" + encodeURIComponent(letter);
  }

  function avatarUrl(entity) {
    return entity?.photo || defaultAvatar(entity?.name);
  }

  function addCalendarMonth(fromMs) {
    const d = new Date(fromMs);
    d.setMonth(d.getMonth() + 1);
    return d.getTime();
  }

  function countdownParts(expiresAt) {
    const diff = Math.max(0, expiresAt - Date.now());
    const totalSec = Math.floor(diff / 1000);
    const days = Math.floor(totalSec / 86400);
    const hours = Math.floor((totalSec % 86400) / 3600);
    const minutes = Math.floor((totalSec % 3600) / 60);
    const seconds = totalSec % 60;
    return { days, hours, minutes, seconds, expired: diff <= 0 };
  }

  function statusBadge(status) {
    const map = {
      pending: "PENDING",
      approved: "APPROVED",
      accepted: "APPROVED",
      rejected: "REJECTED",
      cancelled: "CANCELLED",
      suspended: "SUSPENDED",
      deactivated: "DEACTIVATED",
      active: "ACTIVE",
      awaiting_admin: "AWAITING ADMIN APPROVAL",
      communication_active: "COMMUNICATION ACTIVE",
      communication_expired: "COMMUNICATION EXPIRED",
      closed: "CLOSED",
      ended: "ENDED",
      declined: "DECLINED"
    };
    return map[status] || String(status || "").toUpperCase();
  }

  global.WeLinkHelpers = {
    esc,
    fmtTime,
    validateImageFile,
    fileToData,
    fileToChatData,
    defaultAvatar,
    avatarUrl,
    addCalendarMonth,
    countdownParts,
    statusBadge,
    MAX_IMAGE_BYTES,
    CHAT_MAX_IMAGE_BYTES
  };
})(window);
