// worker.js - Cloudflare Worker pour Froggy's Land

const SECRET_KEY = "Froggy@@@";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "GET, POST, OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type, Authorization",
};

export default {
  async fetch(request, env) {
    const url = new URL(request.url);
    
    // Handle CORS preflight
    if (request.method === "OPTIONS") {
      return new Response(null, { headers: corsHeaders });
    }
    
    // Route: Mettre à jour les emojis (appelé par le bot Discord)
    if (url.pathname === "/update-emojis" && request.method === "POST") {
      const authHeader = request.headers.get("Authorization");
      if (authHeader !== `Bearer ${SECRET_KEY}`) {
        return new Response(JSON.stringify({ error: "Unauthorized" }), {
          status: 401,
          headers: { ...corsHeaders, "Content-Type": "application/json" }
        });
      }
      
      try {
        const data = await request.json();
        
        // Sauvegarder dans KV Storage
        await env.EMOJIS_KV.put("emojis", JSON.stringify(data));
        
        return new Response(JSON.stringify({ 
          success: true,
          count: data.emojis?.length || 0 
        }), {
          headers: { ...corsHeaders, "Content-Type": "application/json" }
        });
      } catch (error) {
        return new Response(JSON.stringify({ error: error.message }), {
          status: 500,
          headers: { ...corsHeaders, "Content-Type": "application/json" }
        });
      }
    }
    
    // Route: Récupérer les emojis (appelé par le site web)
    if (url.pathname === "/emojis" && request.method === "GET") {
      try {
        const emojis = await env.EMOJIS_KV.get("emojis");
        
        if (!emojis) {
          return new Response(JSON.stringify({ emojis: [] }), {
            headers: { ...corsHeaders, "Content-Type": "application/json" }
          });
        }
        
        return new Response(emojis, {
          headers: { 
            ...corsHeaders, 
            "Content-Type": "application/json",
            "Cache-Control": "public, max-age=60"
          }
        });
      } catch (error) {
        return new Response(JSON.stringify({ error: error.message }), {
          status: 500,
          headers: { ...corsHeaders, "Content-Type": "application/json" }
        });
      }
    }
    
    // Route: Mettre à jour le status du bot (appelé par le bot Discord)
    if (url.pathname === "/update-status" && request.method === "POST") {
      const authHeader = request.headers.get("Authorization");
      if (authHeader !== `Bearer ${SECRET_KEY}`) {
        return new Response(JSON.stringify({ error: "Unauthorized" }), {
          status: 401,
          headers: { ...corsHeaders, "Content-Type": "application/json" }
        });
      }
      
      try {
        const data = await request.json();
        
        // Ajouter timestamp
        data.lastUpdate = new Date().toISOString();
        
        // Sauvegarder dans KV Storage
        await env.EMOJIS_KV.put("bot-status", JSON.stringify(data));
        
        return new Response(JSON.stringify({ success: true }), {
          headers: { ...corsHeaders, "Content-Type": "application/json" }
        });
      } catch (error) {
        return new Response(JSON.stringify({ error: error.message }), {
          status: 500,
          headers: { ...corsHeaders, "Content-Type": "application/json" }
        });
      }
    }
    
    // Route: Récupérer le status du bot (appelé par le site web)
    if (url.pathname === "/status" && request.method === "GET") {
      try {
        const status = await env.EMOJIS_KV.get("bot-status");
        
        if (!status) {
          return new Response(JSON.stringify({ 
            online: false,
            message: "Bot status unavailable" 
          }), {
            headers: { ...corsHeaders, "Content-Type": "application/json" }
          });
        }
        
        return new Response(status, {
          headers: { 
            ...corsHeaders, 
            "Content-Type": "application/json",
            "Cache-Control": "public, max-age=30"
          }
        });
      } catch (error) {
        return new Response(JSON.stringify({ error: error.message }), {
          status: 500,
          headers: { ...corsHeaders, "Content-Type": "application/json" }
        });
      }
    }
    
    // Route par défaut
    return new Response("Froggy's Land API 🐸\n\nRoutes disponibles:\n- GET /emojis\n- POST /update-emojis\n- GET /status\n- POST /update-status", {
      headers: { ...corsHeaders, "Content-Type": "text/plain; charset=utf-8" }
    });
  }
};
