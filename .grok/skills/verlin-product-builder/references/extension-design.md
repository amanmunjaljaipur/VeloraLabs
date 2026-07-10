# Extension design: menus, admin, roles, files

## Extension ID naming

- `kebab-case`, domain-clear: `ecom-local-shop`, `booking-local`, `tuition-centre`, `portfolio-creator`
- One ID = one content type + one question bank + one runtime UI

## Public menu patterns

### ecom-local-shop (shipped)

| Menu | Path segment | Purpose |
|------|--------------|---------|
| Home | `` | Trust + featured |
| Products | `shop` | Catalogue |
| About | `about` | Story |
| Help | `faq` | Simple FAQ |
| Contact | `contact` | Phone / WhatsApp |
| Sign in / Join | `login` / `signup` | Tenant auth |
| Dashboard | `admin` | Staff only |

### booking-local (template for next)

| Menu | Path | Purpose |
|------|------|---------|
| Home | `` | Offer + city |
| Services | `services` | What can be booked |
| Book | `book` | Request a slot |
| About | `about` | |
| Contact | `contact` | |
| My bookings | `account` | Customer |
| Dashboard | `admin` | Calendar / requests |

### tuition-centre (template)

| Menu | Path | Purpose |
|------|------|---------|
| Home | `` | |
| Courses | `courses` | |
| Batch timings | `batches` | |
| Fees | `fees` | |
| Enroll / Contact | `contact` | |
| Parent login | `login` | |
| Dashboard | `admin` | Students, fees, notices |

## Admin menu patterns

Always order:

1. **Overview** — counts, “what needs attention”  
2. **Primary ops** — Orders / Bookings / Enquiries  
3. **Catalogue** — Products / Services / Courses  
4. **People** — Team (not all customers unless CRM-light)  
5. **Roles** — definitions + default role  
6. **Settings** — brand, hours, contact  

### Capability vocabulary (reuse)

```
* | products.view | products.edit | orders.view | orders.manage
| customers.view | customers.manage | team.view | team.manage
| roles.manage | settings.edit | analytics.view
| shop.browse | orders.own | profile.edit | inquiries.manage
| bookings.view | bookings.manage | courses.edit | notices.edit
```

Map menus → required capability. Hide nav items if missing.

## Role templates by vertical

### Retail / ecom

- Owner, Manager, Staff, **Customer** (default)

### Booking (salon, clinic, tutor 1:1)

- Owner, Manager, Staff, **Client** (default)

### Tuition

- Owner, Teacher, Staff, **Parent** (default), optional Student (read-only)

### Portfolio / creator

- Owner, Editor, **Visitor** may not need signup—if signup: **Subscriber** (default)

## Standalone shell rules

- Middleware sets `x-vl-app-shell: 1` for `/apps/*`  
- Root layout: no Navbar, Footer, AdminSiteChrome, Chat, Legal gate  
- App header uses **brand** logo/initials only  
- Tiny “Powered by” optional; never full Verlin marketing nav  

## File map when adding an extension

```
src/lib/app-builder/
  types.ts              # AppExtensionId + content interfaces
  extensions.ts         # questions, idea cards, plainLabel
  generate.ts           # LLM + fallback per extensionId
  branding.ts           # optional location palettes
  default-roles.ts      # or per-extension defaults
  tenant-store.ts       # shared tenancy
  packager.ts           # static export
  static-export.ts      # HTML export per extension

src/components/app-builder/
  StandaloneAppRuntime.tsx   # route switcher + shell
  AppAuthScreens.tsx
  AppAdminPanel.tsx          # or extension-specific admin
  XxxApp.tsx                 # public UI

src/app/apps/[slug]/[[...path]]/page.tsx
src/app/api/apps/[slug]/auth/*
src/app/api/apps/[slug]/admin/*
generated-apps/{slug}/       # export on publish
```

## Generate prompt rules (LLM)

System prompt must:

- Return **only JSON** matching content shape  
- Simple language for non-tech  
- Reflect every interview answer + owner custom points  
- No fake certifications/claims  
- India-realistic prices/channels when city is India  

Always keep a **deterministic fallback** if LLM fails.

## Interview UX (studio)

1. Idea cards (emoji + title + plain description)  
2. One question per screen + progress bar  
3. Chips (single/multi) + custom add  
4. Free “own points” list before AI key  
5. AI key with plain labels; advanced model URL collapsed  

## Testing a new extension

- [ ] Create via studio with only chip taps  
- [ ] Publish; open `/apps/slug` without VL chrome  
- [ ] Navigate all public menus without 404  
- [ ] Sign up as random user → default role  
- [ ] Sign up as creator email → Owner  
- [ ] Platform super_admin opens admin  
- [ ] Refresh page; data still present  
- [ ] Download hosting folder opens offline  
