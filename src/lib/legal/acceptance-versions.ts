export interface LegalVersionPair {
  termsVersion: number;
  privacyVersion: number;
}

export function isLegalAcceptanceCurrent(
  accepted: LegalVersionPair | null | undefined,
  current: LegalVersionPair
): boolean {
  if (!accepted) return false;
  return (
    accepted.termsVersion >= current.termsVersion &&
    accepted.privacyVersion >= current.privacyVersion
  );
}