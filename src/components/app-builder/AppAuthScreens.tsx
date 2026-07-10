"use client";

import { GoogleAuthButton } from "@/components/auth/GoogleAuthButton";
import type { ShopLogo } from "@/lib/app-builder/types";
import { Store } from "lucide-react";
import { useSearchParams } from "next/navigation";
import { useMemo, useState } from "react";

export function AppAuthScreens({
  slug,
  brandName,
  city,
  tagline,
  logo,
  accent,
  mode,
  publicPath,
  onSuccess,
  onSwitch,
  onBrowseShop,
}: {
  slug: string;
  brandName: string;
  city?: string;
  tagline?: string;
  logo?: ShopLogo;
  accent: string;
  mode: "login" | "signup";
  publicPath?: string;
  onSuccess: () => void;
  onSwitch: (mode: "login" | "signup") => void;
  onBrowseShop?: () => void;
}) {
  const searchParams = useSearchParams();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [name, setName] = useState("");
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);

  const googleError = useMemo(() => {
    const e = searchParams?.get("error");
    if (!e) return "";
    if (e === "google") return "Google sign-in was cancelled or failed. Try again.";
    return decodeURIComponent(e);
  }, [searchParams]);

  const googleCallbackUrl = `/api/apps/${slug}/auth/google`;

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
    <div className="relative flex min-h-[calc(100vh-4rem)] flex-1 flex-col">
      {/* Full branded login — only this app, same base URL /apps/{slug}/login */}
      <div
        className="absolute inset-0 opacity-90"
        style={{
          background: `linear-gradient(145deg, ${logo?.bgFrom || accent}22 0%, ${logo?.bgTo || "#0a1628"}18 50%, transparent 100%)`,
        }}
      />
      <div
        className="relative mx-auto flex w-full max-w-md flex-1 flex-col justify-center px-4 py-12"
        data-tour="auth-form"
      >
        <div className="mb-6 flex flex-col items-center text-center">
          {logo?.imageUrl ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img
              src={logo.imageUrl}
              alt=""
              className="h-16 w-16 rounded-2xl object-cover shadow-lg"
            />
          ) : (
            <span
              className="flex h-16 w-16 items-center justify-center rounded-2xl text-lg font-bold text-white shadow-lg"
              style={{
                background: `linear-gradient(145deg, ${logo?.bgFrom || accent}, ${logo?.bgTo || "#0a1628"})`,
              }}
            >
              {logo?.initials || brandName.slice(0, 2).toUpperCase()}
            </span>
          )}
          <h1 className="mt-4 text-2xl font-semibold tracking-tight text-foreground">
            {brandName}
          </h1>
          {city ? <p className="mt-0.5 text-xs text-text-muted">{city}</p> : null}
          {tagline ? (
            <p className="mt-2 max-w-xs text-sm text-text-secondary">{tagline}</p>
          ) : null}
        </div>

        <div className="rounded-2xl border border-border bg-card p-6 shadow-lg">
          <p className="text-center text-xs font-semibold uppercase tracking-wide text-text-muted">
            App login only
          </p>
          <h2 className="mt-1 text-center text-lg font-semibold tracking-tight">
            {mode === "login" ? `Sign in to ${brandName}` : `Join ${brandName}`}
          </h2>
          <p className="mt-2 text-center text-sm text-text-secondary">
            This sign-in is <strong>only for this shop</strong>
            {publicPath ? (
              <>
                {" "}
                at <code className="text-[11px]">{publicPath}/login</code>
              </>
            ) : null}
            . It is not your Verlin Labs account.
          </p>

          {(error || googleError) ? (
            <p className="mt-3 text-center text-sm text-red-600">{error || googleError}</p>
          ) : null}

          <div className="mt-5">
            <GoogleAuthButton
              label={
                mode === "login"
                  ? "Continue with Google"
                  : "Sign up with Google"
              }
              callbackUrl={googleCallbackUrl}
              className="w-full"
            />
            <p className="mt-2 text-center text-[11px] text-text-muted">
              Uses the same Google login settings as Verlin Labs. Your Google email becomes your
              account for <strong>{brandName}</strong> only.
            </p>
          </div>

          <div className="relative my-5">
            <div className="absolute inset-0 flex items-center">
              <div className="w-full border-t border-border" />
            </div>
            <div className="relative flex justify-center text-xs">
              <span className="bg-card px-2 text-text-muted">or use email</span>
            </div>
          </div>

          <form onSubmit={(e) => void submit(e)} className="space-y-4">
            {mode === "signup" ? (
              <label className="block text-sm">
                <span className="mb-1 block text-xs font-medium text-text-secondary">Your name</span>
                <input
                  required
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className="w-full rounded-xl border border-border bg-background px-3 py-2.5"
                  placeholder="e.g. Meera"
                  autoComplete="name"
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

            <button
              type="submit"
              disabled={busy}
              className="w-full rounded-xl py-2.5 text-sm font-semibold text-white disabled:opacity-60"
              style={{ background: accent }}
            >
              {busy ? "Please wait…" : mode === "login" ? "Sign in with email" : "Create account with email"}
            </button>
          </form>

          <p className="mt-5 text-center text-sm text-text-secondary">
            {mode === "login" ? (
              <>
                New here?{" "}
                <button
                  type="button"
                  className="font-semibold underline"
                  style={{ color: accent }}
                  onClick={() => onSwitch("signup")}
                >
                  Create an account
                </button>
              </>
            ) : (
              <>
                Already have an account?{" "}
                <button
                  type="button"
                  className="font-semibold underline"
                  style={{ color: accent }}
                  onClick={() => onSwitch("login")}
                >
                  Sign in
                </button>
              </>
            )}
          </p>

          {mode === "signup" ? (
            <p className="mt-4 rounded-xl bg-muted/40 p-3 text-xs text-text-secondary">
              New shoppers get the <strong>Customer</strong> role. If you are the shop owner, use the
              same email you used when this shop was created — you will get <strong>Owner</strong>{" "}
              access.
            </p>
          ) : null}
        </div>

        {onBrowseShop ? (
          <button
            type="button"
            onClick={onBrowseShop}
            className="mt-6 inline-flex items-center justify-center gap-2 text-sm font-medium text-text-secondary hover:underline"
          >
            <Store className="h-4 w-4" />
            Browse the shop without signing in
          </button>
        ) : null}
      </div>
    </div>
  );
}
