// worker.js - FroggyLand API (Cloudflare Worker)

export default {
  async fetch(request, env) {
    const SECRET_KEY = env.FROGGY_SECRET || "Froggy@@@";
    const url = new URL(request.url);

    const corsHeaders = {
      "Access-Control-Allow-Origin": "*",
      "Access-Control-Allow-Methods": "GET, POST, OPTIONS",
      "Access-Control-Allow-Headers": "Content-Type, Authorization"
    };

    // ===== CORS PREFLIGHT =====
    if (request.method === "OPTIONS") {
      return new Response(null, { headers: corsHeaders });
    }

    // ===== AUTH CHECK =====
    const isAuthorized = () => {
      const auth = request.headers.get("Authorization");
      return auth === `Bearer ${SECRET_KEY}`;
    };

    // ===== UPDATE EMOJIS =====
    if (url.pathname === "/update-emojis" && request.method === "POST") {
      if (!isAuthorized()) {
        return new Response(JSON.stringify({ error: "Unauthorized" }), {
          status: 401,
          headers: { ...corsHeaders, "Content-Type": "application/json" }
        });
      }

      try {
        const data = await request.json();

        if (!data?.emojis || !Array.isArray(data.emojis)) {
          return new Response(JSON.stringify({ error: "Invalid payload" }), {
            status: 400,
            headers: { ...corsHeaders, "Content-Type": "application/json" }
          });
        }

        await env.EMOJIS_KV.put("emojis", JSON.stringify(data));

        return new Response(JSON.stringify({
          success: true,
          count: data.emojis.length
        }), {
          headers: { ...corsHeaders, "Content-Type": "application/json" }
        });
      } catch (err) {
        return new Response(JSON.stringify({ error: err.message }), {
          status: 500,
          headers: { ...corsHeaders, "Content-Type": "application/json" }
        });
      }
    }

    // ===== GET EMOJIS =====
    if (url.pathname === "/emojis" && request.method === "GET") {
      try {
        const emojis = await env.EMOJIS_KV.get("emojis");

        return new Response(
          emojis || JSON.stringify({ emojis: [] }),
          {
            headers: {
              ...corsHeaders,
              "Content-Type": "application/json",
              "Cache-Control": "public, max-age=60"
            }
          }
        );
      } catch (err) {
        return new Response(JSON.stringify({ error: err.message }), {
          status: 500,
          headers: { ...corsHeaders, "Content-Type": "application/json" }
        });
      }
    }

    // ===== UPDATE STATUS =====
    if (url.pathname === "/update-status" && request.method === "POST") {
      if (!isAuthorized()) {
        return new Response(JSON.stringify({ error: "Unauthorized" }), {
          status: 401,
          headers: { ...corsHeaders, "Content-Type": "application/json" }
        });
      }

      try {
        const data = await request.json();

        data.lastUpdate = new Date().toISOString();

        await env.EMOJIS_KV.put("bot-status", JSON.stringify(data));

        return new Response(JSON.stringify({ success: true }), {
          headers: { ...corsHeaders, "Content-Type": "application/json" }
        });
      } catch (err) {
        return new Response(JSON.stringify({ error: err.message }), {
          status: 500,
          headers: { ...corsHeaders, "Content-Type": "application/json" }
        });
      }
    }

    // ===== GET STATUS =====
    if (url.pathname === "/status" && request.method === "GET") {
      try {
        const status = await env.EMOJIS_KV.get("bot-status");

        return new Response(
          status || JSON.stringify({ online: false }),
          {
            headers: {
              ...corsHeaders,
              "Content-Type": "application/json",
              "Cache-Control": "public, max-age=30"
            }
          }
        );
      } catch (err) {
        return new Response(JSON.stringify({ error: err.message }), {
          status: 500,
          headers: { ...corsHeaders, "Content-Type": "application/json" }
        });
      }
    }

    // ===== DEFAULT =====
    return new Response(
      "Froggy's Land API 🐸\n\nRoutes disponibles:\n- GET /status\n- POST /update-status\n- GET /emojis\n- POST /update-emojis",
      {
        headers: {
          ...corsHeaders,
          "Content-Type": "text/plain; charset=utf-8"
        }
      }
    );
  }
};
