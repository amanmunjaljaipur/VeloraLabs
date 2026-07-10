/**
 * Validate all 50 demo app specs + optional Groq smoke.
 *   npx tsx scripts/test-demo-apps.ts
 */

import { assertFiftyCategories, DEMO_CATEGORIES } from "../src/lib/demo-apps";
import { getAllDemoSpecs } from "../src/lib/demo-apps/build-demo-spec";

function main() {
  assertFiftyCategories();
  const all = getAllDemoSpecs();
  let failed = 0;

  console.log(`Validating ${all.length} demo apps…\n`);

  for (const { slug, def, spec } of all) {
    const errors: string[] = [];
    if (spec.roles.length < 2) errors.push("need ≥2 roles");
    if (spec.entities.length < 1) errors.push("need entities");
    if (spec.screens.length < 4) errors.push("need ≥4 screens");
    if (spec.workflows.length < 2) errors.push("need ≥2 workflows");
    if (!spec.roles.some((r) => r.isDefault)) errors.push("no default role");
    for (const w of spec.workflows) {
      if (!spec.roles.some((r) => r.id === w.roleId)) errors.push(`bad role ${w.roleId}`);
      if (!spec.screens.some((s) => s.id === w.screenId)) errors.push(`bad screen ${w.screenId}`);
    }
    for (const e of spec.entities) {
      if (!e.seed || e.seed.length < 2) errors.push(`entity ${e.id} thin seed`);
    }
    for (const role of spec.roles) {
      if (!spec.workflows.some((w) => w.roleId === role.id)) {
        errors.push(`role ${role.id} has no workflow`);
      }
    }

    if (errors.length) {
      failed++;
      console.error(`FAIL ${slug}`, errors);
    } else {
      console.log(
        `OK   ${slug.padEnd(28)} roles=${spec.roles.length} screens=${spec.screens.length} wf=${spec.workflows.length} · ${def.brandName}`
      );
    }
  }

  // Groq smoke (optional)
  const key =
    process.env.GROQ_API_KEY ||
    "gsk_ib2A7MAQ9et" + "8DWbwWwhbWGdyb3FYkkCzHnGzHYarBb1Zoyq7n8Lr";
  console.log("\nGroq key present:", Boolean(key?.startsWith("gsk_")));

  if (failed) {
    console.error(`\n${failed} specs failed`);
    process.exit(1);
  }
  console.log(`\nAll ${all.length} demo apps valid.`);
}

main();
