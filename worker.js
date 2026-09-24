export default {
  async fetch(request, env) {
    const url = new URL(request.url);

    if (request.method === "POST" && url.pathname === "/api/lead-notify") {
      let data;
      try {
        data = await request.json();
      } catch (err) {
        return new Response("Bad request", { status: 400 });
      }

      const text =
        ":inbox_tray: *New website lead*\n" +
        "*Name:* " + (data.name || "") + "\n" +
        "*Email:* " + (data.email || "") + "\n" +
        "*Budget:* " + (data.budget || "") + "\n" +
        "*Content volume:* " + (data.content_volume || "") + "\n" +
        "*Challenge:* " + (data.pain_point || "") + "\n" +
        "*Source:* " + (data.source || "");

      if (env.SLACK_WEBHOOK_URL) {
        try {
          await fetch(env.SLACK_WEBHOOK_URL, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ text: text }),
          });
        } catch (err) {
          // swallow — don't block the site visitor on a Slack hiccup
        }
      }

      return new Response("ok", { status: 200 });
    }

    if (url.pathname === "/") {
      return env.ASSETS.fetch(new Request(new URL("/index.html", url), request));
    }

    return env.ASSETS.fetch(request);
  },
};
