import { getArticleAuthor } from "@/lib/article-author";
import { OptimizedImage } from "@/components/ui/OptimizedImage";
import Link from "next/link";
import { ExternalLink } from "lucide-react";

export function AuthorByline() {
  const author = getArticleAuthor();

  return (
    <aside className="mt-6 rounded-2xl border border-border bg-card p-5 shadow-sm">
      <p className="text-xs font-semibold uppercase tracking-wider text-teal">Written by</p>
      <div className="mt-4 flex gap-4">
        <div className="relative h-16 w-16 shrink-0 overflow-hidden rounded-xl border border-accent-teal/20">
          <OptimizedImage
            src={author.image}
            alt={author.imageAlt}
            fill
            className="object-cover object-top"
            sizes="64px"
          />
        </div>
        <div className="min-w-0 flex-1">
          <p className="text-lg font-semibold text-foreground">
            <Link href={author.profileUrl} className="hover:text-teal hover:underline">
              {author.name}
            </Link>
          </p>
          <p className="text-sm font-medium text-accent-teal">{author.title}</p>
          <p className="mt-2 text-sm leading-relaxed text-text-secondary">{author.bio}</p>
          <div className="mt-3 flex flex-wrap gap-3 text-sm">
            <Link href={author.profileUrl} className="font-medium text-teal hover:underline">
              Full instructor bio →
            </Link>
            <a
              href={author.linkedin}
              target="_blank"
              rel="noopener noreferrer author"
              className="inline-flex items-center gap-1 font-medium text-foreground/80 hover:text-teal"
            >
              LinkedIn
              <ExternalLink className="h-3.5 w-3.5" aria-hidden />
            </a>
          </div>
        </div>
      </div>
    </aside>
  );
}