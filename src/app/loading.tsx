import { PageLoader } from "@/components/ui/PageLoader";

export default function RootLoading() {
  return (
    <div className="container-verlin">
      <PageLoader message="Loading Verlin Labs…" />
    </div>
  );
}
