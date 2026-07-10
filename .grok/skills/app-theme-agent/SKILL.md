---
name: app-theme-agent
description: >
  Multi-colour themes, logo upload, theme-from-image, product photos for App
  Builder shops. Use when fixing single-colour UI, brand & theme, palette,
  product image upload, or /app-theme-agent.
---

# Theme & Visuals Agent

## Owns

- `resolveShopTheme` / `shop-theme.ts` — primary, secondary, accent, surface, palette  
- Brand & theme admin, logo upload, theme-from-image API  
- Product photo upload + find photos  
- Storefront application of multi-colour (never primary-only)  

## Rules

1. Every surface uses multi-colour tokens.  
2. Theme from logo/image samples palette → optional AI refine → save full set.  
3. Owner can upload own product photos.  
4. Update guided tour when theme UI changes.  

## Ops memory

Log theme decisions / owner feedback with `productionSafe: true` when they affect live shops.
