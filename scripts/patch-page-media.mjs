import fs from "fs";

const map = {
  "src/app/about/page.tsx": {
    image: "/images/brand-journey.jpg",
    video: "/videos/about.mp4",
  },
  "src/app/courses/page.tsx": {
    image: "/images/hq-courses.jpg",
    video: "/videos/courses.mp4",
  },
  "src/app/library/LibraryClient.tsx": {
    image: "/images/brand-mental-models.jpg",
    video: "/videos/library.mp4",
  },
  "src/app/programs/page.tsx": {
    image: "/images/hq-programs.jpg",
    video: "/videos/programs.mp4",
  },
  "src/app/corporate/page.tsx": {
    image: "/images/brand-hands-on.jpg",
    video: "/videos/corporate.mp4",
  },
  "src/app/faq/page.tsx": {
    image: "/images/brand-free-session.jpg",
    video: "/videos/faq.mp4",
  },
  "src/app/mental-models/page.tsx": {
    image: "/images/hq-mental-hub.jpg",
    video: "/videos/mental-models-hub.mp4",
  },
  "src/app/testimonials/page.tsx": {
    image: "/images/hq-testimonials.jpg",
    video: "/videos/testimonials.mp4",
  },
};

for (const [file, m] of Object.entries(map)) {
  let t = fs.readFileSync(file, "utf8");
  t = t.replace(/image="[^"]+"/, `image="${m.image}"`);
  t = t.replace(/video="[^"]+"/, `video="${m.video}"`);
  fs.writeFileSync(file, t);
  console.log("patched", file);
}
