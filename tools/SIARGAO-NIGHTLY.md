# Siargao Nomad Fest: publishing a daily recap ("Day N")

**Rules from Shawn's brief (the tool enforces them)**
- No prices, no pitch copy, nothing about internal pay or the crew rotation.
- No attendee names, faces or photos. Use the crew, wide crowd shots and our own footage. Speakers only after they OK it.
- A business owner goes on the site only with their OK.

**Each night**
1. Ilya sends the 3 to 5 best photos and clips by about 21:30. Put the photos in a folder.
2. Upload the clip and any testimonial video to YouTube, so you have their video ids.
3. Copy `tools/siargao-day.example.json` to a new file (for example `day-4.json`, outside the repo) and fill it in:
   - the headline, a one-line summary (`dek`), the opening paragraph and a few short sections from Shawn's notes
   - `photos`: Ilya's 3 to 5 best (3 to 5 shown as a gallery; the first is the page's top image unless you set `hero_src`)
   - `clip`: the YouTube id of the clip of the day
   - `people`: each local business owner who said yes, with name, business, town, quote, their testimonial video id, photo, and optionally `tags`, a `website` and other `links` (https:// only)
     - each one needs `owner_ok`: `said_yes`, `release_signed` and `quote_approved` all `true`, plus `how` (for example "release form") and `date` (YYYY-MM-DD)
     - an owner who is not fully confirmed is **left out** of that night's page and listed in the tool's output; add them on a later night
   - `checks`: both rules set to `true` once you have looked
4. Run `python tools/siargao_recap.py day-4.json --draft` to build the page only, and open `blog/siargao-fest-day-4.html` to check it.
5. Run it again without `--draft` to publish it on the hub, the counter, the wall and the sitemap, then commit and push.

The page is titled "Day 4: your headline". Re-running the same day replaces that day's page and its testimonials, so fixes are safe.

**The tool refuses to publish** if a rule is not confirmed (an unconfirmed owner is skipped, not refused), if the text contains a price, pitch wording or crew and pay wording, if there are more than 5 photos, or if a link does not start with https://.
Only publish a testimonial once the owner's release is signed and they have said yes.

Keep owner names and the tracker out of the repository: everything in it is publicly reachable. Use the private tracker page instead.
