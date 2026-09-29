export type BusinessAccountType = "OWNER" | "BROKER" | "BUILDER";
export type BusinessVerificationStatus = "PENDING" | "VERIFIED" | "REJECTED";

export interface BusinessStats {
  activePropertyCount: number;
  saleListingsCount: number;
  rentalListingsCount: number;
  commercialListingsCount: number;
  projectsCount: number;
  activeProjectsCount: number;
}

export interface BusinessProfile {
  id: string;
  accountType: BusinessAccountType;
  displayName: string | null;
  companyName: string;
  profileImage: string | null;
  bio: string | null;
  yearsOfExperience: number | null;
  phone: string | null;
  email: string;
  website: string | null;
  verificationStatus: BusinessVerificationStatus;
  city: string | null;
  servedLocalities: string[];
  createdAt: string;
  updatedAt: string;
  stats: BusinessStats;
}

export interface BusinessPropertySummary {
  id: string;
  title: string;
  listingType: "RENT" | "SALE";
  city: string;
  state: string;
  price: number;
  currency: string;
  images: string[];
}

export type BusinessProfileUpdate = Partial<
  Omit<
    BusinessProfile,
    "id" | "email" | "verificationStatus" | "stats" | "createdAt" | "updatedAt"
  >
>;
