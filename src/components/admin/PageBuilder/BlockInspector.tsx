"use client";

import { MediaPicker } from "@/components/admin/MediaPicker";
import { RichTextEditor } from "@/components/admin/RichTextEditor";
import type { PageBlock } from "@/lib/cms/page-builder-types";

interface BlockInspectorProps {
  block: PageBlock | null;
  onChange: (block: PageBlock) => void;
}

export function BlockInspector({ block, onChange }: BlockInspectorProps) {
  if (!block) {
    return (
      <div className="rounded-xl border border-dashed border-border p-6 text-sm text-text-secondary">
        Select a component on the canvas to edit its properties.
      </div>
    );
  }

  const current = block;

  function updateProp(key: string, value: unknown) {
    onChange({
      ...current,
      props: { ...current.props, [key]: value },
    } as PageBlock);
  }

  function updateArrayItem(index: number, field: string, value: unknown) {
    const props = current.props as { items?: Record<string, unknown>[] };
    if (!props.items) return;
    const items = props.items.map((item, i) =>
      i === index ? { ...item, [field]: value } : item
    );
    updateProp("items", items);
  }

  function removeArrayItem(index: number) {
    const props = current.props as { items?: unknown[] };
    if (!props.items) return;
    updateProp(
      "items",
      props.items.filter((_, i) => i !== index)
    );
  }

  const altWarning =
    (current.type === "hero" && current.props.image && !current.props.imageAlt?.trim()) ||
    (current.type === "image" && current.props.src && !current.props.alt?.trim()) ||
    (current.type === "split" && current.props.image && !current.props.imageAlt?.trim()) ||
    (current.type === "teaser" && current.props.image && !current.props.imageAlt?.trim());

  return (
    <div className="max-h-[calc(100vh-8rem)] space-y-4 overflow-y-auto rounded-xl border border-border bg-card p-4">
      <p className="text-xs font-semibold uppercase tracking-[0.14em] text-text-secondary">
        {current.type.replace(/-/g, " ")} properties
      </p>

      {altWarning ? (
        <p className="rounded-lg border border-amber-500/40 bg-amber-50 px-3 py-2 text-xs text-amber-900 dark:bg-amber-950/40 dark:text-amber-100">
          Add image alt text for accessibility and SEO.
        </p>
      ) : null}

      {/* ── Layout ── */}
      {current.type === "hero" && (
        <>
          <Field label="Eyebrow" value={current.props.eyebrow} onChange={(v) => updateProp("eyebrow", v)} />
          <Field label="Headline" value={current.props.headline} onChange={(v) => updateProp("headline", v)} />
          <Field label="Subheadline" value={current.props.subheadline} onChange={(v) => updateProp("subheadline", v)} />
          <Field label="Primary CTA label" value={current.props.ctaLabel} onChange={(v) => updateProp("ctaLabel", v)} />
          <Field label="Primary CTA link" value={current.props.ctaHref} onChange={(v) => updateProp("ctaHref", v)} />
          <Field label="Secondary CTA label" value={current.props.secondaryCtaLabel} onChange={(v) => updateProp("secondaryCtaLabel", v)} />
          <Field label="Secondary CTA link" value={current.props.secondaryCtaHref} onChange={(v) => updateProp("secondaryCtaHref", v)} />
          <MediaPicker label="Hero image" value={current.props.image} onSelect={(src) => updateProp("image", src)} />
          <Field label="Image alt text" value={current.props.imageAlt} onChange={(v) => updateProp("imageAlt", v)} />
        </>
      )}

      {current.type === "page-header" && (
        <>
          <Field label="Eyebrow" value={current.props.eyebrow} onChange={(v) => updateProp("eyebrow", v)} />
          <Field label="Title" value={current.props.title} onChange={(v) => updateProp("title", v)} />
          <Field label="Subtitle" value={current.props.subtitle} onChange={(v) => updateProp("subtitle", v)} />
          <Select
            label="Alignment"
            value={current.props.align}
            onChange={(v) => updateProp("align", v)}
            options={[
              { value: "left", label: "Left" },
              { value: "center", label: "Center" },
            ]}
          />
        </>
      )}

      {current.type === "title" && (
        <>
          <Field label="Eyebrow" value={current.props.eyebrow} onChange={(v) => updateProp("eyebrow", v)} />
          <Field label="Title text" value={current.props.text} onChange={(v) => updateProp("text", v)} />
          <Select
            label="Heading level"
            value={current.props.level}
            onChange={(v) => updateProp("level", v)}
            options={[
              { value: "h1", label: "H1" },
              { value: "h2", label: "H2" },
              { value: "h3", label: "H3" },
            ]}
          />
          <Select
            label="Alignment"
            value={current.props.align}
            onChange={(v) => updateProp("align", v)}
            options={[
              { value: "left", label: "Left" },
              { value: "center", label: "Center" },
            ]}
          />
        </>
      )}

      {current.type === "banner" && (
        <>
          <Field label="Banner text" value={current.props.text} onChange={(v) => updateProp("text", v)} multiline />
          <Field label="Link label" value={current.props.linkLabel} onChange={(v) => updateProp("linkLabel", v)} />
          <Field label="Link URL" value={current.props.linkHref} onChange={(v) => updateProp("linkHref", v)} />
          <Select
            label="Style"
            value={current.props.variant}
            onChange={(v) => updateProp("variant", v)}
            options={[
              { value: "info", label: "Info" },
              { value: "success", label: "Success" },
              { value: "warning", label: "Warning" },
              { value: "dark", label: "Dark" },
            ]}
          />
        </>
      )}

      {current.type === "divider" && (
        <>
          <Select
            label="Style"
            value={current.props.style}
            onChange={(v) => updateProp("style", v)}
            options={[
              { value: "line", label: "Line" },
              { value: "dots", label: "Dots" },
              { value: "none", label: "Invisible" },
            ]}
          />
          <Field label="Center label (optional)" value={current.props.label} onChange={(v) => updateProp("label", v)} />
        </>
      )}

      {current.type === "spacer" && (
        <Select
          label="Height"
          value={current.props.size}
          onChange={(v) => updateProp("size", v)}
          options={[
            { value: "sm", label: "Small" },
            { value: "md", label: "Medium" },
            { value: "lg", label: "Large" },
            { value: "xl", label: "Extra large" },
          ]}
        />
      )}

      {current.type === "columns" && (
        <>
          <Select
            label="Column ratio"
            value={current.props.ratio}
            onChange={(v) => updateProp("ratio", v)}
            options={[
              { value: "1-1", label: "Equal (1:1)" },
              { value: "2-1", label: "Wide left (2:1)" },
              { value: "1-2", label: "Wide right (1:2)" },
            ]}
          />
          <Rich label="Left column" value={current.props.leftHtml} onChange={(v) => updateProp("leftHtml", v)} />
          <Rich label="Right column" value={current.props.rightHtml} onChange={(v) => updateProp("rightHtml", v)} />
        </>
      )}

      {current.type === "three-columns" && (
        <>
          <Rich label="Column 1" value={current.props.col1Html} onChange={(v) => updateProp("col1Html", v)} />
          <Rich label="Column 2" value={current.props.col2Html} onChange={(v) => updateProp("col2Html", v)} />
          <Rich label="Column 3" value={current.props.col3Html} onChange={(v) => updateProp("col3Html", v)} />
        </>
      )}

      {current.type === "split" && (
        <>
          <Field label="Eyebrow" value={current.props.eyebrow} onChange={(v) => updateProp("eyebrow", v)} />
          <Field label="Title" value={current.props.title} onChange={(v) => updateProp("title", v)} />
          <Rich label="Body" value={current.props.bodyHtml} onChange={(v) => updateProp("bodyHtml", v)} />
          <MediaPicker label="Image" value={current.props.image} onSelect={(src) => updateProp("image", src)} />
          <Field label="Image alt" value={current.props.imageAlt} onChange={(v) => updateProp("imageAlt", v)} />
          <Select
            label="Image position"
            value={current.props.imagePosition}
            onChange={(v) => updateProp("imagePosition", v)}
            options={[
              { value: "left", label: "Left" },
              { value: "right", label: "Right" },
            ]}
          />
          <Field label="CTA label" value={current.props.ctaLabel} onChange={(v) => updateProp("ctaLabel", v)} />
          <Field label="CTA link" value={current.props.ctaHref} onChange={(v) => updateProp("ctaHref", v)} />
        </>
      )}

      {/* ── Content ── */}
      {current.type === "rich-text" && (
        <Rich label="Body content" value={current.props.html} onChange={(v) => updateProp("html", v)} />
      )}

      {current.type === "list" && (
        <>
          <Field label="Title" value={current.props.title} onChange={(v) => updateProp("title", v)} />
          <Select
            label="List style"
            value={current.props.style}
            onChange={(v) => updateProp("style", v)}
            options={[
              { value: "bullet", label: "Bullets" },
              { value: "numbered", label: "Numbered" },
              { value: "check", label: "Checkmarks" },
            ]}
          />
          <StringList
            label="Items"
            items={current.props.items}
            onChange={(items) => updateProp("items", items)}
          />
        </>
      )}

      {current.type === "quote" && (
        <>
          <Field label="Quote" value={current.props.quote} onChange={(v) => updateProp("quote", v)} multiline />
          <Field label="Attribution" value={current.props.attribution} onChange={(v) => updateProp("attribution", v)} />
          <Field label="Role" value={current.props.role} onChange={(v) => updateProp("role", v)} />
        </>
      )}

      {current.type === "callout" && (
        <>
          <Field label="Title" value={current.props.title} onChange={(v) => updateProp("title", v)} />
          <Field label="Body" value={current.props.body} onChange={(v) => updateProp("body", v)} multiline />
          <Select
            label="Variant"
            value={current.props.variant}
            onChange={(v) => updateProp("variant", v)}
            options={[
              { value: "info", label: "Info" },
              { value: "tip", label: "Tip" },
              { value: "warning", label: "Warning" },
              { value: "success", label: "Success" },
            ]}
          />
        </>
      )}

      {current.type === "table" && (
        <>
          <Field label="Caption" value={current.props.caption} onChange={(v) => updateProp("caption", v)} />
          <StringList
            label="Headers (one per line)"
            items={current.props.headers}
            onChange={(headers) => updateProp("headers", headers)}
          />
          <div className="space-y-2">
            <p className="text-xs font-medium text-text-secondary">Rows (comma-separated cells)</p>
            {current.props.rows.map((row, ri) => (
              <div key={ri} className="flex gap-2">
                <input
                  value={row.join(", ")}
                  onChange={(e) => {
                    const rows = [...current.props.rows];
                    rows[ri] = e.target.value.split(",").map((c) => c.trim());
                    updateProp("rows", rows);
                  }}
                  className="w-full rounded-xl border border-border px-3 py-2 text-sm"
                />
                <button type="button" className="text-xs text-red-600" onClick={() => updateProp("rows", current.props.rows.filter((_, i) => i !== ri))}>
                  ×
                </button>
              </div>
            ))}
            <button
              type="button"
              className="text-sm font-medium text-teal"
              onClick={() =>
                updateProp("rows", [
                  ...current.props.rows,
                  current.props.headers.map(() => " - "),
                ])
              }
            >
              + Add row
            </button>
          </div>
        </>
      )}

      {current.type === "steps" && (
        <>
          <Field label="Eyebrow" value={current.props.eyebrow} onChange={(v) => updateProp("eyebrow", v)} />
          <Field label="Title" value={current.props.title} onChange={(v) => updateProp("title", v)} />
          <Field label="Subtitle" value={current.props.subtitle} onChange={(v) => updateProp("subtitle", v)} />
          {current.props.items.map((item, index) => (
            <ItemCard key={index} title={`Step ${index + 1}`} onRemove={() => removeArrayItem(index)}>
              <Field label="Title" value={item.title} onChange={(v) => updateArrayItem(index, "title", v)} />
              <Field label="Description" value={item.description} onChange={(v) => updateArrayItem(index, "description", v)} multiline />
            </ItemCard>
          ))}
          <AddBtn
            label="+ Add step"
            onClick={() =>
              updateProp("items", [...current.props.items, { title: "New step", description: "Description" }])
            }
          />
        </>
      )}

      {current.type === "tabs" && (
        <>
          <Field label="Section title" value={current.props.title} onChange={(v) => updateProp("title", v)} />
          {current.props.items.map((item, index) => (
            <ItemCard key={index} title={`Tab ${index + 1}`} onRemove={() => removeArrayItem(index)}>
              <Field label="Label" value={item.label} onChange={(v) => updateArrayItem(index, "label", v)} />
              <Rich label="Content" value={item.html} onChange={(v) => updateArrayItem(index, "html", v)} />
            </ItemCard>
          ))}
          <AddBtn
            label="+ Add tab"
            onClick={() =>
              updateProp("items", [...current.props.items, { label: "New tab", html: "<p>Content</p>" }])
            }
          />
        </>
      )}

      {current.type === "accordion" && (
        <>
          <Field label="Title" value={current.props.title} onChange={(v) => updateProp("title", v)} />
          <Field label="Subtitle" value={current.props.subtitle} onChange={(v) => updateProp("subtitle", v)} />
          {current.props.items.map((item, index) => (
            <ItemCard key={index} title={`Panel ${index + 1}`} onRemove={() => removeArrayItem(index)}>
              <Field label="Title" value={item.title} onChange={(v) => updateArrayItem(index, "title", v)} />
              <Field label="Body" value={item.body} onChange={(v) => updateArrayItem(index, "body", v)} multiline />
            </ItemCard>
          ))}
          <AddBtn
            label="+ Add panel"
            onClick={() =>
              updateProp("items", [...current.props.items, { title: "Panel title", body: "Body text" }])
            }
          />
        </>
      )}

      {current.type === "features" && (
        <>
          <Field label="Eyebrow" value={current.props.eyebrow} onChange={(v) => updateProp("eyebrow", v)} />
          <Field label="Title" value={current.props.title} onChange={(v) => updateProp("title", v)} />
          <Field label="Subtitle" value={current.props.subtitle} onChange={(v) => updateProp("subtitle", v)} />
          {current.props.items.map((item, index) => (
            <ItemCard key={index} title={`Feature ${index + 1}`} onRemove={() => removeArrayItem(index)}>
              <Field label="Title" value={item.title} onChange={(v) => updateArrayItem(index, "title", v)} />
              <Field label="Description" value={item.description} onChange={(v) => updateArrayItem(index, "description", v)} />
            </ItemCard>
          ))}
          <AddBtn
            label="+ Add feature"
            onClick={() =>
              updateProp("items", [...current.props.items, { title: "New feature", description: "Description" }])
            }
          />
        </>
      )}

      {current.type === "cards" && (
        <>
          <Field label="Eyebrow" value={current.props.eyebrow} onChange={(v) => updateProp("eyebrow", v)} />
          <Field label="Title" value={current.props.title} onChange={(v) => updateProp("title", v)} />
          <Field label="Subtitle" value={current.props.subtitle} onChange={(v) => updateProp("subtitle", v)} />
          <Select
            label="Columns"
            value={current.props.columns}
            onChange={(v) => updateProp("columns", v)}
            options={[
              { value: "2", label: "2" },
              { value: "3", label: "3" },
              { value: "4", label: "4" },
            ]}
          />
          {current.props.items.map((item, index) => (
            <ItemCard key={index} title={`Card ${index + 1}`} onRemove={() => removeArrayItem(index)}>
              <Field label="Title" value={item.title} onChange={(v) => updateArrayItem(index, "title", v)} />
              <Field label="Description" value={item.description} onChange={(v) => updateArrayItem(index, "description", v)} multiline />
              <MediaPicker label="Image" value={item.image} onSelect={(src) => updateArrayItem(index, "image", src)} />
              <Field label="Image alt" value={item.imageAlt} onChange={(v) => updateArrayItem(index, "imageAlt", v)} />
              <Field label="Link label" value={item.linkLabel} onChange={(v) => updateArrayItem(index, "linkLabel", v)} />
              <Field label="Link URL" value={item.linkHref} onChange={(v) => updateArrayItem(index, "linkHref", v)} />
            </ItemCard>
          ))}
          <AddBtn
            label="+ Add card"
            onClick={() =>
              updateProp("items", [
                ...current.props.items,
                {
                  title: "New card",
                  description: "Description",
                  image: "",
                  imageAlt: "",
                  linkLabel: "Learn more",
                  linkHref: "/",
                },
              ])
            }
          />
        </>
      )}

      {current.type === "teaser" && (
        <>
          <Field label="Eyebrow" value={current.props.eyebrow} onChange={(v) => updateProp("eyebrow", v)} />
          <Field label="Title" value={current.props.title} onChange={(v) => updateProp("title", v)} />
          <Field label="Description" value={current.props.description} onChange={(v) => updateProp("description", v)} multiline />
          <MediaPicker label="Image" value={current.props.image} onSelect={(src) => updateProp("image", src)} />
          <Field label="Image alt" value={current.props.imageAlt} onChange={(v) => updateProp("imageAlt", v)} />
          <Field label="Link label" value={current.props.linkLabel} onChange={(v) => updateProp("linkLabel", v)} />
          <Field label="Link URL" value={current.props.linkHref} onChange={(v) => updateProp("linkHref", v)} />
          <Select
            label="Layout"
            value={current.props.layout}
            onChange={(v) => updateProp("layout", v)}
            options={[
              { value: "horizontal", label: "Horizontal" },
              { value: "vertical", label: "Vertical" },
            ]}
          />
        </>
      )}

      {current.type === "stats" && (
        <>
          {current.props.items.map((item, index) => (
            <ItemCard key={index} title={`Stat ${index + 1}`} onRemove={() => removeArrayItem(index)}>
              <Field label="Value" value={item.value} onChange={(v) => updateArrayItem(index, "value", v)} />
              <Field label="Label" value={item.label} onChange={(v) => updateArrayItem(index, "label", v)} />
            </ItemCard>
          ))}
          <AddBtn
            label="+ Add stat"
            onClick={() => updateProp("items", [...current.props.items, { value: "0", label: "Metric" }])}
          />
        </>
      )}

      {current.type === "agenda" && (
        <>
          <Field label="Title" value={current.props.title} onChange={(v) => updateProp("title", v)} />
          <Field label="Subtitle" value={current.props.subtitle} onChange={(v) => updateProp("subtitle", v)} />
          {current.props.items.map((item, index) => (
            <ItemCard key={index} title={`Item ${index + 1}`} onRemove={() => removeArrayItem(index)}>
              <Field label="Time" value={item.time} onChange={(v) => updateArrayItem(index, "time", v)} />
              <Field label="Title" value={item.title} onChange={(v) => updateArrayItem(index, "title", v)} />
              <Field label="Description" value={item.description} onChange={(v) => updateArrayItem(index, "description", v)} />
            </ItemCard>
          ))}
          <AddBtn
            label="+ Add agenda item"
            onClick={() =>
              updateProp("items", [
                ...current.props.items,
                { time: "0:00", title: "Topic", description: "Details" },
              ])
            }
          />
        </>
      )}

      {current.type === "comparison" && (
        <>
          <Field label="Title" value={current.props.title} onChange={(v) => updateProp("title", v)} />
          <Field label="Column A name" value={current.props.columnA} onChange={(v) => updateProp("columnA", v)} />
          <Field label="Column B name" value={current.props.columnB} onChange={(v) => updateProp("columnB", v)} />
          {current.props.rows.map((row, index) => (
            <ItemCard
              key={index}
              title={`Row ${index + 1}`}
              onRemove={() =>
                updateProp(
                  "rows",
                  current.props.rows.filter((_, i) => i !== index)
                )
              }
            >
              <Field
                label="Feature"
                value={row.feature}
                onChange={(v) => {
                  const rows = [...current.props.rows];
                  rows[index] = { ...rows[index], feature: v };
                  updateProp("rows", rows);
                }}
              />
              <Field
                label="Column A"
                value={row.colA}
                onChange={(v) => {
                  const rows = [...current.props.rows];
                  rows[index] = { ...rows[index], colA: v };
                  updateProp("rows", rows);
                }}
              />
              <Field
                label="Column B"
                value={row.colB}
                onChange={(v) => {
                  const rows = [...current.props.rows];
                  rows[index] = { ...rows[index], colB: v };
                  updateProp("rows", rows);
                }}
              />
            </ItemCard>
          ))}
          <AddBtn
            label="+ Add row"
            onClick={() =>
              updateProp("rows", [
                ...current.props.rows,
                { feature: "Feature", colA: "A", colB: "B" },
              ])
            }
          />
        </>
      )}

      {current.type === "pricing" && (
        <>
          <Field label="Title" value={current.props.title} onChange={(v) => updateProp("title", v)} />
          <Field label="Subtitle" value={current.props.subtitle} onChange={(v) => updateProp("subtitle", v)} />
          {current.props.plans.map((plan, index) => (
            <ItemCard
              key={index}
              title={`Plan ${index + 1}`}
              onRemove={() =>
                updateProp(
                  "plans",
                  current.props.plans.filter((_, i) => i !== index)
                )
              }
            >
              <Field
                label="Name"
                value={plan.name}
                onChange={(v) => {
                  const plans = [...current.props.plans];
                  plans[index] = { ...plans[index], name: v };
                  updateProp("plans", plans);
                }}
              />
              <Field
                label="Price"
                value={plan.price}
                onChange={(v) => {
                  const plans = [...current.props.plans];
                  plans[index] = { ...plans[index], price: v };
                  updateProp("plans", plans);
                }}
              />
              <Field
                label="Period"
                value={plan.period}
                onChange={(v) => {
                  const plans = [...current.props.plans];
                  plans[index] = { ...plans[index], period: v };
                  updateProp("plans", plans);
                }}
              />
              <Field
                label="Description"
                value={plan.description}
                onChange={(v) => {
                  const plans = [...current.props.plans];
                  plans[index] = { ...plans[index], description: v };
                  updateProp("plans", plans);
                }}
              />
              <StringList
                label="Features"
                items={plan.features}
                onChange={(features) => {
                  const plans = [...current.props.plans];
                  plans[index] = { ...plans[index], features };
                  updateProp("plans", plans);
                }}
              />
              <Field
                label="CTA label"
                value={plan.ctaLabel}
                onChange={(v) => {
                  const plans = [...current.props.plans];
                  plans[index] = { ...plans[index], ctaLabel: v };
                  updateProp("plans", plans);
                }}
              />
              <Field
                label="CTA link"
                value={plan.ctaHref}
                onChange={(v) => {
                  const plans = [...current.props.plans];
                  plans[index] = { ...plans[index], ctaHref: v };
                  updateProp("plans", plans);
                }}
              />
              <label className="flex items-center gap-2 text-sm">
                <input
                  type="checkbox"
                  checked={plan.highlighted}
                  onChange={(e) => {
                    const plans = [...current.props.plans];
                    plans[index] = { ...plans[index], highlighted: e.target.checked };
                    updateProp("plans", plans);
                  }}
                />
                Highlighted plan
              </label>
            </ItemCard>
          ))}
          <AddBtn
            label="+ Add plan"
            onClick={() =>
              updateProp("plans", [
                ...current.props.plans,
                {
                  name: "New plan",
                  price: "₹0",
                  period: "",
                  description: "",
                  features: ["Feature"],
                  ctaLabel: "Get started",
                  ctaHref: "/contact",
                  highlighted: false,
                },
              ])
            }
          />
        </>
      )}

      {current.type === "faq" && (
        <>
          <Field label="Title" value={current.props.title} onChange={(v) => updateProp("title", v)} />
          <Field label="Subtitle" value={current.props.subtitle} onChange={(v) => updateProp("subtitle", v)} />
          {current.props.items.map((item, index) => (
            <ItemCard key={index} title={`FAQ ${index + 1}`} onRemove={() => removeArrayItem(index)}>
              <Field label="Question" value={item.question} onChange={(v) => updateArrayItem(index, "question", v)} />
              <Field label="Answer" value={item.answer} onChange={(v) => updateArrayItem(index, "answer", v)} multiline />
            </ItemCard>
          ))}
          <AddBtn
            label="+ Add FAQ"
            onClick={() =>
              updateProp("items", [
                ...current.props.items,
                { question: "New question?", answer: "Answer here." },
              ])
            }
          />
        </>
      )}

      {/* ── Media ── */}
      {current.type === "image" && (
        <>
          <MediaPicker label="Image" value={current.props.src} onSelect={(src) => updateProp("src", src)} />
          <Field label="Alt text" value={current.props.alt} onChange={(v) => updateProp("alt", v)} />
          <Field label="Caption" value={current.props.caption} onChange={(v) => updateProp("caption", v)} />
          <Field label="Optional link URL" value={current.props.linkHref} onChange={(v) => updateProp("linkHref", v)} />
        </>
      )}

      {current.type === "gallery" && (
        <>
          <Field label="Title" value={current.props.title} onChange={(v) => updateProp("title", v)} />
          <Select
            label="Columns"
            value={current.props.columns}
            onChange={(v) => updateProp("columns", v)}
            options={[
              { value: "2", label: "2" },
              { value: "3", label: "3" },
              { value: "4", label: "4" },
            ]}
          />
          {current.props.items.map((item, index) => (
            <ItemCard key={index} title={`Image ${index + 1}`} onRemove={() => removeArrayItem(index)}>
              <MediaPicker label="Image" value={item.src} onSelect={(src) => updateArrayItem(index, "src", src)} />
              <Field label="Alt text" value={item.alt} onChange={(v) => updateArrayItem(index, "alt", v)} />
              <Field label="Caption" value={item.caption} onChange={(v) => updateArrayItem(index, "caption", v)} />
            </ItemCard>
          ))}
          <AddBtn
            label="+ Add image"
            onClick={() =>
              updateProp("items", [
                ...current.props.items,
                { src: "/images/workshop.jpg", alt: "Gallery image", caption: "" },
              ])
            }
          />
        </>
      )}

      {current.type === "video" && (
        <>
          <Field label="YouTube URL or ID" value={current.props.url} onChange={(v) => updateProp("url", v)} />
          <Field label="Video title (accessibility)" value={current.props.title} onChange={(v) => updateProp("title", v)} />
          <Field label="Caption" value={current.props.caption} onChange={(v) => updateProp("caption", v)} />
        </>
      )}

      {current.type === "embed" && (
        <>
          <Field label="Title" value={current.props.title} onChange={(v) => updateProp("title", v)} />
          <Field label="Min height (px)" value={current.props.minHeight} onChange={(v) => updateProp("minHeight", v)} />
          <Field
            label="Embed HTML (iframe etc.)"
            value={current.props.html}
            onChange={(v) => updateProp("html", v)}
            multiline
          />
        </>
      )}

      {current.type === "marquee" && (
        <>
          <StringList
            label="Topics"
            items={current.props.items}
            onChange={(items) => updateProp("items", items)}
          />
          <Select
            label="Speed"
            value={current.props.speed}
            onChange={(v) => updateProp("speed", v)}
            options={[
              { value: "slow", label: "Slow" },
              { value: "normal", label: "Normal" },
              { value: "fast", label: "Fast" },
            ]}
          />
        </>
      )}

      {/* ── Conversion ── */}
      {current.type === "button" && (
        <>
          <Field label="Label" value={current.props.label} onChange={(v) => updateProp("label", v)} />
          <Field label="Link" value={current.props.href} onChange={(v) => updateProp("href", v)} />
          <Select
            label="Variant"
            value={current.props.variant}
            onChange={(v) => updateProp("variant", v)}
            options={[
              { value: "primary", label: "Primary" },
              { value: "secondary", label: "Secondary" },
              { value: "cta", label: "CTA" },
            ]}
          />
          <Select
            label="Alignment"
            value={current.props.align}
            onChange={(v) => updateProp("align", v)}
            options={[
              { value: "left", label: "Left" },
              { value: "center", label: "Center" },
              { value: "right", label: "Right" },
            ]}
          />
        </>
      )}

      {current.type === "button-group" && (
        <>
          <Select
            label="Alignment"
            value={current.props.align}
            onChange={(v) => updateProp("align", v)}
            options={[
              { value: "left", label: "Left" },
              { value: "center", label: "Center" },
              { value: "right", label: "Right" },
            ]}
          />
          {current.props.buttons.map((btn, index) => (
            <ItemCard
              key={index}
              title={`Button ${index + 1}`}
              onRemove={() =>
                updateProp(
                  "buttons",
                  current.props.buttons.filter((_, i) => i !== index)
                )
              }
            >
              <Field
                label="Label"
                value={btn.label}
                onChange={(v) => {
                  const buttons = [...current.props.buttons];
                  buttons[index] = { ...buttons[index], label: v };
                  updateProp("buttons", buttons);
                }}
              />
              <Field
                label="Link"
                value={btn.href}
                onChange={(v) => {
                  const buttons = [...current.props.buttons];
                  buttons[index] = { ...buttons[index], href: v };
                  updateProp("buttons", buttons);
                }}
              />
              <Select
                label="Variant"
                value={btn.variant}
                onChange={(v) => {
                  const buttons = [...current.props.buttons];
                  buttons[index] = {
                    ...buttons[index],
                    variant: v as "primary" | "secondary" | "cta",
                  };
                  updateProp("buttons", buttons);
                }}
                options={[
                  { value: "primary", label: "Primary" },
                  { value: "secondary", label: "Secondary" },
                  { value: "cta", label: "CTA" },
                ]}
              />
            </ItemCard>
          ))}
          <AddBtn
            label="+ Add button"
            onClick={() =>
              updateProp("buttons", [
                ...current.props.buttons,
                { label: "Button", href: "/", variant: "primary" as const },
              ])
            }
          />
        </>
      )}

      {current.type === "cta" && (
        <>
          <Field label="Title" value={current.props.title} onChange={(v) => updateProp("title", v)} />
          <Field label="Description" value={current.props.description} onChange={(v) => updateProp("description", v)} />
          <Field label="Primary button" value={current.props.buttonLabel} onChange={(v) => updateProp("buttonLabel", v)} />
          <Field label="Primary link" value={current.props.buttonHref} onChange={(v) => updateProp("buttonHref", v)} />
          <Field label="Secondary button" value={current.props.secondaryLabel} onChange={(v) => updateProp("secondaryLabel", v)} />
          <Field label="Secondary link" value={current.props.secondaryHref} onChange={(v) => updateProp("secondaryHref", v)} />
          <Select
            label="Style"
            value={current.props.variant}
            onChange={(v) => updateProp("variant", v)}
            options={[
              { value: "teal", label: "Light band" },
              { value: "dark", label: "Dark band" },
            ]}
          />
        </>
      )}

      {current.type === "newsletter" && (
        <>
          <Field label="Title" value={current.props.title} onChange={(v) => updateProp("title", v)} />
          <Field label="Description" value={current.props.description} onChange={(v) => updateProp("description", v)} multiline />
          <Field label="Button label" value={current.props.buttonLabel} onChange={(v) => updateProp("buttonLabel", v)} />
          <Field label="Privacy note" value={current.props.privacyNote} onChange={(v) => updateProp("privacyNote", v)} />
        </>
      )}

      {current.type === "download" && (
        <>
          <Field label="Title" value={current.props.title} onChange={(v) => updateProp("title", v)} />
          <Field label="Description" value={current.props.description} onChange={(v) => updateProp("description", v)} multiline />
          <Field label="File label" value={current.props.fileLabel} onChange={(v) => updateProp("fileLabel", v)} />
          <Field label="File / page URL" value={current.props.fileHref} onChange={(v) => updateProp("fileHref", v)} />
          <Field label="Button label" value={current.props.buttonLabel} onChange={(v) => updateProp("buttonLabel", v)} />
        </>
      )}

      {current.type === "form-cta" && (
        <>
          <Field label="Title" value={current.props.title} onChange={(v) => updateProp("title", v)} />
          <Field label="Description" value={current.props.description} onChange={(v) => updateProp("description", v)} multiline />
          <Field label="Button label" value={current.props.buttonLabel} onChange={(v) => updateProp("buttonLabel", v)} />
          <Field label="Button link" value={current.props.buttonHref} onChange={(v) => updateProp("buttonHref", v)} />
          <StringList
            label="Bullets"
            items={current.props.bullets}
            onChange={(bullets) => updateProp("bullets", bullets)}
          />
        </>
      )}

      {/* ── Social proof ── */}
      {current.type === "testimonials" && (
        <>
          <Field label="Title" value={current.props.title} onChange={(v) => updateProp("title", v)} />
          <Field label="Subtitle" value={current.props.subtitle} onChange={(v) => updateProp("subtitle", v)} />
          {current.props.items.map((item, index) => (
            <ItemCard key={index} title={`Quote ${index + 1}`} onRemove={() => removeArrayItem(index)}>
              <Field label="Quote" value={item.quote} onChange={(v) => updateArrayItem(index, "quote", v)} multiline />
              <Field label="Name" value={item.name} onChange={(v) => updateArrayItem(index, "name", v)} />
              <Field label="Role" value={item.role} onChange={(v) => updateArrayItem(index, "role", v)} />
              <MediaPicker
                label="Avatar (optional)"
                value={item.avatar}
                onSelect={(src) => updateArrayItem(index, "avatar", src)}
              />
              <Field label="Avatar alt" value={item.avatarAlt} onChange={(v) => updateArrayItem(index, "avatarAlt", v)} />
            </ItemCard>
          ))}
          <AddBtn
            label="+ Add testimonial"
            onClick={() =>
              updateProp("items", [
                ...current.props.items,
                { quote: "Quote", name: "Name", role: "Role", avatar: "", avatarAlt: "" },
              ])
            }
          />
        </>
      )}

      {current.type === "logos" && (
        <>
          <Field label="Title" value={current.props.title} onChange={(v) => updateProp("title", v)} />
          <Field label="Subtitle" value={current.props.subtitle} onChange={(v) => updateProp("subtitle", v)} />
          {current.props.items.map((item, index) => (
            <ItemCard key={index} title={`Logo ${index + 1}`} onRemove={() => removeArrayItem(index)}>
              <Field label="Name" value={item.name} onChange={(v) => updateArrayItem(index, "name", v)} />
              <MediaPicker label="Logo image" value={item.image} onSelect={(src) => updateArrayItem(index, "image", src)} />
              <Field label="Alt text" value={item.imageAlt} onChange={(v) => updateArrayItem(index, "imageAlt", v)} />
              <Field label="Link (optional)" value={item.href} onChange={(v) => updateArrayItem(index, "href", v)} />
            </ItemCard>
          ))}
          <AddBtn
            label="+ Add logo"
            onClick={() =>
              updateProp("items", [
                ...current.props.items,
                { name: "Partner", image: "", imageAlt: "Partner logo", href: "" },
              ])
            }
          />
        </>
      )}

      {current.type === "team" && (
        <>
          <Field label="Title" value={current.props.title} onChange={(v) => updateProp("title", v)} />
          <Field label="Subtitle" value={current.props.subtitle} onChange={(v) => updateProp("subtitle", v)} />
          {current.props.members.map((member, index) => (
            <ItemCard
              key={index}
              title={`Member ${index + 1}`}
              onRemove={() =>
                updateProp(
                  "members",
                  current.props.members.filter((_, i) => i !== index)
                )
              }
            >
              <Field
                label="Name"
                value={member.name}
                onChange={(v) => {
                  const members = [...current.props.members];
                  members[index] = { ...members[index], name: v };
                  updateProp("members", members);
                }}
              />
              <Field
                label="Role"
                value={member.role}
                onChange={(v) => {
                  const members = [...current.props.members];
                  members[index] = { ...members[index], role: v };
                  updateProp("members", members);
                }}
              />
              <Field
                label="Bio"
                value={member.bio}
                onChange={(v) => {
                  const members = [...current.props.members];
                  members[index] = { ...members[index], bio: v };
                  updateProp("members", members);
                }}
                multiline
              />
              <MediaPicker
                label="Photo"
                value={member.image}
                onSelect={(src) => {
                  const members = [...current.props.members];
                  members[index] = { ...members[index], image: src };
                  updateProp("members", members);
                }}
              />
              <Field
                label="Photo alt"
                value={member.imageAlt}
                onChange={(v) => {
                  const members = [...current.props.members];
                  members[index] = { ...members[index], imageAlt: v };
                  updateProp("members", members);
                }}
              />
            </ItemCard>
          ))}
          <AddBtn
            label="+ Add member"
            onClick={() =>
              updateProp("members", [
                ...current.props.members,
                { name: "Name", role: "Role", bio: "", image: "", imageAlt: "" },
              ])
            }
          />
        </>
      )}

      {current.type === "contact-cards" && (
        <>
          <Field label="Title" value={current.props.title} onChange={(v) => updateProp("title", v)} />
          <Field label="Subtitle" value={current.props.subtitle} onChange={(v) => updateProp("subtitle", v)} />
          {current.props.items.map((item, index) => (
            <ItemCard key={index} title={`Card ${index + 1}`} onRemove={() => removeArrayItem(index)}>
              <Field label="Title" value={item.title} onChange={(v) => updateArrayItem(index, "title", v)} />
              <Field label="Description" value={item.description} onChange={(v) => updateArrayItem(index, "description", v)} />
              <Field label="Link label" value={item.linkLabel} onChange={(v) => updateArrayItem(index, "linkLabel", v)} />
              <Field label="Link URL" value={item.linkHref} onChange={(v) => updateArrayItem(index, "linkHref", v)} />
            </ItemCard>
          ))}
          <AddBtn
            label="+ Add card"
            onClick={() =>
              updateProp("items", [
                ...current.props.items,
                { title: "Contact", description: "Details", linkLabel: "Go", linkHref: "/contact" },
              ])
            }
          />
        </>
      )}
    </div>
  );
}

/* ── Shared field UI ───────────────────────────────────────────── */

function Field({
  label,
  value,
  onChange,
  multiline = false,
}: {
  label: string;
  value: string;
  onChange: (value: string) => void;
  multiline?: boolean;
}) {
  return (
    <label className="block text-sm">
      <span className="mb-1 block text-xs font-medium text-text-secondary">{label}</span>
      {multiline ? (
        <textarea
          value={value}
          onChange={(e) => onChange(e.target.value)}
          rows={3}
          className="w-full rounded-xl border border-border px-3 py-2"
        />
      ) : (
        <input
          value={value}
          onChange={(e) => onChange(e.target.value)}
          className="w-full rounded-xl border border-border px-3 py-2"
        />
      )}
    </label>
  );
}

function Select({
  label,
  value,
  onChange,
  options,
}: {
  label: string;
  value: string;
  onChange: (value: string) => void;
  options: { value: string; label: string }[];
}) {
  return (
    <label className="block text-sm">
      <span className="mb-1 block text-xs font-medium text-text-secondary">{label}</span>
      <select
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className="w-full rounded-xl border border-border px-3 py-2"
      >
        {options.map((opt) => (
          <option key={opt.value} value={opt.value}>
            {opt.label}
          </option>
        ))}
      </select>
    </label>
  );
}

function Rich({
  label,
  value,
  onChange,
}: {
  label: string;
  value: string;
  onChange: (value: string) => void;
}) {
  return (
    <div>
      <p className="mb-2 text-xs font-medium text-text-secondary">{label}</p>
      <RichTextEditor value={value} onChange={onChange} />
    </div>
  );
}

function StringList({
  label,
  items,
  onChange,
}: {
  label: string;
  items: string[];
  onChange: (items: string[]) => void;
}) {
  return (
    <label className="block text-sm">
      <span className="mb-1 block text-xs font-medium text-text-secondary">{label}</span>
      <textarea
        value={items.join("\n")}
        onChange={(e) =>
          onChange(
            e.target.value
              .split("\n")
              .map((line) => line.trim())
              .filter(Boolean)
          )
        }
        rows={4}
        className="w-full rounded-xl border border-border px-3 py-2 font-mono text-xs"
        placeholder="One item per line"
      />
    </label>
  );
}

function ItemCard({
  title,
  onRemove,
  children,
}: {
  title: string;
  onRemove: () => void;
  children: React.ReactNode;
}) {
  return (
    <div className="space-y-2 rounded-lg border border-border/80 p-3">
      <div className="flex items-center justify-between">
        <p className="text-xs font-semibold text-text-secondary">{title}</p>
        <button type="button" onClick={onRemove} className="text-xs text-red-600">
          Remove
        </button>
      </div>
      {children}
    </div>
  );
}

function AddBtn({ label, onClick }: { label: string; onClick: () => void }) {
  return (
    <button type="button" onClick={onClick} className="text-sm font-medium text-teal">
      {label}
    </button>
  );
}
