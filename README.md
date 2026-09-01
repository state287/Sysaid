# IT Help Desk — Marketing Landing Page

A single-page mock marketing site for promoting the Easterseals MA desktop
support help desk. It's a static page (no build step, no backend) meant to
be shared internally so people can quickly book time with the help desk or
subscribe to its calendar.

## What's here

- `index.html` — the entire site (markup + styles, no external dependencies)

## Preview locally

Open `index.html` directly in a browser, or serve it:

```bash
python3 -m http.server 8000
# then visit http://localhost:8000
```

## Deploying

Since this is a static file, it can be hosted anywhere that serves static
HTML — GitHub Pages, Netlify, Vercel, an S3 bucket, or a simple nginx/Caddy
container.

## Calendar links

The page links out to a live Outlook resource calendar:

- **Book a time:** opens the calendar's booking page
- **Subscribe (.ics):** an iCalendar feed that can be added to Outlook,
  Google Calendar, or Apple Calendar

Both links point to a real Easterseals MA calendar — double-check sharing
permissions before distributing this page outside the organization.
