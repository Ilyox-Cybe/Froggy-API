export default {
  async fetch(request, env) {
    const SECRET_KEY = env.FROGGY_SECRET;
    const url = new URL(request.url);

    const cors = {
      "Access-Control-Allow-Origin": "*",
      "Access-Control-Allow-Methods": "GET, POST, OPTIONS",
      "Access-Control-Allow-Headers": "Content-Type, Authorization"
    };

    if (request.method === "OPTIONS") {
      return new Response(null, { headers: cors });
    }

    const checkAuth = () =>
      request.headers.get("Authorization") === `Bearer ${SECRET_KEY}`;

    if (url.pathname === "/update-emojis" && request.method === "POST") {
      if (!checkAuth()) {
        return new Response(JSON.stringify({ error: "Unauthorized" }), { status: 401, headers: cors });
      }

      const data = await request.json();
      await env.EMOJIS_KV.put("emojis", JSON.stringify(data));

      return new Response(JSON.stringify({ success: true, count: data.emojis?.length || 0 }), {
        headers: { ...cors, "Content-Type": "application/json" }
      });
    }

    if (url.pathname === "/emojis" && request.method === "GET") {
      const emojis = await env.EMOJIS_KV.get("emojis");
      return new Response(emojis || JSON.stringify({ emojis: [] }), {
        headers: { ...cors, "Content-Type": "application/json", "Cache-Control": "public, max-age=60" }
      });
    }

    if (url.pathname === "/update-status" && request.method === "POST") {
      if (!checkAuth()) {
        return new Response(JSON.stringify({ error: "Unauthorized" }), { status: 401, headers: cors });
      }

      const data = await request.json();
      data.lastUpdate = new Date().toISOString();

      await env.EMOJIS_KV.put("bot-status", JSON.stringify(data));

      return new Response(JSON.stringify({ success: true }), {
        headers: { ...cors, "Content-Type": "application/json" }
      });
    }

    if (url.pathname === "/status" && request.method === "GET") {
      const status = await env.EMOJIS_KV.get("bot-status");
      return new Response(
        status || JSON.stringify({ online: false }),
        { headers: { ...cors, "Content-Type": "application/json", "Cache-Control": "public, max-age=30" } }
      );
    }

    return new Response("Froggy's Land API 🐸", { headers: cors });
  }
};

