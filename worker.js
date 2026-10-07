function clip(v) {
  return String(v || "-").slice(0, 200);
}

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
        "*Page:* " + (data.source || "") + "\n" +
        (data.utm_source || data.utm_medium || data.utm_campaign || data.utm_content
          ? ":mega: *Ad source:* " + clip(data.utm_source) + "\n" +
            "*Ad medium:* " + clip(data.utm_medium) + "\n" +
            "*Ad campaign:* " + clip(data.utm_campaign) + "\n" +
            "*Ad content:* " + clip(data.utm_content)
          : "*Ad source:* none (direct or organic)");

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

    // Serve extensionless URLs (e.g. /blog, /blog/some-post) from the matching
    // .html file, without a redirect, so the clean URL stays in the address bar.
    const lastSegment = url.pathname.split("/").pop();
    if (lastSegment && !lastSegment.includes(".")) {
      const htmlUrl = new URL(url.pathname + ".html", url);
      const htmlResponse = await env.ASSETS.fetch(new Request(htmlUrl, request));
      if (htmlResponse.status === 200) {
        return htmlResponse;
      }
    }

    return env.ASSETS.fetch(request);
  },
};
