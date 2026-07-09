import { BlogStudio } from "@/components/admin/BlogStudio";
import { createMetadata } from "@/lib/seo";

export const metadata = createMetadata({
  title: "Blog Studio",
  description: "Schedule and generate Verlin Labs blog posts with Gen AI.",
  path: "/admin/blog",
});

export default function AdminBlogPage() {
  return <BlogStudio />;
}
