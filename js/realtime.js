(function (global) {
  const channels = new Map();
  let connectionStatus = "idle";
  const statusListeners = new Set();

  async function client() {
    return WeLinkSupabase.sb();
  }

  function setConnectionStatus(status) {
    if (connectionStatus === status) return;
    connectionStatus = status;
    statusListeners.forEach((cb) => {
      try { cb(status); } catch (_) { /* ignore */ }
    });
  }

  function mapSubscribeStatus(status) {
    if (status === "SUBSCRIBED") return "connected";
    if (status === "CHANNEL_ERROR" || status === "TIMED_OUT") return "error";
    if (status === "CLOSED") return "disconnected";
    return "reconnecting";
  }

  async function removeChannel(key) {
    const ch = channels.get(key);
    if (!ch) return;
    channels.delete(key);
    try {
      if (key === "presence") {
        try { await ch.untrack(); } catch (_) { /* ignore */ }
      }
      await ch.unsubscribe();
    } catch (_) { /* ignore */ }
  }

  async function setChannel(key, factory) {
    await removeChannel(key);
    const sb = await client();
    const ch = factory(sb);
    channels.set(key, ch);
    return ch;
  }

  function subscribeMessages(conversationId, onInsert) {
    return (async () => {
      await removeChannel("admin-messages");
      if (!conversationId || typeof onInsert !== "function") return;
      await setChannel("admin-messages", (sb) =>
        sb.channel("admin-messages:" + conversationId)
          .on(
            "postgres_changes",
            {
              event: "INSERT",
              schema: "public",
              table: "messages",
              filter: "conversation_id=eq." + conversationId
            },
            (payload) => onInsert(payload.new)
          )
          .subscribe((status) => setConnectionStatus(mapSubscribeStatus(status)))
      );
    })();
  }

  function unsubscribeMessages() {
    return removeChannel("admin-messages");
  }

  function subscribeParticipantMessages(conversationId, onInsert) {
    return (async () => {
      await removeChannel("participant-messages");
      if (!conversationId || typeof onInsert !== "function") return;
      await setChannel("participant-messages", (sb) =>
        sb.channel("participant-messages:" + conversationId)
          .on(
            "postgres_changes",
            {
              event: "INSERT",
              schema: "public",
              table: "messages",
              filter: "conversation_id=eq." + conversationId
            },
            (payload) => onInsert(payload.new)
          )
          .subscribe()
      );
    })();
  }

  function unsubscribeParticipantMessages() {
    return removeChannel("participant-messages");
  }

  function subscribeAdminSupportMessages(conversationId, onInsert) {
    return (async () => {
      await removeChannel("admin-support-messages");
      if (!conversationId || typeof onInsert !== "function") return;
      await setChannel("admin-support-messages", (sb) =>
        sb.channel("admin-support-messages:" + conversationId)
          .on(
            "postgres_changes",
            {
              event: "INSERT",
              schema: "public",
              table: "messages",
              filter: "admin_support_conversation_id=eq." + conversationId
            },
            (payload) => onInsert(payload.new)
          )
          .subscribe()
      );
    })();
  }

  function unsubscribeAdminSupportMessages() {
    return removeChannel("admin-support-messages");
  }

  function subscribeUserNotifications(ownerId, onInsert) {
    return (async () => {
      await removeChannel("user-notifications");
      if (!ownerId || typeof onInsert !== "function") return;
      await setChannel("user-notifications", (sb) =>
        sb.channel("user-notifications:" + ownerId)
          .on(
            "postgres_changes",
            {
              event: "INSERT",
              schema: "public",
              table: "notifications",
              filter: "owner_id=eq." + ownerId
            },
            (payload) => onInsert(payload.new)
          )
          .subscribe()
      );
    })();
  }

  function unsubscribeUserNotifications() {
    return removeChannel("user-notifications");
  }

  function subscribeAdminFeeds(handlers) {
    return (async () => {
      await removeChannel("admin-feeds");
      const h = handlers || {};
      await setChannel("admin-feeds", (sb) => {
        let ch = sb.channel("admin-feeds");
        if (typeof h.onMessageInsert === "function") {
          ch = ch.on(
            "postgres_changes",
            { event: "INSERT", schema: "public", table: "messages" },
            (payload) => h.onMessageInsert(payload.new)
          );
        }
        if (typeof h.onConversationUpdate === "function") {
          ch = ch.on(
            "postgres_changes",
            { event: "UPDATE", schema: "public", table: "conversations" },
            (payload) => h.onConversationUpdate(payload.new, payload.old)
          );
        }
        if (typeof h.onCommRequest === "function") {
          ch = ch.on(
            "postgres_changes",
            { event: "INSERT", schema: "public", table: "communication_requests" },
            (payload) => h.onCommRequest(payload.new)
          );
          ch = ch.on(
            "postgres_changes",
            { event: "UPDATE", schema: "public", table: "communication_requests" },
            (payload) => h.onCommRequest(payload.new)
          );
        }
        if (typeof h.onAdminNotification === "function") {
          ch = ch.on(
            "postgres_changes",
            { event: "INSERT", schema: "public", table: "notifications" },
            (payload) => h.onAdminNotification(payload.new)
          );
        }
        if (typeof h.onMemberChange === "function") {
          ch = ch.on(
            "postgres_changes",
            { event: "*", schema: "public", table: "profiles" },
            () => h.onMemberChange()
          );
          ch = ch.on(
            "postgres_changes",
            { event: "*", schema: "public", table: "professional_profiles" },
            () => h.onMemberChange()
          );
          ch = ch.on(
            "postgres_changes",
            { event: "*", schema: "public", table: "guest_profiles" },
            () => h.onMemberChange()
          );
        }
        ch.subscribe((status) => setConnectionStatus(mapSubscribeStatus(status)));
        return ch;
      });
    })();
  }

  function unsubscribeAdminFeeds() {
    return removeChannel("admin-feeds");
  }

  async function trackPresence(profileId, role) {
    if (!profileId) return;
    await removeChannel("presence");
    await setChannel("presence", (sb) => {
      const ch = sb.channel("welink-presence", {
        config: { presence: { key: profileId } }
      });
      ch.subscribe(async (status) => {
        if (status === "SUBSCRIBED") {
          await ch.track({
            profile_id: profileId,
            role: role || "user",
            online_at: new Date().toISOString()
          });
        }
      });
      return ch;
    });
  }

  function subscribePresence(onSync) {
    const ch = channels.get("presence");
    if (!ch || typeof onSync !== "function") return Promise.resolve();
    ch.on("presence", { event: "sync" }, () => onSync(ch.presenceState()));
    if (ch.state === "joined") onSync(ch.presenceState());
    return Promise.resolve();
  }

  async function unsubscribePresence() {
    return removeChannel("presence");
  }

  async function disposeAll() {
    const keys = [...channels.keys()];
    await Promise.all(keys.map((k) => removeChannel(k)));
    setConnectionStatus("idle");
  }

  global.WeLinkRealtime = {
    subscribeMessages,
    unsubscribeMessages,
    subscribeParticipantMessages,
    unsubscribeParticipantMessages,
    subscribeAdminSupportMessages,
    unsubscribeAdminSupportMessages,
    subscribeUserNotifications,
    unsubscribeUserNotifications,
    subscribeAdminFeeds,
    unsubscribeAdminFeeds,
    trackPresence,
    subscribePresence,
    unsubscribePresence,
    disposeAll,
    getConnectionStatus() {
      return connectionStatus;
    },
    onConnectionStatusChange(cb) {
      if (typeof cb !== "function") return () => {};
      statusListeners.add(cb);
      cb(connectionStatus);
      return () => statusListeners.delete(cb);
    },
    isOnline(presenceState, profileId) {
      if (!presenceState || !profileId) return false;
      return Object.values(presenceState).some((entries) =>
        (entries || []).some((e) => e.profile_id === profileId)
      );
    }
  };
})(window);
