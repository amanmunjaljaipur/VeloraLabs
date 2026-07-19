import fs from "fs";
import path from "path";

const re = /["'](\/videos\/[^"']+)["']/g;
const map = new Map();

function walk(dir) {
  for (const ent of fs.readdirSync(dir, { withFileTypes: true })) {
    if (["node_modules", ".next", ".git"].includes(ent.name)) continue;
    const p = path.join(dir, ent.name);
    if (ent.isDirectory()) walk(p);
    else if (/\.(tsx?|json)$/.test(ent.name)) {
      const t = fs.readFileSync(p, "utf8");
      let m;
      while ((m = re.exec(t))) {
        if (!map.has(m[1])) map.set(m[1], []);
        map.get(m[1]).push(p.replace(/\\/g, "/"));
      }
    }
  }
}

walk("src");
walk("content");

for (const [v, files] of [...map.entries()].sort()) {
  const uniq = [...new Set(files)];
  console.log((uniq.length > 1 ? "MULTI " : "ok    ") + v);
  if (uniq.length > 1) uniq.forEach((f) => console.log("   ", f));
}

const j = JSON.parse(
  fs.readFileSync("content/home-content.json", "utf8").replace(/^\uFEFF/, "")
);
j.hero.video = "/videos/hero-neural.mp4";
j.howItWorksIllustration = {
  src: "/images/brand-journey.jpg",
  alt: "Learning journey",
  video: "/videos/journey.mp4",
};
j.learningIllustrations = {
  mentalModels: {
    src: "/images/brand-mental-models.jpg",
    alt: "Mental models",
    video: "/videos/mental-models.mp4",
  },
  handsOn: {
    src: "/images/brand-hands-on.jpg",
    alt: "Hands-on building",
    video: "/videos/hands-on.mp4",
  },
};
j.freeSessionIllustration = {
  src: "/images/brand-free-session.jpg",
  alt: "Free session",
  video: "/videos/free-session.mp4",
};
fs.writeFileSync("content/home-content.json", JSON.stringify(j, null, 2) + "\n");
console.log("cms updated");
