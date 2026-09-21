# Google for Jobs: complete the JobPosting markup and sitemap entry

Two small file edits, then publish and resubmit the sitemap. No database or edge-function changes.

## Current state (verified)

- `src/pages/careers/CareersVendorGrowthManager.tsx` injects a `JobPosting` JSON-LD object via useEffect; it has title, description, datePosted, validThrough, employmentType, hiringOrganization and jobLocation — but **no `identifier` and no `directApply`**.
- `public/sitemap.xml` lists 9 URLs; the careers page is not among them.
- `public/robots.txt` allows `/careers` — no change needed.
- Search Console: the domain property `sc-domain:umcimbi.co.za` is already verified, the homepage is indexed, and `sitemap.xml` is already submitted — so no verification work is required; only a resubmit after the sitemap changes.

## Changes

### 1. `src/pages/careers/CareersVendorGrowthManager.tsx`

Inside the `jobPosting` object, after `jobLocation`, add:

```ts
identifier: {
  '@type': 'PropertyValue',
  name: 'UMCIMBI',
  value: 'vendor-growth-manager-2026',
},
directApply: true,
```

Nothing else in the file changes. `baseSalary` stays out (commission-only comp has no clean schema field; the body text explains it).

### 2. `public/sitemap.xml`

Add one `<url>` entry for the careers page:

```xml
<url>
  <loc>https://www.umcimbi.co.za/careers/vendor-growth-manager</loc>
  <changefreq>weekly</changefreq>
  <priority>0.7</priority>
</url>
```

## Verification and publish

1. Typecheck + build clean.
2. Publish the app (the markup and sitemap must be live before Google can see either).
3. After publish: load `/careers/vendor-growth-manager` in the preview and confirm the rendered JSON-LD contains `identifier` and `directApply`; fetch the live `sitemap.xml` and confirm the new URL is present.
4. Resubmit `https://www.umcimbi.co.za/sitemap.xml` to Search Console on your behalf via the connected Search Console property (`sc-domain:umcimbi.co.za`) — this prompts a fresh crawl of the updated sitemap.

## Manual steps only you can do (API cannot)

- Run the live URL through Google's Rich Results Test (search.google.com/test/rich-results) once the publish lands, to confirm Google parses the JobPosting markup.
- In Search Console, URL Inspection on `https://www.umcimbi.co.za/careers/vendor-growth-manager` and click "Request Indexing".

## Not covered by this change

Google for Jobs is the only platform this markup feeds automatically. LinkedIn, Indeed and Careers24 need their own postings.
