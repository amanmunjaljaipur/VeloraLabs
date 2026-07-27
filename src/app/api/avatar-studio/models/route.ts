import { auth } from "@/auth";
import { listModels, type ModelKind } from "@/lib/avatar-studio/model-catalog";
import { getPublicFreemiumPlan } from "@/lib/avatar-studio/freemium";
import { getPublicUserSettings } from "@/lib/avatar-studio/user-settings-store";
import { NextRequest, NextResponse } from "next/server";

export const runtime = "nodejs";

export async function GET(req: NextRequest) {
  const session = await auth();
  if (!session?.user?.email) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const kindParam = req.nextUrl.searchParams.get("kind");
  const kind = kindParam === "voice" || kindParam === "avatar" ? (kindParam as ModelKind) : undefined;

  const [models, settings] = await Promise.all([listModels(kind), getPublicUserSettings(session.user.email)]);
  const freemium = getPublicFreemiumPlan();

  // Annotate each model with freemium availability for the UI.
  const annotated = models.map((m) => {
    const envSet = Boolean(process.env[m.endpointEnvVar]);
    const userCustom =
      m.kind === "voice"
        ? settings.voiceMode === "custom_url" && settings.customVoiceReady
        : settings.avatarMode === "custom_url" && settings.customAvatarReady;
    const freeReady = m.freeTierFallback || !envSet;
    return {
      ...m,
      availability: {
        freePath: freeReady,
        customOrEnvHost: envSet || userCustom,
        recommended: m.freeTierFallback,
      },
    };
  });

  return NextResponse.json({ models: annotated, freemium, settings });
}
