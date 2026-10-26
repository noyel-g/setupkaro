interface Env {
  ASSETS: Fetcher;
  DB?: D1Database;
  STRAVA_CLIENT_ID?: string;
  STRAVA_CLIENT_SECRET?: string;
  STRAVA_REDIRECT_URI?: string;
  SESSION_SECRET?: string;
}

const json = (data: unknown, status = 200) =>
  new Response(JSON.stringify(data), {
    status,
    headers: { "content-type": "application/json; charset=utf-8", "cache-control": "no-store" }
  });

export default {
  async fetch(request: Request, env: Env): Promise<Response> {
    const url = new URL(request.url);

    if (url.pathname === "/api/health") {
      return json({
        ok: true,
        app: "RunStats Studio",
        stage: "foundation",
        stravaConfigured: Boolean(env.STRAVA_CLIENT_ID && env.STRAVA_CLIENT_SECRET && env.STRAVA_REDIRECT_URI),
        databaseConfigured: Boolean(env.DB)
      });
    }

    if (url.pathname.startsWith("/api/")) {
      return json({ error: "This API endpoint is not implemented yet." }, 501);
    }

    return env.ASSETS.fetch(request);
  }
} satisfies ExportedHandler<Env>;