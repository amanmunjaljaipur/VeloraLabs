"use client";

import { Card } from "@/components/ui/Card";
import type { SessionDocumentRecord } from "@/lib/session-documents";
import { FileText } from "lucide-react";
import { SessionDocumentEmbed } from "./SessionDocumentEmbed";

interface SessionDocumentsLearnerProps {
  documents: SessionDocumentRecord[];
}

export function SessionDocumentsLearner({ documents }: SessionDocumentsLearnerProps) {
  return (
    <div className="space-y-6">
      <div className="flex items-center gap-2">
        <FileText className="h-5 w-5 text-teal" />
        <h2 className="text-lg font-semibold text-foreground">Training documents</h2>
      </div>
      {documents.map((document) => (
        <Card key={document.id} className="space-y-4 border-teal/15 p-5">
          <div className="flex items-start gap-3">
            <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-teal/10 text-teal">
              <FileText className="h-5 w-5" />
            </div>
            <div>
              <h3 className="text-lg font-semibold text-foreground">{document.title}</h3>
              <p className="mt-1 text-sm text-text-secondary capitalize">{document.type}</p>
              {document.summary && (
                <p className="mt-2 text-sm text-text-secondary leading-relaxed">{document.summary}</p>
              )}
            </div>
          </div>
          <SessionDocumentEmbed
            url={document.learnerUrl}
            title={document.title}
            type={document.type}
            protected
          />
        </Card>
      ))}
    </div>
  );
}