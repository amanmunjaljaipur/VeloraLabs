"use client";

import { MediaLibraryModal } from "@/components/admin/MediaLibraryModal";
import { cn } from "@/lib/utils";
import {
  Bold,
  Heading2,
  Heading3,
  Image as ImageIcon,
  Italic,
  Link as LinkIcon,
  List,
  Underline,
} from "lucide-react";
import { useCallback, useEffect, useRef, useState } from "react";

interface RichTextEditorProps {
  value: string;
  onChange: (html: string) => void;
  placeholder?: string;
  className?: string;
}

function ToolbarButton({
  label,
  onClick,
  children,
}: {
  label: string;
  onClick: () => void;
  children: React.ReactNode;
}) {
  return (
    <button
      type="button"
      aria-label={label}
      onMouseDown={(e) => {
        e.preventDefault();
        onClick();
      }}
      className="inline-flex h-8 w-8 items-center justify-center rounded-lg text-foreground/80 transition-colors hover:bg-muted hover:text-foreground"
    >
      {children}
    </button>
  );
}

export function RichTextEditor({ value, onChange, placeholder, className }: RichTextEditorProps) {
  const editorRef = useRef<HTMLDivElement>(null);
  const lastHtml = useRef(value);
  const [showImagePicker, setShowImagePicker] = useState(false);

  useEffect(() => {
    if (!editorRef.current) return;
    if (!editorRef.current.innerHTML || document.activeElement !== editorRef.current) {
      if (value !== lastHtml.current) {
        editorRef.current.innerHTML = value;
        lastHtml.current = value;
      }
    }
  }, [value]);

  const exec = useCallback((command: string, arg?: string) => {
    document.execCommand(command, false, arg);
    if (editorRef.current) onChange(editorRef.current.innerHTML);
  }, [onChange]);

  function handleInput() {
    if (!editorRef.current) return;
    lastHtml.current = editorRef.current.innerHTML;
    onChange(editorRef.current.innerHTML);
  }

  function insertLink() {
    const url = window.prompt("Link URL");
    if (url) exec("createLink", url);
  }

  function insertImageFromPath(path: string) {
    if (!editorRef.current) return;
    editorRef.current.focus();
    exec("insertImage", path);
  }

  return (
    <>
    <div className={cn("overflow-hidden rounded-xl border border-border bg-card", className)}>
      <div className="flex flex-wrap items-center gap-1 border-b border-border bg-muted/30 px-2 py-2">
        <ToolbarButton label="Bold" onClick={() => exec("bold")}>
          <Bold className="h-4 w-4" />
        </ToolbarButton>
        <ToolbarButton label="Italic" onClick={() => exec("italic")}>
          <Italic className="h-4 w-4" />
        </ToolbarButton>
        <ToolbarButton label="Underline" onClick={() => exec("underline")}>
          <Underline className="h-4 w-4" />
        </ToolbarButton>
        <span className="mx-1 h-5 w-px bg-border" aria-hidden />
        <ToolbarButton label="Heading 2" onClick={() => exec("formatBlock", "h2")}>
          <Heading2 className="h-4 w-4" />
        </ToolbarButton>
        <ToolbarButton label="Heading 3" onClick={() => exec("formatBlock", "h3")}>
          <Heading3 className="h-4 w-4" />
        </ToolbarButton>
        <ToolbarButton label="Bullet list" onClick={() => exec("insertUnorderedList")}>
          <List className="h-4 w-4" />
        </ToolbarButton>
        <span className="mx-1 h-5 w-px bg-border" aria-hidden />
        <ToolbarButton label="Insert link" onClick={insertLink}>
          <LinkIcon className="h-4 w-4" />
        </ToolbarButton>
        <ToolbarButton label="Insert image" onClick={() => setShowImagePicker(true)}>
          <ImageIcon className="h-4 w-4" />
        </ToolbarButton>
      </div>
      <div
        ref={editorRef}
        contentEditable
        suppressContentEditableWarning
        onInput={handleInput}
        data-placeholder={placeholder}
        className="cms-rich-editor min-h-[20rem] px-4 py-4 text-sm leading-relaxed text-foreground outline-none md:min-h-[28rem] md:px-5 md:py-5"
      />
    </div>
    <MediaLibraryModal
      open={showImagePicker}
      onClose={() => setShowImagePicker(false)}
      onSelect={insertImageFromPath}
      title="Insert image into page"
    />
    </>
  );
}