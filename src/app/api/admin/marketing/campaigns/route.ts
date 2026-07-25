import { requireCmsEditor } from "@/lib/cms/admin-auth";
import { createAdCampaign, listAdCampaigns, type CampaignObjective } from "@/lib/marketing/ad-campaigns-store";
import { resolveTenantId } from "@/lib/marketing/tenant-context";
import type { AdsPlatform } from "@/lib/marketing/ad-accounts-store";
import { NextRequest, NextResponse } from "next/server";

export const runtime = "nodejs";

const VALID_PLATFORMS: AdsPlatform[] = ["meta", "linkedin", "x"];
const VALID_OBJECTIVES: CampaignObjective[] = ["awareness", "traffic", "engagement", "leads", "conversions"];

export async function GET() {
  const session = await requireCmsEditor();
  if (!session) return NextResponse.json({ error: "Forbidden" }, { status: 403 });

  const tenantId = await resolveTenantId(session.user?.email);
  const campaigns = await listAdCampaigns(tenantId);
  return NextResponse.json({ campaigns });
}

/** Creates a campaign as a draft - no platform API calls happen here, so this never spends anything. */
export async function POST(req: NextRequest) {
  const session = await requireCmsEditor();
  if (!session) return NextResponse.json({ error: "Forbidden" }, { status: 403 });

  const body = await req.json().catch(() => null);
  const platform = body?.platform as string | undefined;
  const name = typeof body?.name === "string" ? body.name.trim() : "";
  const objective = body?.objective as string | undefined;

  if (!platform || !VALID_PLATFORMS.includes(platform as AdsPlatform)) {
    return NextResponse.json({ error: "platform must be meta, linkedin, or x" }, { status: 400 });
  }
  if (!name || name.length > 200) {
    return NextResponse.json({ error: "Give the campaign a name (1-200 characters)" }, { status: 400 });
  }
  if (!objective || !VALID_OBJECTIVES.includes(objective as CampaignObjective)) {
    return NextResponse.json({ error: "objective must be awareness, traffic, engagement, leads, or conversions" }, { status: 400 });
  }

  const budgetAmount = Number(body?.budget?.amount);
  if (!Number.isFinite(budgetAmount) || budgetAmount <= 0) {
    return NextResponse.json({ error: "Enter a budget amount greater than 0" }, { status: 400 });
  }
  const budgetType = body?.budget?.type === "lifetime" ? "lifetime" : "daily";

  const startDate = typeof body?.schedule?.startDate === "string" ? body.schedule.startDate : "";
  if (!startDate || Number.isNaN(new Date(startDate).getTime())) {
    return NextResponse.json({ error: "Enter a valid start date" }, { status: 400 });
  }
  const endDate =
    typeof body?.schedule?.endDate === "string" && body.schedule.endDate && !Number.isNaN(new Date(body.schedule.endDate).getTime())
      ? body.schedule.endDate
      : null;

  const creativeBody = typeof body?.creative?.body === "string" ? body.creative.body.trim() : "";
  if (!creativeBody || creativeBody.length > 3000) {
    return NextResponse.json({ error: "Write the ad copy (1-3000 characters)" }, { status: 400 });
  }

  const tenantId = await resolveTenantId(session.user?.email);
  const campaign = await createAdCampaign({
    tenantId,
    platform: platform as AdsPlatform,
    name,
    objective: objective as CampaignObjective,
    budget: {
      type: budgetType,
      amount: budgetAmount,
      currency: typeof body?.budget?.currency === "string" ? body.budget.currency : "USD",
    },
    schedule: { startDate, endDate },
    targeting: {
      locations: Array.isArray(body?.targeting?.locations) ? body.targeting.locations.filter((l: unknown) => typeof l === "string") : [],
      ageMin: Number.isFinite(Number(body?.targeting?.ageMin)) ? Number(body.targeting.ageMin) : 18,
      ageMax: Number.isFinite(Number(body?.targeting?.ageMax)) ? Number(body.targeting.ageMax) : 65,
      genders: ["all", "male", "female"].includes(body?.targeting?.genders) ? body.targeting.genders : "all",
      interests: Array.isArray(body?.targeting?.interests) ? body.targeting.interests.filter((i: unknown) => typeof i === "string") : [],
    },
    creative: {
      headline: typeof body?.creative?.headline === "string" ? body.creative.headline.slice(0, 200) : "",
      body: creativeBody,
      imageUrl: typeof body?.creative?.imageUrl === "string" && body.creative.imageUrl ? body.creative.imageUrl : null,
      linkUrl: typeof body?.creative?.linkUrl === "string" ? body.creative.linkUrl : "",
      callToAction: typeof body?.creative?.callToAction === "string" ? body.creative.callToAction : "LEARN_MORE",
    },
    createdBy: session.user?.email ?? "unknown",
  });

  return NextResponse.json({ campaign });
}
