import { readFile, writeFile } from "node:fs/promises";

const FILE = process.env.STATS_FILE || "data/stats.json";
const CHANNEL = "UCD9PI1qE9zIrNERBqlyy79Q"; // KhunShawn
const VIDEOS = ["KtqlF9aHLjE", "4wFccc5T1nk", "9fmEzYZCbq4", "aVQeU23R_rA", "-ZPMGSPmHxM", "qdast5G6Pjc"];
const KEY = process.env.YT_API_KEY;
if (!KEY) { console.error("YT_API_KEY is not set"); process.exit(1); }

async function yt(path, params) {
  const url = "https://www.googleapis.com/youtube/v3/" + path + "?" + new URLSearchParams({ ...params, key: KEY });
  const r = await fetch(url);
  if (!r.ok) throw new Error(path + " returned HTTP " + r.status);
  return r.json();
}
const num = (v) => { const n = Number(v); return Number.isFinite(n) && n >= 0 ? n : null; };

const stats = JSON.parse(await readFile(FILE, "utf8"));
const ch = (stats.channels.khunshawn ??= {});

const c = await yt("channels", { part: "statistics", id: CHANNEL });
const subs = num(c.items?.[0]?.statistics?.subscriberCount);
if (subs == null) throw new Error("no subscriber count in the response");
ch.subscribers_total = subs;

const v = await yt("videos", { part: "statistics", id: VIDEOS.join(",") });
ch.videos ??= {};
for (const item of v.items ?? []) {
  const views = num(item.statistics?.viewCount);
  if (views != null) ch.videos[item.id] = { views };
}
const missing = VIDEOS.filter((id) => !ch.videos[id]);
if (missing.length) console.warn("no view count for: " + missing.join(", "));

const today = new Date().toISOString().slice(0, 10);
stats.updated_at = today;
ch.live_as_of = today; // as_of stays tied to the hand-edited 28 day window

await writeFile(FILE, JSON.stringify(stats, null, 2) + "\n");
console.log("subscribers " + subs + ", videos " + Object.keys(ch.videos).length + "/" + VIDEOS.length);
