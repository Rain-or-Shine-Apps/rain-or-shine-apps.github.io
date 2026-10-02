# Adding a Brickify blog post

Files starting with `_` (this one, `_template.html`) are not published by GitHub Pages.

## What to send Claude

A doc (Google Doc, Word, or pasted text) with:

| Field | Notes |
|---|---|
| Header | The post title |
| Subheader | One or two sentences under the title |
| Summary | ~150 characters for Google and social previews. Optional; Claude will write one from the subheader if missing |
| Date | Publish date. Defaults to the day it goes up |
| Picture | Image file (ideally 1200×675 or wider, landscape) plus a caption if wanted |
| Video | YouTube link, or an MP4 file. Say where in the copy it should go (default: after the first section) |
| Copy | Body text. Headings, bullet lists, quotes and links all carry over |
| Slug | Optional, sets the URL (see below). If left out, Claude picks one and tells you |

## Slug = URL

Every post's address is:

```
https://rainorshineapps.com/brickify/blog/<slug>.html
```

The slug rules:
- lowercase letters, numbers and hyphens only (no spaces, apostrophes or other punctuation)
- 3 to 6 words, keeping the keywords people would search for
- written once and never changed after publishing (changing it breaks shared links)

Examples:
- "5 Things in Online Safety You Shouldn't Miss" → `five-things-in-online-safety`
- "How to Make a School Phone Brick-Only" → `school-phone-brick-only`

You can pick the slug yourself to know the URL in advance (e.g. for social posts scheduled ahead of time).

## Steps Claude follows

1. Copy `_template.html` to `<slug>.html` and fill every `{{PLACEHOLDER}}` (title appears in several places, including the JSON-LD block).
2. Save the picture (and any MP4) to `blog/images/`, converted to `.webp` and resized to ~1200px wide.
3. Remove the unused video option, or the whole video block if there's no video.
4. Add a `.post-card` to the top of the list in `blog/index.html` (newest first).
5. Add the URL to `/sitemap.xml` next to the other blog entries.
6. Check no `{{` is left: `grep -n "{{" blog/<slug>.html`.
7. Preview locally, then commit and push.
