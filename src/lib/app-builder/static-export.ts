/**
 * Build a self-contained static HTML site for a local shop.
 * One index.html with hash routing - works on any static host offline.
 */
import type { EcomLocalShopContent } from "@/lib/app-builder/types";

function esc(s: string): string {
  return s
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

function escAttr(s: string): string {
  return esc(s).replace(/'/g, "&#39;");
}

export function buildStaticSiteFiles(
  content: EcomLocalShopContent,
  slug: string
): Record<string, string> {
  const dataJson = JSON.stringify(content).replace(/</g, "\\u003c");
  const html = `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="utf-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1" />
  <title>${esc(content.seoTitle || `${content.brandName} · ${content.city}`)}</title>
  <meta name="description" content="${escAttr(content.seoDescription || content.description || content.tagline)}" />
  <meta name="theme-color" content="${escAttr(content.primaryColor)}" />
  <style>
    :root { --primary: ${content.primaryColor || "#0d9488"}; --secondary: ${content.secondaryColor || "#0f766e"}; --accent: ${content.accentColor || content.primaryColor || "#0d9488"}; --surface: ${content.surfaceColor || "#f0fdfa"}; --bg: #fafafa; --card: #fff; --text: #0f172a; --muted: #64748b; --border: #e2e8f0; }
    * { box-sizing: border-box; }
    body { margin: 0; font-family: system-ui, -apple-system, Segoe UI, Roboto, sans-serif; background: var(--bg); color: var(--text); line-height: 1.5; }
    a { color: inherit; text-decoration: none; }
    header { border-bottom: 1px solid var(--border); background: rgba(255,255,255,.92); position: sticky; top: 0; backdrop-filter: blur(8px); z-index: 10; }
    .wrap { max-width: 1100px; margin: 0 auto; padding: 0 1rem; }
    .bar { display: flex; flex-wrap: wrap; align-items: center; justify-content: space-between; gap: .75rem; padding: .85rem 0; }
    .brand { display: flex; align-items: center; gap: .65rem; font-weight: 700; color: var(--primary); }
    .logo { width: 40px; height: 40px; border-radius: 12px; display: grid; place-items: center; color: #fff; font-size: 12px; font-weight: 800; background: linear-gradient(145deg, ${content.logo?.bgFrom || content.primaryColor}, ${content.logo?.bgTo || content.secondaryColor || "#0a1628"}); position: relative; }
    .logo span.emoji { position: absolute; top: -4px; right: -4px; font-size: 14px; }
    nav { display: flex; flex-wrap: wrap; gap: .25rem; font-size: .9rem; font-weight: 600; }
    nav a { padding: .4rem .7rem; border-radius: 8px; }
    nav a.active, nav a:hover { background: #f1f5f9; }
    .hero { color: #fff; padding: 3.5rem 1rem; background: linear-gradient(135deg, ${content.logo?.bgFrom || content.primaryColor}, ${content.primaryColor || "#0d9488"}, ${content.logo?.bgTo || content.secondaryColor || "#0a1628"}); }
    .hero h1 { margin: .75rem 0 0; font-size: clamp(1.75rem, 4vw, 2.75rem); max-width: 20ch; }
    .hero p { max-width: 40ch; opacity: .92; }
    .badge { display: inline-flex; gap: .4rem; align-items: center; background: rgba(255,255,255,.15); padding: .25rem .7rem; border-radius: 999px; font-size: .75rem; font-weight: 700; letter-spacing: .04em; text-transform: uppercase; }
    .btn { display: inline-flex; align-items: center; gap: .4rem; border-radius: 12px; padding: .75rem 1.1rem; font-weight: 700; font-size: .9rem; border: 0; cursor: pointer; }
    .btn-w { background: #fff; color: #0f172a; }
    .btn-g { background: rgba(255,255,255,.12); color: #fff; border: 1px solid rgba(255,255,255,.35); }
    .chips { display: flex; flex-wrap: wrap; gap: .5rem; padding: 1rem; border-bottom: 1px solid var(--border); background: #f8fafc; font-size: .8rem; }
    .chip { border: 1px solid var(--border); background: #fff; border-radius: 999px; padding: .3rem .7rem; color: var(--muted); }
    .section { padding: 2rem 1rem; }
    .grid { display: grid; gap: 1rem; grid-template-columns: repeat(auto-fill, minmax(240px, 1fr)); }
    .card { border: 1px solid var(--border); border-radius: 16px; overflow: hidden; background: var(--card); }
    .card-media { height: 140px; display: grid; place-items: center; font-size: 2.75rem; color: #fff; background: linear-gradient(145deg, ${content.logo?.bgFrom || content.primaryColor}dd, ${content.logo?.bgTo || "#0a1628"}); }
    .card body, .card .body { padding: 1rem; }
    .price { color: var(--accent); font-weight: 800; margin-top: .5rem; }
    .btn-primary { background: var(--primary); color: #fff; }
    .muted { color: var(--muted); font-size: .9rem; }
    .faq { border: 1px solid var(--border); border-radius: 12px; padding: 1rem; background: #fff; margin-bottom: .75rem; }
    footer { border-top: 1px solid var(--border); padding: 2rem 1rem; text-align: center; color: var(--muted); font-size: .8rem; }
    .list { list-style: none; padding: 0; }
    .list li { display: flex; gap: .5rem; margin: .75rem 0; }
    .highlights { display: grid; gap: .5rem; grid-template-columns: repeat(auto-fill, minmax(220px, 1fr)); }
    .highlights li { border: 1px solid var(--border); border-radius: 12px; padding: .75rem 1rem; background: #fff; font-size: .9rem; color: var(--muted); }
    .filters { display: flex; flex-wrap: wrap; gap: .4rem; margin: 1rem 0; }
    .filters button { border: 1px solid var(--border); background: #fff; border-radius: 999px; padding: .3rem .75rem; font-size: .8rem; cursor: pointer; }
    .filters button.on { background: var(--primary); color: #fff; border-color: transparent; }
  </style>
</head>
<body>
  <div id="app"></div>
  <script>
    const DATA = ${dataJson};
    const SLUG = ${JSON.stringify(slug)};

    function wa() {
      const raw = (DATA.whatsappNumber || DATA.contactPhone || "").replace(/\\D/g, "");
      if (raw.length < 10) return null;
      const n = raw.length === 10 ? "91" + raw : raw;
      return "https://wa.me/" + n + "?text=" + encodeURIComponent("Hi " + DATA.brandName + "! I saw your shop and want to order.");
    }

    function page() {
      const h = (location.hash || "#home").replace("#", "") || "home";
      if (["home","shop","about","faq","contact"].includes(h)) return h;
      return "home";
    }

    function nav(active) {
      return ["home","shop","about","faq","contact"].map(function(k) {
        const label = { home: "Home", shop: "Products", about: "About", faq: "Help", contact: "Contact" }[k];
        return '<a href="#' + k + '" class="' + (active === k ? "active" : "") + '">' + label + '</a>';
      }).join("");
    }

    function logo() {
      const L = DATA.logo || {};
      return '<div class="logo" style="background:linear-gradient(145deg,' + (L.bgFrom||DATA.primaryColor) + ',' + (L.bgTo||'#0a1628') + ')"><span class="emoji">' + (L.emoji||'🏪') + '</span>' + (L.initials || DATA.brandName.slice(0,2).toUpperCase()) + '</div>';
    }

    function productCard(p) {
      return '<article class="card"><div class="card-media">' + (p.emoji || "🛍️") + '</div><div class="body"><div class="muted" style="font-size:11px;text-transform:uppercase">' + escapeHtml(p.category||"") + '</div><strong>' + escapeHtml(p.name) + '</strong><div class="muted">' + escapeHtml(p.description||"") + '</div><div class="price">' + escapeHtml(p.price) + '</div></div></article>';
    }

    function escapeHtml(s) {
      return String(s||"").replace(/&/g,"&amp;").replace(/</g,"&lt;").replace(/>/g,"&gt;").replace(/"/g,"&quot;");
    }

    function render() {
      const p = page();
      const link = wa();
      let main = "";
      if (p === "home") {
        const featured = (DATA.products||[]).filter(function(x){return x.featured;}).concat(DATA.products||[]).filter(function(x,i,a){return a.findIndex(function(y){return y.id===x.id;})===i;}).slice(0,3);
        main = '<section class="hero"><div class="wrap"><div class="badge">' + (DATA.logo && DATA.logo.emoji ? DATA.logo.emoji + " " : "") + escapeHtml(DATA.logo && DATA.logo.badge ? DATA.logo.badge : DATA.city) + '</div><h1>' + escapeHtml(DATA.heroHeadline) + '</h1><p>' + escapeHtml(DATA.heroSubheadline) + '</p><div style="margin-top:1.25rem;display:flex;flex-wrap:wrap;gap:.6rem"><a class="btn btn-w" href="#shop">' + escapeHtml(DATA.ctaLabel||"See products") + '</a>' + (link ? '<a class="btn btn-g" href="' + link + '" target="_blank" rel="noopener">Order on WhatsApp</a>' : '') + '</div></div></section>'
          + ((DATA.trustBadges||[]).length ? '<div class="chips wrap">' + DATA.trustBadges.map(function(b){return '<span class="chip">' + escapeHtml(b) + '</span>';}).join("") + (DATA.openingHours ? '<span class="chip">' + escapeHtml(DATA.openingHours) + '</span>' : '') + '</div>' : '')
          + ((DATA.ownerHighlights||[]).length ? '<section class="section wrap"><h2>Why shop with us</h2><ul class="highlights">' + DATA.ownerHighlights.map(function(h){return '<li>✓ ' + escapeHtml(h) + '</li>';}).join("") + '</ul></section>' : '')
          + '<section class="section wrap"><h2>Popular picks</h2><div class="grid">' + featured.map(productCard).join("") + '</div></section>';
      } else if (p === "shop") {
        const cats = DATA.categories || [];
        main = '<section class="section wrap"><h1>Products</h1><p class="muted">' + escapeHtml(DATA.description) + '</p><div class="filters" id="filters"><button class="on" data-cat="">All</button>' + cats.map(function(c){return '<button data-cat="' + escapeHtml(c) + '">' + escapeHtml(c) + '</button>';}).join("") + '</div><div class="grid" id="plist">' + (DATA.products||[]).map(productCard).join("") + '</div></section>';
      } else if (p === "about") {
        main = '<section class="section wrap" style="max-width:720px"><h1>About ' + escapeHtml(DATA.brandName) + '</h1><div class="muted">' + (DATA.aboutHtml || "") + '</div>' + (DATA.languageNote ? '<p class="chip" style="margin-top:1rem;display:inline-block">' + escapeHtml(DATA.languageNote) + '</p>' : '') + '</section>';
      } else if (p === "faq") {
        main = '<section class="section wrap" style="max-width:720px"><h1>Help & FAQ</h1>' + (DATA.faqs||[]).map(function(f){return '<div class="faq"><strong>' + escapeHtml(f.question) + '</strong><p class="muted">' + escapeHtml(f.answer) + '</p></div>';}).join("") + '</section>';
      } else {
        main = '<section class="section wrap" style="max-width:720px"><h1>Contact</h1><p class="muted">Reach ' + escapeHtml(DATA.brandName) + ' in ' + escapeHtml(DATA.city) + '.</p><ul class="list">'
          + (DATA.contactEmail ? '<li>✉ <a href="mailto:' + escapeHtml(DATA.contactEmail) + '">' + escapeHtml(DATA.contactEmail) + '</a></li>' : '')
          + (DATA.contactPhone ? '<li>☎ <a href="tel:' + escapeHtml(DATA.contactPhone) + '">' + escapeHtml(DATA.contactPhone) + '</a></li>' : '')
          + (link ? '<li><a class="btn btn-w" style="background:var(--accent);color:#fff" href="' + link + '" target="_blank" rel="noopener">Chat on WhatsApp</a></li>' : '')
          + (DATA.address ? '<li>📍 ' + escapeHtml(DATA.address) + '</li>' : '')
          + (DATA.openingHours ? '<li>🕒 ' + escapeHtml(DATA.openingHours) + '</li>' : '')
          + '</ul></section>';
      }

      document.getElementById("app").innerHTML =
        '<header><div class="wrap bar"><a class="brand" href="#home">' + logo() + '<span>' + escapeHtml(DATA.brandName) + '<div class="muted" style="font-weight:500;font-size:11px">' + escapeHtml(DATA.city) + '</div></span></a><nav>' + nav(p) + '</nav></div></header>'
        + main
        + '<footer><div>' + escapeHtml(DATA.footerNote || "") + '</div><div style="margin-top:.5rem">Built with Verlin Labs App Builder · ' + escapeHtml(SLUG) + '</div></footer>';

      if (p === "shop") {
        const filters = document.getElementById("filters");
        const plist = document.getElementById("plist");
        if (filters && plist) {
          filters.addEventListener("click", function(e) {
            const t = e.target;
            if (!t || !t.getAttribute) return;
            const cat = t.getAttribute("data-cat");
            if (cat === null) return;
            Array.prototype.forEach.call(filters.querySelectorAll("button"), function(b){ b.classList.remove("on"); });
            t.classList.add("on");
            const list = (DATA.products||[]).filter(function(pr){ return !cat || pr.category === cat; });
            plist.innerHTML = list.map(productCard).join("");
          });
        }
      }
    }

    window.addEventListener("hashchange", render);
    render();
  </script>
</body>
</html>
`;

  return {
    "index.html": html,
  };
}
