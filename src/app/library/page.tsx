import { getLearnContentLastUpdated, getLibraryItems } from "@/lib/content";
import { staticPageMetadata } from "@/lib/page-metadata";
import { LibraryClient } from "./LibraryClient";

export const metadata = staticPageMetadata("library", "/library");

export default function LibraryPage() {
  const items = getLibraryItems();
  const lastUpdated = getLearnContentLastUpdated();
  return <LibraryClient items={items} lastUpdated={lastUpdated} />;
}