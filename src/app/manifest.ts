import type { MetadataRoute } from "next";

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: "Verlin Labs",
    short_name: "Verlin Labs",
    description:
      "Clarity-first AI learning through mental models, live sessions, and hands-on programs.",
    start_url: "/",
    display: "standalone",
    background_color: "#ffffff",
    theme_color: "#0d4f4f",
    icons: [
      {
        src: "/favicon.ico",
        sizes: "48x48",
        type: "image/x-icon",
      },
      {
        src: "/images/hero-side.jpg",
        sizes: "1200x630",
        type: "image/jpeg",
        purpose: "any",
      },
    ],
  };
}