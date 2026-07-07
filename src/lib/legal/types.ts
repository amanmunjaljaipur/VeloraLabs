export type LegalDocType = "terms" | "privacy" | "refund";

export interface LegalSection {
  id: string;
  heading: string;
  content: string;
}

export interface LegalDocument {
  type: LegalDocType;
  title: string;
  version: number;
  lastUpdated: string;
  disclaimer: string;
  sections: LegalSection[];
  updatedBy?: string;
}

export interface LegalCmsData {
  terms: LegalDocument;
  privacy: LegalDocument;
  refund: LegalDocument;
}

export interface LegalAcceptanceRecord {
  email: string;
  termsVersion: number;
  privacyVersion: number;
  acceptedAt: string;
}

export interface PublicLegalDocument {
  type: LegalDocType;
  title: string;
  version: number;
  lastUpdated: string;
  disclaimer: string;
  sections: LegalSection[];
}