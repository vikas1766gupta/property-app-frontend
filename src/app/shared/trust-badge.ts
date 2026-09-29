import { VerificationStatus } from "./models/property.model";

export function listingVerificationBadge(
  status: VerificationStatus,
): "Verified Listing" | null {
  return status === "VERIFIED" ? "Verified Listing" : null;
}

export function businessVerificationBadge(
  status: VerificationStatus,
  accountType: "OWNER" | "BROKER" | "BUILDER",
): string | null {
  if (status !== "VERIFIED") return null;
  return accountType === "BROKER"
    ? "Verified Broker"
    : accountType === "BUILDER"
      ? "Verified Builder"
      : "Verified Business";
}
