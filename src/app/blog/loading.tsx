import { PageLoader } from "@/components/ui/PageLoader";

export default function BlogLoading() {
  return (
    <div className="container-verlin py-10">
      <PageLoader message="Loading articles…" variant="page" />
    </div>
  );
}
