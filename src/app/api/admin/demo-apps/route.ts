import { requireCmsEditor } from "@/lib/cms/admin-auth";
import { DEMO_CATEGORIES } from "@/lib/demo-apps";
import { saveDemoAppCustomization } from "@/lib/demo-apps/customizations-store";
import { NextResponse } from "next/server";

export const runtime = "nodejs";

export async function GET() {
  const session = await requireCmsEditor();
  if (!session) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  // Return all 50 premiumized categories
  return NextResponse.json({
    categories: DEMO_CATEGORIES.map((c) => ({
      slug: c.slug,
      name: c.name,
      brandName: c.brandName,
      group: c.group,
      groupLabel: c.groupLabel,
      tagline: c.tagline,
      description: c.description,
      imageUrl: c.imageUrl,
      primaryColor: c.primaryColor,
      accentColor: c.accentColor,
      outcomes: c.learning?.outcomes || [],
      footerColumns: c.footerColumns || [],
      entities: c.entities.map((e) => ({
        id: e.id,
        name: e.name,
        namePlural: e.namePlural,
        seeds: e.seeds.map((s: any) => ({
          ...s,
          imageUrl: s.imageUrl || "",
        })),
      })),
      screens: c.modules.map((m) => ({
        id: m.id,
        title: m.title,
        description: m.description,
        imageUrl: m.imageUrl,
        type: m.type,
        entityId: m.entityId,
        roleIds: m.roleIds || [],
      })),
      productKind: c.productKind,
      roles: c.roles.map((r) => ({
        id: r.id,
        label: r.label,
        description: r.description,
        canCreate: r.canCreate !== false,
        canManage: Boolean(r.canManage),
        isDefault: Boolean(r.isDefault),
      })),
      workflows: c.workflows.map((w) => ({
        id: w.id,
        name: w.name,
        description: w.description,
        roleId: w.roleId,
        steps: w.steps,
        moduleId: w.moduleId,
        entityId: w.entityId,
      })),
    })),
  });
}

export async function PUT(request: Request) {
  const session = await requireCmsEditor();
  if (!session) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  let body: {
    slug: string;
    name?: string;
    brandName?: string;
    tagline?: string;
    description?: string;
    imageUrl?: string;
    primaryColor?: string;
    accentColor?: string;
    outcomes?: string[];
    footerColumns?: any[];
    entities?: Record<string, { seeds?: any[] }>;
    screens?: Record<
      string,
      {
        title?: string;
        description?: string;
        imageUrl?: string;
      }
    >;
  };

  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON body" }, { status: 400 });
  }

  if (!body.slug) {
    return NextResponse.json({ error: "Missing category slug" }, { status: 400 });
  }

  try {
    const overrides = await saveDemoAppCustomization(body.slug, {
      name: body.name,
      brandName: body.brandName,
      tagline: body.tagline,
      description: body.description,
      imageUrl: body.imageUrl,
      primaryColor: body.primaryColor,
      accentColor: body.accentColor,
      outcomes: body.outcomes,
      footerColumns: body.footerColumns,
      entities: body.entities,
      screens: body.screens,
    });

    return NextResponse.json({ ok: true, overrides });
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Failed to save customization" },
      { status: 500 }
    );
  }
}
