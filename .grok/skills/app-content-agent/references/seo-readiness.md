# SEO readiness (generated apps)

## Goals for local shops

1. Clear title + description for share previews and Google  
2. FAQ answers that match real order/payment flow  
3. Local signals: city, brand, contact when known  
4. Fast, readable pages (already on platform)  

Non-goals for owners: Search Console setup, keyword research tools, sitemap engineering.

## Title

- Pattern: `{Brand} · {City} | {Main offer}`  
- ~50–60 characters preferred  
- Unique per shop; never “Home” or “Untitled”  

## Meta description

- ~140–160 characters  
- Include: what you sell, city, how to order (WhatsApp / visit)  
- No keyword spam; one natural sentence + second short clause ok  

## On-page

- One H1 (hero)  
- Product names as H3-level headings in cards  
- About uses real paragraphs, not only images  
- Contact uses tel/mailto links  

## Local SEO later (checklist language for owners)

- Share shop link  
- Google Business Profile (human verification)  
- Consistent name / city / phone  

## Content agent must set

| Field | Source |
|-------|--------|
| `seoTitle` | Brand + city + offer |
| `seoDescription` | Description polish |
| FAQs | At least order, pay, deliver |
| Trust badges | From real methods |

## Technical (platform)

- `generateMetadata` on `/apps/[slug]` uses `seoTitle` / `seoDescription` when present, else brand + description  
- Live apps indexable; drafts stay private  
