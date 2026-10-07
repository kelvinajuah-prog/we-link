(function (global) {
  const STORE_VERSION = "silent-admin-monitoring";
  const COMM_COOLDOWN_MS = 24 * 60 * 60 * 1000;
  const ADMIN_EMAIL = "kelvinajuah@gmail.com";
  const ADMIN_WHATSAPP = "237678531597";
  const ADMIN_ID = "admin-profile";

  const SKILLS = [
    "Fashion Designer",
    "Teaching",
    "Agriculture Expert",
    "Web Developer",
    "Mechanics",
    "Hair Braiding",
    "Pastries",
    "Basketball"
  ];

  const SAMPLES = [
    { id: "s1", name: "Marie Fotso", skill: "Fashion Designer", location: "Yaoundé", bio: "8 years tailoring bridal and Ankara wear.", sample: true },
    { id: "s2", name: "Paul Ngu", skill: "Teaching", location: "Douala", bio: "Math and English tutor for secondary students.", sample: true },
    { id: "s3", name: "Amina Bello", skill: "Agriculture Expert", location: "Buea", bio: "Crop rotation and poultry advisor for small farms.", sample: true },
    { id: "s4", name: "Joel Tabi", skill: "Web Developer", location: "Yaoundé", bio: "Builds websites and booking apps for local shops.", sample: true },
    { id: "s5", name: "Eric Manga", skill: "Mechanics", location: "Douala", bio: "Engine and bike specialist, roadside and workshop.", sample: true },
    { id: "s6", name: "Blessing Eno", skill: "Hair Braiding", location: "Bamenda", bio: "Cornrows, twists and bridal braids.", sample: true },
    { id: "s7", name: "Rita Ngono", skill: "Pastries", location: "Yaoundé", bio: "Custom cakes for birthdays and weddings.", sample: true },
    { id: "s8", name: "Coach Kameni", skill: "Basketball", location: "Douala", bio: "Youth basketball coaching and fitness drills.", sample: true }
  ];

  let cachedSession = null;
  let cachedDb = null;
  const listeners = new Set();

  async function sb() {
    return WeLinkSupabase.sb();
  }

  function emitChange() {
    cachedDb = null;
    listeners.forEach((cb) => cb());
  }

  function onChange(cb) {
    listeners.add(cb);
    return () => listeners.delete(cb);
  }

  function flushCache() {
    cachedDb = null;
  }

  function ts(v) {
    return v ? new Date(v).getTime() : 0;
  }

  function normalizeProSkillsInput(data) {
    const list = [];
    const primary = String(data.skill || "").trim();
    if (primary) list.push(primary);
    const secondaryRaw = data.secondarySkills != null ? data.secondarySkills : data.skills;
    if (Array.isArray(secondaryRaw)) {
      secondaryRaw.forEach((s) => {
        const t = String(s || "").trim();
        if (t && !list.some((x) => x.toLowerCase() === t.toLowerCase())) list.push(t);
      });
    } else if (secondaryRaw) {
      String(secondaryRaw)
        .split(/[\n,;|]+/)
        .map((s) => s.trim())
        .filter(Boolean)
        .forEach((t) => {
          if (!list.some((x) => x.toLowerCase() === t.toLowerCase())) list.push(t);
        });
    }
    const joined = list.join(", ");
    return { skill: list[0] || "", skills: joined };
  }

  function mapPro(p, pro) {
    if (!p || !pro) return null;
    return {
      id: p.id,
      name: p.name,
      email: p.email,
      phone: p.phone || "",
      photo: p.photo_url || "",
      skill: pro.skill,
      skills: (pro.skills && String(pro.skills).trim()) || pro.skill || "",
      location: pro.location,
      bio: pro.bio || "",
      achievements: pro.achievements || "",
      status: pro.status,
      accountStatus: p.account_status || "active",
      rejectionReason: pro.rejection_reason || "",
      approvedAt: ts(pro.approved_at),
      createdAt: ts(p.created_at)
    };
  }

  function mapGuest(p, g) {
    if (!p || !g) return null;
    return {
      id: p.id,
      name: p.name,
      email: p.email,
      phone: p.phone || "",
      photo: p.photo_url || "",
      age: g.age,
      town: g.town || "",
      area: g.area || "",
      specialization: g.specialization,
      skills: g.skills || "",
      accountStatus: p.account_status || "active",
      createdAt: ts(p.created_at)
    };
  }

  async function authUserId(client) {
    const { data: { user } } = await client.auth.getUser();
    return user?.id || null;
  }

  async function fetchProfile(userId) {
    const client = await sb();
    const { data: p, error } = await client.from("profiles").select("*").eq("id", userId).maybeSingle();
    if (error) {
      console.error("[WeLink] fetchProfile failed:", userId, error);
      return null;
    }
    if (!p) return null;
    return p;
  }

  async function fetchGuestRow(userId) {
    const client = await sb();
    const { data: g, error } = await client.from("guest_profiles").select("profile_id").eq("profile_id", userId).maybeSingle();
    if (error) {
      console.error("[WeLink] fetchGuestRow failed:", userId, error);
      return null;
    }
    if (!g) return null;
    return g;
  }

  async function fetchProfessionalRow(userId) {
    const client = await sb();
    const { data: pro, error } = await client
      .from("professional_profiles")
      .select("profile_id, status")
      .eq("profile_id", userId)
      .maybeSingle();
    if (error) {
      console.error("[WeLink] fetchProfessionalRow failed:", userId, error);
      return null;
    }
    return pro;
  }

  function mapSignInAuthError(error) {
    const msg = (error?.message || String(error || "")).toLowerCase();
    if (msg.includes("invalid login credentials") || msg.includes("invalid email or password")) {
      return "Invalid email or password.";
    }
    if (msg.includes("email not confirmed") || msg.includes("email confirmation")) {
      return "Please confirm your email before signing in. Check your inbox for the confirmation link.";
    }
    if (msg.includes("user not found") || msg.includes("no user found")) {
      return "No account was found with this email.";
    }
    if (msg.includes("network") || msg.includes("fetch failed") || msg.includes("failed to fetch")) {
      return "Network error. Check your connection and try again.";
    }
    return error?.message || "Sign in failed. Please try again.";
  }

  function redirectPathForRole(role) {
    if (role === "admin") return "admin.html";
    return "dashboard.html";
  }

  function establishSession(profile) {
    cachedSession = {
      id: profile.id,
      email: profile.email,
      name: profile.name,
      role: profile.role
    };
    if (global.WeLinkRealtime?.trackPresence) {
      global.WeLinkRealtime.trackPresence(profile.id, profile.role).catch(() => {});
    }
    emitChange();
  }

  function isDuplicateKeyError(err) {
    return err?.code === "23505" || /duplicate key/i.test(err?.message || "");
  }

  function isExistingUserAuthError(err) {
    const msg = (err?.message || "").toLowerCase();
    return msg.includes("already registered") || msg.includes("already exists") || msg.includes("user already");
  }

  async function getProfileCompletionState() {
    const client = await sb();
    const { data: { session } } = await client.auth.getSession();
    if (!session?.user) return null;
    const profile = await fetchProfile(session.user.id);
    if (!profile) {
      return {
        userId: session.user.id,
        email: session.user.email,
        needsProfile: true,
        needsGuestDetails: true
      };
    }
    if (profile.role === "guest") {
      const guest = await fetchGuestRow(session.user.id);
      if (!guest) {
        return {
          userId: session.user.id,
          email: session.user.email,
          needsProfile: false,
          needsGuestDetails: true,
          profile
        };
      }
    }
    return null;
  }

  async function ensureAuthenticated(client, normalizedEmail, password) {
    const email = normalizedEmail.trim().toLowerCase();

    const { data: { session: existingSession } } = await client.auth.getSession();
    if (existingSession?.user?.id) {
      const sessionEmail = (existingSession.user.email || "").trim().toLowerCase();
      if (sessionEmail === email) {
        return {
          ok: true,
          userId: existingSession.user.id,
          session: existingSession,
          reusedSession: true
        };
      }
    }

    if (!password) {
      return { ok: false, error: "Password is required unless you are already signed in with this email." };
    }

    const { data: signInData, error: signInErr } = await client.auth.signInWithPassword({
      email,
      password
    });

    if (signInData?.session?.user?.id) {
      return { ok: true, userId: signInData.user.id, session: signInData.session };
    }

    const invalidCreds = signInErr && /invalid login credentials/i.test(signInErr.message);
    if (!invalidCreds) {
      return { ok: false, error: signInErr?.message || "Sign-in failed." };
    }

    const { data: authData, error: signErr } = await client.auth.signUp({
      email,
      password
    });
    if (signErr) {
      if (isExistingUserAuthError(signErr)) {
        return {
          ok: false,
          needsLogin: true,
          error: "An account with this email already exists. Use guest login with your password — if your profile is incomplete, a completion form will appear on the same page."
        };
      }
      return { ok: false, error: signErr.message };
    }

    const userId = authData?.user?.id;
    if (!userId) return { ok: false, error: "Could not create account." };

    if (authData.session) {
      await client.auth.setSession({
        access_token: authData.session.access_token,
        refresh_token: authData.session.refresh_token
      });
    } else {
      const { data: retrySignIn, error: retryErr } = await client.auth.signInWithPassword({
        email,
        password
      });
      if (retryErr || !retrySignIn.session) {
        return {
          ok: false,
          error: "Account created but sign-in failed. Ensure email confirmation is disabled in Supabase Auth settings."
        };
      }
      await client.auth.setSession({
        access_token: retrySignIn.session.access_token,
        refresh_token: retrySignIn.session.refresh_token
      });
    }

    const verifiedId = await authUserId(client);
    if (!verifiedId) {
      return { ok: false, error: "Authentication session could not be established. Try again." };
    }

    return { ok: true, userId: verifiedId, session: authData.session };
  }

  function accountBlocked(profile) {
    return profile?.account_status && profile.account_status !== "active";
  }

  async function sessionFromAuth() {
    const client = await sb();
    const { data: { session: authSession } } = await client.auth.getSession();
    if (!authSession?.user) {
      cachedSession = null;
      return null;
    }
    const profile = await fetchProfile(authSession.user.id);
    if (!profile || accountBlocked(profile)) {
      cachedSession = null;
      if (profile && accountBlocked(profile)) await client.auth.signOut();
      return null;
    }
    if (profile.role === "guest") {
      const guestRow = await fetchGuestRow(authSession.user.id);
      if (!guestRow) {
        cachedSession = null;
        return null;
      }
    }
    cachedSession = {
      id: profile.id,
      email: profile.email,
      name: profile.name,
      role: profile.role
    };
    if (global.WeLinkRealtime?.trackPresence) {
      global.WeLinkRealtime.trackPresence(profile.id, profile.role).catch(() => {});
    }
    return cachedSession;
  }

  function session() {
    return cachedSession;
  }

  async function initSession() {
    await WeLinkSupabase.ready;
    const client = await sb();
    client.auth.onAuthStateChange(() => {
      sessionFromAuth().then(emitChange);
    });
    return sessionFromAuth();
  }

  const ready = initSession();

  async function load() {
    if (cachedDb) return cachedDb;
    const client = await sb();
    const [
      { data: profiles },
      { data: guestRows },
      { data: proRows },
      { data: connections },
      { data: conversationRows },
      { data: commRequestRows },
      { data: adminSupportRequestRows },
      { data: adminSupportConversationRows },
      { data: messages },
      { data: notifications },
      { data: whatsappRequests },
      { data: eventRows }
    ] = await Promise.all([
      client.from("profiles").select("*"),
      client.from("guest_profiles").select("*"),
      client.from("professional_profiles").select("*"),
      client.from("connections").select("*"),
      client.from("conversations").select("*"),
      client.from("communication_requests").select("*"),
      client.from("admin_support_requests").select("*"),
      client.from("admin_support_conversations").select("*"),
      client.from("messages").select("*").order("created_at"),
      client.from("notifications").select("*").order("created_at", { ascending: false }),
      client.from("whatsapp_requests").select("*"),
      client.from("welink_events").select("*").order("event_at", { ascending: true })
    ]);

    const guestMap = Object.fromEntries((guestRows || []).map((g) => [g.profile_id, g]));
    const proMap = Object.fromEntries((proRows || []).map((p) => [p.profile_id, p]));

    const guests = (profiles || [])
      .filter((p) => p.role === "guest")
      .map((p) => mapGuest(p, guestMap[p.id]))
      .filter(Boolean);

    const professionals = (profiles || [])
      .filter((p) => p.role === "professional")
      .map((p) => mapPro(p, proMap[p.id]))
      .filter(Boolean);

    const nameById = Object.fromEntries((profiles || []).map((p) => [p.id, p.name]));

    cachedDb = {
      guests,
      professionals,
      connections: (connections || []).map((c) => ({
        id: c.id,
        guestId: c.guest_id,
        proId: c.pro_id,
        guestName: nameById[c.guest_id] || "",
        proName: nameById[c.pro_id] || "",
        createdAt: ts(c.created_at)
      })),
      conversations: (conversationRows || []).map((c) => ({
        id: c.id,
        communicationRequestId: c.communication_request_id,
        guestId: c.guest_id,
        proId: c.pro_id,
        status: c.status,
        monitoringConsentGuest: c.monitoring_consent_guest,
        monitoringConsentPro: c.monitoring_consent_pro,
        guestName: nameById[c.guest_id] || "",
        proName: nameById[c.pro_id] || "",
        createdAt: ts(c.created_at)
      })),
      adminSupportRequests: (adminSupportRequestRows || []).map((r) => ({
        id: r.id,
        requesterId: r.requester_id,
        requesterRole: r.requester_role,
        status: r.status,
        rejectedAt: ts(r.rejected_at),
        respondedAt: ts(r.responded_at),
        createdAt: ts(r.created_at),
        requesterName: nameById[r.requester_id] || ""
      })),
      adminSupportConversations: (adminSupportConversationRows || []).map((c) => ({
        id: c.id,
        requestId: c.request_id,
        participantId: c.participant_id,
        participantRole: c.participant_role,
        status: c.status,
        initiatedBy: c.initiated_by,
        participantName: nameById[c.participant_id] || "",
        createdAt: ts(c.created_at)
      })),
      communicationRequests: (commRequestRows || []).map((r) => {
        const guest = guests.find((g) => g.id === r.guest_id);
        const pro = professionals.find((p) => p.id === r.pro_id);
        return {
          id: r.id,
          guestId: r.guest_id,
          proId: r.pro_id,
          status: r.status,
          rejectedAt: ts(r.rejected_at),
          respondedAt: ts(r.responded_at),
          createdAt: ts(r.created_at),
          guestName: guest?.name || nameById[r.guest_id] || "",
          proName: pro?.name || nameById[r.pro_id] || "",
          guestPhoto: guest?.photo || "",
          proPhoto: pro?.photo || "",
          guestSpecialization: guest?.specialization || "",
          proSkill: pro?.skill || ""
        };
      }),
      messages: (messages || []).map((m) => ({
        id: m.id,
        connectionId: m.connection_id,
        conversationId: m.conversation_id,
        adminSupportConversationId: m.admin_support_conversation_id,
        fromId: m.from_id,
        fromRole: m.from_role,
        toId: m.to_id,
        toRole: m.to_role,
        body: m.body,
        imageUrl: m.image_url || "",
        createdAt: ts(m.created_at)
      })),
      events: (eventRows || []).map((e) => ({
        id: e.id,
        proId: e.pro_id,
        proName: nameById[e.pro_id] || "",
        title: e.title,
        description: e.description || "",
        eventAt: ts(e.event_at),
        status: e.status,
        createdAt: ts(e.created_at),
        updatedAt: ts(e.updated_at)
      })),
      notifications: (notifications || []).map((n) => ({
        id: n.id,
        ownerId: n.owner_id,
        message: n.message,
        read: n.read,
        createdAt: ts(n.created_at)
      })),
      whatsappRequests: (whatsappRequests || []).map((w) => ({
        id: w.id,
        connectionId: w.connection_id,
        guestId: w.guest_id,
        proId: w.pro_id,
        status: w.status,
        createdAt: ts(w.created_at),
        resolvedAt: ts(w.resolved_at)
      })),
      session: cachedSession
    };
    return cachedDb;
  }

  async function notifyUser(ownerId, message) {
    const client = await sb();
    await client.from("notifications").insert({ owner_id: ownerId, message });
    emitChange();
  }

  async function uploadDataUrl(userId, dataUrl, filename) {
    if (!dataUrl || !String(dataUrl).startsWith("data:")) return "";
    const res = await fetch(dataUrl);
    const blob = await res.blob();
    const ext = (blob.type.split("/")[1] || "jpg").replace("jpeg", "jpg");
    const path = `${userId}/${filename}.${ext}`;
    const client = await sb();
    const { error } = await client.storage.from("welink-uploads").upload(path, blob, {
      upsert: true,
      contentType: blob.type
    });
    if (error) return dataUrl;
    const { data } = client.storage.from("welink-uploads").getPublicUrl(path);
    return data.publicUrl;
  }

  async function login(email, password) {
    try {
      await ready;
    } catch (initErr) {
      console.error("[WeLink] Auth init failed:", initErr);
      return {
        ok: false,
        error: "Unable to connect to authentication. Check js/config.js and open the site over http(s), not file://."
      };
    }

    const trimmedEmail = (email || "").trim().toLowerCase();
    if (!trimmedEmail || !(password || "").length) {
      return { ok: false, error: "Email and password are required." };
    }

    let client;
    try {
      client = await sb();
    } catch (clientErr) {
      console.error("[WeLink] Supabase client error:", clientErr);
      return { ok: false, error: "Authentication service unavailable. Please try again." };
    }

    const { data, error } = await client.auth.signInWithPassword({
      email: trimmedEmail,
      password
    });
    if (error) {
      console.error("[WeLink] signInWithPassword failed:", error);
      return { ok: false, error: mapSignInAuthError(error) };
    }

    const userId = data.user?.id;
    if (!userId) {
      console.error("[WeLink] signInWithPassword returned no user id");
      return { ok: false, error: "Sign in failed. Please try again." };
    }

    const profile = await fetchProfile(userId);
    if (!profile) {
      console.error("[WeLink] Authenticated user has no profiles row:", userId, trimmedEmail);
      return {
        ok: false,
        incompleteProfile: true,
        role: "guest",
        error:
          "You are signed in, but your WeLink profile record is missing. Complete the form below to finish setup — do not register again with the same email."
      };
    }

    if (accountBlocked(profile)) {
      await client.auth.signOut();
      cachedSession = null;
      const status = profile.account_status;
      return {
        ok: false,
        error:
          status === "suspended"
            ? "Your account has been suspended. Contact admin for assistance."
            : status === "deactivated"
              ? "Your account has been deactivated. Contact admin for assistance."
              : "Your account is not active. Contact admin for assistance."
      };
    }

    const role = profile.role;

    if (role === "guest") {
      const guestRow = await fetchGuestRow(userId);
      if (!guestRow) {
        return {
          ok: false,
          incompleteProfile: true,
          role: "guest",
          error: "Finish your guest profile below to access the dashboard."
        };
      }
    }

    if (role === "professional") {
      const proRow = await fetchProfessionalRow(userId);
      if (!proRow) {
        console.error("[WeLink] Professional user missing professional_profiles row:", userId);
        await client.auth.signOut();
        cachedSession = null;
        return {
          ok: false,
          error:
            "Your account is registered as a professional, but profile details are missing. Contact support — do not create a new account."
        };
      }
      if (proRow.status === "suspended" || proRow.status === "deactivated") {
        await client.auth.signOut();
        cachedSession = null;
        return {
          ok: false,
          error:
            proRow.status === "suspended"
              ? "Your professional account has been suspended. Contact admin for assistance."
              : "Your professional account has been deactivated. Contact admin for assistance."
        };
      }
    }

    if (role !== "guest" && role !== "professional" && role !== "admin") {
      console.error("[WeLink] Unknown profile role:", role, userId);
      await client.auth.signOut();
      cachedSession = null;
      return { ok: false, error: "Your account has an unrecognized role. Contact support." };
    }

    establishSession(profile);
    return { ok: true, role, redirect: redirectPathForRole(role) };
  }

  async function logout() {
    const client = await sb();
    await client.auth.signOut();
    cachedSession = null;
    cachedDb = null;
    emitChange();
  }

  async function completeGuestProfile(data) {
    await ready;
    const client = await sb();
    const { data: { session } } = await client.auth.getSession();
    if (!session?.user?.id) {
      return { ok: false, error: "Sign in first, then complete your profile on this page." };
    }

    const userId = session.user.id;
    const sessionEmail = (session.user.email || "").trim().toLowerCase();
    const formEmail = (data.email || "").trim().toLowerCase();
    if (formEmail && formEmail !== sessionEmail) {
      return { ok: false, error: "Email must match your signed-in account (" + sessionEmail + ")." };
    }

    let profile = await fetchProfile(userId);
    if (profile && profile.role !== "guest") {
      return { ok: false, error: "This account is registered as " + profile.role + ", not guest." };
    }

    const existingGuest = await fetchGuestRow(userId);
    if (existingGuest) {
      cachedSession = { id: userId, email: profile.email, name: profile.name, role: profile.role };
      emitChange();
      return { ok: true, userId, role: "guest" };
    }

    const guestPayload = {
      profile_id: userId,
      age: parseInt(data.age, 10) || null,
      town: (data.town || "").trim(),
      area: (data.area || "").trim(),
      specialization: data.specialization,
      skills: data.skills
    };

    const { error: rpcErr } = await client.rpc("complete_guest_profile", {
      p_name: data.name.trim(),
      p_age: guestPayload.age,
      p_town: guestPayload.town,
      p_area: guestPayload.area,
      p_specialization: guestPayload.specialization,
      p_skills: guestPayload.skills
    });
    let guestErr = null;
    if (rpcErr) {
      if (!profile) {
        const { error: profileErr } = await client.from("profiles").insert({
          id: userId,
          email: sessionEmail,
          name: data.name.trim(),
          role: "guest"
        });
        if (profileErr && !isDuplicateKeyError(profileErr)) {
          return { ok: false, error: profileErr.message };
        }
        profile = await fetchProfile(userId);
        if (!profile) {
          return { ok: false, error: "Could not create your profile row. Try again." };
        }
      }
      const insertRes = await client.from("guest_profiles").insert(guestPayload);
      guestErr = insertRes.error;
      if (guestErr) {
        return { ok: false, error: guestErr.message };
      }
    }

    profile = await fetchProfile(userId);
    const verifyGuest = await fetchGuestRow(userId);
    if (!verifyGuest) {
      return { ok: false, error: "Guest profile save could not be verified. Refresh and try again." };
    }

    const photoUrl = data.photo ? await uploadDataUrl(userId, data.photo, "photo") : "";
    const profileUpdate = { name: data.name.trim() };
    if (photoUrl) profileUpdate.photo_url = photoUrl;
    await client.from("profiles").update(profileUpdate).eq("id", userId);

    cachedSession = { id: userId, email: profile.email, name: data.name.trim(), role: "guest" };
    emitChange();
    return { ok: true, userId, role: "guest" };
  }

  async function signUpAccount({ email, password, name, role, extra }) {
    await ready;
    const client = await sb();
    const normalizedEmail = email.trim().toLowerCase();

    const authRes = await ensureAuthenticated(client, normalizedEmail, password);
    if (!authRes.ok) {
      return {
        ok: false,
        error: authRes.error,
        needsLogin: authRes.needsLogin || false
      };
    }

    const userId = authRes.userId;
    let profile = await fetchProfile(userId);

    if (profile && profile.role !== role) {
      return { ok: false, error: `This account is registered as ${profile.role}, not ${role}.` };
    }

    if (!profile) {
      const { error: profileErr } = await client.from("profiles").insert({
        id: userId,
        email: normalizedEmail,
        name: name.trim(),
        role
      });
      if (profileErr && !isDuplicateKeyError(profileErr)) {
        return { ok: false, error: profileErr.message };
      }
      profile = await fetchProfile(userId);
      if (!profile) {
        return {
          ok: false,
          error: "Could not create or read your profile. Ensure you are using the correct password for this email."
        };
      }
    } else {
      await client.from("profiles").update({ name: name.trim() }).eq("id", userId);
      profile = { ...profile, name: name.trim() };
    }

    if (role === "guest" && extra) {
      const existingGuest = await fetchGuestRow(userId);
      if (existingGuest) {
        return {
          ok: false,
          needsLogin: true,
          error: "You already have a guest account with this email. Sign in instead of registering again."
        };
      }

      const photoUrl = extra.photo ? await uploadDataUrl(userId, extra.photo, "photo") : "";
      const profileUpdate = { name: name.trim() };
      if (photoUrl) profileUpdate.photo_url = photoUrl;
      await client.from("profiles").update(profileUpdate).eq("id", userId);

      const { error: guestErr } = await client.from("guest_profiles").insert({
        profile_id: userId,
        age: parseInt(extra.age, 10) || null,
        town: (extra.town || "").trim(),
        area: (extra.area || "").trim(),
        specialization: extra.specialization,
        skills: extra.skills
      });
      if (guestErr && !isDuplicateKeyError(guestErr)) {
        return { ok: false, error: guestErr.message };
      }
      if (guestErr && isDuplicateKeyError(guestErr)) {
        return { ok: false, error: "You already have a complete account. Please log in." };
      }
    }

    if (role === "professional" && extra) {
      const { data: existingPro } = await client.from("professional_profiles").select("profile_id").eq("profile_id", userId).maybeSingle();
      if (existingPro) {
        return { ok: false, error: "You already have a professional account. Please log in." };
      }

      const photoUrl = extra.photo ? await uploadDataUrl(userId, extra.photo, "photo") : "";
      const profileUpdate = { name: name.trim() };
      if ((extra.phone || "").trim()) profileUpdate.phone = extra.phone.trim();
      if (photoUrl) profileUpdate.photo_url = photoUrl;
      await client.from("profiles").update(profileUpdate).eq("id", userId);

      const { error: proErr } = await client.from("professional_profiles").insert({
        profile_id: userId,
        skill: extra.skill,
        skills: (extra.skills || extra.skill || "").trim(),
        location: extra.location,
        bio: extra.bio,
        achievements: (extra.achievements || "").trim(),
        status: "pending"
      });
      if (proErr && !isDuplicateKeyError(proErr)) {
        return { ok: false, error: proErr.message };
      }
      if (proErr && isDuplicateKeyError(proErr)) {
        return { ok: false, error: "You already have a professional account. Please log in." };
      }
      await notifyUser(userId, "Your professional request was sent. Wait for admin review.");
    }

    cachedSession = { id: userId, email: normalizedEmail, name: name.trim(), role };
    emitChange();
    return {
      ok: true,
      userId,
      role
    };
  }

  async function registerGuest(data) {
    return signUpAccount({
      email: data.email,
      password: data.password,
      name: data.name,
      role: "guest",
      extra: {
        age: data.age,
        town: data.town,
        area: data.area,
        specialization: data.specialization,
        skills: data.skills,
        photo: data.photo
      }
    });
  }

  async function registerPro(data) {
    const skillFields = normalizeProSkillsInput(data);
    const res = await signUpAccount({
      email: data.email,
      password: data.password,
      name: data.name,
      role: "professional",
      extra: {
        skill: skillFields.skill,
        skills: skillFields.skills,
        location: data.location,
        bio: data.bio,
        achievements: data.achievements,
        phone: data.phone,
        photo: data.photo
      }
    });
    if (res.ok) {
      const account = await getPro(res.userId);
      await notifyAdminsOfPendingPro(account);
      return { ok: true, account };
    }
    return res;
  }

  async function registerAdmin(data) {
    const res = await signUpAccount({
      email: data.email,
      password: data.password,
      name: data.name,
      role: "guest"
    });
    if (res.ok) {
      await notifyUser(
        res.userId,
        "Admin account request received. An administrator will grant admin access in Supabase before you can sign in here."
      );
      return { ok: true, userId: res.userId, pendingAdminPromotion: true };
    }
    return res;
  }

  function notifyAdminWhatsApp(account) {
    const text = [
      "WE-LINK: New professional registration",
      "Name: " + account.name,
      "Email: " + account.email,
      "Skills: " + (account.skills || account.skill),
      "Location: " + account.location,
      "Phone: " + (account.phone || "—"),
      "Achievements: " + (account.achievements || "—")
    ].join("\n");
    window.open("https://wa.me/" + ADMIN_WHATSAPP + "?text=" + encodeURIComponent(text), "_blank");
    return { ok: true };
  }

  async function emailAdmin(account) {
    const payload = {
      _subject: "WE-LINK: professional requesting registration",
      name: account.name,
      email: account.email,
      skill: account.skill,
      location: account.location,
      achievements: account.achievements || account.bio,
      message: account.name + " is requesting professional registration on WE-LINK."
    };
    try {
      const res = await fetch("https://formsubmit.co/ajax/" + ADMIN_EMAIL, {
        method: "POST",
        headers: { "Content-Type": "application/json", Accept: "application/json" },
        body: JSON.stringify(payload)
      });
      if (!res.ok) throw new Error("mail");
      return { ok: true };
    } catch {
      return { ok: true, fallback: true };
    }
  }

  async function adminAccept(id) {
    const client = await sb();
    await client.from("professional_profiles").update({
      status: "approved",
      approved_at: new Date().toISOString()
    }).eq("profile_id", id);
    await notifyUser(id, "Your professional profile has been approved. You can now use WE-LINK.");
    emitChange();
  }

  async function notifyAdmins(message) {
    const client = await sb();
    const { data: admins } = await client.from("profiles").select("id").eq("role", "admin");
    if (!admins?.length) return;
    await Promise.all(admins.map((admin) =>
      client.from("notifications").insert({ owner_id: admin.id, message })
    ));
  }

  async function notifyAllGuests(message) {
    const client = await sb();
    const { data: guests } = await client.from("profiles").select("id").eq("role", "guest");
    if (!guests?.length) return;
    await Promise.all(
      guests.map((g) => client.from("notifications").insert({ owner_id: g.id, message }))
    );
  }

  function mapEventRow(e, proName) {
    return {
      id: e.id,
      proId: e.pro_id,
      proName: proName || "",
      title: e.title,
      description: e.description || "",
      eventAt: ts(e.event_at),
      status: e.status,
      createdAt: ts(e.created_at),
      updatedAt: ts(e.updated_at)
    };
  }

  async function scheduleEvent(proId, payload) {
    await ready;
    const session = cachedSession;
    if (!session || session.id !== proId || session.role !== "professional") {
      return { ok: false, error: "Only the signed-in professional can schedule events." };
    }
    const title = (payload.title || "").trim();
    const description = (payload.description || "").trim();
    const eventAtMs = new Date(payload.eventAt).getTime();
    if (!title) return { ok: false, error: "Event title is required." };
    if (!eventAtMs || Number.isNaN(eventAtMs)) return { ok: false, error: "Valid event date and time required." };
    if (eventAtMs <= Date.now()) return { ok: false, error: "Event must be scheduled in the future." };

    const pro = await getPro(proId);
    const client = await sb();
    const { data, error } = await client
      .from("welink_events")
      .insert({
        pro_id: proId,
        title,
        description,
        event_at: new Date(eventAtMs).toISOString(),
        status: "scheduled"
      })
      .select()
      .single();
    if (error) return { ok: false, error: error.message };

    const when = new Date(eventAtMs).toLocaleString();
    const msg = `${pro?.name || "A professional"} scheduled an event: "${title}" on ${when}.`;
    await notifyAdmins(msg);
    await notifyAllGuests(msg);
    flushCache();
    emitChange();
    return { ok: true, event: mapEventRow(data, pro?.name) };
  }

  async function updateScheduledEvent(proId, eventId, payload) {
    await ready;
    const session = cachedSession;
    if (!session || session.id !== proId || session.role !== "professional") {
      return { ok: false, error: "Not authorized." };
    }
    const client = await sb();
    const { data: existing } = await client.from("welink_events").select("*").eq("id", eventId).maybeSingle();
    if (!existing || existing.pro_id !== proId) return { ok: false, error: "Event not found." };
    if (existing.status === "cancelled") return { ok: false, error: "Cancelled events cannot be edited." };

    const patch = { updated_at: new Date().toISOString() };
    if (payload.title !== undefined) patch.title = String(payload.title).trim();
    if (payload.description !== undefined) patch.description = String(payload.description).trim();
    if (payload.eventAt !== undefined) {
      const eventAtMs = new Date(payload.eventAt).getTime();
      if (!eventAtMs || eventAtMs <= Date.now()) {
        return { ok: false, error: "Event must be scheduled in the future." };
      }
      patch.event_at = new Date(eventAtMs).toISOString();
    }

    const { data, error } = await client.from("welink_events").update(patch).eq("id", eventId).select().single();
    if (error) return { ok: false, error: error.message };
    flushCache();
    emitChange();
    const pro = await getPro(proId);
    return { ok: true, event: mapEventRow(data, pro?.name) };
  }

  async function setEventStatus(proId, eventId, status, { admin = false } = {}) {
    await ready;
    const allowed = ["scheduled", "paused", "cancelled"];
    if (!allowed.includes(status)) return { ok: false, error: "Invalid status." };

    const client = await sb();
    const { data: existing } = await client.from("welink_events").select("*").eq("id", eventId).maybeSingle();
    if (!existing) return { ok: false, error: "Event not found." };

    if (admin) {
      const session = cachedSession;
      if (!session || session.role !== "admin") return { ok: false, error: "Admin only." };
    } else {
      const session = cachedSession;
      if (!session || session.id !== proId || session.role !== "professional" || existing.pro_id !== proId) {
        return { ok: false, error: "Not authorized." };
      }
    }

    const { data, error } = await client
      .from("welink_events")
      .update({ status, updated_at: new Date().toISOString() })
      .eq("id", eventId)
      .select()
      .single();
    if (error) return { ok: false, error: error.message };

    const pro = await getPro(existing.pro_id);
    const label = status === "paused" ? "paused" : status === "cancelled" ? "cancelled" : "resumed";
    const msg = `Event "${existing.title}" was ${label}${admin ? " by admin" : ""}.`;
    await notifyAdmins(msg);
    if (status !== "scheduled") await notifyAllGuests(msg);

    flushCache();
    emitChange();
    return { ok: true, event: mapEventRow(data, pro?.name) };
  }

  function listEvents({ includeCancelled = false } = {}) {
    const events = cachedDb?.events || [];
    return includeCancelled ? events.slice() : events.filter((e) => e.status !== "cancelled");
  }

  async function notifyAdminsOfPendingPro(account) {
    await notifyAdmins(`New professional registration: ${account.name} (${account.skill}, ${account.location})`);
    emitChange();
  }

  async function adminReject(id, reason) {
    const client = await sb();
    const trimmed = (reason || "").trim();
    await client.from("professional_profiles").update({
      status: "rejected",
      rejection_reason: trimmed || null
    }).eq("profile_id", id);
    const msg = trimmed
      ? `Your request was rejected. Reason: ${trimmed}. You may re-upload your information.`
      : "Your request was rejected. You may re-upload your information.";
    await notifyUser(id, msg);
    emitChange();
  }

  async function resubmitPro(id, data) {
    const client = await sb();
    let photoUrl = "";
    if (data.photo) photoUrl = await uploadDataUrl(id, data.photo, "photo");
    await client.from("profiles").update({
      name: data.name.trim(),
      phone: (data.phone || "").trim(),
      ...(photoUrl ? { photo_url: photoUrl } : {})
    }).eq("id", id);
    const skillFields = normalizeProSkillsInput(data);
    await client.from("professional_profiles").update({
      skill: skillFields.skill,
      skills: skillFields.skills,
      location: data.location.trim(),
      bio: data.bio.trim(),
      achievements: (data.achievements || "").trim(),
      status: "pending",
      rejection_reason: null
    }).eq("profile_id", id);
    await notifyUser(id, "Your request was uploaded again. Wait for admin review.");
    emitChange();
    const account = await getPro(id);
    await notifyAdminsOfPendingPro(account);
    return { ok: true, account };
  }

  async function adminDeleteMember(id, role) {
    const client = await sb();
    await client.from("profiles").delete().eq("id", id);
    emitChange();
  }

  async function adminSetAccountStatus(id, accountStatus) {
    const client = await sb();
    await client.from("profiles").update({ account_status: accountStatus }).eq("id", id);
    const label = accountStatus === "active" ? "reactivated" : accountStatus;
    await notifyUser(id, `Your account has been ${label}.`);
    emitChange();
  }

  async function adminSetProStatus(id, status) {
    const client = await sb();
    const updates = { status };
    if (status === "approved") updates.approved_at = new Date().toISOString();
    await client.from("professional_profiles").update(updates).eq("profile_id", id);
    const messages = {
      approved: "Your professional profile has been approved. You can now use WE-LINK.",
      rejected: "Your professional application was rejected.",
      suspended: "Your professional account has been suspended. Contact admin for assistance.",
      deactivated: "Your professional account has been deactivated. Contact admin for assistance."
    };
    if (messages[status]) await notifyUser(id, messages[status]);
    emitChange();
  }

  async function adminSuspendMember(id, role) {
    const client = await sb();
    await client.from("profiles").update({ account_status: "suspended" }).eq("id", id);
    if (role === "professional") {
      await client.from("professional_profiles").update({ status: "suspended" }).eq("profile_id", id);
    }
    await notifyUser(id, "Your account has been suspended. Contact admin for assistance.");
    emitChange();
  }

  async function adminDeactivateMember(id, role) {
    const client = await sb();
    await client.from("profiles").update({ account_status: "deactivated" }).eq("id", id);
    if (role === "professional") {
      await client.from("professional_profiles").update({ status: "deactivated" }).eq("profile_id", id);
    }
    await notifyUser(id, "Your account has been deactivated. Contact admin for assistance.");
    emitChange();
  }

  async function adminReactivateMember(id, role) {
    const client = await sb();
    await client.from("profiles").update({ account_status: "active" }).eq("id", id);
    if (role === "professional") {
      const db = await load();
      const pro = db.professionals.find((p) => p.id === id);
      if (pro && ["suspended", "deactivated"].includes(pro.status)) {
        await client.from("professional_profiles").update({
          status: "approved",
          approved_at: new Date().toISOString()
        }).eq("profile_id", id);
      }
    }
    await notifyUser(id, "Your account has been reactivated.");
    emitChange();
  }

  async function getAdminStats() {
    const db = await load();
    const allMembers = [...db.guests, ...db.professionals];
    return {
      totalRegisteredMembers: allMembers.length,
      activeMembers: allMembers.filter((m) => m.accountStatus === "active").length,
      totalProfessionals: db.professionals.length,
      totalGuests: db.guests.length,
      pendingApplications: db.professionals.filter((p) => p.status === "pending").length,
      approvedProfessionals: db.professionals.filter((p) => p.status === "approved").length,
      rejectedApplications: db.professionals.filter((p) => p.status === "rejected").length,
      activeCommunicationConnections: db.conversations.filter((c) => c.status === "active").length,
      totalMembers: allMembers.length,
      activeProfessionals: db.professionals.filter((p) => p.status === "approved").length,
      activeGuests: db.guests.length,
      pendingProfessionals: db.professionals.filter((p) => p.status === "pending").length,
      totalConnections: db.conversations.filter((c) => c.status === "active").length,
      totalMessages: db.messages.length,
      pendingWhatsApp: db.whatsappRequests.filter((w) => w.status === "pending").length,
      pendingComm: db.communicationRequests.filter((r) => r.status === "pending").length,
      activeComm: db.conversations.filter((c) => c.status === "active").length
    };
  }

  function getAdminProfile() {
    const s = cachedSession;
    return { name: s?.name || "Admin", photo: "" };
  }

  async function updateProfilePhoto(id, role, photo) {
    const photoUrl = await uploadDataUrl(id, photo, "photo");
    const client = await sb();
    await client.from("profiles").update({ photo_url: photoUrl }).eq("id", id);
    emitChange();
  }

  async function updateGuestProfile(userId, data) {
    await ready;
    const session = cachedSession;
    if (!session || session.id !== userId || session.role !== "guest") {
      return { ok: false, error: "You must be signed in as this guest to edit the profile." };
    }
    const client = await sb();
    let photoUrl = "";
    if (data.photo) photoUrl = await uploadDataUrl(userId, data.photo, "photo");
    const profileUpdate = { name: (data.name || "").trim() };
    if (photoUrl) profileUpdate.photo_url = photoUrl;
    const { error: profileErr } = await client.from("profiles").update(profileUpdate).eq("id", userId);
    if (profileErr) return { ok: false, error: profileErr.message };
    const { error: guestErr } = await client.from("guest_profiles").update({
      age: parseInt(data.age, 10) || null,
      town: (data.town || "").trim(),
      area: (data.area || "").trim(),
      specialization: data.specialization,
      skills: (data.skills || "").trim()
    }).eq("profile_id", userId);
    if (guestErr) return { ok: false, error: guestErr.message };
    cachedSession = { ...session, name: profileUpdate.name };
    flushCache();
    emitChange();
    return { ok: true };
  }

  async function updateProfessionalProfile(userId, data) {
    await ready;
    const session = cachedSession;
    if (!session || session.id !== userId || session.role !== "professional") {
      return { ok: false, error: "You must be signed in as this professional to edit the profile." };
    }
    const client = await sb();
    const { data: proRow } = await client.from("professional_profiles").select("status").eq("profile_id", userId).maybeSingle();
    if (!proRow) return { ok: false, error: "Professional profile record not found." };
    if (proRow.status === "rejected") {
      return { ok: false, error: "Use the re-upload form on your dashboard while your application is rejected." };
    }
    let photoUrl = "";
    if (data.photo) photoUrl = await uploadDataUrl(userId, data.photo, "photo");
    const profileUpdate = {
      name: (data.name || "").trim(),
      phone: (data.phone || "").trim()
    };
    if (photoUrl) profileUpdate.photo_url = photoUrl;
    const { error: profileErr } = await client.from("profiles").update(profileUpdate).eq("id", userId);
    if (profileErr) return { ok: false, error: profileErr.message };
    const skillFields = normalizeProSkillsInput(data);
    const { error: proErr } = await client.from("professional_profiles").update({
      skill: skillFields.skill,
      skills: skillFields.skills,
      location: (data.location || "").trim(),
      bio: (data.bio || "").trim(),
      achievements: (data.achievements || "").trim()
    }).eq("profile_id", userId);
    if (proErr) return { ok: false, error: proErr.message };
    cachedSession = { ...session, name: profileUpdate.name };
    flushCache();
    emitChange();
    return { ok: true };
  }

  async function getOrCreateConnection(guestId, proId) {
    const db = await load();
    let conn = db.connections.find((c) => c.guestId === guestId && c.proId === proId);
    if (conn) return conn;
    const client = await sb();
    const { data, error } = await client.from("connections").insert({ guest_id: guestId, pro_id: proId }).select().single();
    if (error) return null;
    emitChange();
    return { id: data.id, guestId, proId, createdAt: ts(data.created_at) };
  }

  function guestProPair(fromId, fromRole, toId, toRole) {
    if (fromRole === "guest" && toRole === "professional") return { guestId: fromId, proId: toId };
    if (fromRole === "professional" && toRole === "guest") return { guestId: toId, proId: fromId };
    return null;
  }

  function getCommRequest(guestId, proId) {
    return (cachedDb?.communicationRequests || [])
      .filter((r) => r.guestId === guestId && r.proId === proId)
      .sort((a, b) => b.createdAt - a.createdAt)[0] || null;
  }

  function findConversation(guestId, proId) {
    const list = (cachedDb?.conversations || []).filter((c) =>
      c.guestId === guestId && c.proId === proId
    );
    if (!list.length) return null;
    return list.slice().sort((a, b) => b.createdAt - a.createdAt)[0];
  }

  function deriveCommunicationAdminStatus(request, conversation) {
    if (!request) return { key: "none", label: "—" };
    if (request.status === "pending") return { key: "pending", label: "Pending" };
    if (request.status === "rejected") return { key: "rejected", label: "Rejected" };
    if (request.status === "cancelled") return { key: "cancelled", label: "Cancelled" };
    if (request.status === "ended" || conversation?.status === "closed") {
      return { key: "ended", label: "Ended" };
    }
    if (request.status === "accepted" && conversation?.status === "suspended") {
      return { key: "suspended", label: "Suspended" };
    }
    if (request.status === "accepted" && (!conversation || conversation.status === "active")) {
      return { key: "active", label: "Active" };
    }
    return { key: request.status, label: String(request.status || "—") };
  }

  function buildCommunicationPermissionRows(db) {
    const source = db || cachedDb;
    if (!source) return [];
    const byPair = new Map();
    (source.communicationRequests || []).forEach((r) => {
      const key = r.guestId + ":" + r.proId;
      const prev = byPair.get(key);
      if (!prev || r.createdAt > prev.request.createdAt) {
        const conversation = (source.conversations || []).find(
          (c) => c.guestId === r.guestId && c.proId === r.proId
        ) || null;
        byPair.set(key, { request: r, conversation });
      }
    });
    return Array.from(byPair.values())
      .map((row) => ({
        ...row,
        displayStatus: deriveCommunicationAdminStatus(row.request, row.conversation)
      }))
      .sort((a, b) => b.request.createdAt - a.request.createdAt);
  }

  function getActiveConversation(guestId, proId) {
    const c = findConversation(guestId, proId);
    return c && c.status === "active" ? c : null;
  }

  function canPrivateChat(guestId, proId) {
    return Boolean(getActiveConversation(guestId, proId));
  }

  function isCommunicationEnded(guestId, proId) {
    const req = getCommRequest(guestId, proId);
    const c = findConversation(guestId, proId);
    return req?.status === "ended" || c?.status === "closed";
  }

  function conversationChatBlockedReason(guestId, proId) {
    const req = getCommRequest(guestId, proId);
    const c = findConversation(guestId, proId);
    if (req?.status === "ended" || c?.status === "closed") {
      return "Communication was ended by an administrator. Submit a new communication request to chat again.";
    }
    if (c?.status === "suspended") {
      return "This conversation was suspended by an administrator.";
    }
    return "";
  }

  function canReRequest(lastRejectedAt) {
    return !lastRejectedAt || Date.now() - lastRejectedAt >= COMM_COOLDOWN_MS;
  }

  function cooldownUntil(lastRejectedAt) {
    return lastRejectedAt ? lastRejectedAt + COMM_COOLDOWN_MS : 0;
  }

  function getPrivateMessages(guestId, proId) {
    const conv = getActiveConversation(guestId, proId);
    if (!conv) return [];
    return (cachedDb?.messages || []).filter((m) => m.conversationId === conv.id);
  }

  async function requestGuestCommunication(guestId, proId) {
    const session = cachedSession;
    if (!session || session.role !== "guest" || session.id !== guestId) {
      return { ok: false, error: "Only guests can request communication with professionals." };
    }
    const db = await load();
    const pro = db.professionals.find((p) => p.id === proId);
    if (!pro || pro.status !== "approved") {
      return { ok: false, error: "You can only request communication with an approved professional." };
    }
    const conv = findConversation(guestId, proId);
    if (conv?.status === "active") {
      return { ok: false, error: "Communication is already active with this professional." };
    }
    if (conv?.status === "suspended") {
      return {
        ok: false,
        error: "Communication is suspended by an administrator. Wait for admin to resume before requesting again."
      };
    }
    const pending = db.communicationRequests.find((r) =>
      r.guestId === guestId && r.proId === proId && r.status === "pending"
    );
    if (pending) return { ok: false, error: "A communication request is already pending admin approval." };
    const lastRejected = db.communicationRequests
      .filter((r) => r.guestId === guestId && r.proId === proId && r.status === "rejected" && r.rejectedAt)
      .sort((a, b) => b.rejectedAt - a.rejectedAt)[0];
    if (lastRejected && !canReRequest(lastRejected.rejectedAt)) {
      return {
        ok: false,
        error: "Please wait until " + new Date(cooldownUntil(lastRejected.rejectedAt)).toLocaleString() + " before requesting again."
      };
    }
    const client = await sb();
    const { data, error } = await client.from("communication_requests").insert({
      guest_id: guestId,
      pro_id: proId,
      status: "pending"
    }).select().single();
    if (error) return { ok: false, error: error.message };
    const guestName = db.guests.find((g) => g.id === guestId)?.name || session.name || "A guest";
    await notifyUser(proId, guestName + " requested communication with you. Admin will approve or reject it.");
    await notifyAdmins("Communication request: " + guestName + " → " + pro.name);
    emitChange();
    return { ok: true, request: data };
  }

  async function cancelCommunication(requestId, guestId) {
    const session = cachedSession;
    if (!session || session.role !== "guest" || session.id !== guestId) {
      return { ok: false, error: "Only the guest who created this request can cancel it." };
    }
    const db = await load();
    const req = db.communicationRequests.find((r) => r.id === requestId);
    if (!req || req.guestId !== guestId) return { ok: false, error: "Request not found." };
    if (req.status !== "pending") return { ok: false, error: "Only pending requests can be cancelled." };
    const client = await sb();
    const { error } = await client.from("communication_requests").update({ status: "cancelled" }).eq("id", requestId);
    if (error) return { ok: false, error: error.message };
    const guestName = db.guests.find((g) => g.id === guestId)?.name || session.name || "A guest";
    await notifyUser(req.proId, guestName + " cancelled their communication request.");
    emitChange();
    return { ok: true };
  }

  async function adminApproveCommunication(requestId) {
    const session = cachedSession;
    if (!session || session.role !== "admin") {
      return { ok: false, error: "Only admin can approve communication requests." };
    }
    const db = await load();
    const req = db.communicationRequests.find((r) => r.id === requestId);
    if (!req) return { ok: false, error: "Request not found." };
    const client = await sb();
    if (req.status === "pending") {
      const { error } = await client.from("communication_requests").update({
        status: "accepted",
        responded_at: new Date().toISOString()
      }).eq("id", requestId).eq("status", "pending");
      if (error) return { ok: false, error: error.message };
    } else if (req.status !== "accepted") {
      return { ok: false, error: "This request is not pending." };
    }
    let conv = db.conversations.find(
      (c) => c.guestId === req.guestId && c.proId === req.proId
    );
    if (conv) {
      const { error: convUpErr } = await client.from("conversations").update({
        communication_request_id: requestId,
        status: "active"
      }).eq("id", conv.id);
      if (convUpErr) return { ok: false, error: convUpErr.message };
    } else {
      const { data, error: convErr } = await client.from("conversations").insert({
        communication_request_id: requestId,
        guest_id: req.guestId,
        pro_id: req.proId,
        status: "active"
      }).select().single();
      if (convErr) return { ok: false, error: convErr.message };
      conv = { id: data.id };
    }
    await notifyUser(req.guestId, "Admin approved your communication request. You can now chat.");
    await notifyUser(req.proId, "Admin approved a communication request. You can now chat with the guest.");
    emitChange();
    return { ok: true, conversationId: conv.id };
  }

  async function adminRejectCommunication(requestId) {
    const session = cachedSession;
    if (!session || session.role !== "admin") {
      return { ok: false, error: "Only admin can reject communication requests." };
    }
    const db = await load();
    const req = db.communicationRequests.find((r) => r.id === requestId);
    if (!req) return { ok: false, error: "Request not found." };
    if (req.status !== "pending") return { ok: false, error: "This request is not pending." };
    const now = new Date().toISOString();
    const client = await sb();
    const { error } = await client.from("communication_requests").update({
      status: "rejected",
      rejected_at: now,
      responded_at: now
    }).eq("id", requestId).eq("status", "pending");
    if (error) return { ok: false, error: error.message };
    await notifyUser(req.guestId, "Admin declined your communication request. You can request again after 24 hours.");
    await notifyUser(req.proId, "Admin declined a communication request from " + (req.guestName || "a guest") + ".");
    emitChange();
    return { ok: true };
  }

  async function adminSetConversationStatus(conversationId, status) {
    const session = cachedSession;
    if (!session || session.role !== "admin") {
      return { ok: false, error: "Only admin can manage conversations." };
    }
    if (!["active", "suspended", "closed"].includes(status)) {
      return { ok: false, error: "Invalid conversation status." };
    }
    const db = await load();
    const conv = db.conversations.find((c) => c.id === conversationId);
    if (!conv) return { ok: false, error: "Conversation not found." };
    if (status === "active" && conv.status !== "suspended") {
      return { ok: false, error: "Only suspended conversations can be resumed." };
    }
    if (status === "suspended" && conv.status !== "active") {
      return { ok: false, error: "Only active conversations can be suspended." };
    }
    if (status === "closed" && !["active", "suspended"].includes(conv.status)) {
      return { ok: false, error: "This conversation is already ended." };
    }
    const client = await sb();
    const { error } = await client.from("conversations").update({ status }).eq("id", conversationId);
    if (error) return { ok: false, error: error.message };
    const guestName = conv.guestName || "Guest";
    const proName = conv.proName || "Professional";
    if (status === "suspended") {
      await notifyUser(conv.guestId, "An administrator suspended your private chat with " + proName + ".");
      await notifyUser(conv.proId, "An administrator suspended your private chat with " + guestName + ".");
    } else if (status === "active") {
      await notifyUser(conv.guestId, "Your private chat with " + proName + " is active again.");
      await notifyUser(conv.proId, "Your private chat with " + guestName + " is active again.");
    } else if (status === "closed") {
      const reqId = conv.communicationRequestId;
      if (reqId) {
        await client.from("communication_requests").update({
          status: "ended",
          responded_at: new Date().toISOString()
        }).eq("id", reqId);
      }
      await notifyUser(
        conv.guestId,
        "An administrator ended communication with " + proName + ". Submit a new communication request to chat again."
      );
      await notifyUser(
        conv.proId,
        "An administrator ended communication with " + guestName + ". The guest must submit a new request."
      );
    }
    emitChange();
    return { ok: true };
  }

  async function adminEndCommunication(conversationId) {
    return adminSetConversationStatus(conversationId, "closed");
  }

  async function adminDeleteEndedCommunication(requestId) {
    const session = cachedSession;
    if (!session || session.role !== "admin") {
      return { ok: false, error: "Only admin can delete communication records." };
    }
    const db = await load();
    const req = db.communicationRequests.find((r) => r.id === requestId);
    if (!req) return { ok: false, error: "Communication request not found." };
    const conv = db.conversations.find(
      (c) => c.communicationRequestId === requestId
        || (c.guestId === req.guestId && c.proId === req.proId)
    );
    const display = deriveCommunicationAdminStatus(req, conv || null);
    if (display.key !== "ended") {
      return { ok: false, error: "Only ended communication records can be deleted." };
    }
    const client = await sb();
    if (conv?.id) {
      const { error: convErr } = await client.from("conversations").delete().eq("id", conv.id);
      if (convErr) return { ok: false, error: convErr.message };
    }
    const { error } = await client.from("communication_requests").delete().eq("id", requestId);
    if (error) return { ok: false, error: error.message };
    emitChange();
    return { ok: true };
  }

  async function resolvePrimaryAdminId(client) {
    const sbClient = client || (await sb());
    const { data } = await sbClient
      .from("profiles")
      .select("id")
      .eq("role", "admin")
      .order("created_at", { ascending: true })
      .limit(1)
      .maybeSingle();
    return data?.id || null;
  }

  function getAdminSupportRequestForUser(userId) {
    return (cachedDb?.adminSupportRequests || [])
      .filter((r) => r.requesterId === userId)
      .sort((a, b) => b.createdAt - a.createdAt)[0] || null;
  }

  function findAdminSupportConversation(participantId) {
    const list = (cachedDb?.adminSupportConversations || []).filter((c) => c.participantId === participantId);
    if (!list.length) return null;
    return list.slice().sort((a, b) => b.createdAt - a.createdAt)[0];
  }

  function getActiveAdminSupportConversation(participantId) {
    const c = findAdminSupportConversation(participantId);
    return c && c.status === "active" ? c : null;
  }

  function canAdminSupportChat(participantId) {
    return Boolean(getActiveAdminSupportConversation(participantId));
  }

  function adminSupportChatBlockedReason(participantId) {
    const c = findAdminSupportConversation(participantId);
    const req = getAdminSupportRequestForUser(participantId);
    if (c?.status === "closed" || req?.status === "ended") {
      return "Support chat was ended by an administrator. Submit a new request to contact admin again.";
    }
    if (c?.status === "suspended") {
      return "Support chat is suspended by an administrator.";
    }
    if (req?.status === "pending") {
      return "Your request to contact admin is pending approval.";
    }
    if (req?.status === "rejected") {
      return "Your request was declined. You can request again after the cooldown period.";
    }
    return "";
  }

  async function requestAdminSupport() {
    const session = cachedSession;
    if (!session || (session.role !== "guest" && session.role !== "professional")) {
      return { ok: false, error: "Only guests and professionals can request to contact admin." };
    }
    const db = await load();
    const userId = session.id;
    const role = session.role;
    const active = getActiveAdminSupportConversation(userId);
    if (active) {
      return { ok: false, error: "You already have an active support conversation with admin." };
    }
    const pending = (db.adminSupportRequests || []).find(
      (r) => r.requesterId === userId && r.status === "pending"
    );
    if (pending) {
      return { ok: false, error: "A request to contact admin is already pending." };
    }
    const lastRejected = (db.adminSupportRequests || [])
      .filter((r) => r.requesterId === userId && r.status === "rejected" && r.rejectedAt)
      .sort((a, b) => b.rejectedAt - a.rejectedAt)[0];
    if (lastRejected && !canReRequest(lastRejected.rejectedAt)) {
      return {
        ok: false,
        error: "Please wait until " + new Date(cooldownUntil(lastRejected.rejectedAt)).toLocaleString() + " before requesting again."
      };
    }
    const client = await sb();
    const { error } = await client.from("admin_support_requests").insert({
      requester_id: userId,
      requester_role: role,
      status: "pending"
    });
    if (error) return { ok: false, error: error.message };
    const who = session.name || (role === "guest" ? "A guest" : "A professional");
    await notifyAdmins("Support request: " + who + " wants to communicate with admin.");
    emitChange();
    return { ok: true };
  }

  async function cancelAdminSupportRequest(requestId) {
    const session = cachedSession;
    if (!session) return { ok: false, error: "Sign in required." };
    const db = await load();
    const req = (db.adminSupportRequests || []).find((r) => r.id === requestId);
    if (!req || req.requesterId !== session.id) {
      return { ok: false, error: "Request not found." };
    }
    if (req.status !== "pending") {
      return { ok: false, error: "Only pending requests can be cancelled." };
    }
    const client = await sb();
    const { error } = await client.from("admin_support_requests").update({ status: "cancelled" }).eq("id", requestId);
    if (error) return { ok: false, error: error.message };
    emitChange();
    return { ok: true };
  }

  async function ensureAdminSupportConversation(participantId, participantRole, opts = {}) {
    const db = await load();
    const existing = findAdminSupportConversation(participantId);
    if (existing?.status === "active") {
      return { ok: true, conversationId: existing.id, conversation: existing };
    }
    if (existing?.status === "suspended" && !opts.forceNew) {
      return { ok: false, error: "Support conversation is suspended. Resume it before chatting." };
    }
    const client = await sb();
    let requestId = opts.requestId || null;
    if (requestId) {
      await client.from("admin_support_requests").update({
        status: "accepted",
        responded_at: new Date().toISOString()
      }).eq("id", requestId);
    }
    const { data, error } = await client.from("admin_support_conversations").insert({
      request_id: requestId,
      participant_id: participantId,
      participant_role: participantRole,
      status: "active",
      initiated_by: opts.initiatedBy || (requestId ? "request" : "admin")
    }).select().single();
    if (error) return { ok: false, error: error.message };
    const who = db.adminSupportRequests?.find((r) => r.requesterId === participantId)?.requesterName
      || db.guests.find((g) => g.id === participantId)?.name
      || db.professionals.find((p) => p.id === participantId)?.name
      || "A member";
    await notifyUser(participantId, "An administrator opened a support conversation with you. You can reply in Messages.");
    if (opts.initiatedBy === "admin" && !requestId) {
      await notifyAdmins("You started a support chat with " + who + ".");
    }
    flushCache();
    emitChange();
    return { ok: true, conversationId: data.id };
  }

  async function adminApproveAdminSupport(requestId) {
    const session = cachedSession;
    if (!session || session.role !== "admin") {
      return { ok: false, error: "Only admin can approve support requests." };
    }
    const db = await load();
    const req = (db.adminSupportRequests || []).find((r) => r.id === requestId);
    if (!req) return { ok: false, error: "Request not found." };
    if (req.status !== "pending") {
      return { ok: false, error: "Only pending requests can be approved." };
    }
    const active = getActiveAdminSupportConversation(req.requesterId);
    if (active) {
      const client = await sb();
      await client.from("admin_support_requests").update({
        status: "accepted",
        responded_at: new Date().toISOString()
      }).eq("id", requestId);
      emitChange();
      return { ok: true, conversationId: active.id };
    }
    const res = await ensureAdminSupportConversation(req.requesterId, req.requesterRole, {
      requestId,
      initiatedBy: "request"
    });
    if (!res.ok) return res;
    await notifyUser(req.requesterId, "Admin approved your request. You can now message the team.");
    return res;
  }

  async function adminRejectAdminSupport(requestId) {
    const session = cachedSession;
    if (!session || session.role !== "admin") {
      return { ok: false, error: "Only admin can reject support requests." };
    }
    const db = await load();
    const req = (db.adminSupportRequests || []).find((r) => r.id === requestId);
    if (!req || req.status !== "pending") {
      return { ok: false, error: "Pending request not found." };
    }
    const client = await sb();
    const { error } = await client.from("admin_support_requests").update({
      status: "rejected",
      rejected_at: new Date().toISOString(),
      responded_at: new Date().toISOString()
    }).eq("id", requestId);
    if (error) return { ok: false, error: error.message };
    await notifyUser(req.requesterId, "Admin declined your support request. You can try again after 24 hours.");
    emitChange();
    return { ok: true };
  }

  async function adminStartSupportConversation(participantId, participantRole) {
    const session = cachedSession;
    if (!session || session.role !== "admin") {
      return { ok: false, error: "Only admin can start support conversations." };
    }
    if (participantRole !== "guest" && participantRole !== "professional") {
      return { ok: false, error: "Invalid member role." };
    }
    const db = await load();
    const active = getActiveAdminSupportConversation(participantId);
    if (active) return { ok: true, conversationId: active.id };
    const suspended = findAdminSupportConversation(participantId);
    if (suspended?.status === "suspended") {
      const resumed = await adminSetSupportConversationStatus(suspended.id, "active");
      if (!resumed.ok) return resumed;
      return { ok: true, conversationId: suspended.id };
    }
    const pending = (db.adminSupportRequests || []).find(
      (r) => r.requesterId === participantId && r.status === "pending"
    );
    return ensureAdminSupportConversation(participantId, participantRole, {
      requestId: pending?.id || null,
      initiatedBy: "admin"
    });
  }

  async function adminSetSupportConversationStatus(conversationId, status) {
    const session = cachedSession;
    if (!session || session.role !== "admin") {
      return { ok: false, error: "Only admin can manage support conversations." };
    }
    if (!["active", "suspended", "closed"].includes(status)) {
      return { ok: false, error: "Invalid status." };
    }
    const db = await load();
    const conv = (db.adminSupportConversations || []).find((c) => c.id === conversationId);
    if (!conv) return { ok: false, error: "Conversation not found." };
    const client = await sb();
    const { error } = await client.from("admin_support_conversations").update({ status }).eq("id", conversationId);
    if (error) return { ok: false, error: error.message };
    if (status === "closed" && conv.requestId) {
      await client.from("admin_support_requests").update({
        status: "ended",
        responded_at: new Date().toISOString()
      }).eq("id", conv.requestId);
    }
    if (status === "closed") {
      await notifyUser(conv.participantId, "An administrator ended the support conversation.");
    } else if (status === "suspended") {
      await notifyUser(conv.participantId, "An administrator suspended the support conversation.");
    } else if (status === "active") {
      await notifyUser(conv.participantId, "Your support conversation with admin is active again.");
    }
    emitChange();
    return { ok: true };
  }

  async function getAdminSupportMessages(conversationId) {
    if (!conversationId) return [];
    const client = await sb();
    const { data, error } = await client
      .from("messages")
      .select("*")
      .eq("admin_support_conversation_id", conversationId)
      .order("created_at", { ascending: true });
    if (error) return [];
    return (data || []).map((m) => ({
      id: m.id,
      adminSupportConversationId: m.admin_support_conversation_id,
      fromId: m.from_id,
      fromRole: m.from_role,
      toId: m.to_id,
      toRole: m.to_role,
      body: m.body,
      imageUrl: m.image_url || "",
      createdAt: ts(m.created_at)
    }));
  }

  async function sendAdminSupportMessage(conversationId, body, options = {}) {
    const session = cachedSession;
    if (!session) return { ok: false, error: "Sign in required." };
    await load();
    const conv = (cachedDb?.adminSupportConversations || []).find((c) => c.id === conversationId);
    if (!conv) return { ok: false, error: "Support conversation not found." };
    if (conv.status !== "active") {
      return { ok: false, error: adminSupportChatBlockedReason(conv.participantId) || "Support chat is not active." };
    }
    const text = (body || "").trim();
    let imageUrl = "";
    if (options.image) {
      imageUrl = await uploadDataUrl(session.id, options.image, `support-${Date.now()}`);
    }
    if (!text && !imageUrl) return { ok: false, error: "Enter a message or attach an image." };

    const client = await sb();
    let toId;
    let toRole;
    if (session.role === "admin") {
      toId = conv.participantId;
      toRole = conv.participantRole;
    } else if (session.id === conv.participantId) {
      toId = await resolvePrimaryAdminId(client);
      if (!toId) return { ok: false, error: "No administrator is available right now." };
      toRole = "admin";
    } else {
      return { ok: false, error: "You are not part of this support conversation." };
    }

    const { data, error } = await client.from("messages").insert({
      admin_support_conversation_id: conversationId,
      from_id: session.id,
      from_role: session.role,
      to_id: toId,
      to_role: toRole,
      body: text || "(image)",
      image_url: imageUrl || null
    }).select().single();
    if (error) return { ok: false, error: error.message };
    const preview = text ? text.slice(0, 80) : "Sent an image";
    if (session.role === "admin") {
      await notifyUser(conv.participantId, "Message from admin: " + preview);
    } else {
      await notifyAdmins("Support message from " + (session.name || "member") + ": " + preview);
    }
    emitChange();
    return {
      ok: true,
      message: {
        id: data.id,
        adminSupportConversationId: conversationId,
        fromId: session.id,
        fromRole: session.role,
        toId,
        toRole,
        body: text,
        imageUrl: data.image_url || imageUrl || "",
        createdAt: ts(data.created_at)
      }
    };
  }

  async function sendMessage(fromId, fromRole, toId, toRole, body) {
    return sendPrivateMessage(fromId, fromRole, toId, toRole, body);
  }

  function getConnectionMessages(connectionId) {
    return (cachedDb?.messages || []).filter((m) => m.connectionId === connectionId);
  }

  async function requestWhatsApp(guestId, proId) {
    const db = await load();
    if (!canPrivateChat(guestId, proId)) {
      return { ok: false, error: "WhatsApp exchange is available only after admin approves communication." };
    }
    const existing = db.whatsappRequests.find((w) => w.guestId === guestId && w.proId === proId && w.status === "pending");
    if (existing) return { ok: false, error: "Request already pending." };
    const client = await sb();
    const { data, error } = await client.from("whatsapp_requests").insert({
      guest_id: guestId,
      pro_id: proId,
      status: "pending"
    }).select().single();
    if (error) return { ok: false, error: error.message };
    emitChange();
    return { ok: true, request: data };
  }

  async function adminApproveWhatsApp(id) {
    const client = await sb();
    const { data: req } = await client.from("whatsapp_requests").select("*").eq("id", id).single();
    if (!req) return;
    await client.from("whatsapp_requests").update({ status: "approved", resolved_at: new Date().toISOString() }).eq("id", id);
    await notifyUser(req.guest_id, "Admin approved WhatsApp exchange.");
    await notifyUser(req.pro_id, "Admin approved WhatsApp exchange.");
    emitChange();
  }

  async function adminRejectWhatsApp(id) {
    const client = await sb();
    const { data: req } = await client.from("whatsapp_requests").select("*").eq("id", id).single();
    if (!req) return;
    await client.from("whatsapp_requests").update({ status: "rejected", resolved_at: new Date().toISOString() }).eq("id", id);
    await notifyUser(req.guest_id, "Admin declined WhatsApp number exchange.");
    emitChange();
  }

  function whatsAppAllowed(guestId, proId) {
    return (cachedDb?.whatsappRequests || []).some((w) => w.guestId === guestId && w.proId === proId && w.status === "approved");
  }

  async function getPro(id) {
    const client = await sb();
    const { data: p } = await client.from("profiles").select("*").eq("id", id).maybeSingle();
    const { data: pro } = await client.from("professional_profiles").select("*").eq("profile_id", id).maybeSingle();
    return mapPro(p, pro);
  }

  async function getGuest(id) {
    const client = await sb();
    const { data: p } = await client.from("profiles").select("*").eq("id", id).maybeSingle();
    const { data: g } = await client.from("guest_profiles").select("*").eq("profile_id", id).maybeSingle();
    return mapGuest(p, g);
  }

  function getSeeker(id) {
    return getGuest(id);
  }

  async function activeProfessionals() {
    const client = await sb();
    const { data: { session: authSession } } = await client.auth.getSession();
    if (authSession) {
      const db = await load();
      return db.professionals.filter((p) => p.status === "approved");
    }
    const { data: proRows } = await client
      .from("professional_profiles")
      .select("*, profiles(*)")
      .eq("status", "approved");
    return (proRows || []).map((row) => mapPro(row.profiles, row)).filter(Boolean);
  }

  async function matchForGuest(guest, { includeSamples = false } = {}) {
    const live = await activeProfessionals();
    const needle = (guest.specialization + " " + guest.skills).toLowerCase();
    const pool = includeSamples && !live.length ? live.concat(SAMPLES) : live;
    const scored = pool.filter((p) => {
      if (p.sample) return false;
      const hay = (p.skill + " " + p.bio + " " + p.location + " " + (p.achievements || "")).toLowerCase();
      return needle.split(/[\s,]+/).some((w) => w.length > 2 && hay.includes(w)) || hay.includes((guest.specialization || "").toLowerCase());
    });
    const fallback = pool.filter((p) => !p.sample && p.skill.toLowerCase() === (guest.specialization || "").toLowerCase());
    return (scored.length ? scored : fallback).slice(0, 6);
  }

  function canRequestCommunication(fromRole, toRole) {
    if (fromRole === "professional") return false;
    if (fromRole === "guest" && toRole === "guest") return false;
    return fromRole === "guest" && toRole === "professional";
  }

  function matchForSeeker(seeker) {
    return matchForGuest(seeker);
  }

  async function publicProProfiles(excludeId) {
    const pros = await activeProfessionals();
    return pros.filter((p) => !p.sample && (!excludeId || p.id !== excludeId));
  }

  function filterProfessionals(pros, { search, skill } = {}) {
    const q = (search || "").toLowerCase().trim();
    return pros.filter((p) => {
      if (skill) {
        const haySkills = ((p.skills || "") + "," + (p.skill || "")).toLowerCase();
        if (!haySkills.includes(skill.toLowerCase())) return false;
      }
      if (!q) return true;
      const hay = (p.name + " " + p.skill + " " + p.location + " " + p.bio + " " + (p.achievements || "")).toLowerCase();
      return hay.includes(q);
    });
  }

  async function unread(ownerId) {
    const db = await load();
    return db.notifications.filter((n) => n.ownerId === ownerId && !n.read);
  }

  async function markRead(ownerId) {
    const client = await sb();
    await client.from("notifications").update({ read: true }).eq("owner_id", ownerId);
    emitChange();
  }

  async function getAdminMonitorableConversations() {
    const client = await sb();
    const { data: convs } = await client
      .from("conversations")
      .select("*")
      .in("status", ["active", "suspended"]);
    const db = await load();
    return (convs || []).map((c) => {
      const guest = db.guests.find((g) => g.id === c.guest_id);
      const pro = db.professionals.find((p) => p.id === c.pro_id);
      const msgs = db.messages
        .filter((m) => m.conversationId === c.id)
        .sort((a, b) => b.createdAt - a.createdAt);
      const last = msgs[0];
      const wa = db.whatsappRequests.find((w) => w.guestId === c.guest_id && w.proId === c.pro_id);
      return {
        id: c.id,
        guestId: c.guest_id,
        proId: c.pro_id,
        guestName: guest?.name || c.guest_id,
        proName: pro?.name || c.pro_id,
        guestPhoto: guest?.photo || "",
        proPhoto: pro?.photo || "",
        guestSpecialization: guest?.specialization || "",
        proSkill: pro?.skill || "",
        lastMessage: last?.body || "",
        lastMessageAt: last?.createdAt || ts(c.created_at),
        lastFromRole: last?.fromRole || null,
        whatsappStatus: wa?.status || "none",
        status: c.status,
        createdAt: ts(c.created_at)
      };
    }).sort((a, b) => b.lastMessageAt - a.lastMessageAt);
  }

  async function getConversationMessages(conversationId) {
    if (!conversationId) return [];
    const client = await sb();
    const { data, error } = await client
      .from("messages")
      .select("*")
      .eq("conversation_id", conversationId)
      .order("created_at", { ascending: true });
    if (error) return [];
    return (data || []).map((m) => ({
      id: m.id,
      conversationId: m.conversation_id,
      adminSupportConversationId: m.admin_support_conversation_id,
      fromId: m.from_id,
      fromRole: m.from_role,
      toId: m.to_id,
      toRole: m.to_role,
      body: m.body,
      imageUrl: m.image_url || "",
      createdAt: ts(m.created_at)
    }));
  }

  async function recordMonitoringConsent(conversationId, userId) {
    const client = await sb();
    const { data: conv } = await client.from("conversations").select("*").eq("id", conversationId).maybeSingle();
    if (!conv) return { ok: false, error: "Conversation not found." };
    const patch = {};
    if (conv.guest_id === userId) patch.monitoring_consent_guest = true;
    else if (conv.pro_id === userId) patch.monitoring_consent_pro = true;
    else return { ok: false, error: "Not a participant in this conversation." };
    const { error } = await client.from("conversations").update(patch).eq("id", conversationId);
    if (error) return { ok: false, error: error.message };
    emitChange();
    return { ok: true };
  }

  async function sendPrivateMessage(fromId, fromRole, toId, toRole, body, options = {}) {
    await load();
    let conversationId = null;
    const text = (body || "").trim();
    let imageUrl = "";
    if (options.image) {
      imageUrl = await uploadDataUrl(fromId, options.image, `chat-${Date.now()}`);
    }
    if (!text && !imageUrl) return { ok: false, error: "Enter a message or attach an image." };
    if (!conversationId) {
      const pair = guestProPair(fromId, fromRole, toId, toRole);
      if (!pair) return { ok: false, error: "Messages are only allowed between a guest and a professional." };
      conversationId = getActiveConversation(pair.guestId, pair.proId)?.id || null;
    }
    if (!conversationId) {
      const blocked = conversationChatBlockedReason(
        fromRole === "guest" ? fromId : toId,
        fromRole === "guest" ? toId : fromId
      );
      return { ok: false, error: blocked || "Chat opens after admin approves the communication request." };
    }
    const client = await sb();
    const { data, error } = await client.from("messages").insert({
      conversation_id: conversationId,
      from_id: fromId,
      from_role: fromRole,
      to_id: toId,
      to_role: toRole,
      body: text,
      image_url: imageUrl || null
    }).select().single();
    if (error) return { ok: false, error: error.message };
    const preview = text ? text.slice(0, 80) : "Sent an image";
    await notifyUser(toId, "New message: " + preview);
    emitChange();
    return {
      ok: true,
      message: {
        id: data.id,
        conversationId,
        fromId,
        fromRole,
        toId,
        toRole,
        body: text,
        imageUrl: data.image_url || imageUrl || "",
        createdAt: ts(data.created_at)
      }
    };
  }

  async function purgeAccountByEmail(email) {
    const client = await sb();
    const { data: profile } = await client.from("profiles").select("id").eq("email", email.trim().toLowerCase()).maybeSingle();
    if (!profile) return { removed: false };
    await client.from("profiles").delete().eq("id", profile.id);
    emitChange();
    return { removed: true };
  }

  global.WeLink = {
    STORE_VERSION,
    ready,
    ADMIN_EMAIL,
    ADMIN_ID,
    ADMIN_WHATSAPP,
    SKILLS,
    SAMPLES,
    load,
    flushCache,
    onChange,
    session,
    logout,
    login,
    getProfileCompletionState,
    completeGuestProfile,
    registerGuest,
    registerSeeker: registerGuest,
    registerPro,
    registerAdmin,
    resubmitPro,
    emailAdmin,
    notifyAdminWhatsApp,
    adminAccept,
    adminReject,
    adminDeleteMember,
    adminSetAccountStatus,
    adminSetProStatus,
    adminSuspendMember,
    adminDeactivateMember,
    adminReactivateMember,
    getAdminStats,
    getAdminProfile,
    updateProfilePhoto,
    updateGuestProfile,
    updateProfessionalProfile,
    getOrCreateConnection,
    sendMessage,
    sendPrivateMessage,
    scheduleEvent,
    updateScheduledEvent,
    setEventStatus,
    listEvents,
    requestGuestCommunication,
    cancelCommunication,
    adminApproveCommunication,
    adminRejectCommunication,
    adminSetConversationStatus,
    adminEndCommunication,
    adminDeleteEndedCommunication,
    requestAdminSupport,
    cancelAdminSupportRequest,
    adminApproveAdminSupport,
    adminRejectAdminSupport,
    adminStartSupportConversation,
    adminSetSupportConversationStatus,
    getAdminSupportRequestForUser,
    getActiveAdminSupportConversation,
    canAdminSupportChat,
    adminSupportChatBlockedReason,
    getAdminSupportMessages,
    sendAdminSupportMessage,
    isCommunicationEnded,
    buildCommunicationPermissionRows,
    deriveCommunicationAdminStatus,
    getCommRequest,
    getActiveConversation,
    canPrivateChat,
    conversationChatBlockedReason,
    canReRequest,
    cooldownUntil,
    getPrivateMessages,
    getConnectionMessages,
    getConversationMessages,
    getAdminMonitorableConversations,
    recordMonitoringConsent,
    requestWhatsApp,
    adminApproveWhatsApp,
    adminRejectWhatsApp,
    whatsAppAllowed,
    getPro,
    getGuest,
    getSeeker,
    activeProfessionals,
    publicProProfiles,
    filterProfessionals,
    canRequestCommunication,
    matchForGuest,
    matchForSeeker,
    unread,
    markRead,
    purgeAccountByEmail
  };
})(window);
