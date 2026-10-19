#!/usr/bin/env python
"""Build one Siargao Nomad Fest recap page ("Day N") from a night's notes and photos.

Usage:
    python tools/siargao_recap.py path/to/day-4.json            # build the page and publish it on the hub
    python tools/siargao_recap.py path/to/day-4.json --draft     # build the page only, leave the hub unchanged

It writes blog/siargao-fest-day-N.html, makes the images under images/siargao/,
updates data/siargao.json (day card, counter, testimonial wall) and sitemap.xml.
See tools/siargao-day.example.json for the input format.
"""
import argparse, datetime, html, json, os, re, sys

ROOT = os.path.abspath(os.path.join(os.path.dirname(__file__), '..'))
START = datetime.date(2026, 10, 16)
DEFAULT_HERO = 'images/photos/siargao-hero.webp'


def p(*a):
    return os.path.join(ROOT, *a)


def read(path):
    with open(path, encoding='utf-8', newline='') as f:
        return f.read()


def write(path, s):
    os.makedirs(os.path.dirname(path), exist_ok=True)
    with open(path, 'w', encoding='utf-8', newline='') as f:
        f.write(s)


def esc(s):
    return html.escape(str(s), quote=True)


def paras(text):
    parts = [t.strip() for t in re.split(r'\n\s*\n', str(text).strip()) if t.strip()]
    return ''.join('<p>%s</p>\n' % esc(t).replace('\n', ' ') for t in parts)


def need(d, key, where='the day file'):
    if not d.get(key):
        sys.exit('Missing "%s" in %s.' % (key, where))
    return d[key]


def safe_url(u):
    u = str(u or '').strip()
    if u and not re.match(r'^https?://', u, re.I):
        sys.exit('Links must start with http:// or https:// (got "%s").' % u)
    return u


def person_extras(pr):
    """tags (handles or labels) and website / other links for one person."""
    tags = [str(t).strip() for t in (pr.get('tags') or []) if str(t).strip()]
    links = []
    if pr.get('website'):
        links.append({'label': 'Website', 'url': safe_url(pr['website'])})
    for l in (pr.get('links') or []):
        links.append({'label': str(l.get('label') or 'Visit'), 'url': safe_url(l.get('url'))})
    return tags, links


# ---- rules from Shawn's brief ----------------------------------------------------------
# No prices, no pitch copy, no attendee names or faces, nothing about the crew rotation.
BANNED = [
    (r'[$\u20b1\u20ac\u00a3]\s?\d', 'a price'),
    (r'\b\d[\d,.]*\s?(usd|php|pesos?|dollars?|euros?)\b', 'a price'),
    (r'\b(prices?|pricing|discounts?|promo code|\d+\s?% off)\b', 'pricing wording'),
    (r'\b(book a call|book now|buy now|sign up now|limited spots?|special offer)\b', 'pitch copy'),
    (r'\b(crew rotation|rotation|on duty|off duty|stipend|salary|per diem)\b', 'internal crew or pay details'),
]


def all_text(day):
    parts = [day.get('title'), day.get('dek'), day.get('intro'), day.get('pull_quote'), (day.get('clip') or {}).get('caption')]
    for s in day.get('sections') or []:
        parts += [s.get('h'), s.get('body')]
    for pr in day.get('people') or []:
        parts += [pr.get('quote'), pr.get('business')]
    for ph in day.get('photos') or []:
        if isinstance(ph, dict):
            parts += [ph.get('alt'), ph.get('caption')]
    return [str(x) for x in parts if x]


def check_rules(day):
    chk = day.get('checks') or {}
    missing = [k for k in ('no_attendee_faces_or_names', 'no_prices_or_pitch') if chk.get(k) is not True]
    if missing:
        sys.exit('Cannot publish yet. In the notes file, "checks" must confirm each rule from Shawn\'s brief:\n'
                 '  "checks": {"no_attendee_faces_or_names": true, "no_prices_or_pitch": true}\n'
                 'Missing or not true: ' + ', '.join(missing))
    hits = []
    for text in all_text(day):
        for pat, label in BANNED:
            m = re.search(pat, text, re.I)
            if m:
                hits.append('  - %s: "%s" in "%s..."' % (label, m.group(0), text[:50].replace('\n', ' ')))
    if hits:
        sys.exit('Cannot publish: the text breaks the site rules (no prices, no pitch copy, nothing about the crew rotation or pay).\n' + '\n'.join(hits))


def gallery_images(day, n, hero_default):
    """Ilya's 3 to 5 best photos for the night. Returns (html, first_photo_src)."""
    raw = day.get('photos') or []
    if len(raw) > 5:
        sys.exit('"photos" has %d items. Use the 3 to 5 best (maximum 5).' % len(raw))
    if raw and len(raw) < 3:
        print('note: only %d photo(s). Shawn asked for 3 to 5 of the best items each night.' % len(raw))
    from PIL import Image
    figs = ''
    first = None
    for i, item in enumerate(raw, 1):
        item = {'src': item} if isinstance(item, str) else dict(item)
        src = item.get('src') or ''
        path = src if os.path.isabs(src) else p(src)
        if not os.path.exists(path):
            sys.exit('Photo not found: %s' % src)
        if first is None:
            first = src
        im = Image.open(path).convert('RGB')
        if im.width > 1200:
            im = im.resize((1200, int(im.height * 1200 / im.width)))
        out = 'images/siargao/day-%d-photo-%d.webp' % (n, i)
        im.save(p(out), 'WEBP', quality=74)
        alt = item.get('alt') or 'Photo %d from day %d of Siargao Nomad Fest' % (i, n)
        cap = ('<figcaption>%s</figcaption>' % esc(item['caption'])) if item.get('caption') else ''
        figs += '          <figure><img src="../%s" alt="%s" width="%d" height="%d" loading="lazy">%s</figure>\n' % (out, esc(alt), im.width, im.height, cap)
    if not figs:
        return '', None
    return ('      <section class="rc-gallery" aria-label="Photos from the day">\n        <h2>From the day</h2>\n'
            '        <div class="rc-gal rc-gal--%d">\n%s        </div>\n      </section>\n') % (len(raw), figs), first


def owner_gaps(pr):
    """What is missing before this owner may appear on the site (Shawn: only with the owner's OK)."""
    ok = pr.get('owner_ok') or {}
    gaps = []
    for key, label in (('said_yes', 'the owner said yes'), ('release_signed', 'the release is signed'), ('quote_approved', 'the owner approved the quote')):
        if ok.get(key) is not True:
            gaps.append('%s is not confirmed ("%s": true)' % (label, key))
    if not str(ok.get('how') or '').strip():
        gaps.append('"how" is missing (for example "release form" or "on-camera consent")')
    d = str(ok.get('date') or '').strip()
    if not re.match(r'^\d{4}-\d{2}-\d{2}$', d):
        gaps.append('"date" is missing or not YYYY-MM-DD')
    return gaps


def image_set(src, n, tag, cover):
    """Make web-ready copies of a photo. cover=True also makes the hero, card thumb and share image."""
    from PIL import Image
    path = src if os.path.isabs(src) else p(src)
    if not os.path.exists(path):
        sys.exit('Image not found: %s' % src)
    im = Image.open(path).convert('RGB')
    out = {}

    def crop(im, ratio, width):
        w, h = im.size
        if w / h > ratio:
            nw = int(h * ratio); x = (w - nw) // 2; box = (x, 0, x + nw, h)
        else:
            nh = int(w / ratio); y = (h - nh) // 2; box = (0, y, w, y + nh)
        c = im.crop(box)
        return c.resize((width, int(width / ratio)))

    base = 'images/siargao/day-%d' % n
    if cover:
        big = im if im.width <= 1800 else im.resize((1800, int(im.height * 1800 / im.width)))
        big.save(p(base + '-hero.webp'), 'WEBP', quality=74)
        crop(im, 4 / 3, 640).save(p(base + '-thumb.webp'), 'WEBP', quality=72)
        crop(im, 1200 / 630, 1200).save(p(base + '-og.jpg'), 'JPEG', quality=84)
        out = {'hero': base + '-hero.webp', 'thumb': base + '-thumb.webp', 'og': base + '-og.jpg'}
    else:
        crop(im, 4 / 5, 640).save(p('images/siargao/day-%d-%s.webp' % (n, tag)), 'WEBP', quality=74)
        out = {'photo': 'images/siargao/day-%d-%s.webp' % (n, tag)}
    return out


def main():
    ap = argparse.ArgumentParser()
    ap.add_argument('day_file')
    ap.add_argument('--draft', action='store_true', help='build the page but do not change the hub data')
    a = ap.parse_args()

    os.makedirs(p('images', 'siargao'), exist_ok=True)
    day = json.loads(read(a.day_file))
    n = int(need(day, 'n'))
    if not 1 <= n <= 10:
        sys.exit('"n" must be 1 to 10.')
    check_rules(day)
    title = need(day, 'title').strip()
    title_full = title if re.match(r'^day\s*\d', title, re.I) else 'Day %d: %s' % (n, title)
    dek = need(day, 'dek').strip()
    date = START + datetime.timedelta(days=n - 1)
    date_long = date.strftime('%a %b ') + str(date.day)
    sections = day.get('sections') or []
    intro = need(day, 'intro')

    # words in the article, for the read time
    words = len(intro.split()) + sum(len(str(s.get('body', '')).split()) for s in sections)
    read_min = max(1, round(words / 220))

    gallery_html, first_photo = gallery_images(day, n, DEFAULT_HERO)
    imgs = image_set(day.get('hero_src') or first_photo or DEFAULT_HERO, n, 'hero', True)

    # body
    body = '<p class="article-intro">%s</p>\n' % esc(intro.strip())
    for s in sections:
        body += '<h2>%s</h2>\n%s' % (esc(need(s, 'h', 'a section')), paras(need(s, 'body', 'a section')))

    # clip of the day
    clip = ''
    if day.get('clip', {}).get('videoId'):
        c = day['clip']; vid = esc(c['videoId'])
        clip = ('      <figure class="rc-clip" data-id="%s" data-title="%s">\n'
                '        <button type="button" class="rc-clip-play" aria-label="Play the clip of the day">\n'
                '          <img src="https://i.ytimg.com/vi/%s/hqdefault.jpg" alt="" loading="lazy">\n'
                '          <span class="rc-play">&#9654;</span>\n        </button>\n'
                '        <figcaption>%s</figcaption>\n      </figure>\n') % (vid, esc(c.get('caption', 'Clip of the day')), vid, esc(c.get('caption', 'Clip of the day')))

    # people we met and the wall entries
    people = day.get('people') or []
    cards = ''
    wall = []
    left_out = []
    for i, pr in enumerate(people, 1):
        gaps = owner_gaps(pr)
        if gaps:
            left_out.append((str(pr.get('name') or 'an owner'), gaps))
            continue
        name = need(pr, 'name', 'a person'); biz = need(pr, 'business', 'a person'); q = need(pr, 'quote', 'a person')
        vid = need(pr, 'videoId', 'a person (the testimonial video)')
        if pr.get('photo_src'):
            ph = image_set(pr['photo_src'], n, 'person-%d' % i, False)['photo']
        else:
            ph = imgs['thumb']
        town = pr.get('town', '')
        tags, links = person_extras(pr)
        tag_html = ('<ul class="rc-tags">%s</ul>' % ''.join('<li>%s</li>' % esc(t) for t in tags)) if tags else ''
        link_html = ('<p class="rc-links">%s</p>' % ''.join(
            '<a href="%s" target="_blank" rel="noopener nofollow">%s &#8599;</a>' % (esc(l['url']), esc(l['label'])) for l in links)) if links else ''
        cards += ('        <li class="rc-person">\n'
                  '          <img src="../%s" alt="%s" loading="lazy" width="640" height="800">\n'
                  '          <div><b>%s</b><span>%s%s</span><q>%s</q>%s%s<a href="../siargao#wall">Watch the testimonial &rarr;</a></div>\n'
                  '        </li>\n') % (ph, esc('%s, %s' % (name, biz)), esc(name), esc(biz), esc(', ' + town) if town else '', esc(q), tag_html, link_html)
        wall.append({'name': name, 'business': biz, 'town': town, 'day': n, 'quote': q, 'videoId': vid, 'image': ph,
                     'tags': tags, 'links': links})
    people_html = ''
    if cards:
        people_html = ('      <section class="rc-people" aria-labelledby="rc-people-h">\n'
                       '        <h2 id="rc-people-h">Who we met</h2>\n        <ul>\n%s        </ul>\n      </section>\n') % cards

    pull = ''
    if day.get('pull_quote'):
        pull = '      <blockquote class="rc-pull">%s</blockquote>\n' % esc(day['pull_quote'])

    css_v = re.search(r'style\.css\?v=(\d+)', read(p('index.html'))).group(1)
    desc = dek if len(dek) <= 160 else dek[:157].rstrip() + '...'
    ld = json.dumps({
        '@context': 'https://schema.org', '@type': 'Article',
        'headline': '%s (Siargao Nomad Fest)' % title_full, 'description': desc,
        'image': 'https://khuncamp.com/' + imgs['og'],
        'author': {'@type': 'Person', 'name': 'Shawn Arrington'},
        'publisher': {'@type': 'Organization', 'name': 'Khun Camp'},
        'datePublished': date.isoformat(),
        'about': {'@type': 'Event', 'name': 'Siargao Nomad Fest', 'startDate': '2026-10-16', 'endDate': '2026-10-25'}
    }, ensure_ascii=False)

    tpl = read(p('tools', 'siargao-recap.template.html')).replace('\r\n', '\n')
    rep = {
        '{{N}}': str(n), '{{N2}}': '%02d' % n, '{{TITLE}}': esc(title), '{{TITLE_FULL}}': esc(title_full), '{{GALLERY}}': gallery_html.rstrip('\n'), '{{DEK}}': esc(dek), '{{DESC}}': esc(desc),
        '{{DATE_LONG}}': date_long, '{{READ}}': str(read_min), '{{CSS_V}}': css_v, '{{LD}}': ld.replace('</', '<\\/'),
        '{{HERO_ALT}}': esc(day.get('hero_alt', 'Siargao Island, Day %d of Siargao Nomad Fest' % n)),
        '{{BODY}}': ''.join('        ' + l + '\n' for l in body.rstrip('\n').split('\n')).rstrip('\n'),
        '{{CLIP}}': clip.rstrip('\n'), '{{PEOPLE}}': people_html.rstrip('\n'), '{{PULL}}': pull.rstrip('\n'),
    }
    out = tpl
    for k, v in rep.items():
        out = out.replace(k, v)
    left = re.findall(r'\{\{[A-Z0-9_]+\}\}', out)
    if left:
        sys.exit('Unfilled template fields: %s' % left)
    page = p('blog', 'siargao-fest-day-%d.html' % n)
    write(page, out)
    print('page   ->', os.path.relpath(page, ROOT))
    for nm, gaps in left_out:
        print('LEFT OUT "%s": not on the site yet.' % nm)
        for gp in gaps:
            print('    - ' + gp)
    if left_out:
        print('    Add them on a later night once everything is confirmed. The rest of the recap is unaffected.')

    if a.draft:
        print('draft: hub data and sitemap left unchanged')
        return

    # hub data
    dpath = p('data', 'siargao.json')
    data = json.loads(read(dpath))
    d = data['days'][n - 1]
    photos = ['images/siargao/day-%d-photo-%d.webp' % (n, i) for i in range(1, 6) if os.path.exists(p('images', 'siargao', 'day-%d-photo-%d.webp' % (n, i)))]
    d.update({'published': True, 'title': title, 'dek': dek, 'url': 'blog/siargao-fest-day-%d' % n, 'image': imgs['thumb'],
              'clips': 1 if clip else 0, 'testimonials': len(wall), 'photos': photos})
    data['testimonials'] = [t for t in data.get('testimonials', []) if t.get('day') != n] + wall
    write(dpath, json.dumps(data, indent=2, ensure_ascii=False) + '\n')
    print('hub    -> data/siargao.json (day %d published, %d testimonials)' % (n, len(wall)))

    # sitemap
    sm = read(p('sitemap.xml'))
    loc = 'https://khuncamp.com/blog/siargao-fest-day-%d' % n
    if loc not in sm:
        nl = '\r\n' if '\r\n' in sm else '\n'
        sm = sm.replace('</urlset>', '  <url><loc>%s</loc></url>%s</urlset>' % (loc, nl))
        write(p('sitemap.xml'), sm)
        print('sitemap-> added')


if __name__ == '__main__':
    main()
