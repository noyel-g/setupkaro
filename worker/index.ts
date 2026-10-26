interface Env {
  ASSETS: Fetcher;
}

// Daymark is a local-first journal. Journal content is stored in the browser;
// the worker only serves the Vite-built single-page application.
export default {
  async fetch(request: Request, env: Env): Promise<Response> {
    return env.ASSETS.fetch(request);
  }
};
