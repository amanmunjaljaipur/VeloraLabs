import { getLibraryItems } from "@/lib/content";
import { LibraryClient } from "./LibraryClient";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Content Library",
  description: "Explore articles, guides, and workshops on AI and technology.",
};

export default function LibraryPage() {
  const items = getLibraryItems();
  return <LibraryClient items={items} />;
}