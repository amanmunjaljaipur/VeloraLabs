import type { VideoBlockProps } from "@/lib/cms/page-builder-types";

function extractYouTubeId(url: string): string | null {
  if (!url) return null;
  const trimmed = url.trim();
  if (/^[\w-]{11}$/.test(trimmed)) return trimmed;

  try {
    const parsed = new URL(trimmed);
    if (parsed.hostname.includes("youtu.be")) {
      return parsed.pathname.replace("/", "") || null;
    }
    if (parsed.hostname.includes("youtube.com")) {
      const v = parsed.searchParams.get("v");
      if (v) return v;
      const embed = parsed.pathname.match(/\/embed\/([^/]+)/);
      if (embed?.[1]) return embed[1];
    }
  } catch {
    return null;
  }
  return null;
}

export function VideoBlockView({ props }: { props: VideoBlockProps }) {
  const id = extractYouTubeId(props.url);
  if (!id) {
    return (
      <section className="container-verlin py-8">
        <div className="rounded-xl border border-dashed border-border p-6 text-center text-sm text-text-secondary">
          Add a valid YouTube URL in the component properties.
        </div>
      </section>
    );
  }

  const title = props.title?.trim() || "Embedded video";

  return (
    <section className="container-verlin py-8 md:py-12">
      <figure className="mx-auto max-w-4xl">
        <div className="relative aspect-video overflow-hidden rounded-2xl border border-border bg-muted/40 shadow-sm">
          {/* Skeleton-like base while iframe paints */}
          <div className="absolute inset-0 animate-pulse bg-muted/60" aria-hidden="true" />
          <iframe
            src={`https://www.youtube-nocookie.com/embed/${id}`}
            title={title}
            className="relative z-[1] h-full w-full"
            allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
            allowFullScreen
            loading="lazy"
          />
        </div>
        {props.caption ? (
          <figcaption className="mt-3 text-center text-sm text-text-secondary">
            {props.caption}
          </figcaption>
        ) : null}
      </figure>
    </section>
  );
}
