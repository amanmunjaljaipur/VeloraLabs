"use client";

import { GoogleBrandButton } from "@/components/auth/GoogleBrandButton";
import { Alert } from "@/components/ui/Alert";
import { Badge } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/Card";
import { DURATION, EASE_OUT, HOVER } from "@/lib/motion";
import { cn } from "@/lib/utils";
import { motion, useReducedMotion } from "framer-motion";
import { Check, HardDrive } from "lucide-react";
import { useState } from "react";

export interface DriveStatusInfo {
  configured: boolean;
  connected: boolean;
  connectedAt: string | null;
  credentialSource?: "drive_specific" | "login_shared" | "none";
  missingEnv?: string[];
  redirectUri?: string;
  connectUrl?: string;
  setupSteps?: string[];
}

/**
 * Google Drive connector — standard white Google brand button (same as login).
 * OAuth uses GOOGLE_CLIENT_ID / SECRET from site login when Drive-specific keys are unset.
 */
export function DriveConnectorCard({
  driveStatus,
  onDisconnect,
  compact,
}: {
  driveStatus: DriveStatusInfo | null;
  onDisconnect: () => void | Promise<void>;
  compact?: boolean;
}) {
  const reduce = useReducedMotion();
  const [busy, setBusy] = useState(false);
  const connected = Boolean(driveStatus?.connected);
  const configured = Boolean(driveStatus?.configured);
  const connectHref = driveStatus?.connectUrl ?? "/api/avatar-studio/storage/drive/connect";

  async function disconnect() {
    setBusy(true);
    try {
      await onDisconnect();
    } finally {
      setBusy(false);
    }
  }

  function handleConnectClick(e: React.MouseEvent) {
    if (!configured) {
      e.preventDefault();
      return;
    }
    // Full navigation so OAuth redirect works reliably
  }

  return (
    <motion.div
      initial={reduce ? false : { opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: DURATION.reveal, ease: EASE_OUT }}
    >
      <Card flush className={cn(connected && "border-accent-teal/40")}>
        <CardHeader className={compact ? "p-4 pb-0" : undefined}>
          <CardTitle className="flex items-center gap-2 text-base">
            <HardDrive className="size-5 text-accent-teal" />
            Save files to Google Drive
          </CardTitle>
          <CardDescription>
            Same Google account as Verlin Labs login. Samples and videos go into{" "}
            <em>Verlin Labs Avatar Studio</em> on your Drive (only files this app creates).
          </CardDescription>
        </CardHeader>
        <CardContent className={cn("gap-3", compact && "p-4")}>
          {connected ? (
            <motion.div
              className="flex flex-wrap items-center justify-between gap-3 rounded-xl border border-accent-teal/30 bg-accent-teal/10 p-4"
              whileHover={reduce ? undefined : { y: HOVER.cardLift }}
              transition={{ duration: DURATION.hover }}
            >
              <div className="flex items-center gap-3">
                <div className="flex size-11 items-center justify-center rounded-full bg-card shadow-sm">
                  <Check className="size-5 text-accent-teal" />
                </div>
                <div>
                  <p className="font-medium text-foreground">Google Drive connected</p>
                  <p className="text-xs text-text-secondary">
                    {driveStatus?.connectedAt
                      ? `Since ${new Date(driveStatus.connectedAt).toLocaleDateString()}`
                      : "Active"}
                    {driveStatus?.credentialSource === "login_shared" ? " · same Google as login" : null}
                  </p>
                  <Badge variant="success" className="mt-1">
                    Uploads go to your Drive
                  </Badge>
                </div>
              </div>
              <Button variant="secondary" size="sm" loading={busy} onClick={() => void disconnect()}>
                Disconnect
              </Button>
            </motion.div>
          ) : (
            <div className="flex flex-col gap-3">
              {configured ? (
                <motion.a
                  href={connectHref}
                  className="block w-full sm:max-w-md"
                  whileHover={reduce ? undefined : { scale: 1.01, y: -1 }}
                  whileTap={reduce ? undefined : { scale: 0.98 }}
                  transition={{ duration: DURATION.hover, ease: EASE_OUT }}
                  onClick={handleConnectClick}
                >
                  <GoogleBrandButton type="button" label="Connect with Google" size="lg" />
                </motion.a>
              ) : (
                <div className="w-full sm:max-w-md opacity-90">
                  <GoogleBrandButton type="button" label="Connect with Google" size="lg" disabled />
                </div>
              )}
              <p className="text-xs text-text-secondary">
                Google will ask to allow Drive file access → Allow → you return here automatically.
              </p>
              {!configured ? (
                <Alert variant="warning" title="Google OAuth keys missing on this server">
                  <div className="flex flex-col gap-2 text-sm">
                    <p>
                      Drive reuses the same keys as Google login. Your local{" "}
                      <code className="text-xs">.env.local</code> has empty{" "}
                      <code className="text-xs">GOOGLE_CLIENT_ID</code> /{" "}
                      <code className="text-xs">GOOGLE_CLIENT_SECRET</code>.
                    </p>
                    <ol className="list-decimal space-y-1 pl-4">
                      <li>
                        Vercel → Project → Settings → Environment Variables → copy{" "}
                        <strong>GOOGLE_CLIENT_ID</strong> and <strong>GOOGLE_CLIENT_SECRET</strong>{" "}
                        (Production values).
                      </li>
                      <li>
                        Paste them into <code className="text-xs">.env.local</code> (no empty quotes), e.g.
                        <code className="mt-1 block break-all rounded bg-muted px-2 py-1 text-xs">
                          GOOGLE_CLIENT_ID=xxxx.apps.googleusercontent.com
                          <br />
                          GOOGLE_CLIENT_SECRET=GOCSPX-xxxx
                          <br />
                          AUTH_URL=http://localhost:3000
                        </code>
                      </li>
                      <li>
                        Restart <code className="text-xs">npm run dev</code>.
                      </li>
                      <li>
                        Google Cloud → OAuth Web client → Authorized redirect URIs → add:
                        <code className="mt-1 block break-all rounded bg-muted px-2 py-1 text-xs">
                          {driveStatus?.redirectUri ??
                            "http://localhost:3000/api/avatar-studio/storage/drive/callback"}
                        </code>
                      </li>
                      <li>Enable the Google Drive API on that project.</li>
                    </ol>
                    {driveStatus?.missingEnv && driveStatus.missingEnv.length > 0 ? (
                      <p className="text-xs font-medium text-amber-800 dark:text-amber-200">
                        Missing: {driveStatus.missingEnv.join(", ")}
                      </p>
                    ) : null}
                  </div>
                </Alert>
              ) : (
                <p className="text-xs text-text-secondary">
                  Using login Google client
                  {driveStatus?.credentialSource === "login_shared" ? " ✓" : ""}. If connect fails with a
                  redirect error, add the Drive callback URI in Google Cloud Console.
                </p>
              )}
            </div>
          )}
        </CardContent>
      </Card>
    </motion.div>
  );
}
