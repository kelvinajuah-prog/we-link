(function (global) {
  let client = null;

  const ready = (async () => {
    const cfg = global.WeLinkConfig;
    if (!cfg?.SUPABASE_URL || !cfg?.SUPABASE_KEY) {
      throw new Error("Missing Supabase config in js/config.js");
    }
    const { createClient } = await import(
      "https://cdn.jsdelivr.net/npm/@supabase/supabase-js@2/+esm"
    );
    client = createClient(cfg.SUPABASE_URL, cfg.SUPABASE_KEY);
    return client;
  })();

  global.WeLinkSupabase = {
    ready,
    get client() {
      return client;
    },
    async sb() {
      await ready;
      return client;
    }
  };
})(window);
