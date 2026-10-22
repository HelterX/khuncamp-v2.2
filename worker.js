function clip(v) {
  return String(v || "-").slice(0, 200);
}

// Short links for print (business-card QR codes). Each redirects to a real page with UTM tags,
// so leads from the card show up as "card" in Slack, the form emails and analytics.
// 302 on purpose: the target can be changed later without browsers caching the old one.
const SHORT_LINKS = {
  "/card": { to: "/", utm: { utm_source: "card", utm_medium: "qr", utm_campaign: "business-card" } },
  "/card/siargao": { to: "/siargao", utm: { utm_source: "card", utm_medium: "qr", utm_campaign: "siargao-nomad-fest" } },
};

// Partial-content (Range) support for videos: static assets are served whole, but iPhones need 206 responses to play MP4 files.
async function serveVideo(request, env) {
  const asset = await env.ASSETS.fetch(new Request(request.url, { method: "GET" }));
  if (asset.status !== 200) return asset;
  const range = request.headers.get("Range");
  const headers = new Headers(asset.headers);
  headers.set("Accept-Ranges", "bytes");
  if (!headers.get("Content-Type")) headers.set("Content-Type", "video/mp4");
  const buf = await asset.arrayBuffer();
  const size = buf.byteLength;
  const m = range && /^bytes=(\d*)-(\d*)$/.exec(range.trim());
  if (!m || (m[1] === "" && m[2] === "")) {
    headers.set("Content-Length", String(size));
    return new Response(request.method === "HEAD" ? null : buf, { status: 200, headers });
  }
  let start, end;
  if (m[1] === "") { const n = parseInt(m[2], 10); start = Math.max(0, size - n); end = size - 1; }
  else { start = parseInt(m[1], 10); end = m[2] === "" ? size - 1 : Math.min(parseInt(m[2], 10), size - 1); }
  if (!(start <= end) || start >= size) {
    return new Response(null, { status: 416, headers: { "Content-Range": "bytes */" + size, "Accept-Ranges": "bytes" } });
  }
  headers.set("Content-Range", "bytes " + start + "-" + end + "/" + size);
  headers.set("Content-Length", String(end - start + 1));
  return new Response(request.method === "HEAD" ? null : buf.slice(start, end + 1), { status: 206, headers });
}

const handler = {
  async fetch(request, env) {
    const url = new URL(request.url);

    if ((request.method === "GET" || request.method === "HEAD") && url.pathname.startsWith("/videos/")) {
      return serveVideo(request, env);
    }

    if (request.method === "GET" || request.method === "HEAD") {
      const key = url.pathname.length > 1 ? url.pathname.replace(/\/+$/, "").toLowerCase() : url.pathname;
      const link = SHORT_LINKS[key];
      if (link) {
        const dest = new URL(link.to, url);
        for (const [k, v] of Object.entries(link.utm)) dest.searchParams.set(k, v);
        return Response.redirect(dest.toString(), 302);
      }
    }

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

    const asset = await env.ASSETS.fetch(request);
    if (asset.status === 404) {
      // Branded 404 page, still sent with a 404 status.
      const page = await env.ASSETS.fetch(new Request(new URL("/404.html", url), { headers: request.headers }));
      if (page.status === 200) return new Response(request.method === "HEAD" ? null : page.body, { status: 404, headers: page.headers });
    }
    return asset;
  },
};

// Security headers on every response, plus caching for files that rarely change.
// css/js are loaded with ?v=NN, so a version bump busts the one-year cache.
function withHeaders(response, url) {
  const res = new Response(response.body, response);
  res.headers.set("X-Content-Type-Options", "nosniff");
  res.headers.set("Referrer-Policy", "strict-origin-when-cross-origin");
  res.headers.set("X-Frame-Options", "SAMEORIGIN");
  res.headers.set("Permissions-Policy", "camera=(), microphone=(), geolocation=()");
  if (response.status === 200 && !res.headers.has("Set-Cookie")) {
    const p = url.pathname;
    if ((p.startsWith("/css/") || p.startsWith("/js/")) && url.searchParams.has("v")) {
      res.headers.set("Cache-Control", "public, max-age=31536000, immutable");
    } else if (p.startsWith("/images/") || p.startsWith("/videos/") || /^\/(favicon|apple-touch-icon)/.test(p)) {
      res.headers.set("Cache-Control", "public, max-age=86400");
    } else if (p.startsWith("/data/")) {
      res.headers.set("Cache-Control", "no-cache");
    }
  }
  return res;
}

export default {
  async fetch(request, env) {
    const response = await handler.fetch(request, env);
    return withHeaders(response, new URL(request.url));
  },
};
