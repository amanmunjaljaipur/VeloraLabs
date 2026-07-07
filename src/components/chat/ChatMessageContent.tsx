"use client";

import { cn } from "@/lib/utils";

type Block =
  | { type: "paragraph"; text: string }
  | { type: "list"; items: string[] }
  | { type: "table"; headers: string[]; rows: string[][] };

function isTableRow(line: string): boolean {
  return line.trim().startsWith("|") && line.trim().endsWith("|");
}

function parseTableRow(line: string): string[] {
  return line
    .trim()
    .slice(1, -1)
    .split("|")
    .map((cell) => cell.trim());
}

function isDividerRow(cells: string[]): boolean {
  return cells.every((c) => /^:?-+:?$/.test(c.replace(/\s/g, "")));
}

function parseBlocks(content: string): Block[] {
  const lines = content.split("\n");
  const blocks: Block[] = [];
  let i = 0;

  while (i < lines.length) {
    const line = lines[i] ?? "";

    if (!line.trim()) {
      i++;
      continue;
    }

    if (isTableRow(line) && isTableRow(lines[i + 1] ?? "")) {
      const headers = parseTableRow(line);
      i += 2;
      const rows: string[][] = [];
      while (i < lines.length && isTableRow(lines[i] ?? "")) {
        const cells = parseTableRow(lines[i]!);
        if (!isDividerRow(cells)) {
          rows.push(cells);
        }
        i++;
      }
      blocks.push({ type: "table", headers, rows });
      continue;
    }

    if (line.trim().startsWith("- ")) {
      const items: string[] = [];
      while (i < lines.length && (lines[i] ?? "").trim().startsWith("- ")) {
        items.push((lines[i] ?? "").trim().slice(2));
        i++;
      }
      blocks.push({ type: "list", items });
      continue;
    }

    const paraLines: string[] = [];
    while (
      i < lines.length &&
      (lines[i] ?? "").trim() &&
      !(lines[i] ?? "").trim().startsWith("- ") &&
      !isTableRow(lines[i] ?? "")
    ) {
      paraLines.push((lines[i] ?? "").trim());
      i++;
    }
    blocks.push({ type: "paragraph", text: paraLines.join(" ") });
  }

  return blocks;
}

function renderInline(text: string): React.ReactNode[] {
  const parts = text.split(/(\*\*[^*]+\*\*)/g);
  return parts.map((part, idx) => {
    if (part.startsWith("**") && part.endsWith("**")) {
      return (
        <strong key={idx} className="font-semibold text-foreground">
          {part.slice(2, -2)}
        </strong>
      );
    }
    return part;
  });
}

export function ChatMessageContent({ content }: { content: string }) {
  const blocks = parseBlocks(content);

  if (blocks.length === 0) {
    return <p className="leading-relaxed">{content}</p>;
  }

  return (
    <div className="chat-prose space-y-2.5">
      {blocks.map((block, idx) => {
        if (block.type === "paragraph") {
          return (
            <p key={idx} className="leading-relaxed text-foreground/95">
              {renderInline(block.text)}
            </p>
          );
        }

        if (block.type === "list") {
          return (
            <ul key={idx} className="ml-4 list-disc space-y-1.5 pl-0.5 text-foreground/95">
              {block.items.map((item, j) => (
                <li key={j} className="leading-relaxed">
                  {renderInline(item)}
                </li>
              ))}
            </ul>
          );
        }

        return (
          <div key={idx} className="-mx-1 overflow-x-auto">
            <table className="w-full min-w-[16rem] border-collapse text-left text-[11px]">
              <thead>
                <tr className="border-b border-border/80">
                  {block.headers.map((h, j) => (
                    <th
                      key={j}
                      className="px-2 py-1.5 font-semibold text-foreground first:pl-0"
                    >
                      {h}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {block.rows.map((row, ri) => (
                  <tr
                    key={ri}
                    className={cn(
                      "border-b border-border/50 last:border-0",
                      ri % 2 === 1 && "bg-muted/40"
                    )}
                  >
                    {row.map((cell, ci) => (
                      <td key={ci} className="px-2 py-1.5 text-foreground/90 first:pl-0">
                        {renderInline(cell)}
                      </td>
                    ))}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        );
      })}
    </div>
  );
}