interface Env {
  ASSETS: Fetcher;
  DB?: D1Database;
  STRAVA_CLIENT_ID?: string;
  STRAVA_CLIENT_SECRET?: string;
  STRAVA_REDIRECT_URI?: string;
}

type StravaToken = {
  token_type: string;
  access_token: string;
  refresh_token: string;
  expires_at: number;
  athlete?: { id: number; firstname?: string; lastname?: string; profile?: string };
};

const json = (data: unknown, status = 200, headers?: HeadersInit) =>
  new Response(JSON.stringify(data), {
    status,
    headers: { "content-type": "application/json; charset=utf-8", "cache-control": "no-store", ...headers }
  });

const cookie = (request: Request, name: string) => {
  const header = request.headers.get("Cookie") ?? "";
  const item = header.split(";").map((part) => part.trim()).find((part) => part.startsWith(name + "="));
  return item ? decodeURIComponent(item.slice(name.length + 1)) : null;
};

const cookieHeader = (name: string, value: string, maxAge: number) =>
  `${name}=${encodeURIComponent(value)}; Path=/; HttpOnly; Secure; SameSite=Lax; Max-Age=${maxAge}`;

const randomId = () => {
  const bytes = crypto.getRandomValues(new Uint8Array(32));
  return Array.from(bytes, (byte) => byte.toString(16).padStart(2, "0")).join("");
};

const missingSetup = (env: Env) => !env.STRAVA_CLIENT_ID || !env.STRAVA_CLIENT_SECRET || !env.STRAVA_REDIRECT_URI || !env.DB;

async function getSession(request: Request, env: Env) {
  if (!env.DB) return null;
  const id = cookie(request, "rs_session");
  if (!id || !/^[a-f0-9]{64}$/.test(id)) return null;
  return env.DB.prepare(
    "SELECT s.athlete_id, c.firstname, c.lastname, c.profile FROM app_sessions s JOIN strava_connections c ON c.athlete_id = s.athlete_id WHERE s.session_id = ? AND s.expires_at > ?"
  ).bind(id, Math.floor(Date.now() / 1000)).first<{ athlete_id: number; firstname: string | null; lastname: string | null; profile: string | null }>();
}

async function getValidAccessToken(env: Env, athleteId: number) {
  if (!env.DB || !env.STRAVA_CLIENT_ID || !env.STRAVA_CLIENT_SECRET) throw new Error("Strava or database is not configured.");
  let connection = await env.DB.prepare(
    "SELECT access_token, refresh_token, expires_at FROM strava_connections WHERE athlete_id = ?"
  ).bind(athleteId).first<{ access_token: string; refresh_token: string; expires_at: number }>();
  if (!connection) throw new Error("Strava connection was not found.");
  if (connection.expires_at <= Math.floor(Date.now() / 1000) + 60) {
    const response = await fetch("https://www.strava.com/oauth/token", {
      method: "POST",
      headers: { "content-type": "application/x-www-form-urlencoded" },
      body: new URLSearchParams({
        client_id: env.STRAVA_CLIENT_ID,
        client_secret: env.STRAVA_CLIENT_SECRET,
        grant_type: "refresh_token",
        refresh_token: connection.refresh_token
      })
    });
    if (!response.ok) throw new Error("Could not refresh the Strava connection. Please reconnect Strava.");
    const refreshed = await response.json() as StravaToken;
    await env.DB.prepare(
      "UPDATE strava_connections SET access_token = ?, refresh_token = ?, expires_at = ?, updated_at = CURRENT_TIMESTAMP WHERE athlete_id = ?"
    ).bind(refreshed.access_token, refreshed.refresh_token, refreshed.expires_at, athleteId).run();
    connection = { access_token: refreshed.access_token, refresh_token: refreshed.refresh_token, expires_at: refreshed.expires_at };
  }
  return connection.access_token;
}

export default {
  async fetch(request: Request, env: Env): Promise<Response> {
    const url = new URL(request.url);

    if (url.pathname === "/api/health") {
      return json({
        ok: true,
        app: "RunStats Studio",
        stage: "strava-oauth",
        stravaConfigured: Boolean(env.STRAVA_CLIENT_ID && env.STRAVA_CLIENT_SECRET && env.STRAVA_REDIRECT_URI),
        databaseConfigured: Boolean(env.DB),
              });
    }

    if (url.pathname === "/api/auth/strava/start") {
      if (missingSetup(env)) return json({ error: "Strava sign-in is not configured yet. Set the Worker secrets and D1 binding first." }, 503);
      const state = randomId();
      const authorize = new URL("https://www.strava.com/oauth/authorize");
      authorize.search = new URLSearchParams({
        client_id: env.STRAVA_CLIENT_ID!,
        response_type: "code",
        redirect_uri: env.STRAVA_REDIRECT_URI!,
        approval_prompt: "auto",
        scope: "read,activity:read_all",
        state
      }).toString();
      return new Response(null, {
        status: 302,
        headers: {
          location: authorize.toString(),
          "cache-control": "no-store",
          "set-cookie": cookieHeader("rs_oauth_state", state, 600)
        }
      });
    }

    if (url.pathname === "/api/auth/strava/callback") {
      const state = url.searchParams.get("state");
      const savedState = cookie(request, "rs_oauth_state");
      const clearState = "rs_oauth_state=; Path=/; HttpOnly; Secure; SameSite=Lax; Max-Age=0";
      if (!state || !savedState || state !== savedState) return json({ error: "OAuth state check failed. Please start Strava connection again." }, 400, { "set-cookie": clearState });
      if (url.searchParams.get("error")) return Response.redirect(new URL("/?strava=cancelled", url.origin).toString(), 303);
      const code = url.searchParams.get("code");
      if (!code) return json({ error: "Strava did not return an authorization code." }, 400, { "set-cookie": clearState });
      if (missingSetup(env)) return json({ error: "Strava sign-in is not configured yet. Set the Worker secrets and D1 binding first." }, 503, { "set-cookie": clearState });

      const tokenResponse = await fetch("https://www.strava.com/oauth/token", {
        method: "POST",
        headers: { "content-type": "application/x-www-form-urlencoded" },
        body: new URLSearchParams({
          client_id: env.STRAVA_CLIENT_ID!,
          client_secret: env.STRAVA_CLIENT_SECRET!,
          code,
          grant_type: "authorization_code"
        })
      });
      if (!tokenResponse.ok) return json({ error: "Strava token exchange failed. Check your client credentials and redirect URI." }, 502, { "set-cookie": clearState });
      const token = await tokenResponse.json() as StravaToken;
      if (!token.athlete?.id || !token.access_token || !token.refresh_token) return json({ error: "Strava returned an incomplete athlete connection." }, 502, { "set-cookie": clearState });

      const athlete = token.athlete;
      await env.DB!.prepare(
        "INSERT INTO strava_connections (athlete_id, firstname, lastname, profile, access_token, refresh_token, expires_at, updated_at) VALUES (?, ?, ?, ?, ?, ?, ?, CURRENT_TIMESTAMP) ON CONFLICT(athlete_id) DO UPDATE SET firstname=excluded.firstname, lastname=excluded.lastname, profile=excluded.profile, access_token=excluded.access_token, refresh_token=excluded.refresh_token, expires_at=excluded.expires_at, updated_at=CURRENT_TIMESTAMP"
      ).bind(athlete.id, athlete.firstname ?? null, athlete.lastname ?? null, athlete.profile ?? null, token.access_token, token.refresh_token, token.expires_at).run();

      const sessionId = randomId();
      const expiresAt = Math.floor(Date.now() / 1000) + 60 * 60 * 24 * 30;
      await env.DB!.prepare("INSERT INTO app_sessions (session_id, athlete_id, expires_at) VALUES (?, ?, ?)").bind(sessionId, athlete.id, expiresAt).run();
      const redirectHeaders = new Headers({ location: new URL("/?strava=connected", url.origin).toString(), "cache-control": "no-store" });
      redirectHeaders.append("set-cookie", cookieHeader("rs_session", sessionId, 60 * 60 * 24 * 30));
      redirectHeaders.append("set-cookie", clearState);
      return new Response(null, { status: 302, headers: redirectHeaders });
    }

    if (url.pathname === "/api/auth/me") {
      const session = await getSession(request, env);
      if (!session) return json({ connected: false });
      return json({ connected: true, athlete: { id: session.athlete_id, firstname: session.firstname, lastname: session.lastname, profile: session.profile } });
    }

    if (url.pathname === "/api/auth/logout" && request.method === "POST") {
      const sessionId = cookie(request, "rs_session");
      if (sessionId && env.DB && /^[a-f0-9]{64}$/.test(sessionId)) await env.DB.prepare("DELETE FROM app_sessions WHERE session_id = ?").bind(sessionId).run();
      return json({ ok: true }, 200, { "set-cookie": "rs_session=; Path=/; HttpOnly; Secure; SameSite=Lax; Max-Age=0" });
    }

    if (url.pathname === "/api/activities") {
      const session = await getSession(request, env);
      if (!session) return json({ error: "Connect your Strava account first." }, 401);
      if (!env.DB) return json({ error: "Database is not configured." }, 503);
      try {
        const accessToken = await getValidAccessToken(env, session.athlete_id);
        const page = Math.min(10, Math.max(1, Number(url.searchParams.get("page") ?? "1") || 1));
        const perPage = Math.min(50, Math.max(1, Number(url.searchParams.get("per_page") ?? "20") || 20));
        const response = await fetch(`https://www.strava.com/api/v3/athlete/activities?page=${page}&per_page=${perPage}`, {
          headers: { authorization: `Bearer ${accessToken}` }
        });
        if (!response.ok) return json({ error: "Could not load Strava activities. Please try again." }, response.status === 401 ? 401 : 502);
        const activities = await response.json() as Array<Record<string, unknown>>;
        return json({ activities: activities.map((activity) => ({
          id: activity.id,
          name: activity.name,
          type: activity.type,
          sport_type: activity.sport_type,
          start_date: activity.start_date,
          distance: activity.distance,
          moving_time: activity.moving_time,
          elapsed_time: activity.elapsed_time,
          total_elevation_gain: activity.total_elevation_gain,
          average_speed: activity.average_speed,
          max_speed: activity.max_speed,
          average_heartrate: activity.average_heartrate,
          map: activity.map
        })) });
      } catch (error) {
        return json({ error: error instanceof Error ? error.message : "Unable to load activities." }, 502);
      }
    }

    if (url.pathname.startsWith("/api/")) return json({ error: "This API endpoint is not implemented yet." }, 501);
    return env.ASSETS.fetch(request);
  }
} satisfies ExportedHandler<Env>;
