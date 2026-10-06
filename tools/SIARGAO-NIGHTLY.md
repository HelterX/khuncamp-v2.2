# Siargao Fest: publishing a recap

Each night, from Shawn's footage and notes:

1. Copy `tools/siargao-day.example.json` to a new file (for example `day-4.json`, anywhere outside the repo) and fill it in:
   title, dek, intro, sections, the clip's YouTube id, each person met (with their testimonial video id, quote and photo), and a pull quote.
2. Upload the clip and each testimonial to YouTube first, so you have their video ids.
3. Run `python tools/siargao_recap.py day-4.json`.
   - Add `--draft` to build the page only and check it before it appears on the hub.
4. Open `blog/siargao-fest-day-N.html` in a browser to check it, then commit and push. The hub, the day counter, the testimonial wall and the day tracker all update from `data/siargao.json`.

Re-running the same day replaces that day's page and its testimonials, so fixes are safe.
Only publish a testimonial once the owner's release form is signed.
