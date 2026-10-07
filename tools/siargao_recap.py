#!/usr/bin/env python
"""Build one Siargao Nomad Fest recap page from a night's notes.

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
    title = need(day, 'title').strip()
    dek = need(day, 'dek').strip()
    date = START + datetime.timedelta(days=n - 1)
    date_long = date.strftime('%a %b ') + str(date.day)
    sections = day.get('sections') or []
    intro = need(day, 'intro')

    # words in the article, for the read time
    words = len(intro.split()) + sum(len(str(s.get('body', '')).split()) for s in sections)
    read_min = max(1, round(words / 220))

    imgs = image_set(day.get('hero_src') or DEFAULT_HERO, n, 'hero', True)

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
    for i, pr in enumerate(people, 1):
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
        'headline': '%s (Siargao Nomad Fest, Day %d)' % (title, n), 'description': desc,
        'image': 'https://khuncamp.com/' + imgs['og'],
        'author': {'@type': 'Person', 'name': 'Shawn Arrington'},
        'publisher': {'@type': 'Organization', 'name': 'Khun Camp'},
        'datePublished': date.isoformat(),
        'about': {'@type': 'Event', 'name': 'Siargao Nomad Fest', 'startDate': '2026-10-16', 'endDate': '2026-10-25'}
    }, ensure_ascii=False)

    tpl = read(p('tools', 'siargao-recap.template.html')).replace('\r\n', '\n')
    rep = {
        '{{N}}': str(n), '{{N2}}': '%02d' % n, '{{TITLE}}': esc(title), '{{DEK}}': esc(dek), '{{DESC}}': esc(desc),
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

    if a.draft:
        print('draft: hub data and sitemap left unchanged')
        return

    # hub data
    dpath = p('data', 'siargao.json')
    data = json.loads(read(dpath))
    d = data['days'][n - 1]
    d.update({'published': True, 'title': title, 'dek': dek, 'url': 'blog/siargao-fest-day-%d' % n, 'image': imgs['thumb'],
              'clips': 1 if clip else 0, 'testimonials': len(people)})
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
