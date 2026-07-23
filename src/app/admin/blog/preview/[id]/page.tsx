import { LibraryArticle } from "@/components/sections/LibraryArticle";
import { blogPostToLibraryItem, getBlogPost } from "@/lib/blog/store";
import { auth } from "@/auth";
import { isHardcodedSuperAdmin } from "@/lib/roles";
import { createMetadata } from "@/lib/seo";
import { EyeOff } from "lucide-react";
import { notFound, redirect } from "next/navigation";

export const dynamic = "force-dynamic";

export const metadata = createMetadata({
  title: "Blog Preview",
  description: "Admin-only preview of an unpublished blog post.",
  path: "/admin/blog/preview",
  noIndex: true,
});

type Ctx = { params: Promise<{ id: string }> };

export default async function BlogPreviewPage({ params }: Ctx) {
  const session = await auth();
  if (!session?.user) {
    redirect("/login?callbackUrl=/admin/blog");
  }
  const isAdmin =
    session.user.role === "admin" ||
    session.user.role === "super_admin" ||
    isHardcodedSuperAdmin(session.user.email);
  if (!isAdmin) {
    redirect("/admin/blog");
  }

  const { id } = await params;
  const post = await getBlogPost(id);
  if (!post) notFound();

  const item = blogPostToLibraryItem(post);

  return (
    <>
      <div className="sticky top-0 z-40 flex items-center gap-2 border-b border-amber-300 bg-amber-100 px-4 py-3 text-sm font-medium text-amber-900 dark:border-amber-800 dark:bg-amber-950/60 dark:text-amber-200">
        <EyeOff className="h-4 w-4 shrink-0" />
        Admin preview - status: <span className="font-semibold uppercase">{post.status}</span>.
        This page is not public and is not indexed. It shows exactly how the
        article will render once published at /blog/{post.slug}.
      </div>
      <LibraryArticle item={item} basePath="/blog" />
    </>
  );
}
