import { readCmsJson } from "@/lib/cms/store";

export interface TrustChannel {
  name: string;
  href: string;
  description: string;
  category: string;
  internal?: boolean;
}

export interface TrustHighlight {
  label: string;
  value: string;
  href: string;
}

export interface TrustDirectory {
  name: string;
  href: string;
  note: string;
}

export interface TrustSignals {
  headline: string;
  summary: string;
  channels: TrustChannel[];
  directories?: TrustDirectory[];
  highlights: TrustHighlight[];
}

export function getTrustSignals(): TrustSignals {
  return readCmsJson<TrustSignals>("trust-signals.json");
}