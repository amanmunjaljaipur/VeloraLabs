"use client";

import { useState } from "react";

export function AppAuthScreens({
  slug,
  brandName,
  accent,
  mode,
  onSuccess,
  onSwitch,
}: {
  slug: string;
  brandName: string;
  accent: string;
  mode: "login" | "signup";
  onSuccess: () => void;
  onSwitch: (mode: "login" | "signup") => void;
}) {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [name, setName] = useState("");
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    setBusy(true);
    try {
      const url =
        mode === "login"
          ? `/api/apps/${slug}/auth/login`
          : `/api/apps/${slug}/auth/signup`;
      const res = await fetch(url, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(
          mode === "login" ? { email, password } : { email, password, name }
        ),
      });
      const data = (await res.json()) as { error?: string };
      if (!res.ok) {
        setError(data.error || "Something went wrong");
        return;
      }
      onSuccess();
    } catch {
      setError("Network error — try again");
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="mx-auto flex min-h-[70vh] max-w-md flex-col justify-center px-4 py-12">
      <div className="rounded-2xl border border-border bg-card p-6 shadow-sm">
        <p className="text-xs font-semibold uppercase tracking-wide text-text-muted">
          {brandName}
        </p>
        <h1 className="mt-1 text-2xl font-semibold tracking-tight">
          {mode === "login" ? "Sign in to this shop" : "Create your shop account"}
        </h1>
        <p className="mt-2 text-sm text-text-secondary">
          This login is only for <strong>{brandName}</strong>. It is separate from any other website
          account.
        </p>

        <form onSubmit={(e) => void submit(e)} className="mt-6 space-y-4">
          {mode === "signup" ? (
            <label className="block text-sm">
              <span className="mb-1 block text-xs font-medium text-text-secondary">Your name</span>
              <input
                required
                value={name}
                onChange={(e) => setName(e.target.value)}
                className="w-full rounded-xl border border-border bg-background px-3 py-2.5"
                placeholder="e.g. Meera"
              />
            </label>
          ) : null}
          <label className="block text-sm">
            <span className="mb-1 block text-xs font-medium text-text-secondary">Email</span>
            <input
              required
              type="email"
              autoComplete="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="w-full rounded-xl border border-border bg-background px-3 py-2.5"
            />
          </label>
          <label className="block text-sm">
            <span className="mb-1 block text-xs font-medium text-text-secondary">Password</span>
            <input
              required
              type="password"
              autoComplete={mode === "login" ? "current-password" : "new-password"}
              minLength={8}
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="w-full rounded-xl border border-border bg-background px-3 py-2.5"
            />
            {mode === "signup" ? (
              <span className="mt-1 block text-[11px] text-text-muted">At least 8 characters</span>
            ) : null}
          </label>

          {error ? <p className="text-sm text-red-600">{error}</p> : null}

          <button
            type="submit"
            disabled={busy}
            className="w-full rounded-xl py-2.5 text-sm font-semibold text-white disabled:opacity-60"
            style={{ background: accent }}
          >
            {busy ? "Please wait…" : mode === "login" ? "Sign in" : "Create account"}
          </button>
        </form>

        <p className="mt-5 text-center text-sm text-text-secondary">
          {mode === "login" ? (
            <>
              New here?{" "}
              <button type="button" className="font-semibold underline" style={{ color: accent }} onClick={() => onSwitch("signup")}>
                Create an account
              </button>
            </>
          ) : (
            <>
              Already have an account?{" "}
              <button type="button" className="font-semibold underline" style={{ color: accent }} onClick={() => onSwitch("login")}>
                Sign in
              </button>
            </>
          )}
        </p>

        {mode === "signup" ? (
          <p className="mt-4 rounded-xl bg-muted/40 p-3 text-xs text-text-secondary">
            New shoppers get the <strong>Customer</strong> role by default. If you are the shop owner,
            use the same email you used when this shop was created — you will get <strong>Owner</strong>{" "}
            access.
          </p>
        ) : null}
      </div>
    </div>
  );
}
