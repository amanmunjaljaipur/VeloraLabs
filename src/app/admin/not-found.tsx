import Link from "next/link";

export default function AdminNotFound() {
  return (
    <div className="mx-auto max-w-lg rounded-2xl border border-border bg-card p-8 text-center">
      <p className="text-sm font-medium uppercase tracking-wider text-teal">Admin</p>
      <h1 className="mt-2 text-2xl font-semibold text-foreground">Page not found</h1>
      <p className="mt-3 text-sm text-text-secondary">
        This admin page does not exist. Use the sidebar to open CRM, analytics, course training, or
        other admin tools.
      </p>
      <div className="mt-6 flex flex-wrap justify-center gap-3">
        <Link
          href="/admin"
          className="rounded-xl bg-teal px-4 py-2 text-sm font-medium text-white hover:bg-teal/90"
        >
          Admin home
        </Link>
        <Link
          href="/admin/chatbot-training"
          className="rounded-xl border border-border px-4 py-2 text-sm font-medium text-foreground hover:bg-muted"
        >
          Chatbot training
        </Link>
      </div>
    </div>
  );
}