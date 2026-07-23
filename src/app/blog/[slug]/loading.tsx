import { PageLoader } from "@/components/ui/PageLoader";

export default function BlogPostLoading() {
  return (
    <div className="container-verlin py-10">
      <PageLoader message="Loading article…" variant="page" />
    </div>
  );
}
