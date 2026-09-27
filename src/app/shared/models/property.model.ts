export type ListingType = 'RENT' | 'SALE';
export type ListingStatus = 'DRAFT' | 'PENDING_PAYMENT' | 'PUBLISHED' | 'FLAGGED' | 'REMOVED';

export interface Property {
  id: string;
  businessId: string;
  listingType: ListingType;
  status?: ListingStatus;
  title: string;
  description: string;
  price: number;
  currency: string;
  city: string;
  state: string;
  country: string;
  addressLine: string;
  bedrooms: number | null;
  bathrooms: number | null;
  areaSqft: number | null;
  furnishingStatus: string | null;
  amenities: string[];
  images: string[];
  latitude?: number | null;
  longitude?: number | null;
  createdAt: string;
}

export interface PropertySearchFilters {
  city?: string;
  listingType?: ListingType;
  minPrice?: number;
  maxPrice?: number;
  minBedrooms?: number;
  amenities?: string[];
  page?: number;
  pageSize?: number;
}

export interface PropertySearchResult {
  items: Property[];
  total: number;
}
